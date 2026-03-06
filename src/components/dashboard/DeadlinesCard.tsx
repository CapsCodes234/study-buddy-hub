/**
 * DeadlinesCard - Dashboard card showing overdue + upcoming chapter deadlines
 * Always visible at top of dashboard: empty state, "all caught up", or next-up list.
 */

import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, AlertTriangle, ArrowRight, CheckCircle2, CalendarPlus } from 'lucide-react';
import { Subject, Bullet, NavigationFilters } from '@/types';
import { loadChapterPlannings } from '@/lib/chapterPlanningStorage';
import { getDeadlineInfo, normalizeChapterKey, DeadlineInfo } from '@/types/chapterPlanning';
import { statusToConfidence } from '@/components/ui/ConfidenceToggle';
import { DeadlineBadge } from '@/components/syllabus/DeadlineBadge';

const MAX_NEXT_UP_ITEMS = 5;

interface DeadlinesCardProps {
  subjects: Subject[];
  bullets: Bullet[];
  onNavigate?: (filters: NavigationFilters) => void;
}

interface DeadlineItem {
  subjectId: string;
  subjectName: string;
  chapterTitle: string;
  deadline: DeadlineInfo;
  completeBy: string;
}

export const DeadlinesCard = memo(function DeadlinesCard({
  subjects,
  bullets,
  onNavigate,
}: DeadlinesCardProps) {
  const navigate = useNavigate();

  const { overdue, dueSoon, overdueCount, dueSoonCount, hasPlannings, allCaughtUp } = useMemo(() => {
    const plannings = loadChapterPlannings();
    const hasPlannings = plannings.some((p) => p.completeBy);
    if (plannings.length === 0) {
      return {
        overdue: [] as DeadlineItem[],
        dueSoon: [] as DeadlineItem[],
        overdueCount: 0,
        dueSoonCount: 0,
        hasPlannings: false,
        allCaughtUp: false,
      };
    }

    // Build chapter completion map
    const chapterCompletion = new Map<string, boolean>();
    const subjectBullets = new Map<string, Bullet[]>();

    for (const b of bullets) {
      if (!subjectBullets.has(b.subjectId)) subjectBullets.set(b.subjectId, []);
      subjectBullets.get(b.subjectId)!.push(b);
    }

    for (const [sid, sBullets] of subjectBullets) {
      const byTopic = new Map<string, { total: number; confident: number }>();
      for (const b of sBullets) {
        const key = normalizeChapterKey(b.mainTopic);
        const stats = byTopic.get(key) || { total: 0, confident: 0 };
        stats.total++;
        if (statusToConfidence(b.status, b.done) === 'confident') stats.confident++;
        byTopic.set(key, stats);
      }
      for (const [key, stats] of byTopic) {
        chapterCompletion.set(`${sid}|${key}`, stats.total > 0 && stats.confident === stats.total);
      }
    }

    const overdueItems: DeadlineItem[] = [];
    const dueSoonItems: DeadlineItem[] = [];

    for (const p of plannings) {
      if (!p.completeBy) continue;
      const isComplete = chapterCompletion.get(`${p.subjectId}|${p.chapterKey}`) ?? false;
      const info = getDeadlineInfo(p.completeBy, isComplete);
      const subject = subjects.find((s) => s.id === p.subjectId);
      if (!subject) continue;

      const item: DeadlineItem = {
        subjectId: p.subjectId,
        subjectName: subject.name,
        chapterTitle: p.chapterTitle,
        deadline: info,
        completeBy: p.completeBy,
      };

      if (info.status === 'overdue') overdueItems.push(item);
      else if (info.status === 'due_soon') dueSoonItems.push(item);
    }

    // Sort by urgency
    overdueItems.sort((a, b) => (a.deadline.daysRemaining ?? 0) - (b.deadline.daysRemaining ?? 0));
    dueSoonItems.sort((a, b) => (a.deadline.daysRemaining ?? 0) - (b.deadline.daysRemaining ?? 0));

    const overdueSliced = overdueItems.slice(0, MAX_NEXT_UP_ITEMS);
    const dueSoonSliced = dueSoonItems.slice(0, MAX_NEXT_UP_ITEMS - overdueSliced.length);
    const allCaughtUp = hasPlannings && overdueItems.length === 0 && dueSoonItems.length === 0;

    return {
      overdue: overdueSliced,
      dueSoon: dueSoonSliced,
      overdueCount: overdueItems.length,
      dueSoonCount: dueSoonItems.length,
      hasPlannings,
      allCaughtUp,
    };
  }, [subjects, bullets]);

  const handlePlanDeadlines = () => {
    if (onNavigate) {
      onNavigate({ tab: 'syllabus' });
    } else if (subjects.length > 0) {
      navigate(`/${subjects[0].id}/syllabus`);
    }
  };

  const hasChapters = bullets.length > 0;
  const showEmptyState = !hasPlannings && hasChapters;
  const showAllCaughtUp = allCaughtUp;
  const showNextUp = overdue.length > 0 || dueSoon.length > 0;

  return (
    <Card className="border-primary/20 w-full min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex flex-wrap items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary shrink-0" />
          Chapter Deadlines
          {overdueCount > 0 && (
            <Badge variant="destructive" className="text-xs shrink-0">
              {overdueCount} overdue
            </Badge>
          )}
          {dueSoonCount > 0 && overdueCount === 0 && (
            <Badge variant="secondary" className="text-xs shrink-0 text-status-amber border-status-amber/30">
              {dueSoonCount} due soon
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showEmptyState && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CalendarPlus className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Set &quot;Complete by&quot; dates for chapters to track deadlines.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] gap-2"
              onClick={handlePlanDeadlines}
            >
              Plan deadlines
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {showAllCaughtUp && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-status-green mb-2" />
            <p className="text-sm font-medium text-status-green">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">No overdue or upcoming deadlines.</p>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] gap-2 mt-3"
              onClick={handlePlanDeadlines}
            >
              View syllabus
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {showNextUp && (
          <>
            {overdue.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Overdue
                </div>
                {overdue.map((item) => (
                  <DeadlineRow key={`${item.subjectId}-${item.chapterTitle}`} item={item} navigate={navigate} />
                ))}
              </div>
            )}
            {dueSoon.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-status-amber">Due next 7 days</div>
                {dueSoon.map((item) => (
                  <DeadlineRow key={`${item.subjectId}-${item.chapterTitle}`} item={item} navigate={navigate} />
                ))}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full min-h-[44px] gap-2 mt-2"
              onClick={handlePlanDeadlines}
            >
              Plan deadlines
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {!hasChapters && !showEmptyState && !showAllCaughtUp && !showNextUp && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CalendarPlus className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Import syllabus data to set chapter deadlines.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] gap-2"
              onClick={handlePlanDeadlines}
            >
              Go to syllabus
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

const DeadlineRow = memo(function DeadlineRow({
  item,
  navigate,
}: {
  item: DeadlineItem;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 min-h-[44px]">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{item.chapterTitle}</p>
        <p className="text-xs text-muted-foreground truncate">{item.subjectName}</p>
      </div>
      <DeadlineBadge deadline={item.deadline} />
      <Button
        variant="ghost"
        size="icon"
        className="min-h-[44px] min-w-[44px] shrink-0"
        onClick={() => navigate(`/${item.subjectId}/syllabus`)}
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
});
