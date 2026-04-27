import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    RefreshControl,
} from 'react-native';
import { userApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { COLORS, SIZES } from '../../constants/colors';
import { Mentor } from '../../types';
 
export const MentorListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
 
    useEffect(() => {
        fetchMentors();
    }, []);
 
    const fetchMentors = async () => {
        try {
            const response: any = await userApi.getMentors();
            if (Array.isArray(response)) {
                setMentors(response);
            } else if (response?.mentors) {
                setMentors(response.mentors);
            } else if (response?.data) {
                setMentors(response.data);
            }
        } catch (error) {
            console.error('Error fetching mentors:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
 
    const onRefresh = () => {
        setRefreshing(true);
        fetchMentors();
    };
 
    const filteredMentors = mentors.filter((mentor) =>
        mentor.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
 
    const renderMentor = ({ item }: { item: Mentor }) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('MentorDetail', { mentorId: item._id })}
        >
            <Card style={styles.mentorCard}>
                <View style={styles.mentorHeader}>
                    <Avatar name={item.name} imageUrl={item.avatar} size={50} />
                    <View style={styles.mentorInfo}>
                        <Text style={styles.mentorName}>{item.name}</Text>
                        <Text style={styles.mentorInstitution}>{item.institution}</Text>
                        <Text style={styles.mentorRating}>⭐ {item.rating?.toFixed(1) || 'N/A'}</Text>
                    </View>
                </View>
                <View style={styles.expertiseContainer}>
                    {item.expertise?.slice(0, 3).map((exp, index) => (
                        <Badge key={index} text={exp} variant="primary" />
                    ))}
                </View>
            </Card>
        </TouchableOpacity>
    );
 
    if (loading) {
        return <LoadingSpinner />;
    }
 
    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search mentors..."
                    placeholderTextColor={COLORS.muted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
 
            <FlatList
                data={filteredMentors}
                renderItem={renderMentor}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No mentors found</Text>
                    </View>
                }
            />
        </View>
    );
};
 
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    searchContainer: {
        padding: SIZES.md,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    searchInput: {
        backgroundColor: COLORS.backgroundLight,
        borderRadius: SIZES.radiusMd,
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.sm,
        fontSize: SIZES.fontMd,
        color: COLORS.foreground,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    list: {
        padding: SIZES.md,
    },
    mentorCard: {
        marginBottom: SIZES.md,
    },
    mentorHeader: {
        flexDirection: 'row',
        marginBottom: SIZES.md,
    },
    mentorInfo: {
        flex: 1,
        marginLeft: SIZES.md,
    },
    mentorName: {
        fontSize: SIZES.fontLg,
        fontWeight: 'bold',
        color: COLORS.foreground,
    },
    mentorInstitution: {
        fontSize: SIZES.fontSm,
        color: COLORS.muted,
        marginTop: SIZES.xs,
    },
    mentorRating: {
        fontSize: SIZES.fontSm,
        color: COLORS.accent,
        marginTop: SIZES.xs,
    },
    expertiseContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SIZES.sm,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: SIZES.xxl,
    },
    emptyText: {
        fontSize: SIZES.fontLg,
        color: COLORS.muted,
    },
});
 