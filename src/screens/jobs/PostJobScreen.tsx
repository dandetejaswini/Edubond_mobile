import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, Alert,
} from 'react-native';
import { COLORS, SIZES } from '../../constants/colors';
import { jobApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const INITIAL_FORM = {
    title: '',
    company: '',
    location: 'Remote',
    type: 'Full-time',
    experienceLevel: 'Entry Level',
    domain: '',
    skillsRequired: '',
    description: '',
    requirements: '',
};

export const PostJobScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [form, setForm] = useState({ ...INITIAL_FORM, company: user?.company || '' });
    const [loading, setLoading] = useState(false);

    if (user?.role === 'student') {
        return (
            <View style={styles.accessDenied}>
                <Text style={styles.accessDeniedIcon}>🚫</Text>
                <Text style={styles.accessDeniedTitle}>Access Restricted</Text>
                <Text style={styles.accessDeniedText}>
                    Job posting is only available for alumni.
                </Text>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>← Back to Jobs</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const jobTypes = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'];
    const expLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Any'];

    const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.company.trim() || !form.description.trim()) {
            Alert.alert('Required Fields', 'Job title, company, and description are required.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...form,
                skillsRequired: form.skillsRequired
                    .split(',').map(s => s.trim()).filter(s => s.length > 0),
                requirements: form.requirements
                    .split(',').map(r => r.trim()).filter(r => r.length > 0),
            };

            await jobApi.postJob(payload);

            Alert.alert(
                'Job Posted!',
                `"${form.title}" at ${form.company} is now live for students to apply.\n\nDo you want to post another job?`,
                [
                    {
                        text: 'Post Another Job',
                        onPress: () => setForm({ ...INITIAL_FORM, company: user?.company || '' }),
                    },
                    {
                        text: 'View My Jobs',
                        onPress: () => navigation.navigate('AlumniPostedJobs'),
                    },
                ]
            );
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to post job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Post a Job</Text>
            <Text style={styles.subtitle}>Help students find opportunities</Text>

            <View style={styles.field}>
                <Text style={styles.label}>Job Title *</Text>
                <TextInput style={styles.input} placeholder="e.g. Software Engineer Intern"
                    placeholderTextColor={COLORS.muted} value={form.title}
                    onChangeText={v => set('title', v)} />
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Company *</Text>
                <TextInput style={styles.input} placeholder="Company name"
                    placeholderTextColor={COLORS.muted} value={form.company}
                    onChangeText={v => set('company', v)} />
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Domain</Text>
                <TextInput style={styles.input} placeholder="e.g. Software Engineering, Finance, Data Science"
                    placeholderTextColor={COLORS.muted} value={form.domain}
                    onChangeText={v => set('domain', v)} />
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Skills Required (comma-separated)</Text>
                <TextInput style={styles.input}
                    placeholder="e.g. React, Node.js, Python, SQL"
                    placeholderTextColor={COLORS.muted} value={form.skillsRequired}
                    onChangeText={v => set('skillsRequired', v)} />
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Location</Text>
                <TextInput style={styles.input} placeholder="City, Country or Remote"
                    placeholderTextColor={COLORS.muted} value={form.location}
                    onChangeText={v => set('location', v)} />
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Job Type</Text>
                <View style={styles.optionsRow}>
                    {jobTypes.map(t => (
                        <TouchableOpacity key={t}
                            style={[styles.option, form.type === t && styles.optionActive]}
                            onPress={() => set('type', t)}>
                            <Text style={[styles.optionText, form.type === t && styles.optionTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Experience Level</Text>
                <View style={styles.optionsRow}>
                    {expLevels.map(l => (
                        <TouchableOpacity key={l}
                            style={[styles.option, form.experienceLevel === l && styles.optionActive]}
                            onPress={() => set('experienceLevel', l)}>
                            <Text style={[styles.optionText, form.experienceLevel === l && styles.optionTextActive]}>{l}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Additional Requirements (comma-separated)</Text>
                <TextInput style={styles.input}
                    placeholder="e.g. Strong communication skills, Prior internship experience"
                    placeholderTextColor={COLORS.muted} value={form.requirements}
                    onChangeText={v => set('requirements', v)} />
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Job Description *</Text>
                <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="Describe the role, responsibilities, and what you're looking for..."
                    placeholderTextColor={COLORS.muted} value={form.description}
                    onChangeText={v => set('description', v)}
                    multiline numberOfLines={6} textAlignVertical="top" />
            </View>

            <TouchableOpacity
                style={[styles.submitButton, loading && { opacity: 0.7 }]}
                onPress={handleSubmit} disabled={loading}>
                <Text style={styles.submitText}>{loading ? 'Posting…' : 'Post Job'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: SIZES.lg, paddingBottom: SIZES.xxl },
    title: { fontSize: SIZES.fontXxl, fontWeight: 'bold', color: COLORS.foreground, marginBottom: 4 },
    subtitle: { fontSize: SIZES.fontMd, color: COLORS.muted, marginBottom: SIZES.xl },
    field: { marginBottom: SIZES.lg },
    label: { fontSize: SIZES.fontMd, color: COLORS.foreground, fontWeight: '600', marginBottom: SIZES.sm },
    input: {
        backgroundColor: COLORS.card, borderRadius: SIZES.radiusMd, padding: SIZES.md,
        color: COLORS.foreground, borderWidth: 1, borderColor: COLORS.border, fontSize: SIZES.fontMd,
    },
    textarea: { minHeight: 120 },
    optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
    option: {
        borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
        borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card,
    },
    optionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    optionText: { color: COLORS.foreground, fontSize: SIZES.fontSm },
    optionTextActive: { color: '#fff' },
    submitButton: {
        backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg,
        padding: SIZES.lg, alignItems: 'center', marginTop: SIZES.md,
    },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: SIZES.fontLg },
    accessDenied: {
        flex: 1, backgroundColor: COLORS.background,
        alignItems: 'center', justifyContent: 'center', padding: SIZES.xl,
    },
    accessDeniedIcon: { fontSize: 56, marginBottom: SIZES.lg },
    accessDeniedTitle: { fontSize: SIZES.fontXxl, fontWeight: 'bold', color: COLORS.foreground, marginBottom: SIZES.sm },
    accessDeniedText: { fontSize: SIZES.fontMd, color: COLORS.muted, textAlign: 'center', marginBottom: SIZES.xl },
    backButton: { backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg, paddingHorizontal: SIZES.xl, paddingVertical: SIZES.md },
    backButtonText: { color: '#fff', fontWeight: 'bold', fontSize: SIZES.fontMd },
});
