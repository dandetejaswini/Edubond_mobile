import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card } from '../../components/ui/Card';
import { COLORS, SIZES } from '../../constants/colors';
import { userApi, sessionApi, referralApi, jobApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface ContribStats {
    referralsGiven: number;
    referralsPending: number;
    jobsPosted: number;
    sessionsTotal: number;
    sessionsCompleted: number;
    engagementScore: number;
    company: string;
    domain: string;
}

interface SessionHistory {
    _id: string;
    title: string;
    mentee: { name: string; institution: string };
    date: string;
    duration: number;
    status: string;
}

interface SessionAnalytics {
    total: number;
    completed: number;
    upcoming: number;
    cancelled: number;
    totalMinutes: number;
}

export const AlumniContributionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState<ContribStats | null>(null);
    const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>([]);
    const [sessionAnalytics, setSessionAnalytics] = useState<SessionAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [statsRes, sessionRes] = await Promise.all([
                userApi.getContributionStats(),
                sessionApi.getAlumniHistory()
            ]);
            if (statsRes?.stats) setStats(statsRes.stats);
            if (sessionRes?.sessions) setSessionHistory(sessionRes.sessions);
            if (sessionRes?.analytics) setSessionAnalytics(sessionRes.analytics);
        } catch (e) {
            console.error('Failed to load contribution data', e);
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

    const getEngagementColor = (score: number) => {
        if (score >= 60) return '#22c55e';
        if (score >= 30) return '#f59e0b';
        return '#ef4444';
    };

    const getEngagementLabel = (score: number) => {
        if (score >= 60) return 'High Impact ⭐';
        if (score >= 30) return 'Active Contributor 👍';
        return 'Getting Started 🌱';
    };

    const getStatusDot = (status: string) => {
        const colors: Record<string, string> = { completed: '#22c55e', accepted: '#3b82f6', pending: '#f59e0b', cancelled: '#ef4444', declined: '#ef4444' };
        return colors[status] || COLORS.muted;
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <Text style={styles.title}>My Contributions</Text>
            <Text style={styles.subtitle}>{user?.company || 'Alumni'} Impact Dashboard</Text>

            {/* Engagement Score */}
            {stats && (
                <Card style={styles.scoreCard}>
                    <View style={styles.scoreRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.scoreLabel}>Engagement Score</Text>
                            <Text style={[styles.engagementLabel, { color: getEngagementColor(stats.engagementScore) }]}>
                                {getEngagementLabel(stats.engagementScore)}
                            </Text>
                        </View>
                        <View style={[styles.scoreCircle, { borderColor: getEngagementColor(stats.engagementScore) }]}>
                            <Text style={[styles.scoreNumber, { color: getEngagementColor(stats.engagementScore) }]}>
                                {stats.engagementScore}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, {
                            width: `${Math.min(stats.engagementScore, 100)}%` as any,
                            backgroundColor: getEngagementColor(stats.engagementScore)
                        }]} />
                    </View>
                    <Text style={styles.scoreHint}>Score based on referrals × 15 + jobs × 10 + sessions × 5</Text>
                </Card>
            )}

            {/* Stats Grid */}
            {stats && (
                <View style={styles.statsGrid}>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.referralsGiven}</Text>
                        <Text style={styles.statLabel}>Referrals Given</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.referralsPending}</Text>
                        <Text style={styles.statLabel}>Pending Requests</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.jobsPosted}</Text>
                        <Text style={styles.statLabel}>Jobs Posted</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.sessionsCompleted}</Text>
                        <Text style={styles.statLabel}>Sessions Done</Text>
                    </Card>
                </View>
            )}

            {/* Session Analytics */}
            {sessionAnalytics && (
                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>🎓 Session Analytics</Text>
                    <View style={styles.analyticsRow}>
                        <View style={styles.analyticsItem}>
                            <Text style={styles.analyticsValue}>{sessionAnalytics.total}</Text>
                            <Text style={styles.analyticsLabel}>Total</Text>
                        </View>
                        <View style={styles.analyticsItem}>
                            <Text style={[styles.analyticsValue, { color: '#22c55e' }]}>{sessionAnalytics.completed}</Text>
                            <Text style={styles.analyticsLabel}>Completed</Text>
                        </View>
                        <View style={styles.analyticsItem}>
                            <Text style={[styles.analyticsValue, { color: '#3b82f6' }]}>{sessionAnalytics.upcoming}</Text>
                            <Text style={styles.analyticsLabel}>Upcoming</Text>
                        </View>
                        <View style={styles.analyticsItem}>
                            <Text style={[styles.analyticsValue, { color: '#6b7280' }]}>{Math.round(sessionAnalytics.totalMinutes / 60)}h</Text>
                            <Text style={styles.analyticsLabel}>Hours</Text>
                        </View>
                    </View>
                </Card>
            )}

            {/* Quick Actions */}
            <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('PostJob')}>
                    <Text style={styles.actionIcon}>💼</Text>
                    <Text style={styles.actionText}>Post a New Job</Text>
                    <Text style={styles.actionArrow}>→</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Referrals')}>
                    <Text style={styles.actionIcon}>🤝</Text>
                    <Text style={styles.actionText}>Manage Referrals</Text>
                    <Text style={styles.actionArrow}>→</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Sessions')}>
                    <Text style={styles.actionIcon}>📅</Text>
                    <Text style={styles.actionText}>View All Sessions</Text>
                    <Text style={styles.actionArrow}>→</Text>
                </TouchableOpacity>
            </Card>

            {/* Recent Session History */}
            {sessionHistory.length > 0 && (
                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>📚 Recent Sessions</Text>
                    {sessionHistory.slice(0, 5).map(session => (
                        <View key={session._id} style={styles.sessionItem}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusDot(session.status) }]} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.sessionTitle}>{session.title}</Text>
                                <Text style={styles.sessionSub}>
                                    {session.mentee?.name || 'Student'} • {session.duration}min
                                </Text>
                            </View>
                            <Text style={styles.sessionDate}>
                                {new Date(session.date).toLocaleDateString()}
                            </Text>
                        </View>
                    ))}
                </Card>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: SIZES.lg },
    title: { fontSize: SIZES.fontXxl, fontWeight: 'bold', color: COLORS.foreground, marginBottom: 4 },
    subtitle: { fontSize: SIZES.fontMd, color: COLORS.muted, marginBottom: SIZES.xl },
    scoreCard: { padding: SIZES.lg, marginBottom: SIZES.md },
    scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.md },
    scoreLabel: { fontSize: SIZES.fontLg, fontWeight: 'bold', color: COLORS.foreground },
    engagementLabel: { fontSize: SIZES.fontMd, fontWeight: '600', marginTop: 4 },
    scoreCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
    scoreNumber: { fontSize: SIZES.fontXxl, fontWeight: 'bold' },
    progressBar: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden', marginBottom: SIZES.sm },
    progressFill: { height: '100%', borderRadius: 4 },
    scoreHint: { fontSize: SIZES.fontSm, color: COLORS.muted, fontStyle: 'italic' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.md, marginBottom: SIZES.md },
    statCard: { width: '47%', padding: SIZES.md, alignItems: 'center' },
    statValue: { fontSize: SIZES.fontXxl, fontWeight: 'bold', color: COLORS.primary },
    statLabel: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 4, textAlign: 'center' },
    section: { padding: SIZES.md, marginBottom: SIZES.md },
    sectionTitle: { fontSize: SIZES.fontLg, fontWeight: 'bold', color: COLORS.foreground, marginBottom: SIZES.md },
    analyticsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    analyticsItem: { alignItems: 'center' },
    analyticsValue: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground },
    analyticsLabel: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.md, borderBottomWidth: 1, borderColor: COLORS.border },
    actionIcon: { fontSize: 20, marginRight: SIZES.md },
    actionText: { flex: 1, fontSize: SIZES.fontMd, color: COLORS.foreground },
    actionArrow: { color: COLORS.muted, fontSize: SIZES.fontLg },
    sessionItem: { flexDirection: 'row', alignItems: 'center', gap: SIZES.md, marginBottom: SIZES.md },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    sessionTitle: { fontSize: SIZES.fontMd, color: COLORS.foreground, fontWeight: '600' },
    sessionSub: { fontSize: SIZES.fontSm, color: COLORS.muted },
    sessionDate: { fontSize: SIZES.fontSm, color: COLORS.muted },
});
