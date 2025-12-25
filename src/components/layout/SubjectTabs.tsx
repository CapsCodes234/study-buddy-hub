import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BookOpen, FileText, Target } from 'lucide-react';

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

  const currentTab = tabs.find(tab => {
    if (tab.id === 'overview') {
      return location.pathname === `/${subjectId}` || location.pathname === `/${subjectId}/`;
    }
    return location.pathname === `/${subjectId}${tab.href}`;
  });

  return (
    <div
      className={cn(
        'sticky top-14 z-20 -mx-4 px-4 bg-background/95 backdrop-blur flex items-center gap-1 border-b',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = currentTab?.id === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(`/${subjectId}${tab.href}`)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2',
              isActive
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/30'
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
