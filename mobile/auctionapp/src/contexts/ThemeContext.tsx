import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../../app/theme';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  card: string;
  inputBg: string;
  sectionBg: string;
}

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  themeColors: ThemeColors;
  isLoading: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

// Create default theme colors for initial render
const defaultThemeColors: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  card: '#FFFFFF',
  inputBg: '#F8FAFC',
  sectionBg: '#FFFFFF',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Get theme colors based on dark mode
const getThemeColors = (isDark: boolean): ThemeColors => {
  if (isDark) {
    return {
      background: theme.gray900,
      surface: theme.gray800,
      text: theme.white,
      textSecondary: theme.gray300,
      border: theme.gray700,
      card: theme.gray800,
      inputBg: theme.gray800,
      sectionBg: theme.gray800,
    };
  }
  return {
    background: theme.gray50,
    surface: theme.white,
    text: theme.gray900,
    textSecondary: theme.gray600,
    border: theme.gray200,
    card: theme.white,
    inputBg: theme.gray50,
    sectionBg: theme.white,
  };
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initialSystemScheme = Appearance.getColorScheme();
  const initialIsDarkMode = initialSystemScheme === 'dark';

  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(initialSystemScheme);
  const [isDarkMode, setIsDarkMode] = useState(initialIsDarkMode);
  const [themeColors, setThemeColors] = useState<ThemeColors>(getThemeColors(initialIsDarkMode));

  // Load theme preference on mount
  useEffect(() => {
    loadTheme();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  // Update theme colors when dark mode changes
  useEffect(() => {
    const actualDarkMode = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
    setIsDarkMode(actualDarkMode);
    setThemeColors(getThemeColors(actualDarkMode));
  }, [themeMode, systemColorScheme]);

  const loadTheme = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('themeMode');
      if (savedMode && (savedMode === 'system' || savedMode === 'light' || savedMode === 'dark')) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, []);

  // Ensure value is always defined with all properties
  const value: ThemeContextType = useMemo(() => ({
    isDarkMode,
    themeMode,
    themeColors: themeColors || defaultThemeColors, // Fallback to default
    isLoading,
    setThemeMode,
  }), [isDarkMode, themeMode, themeColors, isLoading]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // More detailed error message
    throw new Error(
      'useTheme must be used within a ThemeProvider. ' +
      'Make sure your component tree is wrapped with <ThemeProvider>.</ThemeProvider>'
    );
  }
  return context;
}

