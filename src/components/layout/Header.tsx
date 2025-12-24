/**
 * Header Component
 * Global navigation with streak counter, breadcrumbs, and theme toggle
 */

import { memo, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, ChevronRight, Settings, Calculator, Cpu, Atom } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { StreakCounter } from '@/components/ui/StreakCounter';
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
      'sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border',
      className
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Breadcrumbs */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="p-1.5 bg-primary rounded-lg">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg hidden md:inline">Study Buddy</span>
            </Link>

            {/* Breadcrumbs (desktop only) */}
            {breadcrumbs.length > 0 && (
              <nav className="hidden sm:flex items-center gap-1 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center gap-1">
                    {index > 0 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Link
                      to={crumb.href}
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors',
                        isActive(crumb.href)
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      {crumb.icon && <crumb.icon className="h-4 w-4" />}
                      {crumb.label}
                    </Link>
                  </div>
                ))}
              </nav>
            )}
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {/* Subject Quick Links (desktop) */}
            <nav className="hidden lg:flex items-center gap-1">
              <Button
                variant={location.pathname === '/' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>

              {subjects.map((subject) => {
                const Icon = getSubjectIcon(subject.id, subject.name);
                const isSubjectActive = location.pathname.startsWith(`/${subject.id}`);
                
                return (
                  <Button
                    key={subject.id}
                    variant={isSubjectActive ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => navigate(`/${subject.id}`)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden xl:inline">{subject.name}</span>
                  </Button>
                );
              })}
            </nav>

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
      </div>
    </header>
  );
});

export default Header;
