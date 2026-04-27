import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { COLORS, SIZES } from '../../constants/colors';

interface CardProps extends ViewProps {
    children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, style, ...props }) => {
    return (
        <View style={[styles.card, style]} {...props}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderRadius: SIZES.radiusLg,
        padding: SIZES.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
});
