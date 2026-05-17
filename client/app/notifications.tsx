import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ExploreTheme } from '@/constants/explore-theme';
import { UI_COLORS } from '@/constants/ui-tokens';
import * as api from '@/utils/api';
import { useNotificationBadge } from '@/context/NotificationBadgeContext';

const toFollowErrorMessage = (value: unknown): string => {
  if (typeof value !== 'string') {
    return 'Unable to update follow status.';
  }

  const normalized = value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return normalized || 'Unable to update follow status.';
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { resetUnreadCount } = useNotificationBadge();
  const [items, setItems] = useState<api.NotificationInboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inboxFallbackMessage, setInboxFallbackMessage] = useState<string | null>(null);
  const [followingProfiles, setFollowingProfiles] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  const [followErrorMessage, setFollowErrorMessage] = useState<Record<string, string>>({});

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setInboxFallbackMessage(null);

    const result = await api.getNotifications();
    if (!result.ok) {
      const error = 'error' in result.data ? result.data.error : 'Unable to load notifications right now.';
      setErrorMessage(error);
      setItems([]);
      setIsLoading(false);
      return;
    }

    if ('error' in result.data) {
      setErrorMessage(result.data.error);
      setItems([]);
      setIsLoading(false);
      return;
    }

    setItems(result.data.items);
    if (result.data.source === 'backend') {
      resetUnreadCount(); // Reset badge when inbox is opened with real data
    }
    if (result.data.source === 'fallback') {
      setInboxFallbackMessage(result.data.message ?? 'Notification inbox endpoint is not available yet.');
    }

    setIsLoading(false);
  }, [resetUnreadCount]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handlePress = (payload: api.NotificationPayload) => {
    const target = api.resolveNotificationTarget(payload);
    if (!target) {
      Alert.alert('Unsupported notification target');
      return;
    }

    if (target.pathname === '/tabs/profile' && target.params?.userId) {
      const userId = target.params.userId;
      router.push({
        pathname: '/tabs/profile',
        params: {
          userId,
          initialFollowing: followingProfiles[userId] ? '1' : '0',
        },
      } as never);
      return;
    }

    router.push(target as never);
  };

  const handleFollowFromNotification = async (payload: api.NotificationPayload) => {
    const target = api.resolveNotificationTarget(payload);
    const targetUserId = target?.pathname === '/tabs/profile' ? target.params?.userId : undefined;

    if (!targetUserId) {
      Alert.alert('Missing profile target');
      return;
    }

    if (followLoading[targetUserId]) {
      return;
    }

    const isFollowing = Boolean(followingProfiles[targetUserId]);
    const optimisticFollowing = !isFollowing;

    setFollowingProfiles((current) => ({
      ...current,
      [targetUserId]: optimisticFollowing,
    }));
    setFollowErrorMessage((current) => ({ ...current, [targetUserId]: '' }));
    setFollowLoading((current) => ({ ...current, [targetUserId]: true }));

    const action: api.FollowAction = isFollowing ? 'unfollow' : 'follow';
    const { ok, data } = await api.followUser(targetUserId, action);
    setFollowLoading((current) => ({ ...current, [targetUserId]: false }));

    if (!ok) {
      setFollowingProfiles((current) => ({
        ...current,
        [targetUserId]: isFollowing,
      }));

      const message = toFollowErrorMessage(data?.error);
      setFollowErrorMessage((current) => ({
        ...current,
        [targetUserId]: message,
      }));
      Alert.alert('Follow action failed', message);
      return;
    }

    setFollowingProfiles((current) => ({
      ...current,
      [targetUserId]: Boolean(data?.relationship?.following),
    }));
    setFollowErrorMessage((current) => ({ ...current, [targetUserId]: '' }));
  };

  return (
    <View className="flex-1" style={{ backgroundColor: ExploreTheme.pageBg }}>
      <SafeAreaView edges={['top']} className="bg-white">
        <View
          className="px-5 bg-white"
          style={{
            borderBottomWidth: 1,
            borderBottomColor: ExploreTheme.headerBorder,
            paddingVertical: 14,
          }}
        >
          <View className="flex-row items-center gap-2">
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <MaterialIcons name="arrow-back" size={22} color={ExploreTheme.titleText} />
            </Pressable>
            <Text className="font-grotesk-bold text-[20px] flex-1" style={{ color: ExploreTheme.titleText }}>
              Notifications
            </Text>
            {items.length > 0 && !inboxFallbackMessage && (
              <Pressable
                onPress={async () => {
                  // Optimistic: clear all items' visual state
                  setItems((current) => current.map((item) => ({ ...item, is_read: true })));
                  resetUnreadCount();
                  const result = await api.markAllNotificationsAsRead();
                  if (!result.ok) {
                    // Revert on failure — reload
                    void loadNotifications();
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Mark all notifications as read"
                hitSlop={8}
              >
                <Text className="font-jetbrain text-[12px]" style={{ color: ExploreTheme.linkText }}>
                  Mark all as read
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView className="px-5 py-4" contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
        {isLoading ? (
          <View className="rounded-xl p-4" style={{ backgroundColor: UI_COLORS.surface, borderWidth: 1, borderColor: ExploreTheme.headerBorder }}>
            <Text className="font-jetbrain text-[12px]" style={{ color: ExploreTheme.secondaryText }}>
              Loading notifications...
            </Text>
          </View>
        ) : null}

        {!isLoading && errorMessage ? (
          <View className="rounded-xl p-4" style={{ backgroundColor: UI_COLORS.surface, borderWidth: 1, borderColor: ExploreTheme.headerBorder }}>
            <Text className="font-grotesk-bold text-[15px]" style={{ color: ExploreTheme.titleText }}>
              Could not load notifications
            </Text>
            <Text className="font-jetbrain text-[12px] mt-1" style={{ color: ExploreTheme.secondaryText }}>
              {errorMessage}
            </Text>
            <Pressable
              onPress={() => void loadNotifications()}
              accessibilityRole="button"
              accessibilityLabel="Retry notifications"
              accessibilityHint="Attempts to load notifications again"
              className="px-3 py-2 rounded-lg mt-3 self-start"
              style={{ backgroundColor: UI_COLORS.accent }}
            >
              <Text className="font-jetbrain text-[11px]" style={{ color: UI_COLORS.surface }}>
                Try again
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !errorMessage && inboxFallbackMessage ? (
          <View className="rounded-xl p-4" style={{ backgroundColor: UI_COLORS.hintBg, borderWidth: 1, borderColor: UI_COLORS.hintBorder }}>
            <Text className="font-grotesk-bold text-[14px]" style={{ color: UI_COLORS.hint }}>
              Backend inbox not available
            </Text>
            <Text className="font-jetbrain text-[12px] mt-1" style={{ color: ExploreTheme.secondaryText }}>
              {inboxFallbackMessage}
            </Text>
          </View>
        ) : null}

        {!isLoading && !errorMessage && items.length === 0 ? (
          <View className="rounded-xl p-4" style={{ backgroundColor: UI_COLORS.surface, borderWidth: 1, borderColor: ExploreTheme.headerBorder }}>
            <Text className="font-grotesk-bold text-[15px]" style={{ color: ExploreTheme.titleText }}>
              No notifications yet
            </Text>
            <Text className="font-jetbrain text-[12px] mt-1" style={{ color: ExploreTheme.secondaryText }}>
              Updates about markets, rankings, and profile activity will appear here once available.
            </Text>
          </View>
        ) : null}

        {items.map((item) => {
          const profileTarget = api.resolveNotificationTarget(item);
          const profileUserId =
            profileTarget?.pathname === '/tabs/profile' ? profileTarget.params?.userId : undefined;
          const profileLoading = profileUserId ? Boolean(followLoading[profileUserId]) : false;
          const profileFollowing = profileUserId ? Boolean(followingProfiles[profileUserId]) : false;
          const profileError = profileUserId ? followErrorMessage[profileUserId] : '';

          return (
            <View
              key={item.id}
              className="rounded-xl p-4"
              style={{ backgroundColor: UI_COLORS.surface, borderWidth: 1, borderColor: ExploreTheme.headerBorder }}
            >
              <Text className="font-grotesk-bold text-[15px] mb-1" style={{ color: ExploreTheme.titleText }}>
                {item.title}
              </Text>
              <Text className="font-jetbrain text-[12px]" style={{ color: ExploreTheme.secondaryText }}>
                {item.body}
              </Text>

              <View className="flex-row gap-2 mt-3">
                <Pressable
                  onPress={() => handlePress(item)}
                  accessibilityRole="button"
                  accessibilityLabel="Open notification"
                  accessibilityHint="Navigates to the destination linked to this notification"
                  className="px-3 py-2 rounded-lg"
                  style={{ backgroundColor: UI_COLORS.accent }}
                >
                  <Text className="font-jetbrain text-[11px]" style={{ color: UI_COLORS.surface }}>
                    Open
                  </Text>
                </Pressable>

                {item.type === 'profile' && (
                  <View>
                    <Pressable
                      onPress={() => handleFollowFromNotification(item)}
                      disabled={profileLoading}
                      accessibilityRole="button"
                      accessibilityLabel={profileFollowing ? 'Unfollow profile' : 'Follow profile'}
                      accessibilityHint="Toggles follow state for this profile"
                      className="px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: profileFollowing ? UI_COLORS.textMuted : UI_COLORS.success,
                        opacity: profileLoading ? 0.7 : 1,
                      }}
                    >
                      <Text className="font-jetbrain text-[11px]" style={{ color: UI_COLORS.surface }}>
                        {profileLoading ? 'Updating...' : profileFollowing ? 'Following' : 'Follow'}
                      </Text>
                    </Pressable>
                    {profileError ? (
                      <Text className="font-jetbrain text-[11px] mt-2" style={{ color: ExploreTheme.searchHint }}>
                        {profileError}
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
