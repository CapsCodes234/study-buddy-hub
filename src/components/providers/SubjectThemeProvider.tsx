/**
 * SubjectThemeProvider
 * 
 * Provides subject-specific theming that layers on top of the global theme.
 * Automatically detects the current subject from the route and applies
 * corresponding theme colors via CSS custom properties.
 */

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { SUBJECT_THEMES, SubjectTheme, hasSubjectTheme } from '@/lib/subjectThemes';

interface ThemeOverride {
  primary?: string;
  accent?: string;
}

interface ThemeOverrides {
  [subjectId: string]: ThemeOverride;
}

interface SubjectThemeContextType {
  currentTheme: SubjectTheme | null;
  isSubjectPage: boolean;
  themeEnabled: boolean;
  toggleTheme: () => void;
  subjectId: string | null;
  overrides: ThemeOverrides;
}

const SubjectThemeContext = createContext<SubjectThemeContextType>({
  currentTheme: null,
  isSubjectPage: false,
  themeEnabled: true,
  toggleTheme: () => {},
  subjectId: null,
  overrides: {},
});

const STORAGE_KEY = 'subject-theme-enabled';
const THEME_OVERRIDES_KEY = 'subject-theme-overrides';

function loadThemeOverrides(): ThemeOverrides {
  try {
    const stored = localStorage.getItem(THEME_OVERRIDES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Apply theme CSS variables to document root
 */
function applyThemeToDOM(theme: SubjectTheme | null, themeOverrides: ThemeOverrides) {
  const root = document.documentElement;
  
  if (!theme) {
    // Reset to default theme - clear all subject-specific CSS vars
    root.removeAttribute('data-subject-theme');
    root.style.removeProperty('--subject-primary');
    root.style.removeProperty('--subject-accent');
    root.style.removeProperty('--subject-bg');
    root.style.removeProperty('--subject-card');
    root.style.removeProperty('--subject-text');
    root.style.removeProperty('--subject-border');
    console.debug('[SubjectTheme] Cleared theme');
    return;
  }

  const isDark = root.classList.contains('dark');
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  
  // Get overrides for this subject
  const subjectOverrides = themeOverrides[theme.id] || {};
  
  // Set CSS custom properties with HSL values, applying overrides
  const primary = subjectOverrides.primary || colors.primary;
  const accent = subjectOverrides.accent || colors.accent;
  
  root.style.setProperty('--subject-primary', primary);
  root.style.setProperty('--subject-accent', accent);
  root.style.setProperty('--subject-bg', colors.background);
  root.style.setProperty('--subject-card', colors.cardBg);
  root.style.setProperty('--subject-text', colors.text);
  root.style.setProperty('--subject-border', colors.border);
  
  // Add data attribute for CSS targeting
  root.setAttribute('data-subject-theme', theme.id);
  
  console.debug('[SubjectTheme] Applied:', theme.id, { primary, accent, isDark });
}

export function SubjectThemeProvider({ children }: { children: React.ReactNode }) {
  const { subjectId } = useParams<{ subjectId: string }>();
  const location = useLocation();
  const previousSubjectIdRef = useRef<string | undefined>(undefined);
  
  // Determine if we're on a valid subject page - computed FIRST for immediate use
  const isValidSubject = !!subjectId && hasSubjectTheme(subjectId);
  
  // Apply theme IMMEDIATELY on first render (synchronously)
  if (isValidSubject && typeof document !== 'undefined') {
    const root = document.documentElement;
    if (root.getAttribute('data-subject-theme') !== subjectId) {
      const storedEnabled = localStorage.getItem(STORAGE_KEY);
      if (storedEnabled !== 'false') {
        const overrides = loadThemeOverrides();
        applyThemeToDOM(SUBJECT_THEMES[subjectId], overrides);
      }
    }
  }
  
  // Load theme preference from localStorage
  const [themeEnabled, setThemeEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== 'false'; // Default: true
  });

  // Load overrides from localStorage
  const [overrides, setOverrides] = useState<ThemeOverrides>(() => loadThemeOverrides());

  // Listen for storage changes (when SubjectThemeSettings updates)
  useEffect(() => {
    const handleStorageChange = () => {
      setOverrides(loadThemeOverrides());
      const enabledStored = localStorage.getItem(STORAGE_KEY);
      setThemeEnabled(enabledStored !== 'false');
    };

    // Listen for custom event from settings
    window.addEventListener('subject-theme-updated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('subject-theme-updated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Determine if we're on a valid subject page
  const isSubjectPage = !!subjectId && hasSubjectTheme(subjectId);
  const currentTheme = isSubjectPage && themeEnabled ? SUBJECT_THEMES[subjectId] : null;

  // Apply theme when it changes - NO cleanup on route change within subjects
  useEffect(() => {
    applyThemeToDOM(currentTheme, overrides);
    previousSubjectIdRef.current = subjectId;
    
    // Only cleanup when component TRULY unmounts (not on re-render)
  }, [currentTheme, overrides, subjectId]);

  // Observe dark mode changes and reapply theme
  useEffect(() => {
    if (!currentTheme) return;

    const root = document.documentElement;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          applyThemeToDOM(currentTheme, overrides);
        }
      });
    });
    
    observer.observe(root, { attributes: true });
    
    return () => observer.disconnect();
  }, [currentTheme, overrides]);

  // Clear theme ONLY when navigating away from all subject pages
  useEffect(() => {
    if (!isSubjectPage && previousSubjectIdRef.current) {
      // We were on a subject page, now we're not - clear the theme
      applyThemeToDOM(null, {});
    }
  }, [isSubjectPage]);

  const toggleTheme = useCallback(() => {
    setThemeEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY, String(newValue));
      window.dispatchEvent(new CustomEvent('subject-theme-updated'));
      return newValue;
    });
  }, []);

  const value = useMemo(() => ({
    currentTheme, 
    isSubjectPage, 
    themeEnabled, 
    toggleTheme,
    subjectId: subjectId || null,
    overrides,
  }), [currentTheme, isSubjectPage, themeEnabled, toggleTheme, subjectId, overrides]);

  return (
    <SubjectThemeContext.Provider value={value}>
      {children}
    </SubjectThemeContext.Provider>
  );
}

export const useSubjectTheme = () => useContext(SubjectThemeContext);