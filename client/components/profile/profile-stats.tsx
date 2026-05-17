import React from 'react';
import { View, Text } from 'react-native';
import { UI_COLORS } from '@/constants/ui-tokens';

type ProfileStatsProps = {
  predictionsCount: number;
  positionsValue: number;
  biggestWin: number;
};

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;

export function ProfileStats({ predictionsCount, positionsValue, biggestWin }: ProfileStatsProps) {
  return (
    <View className="flex-row gap-2">
      <View
        className="flex-1 rounded-2xl p-3"
        style={{
          backgroundColor: UI_COLORS.surface,
          borderWidth: 1,
          borderColor: UI_COLORS.accentBorder,
        }}
      >
        <Text className="font-jetbrain text-[10px]" style={{ color: UI_COLORS.textSecondary }}>
          PREDICTIONS
        </Text>
        <Text
          className="font-grotesk-bold text-[20px] mt-1"
          style={{ color: UI_COLORS.textPrimary }}
        >
          {predictionsCount}
        </Text>
      </View>
      <View
        className="flex-1 rounded-2xl p-3"
        style={{
          backgroundColor: UI_COLORS.surface,
          borderWidth: 1,
          borderColor: UI_COLORS.borderSoft,
        }}
      >
        <Text className="font-jetbrain text-[10px]" style={{ color: UI_COLORS.textSecondary }}>
          OPEN VALUE
        </Text>
        <Text
          className="font-grotesk-bold text-[20px] mt-1"
          style={{ color: UI_COLORS.textPrimary }}
        >
          {formatCurrency(positionsValue)}
        </Text>
      </View>
      <View
        className="flex-1 rounded-2xl p-3"
        style={{
          backgroundColor: UI_COLORS.profileStat.biggestWinBg,
          borderWidth: 1,
          borderColor: UI_COLORS.profileStat.biggestWinBorder,
        }}
      >
        <Text
          className="font-jetbrain text-[10px]"
          style={{ color: UI_COLORS.profileStat.biggestWinLabel }}
        >
          BIGGEST WIN
        </Text>
        <Text
          className="font-grotesk-bold text-[20px] mt-1"
          style={{ color: UI_COLORS.profileStat.biggestWinValue }}
        >
          {formatCurrency(biggestWin)}
        </Text>
      </View>
    </View>
  );
}
