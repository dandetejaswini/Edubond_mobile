import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { COLORS, SIZES } from '../../constants/colors';
import { AlumniDashboard } from './AlumniDashboard';
import { AdminDashboard } from './AdminDashboard';
import { StudentDashboard } from './StudentDashboard';
import { MentorDashboard } from './MentorDashboard';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        // Fetch dashboard data
        setTimeout(() => setRefreshing(false), 1000);
    };

    const quickActions = [
        {
            title: 'Find Mentors',
            icon: '👥',
            onPress: () => {
                try { navigation.navigate('FindMentors'); }
                catch { navigation.navigate('Main', { screen: 'Dashboard' }); }
            },
        },
        {
            title: 'Start Chat',
            icon: '💬',
            onPress: () => navigation.navigate('Main', { screen: 'Chats' }),
        },
        {
            title: 'Book Session',
            icon: '📅',
            onPress: () => navigation.navigate('Main', { screen: 'Sessions' }),
        },
        {
            title: 'AI Assistant',
            icon: '🤖',
            onPress: () => navigation.navigate('AIChat'),
        },
    ];

    if (user?.role === 'alumni') {
        return <AlumniDashboard user={user} navigation={navigation} />;
    }
    if (user?.role === 'admin') {
        return <AdminDashboard user={user} navigation={navigation} />;
    }
    if (user?.role === 'student') {
        return <StudentDashboard user={user} navigation={navigation} />;
    }
    if (user?.role === 'mentor') {
        return <MentorDashboard user={user} navigation={navigation} />;
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.greeting}>Welcome back,</Text>
                <Text style={styles.name}>{user?.name}!</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.quickActionsGrid}>
                    {quickActions.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.actionCard}
                            onPress={action.onPress}
                        >
                            <Text style={styles.actionIcon}>{action.icon}</Text>
                            <Text style={styles.actionTitle}>{action.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Stats</Text>
                <View style={styles.statsContainer}>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>8</Text>
                        <Text style={styles.statLabel}>Connections</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>12</Text>
                        <Text style={styles.statLabel}>Sessions</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>24</Text>
                        <Text style={styles.statLabel}>Messages</Text>
                    </Card>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <Card style={styles.activityCard}>
                    <Text style={styles.activityText}>
                        You connected with John Doe yesterday
                    </Text>
                </Card>
                <Card style={styles.activityCard}>
                    <Text style={styles.activityText}>
                        New session scheduled for tomorrow at 3 PM
                    </Text>
                </Card>
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
        padding: SIZES.lg,
        paddingTop: SIZES.xxl,
    },
    greeting: {
        fontSize: SIZES.fontLg,
        color: COLORS.muted,
    },
    name: {
        fontSize: SIZES.fontXxl,
        fontWeight: 'bold',
        color: COLORS.foreground,
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
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SIZES.md,
    },
    actionCard: {
        width: '47%',
        backgroundColor: COLORS.card,
        borderRadius: SIZES.radiusLg,
        padding: SIZES.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    actionIcon: {
        fontSize: 32,
        marginBottom: SIZES.sm,
    },
    actionTitle: {
        fontSize: SIZES.fontMd,
        color: COLORS.foreground,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: SIZES.md,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SIZES.lg,
    },
    statValue: {
        fontSize: SIZES.fontXxl,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: SIZES.fontSm,
        color: COLORS.muted,
        marginTop: SIZES.xs,
    },
    activityCard: {
        marginBottom: SIZES.md,
    },
    activityText: {
        fontSize: SIZES.fontMd,
        color: COLORS.foreground,
    },
});
