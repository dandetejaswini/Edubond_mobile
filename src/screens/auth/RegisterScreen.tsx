import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
    Platform, Alert, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { COLORS, SIZES } from '../../constants/colors';

const ROLES = [
    { value: 'student', label: 'Student' },
    { value: 'mentor', label: 'Mentor' },
    { value: 'alumni', label: 'Alumni' },
];

const COMMON_COLLEGES = [
    'Indian Institute of Technology (IIT) Delhi',
    'Indian Institute of Technology (IIT) Bombay',
    'Indian Institute of Technology (IIT) Madras',
    'Birla Institute of Technology and Science (BITS) Pilani',
    'National Institute of Technology (NIT) Trichy',
    'Delhi Technological University (DTU)',
    'Vellore Institute of Technology (VIT)',
];

// Alumni registration steps:
//   1 = "Verify" (enter Roll No, Name, Mobile → validate dataset)
//   1.5 = "OTP" (enter OTP sent to mobile)
//   2 = "Account" (email, password, complete details)
// Mentor steps:
//   1 = "Verify" (enter Mentor ID, Name)
//   2 = "Account"
// Student steps:
//   1 = "Account" directly

type AlumniInfo = { name: string; batch: string; passingYear: number; institution: string } | null;
type MentorInfo = { name: string; designation: string } | null;

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { register } = useAuth();

    const [role, setRole] = useState('student');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Alumni-specific state
    const [alumniVerify, setAlumniVerify] = useState({ rollNumber: '', name: '', mobileNumber: '', email: '' });
    const [alumniInfo, setAlumniInfo] = useState<AlumniInfo>(null);
    const [otpValue, setOtpValue] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // Mentor-specific state
    const [mentorVerify, setMentorVerify] = useState({ mentorId: '', name: '' });
    const [mentorInfo, setMentorInfo] = useState<MentorInfo>(null);

    // Common account fields
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        institution: '', bio: '', expertise: '', company: '', domain: '',
        yearsOfExperience: '', batch: '', passingYear: '',
    });

    // Institution autocomplete
    const [colleges, setColleges] = useState<string[]>([]);
    const [filteredColleges, setFilteredColleges] = useState<string[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const fetchColleges = async () => {
            try {
                const res: any = await authApi.getColleges();
                const merged = Array.from(new Set([...(res?.colleges || []), ...COMMON_COLLEGES]));
                setColleges(merged);
                setFilteredColleges(merged);
            } catch {}
        };
        fetchColleges();
    }, []);

    // Reset to step 1 when role changes
    useEffect(() => {
        setStep(1);
        setErrors({});
        setAlumniInfo(null);
        setMentorInfo(null);
        setOtpValue('');
        setOtpSent(false);
        setAlumniVerify({ rollNumber: '', name: '', mobileNumber: '', email: '' });
    }, [role]);

    const updateField = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
        if (field === 'institution') {
            const filtered = value.trim()
                ? colleges.filter(c => c.toLowerCase().includes(value.toLowerCase()))
                : colleges;
            setFilteredColleges(filtered);
            setShowDropdown(filtered.length > 0 && !colleges.some(c => c.toLowerCase() === value.trim().toLowerCase()));
        }
    };

    // ── Alumni Step 1: verify against dataset, then send OTP via email ────────
    const handleAlumniVerify = async () => {
        const newErrors: Record<string, string> = {};
        if (!alumniVerify.rollNumber) newErrors.rollNumber = 'Roll number is required';
        if (!alumniVerify.name) newErrors.name = 'Name is required';
        if (!alumniVerify.mobileNumber) newErrors.mobileNumber = 'Mobile number is required';
        if (!alumniVerify.email || !/\S+@\S+\.\S+/.test(alumniVerify.email)) newErrors.verifyEmail = 'Valid email is required';
        if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

        setLoading(true);
        try {
            const res: any = await authApi.checkAlumni(alumniVerify);
            setAlumniInfo(res.alumniInfo);
            // Pre-fill name and institution from dataset
            setForm(prev => ({
                ...prev,
                name: res.alumniInfo?.name || prev.name,
                institution: res.alumniInfo?.institution || prev.institution,
                batch: res.alumniInfo?.batch || prev.batch,
                passingYear: res.alumniInfo?.passingYear ? String(res.alumniInfo.passingYear) : prev.passingYear,
                email: alumniVerify.email || prev.email,
            }));
            // Send OTP to email
            const otpRes: any = await authApi.sendOtp({
                rollNumber: alumniVerify.rollNumber,
                email: alumniVerify.email,
            });
            setOtpSent(true);
            setStep(1.5);
            if (otpRes?.otp) {
                Alert.alert('OTP Sent', `Dev mode — OTP: ${otpRes.otp}`);
            } else {
                Alert.alert('OTP Sent', `A verification code has been sent to ${alumniVerify.email}`);
            }
        } catch (e: any) {
            Alert.alert('Verification Failed', e.message || 'Could not verify alumni record');
        } finally { setLoading(false); }
    };

    // ── Alumni Step 1.5: verify OTP ────────────────────────────────────────────
    const handleOtpVerify = async () => {
        if (!otpValue || otpValue.length < 4) {
            setErrors({ otp: 'Enter the OTP sent to your mobile' });
            return;
        }
        setLoading(true);
        try {
            await authApi.verifyOtp({
                rollNumber: alumniVerify.rollNumber,
                otp: otpValue,
            });
            setStep(2);
        } catch (e: any) {
            setErrors({ otp: e.message || 'Invalid or expired OTP' });
        } finally { setLoading(false); }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        try {
            const otpRes: any = await authApi.sendOtp({
                rollNumber: alumniVerify.rollNumber,
                email: alumniVerify.email,
            });
            if (otpRes?.otp) {
                Alert.alert('OTP Resent', `Dev mode — OTP: ${otpRes.otp}`);
            } else {
                Alert.alert('OTP Resent', `New OTP sent to ${alumniVerify.email}`);
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to resend OTP');
        } finally { setLoading(false); }
    };

    // ── Mentor Step 1: validate mentor ID ─────────────────────────────────────
    const handleMentorVerify = async () => {
        const newErrors: Record<string, string> = {};
        if (!mentorVerify.mentorId) newErrors.mentorId = 'Mentor ID is required';
        if (!mentorVerify.name) newErrors.mentorName = 'Name is required';
        if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

        setLoading(true);
        try {
            const res: any = await authApi.checkMentor(mentorVerify);
            setMentorInfo(res.mentorInfo);
            setForm(prev => ({ ...prev, name: res.mentorInfo.name }));
            setStep(2);
        } catch (e: any) {
            Alert.alert('Validation Failed', e.message || 'Mentor ID not found');
        } finally { setLoading(false); }
    };

    // ── Final registration ─────────────────────────────────────────────────────
    const validateAccountForm = () => {
        const errs: Record<string, string> = {};
        if (!form.name) errs.name = 'Name is required';
        if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required';
        if (!form.password || form.password.length < 6) errs.password = 'Min 6 characters';
        if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
        if (!form.institution) errs.institution = 'Institution is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleRegister = async () => {
        if (!validateAccountForm()) return;
        setLoading(true);
        try {
            const payload: any = {
                name: form.name, email: form.email, password: form.password,
                role, institution: form.institution,
            };
            if (form.bio) payload.bio = form.bio;
            if (form.company) payload.company = form.company;
            if (form.domain) payload.domain = form.domain;
            if (form.yearsOfExperience) payload.yearsOfExperience = Number(form.yearsOfExperience);
            if (form.batch) payload.batch = form.batch;

            if (role === 'alumni') {
                payload.rollNumber = alumniVerify.rollNumber;
                payload.mobileNumber = alumniVerify.mobileNumber;
                if (form.passingYear) payload.passingYear = Number(form.passingYear);
            }
            if (role === 'mentor') {
                payload.mentorId = mentorVerify.mentorId;
                if (form.expertise) {
                    payload.expertise = form.expertise.split(',').map((e: string) => e.trim()).filter(Boolean);
                }
            }

            await register(payload);
        } catch (e: any) {
            Alert.alert('Registration Failed', e.message || 'Please try again');
        } finally { setLoading(false); }
    };

    // ── Render helpers ─────────────────────────────────────────────────────────

    const renderRoleSelector = () => (
        <>
            <Text style={styles.label}>Select Role</Text>
            <View style={styles.roleContainer}>
                {ROLES.map(r => (
                    <TouchableOpacity
                        key={r.value}
                        style={[styles.roleButton, role === r.value && styles.roleButtonActive]}
                        onPress={() => setRole(r.value)}
                    >
                        <Text style={[styles.roleText, role === r.value && styles.roleTextActive]}>
                            {r.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </>
    );

    const renderAlumniVerifyStep = () => (
        <>
            <Text style={styles.stepLabel}>Step 1 of 2 — Verify Alumni Record</Text>
            <Text style={styles.stepHint}>
                Only approved alumni can register. Enter your details to verify. An OTP will be sent to your email.
            </Text>
            <Input label="Roll Number *" value={alumniVerify.rollNumber}
                onChangeText={v => setAlumniVerify(p => ({ ...p, rollNumber: v }))}
                placeholder="Your college roll number"
                autoCapitalize="none"
                error={errors.rollNumber} />
            <Input label="Name (as per records) *" value={alumniVerify.name}
                onChangeText={v => setAlumniVerify(p => ({ ...p, name: v }))}
                placeholder="Full name"
                error={errors.name} />
            <Input label="Registered Mobile Number *" value={alumniVerify.mobileNumber}
                onChangeText={v => setAlumniVerify(p => ({ ...p, mobileNumber: v }))}
                placeholder="+91 9876543210"
                keyboardType="phone-pad"
                error={errors.mobileNumber} />
            <Input label="Email *" value={alumniVerify.email}
                onChangeText={v => setAlumniVerify(p => ({ ...p, email: v }))}
                placeholder="Your email address (OTP will be sent here)"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.verifyEmail} />
            <Button title={loading ? 'Verifying…' : 'Verify & Send OTP'}
                onPress={handleAlumniVerify} loading={loading} style={styles.button} />
        </>
    );

    const renderOtpStep = () => (
        <>
            <Text style={styles.stepLabel}>Step 1.5 of 2 — Verify Mobile OTP</Text>
            <Text style={styles.stepHint}>
                Enter the 6-digit OTP sent to {alumniVerify.email}
            </Text>
            {alumniInfo && (
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>✓ Verified: {alumniInfo.name}</Text>
                    <Text style={styles.infoText}>Institution: {alumniInfo.institution}</Text>
                </View>
            )}
            <Input
                label="OTP *"
                value={otpValue}
                onChangeText={v => { setOtpValue(v); setErrors({}); }}
                placeholder="Enter 6-digit OTP"
                keyboardType="number-pad"
                maxLength={6}
                error={errors.otp}
            />
            <Button
                title={loading ? 'Verifying…' : 'Verify OTP & Continue'}
                onPress={handleOtpVerify}
                loading={loading}
                style={styles.button}
            />
            <TouchableOpacity onPress={handleResendOtp} disabled={loading} style={styles.resendBtn}>
                <Text style={styles.resendText}>Didn't receive OTP? Resend</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setStep(1); setOtpValue(''); setErrors({}); }} style={styles.backBtn}>
                <Text style={styles.backText}>← Change details</Text>
            </TouchableOpacity>
        </>
    );

    const renderMentorVerifyStep = () => (
        <>
            <Text style={styles.stepLabel}>Step 1 of 2 — Validate Mentor ID</Text>
            <Text style={styles.stepHint}>
                Enter the Mentor ID assigned by the admin to proceed.
            </Text>
            <Input label="Mentor ID *" value={mentorVerify.mentorId}
                onChangeText={v => setMentorVerify(p => ({ ...p, mentorId: v }))}
                placeholder="Mentor ID provided by admin"
                autoCapitalize="none"
                error={errors.mentorId} />
            <Input label="Your Name *" value={mentorVerify.name}
                onChangeText={v => setMentorVerify(p => ({ ...p, name: v }))}
                placeholder="Full name"
                error={errors.mentorName} />
            <Button title={loading ? 'Validating…' : 'Validate Mentor ID'}
                onPress={handleMentorVerify} loading={loading} style={styles.button} />
        </>
    );

    const renderAccountStep = () => (
        <>
            {role === 'alumni' && <Text style={styles.stepLabel}>Step 2 of 2 — Create Account</Text>}
            {role === 'mentor' && (
                <>
                    <Text style={styles.stepLabel}>Step 2 of 2 — Create Account</Text>
                    {mentorInfo && (
                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>Validated: {mentorInfo.name}</Text>
                            <Text style={styles.infoText}>Designation: {mentorInfo.designation}</Text>
                        </View>
                    )}
                </>
            )}

            <Input label="Full Name *" value={form.name}
                onChangeText={v => updateField('name', v)} placeholder="Enter your full name"
                error={errors.name} />
            <Input label="Email *" value={form.email}
                onChangeText={v => updateField('email', v)} placeholder="Enter your email"
                keyboardType="email-address" autoCapitalize="none" error={errors.email} />

            {/* Institution with autocomplete */}
            <View style={{ zIndex: 10, position: 'relative' }}>
                <Input label="Institution *" value={form.institution}
                    onChangeText={v => updateField('institution', v)}
                    onFocus={() => {
                        setFilteredColleges(form.institution
                            ? colleges.filter(c => c.toLowerCase().includes(form.institution.toLowerCase()))
                            : colleges);
                        setShowDropdown(true);
                    }}
                    placeholder="Enter your institution" error={errors.institution} />
                {showDropdown && filteredColleges.length > 0 && (
                    <View style={styles.dropdownContainer}>
                        {filteredColleges.slice(0, 5).map((c, i) => (
                            <TouchableOpacity key={i} style={styles.dropdownItem}
                                onPress={() => { updateField('institution', c); setShowDropdown(false); }}>
                                <Text style={styles.dropdownItemText}>{c}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {(role === 'mentor' || role === 'alumni') && (
                <>
                    <Input label="Company" value={form.company}
                        onChangeText={v => updateField('company', v)} placeholder="Current or last company" />
                    <Input label="Domain" value={form.domain}
                        onChangeText={v => updateField('domain', v)} placeholder="e.g. Software Engineering" />
                    <Input label="Bio" value={form.bio}
                        onChangeText={v => updateField('bio', v)} placeholder="About you" />
                    <Input label="Years of Experience" value={form.yearsOfExperience}
                        onChangeText={v => updateField('yearsOfExperience', v)}
                        placeholder="e.g. 3" keyboardType="numeric" />
                </>
            )}
            {role === 'alumni' && (
                <>
                    <Input label="Batch" value={form.batch}
                        onChangeText={v => updateField('batch', v)} placeholder="e.g. 2019-2023" />
                    <Input label="Passing Year" value={form.passingYear}
                        keyboardType="numeric"
                        onChangeText={v => updateField('passingYear', v)} placeholder="e.g. 2023" />
                </>
            )}
            {role === 'mentor' && (
                <Input label="Expertise (comma-separated)" value={form.expertise}
                    onChangeText={v => updateField('expertise', v)}
                    placeholder="e.g. React, Node.js, Python" />
            )}

            <Input label="Password *" value={form.password}
                onChangeText={v => updateField('password', v)}
                placeholder="Create a password (min 6 chars)"
                secureTextEntry error={errors.password} />
            <Input label="Confirm Password *" value={form.confirmPassword}
                onChangeText={v => updateField('confirmPassword', v)}
                placeholder="Confirm your password"
                secureTextEntry error={errors.confirmPassword} />

            <Button title={loading ? 'Creating Account…' : 'Create Account'}
                onPress={handleRegister} loading={loading} style={styles.button} />
        </>
    );

    const getStepContent = () => {
        if (role === 'alumni') {
            if (step === 1) return renderAlumniVerifyStep();
            if (step === 1.5) return renderOtpStep();
            return renderAccountStep();
        }
        if (role === 'mentor') {
            if (step === 1) return renderMentorVerifyStep();
            return renderAccountStep();
        }
        return renderAccountStep(); // student
    };

    return (
        <KeyboardAvoidingView style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join EduBond today</Text>
                </View>

                <View style={styles.form}>
                    {renderRoleSelector()}
                    {getStepContent()}

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <Button title="Sign In" variant="ghost"
                            onPress={() => navigation.navigate('Login')} />
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { flexGrow: 1, padding: SIZES.lg, paddingTop: SIZES.xxl },
    header: { marginBottom: SIZES.xl, alignItems: 'center' },
    title: { fontSize: SIZES.fontXxl, fontWeight: 'bold', color: COLORS.foreground, marginBottom: SIZES.sm },
    subtitle: { fontSize: SIZES.fontMd, color: COLORS.muted },
    form: { width: '100%' },
    label: { fontSize: SIZES.fontMd, color: COLORS.foreground, marginBottom: SIZES.sm, fontWeight: '500' },
    roleContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm, marginBottom: SIZES.lg },
    roleButton: {
        paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
        borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: COLORS.border,
    },
    roleButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    roleText: { fontSize: SIZES.fontMd, color: COLORS.muted },
    roleTextActive: { color: COLORS.white, fontWeight: '600' },
    stepLabel: {
        fontSize: SIZES.fontMd, fontWeight: '700', color: COLORS.primary,
        marginBottom: SIZES.xs,
    },
    stepHint: {
        fontSize: SIZES.fontSm, color: COLORS.muted, marginBottom: SIZES.md, lineHeight: 18,
    },
    infoBox: {
        backgroundColor: COLORS.primary + '15',
        borderRadius: SIZES.radiusMd, padding: SIZES.md,
        borderWidth: 1, borderColor: COLORS.primary + '40',
        marginBottom: SIZES.md,
    },
    infoText: { fontSize: SIZES.fontSm, color: COLORS.foreground, marginBottom: 2 },
    dropdownContainer: {
        position: 'absolute', top: 85, left: 0, right: 0,
        backgroundColor: COLORS.backgroundLight, borderRadius: SIZES.radiusMd,
        borderWidth: 1, borderColor: COLORS.border, maxHeight: 200, zIndex: 1000, elevation: 5,
    },
    dropdownItem: { padding: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    dropdownItemText: { fontSize: SIZES.fontMd, color: COLORS.foreground },
    button: { marginTop: SIZES.md },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: SIZES.xl },
    footerText: { fontSize: SIZES.fontMd, color: COLORS.muted },
    resendBtn: { alignItems: 'center', marginTop: SIZES.md },
    resendText: { fontSize: SIZES.fontSm, color: COLORS.primary, fontWeight: '600' },
    backBtn: { alignItems: 'center', marginTop: SIZES.sm },
    backText: { fontSize: SIZES.fontSm, color: COLORS.muted },
});
