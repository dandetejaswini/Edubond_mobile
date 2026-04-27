import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { aiApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { COLORS, SIZES } from '../../constants/colors';

interface ChatMessage {
    _id: string;
    text: string;
    isBot: boolean;
}

export const AIChatbotScreen: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { _id: '1', text: 'Hello! I am EduBond AI. How can I assist you with platform features today?', isBot: true }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: ChatMessage = { _id: Date.now().toString(), text: input.trim(), isBot: false };
        setMessages(prev => [userMsg, ...prev]);
        setInput('');
        setLoading(true);

        try {
            const res: any = await aiApi.chat(userMsg.text);
            const botReply: ChatMessage = {
                _id: (Date.now() + 1).toString(),
                text: res.reply || 'I could not process that at the moment.',
                isBot: true
            };
            setMessages(prev => [botReply, ...prev]);
        } catch (error) {
            console.error('AI Chat Error:', error);
            setMessages(prev => [
                { _id: (Date.now() + 1).toString(), text: 'Sorry, I encountered an error.', isBot: true },
                ...prev
            ]);
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        return (
            <View style={[styles.messageContainer, !item.isBot && styles.myMessageContainer]}>
                <View style={[styles.messageBubble, !item.isBot && styles.myMessageBubble]}>
                    <Text style={[styles.messageText, !item.isBot && styles.myMessageText]}>
                        {item.text}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
        >
            <View style={styles.header}>
                <Text style={styles.title}>EduBond Assistant 🤖</Text>
            </View>
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
                    placeholder="Ask about platform features..."
                    placeholderTextColor={COLORS.muted}
                    value={input}
                    onChangeText={setInput}
                    multiline
                />
                <Button title="Send" onPress={handleSend} loading={loading} size="sm" />
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: SIZES.md, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border, alignItems: 'center' },
    title: { fontSize: SIZES.fontLg, fontWeight: 'bold', color: COLORS.primary },
    messagesList: { padding: SIZES.md },
    messageContainer: { marginBottom: SIZES.md, alignItems: 'flex-start' },
    myMessageContainer: { alignItems: 'flex-end' },
    messageBubble: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: SIZES.md, maxWidth: '80%', borderWidth: 1, borderColor: COLORS.border },
    myMessageBubble: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    messageText: { fontSize: SIZES.fontMd, color: COLORS.foreground, lineHeight: 22 },
    myMessageText: { color: COLORS.white },
    inputContainer: { flexDirection: 'row', padding: SIZES.md, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, alignItems: 'center', gap: SIZES.sm },
    input: { flex: 1, backgroundColor: COLORS.backgroundLight, borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, fontSize: SIZES.fontMd, color: COLORS.foreground, maxHeight: 100 },
});
