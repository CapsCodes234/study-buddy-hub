/**
 * Header Component
 * Global navigation with streak counter, breadcrumbs, theme toggle,
 * and per-subject theming support
 */

import { memo, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, ChevronRight, Settings, Calculator, Cpu, Atom } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { StreakCounter } from '@/components/ui/StreakCounter';
import { useSubjectTheme } from '@/components/providers/SubjectThemeProvider';
import { cn } from '@/lib/utils';
import { StreakData } from '@/types/reminders';
import { Subject } from '@/types';

interface HeaderProps {
  subjects: Subject[];
  streakData: StreakData;
  className?: string;
}

// Subject icons mapping
const SUBJECT_ICONS: Record<string, React.ElementType> = {
  math: Calculator,
  mathematics: Calculator,
  physics: Atom,
  it: Cpu,
  'information technology': Cpu,
};

function getSubjectIcon(subjectId: string, subjectName: string): React.ElementType {
  const id = subjectId.toLowerCase();
  const name = subjectName.toLowerCase();
  
  return SUBJECT_ICONS[id] || SUBJECT_ICONS[name] || BookOpen;
}

export const Header = memo(function Header({ subjects, streakData, className }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentTheme, isSubjectPage } = useSubjectTheme();

  // Parse current route for breadcrumbs
  const breadcrumbs = useMemo(() => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);
    
    const crumbs: { label: string; href: string; icon?: React.ElementType }[] = [];
    
    if (parts.length === 0 || path === '/') {
      return [{ label: 'Dashboard', href: '/', icon: LayoutDashboard }];
    }

    // First part is usually a subject ID
    if (parts[0] && subjects.some(s => s.id === parts[0])) {
      const subject = subjects.find(s => s.id === parts[0])!;
      crumbs.push({
        label: subject.name,
        href: `/${subject.id}`,
        icon: getSubjectIcon(subject.id, subject.name),
      });

      // Second part is the subpage
      if (parts[1]) {
        const subpageLabels: Record<string, string> = {
          syllabus: 'Syllabus',
          papers: 'Past Papers',
          'past-papers': 'Past Papers',
        };
        crumbs.push({
          label: subpageLabels[parts[1]] || parts[1],
          href: `/${parts[0]}/${parts[1]}`,
        });
      }
    } else if (parts[0] === 'settings') {
      crumbs.push({ label: 'Settings', href: '/settings', icon: Settings });
    }

    return crumbs;
  }, [location.pathname, subjects]);

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className={cn(
      'sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300',
      isSubjectPage 
        ? 'bg-[hsl(var(--subject-bg)/0.85)] border-[hsl(var(--subject-border))]' 
        : 'bg-background/80 border-border',
      className
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
          >
            <div className={cn(
              'p-1.5 rounded-lg transition-colors',
              isSubjectPage 
                ? 'bg-[hsl(var(--subject-primary))]' 
                : 'bg-primary'
            )}>
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg hidden sm:inline">Study Buddy</span>
          </Link>

          {/* Main Navigation - Subject Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide mx-4">
            <Button
              variant={location.pathname === '/' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/')}
              className={cn(
                'gap-2 shrink-0',
                location.pathname === '/' && 'bg-primary text-primary-foreground'
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>

            {subjects.map((subject) => {
              const Icon = getSubjectIcon(subject.id, subject.name);
              const isSubjectActive = location.pathname.startsWith(`/${subject.id}`);
              const isThisSubjectThemed = currentTheme?.id === subject.id;
              
              return (
                <Button
                  key={subject.id}
                  variant={isSubjectActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate(`/${subject.id}`)}
                  className={cn(
                    'gap-2 shrink-0 transition-all duration-200 subject-button',
                    isSubjectActive && !isThisSubjectThemed && 'bg-primary text-primary-foreground'
                  )}
                  style={isSubjectActive && isThisSubjectThemed ? {
                    backgroundColor: 'hsl(var(--subject-primary))',
                    color: 'white',
                  } : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{subject.name}</span>
                  <span className="md:hidden">{subject.name.split(' ')[0]}</span>
                </Button>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Streak Counter */}
            <StreakCounter streakData={streakData} />

            {/* Settings */}
            <Button
              variant={location.pathname === '/settings' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => navigate('/settings')}
              className="h-9 w-9"
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>

        {/* Breadcrumbs - Show when inside a subject subpage */}
        {breadcrumbs.length > 1 && (
          <div className="flex items-center gap-1 text-sm py-2 border-t border-border/50 -mx-4 px-4 bg-muted/30">
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                <Link
                  to={crumb.href}
                  className={cn(
                    'flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors',
                    index === breadcrumbs.length - 1
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {crumb.icon && <crumb.icon className="h-3.5 w-3.5" />}
                  {crumb.label}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
});

export default Header;
