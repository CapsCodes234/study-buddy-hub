/**
 * Upcoming Reminders Panel - Shows next reminders with quick actions
 */

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  BellOff,
  Clock,
  X,
  ChevronRight,
  Calendar,
  BookOpen,
  Flame,
  Target,
} from 'lucide-react';
import { Reminder } from '@/types/reminders';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface UpcomingRemindersProps {
  reminders: Reminder[];
  onDismiss: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onViewAll?: () => void;
  className?: string;
}

const ReminderTypeIcon = ({ type }: { type: Reminder['type'] }) => {
  switch (type) {
    case 'exam':
      return <Calendar className="h-4 w-4 text-status-red" />;
    case 'study':
      return <BookOpen className="h-4 w-4 text-primary" />;
    case 'streak':
      return <Flame className="h-4 w-4 text-status-amber" />;
    case 'reflection':
      return <Target className="h-4 w-4 text-status-green" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

const ReminderItem = memo(function ReminderItem({
  reminder,
  onDismiss,
  onSnooze,
}: {
  reminder: Reminder;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
}) {
  const timeUntil = formatDistanceToNow(new Date(reminder.remindAtISO), { addSuffix: true });

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="mt-0.5">
        <ReminderTypeIcon type={reminder.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{reminder.title}</p>
        <p className="text-xs text-muted-foreground truncate">{reminder.body}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {timeUntil}
          </Badge>
          {reminder.repeat !== 'none' && (
            <Badge variant="secondary" className="text-xs">
              {reminder.repeat}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onSnooze(60)}
          title="Snooze 1 hour"
        >
          <Clock className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onDismiss}
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
});

export const UpcomingReminders = memo(function UpcomingReminders({
  reminders,
  onDismiss,
  onSnooze,
  onViewAll,
  className,
}: UpcomingRemindersProps) {
  if (reminders.length === 0) {
    return (
      <Card className={cn('glass-card', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-primary" />
            Upcoming Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <BellOff className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming reminders</p>
            <p className="text-xs text-muted-foreground mt-1">
              Reminders will appear here when scheduled
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('glass-card', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-primary" />
            Upcoming Reminders
            <Badge variant="secondary" className="ml-2">
              {reminders.length}
            </Badge>
          </CardTitle>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {reminders.map((reminder) => (
          <ReminderItem
            key={reminder.id}
            reminder={reminder}
            onDismiss={() => onDismiss(reminder.id)}
            onSnooze={(minutes) => onSnooze(reminder.id, minutes)}
          />
        ))}
      </CardContent>
    </Card>
  );
});
