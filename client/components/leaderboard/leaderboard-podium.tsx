import React from 'react';
import { Text, View, Image } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ExploreTheme } from '@/constants/explore-theme';
import { LeaderboardEntry } from './leaderboard-row';
import { getTopRankStyle } from './leaderboard-style';
import { UI_COLORS, UI_TYPE_SCALE, UI_SHADOWS } from '@/constants/ui-tokens';

type Props = {
    entries: LeaderboardEntry[];
};

const PODIUM_ORDER = [1, 0, 2];

export default function LeaderboardPodium({ entries }: Props) {
    const ordered = PODIUM_ORDER.map((index) => entries[index]).filter(Boolean) as LeaderboardEntry[];
    const getMedalLabel = (rank: number) => {
        if (rank === 1) return 'Champion';
        if (rank === 2) return 'Runner-up';
        return 'Third place';
    };

    return (
        <View className="flex-row items-end gap-3">
            {ordered.map((entry) => {
                const isCenter = entry.rank === 1;
                const topStyles = getTopRankStyle(entry.rank);
                const netWorth = Number.isFinite(entry.netWorth) ? entry.netWorth : 0;
                const valueColor = UI_COLORS.success;
                const valueLabel = netWorth.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });

                return (
                    <View key={`podium-${entry.rank}-${entry.username}`} className="flex-1" style={{ marginTop: isCenter ? 0 : 14 }}>
                        <View
                            className="overflow-hidden rounded-2xl border"
                            style={{
                                borderColor: topStyles.borderColor,
                                backgroundColor: topStyles.cardBg,
                                minHeight: isCenter ? 174 : 152,
                                ...(isCenter ? UI_SHADOWS.lift : UI_SHADOWS.soft),
                            }}
                        >
                            <View className="px-3 py-2" style={{ backgroundColor: topStyles.stripeBg }}>
                                <View className="flex-row items-center justify-between">
                                    <View className="rounded-md px-2 py-1" style={{ backgroundColor: topStyles.cardBg }}>
                                        <Text className="font-jetbrain-bold text-[11px]" style={{ color: topStyles.rankColor, fontSize: UI_TYPE_SCALE.leaderboard.rowMeta }}>
                                            #{entry.rank}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-1 px-1">
                                        <Image
                                            source={require('../../assets/app-icons/p-coin.png')}
                                            style={{ width: 11, height: 11 }}
                                            resizeMode="contain"
                                        />
                                        <Text className="font-jetbrain-bold text-[11px]" style={{ color: valueColor, fontSize: UI_TYPE_SCALE.leaderboard.rowMeta }}>
                                            {valueLabel}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View className="px-3 pb-3" style={{ paddingTop: isCenter ? 14 : 10 }}>
                            {entry.rank === 1 && (
                                <View
                                    className="absolute right-3 top-2 rounded-full px-2 py-1"
                                    style={{
                                        backgroundColor: UI_COLORS.leaderboard.premium.badgeBg,
                                        borderWidth: 1,
                                        borderColor: UI_COLORS.leaderboard.premium.badgeBorder,
                                    }}
                                >
                                    <MaterialIcons name="workspace-premium" size={13} color={UI_COLORS.leaderboard.premium.icon} />
                                </View>
                            )}

                                <View className="h-12 w-12 items-center justify-center rounded-full border" style={{ backgroundColor: topStyles.badgeBg, borderColor: topStyles.borderColor }}>
                                    <Text className="font-grotesk-bold text-[18px]" style={{ color: topStyles.badgeColor }}>
                                        {entry.initials}
                                    </Text>
                                </View>

                                <Text className="mt-2 font-grotesk-bold text-[13px]" style={{ color: ExploreTheme.titleText }} numberOfLines={1}>
                                    {entry.username}
                                </Text>
                                <Text className="font-jetbrain text-[11px]" style={{ color: ExploreTheme.secondaryText, fontSize: UI_TYPE_SCALE.leaderboard.rowMeta }}>
                                    {entry.wins} correct picks
                                </Text>

                                <Text className="mt-2 font-jetbrain text-[10px] uppercase tracking-[1.1px]" style={{ color: topStyles.rankColor, fontSize: UI_TYPE_SCALE.leaderboard.columnHeader }}>
                                    {getMedalLabel(entry.rank)}
                                </Text>
                            </View>
                        </View>
                    </View>
                );
            })}
        </View>
    );
}
