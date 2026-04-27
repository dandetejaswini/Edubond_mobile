import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Card } from '../../components/ui/Card';
import { COLORS, SIZES } from '../../constants/colors';
import { jobApi } from '../../services/api';
import { Job } from '../../types';

const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    accepted: '#22c55e',
    rejected: '#ef4444',
};

export const ApplicationTrackerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [applications, setApplications] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const res = await jobApi.getMyApplications();
            if (res?.jobs) setApplications(res.jobs);
        } catch (e) {
            console.error('Failed to load applications', e);
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

    const renderItem = ({ item }: { item: Job }) => {
        const appStatus = (item as any).applicationStatus || 'pending';
        const statusColor = STATUS_COLORS[appStatus] || COLORS.muted;
        const statusLabel = appStatus === 'accepted' ? 'ACCEPTED' : appStatus === 'rejected' ? 'REJECTED' : 'PENDING';
        return (
            <TouchableOpacity onPress={() => navigation.navigate('JobDetail', { job: item, jobId: item._id })}>
                <Card style={styles.card}>
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.jobTitle}>{item.title}</Text>
                        <Text style={styles.company}>{item.company} • {item.location}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {statusLabel}
                        </Text>
                    </View>
                </View>
                <View style={styles.tagsRow}>
                    <Text style={styles.tag}>{item.type}</Text>
                    <Text style={styles.tag}>{item.experienceLevel}</Text>
                </View>
                <Text style={styles.date}>Applied: {new Date((item as any).appliedAt || item.createdAt).toLocaleDateString()}</Text>
            </Card>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Applications</Text>
                <Text style={styles.subtitle}>{applications.length} {applications.length === 1 ? 'application' : 'applications'}</Text>
            </View>
            <FlatList
                data={applications}
                keyExtractor={item => item._id}
                renderItem={renderItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ padding: SIZES.md }}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        {loading ? 'Loading...' : 'No applications yet. Browse jobs to apply!'}
                    </Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: SIZES.lg, paddingTop: SIZES.xxl },
    title: { fontSize: SIZES.fontXxl, fontWeight: 'bold', color: COLORS.foreground },
    subtitle: { fontSize: SIZES.fontMd, color: COLORS.muted, marginTop: 4 },
    card: { marginBottom: SIZES.md, padding: SIZES.md },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: SIZES.sm },
    jobTitle: { fontSize: SIZES.fontLg, fontWeight: 'bold', color: COLORS.foreground },
    company: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
    statusBadge: { borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.sm, paddingVertical: 4 },
    statusText: { fontSize: SIZES.fontSm, fontWeight: 'bold' },
    tagsRow: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.sm },
    tag: { backgroundColor: COLORS.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 11, color: COLORS.foreground, overflow: 'hidden' },
    date: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: SIZES.sm },
    emptyText: { textAlign: 'center', color: COLORS.muted, marginTop: 60 },
});
