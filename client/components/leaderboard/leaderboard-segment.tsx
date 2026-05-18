import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { ExploreTheme } from '@/constants/explore-theme';
import { UI_COLORS, MD3_SHAPE } from '@/constants/ui-tokens';

export type LeaderboardPeriod = 'weekly' | 'all_time';

type Props = {
    selected: LeaderboardPeriod;
    onChange: (period: LeaderboardPeriod) => void;
};

export default function LeaderboardSegment({ selected, onChange }: Props) {
    return (
        <View
            className="flex-row p-1"
            style={{ borderRadius: MD3_SHAPE.full, borderWidth: 1, borderColor: ExploreTheme.headerBorder, backgroundColor: UI_COLORS.surfaceMuted }}
        >
            <Pressable
                className="flex-1 py-2 items-center"
                style={[selected === 'weekly' ? { backgroundColor: UI_COLORS.surface } : undefined, { borderRadius: MD3_SHAPE.full }]}
                onPress={() => onChange('weekly')}
                accessibilityRole="tab"
                accessibilityLabel="Weekly"
                accessibilityState={{ selected: selected === 'weekly' }}
            >
                <Text
                    className="font-grotesk-bold text-[12px]"
                    style={{ color: selected === 'weekly' ? ExploreTheme.linkText : UI_COLORS.textSecondary }}
                >
                    Weekly
                </Text>
            </Pressable>
            <Pressable
                className="flex-1 py-2 items-center"
                style={[selected === 'all_time' ? { backgroundColor: UI_COLORS.surface } : undefined, { borderRadius: MD3_SHAPE.full }]}
                onPress={() => onChange('all_time')}
                accessibilityRole="tab"
                accessibilityLabel="All Time"
                accessibilityState={{ selected: selected === 'all_time' }}
            >
                <Text
                    className="font-grotesk-bold text-[12px]"
                    style={{ color: selected === 'all_time' ? ExploreTheme.linkText : UI_COLORS.textSecondary }}
                >
                    All Time
                </Text>
            </Pressable>
        </View>
    );
}
