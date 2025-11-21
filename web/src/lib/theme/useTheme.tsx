import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { injectCssVariables } from '@/lib/design-system/retro-design-system';

type ThemePreference = 'dark' | 'light' | 'system';
export type ThemeName = 'dark' | 'light' | 'kyu' | string;
type ThemeSelection = ThemePreference | ThemeName;

const STORAGE_KEY = 'straddle_theme';

interface ThemeContextValue {
  theme: ThemeName;
  preference: ThemePreference;
  systemTheme: ThemeName;
  setTheme: (theme: ThemePreference | ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getSystemTheme = (): ThemeName => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
};

const getStoredPreference = (): ThemeSelection | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light' || stored === 'system') {
    return stored;
  }
  if (stored) {
    return stored;
  }
  return null;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selection, setSelection] = useState<ThemeSelection>(() => getStoredPreference() ?? 'light');
  const [systemTheme, setSystemTheme] = useState<ThemeName>(() => getSystemTheme());

  const resolvedTheme = useMemo<ThemeName>(() => {
    return selection === 'system' ? systemTheme : selection;
  }, [selection, systemTheme]);

  useEffect(() => {
    injectCssVariables();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (event: MediaQueryListEvent | MediaQueryList): void => {
      setSystemTheme(event.matches ? 'light' : 'dark');
    };

    handler(media);

    media.addEventListener('change', handler as (event: MediaQueryListEvent) => void);
    return () => media.removeEventListener('change', handler as (event: MediaQueryListEvent) => void);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.setAttribute('data-theme', resolvedTheme);

    if (selection === 'system') {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, selection);
    }
  }, [resolvedTheme, selection]);

  const setTheme = (value: ThemePreference | ThemeName): void => {
    setSelection(value);
  };

  const toggleTheme = (): void => {
    setSelection((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const value: ThemeContextValue = {
    theme: resolvedTheme,
    preference: selection === 'dark' || selection === 'light' || selection === 'system' ? selection : 'system',
    systemTheme,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: getSystemTheme(),
      preference: 'system',
      systemTheme: getSystemTheme(),
      setTheme: () => undefined,
      toggleTheme: () => undefined,
    };
  }
  return ctx;
};
