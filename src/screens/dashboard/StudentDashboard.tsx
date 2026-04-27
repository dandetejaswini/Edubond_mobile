import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Card } from '../../components/ui/Card';
import { COLORS, SIZES } from '../../constants/colors';
import { jobApi, userApi } from '../../services/api';
import { Job } from '../../types';

export const StudentDashboard: React.FC<{ user: any, navigation: any }> = ({ user, navigation }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [recentJobs, setRecentJobs] = useState<Job[]>([]);
    const [analytics, setAnalytics] = useState({
        applicationsCount: 0,
        sessionsAttended: 0,
        referralsReceived: 0,
        meetingsPending: 0,
        profileCompletion: 0,
        skillsCount: 0,
    });

    const fetchData = async () => {
        try {
            const [jobsRes, analyticsRes] = await Promise.all([
                jobApi.getJobs(),
                userApi.getStudentAnalytics()
            ]);
            if (jobsRes?.jobs) setRecentJobs(jobsRes.jobs.slice(0, 3));
            if (analyticsRes?.analytics) setAnalytics(analyticsRes.analytics);
        } catch (e) {
            console.error('Failed to fetch student dashboard', e);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const profileCompletion = analytics.profileCompletion;
    const getCompletionColor = (pct: number) =>
        pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

    const quickActions = [
        { title: 'Find Jobs', icon: '💼', onPress: () => navigation.navigate('JobsList') },
        { title: 'Find Mentors', icon: '👥', onPress: () => navigation.navigate('FindMentors') },
        { title: 'Request\nReferral', icon: '🤝', onPress: () => navigation.navigate('ReferralRequest') },
        { title: 'AI Assistant', icon: '🤖', onPress: () => navigation.navigate('AIChat') },
        { title: 'My Apps', icon: '📋', onPress: () => navigation.navigate('ApplicationTracker') },
        { title: 'Resume AI', icon: '⭐', onPress: () => navigation.navigate('ResumeAnalysis') },
    ];

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.greeting}>Hello Student,</Text>
                <Text style={styles.name}>{user?.name}!</Text>
                {!user?.extractedSkills?.length && (
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.alertBanner}>
                        <Text style={styles.alertText}>⚠️ Upload your resume to unlock smart matching →</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Profile Completion */}
            <View style={styles.section}>
                <View style={styles.completionCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.completionLabel}>Profile Strength</Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, {
                                width: `${profileCompletion}%` as any,
                                backgroundColor: getCompletionColor(profileCompletion)
                            }]} />
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                        <Text style={[styles.completionPct, { color: getCompletionColor(profileCompletion) }]}>
                            {profileCompletion}%
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Stats</Text>
                <View style={styles.statsGrid}>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{analytics.applicationsCount}</Text>
                        <Text style={styles.statLabel}>Applied</Text>
                    </Card>
                    <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Referrals')}>
                        <Text style={styles.statValue}>{analytics.referralsReceived}</Text>
                        <Text style={styles.statLabel}>Referrals</Text>
                    </TouchableOpacity>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{analytics.sessionsAttended}</Text>
                        <Text style={styles.statLabel}>Sessions</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{analytics.skillsCount}</Text>
                        <Text style={styles.statLabel}>Skills</Text>
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
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Recent Jobs */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Opportunities 🚀</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('JobsList')}>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>
                {recentJobs.length === 0 ? (
                    <Text style={{ color: COLORS.muted }}>No new opportunities right now.</Text>
                ) : (
                    recentJobs.map(job => (
                        <Card key={job._id} style={styles.jobCard}>
                            <Text style={styles.jobTitle}>{job.title}</Text>
                            <Text style={styles.jobCompany}>{job.company} • {job.location}</Text>
                            <View style={styles.tagsRow}>
                                <Text style={styles.tag}>{job.type}</Text>
                                <Text style={styles.tag}>{job.experienceLevel}</Text>
                            </View>
                        </Card>
                    ))
                )}
            </View>

            {/* Pending sessions */}
            {analytics.meetingsPending > 0 && (
                <View style={styles.section}>
                    <TouchableOpacity onPress={() => navigation.navigate('Sessions')}>
                        <Card style={[styles.pendingSessionBanner]}>
                            <Text style={styles.pendingIcon}>📅</Text>
                            <Text style={styles.pendingText}>
                                {analytics.meetingsPending} session request{analytics.meetingsPending > 1 ? 's' : ''} pending
                            </Text>
                            <Text style={styles.pendingArrow}>→</Text>
                        </Card>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: SIZES.lg, paddingTop: SIZES.xxl },
    greeting: { fontSize: SIZES.fontLg, color: COLORS.muted },
    name: { fontSize: SIZES.fontXxl, fontWeight: 'bold', color: COLORS.foreground },
    alertBanner: { backgroundColor: '#f59e0b20', borderRadius: SIZES.radiusMd, padding: SIZES.sm, marginTop: SIZES.sm, borderWidth: 1, borderColor: '#f59e0b' },
    alertText: { color: '#f59e0b', fontSize: SIZES.fontSm, fontWeight: '600' },
    section: { padding: SIZES.lg },
    sectionTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
    seeAll: { color: COLORS.primary, fontSize: SIZES.fontSm },
    completionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: SIZES.md, borderWidth: 1, borderColor: COLORS.border, gap: SIZES.md },
    completionLabel: { fontSize: SIZES.fontMd, color: COLORS.foreground, fontWeight: '600', marginBottom: SIZES.sm },
    progressBar: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    completionPct: { fontSize: SIZES.fontXxl, fontWeight: 'bold' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm, marginTop: SIZES.sm },
    statCard: { width: '22%', alignItems: 'center', paddingVertical: SIZES.md },
    statValue: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.primary },
    statLabel: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm, marginTop: SIZES.sm },
    actionCard: { width: '31%', backgroundColor: COLORS.card, borderRadius: SIZES.radiusMd, padding: SIZES.sm, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
    actionIcon: { fontSize: 24, marginBottom: SIZES.xs },
    actionTitle: { fontSize: SIZES.fontSm, color: COLORS.foreground, fontWeight: '600', textAlign: 'center' },
    jobCard: { marginBottom: SIZES.md, padding: SIZES.md },
    jobTitle: { fontSize: SIZES.fontLg, color: COLORS.foreground, fontWeight: 'bold' },
    jobCompany: { fontSize: SIZES.fontMd, color: COLORS.muted, marginTop: 4 },
    tagsRow: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.sm },
    tag: { backgroundColor: COLORS.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 12, overflow: 'hidden', color: COLORS.foreground },
    pendingSessionBanner: { flexDirection: 'row', alignItems: 'center', padding: SIZES.md, gap: SIZES.md, backgroundColor: '#3b82f610', borderColor: '#3b82f6', borderWidth: 1 },
    pendingIcon: { fontSize: 24 },
    pendingText: { flex: 1, color: '#3b82f6', fontWeight: '600' },
    pendingArrow: { color: '#3b82f6' },
});
