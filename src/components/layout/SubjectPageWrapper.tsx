/**
 * SubjectPageWrapper Component
 * 
 * Wraps subject pages with themed background patterns and visual elements.
 * Provides consistent subject-specific styling across all subject subpages.
 */

import { ReactNode } from 'react';
import { Calculator, Atom, Cpu, LucideIcon } from 'lucide-react';
import { useSubjectTheme } from '@/components/providers/SubjectThemeProvider';
import { SUBJECT_THEMES } from '@/lib/subjectThemes';
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
  const { isSubjectPage, currentTheme } = useSubjectTheme();
  const theme = SUBJECT_THEMES[subjectId];
  const SubjectIcon = SUBJECT_ICONS[subjectId] || Calculator;

  return (
    <div className={cn('relative min-h-[calc(100vh-4rem)]', className)}>
      {/* Background pattern layer */}
      {isSubjectPage && (
        <div 
          className="subject-bg fixed inset-0 pointer-events-none z-0"
          aria-hidden="true"
        />
      )}

      {/* Content layer */}
      <div className="relative z-10 space-y-6 animate-fade-in">
        {/* Page Header with Subject Icon */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* Large Subject Icon */}
            {isSubjectPage && theme && (
              <div 
                className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl shrink-0 subject-icon-badge"
                style={{ 
                  backgroundColor: `hsl(var(--subject-primary) / 0.15)`,
                  border: `2px solid hsl(var(--subject-primary) / 0.3)`
                }}
              >
                <SubjectIcon 
                  className="h-6 w-6 sm:h-7 sm:w-7" 
                  style={{ color: `hsl(var(--subject-primary))` }}
                />
              </div>
            )}
            <div>
              <h1 
                className="text-2xl sm:text-3xl font-bold"
                style={isSubjectPage ? { color: `hsl(var(--subject-text))` } : undefined}
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
