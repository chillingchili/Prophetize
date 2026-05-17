import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import Svg, { Defs, Line as SvgLine, LinearGradient, Path, Stop } from 'react-native-svg';
import { UI_COLORS, UI_SHADOWS } from '@/constants/ui-tokens';

type OptionSeries = {
  optionId: number;
  name: string;
  values: number[];
};

type Props = {
  series: OptionSeries[];
  labels: string[];
  selectedOptionId?: number | null;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const LINE_COLORS = [
  UI_COLORS.accent,
  UI_COLORS.outcomeYes,
  UI_COLORS.outcomeNo,
  UI_COLORS.warning,
  UI_COLORS.info,
  UI_COLORS.success,
];

function buildPoints(values: number[], chartW: number, chartH: number) {
  const safeValues = values.length ? values : [50];
  const count = safeValues.length;
  const step = count > 1 ? chartW / (count - 1) : chartW;

  return safeValues.map((value, index) => {
    const n = clamp(value, 0, 100);
    return { x: index * step, y: chartH - (n / 100) * chartH };
  });
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  const len = points.length;

  for (let i = 0; i < len - 1; i++) {
    const p0 = i === 0 ? points[0] : points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i + 2 >= len ? points[len - 1] : points[i + 2];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

function buildSmoothAreaPath(smoothPath: string, points: { x: number; y: number }[], chartH: number) {
  if (!points.length || !smoothPath) return '';
  const first = points[0];
  const last = points[points.length - 1];
  return `${smoothPath} L ${last.x} ${chartH} L ${first.x} ${chartH} Z`;
}

export default function MarketDetailTrendChart({ series, labels, selectedOptionId }: Props) {
  const chartW = 100;
  const chartH = 56;

  const rendered = useMemo(() => {
    if (!series.length) {
      const fallbackPoints = [{ x: 0, y: chartH / 2 }, { x: chartW, y: chartH / 2 }];
      const lp = 'M 0 28 L 100 28';
      return [{
        optionId: 0, name: '', values: [50, 50],
        points: fallbackPoints, linePath: lp,
        areaPath: 'M 0 28 L 100 28 L 100 56 L 0 56 Z',
        isSelected: true, colorIndex: 0,
      }];
    }

    return series.map((s, i) => {
      const points = buildPoints(s.values, chartW, chartH);
      const linePath = buildSmoothPath(points);
      const areaPath = buildSmoothAreaPath(linePath, points, chartH);
      const isSelected = selectedOptionId ? s.optionId === selectedOptionId : series.length <= 1;
      return { ...s, points, linePath, areaPath, isSelected, colorIndex: i };
    });
  }, [series, chartW, chartH, selectedOptionId]);

  const svgH = 188;
  const viewBoxH = 64;

  const yTicks = useMemo(() => {
    const marks = [0, 25, 50, 75, 100];
    return marks.map((v) => {
      const viewBoxY = chartH - (v / 100) * chartH;
      const pixelY = (viewBoxY / viewBoxH) * svgH;
      return { value: v, viewBoxY, pixelY };
    });
  }, []);

  const footer = useMemo(() => {
    if (!rendered.length) return null;
    const primary = rendered.find((s) => s.isSelected) ?? rendered[0];
    if (!primary || !primary.values.length) return null;

    const currentValue = Math.round(clamp(primary.values[primary.values.length - 1], 0, 100));
    let globalMin = Infinity;
    let globalMax = -Infinity;
    for (const r of rendered) {
      for (const v of r.values) {
        const c = clamp(v, 0, 100);
        if (c < globalMin) globalMin = c;
        if (c > globalMax) globalMax = c;
      }
    }

    return {
      name: primary.name,
      currentValue,
      max: globalMax === -Infinity ? null : Math.round(globalMax),
      min: globalMin === Infinity ? null : Math.round(globalMin),
    };
  }, [rendered]);

  return (
    <View className="mx-4 rounded-2xl overflow-hidden" style={{ backgroundColor: UI_COLORS.surface, ...UI_SHADOWS.soft }}>
      <View className="px-5 pt-4 pb-1">
        <Text className="font-jetbrain text-[11px] tracking-widest" style={{ color: UI_COLORS.textMuted }}>
          PROBABILITY TREND
        </Text>
      </View>

      <View className="relative">
        <Svg width="100%" height={svgH} viewBox={`0 0 ${chartW} ${viewBoxH}`} preserveAspectRatio="none">
          <Defs>
            {rendered.map((r, i) => (
              <LinearGradient key={r.optionId} id={`tf-${i}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={LINE_COLORS[i % LINE_COLORS.length]} stopOpacity={r.isSelected ? 0.2 : 0.08} />
                <Stop offset="1" stopColor={LINE_COLORS[i % LINE_COLORS.length]} stopOpacity="0.04" />
              </LinearGradient>
            ))}
          </Defs>
          {yTicks.map((t) => (
            <SvgLine
              key={t.value}
              x1={0}
              y1={t.viewBoxY}
              x2={chartW}
              y2={t.viewBoxY}
              stroke={UI_COLORS.borderSoft}
              strokeWidth={0.5}
              strokeDasharray="2 2"
            />
          ))}
          {rendered.map((r, i) => (
            <React.Fragment key={r.optionId}>
              <Path d={r.areaPath} fill={`url(#tf-${i})`} />
              <Path
                d={r.linePath}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={r.isSelected ? 2.5 : 1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={r.isSelected ? '0' : '4 3'}
                fill="none"
                opacity={r.isSelected ? 1 : 0.5}
              />
            </React.Fragment>
          ))}
        </Svg>

        {yTicks.map((t) => (
          <View
            key={t.value}
            style={{
              position: 'absolute',
              left: 4,
              top: t.pixelY - 5,
            }}
          >
            <Text className="font-jetbrain text-[8px] leading-none" style={{ color: UI_COLORS.textMuted }}>
              {t.value}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row justify-between px-5 pb-1">
        {labels.map((label, index) => (
          <Text key={`${label}-${index}`} className="font-jetbrain text-[10px]" style={{ color: UI_COLORS.textMuted }}>
            {label}
          </Text>
        ))}
      </View>

      {series.length > 1 && (
        <View className="flex-row flex-wrap gap-x-4 gap-y-1 px-5 pb-1">
          {series.map((s, i) => {
            const isSelected = selectedOptionId ? s.optionId === selectedOptionId : false;
            const color = LINE_COLORS[i % LINE_COLORS.length];
            return (
              <View key={s.optionId} className="flex-row items-center gap-1.5">
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, opacity: isSelected ? 1 : 0.55 }} />
                <Text className="font-jetbrain text-[9px]" style={{ color: UI_COLORS.textSecondary, opacity: isSelected ? 1 : 0.55 }}>
                  {s.name}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <View className="flex-row justify-between items-center px-5 py-3" style={{ borderTopWidth: 1, borderTopColor: UI_COLORS.borderSoft }}>
        <View>
          <Text className="font-jetbrain text-[9px] tracking-widest" style={{ color: UI_COLORS.textMuted }}>
            {footer?.name ? `${footer.name.toUpperCase()} CURRENT` : 'CURRENT'}
          </Text>
          <Text className="font-grotesk-bold text-lg leading-tight" style={{ color: UI_COLORS.accent }}>
            {footer ? `${footer.currentValue}%` : '--'}
          </Text>
        </View>
        {footer && footer.min !== null && footer.max !== null && (
          <View className="flex-row items-center gap-4">
            <View className="items-end">
              <Text className="font-jetbrain text-[9px] tracking-widest" style={{ color: UI_COLORS.textMuted }}>HIGH</Text>
              <Text className="font-grotesk-bold text-sm leading-tight" style={{ color: UI_COLORS.textPrimary }}>{footer.max}%</Text>
            </View>
            <View className="items-end">
              <Text className="font-jetbrain text-[9px] tracking-widest" style={{ color: UI_COLORS.textMuted }}>LOW</Text>
              <Text className="font-grotesk-bold text-sm leading-tight" style={{ color: UI_COLORS.textPrimary }}>{footer.min}%</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
