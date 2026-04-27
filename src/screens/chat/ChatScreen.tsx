import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { io } from 'socket.io-client';
import { chatApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { COLORS, SIZES } from '../../constants/colors';
import { Message } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const ChatScreen: React.FC<{ route: any }> = ({ route }) => {
    const { chatId } = route.params;
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchMessages();

        if (user?._id) {
            const socket = io(process.env.EXPO_PUBLIC_API_URL || 'http://192.168.10.35:8000');

            socket.on('connect', () => {
                socket.emit('join_user_room', user._id);
            });

            socket.on('receive_message', (newMsg: Message) => {
                if (newMsg.chatId === chatId) {
                    setMessages(prev => [newMsg, ...prev]);
                }
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [chatId, user?._id]);

    const fetchMessages = async () => {
        try {
            const response: any = await chatApi.getChatMessages(chatId);
            if (response.messages) {
                // messages from backend are chronological. Reverse for inverted FlatList
                setMessages([...response.messages].reverse());
            } else if (response.success && response.data) {
                setMessages([...response.data].reverse());
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!message.trim()) return;

        const content = message.trim();
        setSending(true);
        setMessage('');
        try {
            const res: any = await chatApi.sendMessage(chatId, content);
            // Immediately add sent message to state without waiting for socket roundtrip
            if (res?.data) {
                setMessages(prev => [res.data, ...prev]);
            } else {
                // Fallback: construct message locally so it appears right away
                setMessages(prev => [{
                    _id: Date.now().toString(),
                    sender: user?._id || '',
                    senderName: user?.name || '',
                    content,
                    createdAt: new Date().toISOString(),
                } as any, ...prev]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessage(content); // Restore message on failure
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMyMessage = item.sender === user?._id;
        return (
            <View style={[styles.messageContainer, isMyMessage && styles.myMessageContainer]}>
                <View style={[styles.messageBubble, isMyMessage && styles.myMessageBubble]}>
                    <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
                        {item.content}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) return <LoadingSpinner />;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
        >
            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.messagesList}
                inverted
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    placeholderTextColor={COLORS.muted}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                />
                <Button title="Send" onPress={handleSend} loading={sending} size="sm" />
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    messagesList: {
        padding: SIZES.md,
    },
    messageContainer: {
        marginBottom: SIZES.md,
        alignItems: 'flex-start',
    },
    myMessageContainer: {
        alignItems: 'flex-end',
    },
    messageBubble: {
        backgroundColor: COLORS.card,
        borderRadius: SIZES.radiusLg,
        padding: SIZES.md,
        maxWidth: '80%',
    },
    myMessageBubble: {
        backgroundColor: COLORS.primary,
    },
    messageText: {
        fontSize: SIZES.fontMd,
        color: COLORS.foreground,
    },
    myMessageText: {
        color: COLORS.white,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: SIZES.md,
        backgroundColor: COLORS.card,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        alignItems: 'center',
        gap: SIZES.sm,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
        borderRadius: SIZES.radiusMd,
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.sm,
        fontSize: SIZES.fontMd,
        color: COLORS.foreground,
        maxHeight: 100,
    },
});
