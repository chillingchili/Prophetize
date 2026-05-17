import { useTheme } from '@/context/ThemeContext';
import { AppThemeLight, AppThemeDark, type AppTheme } from '@/constants/app-theme';

export function useAppTheme(): AppTheme {
  const { colorScheme } = useTheme();
  return colorScheme === 'dark' ? AppThemeDark : AppThemeLight;
}

export function useAppColorScheme(): 'light' | 'dark' {
  const { colorScheme } = useTheme();
  return colorScheme;
}
