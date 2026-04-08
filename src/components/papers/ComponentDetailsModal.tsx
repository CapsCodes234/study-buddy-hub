/**
 * Component Details Modal — shows attempt history for a single component
 */

import { useMemo, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Clock, Target, BarChart3, Sparkles, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ComponentStat } from '@/lib/componentAnalytics';
import { isAIConfigured, getAIClient } from '@/ai/aiClient';

interface ComponentDetailsModalProps {
  stat: ComponentStat | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogAttempt: (componentId: string) => void;
  onFilterByComponent: (componentId: string) => void;
}

export function ComponentDetailsModal({
  stat,
  open,
  onOpenChange,
  onLogAttempt,
  onFilterByComponent,
}: ComponentDetailsModalProps) {
  const [aiInsights, setAiInsights] = useState<string[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiEnabled = isAIConfigured();

  const generateInsights = useCallback(async () => {
    if (!stat || aiLoading) return;
    setAiLoading(true);
    try {
      const client = getAIClient();
      const prompt = `Analyze this exam component performance and give 2-4 concise bullet-point suggestions for improvement.
Component: ${stat.paperCode} ${stat.componentName}
Attempts: ${stat.totalAttempts} total, ${stat.completedAttempts} completed
Average: ${stat.avgPercentage ?? 'N/A'}%, Best: ${stat.bestPercentage ?? 'N/A'}%, Latest: ${stat.latestPercentage ?? 'N/A'}%
Trend: ${stat.trend ?? 'unknown'}
Time efficiency: ${stat.timeEfficiency !== null ? (stat.timeEfficiency <= 1 ? 'within time' : 'over time') : 'unknown'}
Return ONLY a JSON array of strings, e.g. ["suggestion 1", "suggestion 2"]`;
      const response = await client.generateText(prompt, { temperature: 0.5, maxTokens: 500 });
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        setAiInsights(parsed.slice(0, 4).map(String));
      }
    } catch {
      setAiInsights(['Could not generate insights. Check your AI configuration.']);
    } finally {
      setAiLoading(false);
    }
  }, [stat, aiLoading]);

  if (!stat) return null;

  const TrendIcon = stat.trend === 'up' ? TrendingUp : stat.trend === 'down' ? TrendingDown : Minus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {stat.paperCode} — {stat.componentName}
            {stat.isUnknown && (
              <Badge variant="outline" className="text-xs text-amber-600">Unknown</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {stat.totalAttempts} attempt{stat.totalAttempts !== 1 ? 's' : ''} •{' '}
            {stat.completedAttempts} completed • {stat.startedAttempts} started
          </DialogDescription>
        </DialogHeader>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox label="Average" value={stat.avgPercentage !== null ? `${stat.avgPercentage}%` : '—'} />
          <StatBox label="Best" value={stat.bestPercentage !== null ? `${stat.bestPercentage}%` : '—'} />
          <StatBox label="Latest" value={stat.latestPercentage !== null ? `${stat.latestPercentage}%` : '—'} />
          <StatBox
            label="Trend"
            value={
              stat.trend ? (
                <span className={cn(
                  'flex items-center gap-1',
                  stat.trend === 'up' && 'text-green-600',
                  stat.trend === 'down' && 'text-red-600'
                )}>
                  <TrendIcon className="h-4 w-4" />
                  {stat.trend === 'up' ? 'Improving' : stat.trend === 'down' ? 'Declining' : 'Stable'}
                </span>
              ) : '—'
            }
          />
        </div>

        {stat.timeEfficiency !== null && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Avg time: {stat.avgDurationUsed} min
            {stat.durationMin > 0 && (
              <span>
                / {stat.durationMin} min allowed
                ({stat.timeEfficiency! <= 1 ? '✓ within time' : '⚠ over time'})
              </span>
            )}
          </div>
        )}

        {/* Attempt History */}
        <ScrollArea className="flex-1 max-h-[320px]">
          <div className="space-y-2 pr-2">
            {stat.attempts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No attempts yet</p>
            ) : (
              stat.attempts.map((paper) => {
                const pct = paper.percentageScore ?? paper.score;
                const dateStr = paper.attemptDate || paper.createdAt;
                const isStarted = !paper.completed || paper.rawScore === undefined;

                return (
                  <div
                    key={paper.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border text-sm',
                      paper.completed && 'bg-muted/30'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {paper.session} {paper.year}
                        {paper.variant && <span className="text-muted-foreground"> v{paper.variant}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {dateStr ? format(new Date(dateStr), 'dd MMM yyyy') : '—'}
                        {paper.durationUsed ? ` • ${paper.durationUsed} min` : ''}
                        {paper.notes ? ` • ${paper.notes}` : ''}
                      </p>
                    </div>
                    <div className="shrink-0 ml-3">
                      {isStarted ? (
                        <Badge variant="outline" className="text-xs">Started</Badge>
                      ) : (
                        <div className="text-right">
                          <Badge
                            variant={pct !== undefined && pct >= 75 ? 'default' : pct !== undefined && pct >= 60 ? 'secondary' : 'destructive'}
                          >
                            {paper.rawScore}/{paper.totalMarks} ({pct ?? 0}%)
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* AI Insights */}
        {aiEnabled && (
          <div className="space-y-2">
            {!aiInsights && !aiLoading && (
              <Button
                variant="outline"
                size="sm"
                className="w-full min-h-[44px]"
                onClick={generateInsights}
              >
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                AI Insight
              </Button>
            )}
            {aiLoading && (
              <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating insights…
              </div>
            )}
            {aiInsights && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> AI Suggestions
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {aiInsights.map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
          <Button
            className="min-h-[44px] flex-1"
            onClick={() => {
              onLogAttempt(stat.componentId);
              onOpenChange(false);
            }}
          >
            <Target className="h-4 w-4 mr-2" />
            Log New Attempt
          </Button>
          <Button
            variant="outline"
            className="min-h-[44px] flex-1"
            onClick={() => {
              onFilterByComponent(stat.componentId);
              onOpenChange(false);
            }}
          >
            Jump to Attempts
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-2 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{typeof value === 'string' ? value : value}</p>
    </div>
  );
}
