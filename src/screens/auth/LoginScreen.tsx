import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { COLORS, SIZES } from '../../constants/colors';
import { systemApi } from '../../services/api';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    React.useEffect(() => {
        const checkBackend = async () => {
            try {
                await systemApi.checkConnection();
                setIsConnected(true);
            } catch (err) {
                setIsConnected(false);
            }
        };
        checkBackend();
    }, []);

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            await login(email, password);
            // Navigation is handled by AuthContext state change
        } catch (error: any) {
            Alert.alert('Login Failed', error.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to continue to EduBond</Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={errors.email}
                    />

                    <Input
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        secureTextEntry
                        error={errors.password}
                    />

                    <Button
                        title="Sign In"
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.button}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <Button
                            title="Create Account"
                            variant="ghost"
                            onPress={() => navigation.navigate('Register')}
                        />
                    </View>

                    {/* Connection Status Indicator */}
                    <View style={styles.connectionStatus}>
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: isConnected === true ? '#4caf50' : isConnected === false ? '#f44336' : '#ff9800' }
                        ]} />
                        <Text style={styles.statusText}>
                            {isConnected === true ? 'Backend Connected' : isConnected === false ? 'Backend Offline' : 'Checking connection...'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: SIZES.lg,
    },
    header: {
        marginBottom: SIZES.xxl,
        alignItems: 'center',
    },
    title: {
        fontSize: SIZES.fontXxl,
        fontWeight: 'bold',
        color: COLORS.foreground,
        marginBottom: SIZES.sm,
    },
    subtitle: {
        fontSize: SIZES.fontMd,
        color: COLORS.muted,
    },
    form: {
        width: '100%',
    },
    button: {
        marginTop: SIZES.md,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SIZES.xl,
    },
    footerText: {
        fontSize: SIZES.fontMd,
        color: COLORS.muted,
    },
    connectionStatus: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SIZES.xl,
        padding: SIZES.sm,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: SIZES.fontSm,
        color: COLORS.muted,
    }
});
