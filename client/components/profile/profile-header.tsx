import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { UI_COLORS } from '@/constants/ui-tokens';
import { ProfileAvatar } from '@/components/profile/profile-avatar';

type ProfileHeaderProps = {
  isOwnProfile: boolean;
  displayName: string;
  joinedLabel: string | null;
  avatarUrl?: string | null;
  netWorthValue: number;
  balanceValue: number;
  viewedUserId?: string;
  isFollowing?: boolean;
  followLoading?: boolean;
  followErrorMessage?: string | null;
  onFollowToggle?: () => void;
};

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;

export function ProfileHeader({
  isOwnProfile,
  displayName,
  joinedLabel,
  avatarUrl,
  netWorthValue,
  balanceValue,
  viewedUserId,
  isFollowing = false,
  followLoading = false,
  followErrorMessage = null,
  onFollowToggle,
}: ProfileHeaderProps) {
  return (
    <View
      className="rounded-3xl overflow-hidden"
      style={{
        borderWidth: 1,
        borderColor: UI_COLORS.accentBorder,
        backgroundColor: UI_COLORS.surface,
      }}
    >
      <View className="px-4 py-3" style={{ backgroundColor: UI_COLORS.accentSoft }}>
        <Text
          className="font-jetbrain text-[11px] tracking-widest"
          style={{ color: UI_COLORS.linkPressed }}
        >
          PROFILE
        </Text>
      </View>

      <View className="p-4">
        <View className="flex-row items-center">
          <ProfileAvatar
            imageUrl={avatarUrl || undefined}
            username={displayName}
            size="md"
            editable={false}
          />
          <View className="ml-3 flex-1">
            <Text
              className="font-grotesk-bold text-[24px]"
              style={{ color: UI_COLORS.textPrimary }}
            >
              {displayName}
            </Text>
            {joinedLabel ? (
              <Text
                className="font-jetbrain text-[12px] mt-1"
                style={{ color: UI_COLORS.textSecondary }}
              >
                Joined {joinedLabel}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="flex-row mt-4 gap-2">
          <View
            className="rounded-2xl px-3 py-2 flex-1"
            style={{
              backgroundColor: UI_COLORS.profileStat.netWorthBg,
              borderWidth: 1,
              borderColor: UI_COLORS.profileStat.netWorthBorder,
            }}
          >
            <Text
              className="font-jetbrain text-[10px]"
              style={{ color: UI_COLORS.profileStat.netWorthLabel }}
            >
              NET WORTH
            </Text>
            <Text
              className="font-grotesk-bold text-[17px] mt-1"
              style={{ color: UI_COLORS.textPrimary }}
            >
              {formatCurrency(netWorthValue)}
            </Text>
          </View>
          <View
            className="rounded-2xl px-3 py-2 flex-1"
            style={{
              backgroundColor: UI_COLORS.profileStat.balanceBg,
              borderWidth: 1,
              borderColor: UI_COLORS.profileStat.balanceBorder,
            }}
          >
            <Text
              className="font-jetbrain text-[10px]"
              style={{ color: UI_COLORS.textSecondary }}
            >
              BALANCE
            </Text>
            <Text
              className="font-grotesk-bold text-[17px] mt-1"
              style={{ color: UI_COLORS.textPrimary }}
            >
              {formatCurrency(balanceValue)}
            </Text>
          </View>
        </View>

        {!isOwnProfile && viewedUserId ? (
          <View className="mt-3 items-start">
            <Pressable
              onPress={onFollowToggle}
              disabled={followLoading}
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor: isFollowing ? UI_COLORS.textMuted : UI_COLORS.success,
                opacity: followLoading ? 0.7 : 1,
              }}
              accessibilityRole="button"
              accessibilityLabel={followLoading ? 'Updating follow status' : isFollowing ? 'Following' : 'Follow'}
            >
              <Text
                className="font-jetbrain-bold text-[12px]"
                style={{ color: UI_COLORS.surface }}
              >
                {followLoading ? 'Updating...' : isFollowing ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
            {followErrorMessage ? (
              <Text
                className="font-jetbrain text-[11px] mt-2"
                style={{ color: UI_COLORS.hint }}
              >
                {followErrorMessage}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
