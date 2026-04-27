import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { alumniApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { COLORS, SIZES } from '../../constants/colors';
import { AlumniGroup } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AlumniGroupsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [groups, setGroups] = useState<AlumniGroup[]>([]);
    const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [allRes, myRes]: any[] = await Promise.all([
                alumniApi.getGroups(),
                alumniApi.getMyGroups().catch(() => ({ groups: [] })),
            ]);

            const allGroups: AlumniGroup[] = allRes?.groups || [];
            const myGroups: AlumniGroup[] = myRes?.groups || [];
            const joinedIds = new Set(myGroups.map((g: any) => g._id));
            setMyGroupIds(joinedIds as Set<string>);

            // Sort: institution's group first, then rest
            const inst = user?.institution?.toLowerCase() || '';
            const sorted = [...allGroups].sort((a, b) => {
                const aMatch = (a.institution || '').toLowerCase().includes(inst);
                const bMatch = (b.institution || '').toLowerCase().includes(inst);
                if (aMatch && !bMatch) return -1;
                if (!aMatch && bMatch) return 1;
                return 0;
            });

            setGroups(sorted);

            // Auto-create a group for the user's institution if none exists
            if (user?.institution && inst) {
                const hasInstGroup = allGroups.some(g =>
                    (g.institution || '').toLowerCase().includes(inst)
                );
                if (!hasInstGroup) {
                    autoCreateInstGroup();
                }
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const autoCreateInstGroup = async () => {
        if (!user?.institution || creating) return;
        setCreating(true);
        try {
            await alumniApi.createGroup({
                name: `${user.institution} Alumni Network`,
                year: new Date().getFullYear(),
                description: `Official alumni network for ${user.institution}`,
                institution: user.institution,
            });
            // Reload after creating
            const res: any = await alumniApi.getGroups();
            if (res?.groups) {
                const inst = user.institution.toLowerCase();
                const sorted = [...res.groups].sort((a: any, b: any) => {
                    const aM = (a.institution || '').toLowerCase().includes(inst);
                    const bM = (b.institution || '').toLowerCase().includes(inst);
                    if (aM && !bM) return -1;
                    if (!aM && bM) return 1;
                    return 0;
                });
                setGroups(sorted);
            }
        } catch (e) {
            // Group may already exist; ignore errors
        } finally {
            setCreating(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleJoinGroup = async (groupId: string) => {
        try {
            await alumniApi.joinGroup(groupId);
            setMyGroupIds(prev => new Set([...prev, groupId]));
            Alert.alert('Joined!', 'You have joined the group.');
        } catch (error: any) {
            Alert.alert('Info', error?.message || 'Could not join group');
        }
    };

    const handleLeaveGroup = async (groupId: string) => {
        try {
            await alumniApi.leaveGroup(groupId);
            setMyGroupIds(prev => {
                const next = new Set(prev);
                next.delete(groupId);
                return next;
            });
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Could not leave group');
        }
    };

    const renderGroup = ({ item }: { item: AlumniGroup }) => {
        const isMine = myGroupIds.has(item._id);
        const isMyInstitution = user?.institution &&
            (item.institution || '').toLowerCase().includes(user.institution.toLowerCase());
        return (
            <Card style={styles.groupCard}>
                {isMyInstitution && (
                    <View style={styles.myInstBadge}>
                        <Text style={styles.myInstBadgeText}>Your Institution</Text>
                    </View>
                )}
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupInfo}>{item.institution} • {item.year}</Text>
                <Text style={styles.groupMembers}>
                    {(item as any).memberCount ?? item.members?.length ?? 0} members
                </Text>
                {item.description ? (
                    <Text style={styles.groupDescription} numberOfLines={2}>{item.description}</Text>
                ) : null}
                {isMine ? (
                    <View style={{ flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md }}>
                        <Button
                            title="Open Chat"
                            variant="primary"
                            onPress={() => navigation.navigate('GroupChat', { groupId: item._id, groupName: item.name })}
                            style={{ flex: 1 }}
                        />
                        <Button
                            title="Leave Group"
                            variant="secondary"
                            onPress={() => handleLeaveGroup(item._id)}
                            style={{ flex: 1 }}
                        />
                    </View>
                ) : (
                    <Button
                        title="Join Group"
                        variant="primary"
                        onPress={() => handleJoinGroup(item._id)}
                        style={styles.button}
                    />
                )}
            </Card>
        );
    };

    if (loading) return <LoadingSpinner />;

    return (
        <View style={styles.container}>
            <FlatList
                data={groups}
                renderItem={renderGroup}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No alumni groups found</Text>
                        {user?.institution && (
                            <Button
                                title={`Create ${user.institution} Group`}
                                variant="primary"
                                onPress={autoCreateInstGroup}
                                style={{ marginTop: SIZES.md }}
                            />
                        )}
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    list: { padding: SIZES.md },
    groupCard: { marginBottom: SIZES.md },
    myInstBadge: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.primary + '20',
        borderRadius: 8,
        paddingHorizontal: SIZES.sm,
        paddingVertical: 2,
        marginBottom: SIZES.xs,
        borderWidth: 1,
        borderColor: COLORS.primary + '40',
    },
    myInstBadgeText: { fontSize: 11, color: COLORS.primary, fontWeight: 'bold' },
    groupName: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground },
    groupInfo: { fontSize: SIZES.fontMd, color: COLORS.primary, marginTop: SIZES.xs },
    groupDescription: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: SIZES.xs, lineHeight: 18 },
    groupMembers: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: SIZES.xs },
    button: { marginTop: SIZES.md },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: SIZES.xxl },
    emptyText: { fontSize: SIZES.fontLg, color: COLORS.muted },
});
