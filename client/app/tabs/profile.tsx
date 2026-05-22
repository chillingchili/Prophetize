import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useUserStore } from '../../context/useUserStore';

import { UI_COLORS, useUITheme } from '@/constants/ui-tokens';
import * as api from '@/utils/api';

import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileStats } from '@/components/profile/profile-stats';
import { CreatedMarketsSection } from '@/components/profile/created-markets-section';
import { ActivitySection } from '@/components/profile/activity-section';
import { SettingsItem } from '@/components/profile/settings-item';
import ConfirmModal from '@/components/common/confirm-modal';

const CREATED_MARKETS_LIMIT = 6;
const ACTIVITIES_LIMIT = 6;
const FETCH_COOLDOWN_MS = 30_000;

const formatDate = (value?: string | null) => {
  if (!value) {
    return '--';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '--';
  }

  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getPayloadArray = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'));
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const nested = record.data;
  if (Array.isArray(nested)) {
    return nested.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'));
  }

  return [];
};

export default function ProfileScreen() {
  useUITheme();
  useTheme();
  const router = useRouter();
  const { userId: routeUserId, initialFollowing } = useLocalSearchParams<{ userId?: string; initialFollowing?: string }>();
  const { logout, user } = useAuth();
  const { userData, fetchUserData } = useUserStore();
  const tabBarHeight = useBottomTabBarHeight();

  const [summary, setSummary] = useState<api.PortfolioSummary | null>(null);
  const [activities, setActivities] = useState<api.PortfolioActivityTransaction[]>([]);
  const [createdMarkets, setCreatedMarkets] = useState<api.CreatedMarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(initialFollowing === '1');
  const [followLoading, setFollowLoading] = useState(false);
  const [followErrorMessage, setFollowErrorMessage] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const lastFetchRef = useRef(0);

  const viewedUserId = typeof routeUserId === 'string' ? routeUserId.trim() : '';
  const isOwnProfile = !viewedUserId || viewedUserId === String(user?.id ?? '');

  useEffect(() => {
    if (isOwnProfile) {
      setIsFollowing(false);
      setFollowErrorMessage(null);
      return;
    }

    setIsFollowing(initialFollowing === '1');
    setFollowErrorMessage(null);
  }, [initialFollowing, isOwnProfile]);

  const fetchProfileData = useCallback(async () => {
    setLoadError(null);
    lastFetchRef.current = Date.now();

    const summaryTask = isOwnProfile ? api.getPortfolioSummary() : Promise.resolve({ ok: true, data: null });
    const activityTask = isOwnProfile ? api.getPortfolioActivity() : Promise.resolve({ ok: true, data: [] });
    const createdTask = api.getCreatedMarkets({
      userId: isOwnProfile ? undefined : viewedUserId,
      limit: CREATED_MARKETS_LIMIT,
    });

    const [profileResult, summaryResult, activityResult, createdResult] = await Promise.all([
      fetchUserData(),
      summaryTask,
      activityTask,
      createdTask,
    ]);

    // Summary — only update on success; never clear on error (stale data preserved)
    if (isOwnProfile && summaryResult.ok && summaryResult.data && typeof summaryResult.data === 'object') {
      setSummary(summaryResult.data as api.PortfolioSummary);
    } else if (isOwnProfile && !summaryResult.ok) {
      setLoadError('Unable to load profile summary right now.');
    }

    // Activities — only update on success; never clear on error (stale data preserved)
    if (isOwnProfile && activityResult.ok) {
      const normalized = getPayloadArray(activityResult.data)
        .map((item) => ({
          id: String(item.id ?? ''),
          market_option_id: String(item.market_option_id ?? ''),
          type: String(item.type ?? ''),
          shares: Number(item.shares ?? 0),
          price_at_time: Number(item.price_at_time ?? 0),
          amount: Number(item.amount ?? 0),
          created_at: String(item.created_at ?? ''),
          option_name: String(item.option_name ?? ''),
          market_id: String(item.market_id ?? ''),
          market_title: String(item.market_title ?? ''),
        }))
        .filter((item) => item.id && item.market_title)
        .slice(0, ACTIVITIES_LIMIT);

      setActivities(normalized);
    }

    // Created markets — only update on success; never clear on error (stale data preserved)
    if (createdResult.ok) {
      const normalized = api.normalizeCreatedMarketsPayload(createdResult.data);

      setCreatedMarkets(normalized);
    } else {
      setLoadError((current) => current ?? 'Unable to load created markets right now.');
    }

    if (!profileResult && isOwnProfile) {
      setLoadError((current) => current ?? 'Unable to refresh account data.');
    }
  }, [fetchUserData, isOwnProfile, viewedUserId]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await fetchProfileData();
      setLoading(false);
    };

    void run();
  }, [fetchProfileData]);

  useFocusEffect(
    useCallback(() => {
      if (loading || refreshing) {
        return;
      }

      // Stale-while-revalidate: skip re-fetch if fetched within 30s
      if (Date.now() - lastFetchRef.current < FETCH_COOLDOWN_MS) {
        return;
      }

      void fetchProfileData();
    }, [fetchProfileData, loading, refreshing])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchProfileData();
    setRefreshing(false);
  }, [fetchProfileData]);

  const handleFollowToggle = useCallback(async () => {
    if (isOwnProfile || !viewedUserId || followLoading) {
      return;
    }

    const previous = isFollowing;
    const action: api.FollowAction = previous ? 'unfollow' : 'follow';
    setIsFollowing(!previous);
    setFollowErrorMessage(null);
    setFollowLoading(true);

    const { ok, data } = await api.followUser(viewedUserId, action);
    setFollowLoading(false);

    if (!ok) {
      setIsFollowing(previous);
      const message = typeof data?.error === 'string' && data.error.trim()
        ? data.error.trim()
        : 'Unable to update follow status.';
      setFollowErrorMessage(message);
      Alert.alert('Follow action failed', message);
      return;
    }

    setIsFollowing(Boolean(data?.relationship?.following));
  }, [followLoading, isFollowing, isOwnProfile, viewedUserId]);

  const handleLogout = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowLogoutModal(true);
  }, []);

  const handleConfirmLogout = useCallback(async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/');
  }, [logout, router]);

  const displayName = isOwnProfile
    ? (summary?.username || user?.username || 'You')
    : `Trader ${viewedUserId.slice(0, 6)}`;

  const joinedLabel = isOwnProfile
    ? formatDate(summary?.joined || user?.created_at || null)
    : null;

  const netWorthValue = summary?.net_worth ?? (userData?.balance || 0);
  const balanceValue = summary?.balance ?? (userData?.balance || 0);
  const positionsValue = summary?.positions_value ?? 0;
  const predictionsCount = summary?.predictions_count ?? 0;
  const biggestWin = summary?.biggest_win ?? 0;

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: UI_COLORS.pageBg }}>
        <View className="px-5 pt-4">
          {/* Profile header skeleton */}
          <View
            className="rounded-3xl overflow-hidden"
            style={{
              borderWidth: 1,
              borderColor: UI_COLORS.accentBorder,
              backgroundColor: UI_COLORS.surface,
            }}
          >
            <View className="px-4 py-3" style={{ backgroundColor: UI_COLORS.accentSoft }}>
              <View className="h-3 w-16 rounded" style={{ backgroundColor: UI_COLORS.border }} />
            </View>
            <View className="p-4">
              <View className="flex-row items-center">
                <View
                  className="w-[96] h-[96] rounded-full"
                  style={{ backgroundColor: UI_COLORS.borderSoft }}
                />
                <View className="ml-3 flex-1 gap-2">
                  <View
                    className="h-5 w-36 rounded"
                    style={{ backgroundColor: UI_COLORS.borderSoft }}
                  />
                  <View
                    className="h-3 w-24 rounded"
                    style={{ backgroundColor: UI_COLORS.borderSoft }}
                  />
                </View>
              </View>
              <View className="flex-row mt-4 gap-2">
                <View
                  className="flex-1 h-16 rounded-2xl"
                  style={{ backgroundColor: UI_COLORS.borderSoft }}
                />
                <View
                  className="flex-1 h-16 rounded-2xl"
                  style={{ backgroundColor: UI_COLORS.borderSoft }}
                />
              </View>
            </View>
          </View>
          {/* Stats row skeleton */}
          <View className="flex-row gap-2 mt-4">
            <View
              className="flex-1 h-20 rounded-2xl"
              style={{
                backgroundColor: UI_COLORS.surface,
                borderWidth: 1,
                borderColor: UI_COLORS.borderSoft,
              }}
            />
            <View
              className="flex-1 h-20 rounded-2xl"
              style={{
                backgroundColor: UI_COLORS.surface,
                borderWidth: 1,
                borderColor: UI_COLORS.borderSoft,
              }}
            />
            <View
              className="flex-1 h-20 rounded-2xl"
              style={{
                backgroundColor: UI_COLORS.surface,
                borderWidth: 1,
                borderColor: UI_COLORS.borderSoft,
              }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: UI_COLORS.pageBg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={UI_COLORS.accent}
          />
        }
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
      >
        <View className="px-5 pt-4">
          <ProfileHeader
            isOwnProfile={isOwnProfile}
            displayName={displayName}
            joinedLabel={joinedLabel}
            avatarUrl={summary?.avatar_url || user?.avatar_url}
            netWorthValue={netWorthValue}
            balanceValue={balanceValue}
            viewedUserId={viewedUserId}
            isFollowing={isFollowing}
            followLoading={followLoading}
            followErrorMessage={followErrorMessage}
            onFollowToggle={handleFollowToggle}
          />
        </View>

        {/* Error state with retry button */}
        {loadError ? (
          <View className="px-5 mt-3 items-center">
            <Text
              className="font-jetbrain text-[12px]"
              style={{ color: UI_COLORS.hint }}
            >
              {loadError}
            </Text>
            <Pressable
              onPress={() => {
                void fetchProfileData();
              }}
              className="rounded-full px-4 py-2 mt-3"
              style={{ backgroundColor: UI_COLORS.accentSoft }}
            >
              <Text
                className="font-jetbrain-bold text-[12px]"
                style={{ color: UI_COLORS.linkPressed }}
              >
                Retry
              </Text>
            </Pressable>
          </View>
        ) : null}

        {isOwnProfile ? (
          <View className="px-5 mt-4">
            <ProfileStats
              predictionsCount={predictionsCount}
              positionsValue={positionsValue}
              biggestWin={biggestWin}
            />
          </View>
        ) : null}

        {isOwnProfile ? (
          <View className="px-5 mt-4">
            <Pressable
              onPress={() => router.push('/portfolio-chart' as any)}
              className="flex-row items-center justify-between rounded-2xl p-4"
              style={{ backgroundColor: UI_COLORS.surface, borderWidth: 1, borderColor: UI_COLORS.border }}
            >
              <View className="flex-row items-center">
                <Text style={{ color: UI_COLORS.accent, fontSize: 18, marginRight: 10 }}>📈</Text>
                <View>
                  <Text className="font-grotesk-bold text-base" style={{ color: UI_COLORS.textPrimary }}>
                    Portfolio Chart
                  </Text>
                  <Text className="font-mono text-xs mt-0.5" style={{ color: UI_COLORS.textMuted }}>
                    View your net worth over time
                  </Text>
                </View>
              </View>
              <Text style={{ color: UI_COLORS.textMuted, fontSize: 18 }}>→</Text>
            </Pressable>
          </View>
        ) : null}

        <View className="px-5 mt-5">
          <CreatedMarketsSection markets={createdMarkets} isOwnProfile={isOwnProfile} />
        </View>

        {isOwnProfile ? (
          <View className="px-5 mt-5">
            <ActivitySection activities={activities} />
          </View>
        ) : null}

        {isOwnProfile ? (
          <View className="px-5 mt-5">
            <Text className="font-grotesk-bold text-[19px] mb-3" style={{ color: UI_COLORS.textPrimary }}>
              Settings
            </Text>
            <View
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: UI_COLORS.surface,
                borderWidth: 1,
                borderColor: UI_COLORS.borderSoft,
              }}
            >
              <SettingsItem
                icon="person"
                label="Edit Profile"
                onPress={() => router.push('/settings/edit-profile')}
              />
              <View className="h-[1px] ml-4" style={{ backgroundColor: UI_COLORS.borderSoft }} />
              <SettingsItem
                icon="notifications"
                label="Notifications"
                onPress={() => router.push('/settings/notifications')}
              />
              <View className="h-[1px] ml-4" style={{ backgroundColor: UI_COLORS.borderSoft }} />
              <SettingsItem
                icon="shield"
                label="Security"
                onPress={() => router.push('/settings/security')}
              />
              <View className="h-[1px] ml-4" style={{ backgroundColor: UI_COLORS.borderSoft }} />
              <SettingsItem
                icon="settings"
                label="App Settings"
                onPress={() => router.push('/settings/app-settings')}
              />
              <View className="h-[1px] ml-4" style={{ backgroundColor: UI_COLORS.borderSoft }} />
              <SettingsItem
                icon="help"
                label="Support"
                onPress={() => router.push('/settings/support')}
              />
              <View className="h-[1px] ml-4" style={{ backgroundColor: UI_COLORS.borderSoft }} />
              <SettingsItem
                icon="info"
                label="About"
                onPress={() => router.push('/settings/about')}
                showChevron={false}
              />
            </View>
          </View>
        ) : null}

        {isOwnProfile ? (
          <View className="px-5 mt-5 mb-2">
            <Pressable
              onPress={handleLogout}
              className="rounded-2xl py-3 items-center"
              style={{
                backgroundColor: UI_COLORS.surface,
                borderWidth: 1,
                borderColor: UI_COLORS.profileStat.logoutBorder,
              }}
              accessibilityRole="button"
              accessibilityLabel="Log Out"
            >
              <Text
                className="font-grotesk-bold text-[14px]"
                style={{ color: UI_COLORS.danger }}
              >
                Log Out
              </Text>
            </Pressable>
          </View>
        ) : null}

      </ScrollView>

      <ConfirmModal
        visible={showLogoutModal}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmLabel="Log Out"
        destructive
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </SafeAreaView>
  );
}
