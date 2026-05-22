import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { UI_COLORS } from '@/constants/ui-tokens';
import * as api from '@/utils/api';
import PortfolioChart from '@/components/profile/PortfolioChart';

const RANGES: { key: api.PortfolioChartRange; label: string }[] = [
  { key: '1D', label: '1D' },
  { key: '1W', label: '1W' },
  { key: '1M', label: '1M' },
  { key: 'ALL', label: 'ALL' },
];

export default function PortfolioChartScreen() {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<api.PortfolioChartRange>('1W');
  const [data, setData] = useState<api.PortfolioChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChart = useCallback(async (selectedRange: api.PortfolioChartRange) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getPortfolioChart(selectedRange);
      if (response.ok) {
        setData(response.data);
      } else {
        setError('Failed to load portfolio chart');
      }
    } catch (e) {
      setError('Failed to load portfolio chart');
      console.error('portfolio chart fetch failed', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChart(range);
  }, [range, fetchChart]);

  return (
    <View className="flex-1" style={{ backgroundColor: UI_COLORS.pageBg, paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-3 border-b" style={{ borderColor: UI_COLORS.border }}>
        <Pressable onPress={() => router.back()} className="mr-3 p-2">
          <Text style={{ color: UI_COLORS.accent, fontSize: 18 }}>←</Text>
        </Pressable>
        <Text className="font-grotesk-bold text-lg" style={{ color: UI_COLORS.textPrimary }}>
          Portfolio Chart
        </Text>
      </View>

      <View className="flex-row justify-center px-5 py-3">
        {RANGES.map((r) => (
          <Pressable
            key={r.key}
            onPress={() => setRange(r.key)}
            className="px-4 py-2 mx-1 rounded-full"
            style={{
              backgroundColor: range === r.key ? UI_COLORS.accent : UI_COLORS.surface,
              borderWidth: 1,
              borderColor: range === r.key ? UI_COLORS.accent : UI_COLORS.border,
            }}
          >
            <Text
              className="font-mono text-sm"
              style={{ color: range === r.key ? '#FFFFFF' : UI_COLORS.textSecondary }}
            >
              {r.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView>
        {isLoading && data.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={UI_COLORS.accent} />
          </View>
        ) : (
          <PortfolioChart data={data} isLoading={isLoading} error={error} />
        )}

        {!isLoading && data.length >= 2 && (
          <View className="px-5 pb-8">
            <View className="rounded-2xl p-4" style={{ backgroundColor: UI_COLORS.surface, borderWidth: 1, borderColor: UI_COLORS.border }}>
              <Text className="font-grotesk-bold text-base mb-2" style={{ color: UI_COLORS.textPrimary }}>
                Net Worth History
              </Text>
              {data.slice().reverse().slice(0, 20).map((point, i) => (
                <View key={i} className="flex-row justify-between py-1.5">
                  <Text className="font-mono text-sm" style={{ color: UI_COLORS.textSecondary }}>
                    {new Date(point.snapshot_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text className="font-mono-bold text-sm" style={{ color: UI_COLORS.textPrimary }}>
                    ${point.net_worth.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {error && (
          <View className="flex-1 items-center justify-center py-10">
            <Text style={{ color: UI_COLORS.danger }}>{error}</Text>
            <Pressable onPress={() => fetchChart(range)} className="mt-4 px-6 py-3 rounded-full" style={{ backgroundColor: UI_COLORS.accent }}>
              <Text className="text-white font-mono-bold">Retry</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
