import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, RefreshControl, Alert
} from 'react-native';
import { Card } from '../../components/ui/Card';
import { COLORS, SIZES } from '../../constants/colors';
import { jobApi, userApi } from '../../services/api';
import { Job, User } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const JobsListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    // Map of jobId → applicationStatus for this student
    const [myApplications, setMyApplications] = useState<Record<string, string>>({});
    const [studentSkills, setStudentSkills] = useState<string[]>([]);

    const fetchData = async () => {
        try {
            const [jobsRes, profileRes] = await Promise.all([
                jobApi.getJobs(),
                userApi.getProfile()
            ]);
            if (jobsRes?.jobs) {
                setJobs(jobsRes.jobs);
                setFilteredJobs(jobsRes.jobs);
            }
            if (profileRes?.user) {
                const skills = [...(profileRes.user.extractedSkills || []), ...(profileRes.user.skills || [])];
                setStudentSkills(skills.map((s: string) => s.toLowerCase()));
            }
            if (user?.role === 'student') {
                const appsRes = await jobApi.getMyApplications().catch(() => null);
                if (appsRes?.jobs) {
                    const appMap: Record<string, string> = {};
                    appsRes.jobs.forEach((j: Job) => {
                        appMap[j._id] = j.applicationStatus || 'pending';
                    });
                    setMyApplications(appMap);
                }
            }
        } catch (e) {
            console.error('Failed to fetch jobs', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const handleSearch = (text: string) => {
        setSearch(text);
        if (!text.trim()) {
            setFilteredJobs(jobs);
            return;
        }
        const filtered = jobs.filter(j =>
            j.title.toLowerCase().includes(text.toLowerCase()) ||
            j.company.toLowerCase().includes(text.toLowerCase()) ||
            j.type.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredJobs(filtered);
    };

    const getMatchScore = (job: Job): number => {
        if (studentSkills.length === 0) return 0;
        const reqs = (job.requirements || []).map(r => r.toLowerCase());
        const jobText = `${job.title} ${job.description}`.toLowerCase();
        let matches = 0;
        studentSkills.forEach(skill => {
            if (reqs.some(r => r.includes(skill) || skill.includes(r)) || jobText.includes(skill)) {
                matches++;
            }
        });
        return Math.min(100, Math.round((matches / Math.max(studentSkills.length, 1)) * 100));
    };

    const handleApply = async (job: Job) => {
        try {
            const alumniName = typeof job.postedBy === 'object' && job.postedBy !== null
                ? (job.postedBy as any).name || 'the alumni'
                : 'the alumni';
            await jobApi.applyJob(job._id);
            setMyApplications(prev => ({ ...prev, [job._id]: 'pending' }));
            Alert.alert(
                'Application Sent! ✅',
                `Your resume & profile have been sent to ${alumniName}. They will review and may reach out via chat.`
            );
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to apply');
        }
    };

    const getAppStatusLabel = (status: string) => {
        switch (status) {
            case 'accepted': return '✓ Accepted';
            case 'rejected': return '✗ Not Selected';
            default: return 'Pending Review';
        }
    };
    const getAppStatusColor = (status: string) => {
        if (status === 'accepted') return '#22c55e';
        if (status === 'rejected') return '#ef4444';
        return '#f59e0b';
    };

    const renderJob = ({ item }: { item: Job }) => {
        const matchScore = getMatchScore(item);
        const appStatus = myApplications[item._id];
        const hasApplied = !!appStatus;

        return (
            <Card style={styles.jobCard}>
                <TouchableOpacity onPress={() => navigation.navigate('JobDetail', { job: item })}>
                    <View style={styles.jobHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.jobTitle}>{item.title}</Text>
                            <Text style={styles.jobCompany}>{item.company} • {item.location}</Text>
                        </View>
                        {user?.role === 'student' && matchScore > 0 && (
                            <View style={[styles.matchBadge, { backgroundColor: matchScore >= 50 ? COLORS.primary : '#f59e0b' }]}>
                                <Text style={styles.matchText}>{matchScore}%</Text>
                                <Text style={styles.matchLabel}>match</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.tagsRow}>
                        <Text style={styles.tag}>{item.type}</Text>
                        <Text style={styles.tag}>{item.experienceLevel}</Text>
                    </View>
                    {item.requirements?.length > 0 && (
                        <Text style={styles.requirements} numberOfLines={2}>
                            🔑 {item.requirements.slice(0, 3).join(' • ')}
                        </Text>
                    )}
                    {typeof item.postedBy === 'object' && item.postedBy !== null && (
                        <Text style={styles.postedBy}>
                            👤 Posted by {(item.postedBy as any).name || 'Alumni'}
                            {(item.postedBy as any).company ? ` • ${(item.postedBy as any).company}` : ''}
                        </Text>
                    )}
                </TouchableOpacity>
                {user?.role === 'student' && (
                    hasApplied ? (
                        <View style={[styles.applyButton, { backgroundColor: getAppStatusColor(appStatus) }]}>
                            <Text style={styles.applyButtonText}>{getAppStatusLabel(appStatus)}</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.applyButton} onPress={() => handleApply(item)}>
                            <Text style={styles.applyButtonText}>Apply Now</Text>
                        </TouchableOpacity>
                    )
                )}
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search jobs..."
                    placeholderTextColor={COLORS.muted}
                    value={search}
                    onChangeText={handleSearch}
                />
            </View>
            <FlatList
                data={filteredJobs}
                keyExtractor={item => item._id}
                renderItem={renderJob}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ padding: SIZES.md }}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        {loading ? 'Loading jobs...' : 'No jobs found.'}
                    </Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    searchContainer: { padding: SIZES.md, paddingBottom: 0 },
    searchInput: {
        backgroundColor: COLORS.card,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        color: COLORS.foreground,
        borderWidth: 1,
        borderColor: COLORS.border,
        fontSize: SIZES.fontMd,
    },
    jobCard: { marginBottom: SIZES.md, padding: SIZES.md },
    jobHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SIZES.sm },
    jobTitle: { fontSize: SIZES.fontLg, fontWeight: 'bold', color: COLORS.foreground },
    jobCompany: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
    matchBadge: { borderRadius: SIZES.radiusMd, padding: SIZES.sm, alignItems: 'center', minWidth: 52 },
    matchText: { fontSize: SIZES.fontMd, fontWeight: 'bold', color: '#fff' },
    matchLabel: { fontSize: 10, color: '#ffffffcc' },
    tagsRow: { flexDirection: 'row', gap: SIZES.sm, marginBottom: SIZES.sm },
    tag: { backgroundColor: COLORS.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 12, color: COLORS.foreground, overflow: 'hidden' },
    requirements: { fontSize: SIZES.fontSm, color: COLORS.muted, marginBottom: SIZES.sm },
    applyButton: { backgroundColor: COLORS.primary, borderRadius: SIZES.radiusMd, padding: SIZES.md, alignItems: 'center', marginTop: SIZES.sm },
    appliedButton: { backgroundColor: '#22c55e' },
    applyButtonText: { color: '#fff', fontWeight: 'bold', fontSize: SIZES.fontMd },
    postedBy: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2, marginBottom: SIZES.sm },
    emptyText: { textAlign: 'center', color: COLORS.muted, marginTop: SIZES.xxl },
});
