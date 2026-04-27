import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiApi } from '../../services/api';
import { COLORS, SIZES } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const getChatKey = (userId?: string) => userId ? `edubond_ai_chat_history_${userId}` : 'edubond_ai_chat_history_guest';

export const AIChatScreen: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // Load persisted chat history
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const chatKey = getChatKey(user?._id);
                const saved = await AsyncStorage.getItem(chatKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
                } else {
                    // Welcome message
                    setMessages([{
                        id: '0',
                        role: 'assistant',
                        content: `Hi ${user?.name || 'there'}! 👋 I'm your EduBond AI assistant. Ask me anything about careers, skills, networking, or how to use the platform!`,
                        timestamp: new Date()
                    }]);
                }
            } catch (e) {
                console.error('Failed to load chat history', e);
            }
        };
        loadHistory();
    }, []);

    const saveHistory = async (msgs: AIMessage[]) => {
        try {
            const chatKey = getChatKey(user?._id);
            await AsyncStorage.setItem(chatKey, JSON.stringify(msgs.slice(-50))); // keep last 50 messages
        } catch (e) {
            console.error('Failed to save history', e);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: AIMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const response: any = await aiApi.chat(userMessage.content);
            const reply = response?.reply || response?.data?.message || "I couldn't process that. Please try again.";
            const aiMessage: AIMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: reply,
                timestamp: new Date()
            };
            const updatedMessages = [...newMessages, aiMessage];
            setMessages(updatedMessages);
            await saveHistory(updatedMessages);
        } catch (error) {
            const errMsg: AIMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Sorry, I couldn't connect. Please check your network and try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setLoading(false);
        }
    };

    const clearHistory = async () => {
        const chatKey = getChatKey(user?._id);
        await AsyncStorage.removeItem(chatKey);
        setMessages([{
            id: Date.now().toString(),
            role: 'assistant',
            content: `Chat cleared! How can I help you, ${user?.name || 'there'}?`,
            timestamp: new Date()
        }]);
    };

    const renderMessage = ({ item }: { item: AIMessage }) => (
        <View style={[styles.messageWrapper, item.role === 'user' && styles.userWrapper]}>
            {item.role === 'assistant' && (
                <View style={styles.avatar}><Text style={styles.avatarText}>🤖</Text></View>
            )}
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.messageText, item.role === 'user' && styles.userMessageText]}>
                    {item.content}
                </Text>
                <Text style={styles.timestamp}>
                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🤖 EduBond AI</Text>
                <TouchableOpacity onPress={clearHistory}>
                    <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {loading && (
                <View style={styles.typingIndicator}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.typingText}>AI is thinking...</Text>
                </View>
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Ask me anything..."
                    placeholderTextColor={COLORS.muted}
                    value={input}
                    onChangeText={setInput}
                    multiline
                    maxLength={500}
                    onSubmitEditing={handleSend}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.5 }]}
                    onPress={handleSend}
                    disabled={!input.trim() || loading}
                >
                    <Text style={styles.sendIcon}>➤</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.lg, borderBottomWidth: 1, borderColor: COLORS.border },
    headerTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground },
    clearText: { color: COLORS.muted, fontSize: SIZES.fontSm },
    messagesList: { padding: SIZES.md, gap: SIZES.sm },
    messageWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: SIZES.sm, marginBottom: SIZES.sm },
    userWrapper: { justifyContent: 'flex-end' },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 18 },
    bubble: { maxWidth: '78%', borderRadius: SIZES.radiusLg, padding: SIZES.md },
    aiBubble: { backgroundColor: COLORS.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
    userBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
    messageText: { fontSize: SIZES.fontMd, color: COLORS.foreground, lineHeight: 22 },
    userMessageText: { color: '#fff' },
    timestamp: { fontSize: 10, color: COLORS.muted, marginTop: 4, alignSelf: 'flex-end' },
    typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, padding: SIZES.sm, paddingHorizontal: SIZES.lg },
    typingText: { fontSize: SIZES.fontSm, color: COLORS.muted },
    inputContainer: { flexDirection: 'row', padding: SIZES.md, backgroundColor: COLORS.card, borderTopWidth: 1, borderColor: COLORS.border, alignItems: 'flex-end', gap: SIZES.sm },
    input: { flex: 1, backgroundColor: COLORS.background, borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, fontSize: SIZES.fontMd, color: COLORS.foreground, maxHeight: 100, borderWidth: 1, borderColor: COLORS.border },
    sendBtn: { backgroundColor: COLORS.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    sendIcon: { color: '#fff', fontSize: SIZES.fontLg },
});
