import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Card } from '../../components/ui/Card';
import { COLORS, SIZES } from '../../constants/colors';
import { jobApi, userApi, referralApi } from '../../services/api';
import { Job, User } from '../../types';

export const AlumniDashboard: React.FC<{ user: any, navigation: any }> = ({ user, navigation }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [recommendedStudents, setRecommendedStudents] = useState<User[]>([]);
    const [stats, setStats] = useState({ referralsGiven: 0, jobsPosted: 0, sessionsCompleted: 0, engagementScore: 0, referralsPending: 0 });
    const [filterSkills, setFilterSkills] = useState('');

    const fetchData = async () => {
        try {
            const [studentsRes, statsRes] = await Promise.all([
                userApi.getRecommendedStudents(),
                userApi.getContributionStats()
            ]);
            if (studentsRes?.recommendedStudents) {
                setRecommendedStudents(studentsRes.recommendedStudents.slice(0, 5));
            }
            if (statsRes?.stats) {
                setStats(statsRes.stats);
            }
        } catch (e) {
            console.error('Failed to fetch alumni dashboard', e);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const getEngagementColor = (score: number) =>
        score >= 60 ? '#22c55e' : score >= 30 ? '#f59e0b' : '#ef4444';

    const quickActions = [
        { title: 'Post Job', icon: '💼', onPress: () => navigation.navigate('PostJob') },
        { title: 'Referrals', icon: '🤝', onPress: () => navigation.navigate('Referrals'), badge: stats.referralsPending },
        { title: 'My Impact', icon: '📊', onPress: () => navigation.navigate('AlumniContribution') },
        { title: 'AI Assistant', icon: '🤖', onPress: () => navigation.navigate('AIChat') },
        { title: 'Alumni Groups', icon: '🏛', onPress: () => navigation.navigate('AlumniGroups') },
        { title: 'Sessions', icon: '📅', onPress: () => navigation.navigate('Sessions') },
    ];

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.greeting}>Welcome back,</Text>
                <Text style={styles.name}>{user?.name}!</Text>
                <Text style={styles.subtitle}>Alumni Portal • {user?.company || user?.domain || 'EduBond'}</Text>
            </View>

            {/* Engagement Score */}
            <View style={styles.section}>
                <View style={styles.engagementCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.engagementLabel}>Engagement Score</Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, {
                                width: `${Math.min(stats.engagementScore, 100)}%` as any,
                                backgroundColor: getEngagementColor(stats.engagementScore)
                            }]} />
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('AlumniContribution')}>
                        <Text style={[styles.scoreNumber, { color: getEngagementColor(stats.engagementScore) }]}>
                            {stats.engagementScore}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Contributions Stats */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Contributions</Text>
                <View style={styles.statsContainer}>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.referralsGiven}</Text>
                        <Text style={styles.statLabel}>Referrals{'\n'}Given</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.jobsPosted}</Text>
                        <Text style={styles.statLabel}>Jobs{'\n'}Posted</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.sessionsCompleted}</Text>
                        <Text style={styles.statLabel}>Sessions{'\n'}Done</Text>
                    </Card>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.quickActionsGrid}>
                    {quickActions.map((action, index) => (
                        <TouchableOpacity key={index} style={styles.actionCard} onPress={action.onPress}>
                            <Text style={styles.actionIcon}>{action.icon}</Text>
                            <Text style={styles.actionTitle}>{action.title}</Text>
                            {action.badge !== undefined && action.badge > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{action.badge}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Top Recommended Students */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recommended Students ⭐</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('StudentFilter')}>
                        <Text style={styles.seeAll}>Filter →</Text>
                    </TouchableOpacity>
                </View>
                {recommendedStudents.length === 0 ? (
                    <Text style={{ color: COLORS.muted }}>
                        No matches yet. Build your profile with skills and domain!
                    </Text>
                ) : (
                    recommendedStudents.map(student => (
                        <Card key={student._id} style={styles.studentCard}>
                            <Text style={styles.studentName}>🎓 {student.name}</Text>
                            <Text style={styles.studentSub}>{student.institution}</Text>
                            {(student as any).extractedSkills?.length > 0 && (
                                <Text style={styles.studentSkills}>
                                    Skills: {(student as any).extractedSkills.slice(0, 3).join(', ')}
                                </Text>
                            )}
                            <Text style={styles.matchScore}>
                                Match score: {(student as any).matchScore || 0} pts
                            </Text>
                        </Card>
                    ))
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: SIZES.lg, paddingTop: SIZES.xxl },
    greeting: { fontSize: SIZES.fontLg, color: COLORS.muted },
    name: { fontSize: SIZES.fontXxl, fontWeight: 'bold', color: COLORS.foreground },
    subtitle: { fontSize: SIZES.fontMd, color: COLORS.primary, marginTop: 4 },
    section: { padding: SIZES.lg },
    sectionTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground, marginBottom: SIZES.md },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
    seeAll: { color: COLORS.primary, fontSize: SIZES.fontSm },
    engagementCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: SIZES.md, borderWidth: 1, borderColor: COLORS.border, gap: SIZES.md },
    engagementLabel: { fontSize: SIZES.fontMd, color: COLORS.foreground, fontWeight: '600', marginBottom: SIZES.sm },
    progressBar: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    scoreNumber: { fontSize: SIZES.fontXxl, fontWeight: 'bold' },
    statsContainer: { flexDirection: 'row', gap: SIZES.md },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: SIZES.lg },
    statValue: { fontSize: SIZES.fontXxl, fontWeight: 'bold', color: COLORS.primary },
    statLabel: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: SIZES.xs, textAlign: 'center' },
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.md },
    actionCard: { width: '30%', backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: SIZES.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', position: 'relative' },
    actionIcon: { fontSize: 28, marginBottom: SIZES.xs },
    actionTitle: { fontSize: SIZES.fontSm, color: COLORS.foreground, fontWeight: '600', textAlign: 'center' },
    badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    studentCard: { marginBottom: SIZES.sm, padding: SIZES.md },
    studentName: { fontSize: SIZES.fontMd, fontWeight: 'bold', color: COLORS.foreground },
    studentSub: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
    studentSkills: { fontSize: SIZES.fontSm, color: COLORS.primary, marginTop: 4 },
    matchScore: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
});
