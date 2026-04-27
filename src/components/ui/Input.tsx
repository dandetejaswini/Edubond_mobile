import React, { useState } from 'react';
import {
    TextInput,
    Text,
    View,
    StyleSheet,
    TextInputProps,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/colors';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    style,
    secureTextEntry,
    ...props
}) => {
    const [hidden, setHidden] = useState(secureTextEntry ?? false);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.inputContainer, error && styles.inputError]}>
                {icon && <View style={styles.icon}>{icon}</View>}
                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor={COLORS.muted}
                    secureTextEntry={hidden}
                    {...props}
                />
                {secureTextEntry && (
                    <TouchableOpacity onPress={() => setHidden(h => !h)} style={styles.eyeBtn}>
                        <Ionicons
                            name={hidden ? 'eye-outline' : 'eye-off-outline'}
                            size={20}
                            color={COLORS.muted}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SIZES.md,
    },
    label: {
        fontSize: SIZES.fontMd,
        color: COLORS.foreground,
        marginBottom: SIZES.sm,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundLight,
        borderRadius: SIZES.radiusMd,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SIZES.md,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    icon: {
        marginRight: SIZES.sm,
    },
    input: {
        flex: 1,
        paddingVertical: SIZES.md,
        fontSize: SIZES.fontMd,
        color: COLORS.foreground,
    },
    errorText: {
        fontSize: SIZES.fontSm,
        color: COLORS.error,
        marginTop: SIZES.xs,
    },
    eyeBtn: {
        paddingLeft: SIZES.sm,
        paddingVertical: SIZES.sm,
    },
});
