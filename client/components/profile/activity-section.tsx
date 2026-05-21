import React from 'react';
import { View, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { UI_COLORS } from '@/constants/ui-tokens';
import { EmptyState } from '@/components/common/empty-state';
import type { PortfolioActivityTransaction } from '@/utils/api';

type ActivitySectionProps = {
  activities: PortfolioActivityTransaction[];
};

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;

const formatDate = (value?: string | null) => {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '--';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const toActivityIcon = (type: string): keyof typeof MaterialIcons.glyphMap => {
  const normalized = type.toLowerCase();
  if (normalized === 'buy') return 'trending-up';
  if (normalized === 'sell') return 'trending-down';
  if (normalized === 'payout' || normalized === 'resolution') return 'how-to-vote';
  if (normalized === 'loss') return 'timeline';
  return 'timeline';
};

const toActivityLabel = (type: string) => {
  const normalized = type.toLowerCase();
  if (normalized === 'buy') return 'Bought';
  if (normalized === 'sell') return 'Sold';
  if (normalized === 'payout' || normalized === 'resolution') return 'Payout';
  if (normalized === 'loss') return 'Loss';
  return 'Activity';
};

export function ActivitySection({ activities }: ActivitySectionProps) {
  return (
    <View>
      <Text
        className="font-grotesk-bold text-[19px] mb-3"
        style={{ color: UI_COLORS.textPrimary }}
      >
        Recent Activity
      </Text>
      <View
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: UI_COLORS.surface,
          borderWidth: 1,
          borderColor: UI_COLORS.borderSoft,
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
          activities.map((activity: PortfolioActivityTransaction, index: number) => {
            const amount = Number(activity.amount) || 0;
            const isPositive = activity.type !== 'BUY';
            const signedAmount = `${isPositive ? '+' : '-'}${formatCurrency(Math.abs(amount))}`;
            const icon = toActivityIcon(activity.type);
            const label = toActivityLabel(activity.type);

            return (
              <View key={activity.id}>
                <View className="px-4 py-3 flex-row">
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: UI_COLORS.accentSoft }}
                  >
                    <MaterialIcons name={icon} size={18} color={UI_COLORS.linkPressed} />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-2">
                        <Text
                          className="font-grotesk-bold text-[14px]"
                          style={{ color: UI_COLORS.textPrimary }}
                        >
                          {activity.market_title}
                        </Text>
                        <Text
                          className="font-jetbrain text-[11px] mt-1"
                          style={{ color: UI_COLORS.textSecondary }}
                        >
                          {label} • {formatDate(activity.created_at)}
                        </Text>
                      </View>
                      <Text
                        className="font-grotesk-bold text-[14px]"
                        style={{
                          color: isPositive ? UI_COLORS.success : UI_COLORS.danger,
                        }}
                      >
                        {signedAmount}
                      </Text>
                    </View>
                  </View>
                </View>
                {index < activities.length - 1 ? (
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
