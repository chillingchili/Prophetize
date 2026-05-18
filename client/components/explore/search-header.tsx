import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { UI_COLORS } from '@/constants/ui-tokens';

type Props = {
    balance: number;
    unreadCount?: number;
    onNotificationPress?: () => void;
    onSearchChange?: (text: string) => void;
    onSearchSubmit?: (text: string) => void;
};

export default function SearchHeader({
    balance,
    unreadCount = 0,
    onNotificationPress,
    onSearchChange,
    onSearchSubmit,
}: Props) {
    const [query, setQuery] = useState('');

    const formatted = balance.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const handleChange = (text: string) => {
        setQuery(text);
        onSearchChange?.(text);
    };

    return (
        <View className="gap-3">
            {/* Balance row */}
            <View className="flex-row items-center pb-1 gap-2">
                <View className="flex-row items-center gap-3 flex-1 inline-flex">
                    <Image
                        source={require('../../assets/app-icons/p-coin.png')}
                        style={{ width: 36, height: 36 }}
                        resizeMode="contain"
                    />
                    <Text
                        className="font-jetbrain-bold text-[26px] tracking-[-1px]"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={{ color: UI_COLORS.textPrimary }}
                    >
                        {formatted}
                    </Text>
                </View>

                <Pressable
                    onPress={onNotificationPress}
                    hitSlop={10}
                    accessibilityLabel="Notifications"
                    accessibilityRole="button"
                    accessibilityHint="Opens notifications"
                    style={({ pressed }) => ({
                        padding: 12,  // Increased from 8 to ensure 44px minimum (24px icon + 24px padding)
                        opacity: pressed ? 0.85 : 1,
                        transform: [{ scale: pressed ? 0.92 : 1 }],
                    })}
                    className="rounded-full"
                >
                    <View>
                        <Ionicons name="notifications-outline" size={24} color={UI_COLORS.textPrimary} />
                        {unreadCount > 0 && (
                            <View
                                style={{
                                    position: 'absolute',
                                    top: -2,
                                    right: -4,
                                    minWidth: 16,
                                    height: 16,
                                    borderRadius: 8,
                                    backgroundColor: UI_COLORS.accent,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingHorizontal: 3,
                                }}
                            >
                                <Text
                                    style={{
                                        color: UI_COLORS.surface,
                                        fontSize: 10,
                                        fontWeight: '700',
                                        lineHeight: 14,
                                    }}
                                >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </Pressable>
            </View>

            {/* Search bar */}
            <View
                className="flex-row items-center rounded-xl px-3 gap-2"
                style={{
                    backgroundColor: UI_COLORS.surfaceSoft,
                    borderWidth: 1,
                    borderColor: UI_COLORS.border,
                    height: 48,
                }}
            >
                <Ionicons name="search-outline" size={20} color={UI_COLORS.textSecondary} />
                <TextInput
                    value={query}
                    onChangeText={handleChange}
                    onSubmitEditing={() => onSearchSubmit?.(query)}
                    placeholder="Search markets…"
                    placeholderTextColor={UI_COLORS.textMuted}
                    returnKeyType="search"
                    className="flex-1 font-jetbrain text-[14px]"
                    style={{ color: UI_COLORS.textPrimary, paddingVertical: 0 }}
                />
                {query.length > 0 && (
                    <Pressable
                        onPress={() => {
                            setQuery('');
                            onSearchChange?.('');
                        }}
                        hitSlop={13}
                        accessibilityLabel="Clear search"
                        accessibilityRole="button"
                        accessibilityHint="Clears the search field"
                        style={({ pressed }) => ({
                            opacity: pressed ? 0.8 : 1,
                            transform: [{ scale: pressed ? 0.92 : 1 }],
                        })}
                    >
                        <Ionicons name="close-circle" size={20} color={UI_COLORS.textSecondary} />
                    </Pressable>
                )}
            </View>
        </View>
    );
}
