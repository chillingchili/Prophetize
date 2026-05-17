import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { UI_COLORS } from '@/constants/ui-tokens';
import { EmptyState } from '@/components/common/empty-state';
import { useRouter } from 'expo-router';
import type { CreatedMarketItem } from '@/utils/api';

type CreatedMarketsSectionProps = {
  markets: CreatedMarketItem[];
  isOwnProfile: boolean;
};

const CREATED_MARKET_OPENABLE_STATUSES = ['active', 'closed', 'resolving', 'disputed', 'finalized'];

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;

const formatDate = (value?: string | null) => {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '--';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const statusColors = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return {
        bg: UI_COLORS.profileStat.statusActiveBg,
        border: UI_COLORS.profileStat.statusActiveBorder,
        text: UI_COLORS.profileStat.statusActiveText,
      };
    case 'pending':
      return {
        bg: UI_COLORS.profileStat.statusPendingBg,
        border: UI_COLORS.profileStat.statusPendingBorder,
        text: UI_COLORS.profileStat.statusPendingText,
      };
    case 'rejected':
      return {
        bg: UI_COLORS.profileStat.statusRejectedBg,
        border: UI_COLORS.profileStat.statusRejectedBorder,
        text: UI_COLORS.danger,
      };
    case 'finalized':
    case 'closed':
      return {
        bg: UI_COLORS.profileStat.statusFinalizedBg,
        border: UI_COLORS.profileStat.statusFinalizedBorder,
        text: UI_COLORS.success,
      };
    default:
      return {
        bg: UI_COLORS.surfaceSoft,
        border: UI_COLORS.borderSoft,
        text: UI_COLORS.textSecondary,
      };
  }
};

export function CreatedMarketsSection({ markets, isOwnProfile }: CreatedMarketsSectionProps) {
  const router = useRouter();

  return (
    <View>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-grotesk-bold text-[19px]" style={{ color: UI_COLORS.textPrimary }}>
          {isOwnProfile ? 'Your Created Markets' : 'Created Markets'}
        </Text>
        <Text className="font-jetbrain text-[11px]" style={{ color: UI_COLORS.textSecondary }}>
          {markets.length} total
        </Text>
      </View>

      <View
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: UI_COLORS.surface,
          borderWidth: 1,
          borderColor: UI_COLORS.borderSoft,
        }}
      >
        {markets.length === 0 ? (
          <EmptyState
            icon="storefront"
            title="No created markets yet"
            description={
              isOwnProfile
                ? 'Create your first market to see it here.'
                : 'No public market creations to show.'
            }
            compact
          />
        ) : (
          markets.map((market: CreatedMarketItem, index: number) => {
            const canOpen = CREATED_MARKET_OPENABLE_STATUSES.includes(market.status.toLowerCase());
            const colors = statusColors(market.status);
            return (
              <View key={market.id}>
                <View className="px-4 py-3">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text
                        className="font-grotesk-bold text-[15px]"
                        style={{ color: UI_COLORS.textPrimary }}
                      >
                        {market.title}
                      </Text>
                      <Text
                        className="font-jetbrain text-[11px] mt-1"
                        style={{ color: UI_COLORS.textSecondary }}
                      >
                        {market.category} • Resolves {formatDate(market.endDate)}
                      </Text>
                    </View>
                    <View
                      className="rounded-full px-2 py-1"
                      style={{
                        backgroundColor: colors.bg,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text
                        className="font-jetbrain text-[10px]"
                        style={{ color: colors.text }}
                      >
                        {market.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mt-3">
                    <Text
                      className="font-jetbrain text-[11px]"
                      style={{ color: UI_COLORS.textSecondary }}
                    >
                      Volume {formatCurrency(market.totalVolume)}
                    </Text>
                    {canOpen ? (
                      <Pressable
                        onPress={() => {
                          router.push({
                            pathname: '/marketDetails',
                            params: { id: String(market.id) },
                          });
                        }}
                        className="rounded-full px-3 py-1"
                        style={{
                          backgroundColor: UI_COLORS.accentSoft,
                          borderWidth: 1,
                          borderColor: UI_COLORS.accentBorder,
                        }}
                      >
                        <Text
                          className="font-jetbrain text-[11px]"
                          style={{ color: UI_COLORS.linkPressed }}
                        >
                          Open
                        </Text>
                      </Pressable>
                    ) : (
                      <Text
                        className="font-jetbrain text-[11px]"
                        style={{ color: UI_COLORS.textMuted }}
                      >
                        Not public yet
                      </Text>
                    )}
                  </View>
                </View>
                {index < markets.length - 1 ? (
                  <View
                    className="h-[1px] ml-4"
                    style={{ backgroundColor: UI_COLORS.borderSoft }}
                  />
                ) : null}
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}
