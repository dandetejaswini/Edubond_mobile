import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert,
} from 'react-native';
import { Card } from '../../components/ui/Card';
import { COLORS, SIZES } from '../../constants/colors';
import { aiApi, userApi, referralApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface ResumeAnalysis {
    score: number;
    strengths: string[];
    improvements: string[];
    topSkills: string[];
}

interface AlumniMatch {
    _id: string;
    name: string;
    company: string;
    domain: string;
    institution: string;
    matchScore?: number;
}

export const ResumeAnalysisScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
    const [skills, setSkills] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [analyzed, setAnalyzed] = useState(false);
    const [alumniMatches, setAlumniMatches] = useState<AlumniMatch[]>([]);
    const [matchLoading, setMatchLoading] = useState(false);

    const hasResume = !!(user?.resumeUrl || (user?.extractedSkills && user.extractedSkills.length > 0));

    const handleAnalyze = async () => {
        if (!hasResume) {
            Alert.alert(
                'No Resume Found',
                'Please upload your resume in your Profile first before analyzing.',
                [
                    { text: 'Go to Profile', onPress: goToProfile },
                    { text: 'Cancel', style: 'cancel' },
                ]
            );
            return;
        }

        setLoading(true);
        try {
            const res: any = await aiApi.resumeScore(user?.domain);
            if (res?.analysis) {
                setAnalysis(res.analysis);
                setSkills(res.skills || []);
                setAnalyzed(true);
                // Fetch alumni matches based on extracted skills
                fetchAlumniMatches();
            } else {
                Alert.alert('No Skills Found', 'Upload your resume in Profile and add skills to get analysis.');
            }
        } catch (e: any) {
            if (e.message?.includes('No skills') || e.message?.includes('no resume')) {
                Alert.alert('No Data', 'Upload your resume first in Profile.');
            } else {
                Alert.alert('Analysis Failed', e.message || 'Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchAlumniMatches = async () => {
        setMatchLoading(true);
        try {
            const res: any = await userApi.getAlumniRecommended();
            if (res?.recommendedAlumni) {
                setAlumniMatches(res.recommendedAlumni.slice(0, 5));
            }
        } catch (e) {
            console.error('Failed to fetch alumni matches', e);
        } finally {
            setMatchLoading(false);
        }
    };

    const goToProfile = () => {
        // Navigate back to the Profile tab regardless of drawer/stack nesting
        try {
            navigation.navigate('Main', { screen: 'Profile' });
        } catch {
            try { navigation.navigate('Profile'); } catch { navigation.goBack(); }
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 75) return '#22c55e';
        if (score >= 50) return '#f59e0b';
        return '#ef4444';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 75) return 'Strong Profile';
        if (score >= 50) return 'Good Profile';
        return 'Needs Improvement';
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Resume Analysis</Text>
            <Text style={styles.subtitle}>AI-powered skill strength evaluation</Text>

            {/* Analyze Button — always visible */}
            {!analyzed && (
                <Card style={styles.analyzeCard}>
                    <Text style={styles.analyzeIcon}>📄</Text>
                    <Text style={styles.analyzeTitle}>
                        {hasResume ? 'Ready to Analyze' : 'Upload Resume First'}
                    </Text>
                    <Text style={styles.analyzeText}>
                        {hasResume
                            ? 'Click the button below to get AI-powered insights and improvement suggestions.'
                            : 'Upload your resume in your Profile to enable resume analysis.'}
                    </Text>
                    {hasResume ? (
                        <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyze} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.analyzeBtnText}>Analyze Resume</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.profileBtn} onPress={goToProfile}>
                            <Text style={styles.profileBtnText}>Go to Profile to Upload</Text>
                        </TouchableOpacity>
                    )}
                </Card>
            )}

            {loading && !analyzed && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Analyzing your resume with AI…</Text>
                </View>
            )}

            {analyzed && analysis && (
                <>
                    {/* Score Card */}
                    <Card style={styles.scoreCard}>
                        <View style={styles.scoreCircle}>
                            <Text style={[styles.scoreNumber, { color: getScoreColor(analysis.score) }]}>
                                {analysis.score}
                            </Text>
                            <Text style={styles.scoreMax}>/100</Text>
                        </View>
                        <Text style={[styles.scoreLabel, { color: getScoreColor(analysis.score) }]}>
                            {getScoreLabel(analysis.score)}
                        </Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, {
                                width: `${analysis.score}%` as any,
                                backgroundColor: getScoreColor(analysis.score)
                            }]} />
                        </View>
                    </Card>

                    {/* Top Skills */}
                    {analysis.topSkills?.length > 0 && (
                        <Card style={styles.section}>
                            <Text style={styles.sectionTitle}>Top Skills</Text>
                            <View style={styles.skillsContainer}>
                                {analysis.topSkills.map((skill, i) => (
                                    <View key={i} style={styles.skillChip}>
                                        <Text style={styles.skillText}>{skill}</Text>
                                    </View>
                                ))}
                            </View>
                        </Card>
                    )}

                    {/* Strengths */}
                    {analysis.strengths?.length > 0 && (
                        <Card style={styles.section}>
                            <Text style={styles.sectionTitle}>Strengths</Text>
                            {analysis.strengths.map((s, i) => (
                                <View key={i} style={styles.listItem}>
                                    <Text style={styles.bullet}>✓</Text>
                                    <Text style={styles.listText}>{s}</Text>
                                </View>
                            ))}
                        </Card>
                    )}

                    {/* Improvements */}
                    {analysis.improvements?.length > 0 && (
                        <Card style={styles.section}>
                            <Text style={styles.sectionTitle}>Improvement Suggestions</Text>
                            {analysis.improvements.map((s, i) => (
                                <View key={i} style={styles.listItem}>
                                    <Text style={styles.bullet}>→</Text>
                                    <Text style={styles.listText}>{s}</Text>
                                </View>
                            ))}
                        </Card>
                    )}

                    {/* All Skills */}
                    {skills.length > 0 && (
                        <Card style={styles.section}>
                            <Text style={styles.sectionTitle}>All Extracted Skills ({skills.length})</Text>
                            <View style={styles.skillsContainer}>
                                {skills.map((skill, i) => (
                                    <View key={i} style={[styles.skillChip, styles.skillChipSecondary]}>
                                        <Text style={[styles.skillText, { color: COLORS.foreground }]}>{skill}</Text>
                                    </View>
                                ))}
                            </View>
                        </Card>
                    )}

                    {/* Alumni Matches based on skills */}
                    <Card style={styles.section}>
                        <Text style={styles.sectionTitle}>Alumni Matches 🤝</Text>
                        <Text style={styles.matchSubtitle}>Alumni matched to your skills via NLP</Text>
                        {matchLoading ? (
                            <View style={styles.matchLoading}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                                <Text style={styles.matchLoadingText}>Finding matches…</Text>
                            </View>
                        ) : alumniMatches.length === 0 ? (
                            <Text style={styles.noMatchText}>No alumni matches found. Add more skills to your profile.</Text>
                        ) : (
                            alumniMatches.map((alumni) => (
                                <View key={alumni._id} style={styles.alumniMatchCard}>
                                    <View style={styles.alumniInfo}>
                                        <Text style={styles.alumniName}>{alumni.name}</Text>
                                        <Text style={styles.alumniSub}>
                                            {alumni.company ? `${alumni.company}` : ''}{alumni.domain ? ` • ${alumni.domain}` : ''}
                                        </Text>
                                        {alumni.institution ? <Text style={styles.alumniSub}>🏫 {alumni.institution}</Text> : null}
                                    </View>
                                    {alumni.matchScore ? (
                                        <View style={styles.matchScoreBadge}>
                                            <Text style={styles.matchScoreText}>{alumni.matchScore}pts</Text>
                                        </View>
                                    ) : null}
                                    <TouchableOpacity
                                        style={styles.referralBtn}
                                        onPress={() => {
                                            try { navigation.navigate('Referrals'); } catch {}
                                        }}
                                    >
                                        <Text style={styles.referralBtnText}>Request Referral</Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </Card>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.reAnalyzeBtn} onPress={() => { setAnalyzed(false); setAnalysis(null); setAlumniMatches([]); }}>
                            <Text style={styles.reAnalyzeBtnText}>Re-analyze</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.goProfileBtn} onPress={goToProfile}>
                            <Text style={styles.goProfileBtnText}>Go to Profile</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: SIZES.lg, paddingBottom: SIZES.xxl },
    title: { fontSize: SIZES.fontXxl, fontWeight: 'bold', color: COLORS.foreground, marginBottom: 4 },
    subtitle: { fontSize: SIZES.fontMd, color: COLORS.muted, marginBottom: SIZES.xl },
    analyzeCard: { padding: SIZES.xl, alignItems: 'center', marginBottom: SIZES.lg },
    analyzeIcon: { fontSize: 48, marginBottom: SIZES.md },
    analyzeTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.foreground, marginBottom: SIZES.sm },
    analyzeText: { fontSize: SIZES.fontMd, color: COLORS.muted, textAlign: 'center', marginBottom: SIZES.xl, lineHeight: 22 },
    analyzeBtn: {
        backgroundColor: COLORS.primary, borderRadius: SIZES.radiusMd,
        paddingHorizontal: SIZES.xl, paddingVertical: SIZES.md, minWidth: 160, alignItems: 'center',
    },
    analyzeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: SIZES.fontMd },
    profileBtn: {
        backgroundColor: COLORS.card, borderRadius: SIZES.radiusMd,
        paddingHorizontal: SIZES.xl, paddingVertical: SIZES.md,
        borderWidth: 1, borderColor: COLORS.primary,
    },
    profileBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: SIZES.fontMd },
    loadingContainer: { alignItems: 'center', marginTop: 40 },
    loadingText: { color: COLORS.muted, marginTop: SIZES.lg, fontSize: SIZES.fontMd },
    scoreCard: { padding: SIZES.xl, alignItems: 'center', marginBottom: SIZES.md },
    scoreCircle: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: SIZES.sm },
    scoreNumber: { fontSize: 64, fontWeight: 'bold' },
    scoreMax: { fontSize: SIZES.fontLg, color: COLORS.muted, paddingBottom: 12 },
    scoreLabel: { fontSize: SIZES.fontLg, fontWeight: 'bold', marginBottom: SIZES.md },
    progressBar: { width: '100%', height: 12, backgroundColor: COLORS.border, borderRadius: 6, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 6 },
    section: { padding: SIZES.md, marginBottom: SIZES.md },
    sectionTitle: { fontSize: SIZES.fontLg, fontWeight: 'bold', color: COLORS.foreground, marginBottom: SIZES.md },
    skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
    skillChip: {
        backgroundColor: COLORS.primary + '20', borderRadius: 20,
        paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs,
        borderWidth: 1, borderColor: COLORS.primary + '40',
    },
    skillChipSecondary: { backgroundColor: COLORS.border, borderColor: COLORS.border },
    skillText: { fontSize: SIZES.fontSm, color: COLORS.primary, fontWeight: '600' },
    listItem: { flexDirection: 'row', gap: SIZES.sm, marginBottom: SIZES.sm },
    bullet: { fontSize: SIZES.fontMd, color: COLORS.primary, fontWeight: 'bold' },
    listText: { flex: 1, fontSize: SIZES.fontMd, color: COLORS.foreground },
    actionRow: { flexDirection: 'row', gap: SIZES.md, marginTop: SIZES.md },
    reAnalyzeBtn: {
        flex: 1, backgroundColor: COLORS.card, borderRadius: SIZES.radiusMd,
        padding: SIZES.md, alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.border,
    },
    reAnalyzeBtnText: { color: COLORS.foreground, fontWeight: '600' },
    goProfileBtn: {
        flex: 1, backgroundColor: COLORS.primary, borderRadius: SIZES.radiusMd,
        padding: SIZES.md, alignItems: 'center',
    },
    goProfileBtnText: { color: '#fff', fontWeight: '700' },
    matchSubtitle: { fontSize: SIZES.fontSm, color: COLORS.muted, marginBottom: SIZES.md },
    matchLoading: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, paddingVertical: SIZES.md },
    matchLoadingText: { color: COLORS.muted, fontSize: SIZES.fontSm },
    noMatchText: { color: COLORS.muted, fontSize: SIZES.fontSm, fontStyle: 'italic' },
    alumniMatchCard: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: SIZES.sm, gap: SIZES.xs },
    alumniInfo: { flex: 1 },
    alumniName: { fontSize: SIZES.fontMd, fontWeight: 'bold', color: COLORS.foreground },
    alumniSub: { fontSize: SIZES.fontSm, color: COLORS.muted },
    matchScoreBadge: { backgroundColor: COLORS.primary + '20', borderRadius: 12, paddingHorizontal: SIZES.sm, paddingVertical: 2, alignSelf: 'flex-start' },
    matchScoreText: { fontSize: SIZES.fontXs, color: COLORS.primary, fontWeight: 'bold' },
    referralBtn: { backgroundColor: COLORS.primary + '15', borderRadius: SIZES.radiusSm, paddingVertical: 6, paddingHorizontal: SIZES.md, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.primary + '40' },
    referralBtnText: { color: COLORS.primary, fontSize: SIZES.fontSm, fontWeight: '600' },
});
