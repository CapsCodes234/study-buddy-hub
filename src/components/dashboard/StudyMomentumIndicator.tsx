import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StudyMomentum } from '@/lib/insights';
import { TrendingUp, Flame, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudyMomentumIndicatorProps {
  momentum: StudyMomentum;
}

export const StudyMomentumIndicator = memo(({ momentum }: StudyMomentumIndicatorProps) => {
  const getActivityColor = () => {
    switch (momentum.activityLevel) {
      case 'Strong':
        return 'text-status-green';
      case 'Moderate':
        return 'text-status-amber';
      case 'Low':
        return 'text-status-red';
    }
  };

  const getActivityBg = () => {
    switch (momentum.activityLevel) {
      case 'Strong':
        return 'bg-status-green/10 border-status-green/30';
      case 'Moderate':
        return 'bg-status-amber/10 border-status-amber/30';
      case 'Low':
        return 'bg-status-red/10 border-status-red/30';
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo < 7) return `${daysAgo} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Study Momentum
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Activity Level */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Activity Level</span>
          <Badge
            variant="outline"
            className={cn(getActivityColor(), getActivityBg())}
          >
            {momentum.activityLevel}
          </Badge>
        </div>

        {/* Days Studied */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{momentum.daysStudiedLast7}</div>
            <div className="text-xs text-muted-foreground">Last 7 days</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{momentum.daysStudiedLast14}</div>
            <div className="text-xs text-muted-foreground">Last 14 days</div>
          </div>
        </div>

        {/* Streaks */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flame className="h-4 w-4 text-status-amber" />
              <span>Current Streak</span>
            </div>
            <span className="text-lg font-bold">{momentum.currentStreak} days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Longest Streak</span>
            <span className="text-sm font-semibold">{momentum.longestStreak} days</span>
          </div>
        </div>

        {/* Last Activity */}
        {momentum.lastActivityDate && (
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Last Activity</span>
            </div>
            <span className="font-medium">{formatDate(momentum.lastActivityDate)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

StudyMomentumIndicator.displayName = 'StudyMomentumIndicator';

