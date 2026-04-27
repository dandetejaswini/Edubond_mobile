import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../services/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { COLORS, SIZES } from '../../constants/colors';

export const ProfileScreen: React.FC = () => {
    const { user, logout, updateUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingResume, setUploadingResume] = useState(false);

    const [name, setName] = useState(user?.name || '');
    const [institution, setInstitution] = useState(user?.institution || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [company, setCompany] = useState(user?.company || '');
    const [domain, setDomain] = useState(user?.domain || '');
    const [expertise, setExpertise] = useState((user?.expertise || []).join(', '));
    const [yearsOfExperience, setYearsOfExperience] = useState(
        user?.yearsOfExperience ? String(user.yearsOfExperience) : ''
    );

    const isMentor = user?.role === 'mentor';
    const isAlumni = user?.role === 'alumni';

    const handleSave = async () => {
        setSaving(true);
        try {
            const updateData: any = { name, institution };

            if (isMentor || isAlumni) {
                updateData.bio = bio;
                updateData.company = company;
                updateData.domain = domain;
                if (yearsOfExperience) updateData.yearsOfExperience = Number(yearsOfExperience);
            }
            if (isMentor) {
                updateData.expertise = expertise.split(',').map((e: string) => e.trim()).filter(Boolean);
            }

            await userApi.updateProfile(updateData);
            Alert.alert('Success', 'Profile updated successfully');
            setEditing(false);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    const handleResumeUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            const file = result.assets[0];
            setUploadingResume(true);

            const formData = new FormData();
            formData.append('resume', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/pdf',
            } as any);

            const res: any = await userApi.uploadResume(formData);
            await updateUser({
                resumeUrl: 'resume_uploaded',
                extractedSkills: res.extractedSkills || [],
            });
            Alert.alert(
                'Resume Uploaded',
                `Skills extracted: ${(res.extractedSkills || []).join(', ') || 'None found'}`
            );
        } catch (e: any) {
            Alert.alert('Upload Failed', e.message || 'Could not upload resume');
        } finally {
            setUploadingResume(false);
        }
    };

    const statusColor = user?.status === 'approved' ? '#22c55e' : user?.status === 'rejected' ? '#ef4444' : '#f59e0b';
    const statusLabel = user?.status === 'approved' ? 'Approved' : user?.status === 'rejected' ? 'Rejected' : 'Pending Review';

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Avatar name={user?.name || 'User'} size={100} />
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.email}>{user?.email}</Text>
                <Text style={styles.role}>{user?.role}</Text>
                {user?.status && (
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                )}
            </View>

            <View style={styles.form}>
                {editing ? (
                    <>
                        <Input label="Full Name" value={name} onChangeText={setName} />
                        <Input label="Institution" value={institution} onChangeText={setInstitution} />

                        {(isMentor || isAlumni) && (
                            <>
                                <Input label="Company" value={company} onChangeText={setCompany} placeholder="Your company" />
                                <Input label="Domain" value={domain} onChangeText={setDomain} placeholder="e.g. Software Engineering" />
                                <Input label="Bio" value={bio} onChangeText={setBio} placeholder="Tell students about yourself" />
                                <Input
                                    label="Years of Experience"
                                    value={yearsOfExperience}
                                    onChangeText={setYearsOfExperience}
                                    keyboardType="numeric"
                                    placeholder="e.g. 5"
                                />
                            </>
                        )}

                        {isMentor && (
                            <Input
                                label="Expertise (comma-separated)"
                                value={expertise}
                                onChangeText={setExpertise}
                                placeholder="e.g. React, Node.js, Python"
                            />
                        )}

                        <Button title={saving ? 'Saving...' : 'Save Changes'} onPress={handleSave} loading={saving} />
                        <Button
                            title="Cancel"
                            variant="outline"
                            onPress={() => setEditing(false)}
                            style={styles.button}
                        />
                    </>
                ) : (
                    <>
                        <View style={styles.field}>
                            <Text style={styles.label}>Institution</Text>
                            <Text style={styles.value}>{user?.institution || '—'}</Text>
                        </View>

                        {(isMentor || isAlumni) && (
                            <>
                                {user?.company ? (
                                    <View style={styles.field}>
                                        <Text style={styles.label}>Company</Text>
                                        <Text style={styles.value}>{user.company}</Text>
                                    </View>
                                ) : null}
                                {user?.domain ? (
                                    <View style={styles.field}>
                                        <Text style={styles.label}>Domain</Text>
                                        <Text style={styles.value}>{user.domain}</Text>
                                    </View>
                                ) : null}
                                {user?.yearsOfExperience ? (
                                    <View style={styles.field}>
                                        <Text style={styles.label}>Years of Experience</Text>
                                        <Text style={styles.value}>{user.yearsOfExperience}</Text>
                                    </View>
                                ) : null}
                                {user?.bio ? (
                                    <View style={styles.field}>
                                        <Text style={styles.label}>Bio</Text>
                                        <Text style={styles.value}>{user.bio}</Text>
                                    </View>
                                ) : null}
                            </>
                        )}

                        {isMentor && user?.expertise?.length ? (
                            <View style={styles.field}>
                                <Text style={styles.label}>Expertise</Text>
                                <Text style={styles.value}>{user.expertise.join(', ')}</Text>
                            </View>
                        ) : null}

                        {isAlumni && (
                            <>
                                {user?.rollNumber ? (
                                    <View style={styles.field}>
                                        <Text style={styles.label}>Roll Number</Text>
                                        <Text style={styles.value}>{user.rollNumber}</Text>
                                    </View>
                                ) : null}
                                {user?.passingYear ? (
                                    <View style={styles.field}>
                                        <Text style={styles.label}>Passing Year</Text>
                                        <Text style={styles.value}>{user.passingYear}</Text>
                                    </View>
                                ) : null}
                                {user?.mobileNumber ? (
                                    <View style={styles.field}>
                                        <Text style={styles.label}>Mobile Number</Text>
                                        <Text style={styles.value}>{user.mobileNumber}</Text>
                                    </View>
                                ) : null}
                                {user?.batch ? (
                                    <View style={styles.field}>
                                        <Text style={styles.label}>Batch</Text>
                                        <Text style={styles.value}>{user.batch}</Text>
                                    </View>
                                ) : null}
                            </>
                        )}

                        {user?.role === 'student' && (
                            <>
                                {user?.skills?.length ? (
                                    <View style={styles.field}>
                                        <Text style={styles.label}>Skills</Text>
                                        <Text style={styles.value}>{user.skills.join(', ')}</Text>
                                    </View>
                                ) : null}
                                {/* Resume section */}
                                <View style={styles.field}>
                                    <Text style={styles.label}>Resume</Text>
                                    {user?.resumeUrl ? (
                                        <Text style={[styles.value, { color: '#22c55e', fontSize: SIZES.fontMd }]}>
                                            Resume uploaded
                                        </Text>
                                    ) : (
                                        <Text style={[styles.value, { color: COLORS.muted, fontSize: SIZES.fontMd }]}>
                                            No resume uploaded yet
                                        </Text>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.resumeBtn, uploadingResume && { opacity: 0.6 }]}
                                        onPress={handleResumeUpload}
                                        disabled={uploadingResume}>
                                        <Text style={styles.resumeBtnText}>
                                            {uploadingResume ? 'Uploading…' : user?.resumeUrl ? 'Update Resume' : 'Upload Resume (PDF/DOC)'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {user?.extractedSkills?.length ? (
                                    <View style={styles.field}>
                                        <Text style={styles.label}>Extracted Skills</Text>
                                        <Text style={styles.value}>{user.extractedSkills.slice(0, 8).join(', ')}</Text>
                                    </View>
                                ) : null}
                            </>
                        )}

                        <Button title="Edit Profile" variant="outline" onPress={() => setEditing(true)} />
                        <Button title="Logout" variant="ghost" onPress={handleLogout} style={styles.button} />
                    </>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        alignItems: 'center',
        padding: SIZES.xl,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    name: { fontSize: SIZES.fontXxl, fontWeight: 'bold', color: COLORS.foreground, marginTop: SIZES.md },
    email: { fontSize: SIZES.fontMd, color: COLORS.muted, marginTop: SIZES.xs },
    role: { fontSize: SIZES.fontMd, color: COLORS.primary, marginTop: SIZES.xs, textTransform: 'capitalize' },
    statusBadge: {
        marginTop: SIZES.sm,
        paddingHorizontal: SIZES.md,
        paddingVertical: 4,
        borderRadius: SIZES.radiusMd,
        borderWidth: 1,
    },
    statusText: { fontSize: SIZES.fontSm, fontWeight: '600' },
    form: { padding: SIZES.lg },
    field: { marginBottom: SIZES.lg },
    label: { fontSize: SIZES.fontSm, color: COLORS.muted, marginBottom: SIZES.xs },
    value: { fontSize: SIZES.fontLg, color: COLORS.foreground },
    button: { marginTop: SIZES.md },
    resumeBtn: {
        marginTop: SIZES.sm, backgroundColor: COLORS.primary + '15',
        borderRadius: SIZES.radiusMd, padding: SIZES.sm, alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.primary + '40',
    },
    resumeBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: SIZES.fontSm },
});
