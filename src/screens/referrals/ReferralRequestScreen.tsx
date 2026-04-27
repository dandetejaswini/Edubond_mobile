import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, FlatList } from 'react-native';
import { COLORS, SIZES } from '../../constants/colors';
import { referralApi, userApi } from '../../services/api';

interface Alumni {
    _id: string;
    name: string;
    company: string;
    domain: string;
    matchScore?: number;
}

export const ReferralRequestScreen: React.FC<{ navigation: any, route: any }> = ({ navigation, route }) => {
    // Can be initialized from route params if navigating from alumni profile
    const preselectedAlumni: Alumni | null = route?.params?.alumni || null;

    const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(preselectedAlumni);
    const [jobTitle, setJobTitle] = useState('');
    const [company, setCompany] = useState(preselectedAlumni?.company || '');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchModal, setSearchModal] = useState(false);
    const [alumniList, setAlumniList] = useState<Alumni[]>([]);
    const [alumniLoading, setAlumniLoading] = useState(false);

    const loadAlumni = async () => {
        setAlumniLoading(true);
        setSearchModal(true);
        try {
            const res = await userApi.getAlumniRecommended();
            if (res?.recommendedAlumni) setAlumniList(res.recommendedAlumni);
        } catch (e) {
            console.error('Failed to load alumni', e);
        } finally {
            setAlumniLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedAlumni) {
            Alert.alert('Error', 'Please select an alumni');
            return;
        }
        if (!message.trim()) {
            Alert.alert('Error', 'Please add a message explaining why you want this referral');
            return;
        }

        setLoading(true);
        try {
            await referralApi.requestReferral({
                alumniId: selectedAlumni._id,
                jobTitle: jobTitle || undefined,
                company: company || selectedAlumni.company || undefined,
                studentMessage: message,
            });
            Alert.alert('Success! 🎉', 'Your referral request has been sent. The alumni will be notified.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to send request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Request a Referral</Text>
            <Text style={styles.subtitle}>Reach out to alumni for job referrals 🤝</Text>

            <View style={styles.field}>
                <Text style={styles.label}>Alumni *</Text>
                <TouchableOpacity style={styles.selectBtn} onPress={loadAlumni}>
                    {selectedAlumni ? (
                        <View>
                            <Text style={styles.selectedName}>{selectedAlumni.name}</Text>
                            <Text style={styles.selectedSub}>{selectedAlumni.company} • {selectedAlumni.domain}</Text>
                        </View>
                    ) : (
                        <Text style={styles.selectPlaceholder}>Tap to select an alumni →</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Job Title (optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Software Engineer"
                    placeholderTextColor={COLORS.muted}
                    value={jobTitle}
                    onChangeText={setJobTitle}
                />
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Company (optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Company name"
                    placeholderTextColor={COLORS.muted}
                    value={company}
                    onChangeText={setCompany}
                />
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Your Message *</Text>
                <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="Introduce yourself and explain why you're reaching out for a referral..."
                    placeholderTextColor={COLORS.muted}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                />
            </View>

            <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading}
            >
                <Text style={styles.submitText}>{loading ? 'Sending...' : '📩 Send Request'}</Text>
            </TouchableOpacity>

            {/* Alumni Selection Modal */}
            <Modal visible={searchModal} animationType="slide" onRequestClose={() => setSearchModal(false)}>
                <View style={styles.modal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Alumni</Text>
                        <TouchableOpacity onPress={() => setSearchModal(false)}>
                            <Text style={{ color: COLORS.primary, fontSize: SIZES.fontLg }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    {alumniLoading ? (
                        <Text style={styles.loadingText}>Finding best alumni matches for you...</Text>
                    ) : (
                        <FlatList
                            data={alumniList}
                            keyExtractor={item => item._id}
                            contentContainerStyle={{ padding: SIZES.md }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.alumniItem}
                                    onPress={() => {
                                        setSelectedAlumni(item);
                                        setCompany(item.company || '');
                                        setSearchModal(false);
                                    }}
                                >
                                    <Text style={styles.alumniName}>{item.name}</Text>
                                    <Text style={styles.alumniSub}>{item.company} • {item.domain}</Text>
                                    {item.matchScore !== undefined && item.matchScore > 0 && (
                                        <Text style={styles.matchScore}>Match: {item.matchScore} pts</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: SIZES.lg },
    title: { fontSize: SIZES.fontXxl, fontWeight: 'bold', color: COLORS.foreground, marginBottom: 4 },
    subtitle: { fontSize: SIZES.fontMd, color: COLORS.muted, marginBottom: SIZES.xl },
    field: { marginBottom: SIZES.lg },
    label: { fontSize: SIZES.fontMd, color: COLORS.foreground, fontWeight: '600', marginBottom: SIZES.sm },
    input: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusMd, padding: SIZES.md, color: COLORS.foreground, borderWidth: 1, borderColor: COLORS.border, fontSize: SIZES.fontMd },
    textarea: { minHeight: 120 },
    selectBtn: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusMd, padding: SIZES.md, borderWidth: 1, borderColor: COLORS.border, minHeight: 56, justifyContent: 'center' },
    selectPlaceholder: { color: COLORS.muted, fontSize: SIZES.fontMd },
    selectedName: { fontSize: SIZES.fontMd, fontWeight: 'bold', color: COLORS.foreground },
    selectedSub: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
    submitBtn: { backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg, padding: SIZES.lg, alignItems: 'center', marginTop: SIZES.md },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: SIZES.fontLg },
    modal: { flex: 1, backgroundColor: COLORS.background },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.lg, paddingTop: SIZES.xxl, borderBottomWidth: 1, borderColor: COLORS.border },
    modalTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground },
    loadingText: { textAlign: 'center', color: COLORS.muted, marginTop: SIZES.xxl },
    alumniItem: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusMd, padding: SIZES.md, marginBottom: SIZES.md, borderWidth: 1, borderColor: COLORS.border },
    alumniName: { fontSize: SIZES.fontLg, fontWeight: 'bold', color: COLORS.foreground },
    alumniSub: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
    matchScore: { fontSize: SIZES.fontSm, color: COLORS.primary, marginTop: SIZES.sm, fontWeight: '600' },
});
