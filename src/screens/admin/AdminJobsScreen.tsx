import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Card } from '../../components/ui/Card';
import { COLORS, SIZES } from '../../constants/colors';
import { jobApi } from '../../services/api';
import { Job } from '../../types';

export const AdminJobsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchJobs = async () => {
        try {
            const res = await jobApi.getAdminJobs();
            if (res && res.jobs) {
                setJobs(res.jobs);
            }
        } catch (e) {
            console.error('Failed to fetch admin jobs', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchJobs();
        setRefreshing(false);
    };

    const handleApprove = async (jobId: string) => {
        try {
            await jobApi.approveJob(jobId);
            Alert.alert('Success', 'Job approved successfully');
            fetchJobs();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to approve job');
        }
    };

    const handleReject = async (jobId: string) => {
        Alert.alert('Confirm', 'Are you sure you want to reject this job?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reject',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await jobApi.rejectJob(jobId);
                        Alert.alert('Success', 'Job rejected successfully');
                        fetchJobs();
                    } catch (e: any) {
                        Alert.alert('Error', e.message || 'Failed to reject job');
                    }
                }
            }
        ]);
    };

    const renderJob = ({ item }: { item: Job }) => {
        return (
            <Card style={styles.jobCard}>
                <View style={styles.jobHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.jobTitle}>{item.title}</Text>
                        <Text style={styles.jobCompany}>{item.company} • {item.location}</Text>
                    </View>
                    <View style={[styles.statusBadge, item.status === 'approved' ? styles.statusApproved : item.status === 'rejected' ? styles.statusRejected : styles.statusPending]}>
                        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                
                {item.status === 'pending' && (
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => handleApprove(item._id)}>
                            <Text style={styles.actionButtonText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleReject(item._id)}>
                            <Text style={styles.actionButtonText}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Jobs</Text>
            </View>
            <FlatList
                data={jobs}
                keyExtractor={(item) => item._id}
                renderItem={renderJob}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ padding: SIZES.md }}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>{loading ? 'Loading...' : 'No jobs found.'}</Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: SIZES.lg, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    title: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground },
    jobCard: { marginBottom: SIZES.md, padding: SIZES.md },
    jobHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SIZES.sm },
    jobTitle: { fontSize: SIZES.fontLg, fontWeight: 'bold', color: COLORS.foreground },
    jobCompany: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
    description: { fontSize: SIZES.fontMd, color: COLORS.foreground, marginTop: SIZES.sm },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    statusPending: { backgroundColor: '#f59e0b' },
    statusApproved: { backgroundColor: '#22c55e' },
    statusRejected: { backgroundColor: '#ef4444' },
    statusText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
    actionsRow: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md },
    actionButton: { flex: 1, padding: SIZES.sm, borderRadius: SIZES.radiusMd, alignItems: 'center' },
    approveButton: { backgroundColor: '#22c55e' },
    rejectButton: { backgroundColor: '#ef4444' },
    actionButtonText: { color: '#fff', fontWeight: 'bold' },
    emptyText: { textAlign: 'center', color: COLORS.muted, marginTop: SIZES.xxl }
});
