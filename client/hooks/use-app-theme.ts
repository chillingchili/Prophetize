import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppThemeLight, AppThemeDark, type AppTheme } from '@/constants/app-theme';

export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? AppThemeDark : AppThemeLight;
}

export function useAppColorScheme(): 'light' | 'dark' {
  const scheme = useColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}
