import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { UI_COLORS } from '@/constants/ui-tokens';

type Props = {
  data: { snapshot_date: string; net_worth: number }[];
  isLoading: boolean;
  error?: string | null;
};

const CHART_W = 100;
const CHART_H = 48;
const SCREEN_W = Dimensions.get('window').width;
const PADDING = 40;

function buildPoints(values: number[], chartW: number, chartH: number) {
  if (!values.length) return [];
  const count = values.length;
  const step = count > 1 ? chartW / (count - 1) : chartW;

  let min = Math.min(...values);
  let max = Math.max(...values);
  if (max === min) {
    min -= 10;
    max += 10;
  }
  const range = max - min;

  return values.map((value, i) => ({
    x: i * step,
    y: chartH - ((value - min) / range) * chartH,
  }));
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i === 0 ? points[0] : points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i + 2 >= points.length ? points[points.length - 1] : points[i + 2];

    d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function buildAreaPath(smoothPath: string, points: { x: number; y: number }[], chartH: number) {
  if (!points.length || !smoothPath) return '';
  const first = points[0];
  const last = points[points.length - 1];
  return `${smoothPath} L ${last.x} ${chartH} L ${first.x} ${chartH} Z`;
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function PortfolioChart({ data, isLoading, error }: Props) {
  const svgW = SCREEN_W - PADDING * 2;

  if (isLoading) {
    return (
      <View className="py-6 px-5">
        <View className="h-48 rounded-2xl" style={{ backgroundColor: UI_COLORS.surface, borderWidth: 1, borderColor: UI_COLORS.border }}>
          <View className="flex-1 items-center justify-center">
            <Text style={{ color: UI_COLORS.textMuted }}>Loading chart...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="py-6 px-5">
        <View className="h-48 rounded-2xl" style={{ backgroundColor: UI_COLORS.surface, borderWidth: 1, borderColor: UI_COLORS.border }}>
          <View className="flex-1 items-center justify-center">
            <Text style={{ color: UI_COLORS.danger }}>Failed to load chart</Text>
          </View>
        </View>
      </View>
    );
  }

  if (!data || data.length < 2) {
    return null;
  }

  const values = data.map((d) => d.net_worth);
  const points = buildPoints(values, CHART_W, CHART_H);
  const smoothPath = buildSmoothPath(points);
  const areaPath = buildAreaPath(smoothPath, points, CHART_H);

  return (
    <View className="py-6 px-5">
      <View className="rounded-2xl p-4" style={{ backgroundColor: UI_COLORS.surface, borderWidth: 1, borderColor: UI_COLORS.border }}>
        <Text className="font-grotesk-bold text-base mb-3" style={{ color: UI_COLORS.textPrimary }}>
          Portfolio Value
        </Text>

        <Text className="font-mono-bold text-2xl mb-4" style={{ color: UI_COLORS.textPrimary }}>
          {formatCurrency(values[values.length - 1])}
        </Text>

        <Svg width={svgW} height={180} viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="xMidYMid meet">
          <Defs>
            <LinearGradient id="portfolio-chart-fill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={UI_COLORS.accent} stopOpacity="0.2" />
              <Stop offset="1" stopColor={UI_COLORS.accent} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>
          <Path d={areaPath} fill="url(#portfolio-chart-fill)" />
          <Path d={smoothPath} stroke={UI_COLORS.accent} strokeWidth="2" strokeLinecap="round" fill="none" />
        </Svg>

        <View className="flex-row justify-between mt-2">
          <Text className="font-mono text-xs" style={{ color: UI_COLORS.textMuted }}>
            {formatDate(data[0].snapshot_date)}
          </Text>
          <Text className="font-mono text-xs" style={{ color: UI_COLORS.textMuted }}>
            {formatDate(data[data.length - 1].snapshot_date)}
          </Text>
        </View>
      </View>
    </View>
  );
}
