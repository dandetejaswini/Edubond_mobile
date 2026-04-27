import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Linking } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { notificationApi, jobApi, chatApi } from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { COLORS, SIZES } from '../../constants/colors';
import { Notification } from '../../types';

const TYPE_ICONS: Record<string, string> = {
    session: '📅',
    job: '💼',
    job_apply: '📋',
    referral: '🤝',
    message: '💬',
    connection: '👥',
    system: '🔔',
};

export const NotificationsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        fetchNotifications();

        if (user?._id) {
            socketRef.current = io(process.env.EXPO_PUBLIC_API_URL || 'http://192.168.10.35:8000');
            socketRef.current.on('connect', () => {
                socketRef.current?.emit('join_user_room', user._id);
            });
            socketRef.current.on('new_notification', (newNotif: Notification) => {
                setNotifications(prev => [newNotif, ...prev]);
            });
            return () => { socketRef.current?.disconnect(); };
        }
    }, [user?._id]);

    const fetchNotifications = async () => {
        try {
            const response: any = await notificationApi.getNotifications();
            if (response?.notifications) {
                setNotifications(response.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (e) {
            Alert.alert('Error', 'Failed to mark all as read');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
    };

    // ── Alumni: Accept a student application ────────────────────────────────
    const handleAcceptApplicant = async (notification: Notification) => {
        const meta = notification.metadata || {};
        const { jobId, studentId, studentName, jobTitle } = meta;

        if (!jobId || !studentId) {
            Alert.alert('Error', 'Missing application details.');
            return;
        }

        setActionLoading(notification._id);
        try {
            const res: any = await jobApi.acceptApplicant(jobId, studentId);
            // Mark notification as read
            await handleMarkAsRead(notification._id);

            Alert.alert(
                'Accepted! 🎉',
                `A chat with ${studentName || 'the student'} has been opened.`,
                [
                    { text: 'Open Chat', onPress: () => navigation?.navigate('Chats') },
                    { text: 'OK' }
                ]
            );
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to accept application');
        } finally {
            setActionLoading(null);
        }
    };

    // ── Alumni: Reject a student application ────────────────────────────────
    const handleRejectApplicant = async (notification: Notification) => {
        const meta = notification.metadata || {};
        const { jobId, studentId, studentName } = meta;

        if (!jobId || !studentId) {
            Alert.alert('Error', 'Missing application details.');
            return;
        }

        Alert.alert(
            'Reject Application',
            `Are you sure you want to reject ${studentName || "this student"}'s application?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        setActionLoading(notification._id);
                        try {
                            await jobApi.rejectApplicant(jobId, studentId);
                            await handleMarkAsRead(notification._id);
                            Alert.alert('Done', `${studentName || 'Student'} has been notified.`);
                        } catch (e: any) {
                            Alert.alert('Error', e.message || 'Failed to reject application');
                        } finally {
                            setActionLoading(null);
                        }
                    }
                }
            ]
        );
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    // ── Job Apply notification card (alumni sees) ────────────────────────────
    const renderJobApplyCard = (item: Notification) => {
        const meta = item.metadata || {};
        const isLoading = actionLoading === item._id;

        return (
            <View style={[styles.card, !item.read && styles.unreadCard, styles.applyCard]}>
                <View style={styles.cardRow}>
                    <Text style={styles.typeIcon}>📋</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, !item.read && styles.unreadTitle]}>{item.title}</Text>
                        <Text style={styles.cardMessage}>"{item.message}"</Text>
                        <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleString()}</Text>
                    </View>
                    {!item.read && <View style={styles.dot} />}
                </View>

                {/* Student profile details */}
                <View style={styles.studentCard}>
                    <Text style={styles.studentName}>👤 {meta.studentName || 'Applicant'}</Text>
                    {meta.studentInstitution ? (
                        <Text style={styles.studentDetail}>🏫 {meta.studentInstitution}</Text>
                    ) : null}
                    {meta.studentSkills ? (
                        <Text style={styles.studentDetail} numberOfLines={2}>🔑 {meta.studentSkills}</Text>
                    ) : null}
                    {meta.studentBio ? (
                        <Text style={styles.studentDetail} numberOfLines={2}>📝 {meta.studentBio}</Text>
                    ) : null}
                    {meta.resumeUrl ? (
                        <TouchableOpacity onPress={() => Linking.openURL(meta.resumeUrl!)}>
                            <Text style={styles.resumeLink}>📄 View Resume →</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.noResume}>No resume uploaded yet</Text>
                    )}
                </View>

                {/* Accept / Reject action buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.acceptBtn, isLoading && { opacity: 0.6 }]}
                        onPress={() => handleAcceptApplicant(item)}
                        disabled={isLoading}
                    >
                        <Text style={styles.actionBtnText}>{isLoading ? '...' : '✅ Accept'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.rejectBtn, isLoading && { opacity: 0.6 }]}
                        onPress={() => handleRejectApplicant(item)}
                        disabled={isLoading}
                    >
                        <Text style={styles.actionBtnText}>{isLoading ? '...' : '❌ Reject'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // ── Handle notification press ────────────────────────────────────────────
    const handleNotificationPress = (item: Notification) => {
        if (!item.read) handleMarkAsRead(item._id);
        const meta = item.metadata || {};
        if (meta.chatId && navigation) {
            navigation.navigate('Chats', { screen: 'Chat', params: { chatId: meta.chatId } });
        } else if (item.type === 'session' && meta.meetingLink) {
            Linking.openURL(meta.meetingLink);
        } else if (item.type === 'referral' && navigation) {
            navigation.navigate('Referrals');
        }
    };

    // ── Default notification card ────────────────────────────────────────────
    const renderDefaultCard = (item: Notification) => (
        <TouchableOpacity
            style={[styles.card, !item.read && styles.unreadCard]}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardRow}>
                <Text style={styles.typeIcon}>{TYPE_ICONS[item.type] || '🔔'}</Text>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, !item.read && styles.unreadTitle]}>{item.title}</Text>
                    <Text style={styles.cardMessage}>{item.message}</Text>
                    <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
                {!item.read && <View style={styles.dot} />}
            </View>
        </TouchableOpacity>
    );

    const renderNotification = ({ item }: { item: Notification }) => {
        if (item.type === 'job_apply' && user?.role === 'alumni') {
            return renderJobApplyCard(item);
        }
        return renderDefaultCard(item);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Notifications</Text>
                    {unreadCount > 0 && (
                        <Text style={styles.unreadCount}>{unreadCount} unread</Text>
                    )}
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
                        <Text style={styles.markAllText}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🔔</Text>
                        <Text style={styles.emptyText}>No notifications yet</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: SIZES.lg, paddingTop: SIZES.xxl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    title: { fontSize: SIZES.fontXxl, fontWeight: 'bold', color: COLORS.foreground },
    unreadCount: { fontSize: SIZES.fontSm, color: COLORS.primary, marginTop: 2 },
    markAllBtn: { backgroundColor: COLORS.primary + '20', borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm },
    markAllText: { color: COLORS.primary, fontWeight: '600', fontSize: SIZES.fontSm },
    list: { padding: SIZES.md },
    card: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: SIZES.md, marginBottom: SIZES.md, borderWidth: 1, borderColor: COLORS.border },
    applyCard: { borderLeftWidth: 4, borderLeftColor: '#6366f1' },
    unreadCard: { borderLeftWidth: 4, borderLeftColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
    cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SIZES.md },
    typeIcon: { fontSize: 22, marginTop: 2 },
    cardTitle: { fontSize: SIZES.fontMd, fontWeight: '500', color: COLORS.foreground },
    unreadTitle: { fontWeight: 'bold' },
    cardMessage: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 4 },
    cardDate: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 4 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginTop: 4 },
    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 48, marginBottom: SIZES.md },
    emptyText: { fontSize: SIZES.fontLg, color: COLORS.muted },
    // Job Apply card specific styles
    studentCard: {
        marginTop: SIZES.md,
        backgroundColor: COLORS.background,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 6,
    },
    studentName: { fontSize: SIZES.fontMd, fontWeight: 'bold', color: COLORS.foreground },
    studentDetail: { fontSize: SIZES.fontSm, color: COLORS.muted },
    resumeLink: { fontSize: SIZES.fontSm, color: COLORS.primary, fontWeight: '600', marginTop: 4 },
    noResume: { fontSize: SIZES.fontSm, color: COLORS.muted, fontStyle: 'italic' },
    actionRow: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md },
    acceptBtn: {
        flex: 1,
        backgroundColor: '#22c55e',
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        alignItems: 'center',
    },
    rejectBtn: {
        flex: 1,
        backgroundColor: '#ef4444',
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        alignItems: 'center',
    },
    actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: SIZES.fontSm },
});
