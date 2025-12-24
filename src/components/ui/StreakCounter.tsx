/**
 * Streak Counter Component
 * Displays current streak in header with modal for details
 */

import { useState, useMemo } from 'react';
import { Flame, Trophy, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StreakData } from '@/types/reminders';
import { getStreakStatus } from '@/lib/streak';

interface StreakCounterProps {
  streakData: StreakData;
  className?: string;
}

export function StreakCounter({ streakData, className }: StreakCounterProps) {
  const [open, setOpen] = useState(false);
  
  const status = useMemo(() => getStreakStatus(streakData), [streakData]);

  const streakColor = useMemo(() => {
    switch (status.status) {
      case 'healthy':
        return 'text-status-amber';
      case 'at_risk':
        return 'text-status-amber animate-pulse';
      case 'broken':
        return 'text-muted-foreground';
    }
  }, [status.status]);

  const bgColor = useMemo(() => {
    switch (status.status) {
      case 'healthy':
        return 'bg-status-amber-bg hover:bg-status-amber/20';
      case 'at_risk':
        return 'bg-status-amber-bg border-status-amber';
      case 'broken':
        return 'bg-muted hover:bg-muted/80';
    }
  }, [status.status]);

  // Generate calendar data for last 30 days
  const calendarData = useMemo(() => {
    const days: { date: string; hasActivity: boolean }[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        hasActivity: streakData.streakHistory.includes(dateStr),
      });
    }
    
    return days;
  }, [streakData.streakHistory]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-1.5 px-3 rounded-full border transition-all',
                bgColor,
                className
              )}
            >
              <Flame className={cn('h-4 w-4', streakColor)} />
              <span className={cn('font-semibold tabular-nums', streakColor)}>
                {status.streak}
              </span>
              {status.status === 'at_risk' && (
                <AlertTriangle className="h-3 w-3 text-status-amber" />
              )}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Consecutive study days — your streak</p>
        </TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-status-amber" />
            Study Streak
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Streak */}
          <div className="text-center py-4">
            <div className="text-5xl font-bold text-status-amber mb-2">
              {status.streak}
            </div>
            <p className="text-muted-foreground text-sm">{status.message}</p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Trophy className="h-5 w-5 mx-auto mb-1 text-status-amber" />
              <div className="text-lg font-semibold">{streakData.bestStreak}</div>
              <div className="text-xs text-muted-foreground">Best Streak</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
              <div className="text-lg font-semibold">{streakData.totalStudyDays}</div>
              <div className="text-xs text-muted-foreground">Total Days</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-status-green" />
              <div className="text-lg font-semibold">
                {streakData.streakHistory.length > 0
                  ? Math.round((streakData.totalStudyDays / 30) * 100)
                  : 0}%
              </div>
              <div className="text-xs text-muted-foreground">30-Day Rate</div>
            </div>
          </div>

          {/* Calendar View */}
          <div>
            <h4 className="text-sm font-medium mb-3">Last 30 Days</h4>
            <div className="grid grid-cols-10 gap-1">
              {calendarData.map((day) => (
                <Tooltip key={day.date}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'w-6 h-6 rounded-sm transition-colors cursor-default',
                        day.hasActivity
                          ? 'bg-status-green'
                          : 'bg-muted'
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {day.hasActivity ? ' ✓' : ''}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Encouragement */}
          {status.status === 'at_risk' && (
            <div className="p-3 rounded-lg bg-status-amber-bg border border-status-amber/20">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-status-amber" />
                <span className="font-medium">Streak at risk!</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Complete any study activity today to keep your streak going.
              </p>
            </div>
          )}

          {status.streak >= 7 && (
            <Badge variant="secondary" className="w-full justify-center py-2">
              🎉 You're on fire! Keep the momentum going!
            </Badge>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
