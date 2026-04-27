import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { Card } from '../../components/ui/Card';
import { COLORS, SIZES } from '../../constants/colors';
import { sessionApi, connectionApi, notificationApi, jobApi } from '../../services/api';
import { User, Session, Job } from '../../types';

interface Props {
    user: User;
    navigation: any;
}

export const MentorDashboard: React.FC<Props> = ({ user, navigation }) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [connectionsCount, setConnectionsCount] = useState(0);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [sessRes, notifRes, connRes, jobsRes] = await Promise.allSettled([
                sessionApi.getSessions(),
                notificationApi.getUnreadCount(),
                connectionApi.getConnections(),
                jobApi.getMentorJobs(),
            ]);

            if (sessRes.status === 'fulfilled' && (sessRes.value as any)?.sessions) {
                setSessions((sessRes.value as any).sessions);
            }
            if (notifRes.status === 'fulfilled' && (notifRes.value as any)?.count !== undefined) {
                setUnreadCount((notifRes.value as any).count);
            }
            if (connRes.status === 'fulfilled' && (connRes.value as any)?.connections) {
                setConnectionsCount((connRes.value as any).connections.length);
            }
            if (jobsRes.status === 'fulfilled' && (jobsRes.value as any)?.jobs) {
                setJobs((jobsRes.value as any).jobs);
            }
        } catch (e) {
            console.error('MentorDashboard fetch error', e);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const pendingSessions = sessions.filter(s => s.status === 'pending').length;
    const upcomingSessions = sessions.filter(s => s.status === 'accepted' || s.status === 'scheduled').length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;

    const isPending = user.status === 'pending';

    const handleDeleteJob = (jobId: string, jobTitle: string) => {
        Alert.alert('Delete Job', `Delete "${jobTitle}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try {
                        await jobApi.deleteJob(jobId);
                        setJobs(prev => prev.filter(j => j._id !== jobId));
                        Alert.alert('Deleted', 'Job removed successfully.');
                    } catch (e: any) {
                        Alert.alert('Error', e.message || 'Failed to delete job');
                    }
                }
            }
        ]);
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.greeting}>Welcome back,</Text>
                <Text style={styles.name}>{user.name}!</Text>
                <Text style={styles.roleLabel}>Mentor</Text>
            </View>

            {/* Pending approval banner */}
            {isPending && (
                <View style={styles.pendingBanner}>
                    <Text style={styles.pendingIcon}>⏳</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.pendingTitle}>Profile Under Review</Text>
                        <Text style={styles.pendingText}>
                            Your mentor profile is pending admin approval. You can still use the app while we review your profile.
                        </Text>
                    </View>
                </View>
            )}

            {/* Stats */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Stats</Text>
                <View style={styles.statsRow}>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{pendingSessions}</Text>
                        <Text style={styles.statLabel}>Pending{'\n'}Requests</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{upcomingSessions}</Text>
                        <Text style={styles.statLabel}>Upcoming{'\n'}Sessions</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{completedSessions}</Text>
                        <Text style={styles.statLabel}>Sessions{'\n'}Done</Text>
                    </Card>
                </View>
                <View style={styles.statsRow}>
                    <Card style={[styles.statCard, { flex: 1 }]}>
                        <Text style={styles.statValue}>{connectionsCount}</Text>
                        <Text style={styles.statLabel}>Connections</Text>
                    </Card>
                    {unreadCount > 0 && (
                        <Card style={[styles.statCard, { flex: 1 }]}>
                            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{unreadCount}</Text>
                            <Text style={styles.statLabel}>Unread{'\n'}Notifications</Text>
                        </Card>
                    )}
                    <Card style={[styles.statCard, { flex: 1 }]}>
                        <Text style={styles.statValue}>{user.sessionsConducted ?? 0}</Text>
                        <Text style={styles.statLabel}>Total{'\n'}Conducted</Text>
                    </Card>
                </View>
            </View>

            {/* Profile summary */}
            {(user.expertise?.length || user.bio || user.company) ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Profile</Text>
                    <Card style={styles.profileCard}>
                        {user.company ? (
                            <Text style={styles.profileRow}>🏢 {user.company}{user.domain ? ` · ${user.domain}` : ''}</Text>
                        ) : null}
                        {user.yearsOfExperience ? (
                            <Text style={styles.profileRow}>⏱ {user.yearsOfExperience} years of experience</Text>
                        ) : null}
                        {user.expertise?.length ? (
                            <Text style={styles.profileRow}>🔑 {user.expertise.join(', ')}</Text>
                        ) : null}
                        {user.bio ? (
                            <Text style={styles.profileBio} numberOfLines={3}>{user.bio}</Text>
                        ) : null}
                    </Card>
                </View>
            ) : null}

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                    <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Sessions')}>
                        <Text style={styles.actionIcon}>📅</Text>
                        <Text style={styles.actionTitle}>My Sessions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Chats')}>
                        <Text style={styles.actionIcon}>💬</Text>
                        <Text style={styles.actionTitle}>Messages</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Notifications')}>
                        <Text style={styles.actionIcon}>{unreadCount > 0 ? '🔔' : '🔕'}</Text>
                        <Text style={styles.actionTitle}>Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AIChat')}>
                        <Text style={styles.actionIcon}>🤖</Text>
                        <Text style={styles.actionTitle}>AI Assistant</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Alumni Posted Jobs — Mentor can manage */}
            {jobs.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Alumni Job Postings</Text>
                    {jobs.slice(0, 5).map(job => (
                        <Card key={job._id} style={styles.jobCard}>
                            <View style={styles.jobRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.jobTitle}>{job.title}</Text>
                                    <Text style={styles.jobCompany}>{job.company} • {job.location}</Text>
                                    <Text style={styles.jobMeta}>{job.type} • {job.experienceLevel}</Text>
                                    <Text style={styles.jobApplicants}>
                                        👥 {Array.isArray(job.applicants) ? job.applicants.length : 0} applicants
                                    </Text>
                                </View>
                                <View style={styles.jobActions}>
                                    <TouchableOpacity
                                        style={styles.editJobBtn}
                                        onPress={() => navigation.navigate('JobDetail', { jobId: job._id })}
                                    >
                                        <Text style={styles.editJobText}>View</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.deleteJobBtn}
                                        onPress={() => handleDeleteJob(job._id, job.title)}
                                    >
                                        <Text style={styles.deleteJobText}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Card>
                    ))}
                    {jobs.length > 5 && (
                        <Text style={styles.viewAllLink}>+{jobs.length - 5} more jobs</Text>
                    )}
                </View>
            )}

            {/* Upcoming Sessions */}
            {sessions.filter(s => s.status === 'accepted' || s.status === 'scheduled' || s.status === 'pending').length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
                    {sessions
                        .filter(s => s.status === 'accepted' || s.status === 'scheduled' || s.status === 'pending')
                        .slice(0, 3)
                        .map(session => (
                            <Card key={session._id} style={styles.sessionCard}>
                                <View style={styles.sessionRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.sessionTitle}>{session.title}</Text>
                                        <Text style={styles.sessionStudent}>
                                            👤 {session.mentee?.name || 'Student'}
                                        </Text>
                                        <Text style={styles.sessionDate}>
                                            📅 {new Date(session.scheduledDate || session.date).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.statusBadge,
                                        session.status === 'pending' ? styles.statusPending :
                                        session.status === 'accepted' ? styles.statusAccepted :
                                        styles.statusScheduled
                                    ]}>
                                        <Text style={styles.statusText}>{session.status}</Text>
                                    </View>
                                </View>
                            </Card>
                        ))}
                    <TouchableOpacity onPress={() => navigation.navigate('Sessions')}>
                        <Text style={styles.viewAllLink}>View all sessions →</Text>
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
    roleLabel: {
        fontSize: SIZES.fontSm,
        color: COLORS.primary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    },
    pendingBanner: {
        marginHorizontal: SIZES.lg,
        marginBottom: SIZES.md,
        backgroundColor: '#fef3c7',
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SIZES.sm,
        borderWidth: 1,
        borderColor: '#fcd34d',
    },
    pendingIcon: { fontSize: 20, marginTop: 2 },
    pendingTitle: { fontSize: SIZES.fontMd, fontWeight: 'bold', color: '#92400e' },
    pendingText: { fontSize: SIZES.fontSm, color: '#b45309', marginTop: 2 },
    section: { padding: SIZES.lg, paddingTop: 0 },
    sectionTitle: {
        fontSize: SIZES.fontXl,
        fontWeight: 'bold',
        color: COLORS.foreground,
        marginBottom: SIZES.md,
        marginTop: SIZES.md,
    },
    statsRow: { flexDirection: 'row', gap: SIZES.sm, marginBottom: SIZES.sm },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: SIZES.lg },
    statValue: { fontSize: SIZES.fontXxl, fontWeight: 'bold', color: COLORS.primary },
    statLabel: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 4, textAlign: 'center' },
    profileCard: { padding: SIZES.md, gap: 6 },
    profileRow: { fontSize: SIZES.fontMd, color: COLORS.foreground },
    profileBio: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 4, lineHeight: 20 },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.md },
    actionCard: {
        width: '47%',
        backgroundColor: COLORS.card,
        borderRadius: SIZES.radiusLg,
        padding: SIZES.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    actionIcon: { fontSize: 32, marginBottom: SIZES.sm },
    actionTitle: { fontSize: SIZES.fontMd, color: COLORS.foreground, fontWeight: '600', textAlign: 'center' },
    sessionCard: { padding: SIZES.md, marginBottom: SIZES.sm },
    sessionRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
    sessionTitle: { fontSize: SIZES.fontMd, fontWeight: '600', color: COLORS.foreground },
    sessionStudent: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
    sessionDate: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    statusPending: { backgroundColor: '#fef3c7' },
    statusAccepted: { backgroundColor: '#d1fae5' },
    statusScheduled: { backgroundColor: '#dbeafe' },
    statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    viewAllLink: { color: COLORS.primary, fontWeight: '600', fontSize: SIZES.fontMd, marginTop: SIZES.sm },
    jobCard: { padding: SIZES.md, marginBottom: SIZES.sm },
    jobRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SIZES.sm },
    jobTitle: { fontSize: SIZES.fontMd, fontWeight: '700', color: COLORS.foreground },
    jobCompany: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
    jobMeta: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
    jobApplicants: { fontSize: SIZES.fontSm, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
    jobActions: { gap: SIZES.sm, alignItems: 'flex-end' },
    editJobBtn: { backgroundColor: COLORS.primary + '20', borderRadius: SIZES.radiusSm, paddingHorizontal: SIZES.sm, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.primary },
    editJobText: { fontSize: SIZES.fontSm, color: COLORS.primary, fontWeight: '600' },
    deleteJobBtn: { backgroundColor: '#ef444420', borderRadius: SIZES.radiusSm, paddingHorizontal: SIZES.sm, paddingVertical: 4, borderWidth: 1, borderColor: '#ef4444' },
    deleteJobText: { fontSize: SIZES.fontSm, color: '#ef4444', fontWeight: '600' },
});
