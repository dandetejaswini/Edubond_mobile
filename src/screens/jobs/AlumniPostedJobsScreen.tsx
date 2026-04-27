import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { jobApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { COLORS, SIZES } from '../../constants/colors';
import { Job } from '../../types';

export const AlumniPostedJobsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchJobs = async () => {
        try {
            const res: any = await jobApi.getAlumniPostedJobs();
            if (res?.jobs) setJobs(res.jobs);
        } catch (e) {
            console.error('Failed to fetch posted jobs', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchJobs(); }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchJobs();
    };

    const renderJob = ({ item }: { item: Job }) => {
        const applicantCount = Array.isArray(item.applicants) ? item.applicants.length : 0;
        const statusColor = item.status === 'approved' ? '#22c55e' : item.status === 'rejected' ? '#ef4444' : '#f59e0b';

        return (
            <TouchableOpacity onPress={() => navigation.navigate('JobDetail', { job: item, jobId: item._id })}>
                <Card style={styles.card}>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.jobTitle}>{item.title}</Text>
                            <Text style={styles.jobCompany}>{item.company} • {item.location}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                            <Text style={[styles.statusText, { color: statusColor }]}>{item.status?.toUpperCase()}</Text>
                        </View>
                    </View>
                    <View style={styles.tagsRow}>
                        <Text style={styles.tag}>{item.type}</Text>
                        <Text style={styles.tag}>{item.experienceLevel}</Text>
                    </View>
                    <View style={styles.applicantsRow}>
                        <Text style={styles.applicantsText}>
                            👥 {applicantCount} {applicantCount === 1 ? 'applicant' : 'applicants'}
                        </Text>
                        <Text style={styles.viewText}>View Details →</Text>
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    if (loading) return <LoadingSpinner />;

    return (
        <View style={styles.container}>
            <FlatList
                data={jobs}
                keyExtractor={item => item._id}
                renderItem={renderJob}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.title}>My Posted Jobs</Text>
                        <Text style={styles.subtitle}>{jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} posted</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>💼</Text>
                        <Text style={styles.emptyTitle}>No jobs posted yet</Text>
                        <Text style={styles.emptyText}>Post a job to help students find opportunities</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    list: { padding: SIZES.md, paddingBottom: SIZES.xxl },
    header: { marginBottom: SIZES.md },
    title: { fontSize: SIZES.fontXxl, fontWeight: 'bold', color: COLORS.foreground },
    subtitle: { fontSize: SIZES.fontMd, color: COLORS.muted, marginTop: 4 },
    card: { marginBottom: SIZES.md, padding: SIZES.md },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: SIZES.sm },
    jobTitle: { fontSize: SIZES.fontLg, fontWeight: 'bold', color: COLORS.foreground },
    jobCompany: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
    statusBadge: { borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.sm, paddingVertical: 4 },
    statusText: { fontSize: SIZES.fontSm, fontWeight: 'bold' },
    tagsRow: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.sm },
    tag: { backgroundColor: COLORS.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 12, color: COLORS.foreground, overflow: 'hidden' },
    applicantsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SIZES.sm },
    applicantsText: { fontSize: SIZES.fontSm, color: COLORS.primary, fontWeight: '600' },
    viewText: { fontSize: SIZES.fontSm, color: COLORS.muted },
    empty: { padding: SIZES.xxl, alignItems: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: SIZES.md },
    emptyTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground },
    emptyText: { fontSize: SIZES.fontMd, color: COLORS.muted, textAlign: 'center', marginTop: SIZES.sm },
});
