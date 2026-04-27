import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
// import { userApi, connectionApi } from '../../services/api';
import { userApi, connectionApi, chatApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { COLORS, SIZES } from '../../constants/colors';
import { Mentor } from '../../types';

export const MentorDetailScreen: React.FC<{ route: any; navigation: any }> = ({
    route,
    navigation,
}) => {
    const { mentorId } = route.params;
    const [mentor, setMentor] = useState<Mentor | null>(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        fetchMentorDetails();
    }, [mentorId]);

    const fetchMentorDetails = async () => {
        try {
            // const response: any = await userApi.getMentorById(mentorId);
            // if (response.success && response.data) {
            //     setMentor(response.data);
            // }
            const response: any = await userApi.getMentorById(mentorId);
            const mentorData = response?.data || response?.mentor || (response?._id ? response : null);
            if (mentorData) {
                setMentor(mentorData);
            }
        } catch (error) {
            console.error('Error fetching mentor:', error);
            Alert.alert('Error', 'Failed to load mentor details');
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        setConnecting(true);
        try {
            await connectionApi.sendRequest(mentorId);
            Alert.alert('Success', 'Connection request sent!');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send connection request');
        } finally {
            setConnecting(false);
        }
    };
    //--newly added
    const handleMessage = async () => {
        setChatLoading(true);
        try {
            // Try all known payload shapes the backend might accept
            let response: any = null;
            let lastError: any = null;

            const payloads = [
                { participantIds: [mentorId], type: 'individual' },
                { participants: [mentorId], type: 'individual' },
                { participantId: mentorId, type: 'individual' },
                { participantIds: [mentorId] },
                { participants: [mentorId] },
                { userId: mentorId },
            ];

            for (const payload of payloads) {
                try {
                    response = await chatApi.createChat(payload);
                    console.log('createChat success with payload:', JSON.stringify(payload));
                    console.log('createChat response:', JSON.stringify(response));
                    break;
                } catch (err: any) {
                    console.log('createChat failed with payload:', JSON.stringify(payload), 'error:', err.message);
                    lastError = err;
                    response = null;
                }
            }

            if (!response) {
                throw lastError || new Error('All payload formats failed');
            }

            // Extract chatId from all possible response shapes
            const chatId =
                response?._id ||
                response?.chat?._id ||
                response?.data?._id ||
                response?.data?.chat?._id ||
                response?.chatId ||
                response?.id;

            console.log('Resolved chatId:', chatId);
            console.log('Full response keys:', Object.keys(response || {}));

            if (chatId) {
                navigation.navigate('Chat', {
                    chatId,
                    recipientName: mentor?.name,
                    recipientId: mentorId,
                });
            } else {
                Alert.alert(
                    'Debug: Chat Created But No ID',
                    'Response: ' + JSON.stringify(response).slice(0, 300)
                );
            }
        } catch (error: any) {
            console.error('handleMessage error:', error);
            Alert.alert('Error', error.message || 'Failed to start chat');
        } finally {
            setChatLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!mentor) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Mentor not found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Avatar name={mentor.name} imageUrl={mentor.avatar} size={80} />
                <Text style={styles.name}>{mentor.name}</Text>
                <Text style={styles.role}>{mentor.role}</Text>
                <Text style={styles.institution}>{mentor.institution}</Text>
                <Text style={styles.rating}>⭐ {mentor.rating?.toFixed(1) || 'N/A'}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Expertise</Text>
                <View style={styles.expertiseContainer}>
                    {mentor.expertise?.map((exp, index) => (
                        <Badge key={index} text={exp} variant="primary" />
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Card>
                    <Text style={styles.bio}>{mentor.bio || 'No bio available'}</Text>
                </Card>
            </View>

            <View style={styles.actions}>
                {/* <Button
                    title="Connect"
                    onPress={handleConnect}
                    loading={connecting}
                    style={styles.button}
                /> */}
                <Button
                    title="Message"
                    onPress={handleMessage}
                    loading={chatLoading}
                    style={styles.button}
                />
                <Button
                    title="Book Session"
                    variant="outline"
                    onPress={() => navigation.navigate('Sessions', { mentorId: mentor?._id, mentorName: mentor?.name })}
                    style={styles.button}
                />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        alignItems: 'center',
        padding: SIZES.xl,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    name: {
        fontSize: SIZES.fontXxl,
        fontWeight: 'bold',
        color: COLORS.foreground,
        marginTop: SIZES.md,
    },
    role: {
        fontSize: SIZES.fontMd,
        color: COLORS.primary,
        marginTop: SIZES.xs,
    },
    institution: {
        fontSize: SIZES.fontMd,
        color: COLORS.muted,
        marginTop: SIZES.xs,
    },
    rating: {
        fontSize: SIZES.fontLg,
        color: COLORS.accent,
        marginTop: SIZES.sm,
    },
    section: {
        padding: SIZES.lg,
    },
    sectionTitle: {
        fontSize: SIZES.fontXl,
        fontWeight: 'bold',
        color: COLORS.foreground,
        marginBottom: SIZES.md,
    },
    expertiseContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SIZES.sm,
    },
    bio: {
        fontSize: SIZES.fontMd,
        color: COLORS.foreground,
        lineHeight: 22,
    },
    actions: {
        padding: SIZES.lg,
        gap: SIZES.md,
    },
    button: {
        width: '100%',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    emptyText: {
        fontSize: SIZES.fontLg,
        color: COLORS.muted,
    },
});