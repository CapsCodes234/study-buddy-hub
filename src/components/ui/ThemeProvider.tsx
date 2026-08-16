import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeProviderContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
}

const STORAGE_KEY = 'study-tracker:theme';
const MOTION_KEY = 'study-tracker:reduced-motion';
const CONTRAST_KEY = 'study-tracker:high-contrast';
const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: '#f6f7f9',
  dark: '#090e1a',
};

const ThemeProviderContext = createContext<ThemeProviderContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  if (typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getSystemReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getStoredTheme(defaultTheme: Theme): Theme {
  if (typeof window === 'undefined') return defaultTheme;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system'
      ? stored
      : defaultTheme;
  } catch {
    return defaultTheme;
  }
}

function getStoredBoolean(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;

  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : stored === 'true';
  } catch {
    return fallback;
  }
}

function persistPreference(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Appearance preferences remain usable for the current session.
  }
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return getStoredTheme(defaultTheme);
  });

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    return getStoredBoolean(MOTION_KEY, getSystemReducedMotion());
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return getStoredBoolean(CONTRAST_KEY, false);
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (theme === 'system') return getSystemTheme();
    return theme;
  });

  // Update resolved theme when theme changes or system preference changes
  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === 'system') {
        setResolvedTheme(getSystemTheme());
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolvedTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateResolvedTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark', 'theme-high-contrast');
    
    // Add resolved theme
    root.classList.add(resolvedTheme);
    
    // Add high contrast if enabled
    if (highContrast) {
      root.classList.add('theme-high-contrast');
    }
    
    // Set color-scheme for native elements
    root.style.colorScheme = resolvedTheme;

    const themeColor = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    themeColor?.setAttribute('content', THEME_COLOR[resolvedTheme]);
  }, [resolvedTheme, highContrast]);

  // Apply reduced motion
  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [reducedMotion]);

  // Listen for system reduced motion changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      let storedPreference: string | null = null;
      try {
        storedPreference = localStorage.getItem(MOTION_KEY);
      } catch {
        // Follow the system preference when storage is unavailable.
      }
      // Only update if user hasn't set a manual preference
      if (storedPreference === null) {
        setReducedMotionState(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    persistPreference(STORAGE_KEY, newTheme);
  }, []);

  const setReducedMotion = useCallback((enabled: boolean) => {
    setReducedMotionState(enabled);
    persistPreference(MOTION_KEY, String(enabled));
  }, []);

  const setHighContrast = useCallback((enabled: boolean) => {
    setHighContrastState(enabled);
    persistPreference(CONTRAST_KEY, String(enabled));
  }, []);

  return (
    <ThemeProviderContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        reducedMotion,
        setReducedMotion,
        highContrast,
        setHighContrast,
      }}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
