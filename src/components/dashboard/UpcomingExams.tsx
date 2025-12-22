/**
 * Upcoming Exams Dashboard Component - Shows countdowns and reminders
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Clock,
  AlertTriangle,
  Bell,
  ChevronRight,
  Trophy,
} from 'lucide-react';
import { Subject } from '@/types';
import { SubjectComponent } from '@/types/syllabus';
import { ExamCountdown } from '@/types/paper';
import {
  getUpcomingExams,
  getNearestMainExam,
  formatCountdown,
  getUrgencyLevel,
} from '@/lib/examSchedule';
import { cn } from '@/lib/utils';

interface UpcomingExamsProps {
  subjects: Subject[];
  components: SubjectComponent[];
  onViewSchedule?: () => void;
  onDismissReminder?: (examId: string, daysBefore: number) => void;
  maxItems?: number;
}

const UrgencyBadge = ({ level }: { level: ReturnType<typeof getUrgencyLevel> }) => {
  const styles = {
    critical: 'bg-status-red text-status-red-foreground animate-pulse',
    urgent: 'bg-status-red/80 text-status-red-foreground',
    warning: 'bg-status-amber text-status-amber-foreground',
    normal: 'bg-muted text-muted-foreground',
  };

  return (
    <Badge className={cn('text-xs', styles[level])}>
      {level === 'critical' && 'Tomorrow!'}
      {level === 'urgent' && 'This Week'}
      {level === 'warning' && 'Soon'}
      {level === 'normal' && 'Upcoming'}
    </Badge>
  );
};

const CountdownCard = ({
  countdown,
  isMain,
}: {
  countdown: ExamCountdown;
  isMain?: boolean;
}) => {
  const urgency = getUrgencyLevel(countdown.daysRemaining);
  const subject = countdown.subjectName;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg border transition-colors',
        isMain && 'border-primary bg-primary/5',
        urgency === 'critical' && 'border-status-red bg-status-red/5',
        urgency === 'urgent' && 'border-status-amber bg-status-amber/5',
        !isMain && urgency === 'normal' && 'border-border'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-14 h-14 rounded-xl font-bold text-xl',
          urgency === 'critical' && 'bg-status-red/20 text-status-red',
          urgency === 'urgent' && 'bg-status-amber/20 text-status-amber',
          urgency === 'warning' && 'bg-status-amber/10 text-status-amber',
          urgency === 'normal' && 'bg-muted text-muted-foreground'
        )}
      >
        {countdown.daysRemaining}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{subject}</p>
          {isMain && (
            <Badge variant="outline" className="shrink-0 text-xs border-primary text-primary">
              <Trophy className="h-3 w-3 mr-1" />
              Main
            </Badge>
          )}
        </div>
        {countdown.componentName && (
          <p className="text-sm text-muted-foreground truncate">
            {countdown.componentName}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(countdown.examItem.date).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </p>
      </div>

      <div className="text-right shrink-0">
        <UrgencyBadge level={urgency} />
        <p className="text-sm text-muted-foreground mt-1">
          {formatCountdown(countdown)}
        </p>
      </div>
    </div>
  );
};

export const UpcomingExams = ({
  subjects,
  components,
  onViewSchedule,
  onDismissReminder,
  maxItems = 5,
}: UpcomingExamsProps) => {
  const upcomingExams = useMemo(
    () => getUpcomingExams(subjects, components),
    [subjects, components]
  );

  const nearestMainExam = useMemo(
    () => getNearestMainExam(subjects, components),
    [subjects, components]
  );

  const displayExams = useMemo(() => {
    // If there's a main exam, show it first, then other exams
    if (nearestMainExam) {
      const others = upcomingExams
        .filter((e) => e.examItem.id !== nearestMainExam.examItem.id)
        .slice(0, maxItems - 1);
      return [nearestMainExam, ...others];
    }
    return upcomingExams.slice(0, maxItems);
  }, [upcomingExams, nearestMainExam, maxItems]);

  if (displayExams.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Exams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No exams scheduled</p>
            {onViewSchedule && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={onViewSchedule}
              >
                Add Exam Dates
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Exams
          </CardTitle>
          {onViewSchedule && (
            <Button variant="ghost" size="sm" onClick={onViewSchedule}>
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Featured countdown for nearest main exam */}
        {nearestMainExam && nearestMainExam.daysRemaining <= 30 && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Main A-Level Exam
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">{nearestMainExam.subjectName}</p>
                {nearestMainExam.componentName && (
                  <p className="text-sm text-muted-foreground">
                    {nearestMainExam.componentName}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  {nearestMainExam.daysRemaining}
                </p>
                <p className="text-sm text-muted-foreground">
                  days remaining
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progress to exam</span>
                <span>
                  {Math.max(0, 100 - (nearestMainExam.daysRemaining / 30) * 100).toFixed(0)}%
                </span>
              </div>
              <Progress
                value={Math.max(0, 100 - (nearestMainExam.daysRemaining / 30) * 100)}
                className="h-2"
              />
            </div>
          </div>
        )}

        {/* List of upcoming exams */}
        <div className="space-y-2">
          {displayExams
            .filter(
              (e) =>
                !nearestMainExam ||
                e.examItem.id !== nearestMainExam.examItem.id ||
                nearestMainExam.daysRemaining > 30
            )
            .map((countdown) => (
              <CountdownCard
                key={countdown.examItem.id}
                countdown={countdown}
                isMain={countdown.examItem.examType === 'main'}
              />
            ))}
        </div>

        {upcomingExams.length > maxItems && (
          <p className="text-xs text-center text-muted-foreground pt-2">
            + {upcomingExams.length - maxItems} more exams
          </p>
        )}
      </CardContent>
    </Card>
  );
};
