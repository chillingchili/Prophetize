import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Prediction } from '../.expo/types/model';
import CardSkeleton from '@/components/explore/card-skeleton';
import PredictionCard from '@/components/explore/prediction-card';
import { EmptyState } from '@/components/common/empty-state';
import { ExploreTheme } from '../constants/explore-theme';
import { UI_COLORS, useUITheme } from '../constants/ui-tokens';
import * as api from '../utils/api';
import { normalizePrediction } from '../utils/prediction-helpers';

const PAGE_SIZE = 10;

export default function ExploreDetails() {
    useUITheme();
    const router = useRouter();
    const { sort, category, search } = useLocalSearchParams<{
        sort?: string;
        category?: string;
        search?: string;
    }>();

    const [markets, setMarkets] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const pageRef = useRef(0);

    /** Build the title based on the params */
    const pageTitle = search
        ? `"${search}"`
        : category
        ? category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
        : sort === 'trending'
        ? 'Trending'
        : sort === 'newest'
        ? 'New Markets'
        : 'Explore';

    const fetchPage = useCallback(async (page: number, append: boolean) => {
        if (page === 0) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        if (!append) {
            setErrorMessage(null);
        }

        try {
            const params = new URLSearchParams();
            params.set('limit', String(PAGE_SIZE));
            params.set('page', String(page));

            if (sort === 'trending') {
                params.set('sort', 'volume');
                params.set('isAscending', 'false');
            }
            if (category) params.set('category', String(category).toUpperCase());
            if (search) params.set('search', String(search));

            const { ok, data } = await api.get(`/markets/search?${params.toString()}`);
            if (!ok) {
                throw new Error('Failed to load markets');
            }

            const payload = (data && typeof data === 'object') ? data as { data?: unknown; meta?: { has_next_page?: boolean } } : {};
            const rawItems = Array.isArray(payload.data) ? payload.data : [];

            const items = rawItems.map((item: any) => normalizePrediction(item));

            setMarkets((prev) => (append ? [...prev, ...items] : items));
            pageRef.current = page + 1;
            if (typeof payload.meta?.has_next_page === 'boolean') {
                setHasMore(payload.meta.has_next_page);
            } else {
                setHasMore(items.length === PAGE_SIZE);
            }
        } catch {
            if (!append) {
                setErrorMessage('Could not load markets right now.');
                setMarkets([]);
            } else {
                setHasMore(false);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [category, search, sort]);

    useEffect(() => {
        pageRef.current = 0;
        setMarkets([]);
        setHasMore(true);
        setErrorMessage(null);
        fetchPage(0, false);
    }, [fetchPage]);

    const goMarketDetails = useCallback(
        (id: number) => router.push({ pathname: '/marketDetails', params: { id } }),
        [router],
    );

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
                            numberOfLines={1}
                        >
                            {pageTitle}
                        </Text>
                    </View>
                </SafeAreaView>
            </View>

            {/* List */}
            {loading ? (
                <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16, gap: 14 }}>
                    {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
                </View>
            ) : (
                <FlatList
                    testID="explore-details-list"
                    data={markets}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item, index }) => (
                        <PredictionCard
                            prediction={item}
                            onPress={() => goMarketDetails(item.id)}
                            index={index}
                        />
                    )}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 14 }}
                    showsVerticalScrollIndicator={false}
                    onEndReached={() => {
                        if (!loadingMore && hasMore) fetchPage(pageRef.current, true);
                    }}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={
                        loadingMore ? (
                            <ActivityIndicator
                                testID="explore-details-loading-more"
                                size="small"
                                color={ExploreTheme.linkText}
                                style={{ marginTop: 16 }}
                            />
                        ) : !hasMore ? (
                            <Text
                                testID="explore-details-end"
                                style={{ marginTop: 16, textAlign: 'center', color: ExploreTheme.secondaryText }}
                                className="font-jetbrain"
                            >
                                You reached the end
                            </Text>
                        ) : null
                    }
                    ListEmptyComponent={
                        <EmptyState
                            icon="search-off"
                            title={errorMessage ?? 'No markets found'}
                            description={errorMessage ? 'Try a different search term' : undefined}
                            actionLabel={errorMessage ? 'Retry' : undefined}
                            onAction={errorMessage ? () => fetchPage(0, false) : undefined}
                        />
                    }
                />
            )}
        </View>
    );
}
