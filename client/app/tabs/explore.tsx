import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useUserStore } from '../../context/useUserStore';
import { Prediction } from '../../.expo/types/model';
import * as api from '../../utils/api';
import { extractPredictionList, normalizePrediction } from '../../utils/prediction-helpers';

import CardSkeleton from '@/components/explore/card-skeleton';
import SearchHeader from '@/components/explore/search-header';
import CategoryCard from '@/components/explore/category-card';
import PredictionCard from '@/components/explore/prediction-card';
import { EmptyState } from '@/components/common/empty-state';
import { ExploreTheme } from '../../constants/explore-theme';
import { UI_COLORS, useUITheme } from '@/constants/ui-tokens';
import { useNotificationBadge } from '../../context/NotificationBadgeContext';

// ─── Category display config ────────────────────────────────────────────────
const GRID_CATEGORIES: { key: string; label: string }[] = [
    { key: 'SPORTS', label: 'Sports' },
    { key: 'POLITICS', label: 'Politics' },
    { key: 'CRYPTO', label: 'Crypto' },
    { key: 'TECHNOLOGY', label: 'Technology' },
];

// ─── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({
    title,
    onExploreMore,
}: {
    title: string;
    onExploreMore?: () => void;
}) {
    return (
        <View className="flex-row items-center mb-3">
            <Text className="font-grotesk-bold text-[18px] flex-1" style={{ color: ExploreTheme.titleText }}>{title}</Text>
            {onExploreMore && (
                <Pressable
                    onPress={onExploreMore}
                    className="flex-row items-center gap-1"
                    hitSlop={10}
                    accessibilityLabel="Explore more"
                    accessibilityRole="button"
                    accessibilityHint="Shows more items"
                >
                    <Text className="font-jetbrain text-[13px]" style={{ color: ExploreTheme.linkText }}>Explore more</Text>
                    <MaterialIcons name="arrow-forward-ios" size={12} color={ExploreTheme.linkText} />
                </Pressable>
            )}
        </View>
    );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  useUITheme();
    const router = useRouter();
    const { userData } = useUserStore();
    const { unreadCount } = useNotificationBadge();
    const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [trending, setTrending] = useState<Prediction[]>([]);
    const [newest, setNewest] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchHint, setSearchHint] = useState<string | null>(null);

    // Fetch preview data (5 cards each)
    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [trendRes, newRes] = await Promise.all([
                    api.get('/markets/trending'),
                    api.get('/markets/get-all?limit=5'),
                ]);

                if (!cancelled) {
                    if (trendRes.ok) {
                        const data = extractPredictionList(trendRes.data)
                            .filter((i) => i && i.id)
                            .map((i) => normalizePrediction(i as Prediction & { volume?: number }));

                        setTrending(data.slice(0, 5));
                    }
                    if (newRes.ok) {
                        const data = extractPredictionList(newRes.data)
                            .filter((i) => i && i.id)
                             .map((i) => normalizePrediction(i as Prediction & { volume?: number }));

                        // Backend now handles ordering & limit; set directly
                        setNewest(data);
                    }
                }
            } catch (e) {
                if (!cancelled) Alert.alert('Error', 'Could not load markets.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchData();
        return () => {
            cancelled = true;
            if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
        };
    }, []);

    const goMarketDetails = useCallback(
        (id: number) => router.push({ pathname: '/marketDetails', params: { id } }),
        [router],
    );

    const goExploreDetails = useCallback(
        (sort?: string, category?: string) =>
            router.push({
                pathname: '/explore-details',
                params: { ...(sort && { sort }), ...(category && { category }) },
            }),
        [router],
    );

    const goSearchResults = useCallback(
        (query: string) => {
            if (!query.trim()) {
                setSearchHint('Type a market keyword first.');
                if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
                hintTimeoutRef.current = setTimeout(() => setSearchHint(null), 2500);
                return;
            }
            router.push({ pathname: '/explore-details', params: { search: query } });
        },
        [router],
    );

    return (
        <View className="flex-1" style={{ backgroundColor: ExploreTheme.pageBg }}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: UI_COLORS.surface }}>
                <View
                    className="px-5"
                    style={{
                        backgroundColor: UI_COLORS.surface,
                        borderBottomWidth: 1,
                        borderBottomColor: ExploreTheme.headerBorder,
                        paddingVertical: 14,
                    }}
                >
                    <SearchHeader
                        balance={userData?.balance ?? 0}
                        unreadCount={unreadCount}
                        onSearchSubmit={goSearchResults}
                        onNotificationPress={() => router.push('/notifications')}
                    />
                    {searchHint && (
                        <View
                            testID="search-empty-hint"
                            style={{
                                marginTop: 10,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: ExploreTheme.searchHintBorder,
                                backgroundColor: ExploreTheme.searchHintBg,
                                paddingHorizontal: 10,
                                paddingVertical: 8,
                            }}
                        >
                            <Text className="font-jetbrain text-[12px]" style={{ color: ExploreTheme.searchHint }}>
                                {searchHint}
                            </Text>
                        </View>
                    )}
                </View>
            </SafeAreaView>

            {/* ── Scrollable body ── */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100, gap: 0 }}
            >
                {/* ── Browse Categories ── */}
                <View className="px-5 pt-5 pb-4">
                    <View className="flex-row items-center mb-3">
                        <Text className="font-grotesk-bold text-[18px] flex-1" style={{ color: ExploreTheme.titleText }}>
                            Browse Categories
                        </Text>
                        <Pressable
                            onPress={() => router.push('/categories')}
                            className="flex-row items-center gap-1"
                            hitSlop={10}
                            accessibilityLabel="See all categories"
                            accessibilityRole="button"
                            accessibilityHint="Shows all market categories"
                        >
                            <Text className="font-jetbrain text-[13px]" style={{ color: ExploreTheme.linkText }}>See all</Text>
                            <MaterialIcons name="arrow-forward-ios" size={12} color={ExploreTheme.linkText} />
                        </Pressable>
                    </View>

                    {/* 2-column grid */}
                    <View className="gap-3">
                        <View className="flex-row gap-3">
                            {GRID_CATEGORIES.slice(0, 2).map((cat) => (
                                <CategoryCard
                                    key={cat.key}
                                    categoryKey={cat.key}
                                    label={cat.label}
                                    onPress={() => goExploreDetails(undefined, cat.key)}
                                />
                            ))}
                        </View>
                        <View className="flex-row gap-3">
                            {GRID_CATEGORIES.slice(2, 4).map((cat) => (
                                <CategoryCard
                                    key={cat.key}
                                    categoryKey={cat.key}
                                    label={cat.label}
                                    onPress={() => goExploreDetails(undefined, cat.key)}
                                />
                            ))}
                        </View>
                    </View>
                </View>

                {/* ── Divider ── */}
                <View className="h-2" style={{ backgroundColor: ExploreTheme.sectionDivider }} />

                {/* ── Trending Markets ── */}
                <View className="px-5 pt-5 pb-2">
                    <SectionHeader
                        title="Trending Markets"
                        onExploreMore={() => goExploreDetails('trending')}
                    />

                    {!loading && trending.length === 0 && (
                        <EmptyState
                            icon="trending-up"
                            title="No trending markets"
                            description="There may be no trending markets right now"
                        />
                    )}

                    <View className="gap-3">
                        {loading
                            ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
                            : trending.map((item, i) => (
                                <PredictionCard
                                    key={item.id}
                                    prediction={item}
                                    onPress={() => goMarketDetails(item.id)}
                                    index={i}
                                />
                            ))}
                    </View>
                </View>

                {/* ── Divider ── */}
                <View className="h-2 mt-4" style={{ backgroundColor: ExploreTheme.sectionDivider }} />

                {/* ── New Markets ── */}
                <View className="px-5 pt-5 pb-2">
                    <SectionHeader
                        title="New Markets"
                        onExploreMore={() => goExploreDetails('newest')}
                    />

                    <View className="gap-3">
                        {loading
                            ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
                            : newest.map((item, i) => (
                                <PredictionCard
                                    key={item.id}
                                    prediction={item}
                                    onPress={() => goMarketDetails(item.id)}
                                    index={i}
                                />
                            ))}
                    </View>

                    {/* Empty state */}
                    {!loading && newest.length === 0 && (
                        <EmptyState
                            icon="inbox"
                            title="No markets yet"
                            description="Check back later for new prediction markets"
                        />
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
