import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/colors';

interface AvatarProps {
    name: string;
    imageUrl?: string;
    size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ name, imageUrl, size = 40 }) => {
    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
            {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
            ) : (
                <Text style={[styles.initials, { fontSize: size / 2.5 }]}>{getInitials(name)}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    avatar: {
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        resizeMode: 'cover',
    },
    initials: {
        color: COLORS.white,
        fontWeight: '600',
    },
});
