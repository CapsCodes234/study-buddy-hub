/**
 * DeadlinesCard - Dashboard card showing overdue + upcoming chapter deadlines
 */

import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Subject, Bullet } from '@/types';
import { loadChapterPlannings } from '@/lib/chapterPlanningStorage';
import { getDeadlineInfo, normalizeChapterKey, DeadlineInfo } from '@/types/chapterPlanning';
import { statusToConfidence } from '@/components/ui/ConfidenceToggle';
import { DeadlineBadge } from '@/components/syllabus/DeadlineBadge';

interface DeadlinesCardProps {
  subjects: Subject[];
  bullets: Bullet[];
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
}: DeadlinesCardProps) {
  const navigate = useNavigate();

  const { overdue, dueSoon } = useMemo(() => {
    const plannings = loadChapterPlannings();
    if (plannings.length === 0) return { overdue: [], dueSoon: [] };

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

    return { overdue: overdueItems, dueSoon: dueSoonItems };
  }, [subjects, bullets]);

  if (overdue.length === 0 && dueSoon.length === 0) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          Chapter Deadlines
          {overdue.length > 0 && (
            <Badge variant="destructive" className="text-xs ml-auto">
              {overdue.length} overdue
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {overdue.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" /> Overdue
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
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{item.chapterTitle}</p>
        <p className="text-xs text-muted-foreground truncate">{item.subjectName}</p>
      </div>
      <DeadlineBadge deadline={item.deadline} />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => navigate(`/${item.subjectId}/syllabus`)}
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
});
