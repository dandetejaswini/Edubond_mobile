import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Linking, Modal, TextInput, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { sessionApi, meetingApi, userApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { COLORS, SIZES } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { Meeting } from '../../types';

interface SessionItem {
    _id: string;
    title: string;
    description?: string;
    mentor: { _id: string; name: string; email: string; company?: string };
    mentee: { _id: string; name: string; email: string; company?: string };
    date: string;
    duration: number;
    status: string;
    meetingLink?: string;
}

const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    accepted: '#3b82f6',
    scheduled: '#3b82f6',
    completed: '#22c55e',
    cancelled: '#ef4444',
    declined: '#ef4444',
};

export const SessionsScreen: React.FC<{ navigation?: any; route?: any }> = ({ navigation, route }) => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [adminMeetings, setAdminMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [mentors, setMentors] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const preselectedMentorId = route?.params?.mentorId || '';
    const preselectedMentorName = route?.params?.mentorName || '';

    // Create session form state
    const [sessionTitle, setSessionTitle] = useState('');
    const [sessionDesc, setSessionDesc] = useState('');
    const [sessionDate, setSessionDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
    const [sessionDuration, setSessionDuration] = useState('60');
    const [selectedMentorId, setSelectedMentorId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchSessions = async () => {
        try {
            const [sessionsRes, meetingsRes]: any[] = await Promise.all([
                sessionApi.getSessions(),
                meetingApi.getMyMeetings().catch(() => ({ meetings: [] })),
            ]);
            if (sessionsRes?.sessions) setSessions(sessionsRes.sessions);
            if (meetingsRes?.meetings) setAdminMeetings(meetingsRes.meetings);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchMentors = async () => {
        try {
            const res: any = await userApi.getMentors();
            if (Array.isArray(res)) setMentors(res);
            else if (res?.mentors) setMentors(res.mentors);
            else if (res?.data) setMentors(res.data);
        } catch (e) {}
    };

    const fetchStudents = async () => {
        try {
            const res: any = await userApi.getAllUsers({ role: 'student' });
            if (Array.isArray(res)) setStudents(res);
            else if (res?.users) setStudents(res.users);
            else if (res?.data) setStudents(res.data);
        } catch (e) {}
    };

    useEffect(() => {
        fetchSessions();
        if (user?.role === 'student') fetchMentors();
        if (user?.role === 'alumni' || user?.role === 'mentor') fetchStudents();
    }, []);

    useEffect(() => {
        if (preselectedMentorId) {
            setSelectedMentorId(preselectedMentorId);
            setShowCreateModal(true);
        }
    }, [preselectedMentorId]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchSessions();
    };

    const handleAccept = async (sessionId: string) => {
        try {
            await sessionApi.acceptSession(sessionId);
            setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, status: 'accepted' } : s));
            Alert.alert('Accepted', 'Session accepted! The student will be notified.');
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to accept session');
        }
    };

    const handleDecline = async (sessionId: string) => {
        Alert.alert('Decline Session', 'Are you sure you want to decline this session?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Decline',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await sessionApi.declineSession(sessionId);
                        setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, status: 'declined' } : s));
                    } catch (e: any) {
                        Alert.alert('Error', e.message || 'Failed to decline');
                    }
                }
            }
        ]);
    };

    const handleMarkComplete = async (sessionId: string) => {
        try {
            await sessionApi.updateSessionStatus(sessionId, 'completed');
            setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, status: 'completed' } : s));
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to update');
        }
    };

    const handleCreateSession = async () => {
        if (!sessionTitle.trim()) {
            Alert.alert('Required', 'Title is required.');
            return;
        }
        if (user?.role === 'student' && !selectedMentorId) {
            Alert.alert('Required', 'Please select a mentor.');
            return;
        }
        if ((user?.role === 'alumni' || user?.role === 'mentor') && !selectedStudentId) {
            Alert.alert('Required', 'Please select a student.');
            return;
        }
        setSubmitting(true);
        try {
            const payload: any = {
                title: sessionTitle,
                description: sessionDesc,
                date: sessionDate.toISOString(),
                duration: parseInt(sessionDuration) || 60,
            };
            if (user?.role === 'student') payload.mentorId = selectedMentorId;
            if (user?.role === 'alumni' || user?.role === 'mentor') payload.menteeId = selectedStudentId;
            await sessionApi.createSession(payload);
            Alert.alert('Session Requested!', 'Your session request has been sent.');
            setShowCreateModal(false);
            setSessionTitle(''); setSessionDesc(''); setSessionDate(new Date());
            setSelectedMentorId(''); setSelectedStudentId('');
            fetchSessions();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to create session');
        } finally {
            setSubmitting(false);
        }
    };

    const isAlumniOrMentor = user?.role === 'alumni' || user?.role === 'mentor';

    const pending = sessions.filter(s => s.status === 'pending');
    const active = sessions.filter(s => s.status === 'accepted' || s.status === 'scheduled');
    const past = sessions.filter(s => ['completed', 'cancelled', 'declined'].includes(s.status));

    const renderSession = (session: SessionItem) => {
        const isMyRequest = session.mentee?._id === user?._id;
        const otherPerson = isMyRequest ? session.mentor : session.mentee;

        return (
            <Card key={session._id} style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.sessionTitle}>{session.title}</Text>
                        <Text style={styles.sessionInfo}>
                            {isMyRequest ? '👤' : '🎓'} {otherPerson?.name || 'Unknown'}
                            {otherPerson?.company ? ` • ${otherPerson.company}` : ''}
                        </Text>
                        <Text style={styles.sessionDate}>{new Date(session.date).toLocaleString()} • {session.duration}min</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[session.status] || COLORS.muted) + '20' }]}>
                        <Text style={[styles.statusText, { color: STATUS_COLORS[session.status] || COLORS.muted }]}>
                            {session.status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Pending actions for alumni/mentor */}
                {session.status === 'pending' && isAlumniOrMentor && !isMyRequest && (
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(session._id)}>
                            <Text style={styles.acceptText}>✓ Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(session._id)}>
                            <Text style={styles.declineText}>✗ Decline</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Pending status for student */}
                {session.status === 'pending' && isMyRequest && (
                    <Text style={styles.pendingNote}>⏳ Waiting for response from {session.mentor?.name || 'mentor'}</Text>
                )}

                {/* Accepted - join link + mark complete */}
                {session.status === 'accepted' && (
                    <View style={styles.actionsRow}>
                        {session.meetingLink && (
                            <TouchableOpacity
                                style={styles.joinBtn}
                                onPress={() => session.meetingLink && Linking.openURL(session.meetingLink)}
                            >
                                <Text style={styles.joinText}>🎥 Join Meeting</Text>
                            </TouchableOpacity>
                        )}
                        {isAlumniOrMentor && !isMyRequest && (
                            <TouchableOpacity style={styles.completeBtn} onPress={() => handleMarkComplete(session._id)}>
                                <Text style={styles.completeText}>Mark Done</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </Card>
        );
    };

    if (loading) return <LoadingSpinner />;

    return (
        <>
        <FlatList
            style={styles.container}
            data={[]}
            renderItem={null}
            ListHeaderComponent={
                <>
                    {/* Book Session / Request Session button */}
                    {(user?.role === 'student' || user?.role === 'alumni' || user?.role === 'mentor') && (
                        <View style={styles.createBtnContainer}>
                            <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
                                <Text style={styles.createBtnText}>+ Book a Session</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {pending.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>⏳ Pending Requests ({pending.length})</Text>
                            {pending.map(renderSession)}
                        </View>
                    )}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📅 Active Sessions</Text>
                        {active.length > 0 ? active.map(renderSession) : (
                            <Text style={styles.emptyText}>No active sessions</Text>
                        )}
                    </View>

                    {/* Admin scheduled meetings */}
                    {adminMeetings.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>🏛️ Scheduled Meetings</Text>
                            {adminMeetings.map(meeting => (
                                <Card key={meeting._id} style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.sessionTitle}>{meeting.title}</Text>
                                            {meeting.description ? <Text style={styles.sessionInfo}>{meeting.description}</Text> : null}
                                            <Text style={styles.sessionDate}>{new Date(meeting.date).toLocaleString()} • {meeting.duration}min</Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: '#3b82f620' }]}>
                                            <Text style={[styles.statusText, { color: '#3b82f6' }]}>{meeting.status?.toUpperCase()}</Text>
                                        </View>
                                    </View>
                                    {meeting.meetingLink && (
                                        <View style={styles.actionsRow}>
                                            <TouchableOpacity style={styles.joinBtn} onPress={() => Linking.openURL(meeting.meetingLink!)}>
                                                <Text style={styles.joinText}>🎥 Join Meeting</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </Card>
                            ))}
                        </View>
                    )}

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>✅ Past Sessions</Text>
                        {past.length > 0 ? past.map(renderSession) : (
                            <Text style={styles.emptyText}>No past sessions yet</Text>
                        )}
                    </View>
                </>
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />

        {/* Create Session Modal */}
        <Modal visible={showCreateModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalTitle}>Book a Session</Text>
                        <Text style={styles.modalLabel}>Title *</Text>
                        <TextInput style={styles.modalInput} placeholder="e.g. Career Guidance" placeholderTextColor={COLORS.muted}
                            value={sessionTitle} onChangeText={setSessionTitle} />
                        <Text style={styles.modalLabel}>Description</Text>
                        <TextInput style={[styles.modalInput, { minHeight: 70 }]} placeholder="What would you like to discuss?" placeholderTextColor={COLORS.muted}
                            value={sessionDesc} onChangeText={setSessionDesc} multiline />
                        <Text style={styles.modalLabel}>Date & Time *</Text>
                        <TouchableOpacity 
                            style={styles.modalInput} 
                            onPress={() => { setPickerMode('date'); setShowPicker(true); }}>
                            <Text style={{ color: COLORS.foreground, fontSize: SIZES.fontMd }}>
                                {sessionDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </Text>
                        </TouchableOpacity>

                        {showPicker && (
                            <DateTimePicker
                                value={sessionDate}
                                mode={pickerMode}
                                display="default"
                                minimumDate={new Date()}
                                onChange={(event, date) => {
                                    setShowPicker(false);
                                    if (date) {
                                        setSessionDate(date);
                                        if (pickerMode === 'date' && Platform.OS !== 'ios') {
                                            // On Android, show time picker right after date picker
                                            setPickerMode('time');
                                            setShowPicker(true);
                                        }
                                    }
                                }}
                            />
                        )}

                        <Text style={styles.modalLabel}>Duration (minutes)</Text>
                        <TextInput style={styles.modalInput} placeholder="60" placeholderTextColor={COLORS.muted}
                            value={sessionDuration} onChangeText={setSessionDuration} keyboardType="numeric" />
                        {user?.role === 'student' && mentors.length > 0 && (
                            <>
                                <Text style={styles.modalLabel}>Select Mentor *</Text>
                                {mentors.map(m => (
                                    <TouchableOpacity key={m._id}
                                        style={[styles.mentorOption, selectedMentorId === m._id && styles.mentorOptionActive]}
                                        onPress={() => setSelectedMentorId(m._id)}>
                                        <Text style={[styles.mentorOptionText, selectedMentorId === m._id && { color: '#fff' }]}>
                                            {m.name}{m.company ? ` • ${m.company}` : ''}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}
                        {(user?.role === 'alumni' || user?.role === 'mentor') && students.length > 0 && (
                            <>
                                <Text style={styles.modalLabel}>Select Student *</Text>
                                {students.map(s => (
                                    <TouchableOpacity key={s._id}
                                        style={[styles.mentorOption, selectedStudentId === s._id && styles.mentorOptionActive]}
                                        onPress={() => setSelectedStudentId(s._id)}>
                                        <Text style={[styles.mentorOptionText, selectedStudentId === s._id && { color: '#fff' }]}>
                                            {s.name}{s.institution ? ` • ${s.institution}` : ''}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}
                        <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                            onPress={handleCreateSession} disabled={submitting}>
                            <Text style={styles.submitBtnText}>{submitting ? 'Sending…' : 'Send Request'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreateModal(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    section: { padding: SIZES.lg },
    sectionTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground, marginBottom: SIZES.md },
    card: { marginBottom: SIZES.md, padding: SIZES.md },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: SIZES.sm },
    sessionTitle: { fontSize: SIZES.fontLg, fontWeight: '600', color: COLORS.foreground },
    sessionInfo: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
    sessionDate: { fontSize: SIZES.fontSm, color: COLORS.primary, marginTop: 2 },
    statusBadge: { borderRadius: SIZES.radiusSm, paddingHorizontal: SIZES.sm, paddingVertical: 4 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    actionsRow: { flexDirection: 'row', gap: SIZES.md, marginTop: SIZES.md },
    acceptBtn: { flex: 1, backgroundColor: '#22c55e20', borderRadius: SIZES.radiusMd, padding: SIZES.md, alignItems: 'center', borderWidth: 1, borderColor: '#22c55e' },
    acceptText: { color: '#22c55e', fontWeight: 'bold' },
    declineBtn: { flex: 1, backgroundColor: '#ef444420', borderRadius: SIZES.radiusMd, padding: SIZES.md, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
    declineText: { color: '#ef4444', fontWeight: 'bold' },
    joinBtn: { flex: 1, backgroundColor: '#3b82f620', borderRadius: SIZES.radiusMd, padding: SIZES.md, alignItems: 'center', borderWidth: 1, borderColor: '#3b82f6' },
    joinText: { color: '#3b82f6', fontWeight: 'bold' },
    completeBtn: { flex: 1, backgroundColor: '#22c55e20', borderRadius: SIZES.radiusMd, padding: SIZES.md, alignItems: 'center', borderWidth: 1, borderColor: '#22c55e' },
    completeText: { color: '#22c55e', fontWeight: 'bold' },
    pendingNote: { marginTop: SIZES.sm, fontSize: SIZES.fontSm, color: '#f59e0b', fontStyle: 'italic' },
    emptyText: { fontSize: SIZES.fontMd, color: COLORS.muted, textAlign: 'center', padding: SIZES.xl },
    createBtnContainer: { padding: SIZES.lg, paddingBottom: 0 },
    createBtn: { backgroundColor: COLORS.primary, borderRadius: SIZES.radiusMd, padding: SIZES.md, alignItems: 'center' },
    createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: SIZES.fontMd },
    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: SIZES.xl, maxHeight: '90%' },
    modalTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground, marginBottom: SIZES.lg },
    modalLabel: { fontSize: SIZES.fontSm, color: COLORS.muted, fontWeight: '600', marginBottom: SIZES.xs, marginTop: SIZES.sm },
    modalInput: { backgroundColor: COLORS.background, borderRadius: SIZES.radiusMd, padding: SIZES.md, color: COLORS.foreground, borderWidth: 1, borderColor: COLORS.border, fontSize: SIZES.fontMd },
    mentorOption: { borderRadius: SIZES.radiusMd, padding: SIZES.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SIZES.sm, backgroundColor: COLORS.background },
    mentorOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    mentorOptionText: { color: COLORS.foreground, fontSize: SIZES.fontSm },
    submitBtn: { backgroundColor: COLORS.primary, borderRadius: SIZES.radiusMd, padding: SIZES.md, alignItems: 'center', marginTop: SIZES.lg },
    submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: SIZES.fontMd },
    cancelBtn: { padding: SIZES.md, alignItems: 'center', marginTop: SIZES.sm },
    cancelBtnText: { color: COLORS.muted, fontSize: SIZES.fontMd },
});