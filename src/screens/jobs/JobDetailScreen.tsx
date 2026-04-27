import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Linking } from 'react-native';
import { jobApi, API_URL } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { COLORS, SIZES } from '../../constants/colors';
import { Job, User } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const JobDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
    const { user } = useAuth();
    const jobFromRoute: Job | undefined = route.params?.job;
    const jobId: string = route.params?.jobId || jobFromRoute?._id;

    const [job, setJob] = useState<Job | null>(jobFromRoute || null);
    const [loading, setLoading] = useState(!jobFromRoute);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchJob = async () => {
        if (!jobId) return;
        try {
            const res: any = await jobApi.getJobById(jobId);
            if (res?.job) {
                setJob(res.job);
            }
        } catch (e) {
            console.error('Failed to fetch job', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchJob();
    }, [jobId]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchJob();
    };

    const handleAccept = async (studentId: string, studentName: string) => {
        if (!job) return;
        setActionLoading(studentId);
        try {
            await jobApi.acceptApplicant(job._id, studentId);
            Alert.alert('Accepted! 🎉', `${studentName} has been accepted. A chat has been opened.`);
            fetchJob();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to accept');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (studentId: string, studentName: string) => {
        if (!job) return;
        Alert.alert('Reject', `Reject ${studentName}'s application?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reject', style: 'destructive',
                onPress: async () => {
                    setActionLoading(studentId);
                    try {
                        await jobApi.rejectApplicant(job._id, studentId);
                        Alert.alert('Done', `${studentName} has been notified.`);
                        fetchJob();
                    } catch (e: any) {
                        Alert.alert('Error', e.message || 'Failed to reject');
                    } finally {
                        setActionLoading(null);
                    }
                }
            }
        ]);
    };

    if (loading) return <LoadingSpinner />;
    if (!job) return (
        <View style={styles.center}>
            <Text style={styles.errorText}>Job not found</Text>
        </View>
    );

    const isAlumni = user?.role === 'alumni';
    const isJobPoster = isAlumni && (job as any).postedBy?._id === user?._id;
    const applicants = (job.applicants || []) as User[];

    const getApplicantStatus = (studentId: string): string => {
        const details = (job as any).applicationDetails?.find(
            (d: any) => d.user?.toString() === studentId || d.user === studentId
        );
        return details?.status || 'pending';
    };

    return (
        <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            <View style={styles.header}>
                <Text style={styles.title}>{job.title}</Text>
                <Text style={styles.company}>{job.company} • {job.location}</Text>
                <View style={styles.tagsRow}>
                    <Text style={styles.tag}>{job.type}</Text>
                    <Text style={styles.tag}>{job.experienceLevel}</Text>
                    {job.domain ? <Text style={styles.tag}>{job.domain}</Text> : null}
                </View>
                {user?.role !== 'student' && (
                    <View style={[styles.statusBadge, {
                        backgroundColor: job.status === 'approved' ? '#22c55e20' : job.status === 'rejected' ? '#ef444420' : '#f59e0b20'
                    }]}>
                        <Text style={[styles.statusText, {
                            color: job.status === 'approved' ? '#22c55e' : job.status === 'rejected' ? '#ef4444' : '#f59e0b'
                        }]}>{job.status ? job.status.toUpperCase() : 'PENDING'}</Text>
                    </View>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.body}>{job.description}</Text>
            </View>

            {job.requirements?.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Requirements</Text>
                    {job.requirements.map((req, i) => (
                        <Text key={i} style={styles.listItem}>• {req}</Text>
                    ))}
                </View>
            )}

            {job.skillsRequired?.length ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Skills Required</Text>
                    <View style={styles.skillsRow}>
                        {job.skillsRequired.map((s, i) => (
                            <Text key={i} style={styles.skill}>{s}</Text>
                        ))}
                    </View>
                </View>
            ) : null}

            {/* Applicants — visible to the alumni who posted */}
            {isJobPoster && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Applicants ({applicants.length})</Text>
                    {applicants.length === 0 ? (
                        <Text style={styles.emptyText}>No applications yet</Text>
                    ) : (
                        applicants.filter(a => a).map((applicant: any) => {
                            const appStatus = getApplicantStatus(applicant._id);
                            return (
                                <Card key={applicant._id} style={styles.applicantCard}>
                                    <Text style={styles.applicantName}>{applicant.name}</Text>
                                    <Text style={styles.applicantDetail}>{applicant.email}</Text>
                                    {applicant.institution ? <Text style={styles.applicantDetail}>🏫 {applicant.institution}</Text> : null}
                                    {applicant.extractedSkills?.length ? (
                                        <Text style={styles.applicantDetail} numberOfLines={2}>
                                            🔑 {applicant.extractedSkills.slice(0, 5).join(', ')}
                                        </Text>
                                    ) : null}
                                    {applicant.resumeUrl && applicant.resumeUrl !== 'resume_uploaded' ? (
                                        <TouchableOpacity onPress={() => {
                                            const url = applicant.resumeUrl;
                                            const fullUrl = url.startsWith('http') ? url : `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
                                            Linking.openURL(fullUrl).catch(() =>
                                                Alert.alert('Error', 'Unable to open resume. The file may not be accessible from this device.')
                                            );
                                        }}>
                                            <Text style={styles.resumeLink}>📄 View Resume</Text>
                                        </TouchableOpacity>
                                    ) : applicant.resumeUrl === 'resume_uploaded' ? (
                                        <Text style={styles.resumeUploaded}>📄 Resume uploaded (contact applicant)</Text>
                                    ) : null}
                                    {appStatus === 'pending' ? (
                                        <View style={styles.actionRow}>
                                            <TouchableOpacity
                                                style={[styles.acceptBtn, actionLoading === applicant._id && { opacity: 0.6 }]}
                                                onPress={() => handleAccept(applicant._id, applicant.name)}
                                                disabled={!!actionLoading}>
                                                <Text style={styles.actionBtnText}>✅ Accept</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.rejectBtn, actionLoading === applicant._id && { opacity: 0.6 }]}
                                                onPress={() => handleReject(applicant._id, applicant.name)}
                                                disabled={!!actionLoading}>
                                                <Text style={styles.actionBtnText}>❌ Reject</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={[styles.decisionBadge, {
                                            backgroundColor: appStatus === 'accepted' ? '#22c55e20' : '#ef444420'
                                        }]}>
                                            <Text style={[styles.decisionText, {
                                                color: appStatus === 'accepted' ? '#22c55e' : '#ef4444'
                                            }]}>
                                                {appStatus === 'accepted' ? '✅ ACCEPTED' : '❌ REJECTED'}
                                            </Text>
                                        </View>
                                    )}
                                </Card>
                            );
                        })
                    )}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    errorText: { color: COLORS.muted, fontSize: SIZES.fontLg },
    header: { padding: SIZES.lg, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    title: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground },
    company: { fontSize: SIZES.fontMd, color: COLORS.muted, marginTop: 4 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm, marginTop: SIZES.sm },
    tag: { backgroundColor: COLORS.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, fontSize: 12, color: COLORS.foreground, overflow: 'hidden' },
    statusBadge: { alignSelf: 'flex-start', borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.sm, paddingVertical: 4, marginTop: SIZES.sm },
    statusText: { fontSize: SIZES.fontSm, fontWeight: 'bold' },
    section: { padding: SIZES.lg },
    sectionTitle: { fontSize: SIZES.fontLg, fontWeight: 'bold', color: COLORS.foreground, marginBottom: SIZES.sm },
    body: { fontSize: SIZES.fontMd, color: COLORS.muted, lineHeight: 22 },
    listItem: { fontSize: SIZES.fontMd, color: COLORS.muted, marginBottom: 4, lineHeight: 22 },
    skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
    skill: { backgroundColor: COLORS.primary + '20', color: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusMd, fontSize: 12, overflow: 'hidden' },
    emptyText: { color: COLORS.muted, textAlign: 'center', padding: SIZES.xl },
    applicantCard: { marginBottom: SIZES.md, padding: SIZES.md },
    applicantName: { fontSize: SIZES.fontMd, fontWeight: 'bold', color: COLORS.foreground },
    applicantDetail: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
    resumeLink: { color: COLORS.primary, fontSize: SIZES.fontSm, marginTop: 4, fontWeight: '600' },
    resumeUploaded: { color: '#22c55e', fontSize: SIZES.fontSm, marginTop: 4 },
    actionRow: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.sm },
    acceptBtn: { flex: 1, backgroundColor: '#22c55e', borderRadius: SIZES.radiusMd, padding: SIZES.sm, alignItems: 'center' },
    rejectBtn: { flex: 1, backgroundColor: '#ef4444', borderRadius: SIZES.radiusMd, padding: SIZES.sm, alignItems: 'center' },
    actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: SIZES.fontSm },
    decisionBadge: { marginTop: SIZES.sm, borderRadius: SIZES.radiusMd, padding: SIZES.sm, alignItems: 'center' },
    decisionText: { fontWeight: 'bold', fontSize: SIZES.fontSm },
});
