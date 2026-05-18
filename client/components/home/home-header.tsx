import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { ExploreTheme } from '@/constants/explore-theme';
import { UI_COLORS } from '@/constants/ui-tokens';

type Props = {
    balance: number;
    unreadCount?: number;
    onNotificationPress?: () => void;
}

function AnimatedBalance({ value }: { value: number }) {
    const [displayed, setDisplayed] = useState(value);
    const prevValue = useRef(value);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        if (prevValue.current === value) return;

        const start = prevValue.current;
        const end = value;
        const duration = 600;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = start + (end - start) * eased;
            setDisplayed(current);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                prevValue.current = end;
            }
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [value]);

    const formatted = displayed.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return (
        <Text
            className="font-jetbrain-bold text-2xl tracking-[-1px]"
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ color: ExploreTheme.titleText }}
        >
            {formatted}
        </Text>
    );
}

export default function HomeHeader({ balance, unreadCount = 0, onNotificationPress }: Props) {
    return (
        <View className="h-auto w-full flex-row items-center gap-2">
            <View className="flex-row items-center gap-3 flex-1 p-2 inline-flex">
                <Image
                    source={require('../../assets/app-icons/p-coin.png')}
                    style={{ width: 44, height: 44 }}
                    resizeMode="contain"
                />
                <AnimatedBalance value={balance} />
            </View>

            <Pressable
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onNotificationPress?.();
                }}
                hitSlop={10}
                accessibilityLabel="Notifications"
                accessibilityRole="button"
                accessibilityHint="Opens notifications"
                style={({ pressed }) => ({
                    width: 40,
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                    backgroundColor: pressed ? UI_COLORS.surfaceMuted : UI_COLORS.surfaceSoft,
                    borderWidth: 1,
                    borderColor: UI_COLORS.borderSoft,
                })}
                className="rounded-full"
            >
                <View>
                    <Ionicons name="notifications-outline" size={20} color={ExploreTheme.titleText} />
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
    );
}
