import { AppThemeLight, AppThemeDark } from './app-theme';
import React from 'react';

type Theme = 'light' | 'dark';
let activeTheme: Theme = 'light';
let themeVersion = 0;
const listeners = new Set<() => void>();

export function _setTheme(theme: Theme) {
  activeTheme = theme;
  themeVersion++;
  listeners.forEach(fn => fn());
}

export function getThemeVersion() {
  return themeVersion;
}

const lightTheme = {
  pageBg: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceMuted: '#EAF6FB',
  surfaceSoft: '#F3FAFD',
  border: '#D5EAF1',
  borderSoft: '#E1F1F6',
  borderMuted: '#DDEDF4',
  textPrimary: '#0B1F2A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  link: '#2BB5D6',
  linkPressed: '#1F9CB9',
  accent: '#2BB5D6',
  accentPressed: '#1F9CB9',
  accentSoft: 'rgba(43, 181, 214, 0.12)',
  accentBorder: '#9CDDEA',
  info: '#7AD9ED',
  warning: '#F59E0B',
  success: '#10B981',
  danger: '#EF4444',
  hint: '#B45309',
  hintBg: '#FFFBEB',
  hintBorder: '#FDE68A',
  outcomeYes: '#059669',
  outcomeYesSoft: 'rgba(5, 150, 105, 0.12)',
  outcomeNo: '#DC2626',
  outcomeNoSoft: 'rgba(220, 38, 38, 0.12)',
  secondary: '#D97706',
  secondaryPressed: '#B45309',
  secondarySoft: 'rgba(217, 119, 6, 0.12)',
  secondaryContainer: '#FFFBEB',
  onSecondaryContainer: '#78350F',
  tertiary: '#7C3AED',
  tertiaryPressed: '#6D28D9',
  tertiarySoft: 'rgba(124, 58, 237, 0.12)',
  tertiaryContainer: '#F5F3FF',
  onTertiaryContainer: '#4C1D95',
  primaryContainer: '#A6F1FF',
  onPrimaryContainer: '#002028',
  createMarket: {
    cardBg: '#FFFFFF',
    cardBorder: '#DDEDF4',
    fieldBg: '#F3FAFD',
    fieldBorder: '#D5EAF1',
    fieldBorderError: '#EF4444',
    chipBg: '#FFFFFF',
    chipBorder: '#D5EAF1',
    chipBgActive: 'rgba(43, 181, 214, 0.12)',
    chipBorderActive: '#9CDDEA',
    chipTextMuted: '#64748B',
  },
  leaderboard: {
    rank1: {
      border: '#E7CB62',
      badgeBg: '#FFF4C9',
      badgeText: '#A56E00',
      rankText: '#A56E00',
      cardBg: '#FFFDF2',
      stripeBg: '#F9EDB5',
      shadow: '#D4A11D',
    },
    rank2: {
      border: '#CAD5E4',
      badgeBg: '#EEF3FA',
      badgeText: '#4C617C',
      rankText: '#4C617C',
      cardBg: '#F7FAFF',
      stripeBg: '#E5EDF8',
      shadow: '#9BB3CC',
    },
    rank3: {
      border: '#E7C6AA',
      badgeBg: '#FFF0E4',
      badgeText: '#99540F',
      rankText: '#99540F',
      cardBg: '#FFF9F4',
      stripeBg: '#FCE3D0',
      shadow: '#D49B6C',
    },
    self: {
      border: '#78C9DE',
    },
    premium: {
      badgeBg: '#FFF3D6',
      badgeBorder: '#E7CB62',
      icon: '#B67B00',
      rowIcon: '#C79000',
    },
    skeleton: {
      border: '#E4EAF2',
      rowBg: '#FFFFFF',
      rank: '#DEE6F2',
      badge: '#E1E8F4',
      textMain: '#DEE6F2',
      textSub: '#E6EDF8',
      value: '#D9F2E5',
    },
  },
  profileStat: {
    netWorthBg: '#DDF8FF',
    netWorthBorder: '#89DEEF',
    netWorthLabel: '#146A82',
    balanceBg: '#EEF6FA',
    balanceBorder: '#D0E5EE',
    biggestWinBg: '#FDF3E0',
    biggestWinBorder: '#F5D59A',
    biggestWinLabel: '#8A5B00',
    biggestWinValue: '#553600',
    logoutBorder: '#FECACA',
    statusActiveBg: '#DFF7FE',
    statusActiveBorder: '#82DAEF',
    statusActiveText: '#007FA2',
    statusPendingBg: '#FFF5D9',
    statusPendingBorder: '#F7D27B',
    statusPendingText: '#8A5B00',
    statusRejectedBg: '#FEE2E2',
    statusRejectedBorder: '#FCA5A5',
    statusFinalizedBg: '#E7F8F0',
    statusFinalizedBorder: '#A5E2C2',
  },
};

const darkTheme: typeof lightTheme = {
  pageBg: AppThemeDark.pageBg,
  surface: AppThemeDark.surface,
  surfaceMuted: AppThemeDark.surfaceMuted,
  surfaceSoft: AppThemeDark.surfaceSoft,
  border: AppThemeDark.border,
  borderSoft: AppThemeDark.borderSoft,
  borderMuted: AppThemeDark.borderMuted,
  textPrimary: AppThemeDark.textPrimary,
  textSecondary: AppThemeDark.textSecondary,
  textMuted: AppThemeDark.textMuted,
  link: AppThemeDark.link,
  linkPressed: AppThemeDark.linkPressed,
  accent: AppThemeDark.accent,
  accentPressed: AppThemeDark.accentPressed,
  accentSoft: AppThemeDark.accentSoft,
  accentBorder: AppThemeDark.accentBorder,
  info: AppThemeDark.info,
  warning: AppThemeDark.warning,
  success: AppThemeDark.success,
  danger: AppThemeDark.danger,
  hint: AppThemeDark.hint,
  hintBg: AppThemeDark.hintBg,
  hintBorder: AppThemeDark.hintBorder,
  outcomeYes: AppThemeDark.outcomeYes,
  outcomeYesSoft: AppThemeDark.outcomeYesSoft,
  outcomeNo: AppThemeDark.outcomeNo,
  outcomeNoSoft: AppThemeDark.outcomeNoSoft,
  secondary: AppThemeDark.secondary,
  secondaryPressed: AppThemeDark.secondaryPressed,
  secondarySoft: AppThemeDark.secondarySoft,
  secondaryContainer: AppThemeDark.secondaryContainer,
  onSecondaryContainer: AppThemeDark.onSecondaryContainer,
  tertiary: AppThemeDark.tertiary,
  tertiaryPressed: AppThemeDark.tertiaryPressed,
  tertiarySoft: AppThemeDark.tertiarySoft,
  tertiaryContainer: AppThemeDark.tertiaryContainer,
  onTertiaryContainer: AppThemeDark.onTertiaryContainer,
  primaryContainer: AppThemeDark.primaryContainer,
  onPrimaryContainer: AppThemeDark.onPrimaryContainer,
  createMarket: AppThemeDark.createMarket,
  leaderboard: AppThemeDark.leaderboard,
  profileStat: {
    netWorthBg: '#0D2A33',
    netWorthBorder: '#1A5C6E',
    netWorthLabel: '#7AD9ED',
    balanceBg: '#1A2028',
    balanceBorder: '#2A3441',
    biggestWinBg: '#2A1F0B',
    biggestWinBorder: '#713F12',
    biggestWinLabel: '#FBBF24',
    biggestWinValue: '#FDE68A',
    logoutBorder: '#7F1D1D',
    statusActiveBg: '#0D2A33',
    statusActiveBorder: '#1A5C6E',
    statusActiveText: '#7AD9ED',
    statusPendingBg: '#2A1F0B',
    statusPendingBorder: '#713F12',
    statusPendingText: '#FBBF24',
    statusRejectedBg: '#2A0B0B',
    statusRejectedBorder: '#7F1D1D',
    statusFinalizedBg: '#0B2A1A',
    statusFinalizedBorder: '#1A5C3A',
  },
};

function currentColors(): typeof lightTheme {
  return activeTheme === 'dark' ? darkTheme : lightTheme;
}

export const UI_COLORS = new Proxy<typeof lightTheme>({} as typeof lightTheme, {
  get(_target, key: string) {
    const colors = currentColors();
    return (colors as Record<string, unknown>)[key];
  },
});

export function useUITheme(): typeof UI_COLORS {
  const [, forceUpdate] = React.useState(0);
  React.useEffect(() => {
    const fn = () => forceUpdate(n => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return UI_COLORS;
}

export const UI_TYPE_SCALE = {
  leaderboard: {
    title: 22,
    subtitle: 12,
    status: 11,
    columnHeader: 10,
    rowMeta: 11,
    rowName: 13,
    rowValue: 12,
  },
  marketDetails: {
    sectionTitle: 16,
    commentMeta: 11,
    commentBadge: 10,
    commentBody: 13,
    helper: 12,
  },
};

/** MD3 shape tokens (border-radius) */
export const MD3_SHAPE = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 28,
  full: 9999,
} as const;

/** MD3 elevation tokens (iOS shadow mapping) */
export const MD3_ELEVATION = {
  level0: {},
  level1: {
    shadowColor: '#191C1D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  level2: {
    shadowColor: '#191C1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
  },
  level3: {
    shadowColor: '#191C1D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 6,
  },
  level4: {
    shadowColor: '#191C1D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 8,
  },
  level5: {
    shadowColor: '#191C1D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

export const UI_SHADOWS = {
  soft: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  lift: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  fab: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const UI_FONTS = {
  body: 'InterTight_400Regular',
  bodyBold: 'InterTight_700Bold',
  heading: 'SpaceGrotesk_700Bold',
  headingRegular: 'SpaceGrotesk_400Regular',
  mono: 'JetBrainsMono_400Regular',
  monoBold: 'JetBrainsMono_700Bold',
};
