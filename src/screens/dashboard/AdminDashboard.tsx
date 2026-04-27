import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Card } from '../../components/ui/Card';
import { COLORS, SIZES } from '../../constants/colors';
import { adminApi } from '../../services/api';

export const AdminDashboard: React.FC<{ user: any, navigation: any }> = ({ user, navigation }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<any>({});

    const fetchData = async () => {
        try {
            const res = await adminApi.getStats();
            if (res && res.stats) setStats(res.stats);
        } catch (e) {
            console.error('Failed to fetch admin stats', e);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const quickActions = [
        { title: 'Manage Users', icon: '👥', onPress: () => navigation.navigate('Main', { screen: 'AdminDashboard' }) },
        { title: 'Pending Jobs', icon: '💼', onPress: () => navigation.navigate('AdminJobs') },
        { title: 'Platform Activity', icon: '📈', onPress: () => navigation.navigate('Main', { screen: 'AdminDashboard' }) },
    ];

    return (
        <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Admin Control Center</Text>
                <Text style={styles.name}>{user?.name}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Platform Overview</Text>
                <View style={styles.statsContainer}>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.totalUsers || 0}</Text>
                        <Text style={styles.statLabel}>Total Users</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.totalJobs || 0}</Text>
                        <Text style={styles.statLabel}>Total Jobs</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.pendingJobs || 0}</Text>
                        <Text style={styles.statLabel}>Pending Jobs</Text>
                    </Card>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Access</Text>
                <View style={styles.quickActionsGrid}>
                    {quickActions.map((action, index) => (
                        <TouchableOpacity key={index} style={styles.actionCard} onPress={action.onPress}>
                            <Text style={styles.actionIcon}>{action.icon}</Text>
                            <Text style={styles.actionTitle}>{action.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {stats.pendingJobs > 0 && (
                <View style={styles.section}>
                    <Card style={styles.alertCard}>
                        <Text style={styles.alertText}>⚠️ You have {stats.pendingJobs} Job Postings waiting for approval.</Text>
                    </Card>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: SIZES.lg, paddingTop: SIZES.xxl },
    greeting: { fontSize: SIZES.fontMd, color: COLORS.primary, fontWeight: 'bold' },
    name: { fontSize: SIZES.fontXxl, fontWeight: 'bold', color: COLORS.foreground, marginTop: 4 },
    section: { padding: SIZES.lg },
    sectionTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground, marginBottom: SIZES.md },
    statsContainer: { flexDirection: 'row', gap: SIZES.md },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: SIZES.lg },
    statValue: { fontSize: SIZES.fontLg, fontWeight: 'bold', color: COLORS.primary },
    statLabel: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: SIZES.xs },
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.md },
    actionCard: { width: '47%', backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: SIZES.lg, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
    actionIcon: { fontSize: 32, marginBottom: SIZES.sm },
    actionTitle: { fontSize: SIZES.fontMd, color: COLORS.foreground, fontWeight: '600' },
    alertCard: { backgroundColor: '#ffe5e5', borderColor: '#ff4444', borderWidth: 1, padding: SIZES.lg },
    alertText: { color: '#cc0000', fontWeight: 'bold' }
});
