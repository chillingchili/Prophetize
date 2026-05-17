import React from 'react';
import { View, Text, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { UI_COLORS } from '@/constants/ui-tokens';

type SettingsItemProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value?: string;
  showChevron?: boolean;
  destructive?: boolean;
  onPress: () => void;
};

export function SettingsItem({
  icon,
  label,
  value,
  showChevron = true,
  destructive = false,
  onPress,
}: SettingsItemProps) {
  const textColor = destructive ? UI_COLORS.danger : UI_COLORS.textPrimary;
  const iconColor = destructive ? UI_COLORS.danger : UI_COLORS.accent;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityLabel={`${label}${value ? `, ${value}` : ''}`}
      accessibilityRole="button"
      accessibilityHint="Opens settings"
      className="w-full"
    >
      <View className="flex-row items-center py-3 px-4 gap-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: UI_COLORS.accentSoft }}
        >
          <MaterialIcons name={icon} size={20} color={iconColor} />
        </View>

        <Text className="flex-1 text-base" style={{ fontFamily: 'InterTight_400Regular', color: textColor }}>
          {label}
        </Text>

        {value && (
          <Text className="text-sm mr-2" style={{ fontFamily: 'InterTight_400Regular', color: UI_COLORS.textMuted }}>
            {value}
          </Text>
        )}

        {showChevron && (
          <MaterialIcons name="chevron-right" size={20} color={UI_COLORS.textMuted} />
        )}
      </View>
    </Pressable>
  );
}
