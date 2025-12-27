/**
 * SubjectPageWrapper Component
 * 
 * Wraps subject pages with themed background patterns and visual elements.
 * Provides consistent subject-specific styling across all subject subpages.
 */

import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Atom, Cpu, LucideIcon, ArrowLeft } from 'lucide-react';
import { useSubjectTheme } from '@/components/providers/SubjectThemeProvider';
import { SUBJECT_THEMES } from '@/lib/subjectThemes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SubjectPageWrapperProps {
  children: ReactNode;
  subjectId: string;
  title: string;
  subtitle?: string;
  className?: string;
}

// Subject icons mapping
const SUBJECT_ICONS: Record<string, LucideIcon> = {
  math: Calculator,
  physics: Atom,
  it: Cpu,
};

export function SubjectPageWrapper({ 
  children, 
  subjectId, 
  title,
  subtitle,
  className 
}: SubjectPageWrapperProps) {
  const navigate = useNavigate();
  const { isSubjectPage, currentTheme } = useSubjectTheme();
  const theme = SUBJECT_THEMES[subjectId];
  const SubjectIcon = SUBJECT_ICONS[subjectId] || Calculator;

  // Fallback: if provider says no but we have a valid theme, show anyway
  const shouldShowTheme = isSubjectPage || (!!theme && !!subjectId);
  
  // Get direct colors for fallback (in case CSS vars aren't set yet)
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const themeColors = theme ? (isDark ? theme.colors.dark : theme.colors.light) : null;

  return (
    <div className={cn('relative min-h-[calc(100vh-4rem)]', className)}>
      {/* Background pattern layer */}
      {shouldShowTheme && (
        <div 
          className="subject-bg fixed inset-0 pointer-events-none z-0"
          aria-hidden="true"
        />
      )}

      {/* Content layer */}
      <div className="relative z-10 space-y-6 animate-fade-in">
        {/* Page Header with Back Button and Subject Icon */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/${subjectId}`)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-start gap-3 flex-1">
            {/* Large Subject Icon */}
            {shouldShowTheme && themeColors && (
              <div 
                className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl shrink-0 subject-icon-badge"
                style={{ 
                  backgroundColor: `hsl(${themeColors.primary} / 0.15)`,
                  border: `2px solid hsl(${themeColors.primary} / 0.3)`
                }}
              >
                <SubjectIcon 
                  className="h-6 w-6 sm:h-7 sm:w-7" 
                  style={{ color: `hsl(${themeColors.primary})` }}
                />
              </div>
            )}
            <div>
              <h1 
                className="text-2xl sm:text-3xl font-bold"
                style={shouldShowTheme && themeColors ? { color: `hsl(${themeColors.text})` } : undefined}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="text-muted-foreground mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

export default SubjectPageWrapper;