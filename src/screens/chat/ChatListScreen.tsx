import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { chatApi, userApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { COLORS, SIZES } from '../../constants/colors';
import { Chat } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const ChatListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewChat, setShowNewChat] = useState(false);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [userLoading, setUserLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async () => {
        try {
            const response: any = await chatApi.getChats();
            if (response?.chats) {
                setChats(response.chats);
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const openNewChatModal = async () => {
        setShowNewChat(true);
        setUserLoading(true);
        try {
            const res: any = await userApi.getAllUsers();
            if (res?.users) {
                setAllUsers(res.users.filter((u: any) => u._id !== user?._id));
            }
        } catch (e) {
            console.error('Failed to load users', e);
        } finally {
            setUserLoading(false);
        }
    };

    const handleStartChat = async (targetUser: any) => {
        setCreating(true);
        try {
            const res: any = await chatApi.createChat({
                participantIds: [targetUser._id],
                type: 'individual',
            });
            setShowNewChat(false);
            setUserSearch('');
            const chatId = res?.chat?._id || res?._id;
            if (chatId) {
                fetchChats();
                navigation.navigate('Chat', { chatId });
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to start chat');
        } finally {
            setCreating(false);
        }
    };

    const renderChat = ({ item }: { item: Chat }) => {
        const chatName = (item as any).name || 'Chat';
        return (
            <TouchableOpacity onPress={() => navigation.navigate('Chat', { chatId: item._id })}>
                <Card style={styles.chatCard}>
                    <Avatar name={chatName} size={50} />
                    <View style={styles.chatInfo}>
                        <Text style={styles.chatName}>{chatName}</Text>
                        <Text style={styles.lastMessage} numberOfLines={1}>
                            {item.lastMessage || 'No messages yet'}
                        </Text>
                    </View>
                    {item.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{item.unreadCount}</Text>
                        </View>
                    )}
                </Card>
            </TouchableOpacity>
        );
    };

    const filteredUsers = allUsers.filter(u =>
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );

    if (loading) return <LoadingSpinner />;

    return (
        <View style={styles.container}>
            <FlatList
                data={chats}
                renderItem={renderChat}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>💬</Text>
                        <Text style={styles.emptyText}>No chats yet</Text>
                        <Text style={styles.emptySubText}>Tap the button below to start a conversation</Text>
                    </View>
                }
            />

            {/* Floating New Chat Button */}
            <TouchableOpacity style={styles.fab} onPress={openNewChatModal}>
                <Text style={styles.fabText}>✏️</Text>
            </TouchableOpacity>

            {/* New Chat Modal */}
            <Modal visible={showNewChat} animationType="slide" onRequestClose={() => { setShowNewChat(false); setUserSearch(''); }}>
                <View style={styles.modal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>New Message</Text>
                        <TouchableOpacity onPress={() => { setShowNewChat(false); setUserSearch(''); }}>
                            <Text style={styles.closeBtn}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.searchBox}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name or email..."
                            placeholderTextColor={COLORS.muted}
                            value={userSearch}
                            onChangeText={setUserSearch}
                            autoFocus
                        />
                    </View>
                    {userLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={styles.loadingText}>Loading users...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredUsers}
                            keyExtractor={u => u._id}
                            contentContainerStyle={{ padding: SIZES.md }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.userRow}
                                    onPress={() => handleStartChat(item)}
                                    disabled={creating}
                                >
                                    <Avatar name={item.name} size={44} />
                                    <View style={styles.userInfo}>
                                        <Text style={styles.userName}>{item.name}</Text>
                                        <Text style={styles.userRole}>
                                            {item.role} • {item.institution || item.company || item.email}
                                        </Text>
                                    </View>
                                    {creating ? (
                                        <ActivityIndicator size="small" color={COLORS.primary} />
                                    ) : (
                                        <Text style={styles.chatStartIcon}>›</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No users found</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    list: {
        padding: SIZES.md,
        paddingBottom: 80,
    },
    chatCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SIZES.md,
    },
    chatInfo: {
        flex: 1,
        marginLeft: SIZES.md,
    },
    chatName: {
        fontSize: SIZES.fontLg,
        fontWeight: '600',
        color: COLORS.foreground,
    },
    lastMessage: {
        fontSize: SIZES.fontSm,
        color: COLORS.muted,
        marginTop: SIZES.xs,
    },
    unreadBadge: {
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.radiusFull,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadText: {
        color: COLORS.white,
        fontSize: SIZES.fontXs,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: SIZES.xxl,
    },
    emptyIcon: { fontSize: 40, marginBottom: SIZES.md },
    emptyText: {
        fontSize: SIZES.fontLg,
        color: COLORS.muted,
    },
    emptySubText: {
        fontSize: SIZES.fontSm,
        color: COLORS.muted,
        marginTop: SIZES.sm,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    fabText: { fontSize: 22 },
    modal: { flex: 1, backgroundColor: COLORS.background },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SIZES.lg,
        paddingTop: SIZES.xxl,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground },
    closeBtn: { fontSize: SIZES.fontXl, color: COLORS.muted, padding: SIZES.sm },
    searchBox: {
        padding: SIZES.md,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    searchInput: {
        backgroundColor: COLORS.background,
        borderRadius: SIZES.radiusMd,
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.sm,
        fontSize: SIZES.fontMd,
        color: COLORS.foreground,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SIZES.md },
    loadingText: { color: COLORS.muted, fontSize: SIZES.fontMd },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SIZES.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: SIZES.md,
    },
    userInfo: { flex: 1 },
    userName: { fontSize: SIZES.fontMd, fontWeight: '600', color: COLORS.foreground },
    userRole: { fontSize: SIZES.fontSm, color: COLORS.muted, marginTop: 2, textTransform: 'capitalize' },
    chatStartIcon: { fontSize: 22, color: COLORS.muted, fontWeight: 'bold' },
});
