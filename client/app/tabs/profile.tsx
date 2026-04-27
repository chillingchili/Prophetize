import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { useAuth } from '../../context/AuthContext';
import { useUserStore } from '../../context/useUserStore';

import { useAppTheme } from '../../hooks/use-app-theme';
import * as api from '@/utils/api';

import { ProfileAvatar } from '@/components/profile/profile-avatar';
import { EmptyState } from '@/components/common/empty-state';
import { SettingsItem } from '@/components/profile/settings-item';

const CREATED_MARKET_OPENABLE_STATUSES = ['active', 'closed', 'resolving', 'disputed', 'finalized'];

const formatCurrency = (value: number) => {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
};

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

const statusColors = (status: string, theme: ReturnType<typeof useAppTheme>) => {
  switch (status.toLowerCase()) {
    case 'active':
      return { bg: '#DFF7FE', border: '#82DAEF', text: '#007FA2' };
    case 'pending':
      return { bg: '#FFF5D9', border: '#F7D27B', text: '#8A5B00' };
    case 'rejected':
      return { bg: '#FEE2E2', border: '#FCA5A5', text: theme.danger };
    case 'finalized':
    case 'closed':
      return { bg: '#E7F8F0', border: '#A5E2C2', text: theme.success };
    default:
      return { bg: theme.surfaceSoft, border: theme.borderSoft, text: theme.textSecondary };
  }
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

const toActivityIcon = (type: string): keyof typeof MaterialIcons.glyphMap => {
  const normalized = type.toLowerCase();
  if (normalized === 'buy') return 'trending-up';
  if (normalized === 'sell') return 'trending-down';
  if (normalized === 'resolution') return 'how-to-vote';
  return 'timeline';
};

const toActivityLabel = (type: string) => {
  const normalized = type.toLowerCase();
  if (normalized === 'buy') return 'Bought';
  if (normalized === 'sell') return 'Sold';
  if (normalized === 'resolution') return 'Resolved';
  return 'Activity';
};

function SectionHeader({ title, theme }: { title: string; theme: ReturnType<typeof useAppTheme> }) {
  return (
    <View className="flex-row items-center mb-3">
      <View className="h-5 justify-center" style={{ borderLeftWidth: 3, borderLeftColor: theme.accent }}>
        <Text className="font-grotesk-bold text-[17px] ml-2" style={{ color: theme.textPrimary }}>
          {title}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { userId: routeUserId, initialFollowing } = useLocalSearchParams<{ userId?: string; initialFollowing?: string }>();
  const { logout, user } = useAuth();
  const { userData, fetchUserData } = useUserStore();
  const tabBarHeight = useBottomTabBarHeight();
  const theme = useAppTheme();

  const [summary, setSummary] = useState<api.PortfolioSummary | null>(null);
  const [activities, setActivities] = useState<api.PortfolioActivityTransaction[]>([]);
  const [createdMarkets, setCreatedMarkets] = useState<api.CreatedMarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(initialFollowing === '1');
  const [followLoading, setFollowLoading] = useState(false);
  const [followErrorMessage, setFollowErrorMessage] = useState<string | null>(null);

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

    const summaryTask = isOwnProfile ? api.getPortfolioSummary() : Promise.resolve({ ok: true, data: null });
    const activityTask = isOwnProfile ? api.getPortfolioActivity() : Promise.resolve({ ok: true, data: [] });
    const createdTask = api.getCreatedMarkets({
      userId: isOwnProfile ? undefined : viewedUserId,
      limit: 6,
    });

    const [profileResult, summaryResult, activityResult, createdResult] = await Promise.all([
      fetchUserData(),
      summaryTask,
      activityTask,
      createdTask,
    ]);

    if (isOwnProfile && summaryResult.ok && summaryResult.data && typeof summaryResult.data === 'object') {
      setSummary(summaryResult.data as api.PortfolioSummary);
    } else if (isOwnProfile && !summaryResult.ok) {
      setLoadError('Unable to load profile summary right now.');
    } else {
      setSummary(null);
    }

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
        .slice(0, 6);

      setActivities(normalized);
    } else if (!isOwnProfile) {
      setActivities([]);
    }

    if (createdResult.ok) {
      const normalized = api.normalizeCreatedMarketsPayload(createdResult.data);

      setCreatedMarkets(normalized);
    } else {
      setCreatedMarkets([]);
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

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

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
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-base font-jetbrain" style={{ color: theme.textSecondary }}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
          />
        }
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
      >
        {/* Hero / Identity Card */}
        <View className="px-5 pt-4">
          <View
            className="rounded-3xl overflow-hidden"
            style={{
              borderWidth: 1,
              borderColor: theme.accentBorder,
              backgroundColor: theme.surfaceElevated,
            }}
          >
            <View className="px-4 py-2.5" style={{ backgroundColor: theme.surfaceMuted }}>
              <Text className="font-jetbrain text-[10px] tracking-widest" style={{ color: theme.textSecondary }}>
                CREATOR PROFILE
              </Text>
            </View>

            <View className="p-5">
              <View className="flex-row items-center">
                <View
                  className="rounded-full items-center justify-center"
                  style={{
                    borderWidth: 2,
                    borderColor: theme.accent,
                    padding: 2,
                  }}
                >
                  <ProfileAvatar
                    imageUrl={summary?.avatar_url || user?.avatar_url}
                    username={displayName}
                    size="lg"
                    editable={false}
                  />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="font-grotesk-bold text-[26px]" style={{ color: theme.textPrimary }}>
                    {displayName}
                  </Text>
                  {joinedLabel ? (
                    <Text className="font-jetbrain text-[12px] mt-1" style={{ color: theme.textSecondary }}>
                      Joined {joinedLabel}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View className="flex-row mt-5 gap-2">
                <View
                  className="rounded-2xl px-3 py-2.5 flex-1"
                  style={{
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: theme.borderSoft,
                  }}
                >
                  <Text className="font-jetbrain text-[10px]" style={{ color: theme.textMuted }}>NET WORTH</Text>
                  <Text className="font-grotesk-bold text-[17px] mt-1" style={{ color: theme.textPrimary }}>
                    {formatCurrency(netWorthValue)}
                  </Text>
                </View>
                <View
                  className="rounded-2xl px-3 py-2.5 flex-1"
                  style={{
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: theme.borderSoft,
                  }}
                >
                  <Text className="font-jetbrain text-[10px]" style={{ color: theme.textMuted }}>BALANCE</Text>
                  <Text className="font-grotesk-bold text-[17px] mt-1" style={{ color: theme.textPrimary }}>
                    {formatCurrency(balanceValue)}
                  </Text>
                </View>
              </View>

              {!isOwnProfile ? (
                <View className="mt-3 items-start">
                  <Pressable
                    onPress={() => {
                      void handleFollowToggle();
                    }}
                    disabled={followLoading}
                    className="px-4 py-2 rounded-full"
                    style={{
                      backgroundColor: isFollowing ? theme.textMuted : theme.success,
                      opacity: followLoading ? 0.7 : 1,
                    }}
                  >
                    <Text className="font-jetbrain-bold text-[12px]" style={{ color: theme.surface }}>
                      {followLoading ? 'Updating...' : isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </Pressable>
                  {followErrorMessage ? (
                    <Text className="font-jetbrain text-[11px] mt-2" style={{ color: theme.danger }}>
                      {followErrorMessage}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {loadError ? (
          <View className="px-5 mt-3">
            <Text className="font-jetbrain text-[12px]" style={{ color: theme.danger }}>
              {loadError}
            </Text>
          </View>
        ) : null}

        {/* Stats Grid */}
        {isOwnProfile ? (
          <View className="px-5 mt-6">
            <SectionHeader title="Statistics" theme={theme} />
            <View className="flex-row gap-3">
              <View
                className="flex-1 rounded-xl p-3"
                style={{
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.borderSoft,
                }}
              >
                <Text className="font-jetbrain text-[10px] uppercase tracking-wider" style={{ color: theme.textMuted }}>
                  PREDICTIONS
                </Text>
                <Text className="font-grotesk-bold text-[20px] mt-1" style={{ color: theme.textPrimary }}>
                  {predictionsCount}
                </Text>
              </View>
              <View
                className="flex-1 rounded-xl p-3"
                style={{
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.borderSoft,
                }}
              >
                <Text className="font-jetbrain text-[10px] uppercase tracking-wider" style={{ color: theme.textMuted }}>
                  OPEN VALUE
                </Text>
                <Text className="font-grotesk-bold text-[20px] mt-1" style={{ color: theme.textPrimary }}>
                  {formatCurrency(positionsValue)}
                </Text>
              </View>
              <View
                className="flex-1 rounded-xl p-3"
                style={{
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.borderSoft,
                }}
              >
                <Text className="font-jetbrain text-[10px] uppercase tracking-wider" style={{ color: theme.textMuted }}>
                  BIGGEST WIN
                </Text>
                <Text className="font-grotesk-bold text-[20px] mt-1" style={{ color: theme.success }}>
                  {formatCurrency(biggestWin)}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Created Markets */}
        <View className="px-5 mt-6">
          <SectionHeader title={isOwnProfile ? 'Your Created Markets' : 'Created Markets'} theme={theme} />
          <View
            className="rounded-2xl overflow-hidden mt-1"
            style={{
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.borderSoft,
            }}
          >
            {createdMarkets.length === 0 ? (
              <EmptyState
                icon="storefront"
                title="No created markets yet"
                description={isOwnProfile ? 'Create your first market to see it here.' : 'No public market creations to show.'}
                compact
              />
            ) : (
              createdMarkets.map((market, index) => {
                const canOpen = CREATED_MARKET_OPENABLE_STATUSES.includes(market.status.toLowerCase());
                const colors = statusColors(market.status, theme);
                return (
                  <View key={market.id}>
                    <View className="px-4 py-3">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                          <Text className="font-grotesk-bold text-[15px]" style={{ color: theme.textPrimary }}>
                            {market.title}
                          </Text>
                          <Text className="font-jetbrain text-[11px] mt-1" style={{ color: theme.textSecondary }}>
                            {market.category} • Resolves {formatDate(market.endDate)}
                          </Text>
                        </View>
                        <View className="rounded-full px-2 py-1" style={{ backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
                          <Text className="font-jetbrain text-[10px]" style={{ color: colors.text }}>
                            {market.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center justify-between mt-3">
                        <Text className="font-jetbrain text-[11px]" style={{ color: theme.textSecondary }}>
                          Volume {formatCurrency(market.totalVolume)}
                        </Text>
                        {canOpen ? (
                          <Pressable
                            onPress={() => {
                              router.push({ pathname: '/marketDetails', params: { id: String(market.id) } });
                            }}
                            className="rounded-full px-3 py-1"
                            style={{ backgroundColor: theme.accentSoft, borderWidth: 1, borderColor: theme.accentBorder }}
                          >
                            <Text className="font-jetbrain text-[11px]" style={{ color: theme.linkPressed }}>
                              Open
                            </Text>
                          </Pressable>
                        ) : (
                          <Text className="font-jetbrain text-[11px]" style={{ color: theme.textMuted }}>
                            Not public yet
                          </Text>
                        )}
                      </View>
                    </View>
                    {index < createdMarkets.length - 1 ? (
                      <View className="h-[1px] ml-4" style={{ backgroundColor: theme.borderSoft }} />
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Recent Activity */}
        {isOwnProfile ? (
          <View className="px-5 mt-6">
            <SectionHeader title="Recent Activity" theme={theme} />
            <View
              className="rounded-2xl overflow-hidden mt-1"
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.borderSoft,
              }}
            >
              {activities.length === 0 ? (
                <EmptyState
                  icon="history"
                  title="No activity yet"
                  description="Your trades and resolutions will appear here."
                  compact
                />
              ) : (
                activities.map((activity, index) => {
                  const amount = Number(activity.amount) || 0;
                  const isPositive = amount >= 0;
                  const signedAmount = `${isPositive ? '+' : '-'}${formatCurrency(Math.abs(amount))}`;
                  const icon = toActivityIcon(activity.type);
                  const label = toActivityLabel(activity.type);

                  return (
                    <View key={activity.id}>
                      <View className="px-4 py-4 flex-row">
                        <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: theme.accentSoft }}>
                          <MaterialIcons name={icon} size={18} color={theme.linkPressed} />
                        </View>

                        <View className="flex-1">
                          <View className="flex-row items-start justify-between">
                            <View className="flex-1 pr-2">
                              <Text className="font-grotesk-bold text-[14px]" style={{ color: theme.textPrimary }}>
                                {activity.market_title}
                              </Text>
                              <Text className="font-jetbrain text-[11px] mt-1" style={{ color: theme.textSecondary }}>
                                {label} • {formatDate(activity.created_at)}
                              </Text>
                            </View>
                            <Text className="font-grotesk-bold text-[14px]" style={{ color: isPositive ? theme.success : theme.danger }}>
                              {signedAmount}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {index < activities.length - 1 ? (
                        <View className="h-[1px] ml-4" style={{ backgroundColor: theme.borderSoft }} />
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>
          </View>
        ) : null}

        {/* Settings */}
        {isOwnProfile ? (
          <View className="px-5 mt-6 mb-2">
            <SectionHeader title="Settings" theme={theme} />
            <View
              className="rounded-2xl overflow-hidden mt-1"
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.borderSoft,
              }}
            >
              <SettingsItem icon="person" label="Edit Profile" onPress={() => router.push('/settings/edit-profile')} />
              <View className="h-[1px]" style={{ backgroundColor: theme.borderSoft }} />
              <SettingsItem icon="notifications" label="Notifications" onPress={() => router.push('/settings/notifications')} />
              <View className="h-[1px]" style={{ backgroundColor: theme.borderSoft }} />
              <SettingsItem icon="settings" label="App Settings" onPress={() => router.push('/settings/app-settings')} />
              <View className="h-[1px]" style={{ backgroundColor: theme.borderSoft }} />
              <SettingsItem icon="lock" label="Security" onPress={() => router.push('/settings/security')} />
              <View className="h-[1px]" style={{ backgroundColor: theme.borderSoft }} />
              <SettingsItem icon="help-outline" label="Support" onPress={() => router.push('/settings/support')} />
              <View className="h-[1px]" style={{ backgroundColor: theme.borderSoft }} />
              <SettingsItem icon="info" label="About" onPress={() => router.push('/settings/about')} />
              <View className="h-[1px]" style={{ backgroundColor: theme.borderSoft }} />
              <SettingsItem icon="logout" label="Log Out" destructive onPress={handleLogout} />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
