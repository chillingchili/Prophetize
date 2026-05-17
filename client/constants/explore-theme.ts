import { UI_COLORS } from './ui-tokens';

function currentColors() {
  return {
    pageBg: UI_COLORS.pageBg,
    sectionDivider: UI_COLORS.surfaceMuted,
    headerBorder: UI_COLORS.borderMuted,
    titleText: UI_COLORS.textPrimary,
    secondaryText: UI_COLORS.textSecondary,
    linkText: UI_COLORS.link,
    emptyIcon: UI_COLORS.textMuted,
    searchHint: UI_COLORS.hint,
    searchHintBg: UI_COLORS.hintBg,
    searchHintBorder: UI_COLORS.hintBorder,
  };
}

export const ExploreTheme = new Proxy<ReturnType<typeof currentColors>>(
  {} as ReturnType<typeof currentColors>,
  {
    get(_target, key: string) {
      return currentColors()[key as keyof ReturnType<typeof currentColors>];
    },
  }
);
