import React from 'react';
import { Text, View, Image } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { getTopRankStyle } from './leaderboard-style';
import { UI_COLORS, UI_TYPE_SCALE, UI_SHADOWS } from '@/constants/ui-tokens';

export type LeaderboardEntry = {
    rank: number;
    username: string;
    initials: string;
    wins: number;
    netWorth: number;
    isCurrentUser?: boolean;
};

type Props = {
    item: LeaderboardEntry;
};

export default function LeaderboardRow({ item }: Props) {
    const isTopThree = item.rank <= 3;
    const isCurrentUser = item.isCurrentUser;
    const topStyles = getTopRankStyle(item.rank);
    const netWorth = Number.isFinite(item.netWorth) ? item.netWorth : 0;
    const valueColor = UI_COLORS.success;
    const valueLabel = netWorth.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    if (!isTopThree) {
        return (
            <View
                accessible
                accessibilityLabel={`${item.username} leaderboard row`}
                className="rounded-2xl border px-3 py-3"
                style={{
                    borderColor: isCurrentUser ? UI_COLORS.accentBorder : UI_COLORS.border,
                    borderWidth: 1,
                    backgroundColor: isCurrentUser ? UI_COLORS.accentSoft : UI_COLORS.surface,
                }}
            >
                <View className="flex-row items-center gap-3 py-1">
                    <Text className="font-jetbrain text-[12px] w-6 text-center" style={{ color: UI_COLORS.textSecondary }}>
                        {item.rank}
                    </Text>

                    <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: UI_COLORS.accentSoft }}>
                        <Text className="font-grotesk-bold text-[14px]" style={{ color: UI_COLORS.accent }}>
                            {item.initials}
                        </Text>
                    </View>

                    <Text className="font-grotesk-bold text-[13px] flex-1" style={{ color: UI_COLORS.textPrimary }} numberOfLines={1}>
                        {item.username}
                    </Text>

                    <View className="flex-row items-center gap-1">
                        <Image
                            source={require('../../assets/app-icons/p-coin.png')}
                            style={{ width: 12, height: 12 }}
                            resizeMode="contain"
                        />
                        <Text className="font-jetbrain-bold text-[14px]" style={{ color: valueColor }}>
                            {valueLabel}
                        </Text>
                    </View>
                </View>

                {isCurrentUser ? (
                    <View className="absolute -top-2 right-3 rounded-md px-2 py-1" style={{ backgroundColor: UI_COLORS.accent }}>
                        <Text className="font-jetbrain-bold text-[10px] text-white">YOU</Text>
                    </View>
                ) : null}
            </View>
        );
    }

    return (
        <View
            accessible
            accessibilityLabel={`${item.username} rank ${item.rank} leaderboard row`}
            className="rounded-2xl border px-3 py-3"
            style={{
                borderColor: isCurrentUser ? UI_COLORS.accentBorder : topStyles.borderColor,
                backgroundColor: isCurrentUser ? UI_COLORS.accentSoft : topStyles.cardBg,
                ...UI_SHADOWS.lift,
            }}
        >
            {item.rank === 1 && (
                <View className="absolute left-2 top-2 z-10">
                    <MaterialIcons name="workspace-premium" size={16} color={UI_COLORS.leaderboard.premium.rowIcon} />
                </View>
            )}

            <View className="flex-row items-center gap-3">
                <View className="h-8 min-w-8 items-center justify-center rounded-lg px-2" style={{ backgroundColor: topStyles.stripeBg }}>
                    <Text className="font-jetbrain-bold text-[12px]" style={{ color: topStyles.rankColor }}>
                        {item.rank}
                    </Text>
                </View>

                <View
                    className="h-10 w-10 items-center justify-center rounded-full border"
                    style={{ backgroundColor: topStyles.badgeBg, borderColor: topStyles.borderColor }}
                >
                    <Text className="font-grotesk-bold text-[16px]" style={{ color: topStyles.badgeColor }}>
                        {item.initials}
                    </Text>
                </View>

                <View className="flex-1">
                    <Text className="font-grotesk-bold text-[12px]" style={{ color: UI_COLORS.textPrimary, fontSize: UI_TYPE_SCALE.leaderboard.rowValue }} numberOfLines={1}>
                        {item.username}
                    </Text>
                    <Text className="font-jetbrain text-[11px]" style={{ color: UI_COLORS.textSecondary, fontSize: UI_TYPE_SCALE.leaderboard.rowMeta }}>
                        {item.wins} wins
                    </Text>
                </View>

                <View className="flex-row items-center gap-1">
                    <Image
                        source={require('../../assets/app-icons/p-coin.png')}
                        style={{ width: 11, height: 11 }}
                        resizeMode="contain"
                    />
                    <Text className="font-jetbrain-bold text-[12px]" style={{ color: valueColor }}>
                        {valueLabel}
                    </Text>
                </View>
            </View>
        </View>
    );
}



