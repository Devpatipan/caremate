import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { buildTheme, Theme } from './tokens';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  /** The resolved scheme actually in use ('light' | 'dark'). */
  scheme: 'light' | 'dark';
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialMode = 'system',
}: {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}) {
  const system = useColorScheme() ?? 'light';
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  const scheme: 'light' | 'dark' = mode === 'system' ? system : mode;
  const theme = useMemo(() => buildTheme(scheme), [scheme]);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const current = prev === 'system' ? system : prev;
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [system]);

  const value = useMemo(
    () => ({ theme, mode, scheme, setMode, toggle }),
    [theme, mode, scheme, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx.theme;
}

export function useThemeControls() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeControls must be used inside <ThemeProvider>');
  return ctx;
}
