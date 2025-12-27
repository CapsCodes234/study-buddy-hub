/**
 * SubjectTabs Component
 * Navigation tabs for subject subpages with theme-aware styling
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BookOpen, FileText, Target } from 'lucide-react';
import { useSubjectTheme } from '@/components/providers/SubjectThemeProvider';
import { SUBJECT_THEMES } from '@/lib/subjectThemes';

interface SubjectTabsProps {
  subjectId: string;
  className?: string;
}

const tabs = [
  { id: 'overview', label: 'Overview', href: '', icon: BookOpen },
  { id: 'syllabus', label: 'Syllabus', href: '/syllabus', icon: Target },
  { id: 'papers', label: 'Papers', href: '/papers', icon: FileText },
];

export function SubjectTabs({ subjectId, className }: SubjectTabsProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSubjectPage, currentTheme } = useSubjectTheme();
  
  // Get direct colors for fallback (in case CSS vars aren't set yet)
  const theme = SUBJECT_THEMES[subjectId];
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const themeColors = theme ? (isDark ? theme.colors.dark : theme.colors.light) : null;
  const shouldShowTheme = isSubjectPage || !!theme;

  const currentTab = tabs.find(tab => {
    if (tab.id === 'overview') {
      return location.pathname === `/${subjectId}` || location.pathname === `/${subjectId}/`;
    }
    return location.pathname === `/${subjectId}${tab.href}`;
  });

  return (
    <div className={cn('space-y-0', className)}>
      {/* Header accent strip - visible on subject pages */}
      {shouldShowTheme && themeColors && (
        <div 
          className="h-1 w-full rounded-t-lg"
          style={{ 
            background: `linear-gradient(90deg, hsl(${themeColors.primary}), hsl(${themeColors.accent}))` 
          }}
        />
      )}
      
      <div
        className={cn(
          'sticky top-14 z-20 -mx-4 px-4 backdrop-blur-sm flex items-center gap-1 border-b',
          shouldShowTheme && themeColors
            ? 'border-border/50'
            : 'bg-background/95 border-border'
        )}
        style={shouldShowTheme && themeColors ? {
          backgroundColor: `hsl(${themeColors.background} / 0.95)`
        } : undefined}
      >
        {tabs.map((tab) => {
          const isActive = currentTab?.id === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(`/${subjectId}${tab.href}`)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
                isActive && shouldShowTheme && themeColors
                  ? ''
                  : isActive
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/30'
              )}
              style={isActive && shouldShowTheme && themeColors ? { 
                color: `hsl(${themeColors.primary})`,
                borderBottomColor: `hsl(${themeColors.primary})`
              } : undefined}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}