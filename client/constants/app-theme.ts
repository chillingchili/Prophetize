/**
 * Unified light/dark theme system for Prophetize.
 * Single source of truth for all design tokens.
 *
 * Prefer importing `useAppTheme()` at runtime rather than static tokens.
 * `UI_COLORS` is re-exported from `ui-tokens.ts` for backward compatibility only.
 */

export interface AppTheme {
  pageBg: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  surfaceSoft: string;
  border: string;
  borderSoft: string;
  borderMuted: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  link: string;
  linkPressed: string;
  accent: string;
  accentPressed: string;
  accentSoft: string;
  accentBorder: string;
  info: string;
  warning: string;
  success: string;
  danger: string;
  hint: string;
  hintBg: string;
  hintBorder: string;
  outcomeYes: string;
  outcomeYesSoft: string;
  outcomeNo: string;
  outcomeNoSoft: string;
  createMarket: {
    cardBg: string;
    cardBorder: string;
    fieldBg: string;
    fieldBorder: string;
    fieldBorderError: string;
    chipBg: string;
    chipBorder: string;
    chipBgActive: string;
    chipBorderActive: string;
    chipTextMuted: string;
  };
  leaderboard: {
    rank1: {
      border: string;
      badgeBg: string;
      badgeText: string;
      rankText: string;
      cardBg: string;
      stripeBg: string;
      shadow: string;
    };
    rank2: {
      border: string;
      badgeBg: string;
      badgeText: string;
      rankText: string;
      cardBg: string;
      stripeBg: string;
      shadow: string;
    };
    rank3: {
      border: string;
      badgeBg: string;
      badgeText: string;
      rankText: string;
      cardBg: string;
      stripeBg: string;
      shadow: string;
    };
    self: {
      border: string;
    };
    premium: {
      badgeBg: string;
      badgeBorder: string;
      icon: string;
      rowIcon: string;
    };
    skeleton: {
      border: string;
      rowBg: string;
      rank: string;
      badge: string;
      textMain: string;
      textSub: string;
      value: string;
    };
  };
  skeleton: {
    base: string;
    shimmer: string;
  };
  shadows: {
    soft: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    lift: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

export const AppThemeLight: AppTheme = {
  pageBg: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#EAF6FB',
  surfaceSoft: '#F3FAFD',
  border: '#E2E8F0',
  borderSoft: '#E1F1F6',
  borderMuted: '#DDEDF4',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  link: '#0891B2',
  linkPressed: '#0E7490',
  accent: '#0891B2',
  accentPressed: '#0E7490',
  accentSoft: 'rgba(8, 145, 178, 0.12)',
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
  createMarket: {
    cardBg: '#FFFFFF',
    cardBorder: '#DDEDF4',
    fieldBg: '#F3FAFD',
    fieldBorder: '#D5EAF1',
    fieldBorderError: '#EF4444',
    chipBg: '#FFFFFF',
    chipBorder: '#D5EAF1',
    chipBgActive: 'rgba(8, 145, 178, 0.12)',
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
  skeleton: {
    base: '#E2E8F0',
    shimmer: '#F1F5F9',
  },
  shadows: {
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
  },
};

export const AppThemeDark: AppTheme = {
  pageBg: '#0B0E11',
  surface: '#151A21',
  surfaceElevated: '#1E252F',
  surfaceMuted: '#1A2028',
  surfaceSoft: '#1E252F',
  border: '#2A3441',
  borderSoft: '#232D38',
  borderMuted: '#1F2933',
  textPrimary: '#F4F6F8',
  textSecondary: '#9AA5B1',
  textMuted: '#5E6B7A',
  link: '#2BB5D6',
  linkPressed: '#1F9CB9',
  accent: '#2BB5D6',
  accentPressed: '#1F9CB9',
  accentSoft: 'rgba(43, 181, 214, 0.16)',
  accentBorder: '#1F7A8C',
  info: '#38BDF8',
  warning: '#FBBF24',
  success: '#05C46B',
  danger: '#EF4444',
  hint: '#F59E0B',
  hintBg: '#2A1F0B',
  hintBorder: '#713F12',
  outcomeYes: '#05C46B',
  outcomeYesSoft: 'rgba(5, 196, 107, 0.16)',
  outcomeNo: '#EF4444',
  outcomeNoSoft: 'rgba(239, 68, 68, 0.16)',
  createMarket: {
    cardBg: '#151A21',
    cardBorder: '#2A3441',
    fieldBg: '#1E252F',
    fieldBorder: '#2A3441',
    fieldBorderError: '#EF4444',
    chipBg: '#151A21',
    chipBorder: '#2A3441',
    chipBgActive: 'rgba(43, 181, 214, 0.16)',
    chipBorderActive: '#1F7A8C',
    chipTextMuted: '#5E6B7A',
  },
  leaderboard: {
    rank1: {
      border: '#BFA030',
      badgeBg: '#3D3310',
      badgeText: '#E7CB62',
      rankText: '#E7CB62',
      cardBg: '#1E1B0F',
      stripeBg: '#3D3310',
      shadow: '#BFA030',
    },
    rank2: {
      border: '#7A8BA3',
      badgeBg: '#1E252F',
      badgeText: '#A0B4CC',
      rankText: '#A0B4CC',
      cardBg: '#161B22',
      stripeBg: '#232D38',
      shadow: '#7A8BA3',
    },
    rank3: {
      border: '#A67C52',
      badgeBg: '#2A1F14',
      badgeText: '#D4A574',
      rankText: '#D4A574',
      cardBg: '#1E1812',
      stripeBg: '#3D2E1F',
      shadow: '#A67C52',
    },
    self: {
      border: '#1F7A8C',
    },
    premium: {
      badgeBg: '#3D3310',
      badgeBorder: '#BFA030',
      icon: '#E7CB62',
      rowIcon: '#D4A11D',
    },
    skeleton: {
      border: '#232D38',
      rowBg: '#151A21',
      rank: '#1E252F',
      badge: '#232D38',
      textMain: '#1E252F',
      textSub: '#232D38',
      value: '#1A2E22',
    },
  },
  skeleton: {
    base: '#1E252F',
    shimmer: '#2A3441',
  },
  shadows: {
    soft: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 2,
    },
    lift: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 12,
      elevation: 4,
    },
  },
};
