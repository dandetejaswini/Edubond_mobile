import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { alumniApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { COLORS, SIZES } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

export const GroupChatScreen: React.FC<{ route: any, navigation: any }> = ({ route, navigation }) => {
    const { groupId, groupName } = route.params;
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        const fetchMessages = async () => {
            try {
                const res: any = await alumniApi.getGroupMessages(groupId);
                if (res?.messages && isMounted) {
                    setMessages(res.messages.reverse()); // FlatList inverted expects newest first
                }
            } catch (error) {
                console.error('Failed to load group messages:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchMessages();
        
        // Simple polling for now (in production, use Socket.io as shown in backend)
        const interval = setInterval(fetchMessages, 5000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [groupId]);

    const handleSend = async () => {
        if (!input.trim() || sending) return;

        const content = input.trim();
        setInput('');
        setSending(true);

        try {
            const res: any = await alumniApi.sendGroupMessage(groupId, content);
            if (res?.message) {
                // Optimistically add to UI
                setMessages(prev => [res.message, ...prev]);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMine = item.sender?._id === user?._id;
        
        return (
            <View style={[styles.messageContainer, isMine && styles.myMessageContainer]}>
                {!isMine && <Text style={styles.senderName}>{item.sender?.name}</Text>}
                <View style={[styles.messageBubble, isMine && styles.myMessageBubble]}>
                    <Text style={[styles.messageText, isMine && styles.myMessageText]}>
                        {item.content || item.text}
                    </Text>
                </View>
                <Text style={styles.timeText}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item._id || Math.random().toString()}
                contentContainerStyle={styles.messagesList}
                inverted
                showsVerticalScrollIndicator={false}
            />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    placeholderTextColor={COLORS.muted}
                    value={input}
                    onChangeText={setInput}
                    multiline
                />
                <Button title="Send" onPress={handleSend} loading={sending} size="sm" />
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    messagesList: { padding: SIZES.md },
    messageContainer: { marginBottom: SIZES.md, alignItems: 'flex-start', maxWidth: '85%' },
    myMessageContainer: { alignItems: 'flex-end', alignSelf: 'flex-end' },
    senderName: { fontSize: SIZES.fontXs, color: COLORS.muted, marginBottom: 4, marginLeft: 4 },
    messageBubble: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: SIZES.md, borderWidth: 1, borderColor: COLORS.border },
    myMessageBubble: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    messageText: { fontSize: SIZES.fontMd, color: COLORS.foreground },
    myMessageText: { color: COLORS.white },
    timeText: { fontSize: 10, color: COLORS.muted, marginTop: 4, alignSelf: 'flex-end' },
    inputContainer: { flexDirection: 'row', padding: SIZES.md, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, alignItems: 'center', gap: SIZES.sm },
    input: { flex: 1, backgroundColor: COLORS.backgroundLight, borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, fontSize: SIZES.fontMd, color: COLORS.foreground, maxHeight: 100 },
});
