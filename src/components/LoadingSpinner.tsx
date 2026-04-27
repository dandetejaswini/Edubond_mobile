import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export const LoadingSpinner: React.FC<{ size?: 'small' | 'large' }> = ({ size = 'large' }) => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size={size} color={COLORS.primary} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
});
