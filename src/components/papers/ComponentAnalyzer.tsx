/**
 * Component Analyzer — ranked list of component stats with drill-down
 */

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Target,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { PastPaper, Subject } from '@/types';
import { Component } from '@/types/components';
import { computeComponentStats, ComponentStat } from '@/lib/componentAnalytics';
import { ComponentDetailsModal } from './ComponentDetailsModal';

interface ComponentAnalyzerProps {
  subject: Subject;
  pastPapers: PastPaper[];
  components: Component[];
  onLogAttempt: (componentId: string) => void;
  onFilterByComponent: (componentId: string) => void;
}

export function ComponentAnalyzer({
  subject,
  pastPapers,
  components,
  onLogAttempt,
  onFilterByComponent,
}: ComponentAnalyzerProps) {
  const [selectedStat, setSelectedStat] = useState<ComponentStat | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const stats = useMemo(
    () => computeComponentStats(subject.id, pastPapers, components),
    [subject.id, pastPapers, components]
  );

  const summary = useMemo(() => {
    const withScores = stats.filter((s) => s.avgPercentage !== null);
    const overallAvg =
      withScores.length > 0
        ? Math.round((withScores.reduce((sum, s) => sum + s.avgPercentage!, 0) / withScores.length) * 10) / 10
        : null;
    const totalAttempts = stats.reduce((sum, s) => sum + s.totalAttempts, 0);
    const totalCompleted = stats.reduce((sum, s) => sum + s.completedAttempts, 0);
    return { overallAvg, totalAttempts, totalCompleted, componentCount: stats.length };
  }, [stats]);

  const handleRowClick = (stat: ComponentStat) => {
    setSelectedStat(stat);
    setDetailsOpen(true);
  };

  if (stats.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Components Found</h3>
          <p className="text-sm text-muted-foreground">
            Import component metadata via CSV to see analytics here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Components" value={summary.componentCount} />
        <SummaryCard label="Total Attempts" value={summary.totalAttempts} />
        <SummaryCard label="Completed" value={summary.totalCompleted} />
        <SummaryCard label="Overall Avg" value={summary.overallAvg !== null ? `${summary.overallAvg}%` : '—'} />
      </div>

      {/* Component List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Component Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop/tablet table header — sticky inside scroll area */}
          <div className="relative">
            {/* Top gradient fade */}
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-card to-transparent z-10 hidden" id="analyzer-fade-top" />
            <ScrollArea className="max-h-[420px]">
              <div className="hidden md:grid grid-cols-[1fr_80px_80px_80px_80px_80px_60px] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30 sticky top-0 z-10">
                <span>Component</span>
                <span className="text-center">Attempts</span>
                <span className="text-center">Avg %</span>
                <span className="text-center">Best %</span>
                <span className="text-center">Latest %</span>
                <span className="text-center">Completion</span>
                <span className="text-center">Trend</span>
              </div>
              <div className="divide-y">
                {stats.map((stat) => (
                  <ComponentRow key={stat.componentId} stat={stat} onClick={() => handleRowClick(stat)} />
                ))}
              </div>
            </ScrollArea>
            {/* Bottom gradient fade */}
            {stats.length > 5 && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent z-10" />
            )}
          </div>
        </CardContent>
      </Card>

      <ComponentDetailsModal
        stat={selectedStat}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onLogAttempt={onLogAttempt}
        onFilterByComponent={onFilterByComponent}
      />
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="py-3 px-4 text-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function ComponentRow({ stat, onClick }: { stat: ComponentStat; onClick: () => void }) {
  const TrendIcon = stat.trend === 'up' ? TrendingUp : stat.trend === 'down' ? TrendingDown : Minus;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'min-h-[44px]'
      )}
    >
      {/* Desktop row */}
      <div className="hidden md:grid grid-cols-[1fr_80px_80px_80px_80px_80px_60px] gap-2 px-4 py-3 items-center">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">
            {stat.paperCode} — {stat.componentName}
          </p>
          {stat.isUnknown && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Unknown metadata
            </span>
          )}
          {stat.latestDate && (
            <p className="text-xs text-muted-foreground">
              Last: {format(new Date(stat.latestDate), 'dd MMM yyyy')}
            </p>
          )}
        </div>
        <div className="text-center text-sm">
          <span className="font-medium">{stat.totalAttempts}</span>
          {stat.startedAttempts > 0 && (
            <span className="text-xs text-muted-foreground block">{stat.startedAttempts} started</span>
          )}
        </div>
        <div className="text-center">
          {stat.avgPercentage !== null ? (
            <Badge variant={stat.avgPercentage >= 75 ? 'default' : stat.avgPercentage >= 60 ? 'secondary' : 'destructive'}>
              {stat.avgPercentage}%
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
        <div className="text-center text-sm font-medium">
          {stat.bestPercentage !== null ? `${stat.bestPercentage}%` : '—'}
        </div>
        <div className="text-center text-sm font-medium">
          {stat.latestPercentage !== null ? `${stat.latestPercentage}%` : '—'}
        </div>
        <div className="text-center">
          <Progress value={stat.completionRate} className="h-1.5" />
          <span className="text-xs text-muted-foreground">{stat.completionRate}%</span>
        </div>
        <div className="text-center">
          {stat.trend ? (
            <TrendIcon
              className={cn(
                'h-4 w-4 mx-auto',
                stat.trend === 'up' && 'text-green-600',
                stat.trend === 'down' && 'text-red-600',
                stat.trend === 'flat' && 'text-muted-foreground'
              )}
            />
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </div>

      {/* Mobile/small tablet card */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">
              {stat.paperCode} — {stat.componentName}
            </p>
            {stat.isUnknown && (
              <span className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                <AlertTriangle className="h-3 w-3" /> Unknown
              </span>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {stat.avgPercentage !== null && (
              <Badge variant={stat.avgPercentage >= 75 ? 'default' : stat.avgPercentage >= 60 ? 'secondary' : 'destructive'}>
                {stat.avgPercentage}%
              </Badge>
            )}
            {stat.trend && (
              <TrendIcon
                className={cn(
                  'h-4 w-4',
                  stat.trend === 'up' && 'text-green-600',
                  stat.trend === 'down' && 'text-red-600'
                )}
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span>{stat.totalAttempts} attempts</span>
          <span>{stat.completedAttempts} done</span>
          {stat.bestPercentage !== null && <span>Best: {stat.bestPercentage}%</span>}
          {stat.latestDate && <span>Last: {format(new Date(stat.latestDate), 'dd MMM')}</span>}
        </div>
      </div>
    </button>
  );
}
