import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { _setTheme } from '@/constants/ui-tokens';

type ColorScheme = 'light' | 'dark';

type ThemeContextType = {
  colorScheme: ColorScheme;
  isDark: boolean;
  toggleDarkMode: (enabled: boolean) => Promise<void>;
  isLoading: boolean;
};

const THEME_KEY = '@app_theme_dark_mode';

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        const dark = stored !== null ? stored === 'true' : systemScheme === 'dark';
        _setTheme(dark ? 'dark' : 'light');
        setIsDark(dark);
      } catch {
        const dark = systemScheme === 'dark';
        _setTheme(dark ? 'dark' : 'light');
        setIsDark(dark);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const toggleDarkMode = useCallback(async (enabled: boolean) => {
    _setTheme(enabled ? 'dark' : 'light');
    setIsDark(enabled);
    try {
      await AsyncStorage.setItem(THEME_KEY, String(enabled));
    } catch {
      // ignore
    }
  }, []);

  const colorScheme: ColorScheme = isDark === null
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : isDark ? 'dark' : 'light';

  useEffect(() => {
    _setTheme(colorScheme);
  }, [colorScheme]);

  return (
    <ThemeContext.Provider value={{ colorScheme, isDark: colorScheme === 'dark', toggleDarkMode, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
