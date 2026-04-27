import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, Alert, Modal, ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants/colors';
import { adminApi } from '../../services/api';
import { Meeting, User } from '../../types';

export const MeetingManagementScreen: React.FC<{ navigation: any }> = () => {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);

    const [form, setForm] = useState({
        title: '',
        description: '',
        duration: '60',
        type: 'general',
        meetingLink: '',
    });
    const [meetingDate, setMeetingDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
    const [userSearch, setUserSearch] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [meetRes, userRes]: any[] = await Promise.all([
                adminApi.getMeetings(),
                adminApi.getMeetingUsers(),
            ]);
            setMeetings(meetRes.meetings || []);
            setUsers(userRes.users || []);
        } catch (e) {
            console.error('Failed to load meetings', e);
        } finally {
            setLoading(false);
        }
    };

    const toggleParticipant = (userId: string) => {
        setSelectedParticipants(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleCreate = async () => {
        if (!form.title.trim() || selectedParticipants.length === 0) {
            Alert.alert('Error', 'Title and at least one participant are required.');
            return;
        }

        setCreating(true);
        try {
            await adminApi.createMeeting({
                ...form,
                date: meetingDate.toISOString(),
                duration: parseInt(form.duration) || 60,
                participantIds: selectedParticipants,
            });
            setShowCreate(false);
            setForm({ title: '', description: '', duration: '60', type: 'general', meetingLink: '' });
            setMeetingDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
            setSelectedParticipants([]);
            await fetchData();
            Alert.alert('Meeting Scheduled', 'All participants have been notified.');
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to create meeting');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = (meeting: Meeting) => {
        Alert.alert('Delete Meeting', `Delete "${meeting.title}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try {
                        await adminApi.deleteMeeting(meeting._id);
                        setMeetings(prev => prev.filter(m => m._id !== meeting._id));
                    } catch (e: any) {
                        Alert.alert('Error', e.message || 'Failed to delete meeting');
                    }
                }
            }
        ]);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return '#22c55e';
            case 'cancelled': return '#ef4444';
            case 'completed': return COLORS.muted;
            default: return COLORS.primary;
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    const renderMeeting = ({ item }: { item: Meeting }) => {
        const date = new Date(item.date);
        const accepted = Array.isArray(item.acceptedBy) ? item.acceptedBy.length : 0;
        const total = item.participants.length;

        return (
            <View style={styles.meetingCard}>
                <View style={styles.meetingHeader}>
                    <Text style={styles.meetingTitle}>{item.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '25' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {item.status}
                        </Text>
                    </View>
                </View>
                <Text style={styles.meetingDate}>
                    {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.meetingDuration}>{item.duration} min · {item.type}</Text>
                {item.description ? <Text style={styles.meetingDesc}>{item.description}</Text> : null}
                <Text style={styles.participantCount}>
                    {accepted}/{total} accepted · {total - accepted} pending
                </Text>
                {item.meetingLink ? (
                    <Text style={styles.meetingLink} numberOfLines={1}>{item.meetingLink}</Text>
                ) : null}
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Meeting Management</Text>
                <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
                    <Text style={styles.createBtnText}>+ Schedule</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={meetings}
                    keyExtractor={m => m._id}
                    renderItem={renderMeeting}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyIcon}>📅</Text>
                            <Text style={styles.emptyTitle}>No meetings scheduled</Text>
                            <Text style={styles.emptyText}>Tap "+ Schedule" to create a meeting</Text>
                        </View>
                    }
                />
            )}

            {/* Create Meeting Modal */}
            <Modal visible={showCreate} animationType="slide" onRequestClose={() => setShowCreate(false)}>
                <View style={styles.modal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Schedule Meeting</Text>
                        <TouchableOpacity onPress={() => setShowCreate(false)}>
                            <Text style={styles.closeBtn}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={styles.fieldLabel}>Title *</Text>
                        <TextInput style={styles.input} placeholder="Meeting title"
                            placeholderTextColor={COLORS.muted} value={form.title}
                            onChangeText={v => setForm(p => ({ ...p, title: v }))} />

                        <Text style={styles.fieldLabel}>Description</Text>
                        <TextInput style={[styles.input, styles.textarea]}
                            placeholder="Meeting agenda or description"
                            placeholderTextColor={COLORS.muted} value={form.description}
                            onChangeText={v => setForm(p => ({ ...p, description: v }))}
                            multiline numberOfLines={3} textAlignVertical="top" />

                        <Text style={styles.fieldLabel}>Date & Time *</Text>
                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => { setDatePickerMode('date'); setShowDatePicker(true); }}
                        >
                            <Text style={{ color: COLORS.foreground, fontSize: SIZES.fontMd }}>
                                {meetingDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={meetingDate}
                                mode={datePickerMode}
                                display="default"
                                minimumDate={new Date()}
                                onChange={(event, date) => {
                                    setShowDatePicker(false);
                                    if (date) {
                                        setMeetingDate(date);
                                        if (datePickerMode === 'date' && Platform.OS !== 'ios') {
                                            setDatePickerMode('time');
                                            setShowDatePicker(true);
                                        }
                                    }
                                }}
                            />
                        )}

                        <Text style={styles.fieldLabel}>Duration (minutes)</Text>
                        <TextInput style={styles.input} placeholder="60"
                            placeholderTextColor={COLORS.muted} value={form.duration}
                            onChangeText={v => setForm(p => ({ ...p, duration: v }))}
                            keyboardType="numeric" />

                        <Text style={styles.fieldLabel}>Meeting Link</Text>
                        <TextInput style={styles.input} placeholder="Leave blank to auto-generate"
                            placeholderTextColor={COLORS.muted} value={form.meetingLink}
                            onChangeText={v => setForm(p => ({ ...p, meetingLink: v }))} />

                        <Text style={styles.fieldLabel}>Type</Text>
                        <View style={styles.typeRow}>
                            {['general', 'mentoring', 'career', 'alumni'].map(t => (
                                <TouchableOpacity key={t}
                                    style={[styles.typeBtn, form.type === t && styles.typeBtnActive]}
                                    onPress={() => setForm(p => ({ ...p, type: t }))}>
                                    <Text style={[styles.typeBtnText, form.type === t && styles.typeBtnTextActive]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.fieldLabel}>
                            Participants ({selectedParticipants.length} selected)
                        </Text>
                        <TextInput style={styles.input} placeholder="Search users…"
                            placeholderTextColor={COLORS.muted} value={userSearch}
                            onChangeText={setUserSearch} />

                        {filteredUsers.slice(0, 15).map(u => (
                            <TouchableOpacity key={u._id} style={styles.userRow}
                                onPress={() => toggleParticipant(u._id)}>
                                <View style={[styles.checkbox, selectedParticipants.includes(u._id) && styles.checkboxChecked]}>
                                    {selectedParticipants.includes(u._id) && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName}>{u.name}</Text>
                                    <Text style={styles.userRole}>{u.role} · {u.institution || u.email}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={[styles.submitBtn, creating && { opacity: 0.7 }]}
                            onPress={handleCreate} disabled={creating}>
                            <Text style={styles.submitBtnText}>
                                {creating ? 'Scheduling…' : 'Schedule & Notify Participants'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: SIZES.lg, paddingTop: SIZES.xl,
        backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    headerTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground },
    createBtn: { backgroundColor: COLORS.primary, borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm },
    createBtnText: { color: '#fff', fontWeight: '700', fontSize: SIZES.fontSm },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: SIZES.md, paddingBottom: SIZES.xxl },
    meetingCard: {
        backgroundColor: COLORS.card, borderRadius: SIZES.radiusMd,
        padding: SIZES.md, marginBottom: SIZES.md, borderWidth: 1, borderColor: COLORS.border,
    },
    meetingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.xs },
    meetingTitle: { fontSize: SIZES.fontMd, fontWeight: '700', color: COLORS.foreground, flex: 1 },
    statusBadge: { borderRadius: SIZES.radiusSm, paddingHorizontal: SIZES.sm, paddingVertical: 2 },
    statusText: { fontSize: SIZES.fontSm, fontWeight: '600' },
    meetingDate: { fontSize: SIZES.fontSm, color: COLORS.muted },
    meetingDuration: { fontSize: SIZES.fontSm, color: COLORS.muted },
    meetingDesc: { fontSize: SIZES.fontSm, color: COLORS.foreground, marginTop: SIZES.xs },
    participantCount: { fontSize: SIZES.fontSm, color: COLORS.primary, marginTop: SIZES.xs },
    meetingLink: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
    deleteBtn: { marginTop: SIZES.sm, alignSelf: 'flex-end' },
    deleteBtnText: { color: COLORS.error, fontSize: SIZES.fontSm },
    empty: { padding: SIZES.xl, alignItems: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: SIZES.md },
    emptyTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground },
    emptyText: { fontSize: SIZES.fontMd, color: COLORS.muted, marginTop: SIZES.sm },
    // Modal
    modal: { flex: 1, backgroundColor: COLORS.background },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: SIZES.lg, paddingTop: SIZES.xxl,
        backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    modalTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground },
    closeBtn: { fontSize: SIZES.fontXl, color: COLORS.muted },
    modalContent: { padding: SIZES.lg, paddingBottom: SIZES.xxl },
    fieldLabel: { fontSize: SIZES.fontMd, fontWeight: '600', color: COLORS.foreground, marginBottom: SIZES.sm, marginTop: SIZES.md },
    input: {
        backgroundColor: COLORS.card, borderRadius: SIZES.radiusMd,
        padding: SIZES.md, color: COLORS.foreground, borderWidth: 1, borderColor: COLORS.border,
        fontSize: SIZES.fontMd,
    },
    textarea: { minHeight: 80 },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
    typeBtn: {
        paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
        borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: COLORS.border,
    },
    typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    typeBtnText: { fontSize: SIZES.fontSm, color: COLORS.muted },
    typeBtnTextActive: { color: '#fff' },
    userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    checkbox: {
        width: 22, height: 22, borderRadius: 4,
        borderWidth: 2, borderColor: COLORS.border, marginRight: SIZES.md,
        alignItems: 'center', justifyContent: 'center',
    },
    checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    userInfo: { flex: 1 },
    userName: { fontSize: SIZES.fontMd, fontWeight: '600', color: COLORS.foreground },
    userRole: { fontSize: SIZES.fontSm, color: COLORS.muted },
    submitBtn: {
        backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg,
        padding: SIZES.lg, alignItems: 'center', marginTop: SIZES.xl,
    },
    submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: SIZES.fontMd },
});
