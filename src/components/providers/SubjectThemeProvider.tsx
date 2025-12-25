/**
 * SubjectThemeProvider
 * 
 * Provides subject-specific theming that layers on top of the global theme.
 * Automatically detects the current subject from the route and applies
 * corresponding theme colors via CSS custom properties.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { SUBJECT_THEMES, SubjectTheme, hasSubjectTheme } from '@/lib/subjectThemes';

interface SubjectThemeContextType {
  currentTheme: SubjectTheme | null;
  isSubjectPage: boolean;
  themeEnabled: boolean;
  toggleTheme: () => void;
  subjectId: string | null;
}

const SubjectThemeContext = createContext<SubjectThemeContextType>({
  currentTheme: null,
  isSubjectPage: false,
  themeEnabled: true,
  toggleTheme: () => {},
  subjectId: null,
});

const STORAGE_KEY = 'subject-theme-enabled';

export function SubjectThemeProvider({ children }: { children: React.ReactNode }) {
  const { subjectId } = useParams<{ subjectId: string }>();
  const location = useLocation();
  
  // Load theme preference from localStorage
  const [themeEnabled, setThemeEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== 'false'; // Default: true
  });

  const isSubjectPage = !!subjectId && hasSubjectTheme(subjectId);
  const currentTheme = isSubjectPage && themeEnabled ? SUBJECT_THEMES[subjectId] : null;

  // Apply theme CSS variables to document root
  const applyTheme = useCallback((theme: SubjectTheme | null) => {
    const root = document.documentElement;
    
    if (!theme) {
      // Reset to default theme
      root.removeAttribute('data-subject-theme');
      root.style.removeProperty('--subject-primary');
      root.style.removeProperty('--subject-accent');
      root.style.removeProperty('--subject-bg');
      root.style.removeProperty('--subject-card');
      root.style.removeProperty('--subject-text');
      root.style.removeProperty('--subject-border');
      return;
    }

    const isDark = root.classList.contains('dark');
    const colors = isDark ? theme.colors.dark : theme.colors.light;
    
    // Set CSS custom properties with HSL values
    root.style.setProperty('--subject-primary', colors.primary);
    root.style.setProperty('--subject-accent', colors.accent);
    root.style.setProperty('--subject-bg', colors.background);
    root.style.setProperty('--subject-card', colors.cardBg);
    root.style.setProperty('--subject-text', colors.text);
    root.style.setProperty('--subject-border', colors.border);
    
    // Add data attribute for CSS targeting
    root.setAttribute('data-subject-theme', theme.id);
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    applyTheme(currentTheme);

    return () => {
      // Cleanup on unmount
      const root = document.documentElement;
      root.removeAttribute('data-subject-theme');
    };
  }, [currentTheme, location.pathname, applyTheme]);

  // Observe dark mode changes and reapply theme
  useEffect(() => {
    if (!currentTheme) return;

    const root = document.documentElement;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          applyTheme(currentTheme);
        }
      });
    });
    
    observer.observe(root, { attributes: true });
    
    return () => observer.disconnect();
  }, [currentTheme, applyTheme]);

  const toggleTheme = useCallback(() => {
    setThemeEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY, String(newValue));
      return newValue;
    });
  }, []);

  return (
    <SubjectThemeContext.Provider 
      value={{ 
        currentTheme, 
        isSubjectPage, 
        themeEnabled, 
        toggleTheme,
        subjectId: subjectId || null,
      }}
    >
      {children}
    </SubjectThemeContext.Provider>
  );
}

export const useSubjectTheme = () => useContext(SubjectThemeContext);
