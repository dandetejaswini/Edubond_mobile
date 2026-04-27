import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, SectionList, RefreshControl,
} from 'react-native';
import { COLORS, SIZES } from '../../constants/colors';
import { alumniDirectoryApi, chatApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

interface DirectoryFilters {
    companies: string[];
    domains: string[];
    batches: string[];
    exams: string[];
}

interface BatchSection {
    batch: string;
    members: User[];
}

export const AlumniDirectoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [sections, setSections] = useState<BatchSection[]>([]);
    const [filters, setFilters] = useState<DirectoryFilters>({ companies: [], domains: [], batches: [], exams: [] });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const fetchDirectory = useCallback(async () => {
        try {
            const params: any = {};
            if (selectedCompany) params.company = selectedCompany;
            if (selectedDomain) params.domain = selectedDomain;
            if (selectedBatch) params.batch = selectedBatch;
            if (selectedExam) params.examsWritten = selectedExam;

            const res: any = await alumniDirectoryApi.getDirectory(params);
            setSections(res.batchWiseAlumni || []);
            if (res.filters) setFilters(res.filters);
        } catch (e) {
            console.error('Failed to load alumni directory', e);
        }
    }, [selectedCompany, selectedDomain, selectedBatch, selectedExam]);

    useEffect(() => {
        setLoading(true);
        fetchDirectory().finally(() => setLoading(false));
    }, [fetchDirectory]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchDirectory();
        setRefreshing(false);
    };

    const clearFilters = () => {
        setSelectedCompany('');
        setSelectedDomain('');
        setSelectedBatch('');
        setSelectedExam('');
    };

    const handleMessageAlumni = async (alumni: User) => {
        try {
            const res: any = await chatApi.createChat({
                participantIds: [alumni._id],
                type: 'individual',
            });
            if (res?.chat?._id) {
                navigation.navigate('Chats', { screen: 'Chat', params: { chatId: res.chat._id } });
            }
        } catch (e) {
            console.error('Failed to create chat', e);
        }
    };

    const hasFilters = selectedCompany || selectedDomain || selectedBatch || selectedExam;

    const renderAlumniCard = ({ item }: { item: User }) => (
        <View style={styles.alumniCard}>
            <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </View>
            <View style={styles.alumniInfo}>
                <Text style={styles.alumniName}>{item.name}</Text>
                {item.company && <Text style={styles.alumniCompany}>{item.company}</Text>}
                {item.domain && <Text style={styles.alumniDomain}>{item.domain}</Text>}
                {item.examsWritten && item.examsWritten.length > 0 && (
                    <View style={styles.examTags}>
                        {item.examsWritten.map((exam, i) => (
                            <View key={i} style={styles.examTag}>
                                <Text style={styles.examTagText}>{exam}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
            {user?.role === 'student' && (
                <TouchableOpacity style={styles.messageBtn} onPress={() => handleMessageAlumni(item)}>
                    <Text style={styles.messageBtnText}>Message</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderSectionHeader = ({ section }: { section: { title: string; count: number } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Batch {section.title}</Text>
            <Text style={styles.sectionCount}>{section.count} alumni</Text>
        </View>
    );

    const sectionListData = sections.map(s => ({
        title: s.batch,
        count: s.members.length,
        data: s.members,
    }));

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Alumni Directory</Text>
                <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterToggle}>
                    <Text style={styles.filterToggleText}>
                        {showFilters ? 'Hide Filters' : 'Filters'} {hasFilters ? '●' : ''}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Filters */}
            {showFilters && (
                <View style={styles.filtersPanel}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {/* Batch */}
                        <View style={styles.filterGroup}>
                            <Text style={styles.filterLabel}>Batch</Text>
                            <View style={styles.filterChips}>
                                <TouchableOpacity
                                    style={[styles.chip, !selectedBatch && styles.chipActive]}
                                    onPress={() => setSelectedBatch('')}>
                                    <Text style={[styles.chipText, !selectedBatch && styles.chipTextActive]}>All</Text>
                                </TouchableOpacity>
                                {filters.batches.map(b => (
                                    <TouchableOpacity key={b}
                                        style={[styles.chip, selectedBatch === b && styles.chipActive]}
                                        onPress={() => setSelectedBatch(selectedBatch === b ? '' : b)}>
                                        <Text style={[styles.chipText, selectedBatch === b && styles.chipTextActive]}>{b}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {/* Domain */}
                        <View style={styles.filterGroup}>
                            <Text style={styles.filterLabel}>Domain</Text>
                            <View style={styles.filterChips}>
                                <TouchableOpacity
                                    style={[styles.chip, !selectedDomain && styles.chipActive]}
                                    onPress={() => setSelectedDomain('')}>
                                    <Text style={[styles.chipText, !selectedDomain && styles.chipTextActive]}>All</Text>
                                </TouchableOpacity>
                                {filters.domains.map(d => (
                                    <TouchableOpacity key={d}
                                        style={[styles.chip, selectedDomain === d && styles.chipActive]}
                                        onPress={() => setSelectedDomain(selectedDomain === d ? '' : d)}>
                                        <Text style={[styles.chipText, selectedDomain === d && styles.chipTextActive]}>{d}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {/* Company */}
                        <View style={styles.filterGroup}>
                            <Text style={styles.filterLabel}>Company</Text>
                            <View style={styles.filterChips}>
                                <TouchableOpacity
                                    style={[styles.chip, !selectedCompany && styles.chipActive]}
                                    onPress={() => setSelectedCompany('')}>
                                    <Text style={[styles.chipText, !selectedCompany && styles.chipTextActive]}>All</Text>
                                </TouchableOpacity>
                                {filters.companies.map(c => (
                                    <TouchableOpacity key={c}
                                        style={[styles.chip, selectedCompany === c && styles.chipActive]}
                                        onPress={() => setSelectedCompany(selectedCompany === c ? '' : c)}>
                                        <Text style={[styles.chipText, selectedCompany === c && styles.chipTextActive]}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    {hasFilters && (
                        <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
                            <Text style={styles.clearButtonText}>Clear All Filters</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading alumni directory…</Text>
                </View>
            ) : sectionListData.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🎓</Text>
                    <Text style={styles.emptyTitle}>No alumni found</Text>
                    <Text style={styles.emptyText}>Try adjusting your filters</Text>
                </View>
            ) : (
                <SectionList
                    sections={sectionListData}
                    keyExtractor={(item) => item._id}
                    renderItem={renderAlumniCard}
                    renderSectionHeader={renderSectionHeader}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    contentContainerStyle={styles.listContent}
                    stickySectionHeadersEnabled
                />
            )}
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
    filterToggle: { backgroundColor: COLORS.primary + '20', paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusMd },
    filterToggleText: { fontSize: SIZES.fontSm, color: COLORS.primary, fontWeight: '600' },
    filtersPanel: {
        backgroundColor: COLORS.card, padding: SIZES.md,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    filterGroup: { marginBottom: SIZES.sm },
    filterLabel: { fontSize: SIZES.fontSm, color: COLORS.muted, fontWeight: '600', marginBottom: SIZES.xs },
    filterChips: { flexDirection: 'row', gap: SIZES.xs },
    chip: {
        paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs,
        borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipText: { fontSize: SIZES.fontSm, color: COLORS.muted },
    chipTextActive: { color: '#fff', fontWeight: '600' },
    clearButton: { alignSelf: 'flex-end', marginTop: SIZES.xs },
    clearButtonText: { fontSize: SIZES.fontSm, color: COLORS.error },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: COLORS.backgroundLight, paddingHorizontal: SIZES.lg, paddingVertical: SIZES.sm,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    sectionTitle: { fontSize: SIZES.fontMd, fontWeight: '700', color: COLORS.foreground },
    sectionCount: { fontSize: SIZES.fontSm, color: COLORS.muted },
    alumniCard: {
        flexDirection: 'row', alignItems: 'flex-start',
        backgroundColor: COLORS.card, marginHorizontal: SIZES.md, marginTop: SIZES.sm,
        borderRadius: SIZES.radiusMd, padding: SIZES.md,
        borderWidth: 1, borderColor: COLORS.border,
    },
    avatarCircle: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
        marginRight: SIZES.md,
    },
    avatarText: { color: '#fff', fontSize: SIZES.fontLg, fontWeight: 'bold' },
    alumniInfo: { flex: 1 },
    alumniName: { fontSize: SIZES.fontMd, fontWeight: '700', color: COLORS.foreground },
    alumniCompany: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2 },
    alumniDomain: { fontSize: SIZES.fontSm, color: COLORS.primary, marginTop: 2 },
    examTags: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.xs, marginTop: SIZES.xs },
    examTag: { backgroundColor: '#e8f5e9', borderRadius: 10, paddingHorizontal: SIZES.sm, paddingVertical: 2 },
    examTagText: { fontSize: 11, color: '#388e3c' },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { color: COLORS.muted, marginTop: SIZES.md },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SIZES.xl },
    emptyIcon: { fontSize: 48, marginBottom: SIZES.md },
    emptyTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground },
    emptyText: { fontSize: SIZES.fontMd, color: COLORS.muted, marginTop: SIZES.sm },
    listContent: { paddingBottom: SIZES.xxl },
    messageBtn: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.sm,
        borderRadius: SIZES.radiusMd,
        alignSelf: 'center',
    },
    messageBtnText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: SIZES.fontSm,
    },
});
