import React from 'react';
import { View, Text, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { UI_COLORS } from '@/constants/ui-tokens';

type ActivityItemProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  result: 'won' | 'lost' | 'pending';
  amount: string;
  roi?: string;
  date: string;
  onPress?: () => void;
};

export function ActivityItem({
  icon,
  title,
  result,
  amount,
  roi,
  date,
  onPress,
}: ActivityItemProps) {
  const getResultStyles = () => {
    switch (result) {
      case 'won':
        return {
          bg: UI_COLORS.outcomeYesSoft,
          text: UI_COLORS.success,
          label: 'Won',
        };
      case 'lost':
        return {
          bg: UI_COLORS.outcomeNoSoft,
          text: UI_COLORS.danger,
          label: 'Lost',
        };
      case 'pending':
        return {
          bg: UI_COLORS.hintBg,
          text: UI_COLORS.warning,
          label: 'Pending',
        };
    }
  };

  const resultStyles = getResultStyles();
  const isWon = result === 'won';
  const isLost = result === 'lost';
  const amountColor = isWon
    ? UI_COLORS.success
    : isLost
    ? UI_COLORS.danger
    : UI_COLORS.warning;

  const Content = (
    <View className="flex-row items-center gap-3 py-3 px-4">
      {/* Icon - with background circle like rest of app */}
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: UI_COLORS.surfaceMuted }}
      >
        <MaterialIcons name={icon} size={18} color={UI_COLORS.textSecondary} />
      </View>

      {/* Title and Result */}
      <View className="flex-1">
        <Text
          className="font-grotesk-bold text-sm mb-1"
          style={{ color: UI_COLORS.textPrimary }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View className="flex-row items-center gap-2">
          <View
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: resultStyles.bg }}
          >
            <Text
              className="text-xs font-inter font-medium"
              style={{ color: resultStyles.text }}
            >
              {resultStyles.label}
            </Text>
          </View>
          <Text className="text-xs font-inter" style={{ color: UI_COLORS.textMuted }}>
            {date}
          </Text>
        </View>
      </View>

      {/* Amount and ROI - right aligned, prominent */}
      <View className="items-end">
        <Text
          className="font-jetbrain-bold text-base mb-0.5"
          style={{ color: amountColor }}
        >
          {amount}
        </Text>
        {roi && (
          <Text className="text-xs font-jetbrain" style={{ color: UI_COLORS.textMuted }}>
            {roi}
          </Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        hitSlop={10}
        accessibilityLabel={`${title}, ${resultStyles.label}, ${amount}`}
        accessibilityRole="button"
        className="w-full"
      >
        {Content}
      </Pressable>
    );
  }

  return <View className="w-full">{Content}</View>;
}
