import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LeaderboardMyPositionCard from '@/components/leaderboard/my-position-card';
import LeaderboardPodium from '@/components/leaderboard/leaderboard-podium';
import LeaderboardRow, { LeaderboardEntry } from '@/components/leaderboard/leaderboard-row';
import LeaderboardSegment, { LeaderboardPeriod } from '@/components/leaderboard/leaderboard-segment';
import LeaderboardSkeletonList from '@/components/leaderboard/leaderboard-skeleton-list';
import { ExploreTheme } from '@/constants/explore-theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { subscribeRealtime } from '@/context/realtimeClient';
import { UI_COLORS, UI_TYPE_SCALE, useUITheme, getThemeVersion } from '@/constants/ui-tokens';
import {
    LeaderboardApiEntry,
    MyLeaderboardPositionResponse,
    getLeaderboard,
    getMyLeaderboardPosition,
} from '@/utils/api';

const PAGE_SIZE = 10;

const toFiniteNumber = (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toDisplayName = (value: unknown) => {
    if (typeof value !== 'string') return 'Unknown';
    const trimmed = value.trim();
    return trimmed || 'Unknown';
};

const getInitials = (username: string) => {
    const trimmed = username.trim();
    if (!trimmed) return 'NA';

    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
        return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }

    return trimmed.slice(0, 2).toUpperCase();
};

const mapApiEntryToRow = (entry: LeaderboardApiEntry): LeaderboardEntry => ({
    rank: toFiniteNumber(entry.rank, 0),
    username: toDisplayName(entry.username),
    initials: getInitials(toDisplayName(entry.username)),
    wins: toFiniteNumber(entry.wins, 0),
    netWorth: toFiniteNumber(entry.revenue ?? entry.profit_pct, 0),
    isCurrentUser: Boolean(entry.is_current_user),
});

const mapMyPositionToRow = (position: MyLeaderboardPositionResponse): LeaderboardEntry => ({
    rank: toFiniteNumber(position.position, 0),
    username: toDisplayName(position.username),
    initials: getInitials(toDisplayName(position.username)),
    wins: toFiniteNumber(position.wins, 0),
    netWorth: toFiniteNumber(position.revenue ?? position.profit_pct, 0),
    isCurrentUser: true,
});

export default function LeaderboardScreen() {
  useUITheme();
  useTheme();
    const { token } = useAuth();

    const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
    const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
    const [myPosition, setMyPosition] = useState<LeaderboardEntry | null>(null);
    const [page, setPage] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [connectionState, setConnectionState] = useState<'connected' | 'reconnecting' | 'stale' | 'disconnected'>('disconnected');

    const requestIdRef = useRef(0);

    const subtitle = useMemo(
        () => (period === 'weekly' ? 'Weekly net worth leaderboard' : 'All-time net worth leaderboard'),
        [period]
    );
    const topThree = useMemo(() => allEntries.slice(0, 3), [allEntries]);
    const listEntries = useMemo(() => allEntries.slice(3), [allEntries]);
    const connectionStatus = useMemo(() => {
        if (connectionState === 'connected') {
            return { label: 'Live leaderboard connected', color: UI_COLORS.success };
        }

        if (connectionState === 'reconnecting') {
            return { label: 'Reconnecting leaderboard...', color: UI_COLORS.warning };
        }

        if (connectionState === 'stale') {
            return { label: 'Leaderboard updates are stale. Retrying...', color: UI_COLORS.danger };
        }

        return { label: 'Live leaderboard disconnected', color: ExploreTheme.secondaryText };
    }, [connectionState]);

    const loadInitialPage = useCallback(async (selectedPeriod: LeaderboardPeriod) => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        setIsInitialLoading(true);
        setIsFetchingMore(false);
        setErrorMessage(null);
        setAllEntries([]);
        setMyPosition(null);
        setPage(0);
        setHasNextPage(false);

        const [leaderboardRes, myPositionRes] = await Promise.all([
            getLeaderboard(selectedPeriod, 0, PAGE_SIZE),
            token ? getMyLeaderboardPosition(selectedPeriod) : Promise.resolve({ ok: false, data: null }),
        ]);

        if (requestId !== requestIdRef.current) {
            return;
        }

        if (!leaderboardRes.ok || !leaderboardRes.data) {
            setErrorMessage(leaderboardRes.data?.error ?? 'Unable to load leaderboard right now.');
            setIsInitialLoading(false);
            return;
        }

        const fetchedEntries = ((leaderboardRes.data.data as LeaderboardApiEntry[]) ?? []).map(mapApiEntryToRow);
        const meta = leaderboardRes.data.meta;

        setAllEntries(fetchedEntries);
        setPage(meta?.page ?? 0);
        setHasNextPage(Boolean(meta?.has_next_page));

        if (token && myPositionRes.ok && myPositionRes.data) {
            setMyPosition(mapMyPositionToRow(myPositionRes.data as MyLeaderboardPositionResponse));
        } else {
            setMyPosition(null);
        }

        setIsInitialLoading(false);
    }, [token]);

    const handleLoadMore = useCallback(async () => {
        if (isInitialLoading || isFetchingMore || !hasNextPage) {
            return;
        }

        setIsFetchingMore(true);
        const nextPage = page + 1;
        const result = await getLeaderboard(period, nextPage, PAGE_SIZE);

        if (!result.ok || !result.data) {
            setIsFetchingMore(false);
            return;
        }

        const nextRows = ((result.data.data as LeaderboardApiEntry[]) ?? []).map(mapApiEntryToRow);
        setAllEntries((prev) => [...prev, ...nextRows]);
        setPage(result.data.meta?.page ?? nextPage);
        setHasNextPage(Boolean(result.data.meta?.has_next_page));
        setIsFetchingMore(false);
    }, [hasNextPage, isFetchingMore, isInitialLoading, page, period]);

    const handleRetryLoad = useCallback(() => {
        setErrorMessage(null);
        void loadInitialPage(period);
    }, [loadInitialPage, period]);

    useEffect(() => {
        loadInitialPage(period);
    }, [period, loadInitialPage]);

    useEffect(() => {
        const unsubscribe = subscribeRealtime({
            channels: ['leaderboard.updated'],
            onEvent: () => {
                void loadInitialPage(period);
            },
            onReconnect: () => {
                void loadInitialPage(period);
            },
            onConnectionState: setConnectionState,
        });

        return unsubscribe;
    }, [loadInitialPage, period]);

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
                    <View className="mb-2">
                        <Text className="font-grotesk-bold text-[22px]" style={{ color: ExploreTheme.titleText, fontSize: UI_TYPE_SCALE.leaderboard.title }}>
                            Top Prophets
                        </Text>
                        <Text className="font-jetbrain text-[12px]" style={{ color: ExploreTheme.secondaryText, fontSize: UI_TYPE_SCALE.leaderboard.subtitle }}>
                            {subtitle}
                        </Text>
                        <Text className="font-jetbrain text-[11px] mt-1" style={{ color: connectionStatus.color, fontSize: UI_TYPE_SCALE.leaderboard.status }}>
                            {connectionStatus.label}
                        </Text>
                    </View>

                    <LeaderboardSegment selected={period} onChange={setPeriod} />

                    <View className="flex-row items-center px-2 pt-4">
                        <Text className="font-jetbrain-bold text-[10px] w-5 tracking-[1px]" style={{ color: ExploreTheme.secondaryText, fontSize: UI_TYPE_SCALE.leaderboard.columnHeader }}>
                            #
                        </Text>
                        <Text className="font-jetbrain-bold text-[10px] flex-1 ml-3 tracking-[1px]" style={{ color: ExploreTheme.secondaryText, fontSize: UI_TYPE_SCALE.leaderboard.columnHeader }}>
                            PREDICTOR
                        </Text>
                        <Text className="font-jetbrain-bold text-[10px] tracking-[1px]" style={{ color: ExploreTheme.secondaryText, fontSize: UI_TYPE_SCALE.leaderboard.columnHeader }}>
                            NET WORTH
                        </Text>
                    </View>
                </View>
            </SafeAreaView>

            <View className="flex-1 px-5 pt-2">
                <View className="mb-3">
                    {isInitialLoading || topThree.length === 0 ? null : <LeaderboardPodium entries={topThree} />}
                </View>

                <View className="flex-1">
                    {isInitialLoading ? (
                        <LeaderboardSkeletonList count={6} />
                    ) : errorMessage ? (
                        <View className="flex-1 items-center justify-center px-6">
                            <Text className="font-grotesk-bold text-[16px] text-center" style={{ color: ExploreTheme.titleText }}>
                                Could not load leaderboard
                            </Text>
                            <Text className="font-jetbrain text-[12px] text-center mt-2" style={{ color: ExploreTheme.secondaryText }}>
                                {errorMessage}
                            </Text>
                            <TouchableOpacity
                                className="rounded-xl px-4 py-2 mt-3"
                                accessibilityRole="button"
                                accessibilityLabel="Retry loading leaderboard"
                                onPress={handleRetryLoad}
                                style={{
                                    backgroundColor: UI_COLORS.surface,
                                    borderWidth: 1,
                                    borderColor: UI_COLORS.borderSoft,
                                }}
                            >
                                <Text className="font-jetbrain" style={{ color: UI_COLORS.textPrimary }}>
                                    Retry loading leaderboard
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : allEntries.length === 0 ? (
                        <View className="flex-1 items-center justify-center px-6">
                            <Text className="font-grotesk-bold text-[16px] text-center" style={{ color: ExploreTheme.titleText }}>
                                No rankings available yet
                            </Text>
                            <Text className="font-jetbrain text-[12px] text-center mt-2" style={{ color: ExploreTheme.secondaryText }}>
                                Check back later for updated standings.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={listEntries}
                            extraData={getThemeVersion()}
                            keyExtractor={(item) => `${period}-${item.rank}-${item.username}`}
                            renderItem={({ item }) => <LeaderboardRow item={item} />}
                            onEndReached={handleLoadMore}
                            onEndReachedThreshold={0.4}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ gap: 8, paddingBottom: 130 }}
                            ListFooterComponent={
                                isFetchingMore ? <LeaderboardSkeletonList count={2} compact /> : null
                            }
                        />
                    )}
                </View>

                {myPosition ? (
                    <View
                        style={{
                            position: 'absolute',
                            left: 20,
                            right: 20,
                            bottom: 120,
                        }}
                    >
                        <LeaderboardMyPositionCard item={myPosition} />
                    </View>
                ) : null}
            </View>
        </View>
    );
}

