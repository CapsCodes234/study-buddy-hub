import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PastPaper, Subject } from '@/types';
import { FileText, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PastPaperPerformanceOverviewProps {
  subjects: Subject[];
  pastPapers: PastPaper[];
}

interface SubjectPaperStats {
  subject: Subject;
  total: number;
  completed: number;
  completionPercent: number;
  averageScore?: number;
  trend: 'up' | 'down' | 'stable';
  lastAttempt?: Date;
}

export const PastPaperPerformanceOverview = memo(({
  subjects,
  pastPapers,
}: PastPaperPerformanceOverviewProps) => {
  const subjectStats = useMemo(() => {
    return subjects.map(subject => {
      const subjectPapers = pastPapers.filter(p => p.subjectId === subject.id);
      const completed = subjectPapers.filter(p => p.completed);
      const total = subjectPapers.length;
      const completionPercent = total > 0 ? (completed.length / total) * 100 : 0;

      // Calculate average score
      const scores = completed
        .map(p => p.score)
        .filter((s): s is number => s !== undefined && s !== null);
      const averageScore = scores.length > 0
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length
        : undefined;

      // Determine trend (last 3 papers)
      const recentPapers = completed
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3);
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recentPapers.length >= 2) {
        const scores = recentPapers
          .map(p => p.score)
          .filter((s): s is number => s !== undefined && s !== null);
        if (scores.length >= 2) {
          const first = scores[scores.length - 1];
          const last = scores[0];
          if (last > first + 5) trend = 'up';
          else if (last < first - 5) trend = 'down';
        }
      }

      // Get last attempt date
      const lastAttempt = completed.length > 0
        ? new Date(Math.max(...completed.map(p => new Date(p.updatedAt).getTime())))
        : undefined;

      return {
        subject,
        total,
        completed: completed.length,
        completionPercent: Math.round(completionPercent),
        averageScore: averageScore ? Math.round(averageScore) : undefined,
        trend,
        lastAttempt,
      };
    }).filter(stat => stat.total > 0);
  }, [subjects, pastPapers]);

  const overallStats = useMemo(() => {
    const total = pastPapers.length;
    const completed = pastPapers.filter(p => p.completed).length;
    const completionPercent = total > 0 ? (completed / total) * 100 : 0;

    const allScores = pastPapers
      .filter(p => p.completed && p.score !== undefined && p.score !== null)
      .map(p => p.score!);
    const averageScore = allScores.length > 0
      ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length
      : undefined;

    return {
      total,
      completed,
      completionPercent: Math.round(completionPercent),
      averageScore: averageScore ? Math.round(averageScore) : undefined,
    };
  }, [pastPapers]);

  const formatTimeSince = (date?: Date) => {
    if (!date) return 'Never';
    const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return '1 day ago';
    if (daysAgo < 7) return `${daysAgo} days ago`;
    if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
    return `${Math.floor(daysAgo / 30)} months ago`;
  };

  if (pastPapers.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Past Paper Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No past papers logged yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Past Paper Performance Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Stats */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{overallStats.completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{overallStats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{overallStats.completionPercent}%</div>
              <div className="text-xs text-muted-foreground">Completion</div>
            </div>
          </div>
          {overallStats.averageScore !== undefined && (
            <div className="text-center mt-3 pt-3 border-t">
              <div className="text-lg font-semibold">Average Score</div>
              <div className="text-2xl font-bold">{overallStats.averageScore}%</div>
            </div>
          )}
        </div>

        {/* Per Subject */}
        {subjectStats.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">By Subject</h4>
            {subjectStats.map(stat => (
              <div key={stat.subject.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: stat.subject.color }}
                    />
                    <span className="text-sm font-medium">{stat.subject.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {stat.trend === 'up' && (
                      <TrendingUp className="h-4 w-4 text-status-green" />
                    )}
                    {stat.trend === 'down' && (
                      <TrendingDown className="h-4 w-4 text-status-red" />
                    )}
                    {stat.trend === 'stable' && (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-semibold">
                      {stat.completed}/{stat.total}
                    </span>
                  </div>
                </div>
                <Progress value={stat.completionPercent} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {stat.averageScore !== undefined && (
                      <span>Avg: {stat.averageScore}%</span>
                    )}
                    {stat.lastAttempt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeSince(stat.lastAttempt)}
                      </span>
                    )}
                  </div>
                  <span>{stat.completionPercent}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

PastPaperPerformanceOverview.displayName = 'PastPaperPerformanceOverview';

