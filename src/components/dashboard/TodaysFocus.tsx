import { memo, useMemo } from 'react';
import { Bullet, PastPaper, Subject, FocusItem, NavigationFilters } from '@/types';
import { getAllFocusItems, getFocusSummary } from '@/lib/focus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Clock, 
  FileText, 
  ChevronRight,
  Target,
  Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodaysFocusProps {
  bullets: Bullet[];
  pastPapers: PastPaper[];
  subjects: Subject[];
  onNavigate: (filters: NavigationFilters) => void;
}

const FocusItemCard = memo(({ 
  item, 
  subjects,
  onNavigate 
}: { 
  item: FocusItem; 
  subjects: Subject[];
  onNavigate: (filters: NavigationFilters) => void;
}) => {
  const subject = subjects.find(s => s.id === item.subjectId);
  
  const handleClick = () => {
    if (item.type === 'bullet') {
      const bullet = item.data as Bullet;
      onNavigate({
        tab: 'syllabus',
        bulletFilters: {
          subjectId: bullet.subjectId,
          searchText: bullet.bulletText.slice(0, 20),
          statusFilter: 'all',
          hideCompleted: false,
        },
        highlightId: bullet.id,
      });
    } else {
      const paper = item.data as PastPaper;
      onNavigate({
        tab: 'papers',
        paperFilters: {
          subjectId: paper.subjectId,
          year: paper.year,
          completionFilter: 'all',
        },
        highlightId: paper.id,
      });
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all hover:shadow-md',
        'bg-card hover:bg-accent/5',
        item.priority === 'high' && 'border-status-red/30 hover:border-status-red/50',
        item.priority === 'medium' && 'border-status-amber/30 hover:border-status-amber/50',
        item.priority === 'low' && 'border-border hover:border-primary/30'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'p-1.5 rounded-md shrink-0 mt-0.5',
          item.priority === 'high' && 'bg-status-red/10 text-status-red',
          item.priority === 'medium' && 'bg-status-amber/10 text-status-amber',
          item.priority === 'low' && 'bg-muted text-muted-foreground'
        )}>
          {item.type === 'bullet' ? (
            item.priority === 'high' ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-clamp-2">{item.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {item.subtitle}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge 
              variant="outline" 
              className="text-xs py-0 h-5"
              style={{ 
                borderColor: subject?.color,
                color: subject?.color 
              }}
            >
              {subject?.name}
            </Badge>
            <span className="text-xs text-muted-foreground">{item.reason}</span>
          </div>
        </div>
        
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </button>
  );
});

FocusItemCard.displayName = 'FocusItemCard';

export const TodaysFocus = memo(({ 
  bullets, 
  pastPapers, 
  subjects, 
  onNavigate 
}: TodaysFocusProps) => {
  const focusItems = useMemo(() => 
    getAllFocusItems(bullets, pastPapers, subjects, 8),
    [bullets, pastPapers, subjects]
  );
  
  const summary = useMemo(() => 
    getFocusSummary(bullets, pastPapers),
    [bullets, pastPapers]
  );
  
  const hasItems = focusItems.length > 0;
  
  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Target className="h-4 w-4 text-primary" />
            </div>
            Today's Focus
          </CardTitle>
          {hasItems && (
            <div className="flex items-center gap-2">
              {summary.redCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <Flame className="h-3 w-3 mr-1" />
                  {summary.redCount} critical
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {!hasItems ? (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">All caught up! No items need attention right now.</p>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="text-center p-2 bg-status-red/5 rounded-lg border border-status-red/20">
                <p className="text-lg font-bold text-status-red">{summary.redCount}</p>
                <p className="text-xs text-muted-foreground">Red Items</p>
              </div>
              <div className="text-center p-2 bg-status-amber/5 rounded-lg border border-status-amber/20">
                <p className="text-lg font-bold text-status-amber">{summary.staleAmberCount}</p>
                <p className="text-xs text-muted-foreground">Stale Amber</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg border border-border">
                <p className="text-lg font-bold">{summary.unratedCount}</p>
                <p className="text-xs text-muted-foreground">Unrated</p>
              </div>
              <div className="text-center p-2 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-lg font-bold text-primary">{summary.incompletePaperCount}</p>
                <p className="text-xs text-muted-foreground">Papers Left</p>
              </div>
            </div>
            
            {/* Focus items list */}
            <ScrollArea className="h-[300px] pr-3">
              <div className="space-y-2">
                {focusItems.map((item) => (
                  <FocusItemCard 
                    key={item.id} 
                    item={item} 
                    subjects={subjects}
                    onNavigate={onNavigate} 
                  />
                ))}
              </div>
            </ScrollArea>
            
            {/* Quick actions */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => onNavigate({
                  tab: 'syllabus',
                  bulletFilters: {
                    subjectId: null,
                    searchText: '',
                    statusFilter: 'Red',
                    hideCompleted: false,
                  },
                })}
              >
                View All Red Items
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => onNavigate({
                  tab: 'papers',
                  paperFilters: {
                    subjectId: null,
                    year: null,
                    completionFilter: 'incomplete',
                  },
                })}
              >
                View Incomplete Papers
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});

TodaysFocus.displayName = 'TodaysFocus';
