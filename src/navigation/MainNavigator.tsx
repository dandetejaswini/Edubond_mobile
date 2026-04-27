import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { MentorListScreen } from '../screens/mentors/MentorListScreen';
import { MentorDetailScreen } from '../screens/mentors/MentorDetailScreen';
import { ChatListScreen } from '../screens/chat/ChatListScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { SessionsScreen } from '../screens/sessions/SessionsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { AIChatScreen } from '../screens/ai/AIChatScreen';
import { AlumniGroupsScreen } from '../screens/alumni/AlumniGroupsScreen';
import { GroupChatScreen } from '../screens/alumni/GroupChatScreen';
import { AlumniContributionScreen } from '../screens/alumni/AlumniContributionScreen';
import { AlumniDirectoryScreen } from '../screens/alumni/AlumniDirectoryScreen';
import { StudentFilterScreen } from '../screens/alumni/StudentFilterScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminJobsScreen } from '../screens/admin/AdminJobsScreen';
import { MeetingManagementScreen } from '../screens/admin/MeetingManagementScreen';
import { JobsListScreen } from '../screens/jobs/JobsListScreen';
import { PostJobScreen } from '../screens/jobs/PostJobScreen';
import { ApplicationTrackerScreen } from '../screens/jobs/ApplicationTrackerScreen';
import { JobDetailScreen } from '../screens/jobs/JobDetailScreen';
import { AlumniPostedJobsScreen } from '../screens/jobs/AlumniPostedJobsScreen';
import { ReferralScreen } from '../screens/referrals/ReferralScreen';
import { ReferralRequestScreen } from '../screens/referrals/ReferralRequestScreen';
import { ResumeAnalysisScreen } from '../screens/resume/ResumeAnalysisScreen';
import { COLORS } from '../constants/colors';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const tabScreenOptions = {
    tabBarActiveTintColor: COLORS.primary,
    tabBarInactiveTintColor: COLORS.muted,
    tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.border },
    headerStyle: { backgroundColor: COLORS.card },
    headerTintColor: COLORS.foreground,
};

const MentorStack = () => (
    <Stack.Navigator>
        <Stack.Screen name="MentorList" component={MentorListScreen} options={{ title: 'Find Mentors' }} />
        <Stack.Screen name="MentorDetail" component={MentorDetailScreen} options={{ title: 'Mentor Profile' }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerTitle: '' }} />
        <Stack.Screen name="Sessions" component={SessionsScreen} options={{ title: 'Book Session' }} />
    </Stack.Navigator>
);

const ChatStack = () => (
    <Stack.Navigator>
        <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Chats' }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerTitle: '' }} />
    </Stack.Navigator>
);

// ─── Role-specific Tab Navigators ────────────────────────────────────────────

const StudentTabNavigator = () => (
    <Tab.Navigator screenOptions={tabScreenOptions}>
        <Tab.Screen name="Dashboard" component={DashboardScreen}
            options={{ title: 'Home', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} /> }} />
        <Tab.Screen name="JobsList" component={JobsListScreen}
            options={{ title: 'Jobs', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={size} color={color} /> }} />
        <Tab.Screen name="Chats" component={ChatStack}
            options={{ headerShown: false, tabBarLabel: 'Chats', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={color} /> }} />
        <Tab.Screen name="Sessions" component={SessionsScreen}
            options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} /> }} />
        <Tab.Screen name="Profile" component={ProfileScreen}
            options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} /> }} />
    </Tab.Navigator>
);

const AlumniTabNavigator = () => (
    <Tab.Navigator screenOptions={tabScreenOptions}>
        <Tab.Screen name="Dashboard" component={DashboardScreen}
            options={{ title: 'Home', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} /> }} />
        <Tab.Screen name="JobsList" component={JobsListScreen}
            options={{ title: 'Jobs', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={size} color={color} /> }} />
        <Tab.Screen name="Chats" component={ChatStack}
            options={{ headerShown: false, tabBarLabel: 'Chats', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={color} /> }} />
        <Tab.Screen name="Sessions" component={SessionsScreen}
            options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} /> }} />
        <Tab.Screen name="Profile" component={ProfileScreen}
            options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} /> }} />
    </Tab.Navigator>
);

const MentorTabNavigator = () => (
    <Tab.Navigator screenOptions={tabScreenOptions}>
        <Tab.Screen name="Dashboard" component={DashboardScreen}
            options={{ title: 'Home', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} /> }} />
        <Tab.Screen name="Sessions" component={SessionsScreen}
            options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} /> }} />
        <Tab.Screen name="Chats" component={ChatStack}
            options={{ headerShown: false, tabBarLabel: 'Chats', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={color} /> }} />
        <Tab.Screen name="Notifications" component={NotificationsScreen}
            options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={size} color={color} /> }} />
        <Tab.Screen name="Profile" component={ProfileScreen}
            options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} /> }} />
    </Tab.Navigator>
);

const AdminTabNavigator = () => (
    <Tab.Navigator screenOptions={tabScreenOptions}>
        <Tab.Screen name="Dashboard" component={DashboardScreen}
            options={{ title: 'Home', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} /> }} />
        <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen}
            options={{ title: 'Admin', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'shield' : 'shield-outline'} size={size} color={color} /> }} />
        <Tab.Screen name="Chats" component={ChatStack}
            options={{ headerShown: false, tabBarLabel: 'Chats', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={color} /> }} />
        <Tab.Screen name="Notifications" component={NotificationsScreen}
            options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={size} color={color} /> }} />
        <Tab.Screen name="Profile" component={ProfileScreen}
            options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} /> }} />
    </Tab.Navigator>
);

const getRoleTabNavigator = (role?: string) => {
    switch (role) {
        case 'alumni': return AlumniTabNavigator;
        case 'mentor': return MentorTabNavigator;
        case 'admin': return AdminTabNavigator;
        default: return StudentTabNavigator;
    }
};

// ─── Main Navigator (Drawer wrapping role-specific tabs) ─────────────────────

export const MainNavigator = () => {
    const { user } = useAuth();
    const RoleTabNavigator = getRoleTabNavigator(user?.role);

    return (
        <Drawer.Navigator
            screenOptions={{
                drawerStyle: { backgroundColor: COLORS.background },
                drawerActiveTintColor: COLORS.primary,
                drawerInactiveTintColor: COLORS.muted,
                headerShown: false,
            }}
        >
            {/* Main tabbed experience (role-specific) */}
            <Drawer.Screen name="Main" component={RoleTabNavigator} options={{ title: 'Home' }} />

            {/* AI Assistant — available to all roles */}
            <Drawer.Screen name="AIChat" component={AIChatScreen} options={{ title: 'AI Assistant', headerShown: true }} />

            {/* Job Detail — available to all roles */}
            <Drawer.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Details', headerShown: true }} />

            {/* Alumni Directory — available to all roles */}
            <Drawer.Screen name="AlumniDirectory" component={AlumniDirectoryScreen} options={{ title: 'Alumni Directory', headerShown: true }} />

            {/* Notifications — available to all roles (admin and mentor see it in tabs already) */}
            {user?.role !== 'admin' && user?.role !== 'mentor' && (
                <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: true }} />
            )}

            {/* ── Mentor-only screens ──────────────────────────────────────── */}
            {user?.role === 'mentor' && (
                <Drawer.Screen name="FindMentors" component={MentorStack} options={{ title: 'Find Mentors', headerShown: false }} />
            )}

            {/* ── Student-only screens ─────────────────────────────────────── */}
            {user?.role === 'student' && (
                <>
                    <Drawer.Screen name="FindMentors" component={MentorStack} options={{ title: 'Find Mentors', headerShown: false }} />
                    <Drawer.Screen name="ApplicationTracker" component={ApplicationTrackerScreen} options={{ title: 'My Applications', headerShown: true }} />
                    <Drawer.Screen name="ResumeAnalysis" component={ResumeAnalysisScreen} options={{ title: 'Resume Analysis', headerShown: true }} />
                    <Drawer.Screen name="ReferralRequest" component={ReferralRequestScreen} options={{ title: 'Request Referral', headerShown: true }} />
                    <Drawer.Screen name="Referrals" component={ReferralScreen} options={{ title: 'My Referrals', headerShown: true }} />
                </>
            )}

            {/* ── Alumni-only screens ──────────────────────────────────────── */}
            {user?.role === 'alumni' && (
                <>
                    <Drawer.Screen name="PostJob" component={PostJobScreen} options={{ title: 'Post Job', headerShown: true }} />
                    <Drawer.Screen name="AlumniPostedJobs" component={AlumniPostedJobsScreen} options={{ title: 'My Posted Jobs', headerShown: true }} />
                    <Drawer.Screen name="StudentFilter" component={StudentFilterScreen} options={{ title: 'Find Students', headerShown: true }} />
                    <Drawer.Screen name="AlumniContribution" component={AlumniContributionScreen} options={{ title: 'My Contributions', headerShown: true }} />
                    <Drawer.Screen name="AlumniGroups" component={AlumniGroupsScreen} options={{ title: 'Alumni Groups', headerShown: true }} />
                    <Drawer.Screen name="GroupChat" component={GroupChatScreen} options={({ route }: any) => ({ title: route.params?.groupName || 'Group Chat', headerShown: true })} />
                    <Drawer.Screen name="Referrals" component={ReferralScreen} options={{ title: 'Referral Requests', headerShown: true }} />
                </>
            )}

            {/* ── Admin-only screens ───────────────────────────────────────── */}
            {user?.role === 'admin' && (
                <>
                    <Drawer.Screen name="AdminJobs" component={AdminJobsScreen} options={{ title: 'Manage Jobs', headerShown: true }} />
                    <Drawer.Screen name="MeetingManagement" component={MeetingManagementScreen} options={{ title: 'Meeting Management', headerShown: true }} />
                </>
            )}
        </Drawer.Navigator>
    );
};