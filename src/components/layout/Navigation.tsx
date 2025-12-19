import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, BookOpen, FileText, Settings } from 'lucide-react';

export type Tab = 'dashboard' | 'syllabus' | 'papers' | 'settings';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const navItems: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
  { id: 'papers', label: 'Papers', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg hidden sm:inline">Study Tracker</span>
          </div>

          {/* Nav items */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    'gap-2',
                    isActive && 'bg-primary/10 text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
