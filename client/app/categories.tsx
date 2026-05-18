import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { categoryIconMap } from '@/constants/ui-mappings';
import { ExploreTheme } from '../constants/explore-theme';
import { UI_COLORS, useUITheme } from '../constants/ui-tokens';
import * as api from '../utils/api';

type CategoryItem = { key: string; label: string };

const FALLBACK_CATEGORIES: CategoryItem[] = [
    { key: 'SPORTS', label: 'Sports' },
    { key: 'POLITICS', label: 'Politics' },
    { key: 'CRYPTO', label: 'Crypto' },
    { key: 'CULTURE', label: 'Culture' },
    { key: 'TECHNOLOGY', label: 'Technology' },
];

const SCHOOL_CATEGORY: CategoryItem = { key: 'SCHOOL', label: 'School' };

function CategoryRow({
    categoryKey,
    label,
    onPress,
}: {
    categoryKey: string;
    label: string;
    onPress: () => void;
}) {
    const icon = categoryIconMap[categoryKey] ?? { name: 'help-outline', color: ExploreTheme.secondaryText, bg: ExploreTheme.sectionDivider };

    return (
        <Pressable
            onPress={onPress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: UI_COLORS.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: ExploreTheme.headerBorder,
                padding: 16,
                gap: 14,
            }}
        >
            <View
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: icon.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <MaterialIcons name={icon.name as any} size={24} color={icon.color} />
            </View>
            <Text
                style={{ flex: 1, fontSize: 16, color: ExploreTheme.titleText }}
                className="font-grotesk-bold"
            >
                {label}
            </Text>
            <MaterialIcons name="arrow-forward-ios" size={14} color={ExploreTheme.secondaryText} />
        </Pressable>
    );
}

export default function CategoriesScreen() {
  useUITheme();
  const router = useRouter();
    const [categories, setCategories] = useState<CategoryItem[]>([]);

    useEffect(() => {
        let cancelled = false;

        const normalizeCategory = (categoryKey: string): CategoryItem => {
            const key = categoryKey.toUpperCase();
            return {
                key,
                label: key.charAt(0) + key.slice(1).toLowerCase(),
            };
        };

        const fetchCategories = async () => {
            try {
                const { ok, data } = await api.get('/markets/categories');

                if (!cancelled) {
                    const source = ok && Array.isArray(data) && data.length > 0
                        ? (data as string[]).map(normalizeCategory)
                        : FALLBACK_CATEGORIES;
                    setCategories(source);
                }
            } catch {
                if (!cancelled) {
                    setCategories(FALLBACK_CATEGORIES);
                }
            }
        };

        fetchCategories();
        return () => {
            cancelled = true;
        };
    }, []);

    const allCategories = useMemo(() => {
        const hasSchool = categories.some((item) => item.key === 'SCHOOL');
        return hasSchool ? categories : [...categories, SCHOOL_CATEGORY];
    }, [categories]);

    return (
        <View style={{ flex: 1, backgroundColor: ExploreTheme.pageBg }}>
            {/* Header */}
            <View style={{ backgroundColor: UI_COLORS.surface }}>
                <SafeAreaView edges={['top']}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 20,
                            paddingVertical: 14,
                            borderBottomWidth: 1,
                            borderBottomColor: ExploreTheme.headerBorder,
                            backgroundColor: UI_COLORS.surface,
                            gap: 12,
                        }}
                    >
                        <Pressable
                            onPress={() => router.back()}
                            hitSlop={10}
                            accessibilityLabel="Go back"
                            accessibilityRole="button"
                            accessibilityHint="Navigates to previous screen"
                        >
                            <MaterialIcons name="arrow-back" size={24} color={ExploreTheme.titleText} />
                        </Pressable>
                        <Text
                            style={{ flex: 1, fontSize: 18, color: ExploreTheme.titleText }}
                            className="font-grotesk-bold"
                        >
                            All Categories
                        </Text>
                    </View>
                </SafeAreaView>
            </View>

            <FlatList
                data={allCategories}
                keyExtractor={(item) => item.key}
                renderItem={({ item }) => (
                    <CategoryRow
                        categoryKey={item.key}
                        label={item.label}
                        onPress={() =>
                            router.push({
                                pathname: '/explore-details',
                                params: { category: item.key },
                            })
                        }
                    />
                )}
                contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 10 }}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}
