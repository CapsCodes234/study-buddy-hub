/**
 * ChapterDeadlinePicker - Popover with calendar for setting a chapter's "Complete by" date
 */

import { memo, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ChapterDeadlinePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (date: string | undefined) => void;
  compact?: boolean;
}

export const ChapterDeadlinePicker = memo(function ChapterDeadlinePicker({
  value,
  onChange,
  compact = false,
}: ChapterDeadlinePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedDate = value ? new Date(value + 'T00:00:00') : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      onChange(`${yyyy}-${mm}-${dd}`);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={compact ? 'icon' : 'sm'}
          className={cn(
            'min-h-[44px] gap-1.5 text-xs',
            compact ? 'min-h-[44px] min-w-[44px]' : 'h-9',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {!compact && (value ? format(selectedDate!, 'MMM d') : 'Set deadline')}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="end"
        sideOffset={4}
        collisionPadding={16}
        avoidCollisions
      >
        <div className="p-2 border-b flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Complete by</span>
          {value && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleClear}>
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          className={cn('p-3 pointer-events-auto')}
        />
      </PopoverContent>
    </Popover>
  );
});
