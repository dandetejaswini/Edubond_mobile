import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
    TouchableOpacityProps,
} from 'react-native';
import { COLORS, SIZES } from '../../constants/colors';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    disabled,
    style,
    ...props
}) => {
    const buttonStyles = [
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'outline' && styles.outlineButton,
        variant === 'ghost' && styles.ghostButton,
        size === 'sm' && styles.smallButton,
        size === 'lg' && styles.largeButton,
        disabled && styles.disabledButton,
        style,
    ];

    const textStyles = [
        styles.text,
        variant === 'primary' && styles.primaryText,
        variant === 'secondary' && styles.secondaryText,
        variant === 'outline' && styles.outlineText,
        variant === 'ghost' && styles.ghostText,
        size === 'sm' && styles.smallText,
        size === 'lg' && styles.largeText,
        disabled && styles.disabledText,
    ];

    return (
        <TouchableOpacity
            style={buttonStyles}
            disabled={disabled || loading}
            activeOpacity={0.7}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? COLORS.white : COLORS.primary} />
            ) : (
                <View style={styles.content}>
                    {icon && <View style={styles.icon}>{icon}</View>}
                    <Text style={textStyles}>{title}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: SIZES.md,
        paddingHorizontal: SIZES.lg,
        borderRadius: SIZES.radiusMd,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: SIZES.sm,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
    },
    secondaryButton: {
        backgroundColor: COLORS.accent,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    ghostButton: {
        backgroundColor: 'transparent',
    },
    smallButton: {
        paddingVertical: SIZES.sm,
        paddingHorizontal: SIZES.md,
    },
    largeButton: {
        paddingVertical: SIZES.lg,
        paddingHorizontal: SIZES.xl,
    },
    disabledButton: {
        opacity: 0.5,
    },
    text: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
    },
    primaryText: {
        color: COLORS.white,
    },
    secondaryText: {
        color: COLORS.white,
    },
    outlineText: {
        color: COLORS.primary,
    },
    ghostText: {
        color: COLORS.primary,
    },
    smallText: {
        fontSize: SIZES.fontSm,
    },
    largeText: {
        fontSize: SIZES.fontLg,
    },
    disabledText: {
        opacity: 0.7,
    },
});
