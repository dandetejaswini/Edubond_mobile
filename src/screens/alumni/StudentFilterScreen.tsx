import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { COLORS, SIZES } from '../../constants/colors';
import { studentFilterApi } from '../../services/api';
import { User } from '../../types';

export const StudentFilterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filters, setFilters] = useState<{ domains: string[]; batches: string[]; skills: string[] }>({
        domains: [], batches: [], skills: [],
    });

    const [search, setSearch] = useState('');
    const [selectedSkills, setSelectedSkills] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');

    const fetchStudents = useCallback(async () => {
        try {
            const params: any = {};
            if (search.trim()) params.search = search.trim();
            if (selectedSkills.trim()) params.skills = selectedSkills.trim();
            if (selectedDomain) params.domain = selectedDomain;
            if (selectedBatch) params.batch = selectedBatch;

            const res: any = await studentFilterApi.filterStudents(params);
            setStudents(res.students || []);
            if (res.filters) setFilters(res.filters);
        } catch (e) {
            console.error('Failed to filter students', e);
        }
    }, [search, selectedSkills, selectedDomain, selectedBatch]);

    useEffect(() => {
        setLoading(true);
        fetchStudents().finally(() => setLoading(false));
    }, [fetchStudents]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchStudents();
        setRefreshing(false);
    };

    const renderStudent = ({ item }: { item: User }) => {
        const allSkills = [...(item.skills || []), ...(item.extractedSkills || [])];
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                    </View>
                    <View style={styles.info}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.institution}>{item.institution}</Text>
                        {item.domain && <Text style={styles.domain}>{item.domain}</Text>}
                        {item.batch && <Text style={styles.batch}>Batch: {item.batch}</Text>}
                    </View>
                </View>
                {allSkills.length > 0 && (
                    <View style={styles.skillsRow}>
                        {allSkills.slice(0, 5).map((s, i) => (
                            <View key={i} style={styles.skillChip}>
                                <Text style={styles.skillText}>{s}</Text>
                            </View>
                        ))}
                        {allSkills.length > 5 && (
                            <Text style={styles.moreSkills}>+{allSkills.length - 5}</Text>
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Filter Students</Text>
            </View>

            {/* Search */}
            <View style={styles.searchBox}>
                <TextInput style={styles.searchInput} placeholder="Search by name or institution…"
                    placeholderTextColor={COLORS.muted} value={search} onChangeText={setSearch} />
            </View>

            {/* Skill input */}
            <View style={styles.skillInput}>
                <TextInput style={styles.searchInput}
                    placeholder="Filter by skills (comma-separated)…"
                    placeholderTextColor={COLORS.muted} value={selectedSkills}
                    onChangeText={setSelectedSkills} />
            </View>

            {/* Domain filter */}
            {filters.domains.length > 0 && (
                <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Domain</Text>
                    <FlatList horizontal data={['All', ...filters.domains]}
                        keyExtractor={i => i} showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.chip, (item === 'All' ? !selectedDomain : selectedDomain === item) && styles.chipActive]}
                                onPress={() => setSelectedDomain(item === 'All' ? '' : item)}>
                                <Text style={[styles.chipText, (item === 'All' ? !selectedDomain : selectedDomain === item) && styles.chipTextActive]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )} />
                </View>
            )}

            {/* Batch filter */}
            {filters.batches.length > 0 && (
                <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Batch</Text>
                    <FlatList horizontal data={['All', ...filters.batches]}
                        keyExtractor={i => i} showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.chip, (item === 'All' ? !selectedBatch : selectedBatch === item) && styles.chipActive]}
                                onPress={() => setSelectedBatch(item === 'All' ? '' : item)}>
                                <Text style={[styles.chipText, (item === 'All' ? !selectedBatch : selectedBatch === item) && styles.chipTextActive]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )} />
                </View>
            )}

            <Text style={styles.resultCount}>{students.length} student{students.length !== 1 ? 's' : ''} found</Text>

            {loading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={students}
                    keyExtractor={item => item._id}
                    renderItem={renderStudent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No students match your filters</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: SIZES.lg, paddingTop: SIZES.xl, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground },
    searchBox: { padding: SIZES.md, paddingBottom: 0 },
    skillInput: { padding: SIZES.md, paddingBottom: 0 },
    searchInput: {
        backgroundColor: COLORS.card, borderRadius: SIZES.radiusMd, padding: SIZES.md,
        color: COLORS.foreground, borderWidth: 1, borderColor: COLORS.border, fontSize: SIZES.fontMd,
    },
    filterSection: { paddingHorizontal: SIZES.md, paddingTop: SIZES.sm },
    filterLabel: { fontSize: SIZES.fontSm, color: COLORS.muted, fontWeight: '600', marginBottom: SIZES.xs },
    chip: {
        paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs, borderRadius: 20,
        borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background, marginRight: SIZES.xs,
    },
    chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipText: { fontSize: SIZES.fontSm, color: COLORS.muted },
    chipTextActive: { color: '#fff', fontWeight: '600' },
    resultCount: { fontSize: SIZES.fontSm, color: COLORS.muted, paddingHorizontal: SIZES.lg, paddingVertical: SIZES.sm },
    card: {
        backgroundColor: COLORS.card, margin: SIZES.md, marginTop: 0,
        borderRadius: SIZES.radiusMd, padding: SIZES.md,
        borderWidth: 1, borderColor: COLORS.border,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    avatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: SIZES.md,
    },
    avatarText: { color: '#fff', fontSize: SIZES.fontLg, fontWeight: 'bold' },
    info: { flex: 1 },
    name: { fontSize: SIZES.fontMd, fontWeight: '700', color: COLORS.foreground },
    institution: { fontSize: SIZES.fontSm, color: COLORS.muted },
    domain: { fontSize: SIZES.fontSm, color: COLORS.primary },
    batch: { fontSize: SIZES.fontSm, color: COLORS.muted },
    skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.xs, marginTop: SIZES.sm },
    skillChip: { backgroundColor: COLORS.primary + '20', borderRadius: 10, paddingHorizontal: SIZES.sm, paddingVertical: 2 },
    skillText: { fontSize: 11, color: COLORS.primary },
    moreSkills: { fontSize: 11, color: COLORS.muted, alignSelf: 'center' },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    listContent: { paddingBottom: SIZES.xxl },
    empty: { padding: SIZES.xl, alignItems: 'center' },
    emptyText: { fontSize: SIZES.fontMd, color: COLORS.muted },
});
