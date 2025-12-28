/**
 * TopicCard Component
 * Compact card with status dropdown and notes button
 */

import { memo, useCallback, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Bullet } from '@/types';
import { ConfidenceState, CONFIDENCE_CONFIG } from '@/types/reminders';
import {
  statusToConfidence,
  confidenceToStatus,
} from '@/components/ui/ConfidenceToggle';

interface TopicCardProps {
  bullet: Bullet;
  onStatusChange: (id: string, confidence: ConfidenceState) => void;
  onOpenNotes: (bullet: Bullet) => void;
  isHighlighted?: boolean;
}

const CONFIDENCE_OPTIONS: ConfidenceState[] = [
  'confident',
  'in_progress',
  'needs_revision',
  'not_started',
];

export const TopicCard = memo(function TopicCard({
  bullet,
  onStatusChange,
  onOpenNotes,
  isHighlighted = false,
}: TopicCardProps) {
  const currentConfidence = statusToConfidence(bullet.status, bullet.done);
  const config = CONFIDENCE_CONFIG[currentConfidence];

  const handleStatusChange = useCallback(
    (value: string) => {
      onStatusChange(bullet.id, value as ConfidenceState);
    },
    [bullet.id, onStatusChange]
  );

  const hasNotes = bullet.comment && bullet.comment.trim().length > 0;

  return (
    <div
      id={`bullet-${bullet.id}`}
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
        'bg-card hover:bg-muted/50 hover:shadow-sm',
        isHighlighted && 'ring-2 ring-primary bg-primary/5'
      )}
    >
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed">{bullet.bulletText}</p>
        {hasNotes && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            📝 {bullet.comment.slice(0, 50)}
            {bullet.comment.length > 50 ? '...' : ''}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Status Dropdown */}
        <Select value={currentConfidence} onValueChange={handleStatusChange}>
          <SelectTrigger
            className={cn(
              'w-auto min-w-[140px] h-8 text-xs font-medium border rounded-md shadow-sm',
              config.bgColor,
              config.color
            )}
          >
            <SelectValue>
              <span className="flex items-center gap-1.5">
                <span>{config.emoji}</span>
                <span>{config.label}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover border shadow-lg z-50">
            {CONFIDENCE_OPTIONS.map((option) => {
              const optConfig = CONFIDENCE_CONFIG[option];
              return (
                <SelectItem
                  key={option}
                  value={option}
                  className="text-sm cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>{optConfig.emoji}</span>
                    <span>{optConfig.label}</span>
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Notes Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity',
            hasNotes && 'text-primary opacity-100'
          )}
          onClick={() => onOpenNotes(bullet)}
          aria-label="Edit notes"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

export default TopicCard;
