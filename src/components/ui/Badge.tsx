import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { COLORS, SIZES } from '../../constants/colors';

interface BadgeProps extends ViewProps {
    text: string;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export const Badge: React.FC<BadgeProps> = ({ text, variant = 'primary', style, ...props }) => {
    const badgeStyles = [
        styles.badge,
        variant === 'primary' && styles.primaryBadge,
        variant === 'secondary' && styles.secondaryBadge,
        variant === 'success' && styles.successBadge,
        variant === 'warning' && styles.warningBadge,
        variant === 'error' && styles.errorBadge,
        style,
    ];

    return (
        <View style={badgeStyles} {...props}>
            <Text style={styles.text}>{text}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: SIZES.sm,
        paddingVertical: SIZES.xs,
        borderRadius: SIZES.radiusSm,
        alignSelf: 'flex-start',
    },
    primaryBadge: {
        backgroundColor: `${COLORS.primary}20`,
    },
    secondaryBadge: {
        backgroundColor: `${COLORS.accent}20`,
    },
    successBadge: {
        backgroundColor: `${COLORS.success}20`,
    },
    warningBadge: {
        backgroundColor: `${COLORS.warning}20`,
    },
    errorBadge: {
        backgroundColor: `${COLORS.error}20`,
    },
    text: {
        fontSize: SIZES.fontSm,
        fontWeight: '600',
        color: COLORS.foreground,
    },
});
