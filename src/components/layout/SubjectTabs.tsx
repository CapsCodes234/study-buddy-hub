/**
 * SubjectTabs Component
 * Navigation tabs for subject subpages with theme-aware styling
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BookOpen, FileText, Target, Calculator, Atom, Cpu } from 'lucide-react';
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

// Subject icons mapping
const SUBJECT_ICONS: Record<string, React.ElementType> = {
  math: Calculator,
  physics: Atom,
  it: Cpu,
};

export function SubjectTabs({ subjectId, className }: SubjectTabsProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentTheme, isSubjectPage } = useSubjectTheme();

  const currentTab = tabs.find(tab => {
    if (tab.id === 'overview') {
      return location.pathname === `/${subjectId}` || location.pathname === `/${subjectId}/`;
    }
    return location.pathname === `/${subjectId}${tab.href}`;
  });

  const SubjectIcon = SUBJECT_ICONS[subjectId] || BookOpen;
  const theme = SUBJECT_THEMES[subjectId];

  return (
    <div className={cn('space-y-0', className)}>
      {/* Header accent strip - always visible on subject pages */}
      {isSubjectPage && (
        <div 
          className="h-1 w-full rounded-t-lg subject-accent-strip"
          style={{ 
            background: `linear-gradient(90deg, hsl(var(--subject-primary)), hsl(var(--subject-accent)))` 
          }}
        />
      )}
      
      <div
        className={cn(
          'sticky top-14 z-20 -mx-4 px-4 backdrop-blur flex items-center gap-1 border-b',
          isSubjectPage 
            ? 'bg-[hsl(var(--subject-bg)/0.95)] border-[hsl(var(--subject-border))]'
            : 'bg-background/95 border-border'
        )}
      >
        {/* Subject Icon Badge */}
        {isSubjectPage && theme && (
          <div 
            className="flex items-center justify-center w-8 h-8 rounded-lg mr-2 shrink-0"
            style={{ backgroundColor: `hsl(var(--subject-primary) / 0.15)` }}
          >
            <SubjectIcon 
              className="h-4 w-4" 
              style={{ color: `hsl(var(--subject-primary))` }}
            />
          </div>
        )}
        
        {tabs.map((tab) => {
          const isActive = currentTab?.id === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(`/${subjectId}${tab.href}`)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2',
                isActive && isSubjectPage
                  ? 'border-[hsl(var(--subject-primary))]'
                  : isActive
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/30'
              )}
              style={isActive && isSubjectPage ? { 
                color: `hsl(var(--subject-primary))` 
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
