/**
 * DeadlineBadge - Displays deadline status with color coding
 */

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle2, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeadlineInfo, DeadlineStatus } from '@/types/chapterPlanning';

const STATUS_STYLES: Record<DeadlineStatus, { className: string; icon: typeof Clock }> = {
  overdue: {
    className: 'bg-destructive/10 text-destructive border-destructive/30',
    icon: AlertTriangle,
  },
  due_soon: {
    className: 'bg-status-amber-bg text-status-amber border-status-amber/30',
    icon: Clock,
  },
  on_track: {
    className: 'bg-muted text-muted-foreground border-border',
    icon: CalendarClock,
  },
  completed: {
    className: 'bg-status-green-bg text-status-green border-status-green/30',
    icon: CheckCircle2,
  },
  no_deadline: {
    className: 'bg-muted/50 text-muted-foreground border-transparent',
    icon: CalendarClock,
  },
};

interface DeadlineBadgeProps {
  deadline: DeadlineInfo;
  compact?: boolean;
  className?: string;
}

export const DeadlineBadge = memo(function DeadlineBadge({
  deadline,
  compact = false,
  className,
}: DeadlineBadgeProps) {
  const style = STATUS_STYLES[deadline.status];
  const Icon = style.icon;

  if (deadline.status === 'no_deadline' && compact) return null;

  return (
    <Badge
      variant="outline"
      className={cn('text-xs gap-1 font-medium', style.className, className)}
    >
      <Icon className="h-3 w-3" />
      {!compact && deadline.label}
    </Badge>
  );
});
