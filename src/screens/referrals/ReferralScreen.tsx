import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, Linking, Modal, ScrollView } from 'react-native';
import { Card } from '../../components/ui/Card';
import { COLORS, SIZES } from '../../constants/colors';
import { referralApi, API_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Referral {
    _id: string;
    student?: { name: string; email: string; institution: string; extractedSkills?: string[]; resumeUrl?: string };
    alumni?: { name: string; company: string; domain: string };
    jobTitle: string;
    company: string;
    status: 'pending' | 'given' | 'rejected';
    studentMessage: string;
    notes: string;
    createdAt: string;
}

const STATUS_COLORS = {
    pending: '#f59e0b',
    given: '#22c55e',
    rejected: '#ef4444',
};

export const ReferralScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);

    const fetchData = async () => {
        try {
            const res = await referralApi.getMyReferrals();
            if (res?.referrals) setReferrals(res.referrals);
        } catch (e) {
            console.error('Failed to load referrals', e);
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

    const handleUpdateStatus = async (referralId: string, newStatus: 'given' | 'rejected') => {
        try {
            await referralApi.updateStatus(referralId, newStatus);
            setReferrals(prev =>
                prev.map(r => r._id === referralId ? { ...r, status: newStatus } : r)
            );
            Alert.alert('Updated', `Referral marked as ${newStatus}`);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to update');
        }
    };

    const renderAlumniView = ({ item }: { item: Referral }) => (
        <Card style={styles.card}>
            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.student?.name || 'Student'}</Text>
                    <Text style={styles.sub}>{item.student?.institution}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[item.status] || COLORS.border) + '25' }]}>
                    <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>{item.status.toUpperCase()}</Text>
                </View>
            </View>
            {(item.jobTitle || item.company) && (
                <Text style={styles.jobInfo}>💼 {item.jobTitle}{item.company ? ` @ ${item.company}` : ''}</Text>
            )}
            {item.studentMessage ? (
                <Text style={styles.message}>"{item.studentMessage}"</Text>
            ) : null}
            {item.student?.extractedSkills?.length ? (
                <Text style={styles.skills}>Skills: {item.student.extractedSkills.slice(0, 5).join(', ')}</Text>
            ) : null}
            {item.student?.resumeUrl ? (
                <TouchableOpacity
                    style={styles.resumeBtn}
                    onPress={() => {
                        const url = item.student?.resumeUrl;
                        if (url && url !== 'resume_uploaded') {
                            const fullUrl = url.startsWith('http') ? url : `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
                            Linking.openURL(fullUrl).catch(() =>
                                Alert.alert('Error', 'Unable to open resume. The file may not be accessible from this device.')
                            );
                        } else {
                            Alert.alert(
                                'Resume Uploaded',
                                `${item.student?.name} has uploaded a resume. You can contact them directly to request it.`,
                                [{ text: 'OK' }]
                            );
                        }
                    }}
                >
                    <Text style={styles.resumeBtnText}>📄 Check Resume</Text>
                </TouchableOpacity>
            ) : null}
            {item.status === 'pending' && (
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => handleUpdateStatus(item._id, 'given')}
                    >
                        <Text style={styles.acceptBtnText}>✓ Give Referral</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleUpdateStatus(item._id, 'rejected')}
                    >
                        <Text style={styles.rejectBtnText}>✗ Decline</Text>
                    </TouchableOpacity>
                </View>
            )}
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </Card>
    );

    const renderStudentView = ({ item }: { item: Referral }) => (
        <TouchableOpacity onPress={() => setSelectedReferral(item)} activeOpacity={0.8}>
            <Card style={styles.card}>
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{item.alumni?.name || 'Alumni'}</Text>
                        <Text style={styles.sub}>{item.alumni?.company} • {item.alumni?.domain}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[item.status] || COLORS.border) + '25' }]}>
                        <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>{item.status.toUpperCase()}</Text>
                    </View>
                </View>
                {(item.jobTitle || item.company) && (
                    <Text style={styles.jobInfo}>💼 {item.jobTitle}{item.company ? ` @ ${item.company}` : ''}</Text>
                )}
                {item.status === 'given' && (
                    <Text style={styles.successNote}>🎉 Referral received! Tap to see details.</Text>
                )}
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                <Text style={styles.tapHint}>Tap to view details →</Text>
            </Card>
        </TouchableOpacity>
    );

    const isAlumni = user?.role === 'alumni';
    const pending = referrals.filter(r => r.status === 'pending').length;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{isAlumni ? 'Referral Requests' : 'My Referrals'}</Text>
                {isAlumni && pending > 0 && (
                    <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>{pending} pending</Text>
                    </View>
                )}
            </View>
            <FlatList
                data={referrals}
                keyExtractor={item => item._id}
                renderItem={isAlumni ? renderAlumniView : renderStudentView}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ padding: SIZES.md }}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        {loading ? 'Loading...' : isAlumni ? 'No referral requests yet.' : 'No referrals yet. Request one from an alumni!'}
                    </Text>
                }
            />

            {/* Student Referral Detail Modal */}
            <Modal
                visible={!!selectedReferral}
                animationType="slide"
                transparent
                onRequestClose={() => setSelectedReferral(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selectedReferral && (
                                <>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Referral Details</Text>
                                        <TouchableOpacity onPress={() => setSelectedReferral(null)}>
                                            <Text style={styles.closeBtn}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={[styles.badge, {
                                        alignSelf: 'flex-start',
                                        backgroundColor: (STATUS_COLORS[selectedReferral.status] || COLORS.border) + '25',
                                        marginBottom: SIZES.md,
                                    }]}>
                                        <Text style={[styles.badgeText, { color: STATUS_COLORS[selectedReferral.status] }]}>
                                            {selectedReferral.status.toUpperCase()}
                                        </Text>
                                    </View>
                                    <Text style={styles.detailLabel}>Alumni</Text>
                                    <Text style={styles.detailValue}>{selectedReferral.alumni?.name || '—'}</Text>
                                    {selectedReferral.alumni?.company && (
                                        <>
                                            <Text style={styles.detailLabel}>Company</Text>
                                            <Text style={styles.detailValue}>{selectedReferral.alumni.company}</Text>
                                        </>
                                    )}
                                    {selectedReferral.alumni?.domain && (
                                        <>
                                            <Text style={styles.detailLabel}>Domain</Text>
                                            <Text style={styles.detailValue}>{selectedReferral.alumni.domain}</Text>
                                        </>
                                    )}
                                    {(selectedReferral.jobTitle || selectedReferral.company) && (
                                        <>
                                            <Text style={styles.detailLabel}>Applied For</Text>
                                            <Text style={styles.detailValue}>
                                                {selectedReferral.jobTitle}{selectedReferral.company ? ` @ ${selectedReferral.company}` : ''}
                                            </Text>
                                        </>
                                    )}
                                    {selectedReferral.studentMessage ? (
                                        <>
                                            <Text style={styles.detailLabel}>Your Message</Text>
                                            <Text style={[styles.detailValue, { fontStyle: 'italic' }]}>
                                                "{selectedReferral.studentMessage}"
                                            </Text>
                                        </>
                                    ) : null}
                                    {selectedReferral.notes ? (
                                        <>
                                            <Text style={styles.detailLabel}>Notes from Alumni</Text>
                                            <Text style={styles.detailValue}>{selectedReferral.notes}</Text>
                                        </>
                                    ) : null}
                                    {selectedReferral.status === 'given' && (
                                        <View style={styles.successBox}>
                                            <Text style={styles.successNote}>
                                                🎉 Congratulations! Your referral has been given. Reach out to the alumni for next steps.
                                            </Text>
                                        </View>
                                    )}
                                    <Text style={styles.detailLabel}>Requested On</Text>
                                    <Text style={styles.detailValue}>
                                        {new Date(selectedReferral.createdAt).toLocaleDateString()}
                                    </Text>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: SIZES.lg, paddingTop: SIZES.xxl, flexDirection: 'row', alignItems: 'center', gap: SIZES.md },
    title: { fontSize: SIZES.fontXxl, fontWeight: 'bold', color: COLORS.foreground },
    pendingBadge: { backgroundColor: '#f59e0b', borderRadius: 12, paddingHorizontal: SIZES.sm, paddingVertical: 2 },
    pendingText: { color: '#fff', fontWeight: 'bold', fontSize: SIZES.fontSm },
    card: { marginBottom: SIZES.md, padding: SIZES.md },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: SIZES.sm },
    name: { fontSize: SIZES.fontLg, fontWeight: 'bold', color: COLORS.foreground },
    sub: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
    badge: { borderRadius: SIZES.radiusSm, paddingHorizontal: SIZES.sm, paddingVertical: 4 },
    badgeText: { fontSize: 11, fontWeight: 'bold' },
    jobInfo: { fontSize: SIZES.fontSm, color: COLORS.foreground, marginTop: SIZES.sm },
    message: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: SIZES.sm, fontStyle: 'italic' },
    skills: { fontSize: SIZES.fontSm, color: COLORS.primary, marginTop: SIZES.sm },
    actionsRow: { flexDirection: 'row', gap: SIZES.md, marginTop: SIZES.md },
    acceptBtn: { flex: 1, backgroundColor: '#22c55e20', borderRadius: SIZES.radiusMd, padding: SIZES.md, alignItems: 'center', borderWidth: 1, borderColor: '#22c55e' },
    acceptBtnText: { color: '#22c55e', fontWeight: 'bold' },
    rejectBtn: { flex: 1, backgroundColor: '#ef444420', borderRadius: SIZES.radiusMd, padding: SIZES.md, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
    rejectBtnText: { color: '#ef4444', fontWeight: 'bold' },
    successNote: { fontSize: SIZES.fontSm, color: '#22c55e', marginTop: SIZES.sm, fontWeight: '600' },
    resumeBtn: { marginTop: SIZES.sm, backgroundColor: COLORS.primary + '15', borderRadius: SIZES.radiusMd, padding: SIZES.sm, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary + '40' },
    resumeBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: SIZES.fontSm },
    date: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: SIZES.md },
    tapHint: { fontSize: SIZES.fontXs, color: COLORS.muted, marginTop: 4, textAlign: 'right' },
    emptyText: { textAlign: 'center', color: COLORS.muted, marginTop: 60 },
    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: SIZES.lg, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
    modalTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground },
    closeBtn: { fontSize: SIZES.fontXl, color: COLORS.muted, padding: SIZES.sm },
    detailLabel: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: SIZES.md, textTransform: 'uppercase', letterSpacing: 0.5 },
    detailValue: { fontSize: SIZES.fontMd, color: COLORS.foreground, marginTop: 2 },
    successBox: { backgroundColor: '#22c55e15', borderRadius: SIZES.radiusMd, padding: SIZES.md, marginTop: SIZES.md, borderWidth: 1, borderColor: '#22c55e40' },
});
