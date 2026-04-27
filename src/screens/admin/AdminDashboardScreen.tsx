import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { adminApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { COLORS, SIZES } from '../../constants/colors';
import { User } from '../../types';

type Tab = 'overview' | 'verification' | 'users';
type RoleFilter = 'all' | 'student' | 'alumni' | 'mentor';

export const AdminDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [stats, setStats] = useState<any>(null);
    const [pendingAlumni, setPendingAlumni] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [tab, setTab] = useState<Tab>('overview');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, verifyRes, usersRes]: any[] = await Promise.all([
                adminApi.getStats(),
                adminApi.getAlumniVerificationQueue(),
                adminApi.getAllUsers(),
            ]);
            setStats(statsRes.stats || statsRes.data || statsRes);
            setPendingAlumni(verifyRes.pendingAlumni || []);
            setAllUsers(usersRes.users || []);
        } catch (e) {
            console.error('Failed to fetch admin data', e);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchData().finally(() => setLoading(false));
    }, [fetchData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const handleApprove = async (userId: string, userName: string) => {
        setActionLoading(userId);
        try {
            await adminApi.approveUser(userId);
            setPendingAlumni(prev => prev.filter(u => u._id !== userId));
            setAllUsers(prev => prev.map(u => u._id === userId ? { ...u, status: 'approved' as const } : u));
            setStats((s: any) => s ? { ...s, pendingUsers: (s.pendingUsers || 1) - 1 } : s);
            Alert.alert('Approved', `${userName}'s account has been approved.`);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to approve');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (userId: string, userName: string) => {
        Alert.alert('Reject Account', `Reject ${userName}'s registration?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reject', style: 'destructive',
                onPress: async () => {
                    setActionLoading(userId);
                    try {
                        await adminApi.rejectUser(userId);
                        setPendingAlumni(prev => prev.filter(u => u._id !== userId));
                        setAllUsers(prev => prev.map(u => u._id === userId ? { ...u, status: 'rejected' as const } : u));
                        setStats((s: any) => s ? { ...s, pendingUsers: (s.pendingUsers || 1) - 1 } : s);
                    } catch (e: any) {
                        Alert.alert('Error', e.message);
                    } finally {
                        setActionLoading(null);
                    }
                }
            }
        ]);
    };

    const STAT_CARDS = [
        { label: 'Total Alumni', value: stats?.totalAlumni ?? 0, color: '#6366f1' },
        { label: 'Total Students', value: stats?.totalStudents ?? 0, color: '#22c55e' },
        { label: 'Mentors', value: stats?.totalMentors ?? 0, color: '#f59e0b' },
        { label: 'Active Users', value: stats?.activeUsers ?? 0, color: '#06b6d4' },
        { label: 'Jobs Posted', value: stats?.totalJobs ?? 0, color: '#ec4899' },
        { label: 'Upcoming Meetings', value: stats?.upcomingMeetings ?? 0, color: '#8b5cf6' },
        { label: 'Sessions', value: stats?.totalSessions ?? 0, color: '#14b8a6' },
        { label: 'Pending Approvals', value: stats?.pendingUsers ?? 0, color: '#ef4444' },
    ];

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Tab Bar */}
            <View style={styles.tabBar}>
                {(['overview', 'verification', 'users'] as Tab[]).map(t => (
                    <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]}
                        onPress={() => setTab(t)}>
                        <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                            {t === 'overview' ? 'Overview' : t === 'verification' ? `Verify (${pendingAlumni.length})` : 'Users'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.content}>

                {tab === 'overview' && (
                    <>
                        <Text style={styles.sectionTitle}>Activity Dashboard</Text>
                        <View style={styles.statsGrid}>
                            {STAT_CARDS.map(card => (
                                <View key={card.label} style={[styles.statCard, { borderLeftColor: card.color }]}>
                                    <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
                                    <Text style={styles.statLabel}>{card.label}</Text>
                                </View>
                            ))}
                        </View>

                        <Text style={[styles.sectionTitle, { marginTop: SIZES.xl }]}>Quick Actions</Text>
                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.actionCard}
                                onPress={() => navigation.navigate('MeetingManagement')}>
                                <Text style={styles.actionIcon}>📅</Text>
                                <Text style={styles.actionLabel}>Meetings</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionCard}
                                onPress={() => setTab('verification')}>
                                <Text style={styles.actionIcon}>✅</Text>
                                <Text style={styles.actionLabel}>Verify Alumni</Text>
                                {pendingAlumni.length > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{pendingAlumni.length}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionCard}
                                onPress={() => navigation.navigate('AdminJobs')}>
                                <Text style={styles.actionIcon}>💼</Text>
                                <Text style={styles.actionLabel}>Manage Jobs</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionCard}
                                onPress={() => setTab('users')}>
                                <Text style={styles.actionIcon}>👥</Text>
                                <Text style={styles.actionLabel}>Manage Users</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {tab === 'verification' && (
                    <>
                        <Text style={styles.sectionTitle}>Alumni Verification Queue</Text>
                        {pendingAlumni.length === 0 ? (
                            <View style={styles.empty}>
                                <Text style={styles.emptyIcon}>✅</Text>
                                <Text style={styles.emptyTitle}>All clear!</Text>
                                <Text style={styles.emptyText}>No pending alumni registrations</Text>
                            </View>
                        ) : (
                            pendingAlumni.map(alumni => (
                                <View key={alumni._id} style={styles.verifyCard}>
                                    <View style={styles.verifyInfo}>
                                        <Text style={styles.verifyName}>{alumni.name}</Text>
                                        <Text style={styles.verifyDetail}>{alumni.email}</Text>
                                        <Text style={styles.verifyDetail}>
                                            {alumni.institution}
                                            {alumni.batch ? ` · Batch ${alumni.batch}` : ''}
                                            {alumni.company ? ` · ${alumni.company}` : ''}
                                        </Text>
                                        {alumni.rollNumber ? (
                                            <Text style={styles.verifyDetail}>Roll: {alumni.rollNumber}</Text>
                                        ) : null}
                                        <Text style={[styles.verifyBadge, { color: '#f59e0b' }]}>Pending Approval</Text>
                                    </View>
                                    <View style={styles.verifyActions}>
                                        <TouchableOpacity
                                            style={[styles.approveBtn, actionLoading === alumni._id && { opacity: 0.6 }]}
                                            onPress={() => handleApprove(alumni._id, alumni.name)}
                                            disabled={!!actionLoading}>
                                            <Text style={styles.approveBtnText}>Approve</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.rejectBtn, actionLoading === alumni._id && { opacity: 0.6 }]}
                                            onPress={() => handleReject(alumni._id, alumni.name)}
                                            disabled={!!actionLoading}>
                                            <Text style={styles.rejectBtnText}>Reject</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </>
                )}

                {tab === 'users' && (
                    <>
                        <Text style={styles.sectionTitle}>All Users ({allUsers.length})</Text>
                        <View style={styles.roleFilterRow}>
                            {(['all', 'student', 'alumni', 'mentor'] as RoleFilter[]).map(r => (
                                <TouchableOpacity key={r}
                                    style={[styles.filterChip, roleFilter === r && styles.filterChipActive]}
                                    onPress={() => setRoleFilter(r)}>
                                    <Text style={[styles.filterChipText, roleFilter === r && styles.filterChipTextActive]}>
                                        {r.charAt(0).toUpperCase() + r.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {allUsers
                            .filter(u => roleFilter === 'all' || u.role === roleFilter)
                            .map(u => (
                                <View key={u._id} style={styles.verifyCard}>
                                    <View style={styles.verifyInfo}>
                                        <Text style={styles.verifyName}>{u.name}</Text>
                                        <Text style={styles.verifyDetail}>{u.email}</Text>
                                        <Text style={styles.verifyDetail}>
                                            {u.role?.toUpperCase()} • {u.institution}
                                            {u.company ? ` • ${u.company}` : ''}
                                        </Text>
                                        <Text style={[styles.verifyBadge, {
                                            color: u.status === 'approved' ? '#22c55e' : u.status === 'rejected' ? '#ef4444' : '#f59e0b'
                                        }]}>
                                            {u.status?.toUpperCase() || 'APPROVED'}
                                        </Text>
                                    </View>
                                    {u.status === 'pending' && (
                                        <View style={styles.verifyActions}>
                                            <TouchableOpacity
                                                style={[styles.approveBtn, actionLoading === u._id && { opacity: 0.6 }]}
                                                onPress={() => handleApprove(u._id, u.name)}
                                                disabled={!!actionLoading}>
                                                <Text style={styles.approveBtnText}>Approve</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.rejectBtn, actionLoading === u._id && { opacity: 0.6 }]}
                                                onPress={() => handleReject(u._id, u.name)}
                                                disabled={!!actionLoading}>
                                                <Text style={styles.rejectBtnText}>Reject</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            ))
                        }
                        {allUsers.filter(u => roleFilter === 'all' || u.role === roleFilter).length === 0 && (
                            <View style={styles.empty}>
                                <Text style={styles.emptyText}>No {roleFilter === 'all' ? '' : roleFilter} users found</Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    tabBar: {
        flexDirection: 'row', backgroundColor: COLORS.card,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    tab: { flex: 1, paddingVertical: SIZES.md, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
    tabText: { fontSize: SIZES.fontSm, color: COLORS.muted, fontWeight: '500' },
    tabTextActive: { color: COLORS.primary, fontWeight: '700' },
    content: { padding: SIZES.lg, paddingBottom: SIZES.xxl },
    sectionTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground, marginBottom: SIZES.md },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
    statCard: {
        width: '47%', backgroundColor: COLORS.card, borderRadius: SIZES.radiusMd,
        padding: SIZES.md, borderLeftWidth: 4,
    },
    statValue: { fontSize: SIZES.fontXxl, fontWeight: 'bold' },
    statLabel: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: SIZES.xs },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.md },
    actionCard: {
        width: '47%', backgroundColor: COLORS.card, borderRadius: SIZES.radiusMd,
        padding: SIZES.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
        position: 'relative',
    },
    actionIcon: { fontSize: 32, marginBottom: SIZES.sm },
    actionLabel: { fontSize: SIZES.fontSm, color: COLORS.foreground, fontWeight: '600' },
    badge: {
        position: 'absolute', top: -6, right: -6,
        backgroundColor: '#ef4444', borderRadius: 10,
        minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    // Verification
    verifyCard: {
        flexDirection: 'row', backgroundColor: COLORS.card,
        borderRadius: SIZES.radiusMd, padding: SIZES.md,
        marginBottom: SIZES.md, borderWidth: 1, borderColor: COLORS.border,
    },
    verifyInfo: { flex: 1 },
    verifyName: { fontSize: SIZES.fontMd, fontWeight: '700', color: COLORS.foreground },
    verifyDetail: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
    verifyBadge: { fontSize: SIZES.fontSm, fontWeight: '600', marginTop: SIZES.xs },
    verifyActions: { justifyContent: 'center', gap: SIZES.sm },
    approveBtn: { backgroundColor: '#22c55e', borderRadius: SIZES.radiusSm, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm },
    approveBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.fontSm },
    rejectBtn: { backgroundColor: '#ef444420', borderRadius: SIZES.radiusSm, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderWidth: 1, borderColor: '#ef4444' },
    rejectBtnText: { color: '#ef4444', fontWeight: '700', fontSize: SIZES.fontSm },
    empty: { padding: SIZES.xl, alignItems: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: SIZES.md },
    emptyTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground },
    emptyText: { fontSize: SIZES.fontMd, color: COLORS.muted },
    roleFilterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm, marginBottom: SIZES.md },
    filterChip: { borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
    filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterChipText: { fontSize: SIZES.fontSm, color: COLORS.muted, fontWeight: '500' },
    filterChipTextActive: { color: '#fff', fontWeight: '700' },
});
