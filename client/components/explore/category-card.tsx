import React from 'react';
import { Pressable, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { categoryIconMap } from '@/constants/ui-mappings';
import { ExploreTheme } from '@/constants/explore-theme';
import { UI_COLORS } from '@/constants/ui-tokens';

export type CategoryKey = 'SPORTS' | 'POLITICS' | 'CRYPTO' | 'CULTURE' | 'TECHNOLOGY' | 'SCHOOL';

type Props = {
    /** Category key (uppercase, e.g. "SPORTS") */
    categoryKey: string;
    /** Human-readable label e.g. "Sports" */
    label: string;
    /** Number of active markets in this category */
    count?: number;
    onPress: () => void;
};

export default function CategoryCard({ categoryKey, label, count, onPress }: Props) {
    const icon = categoryIconMap[categoryKey.toUpperCase()] ?? {
        name: 'help-outline' as keyof typeof MaterialIcons.glyphMap,
        color: ExploreTheme.secondaryText,
        bg: ExploreTheme.sectionDivider,
    };

    return (
        <Pressable
            onPress={onPress}
            className="flex-1 rounded-xl overflow-hidden"
            accessibilityRole="button"
            accessibilityLabel={`${label} category${count !== undefined ? `, ${count} markets` : ''}`}
            style={{
                minHeight: 96,
                borderWidth: 1,
                borderColor: ExploreTheme.headerBorder,
                backgroundColor: UI_COLORS.surface,
            }}
        >
            <View className="flex-1 px-4 pt-4 pb-5 gap-3">
                {/* Icon badge */}
                <View
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: icon.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <MaterialIcons name={icon.name} size={20} color={icon.color} />
                </View>

                {/* Labels */}
                <View>
                    <Text
                        className="font-grotesk-bold text-[14px]"
                        style={{ color: ExploreTheme.titleText }}
                        numberOfLines={1}
                    >
                        {label}
                    </Text>
                    {count !== undefined && (
                        <Text className="font-jetbrain text-[11px]" style={{ color: ExploreTheme.secondaryText }}>
                            {count} markets
                        </Text>
                    )}
                </View>
            </View>
        </Pressable>
    );
}
