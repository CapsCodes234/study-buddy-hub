/**
 * Confidence Toggle Component
 * 4-state confidence toggle: Not Started → In Progress → Confident → Needs Revision
 */

import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ConfidenceState, CONFIDENCE_CONFIG } from '@/types/reminders';

interface ConfidenceToggleProps {
  value: ConfidenceState;
  onChange: (value: ConfidenceState) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  disabled?: boolean;
  className?: string;
}

const CONFIDENCE_ORDER: ConfidenceState[] = [
  'not_started',
  'in_progress',
  'confident',
  'needs_revision',
];

export const ConfidenceToggle = memo(function ConfidenceToggle({
  value,
  onChange,
  size = 'md',
  showLabel = false,
  disabled = false,
  className,
}: ConfidenceToggleProps) {
  const config = CONFIDENCE_CONFIG[value];

  const handleClick = useCallback(() => {
    const currentIndex = CONFIDENCE_ORDER.indexOf(value);
    const nextIndex = (currentIndex + 1) % CONFIDENCE_ORDER.length;
    onChange(CONFIDENCE_ORDER[nextIndex]);
  }, [value, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const sizeClasses = {
    sm: 'h-7 px-2 text-xs gap-1',
    md: 'h-9 px-3 text-sm gap-1.5',
    lg: 'h-10 px-4 text-base gap-2',
  };

  const emojiSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            'transition-all duration-150 ease-out font-medium border',
            sizeClasses[size],
            config.bgColor,
            config.color,
            'hover:opacity-80 active:scale-95',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          aria-label={`Confidence: ${config.label}. Click to change.`}
        >
          <span className={emojiSizes[size]}>{config.emoji}</span>
          {showLabel && <span>{config.label}</span>}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium">{config.label}</p>
        <p className="text-xs text-muted-foreground">{config.description}</p>
        <p className="text-xs text-muted-foreground mt-1 italic">
          Click to cycle to next state
        </p>
      </TooltipContent>
    </Tooltip>
  );
});

// Status explanation component for subject pages
interface ConfidenceExplanationProps {
  className?: string;
  collapsible?: boolean;
}

export function ConfidenceExplanation({ className, collapsible = true }: ConfidenceExplanationProps) {
  return (
    <div className={cn('p-4 rounded-lg bg-muted/50 border border-border/50', className)}>
      <h4 className="text-sm font-medium mb-3">Confidence States</h4>
      <div className="grid grid-cols-2 gap-3 text-xs">
        {CONFIDENCE_ORDER.map((state) => {
          const config = CONFIDENCE_CONFIG[state];
          return (
            <div key={state} className="flex items-start gap-2">
              <span className="text-base leading-none">{config.emoji}</span>
              <div>
                <p className={cn('font-medium', config.color)}>{config.label}</p>
                <p className="text-muted-foreground">{config.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Convert legacy status to confidence state
export function statusToConfidence(status: string | null, done: boolean): ConfidenceState {
  if (done) {
    if (status === 'Green') return 'confident';
    return 'needs_revision';
  }
  
  switch (status) {
    case 'Green':
      return 'confident';
    case 'Amber':
      return 'in_progress';
    case 'Red':
      return 'not_started';
    default:
      return 'not_started';
  }
}

// Convert confidence state to legacy format
export function confidenceToStatus(confidence: ConfidenceState): { status: string | null; done: boolean } {
  switch (confidence) {
    case 'confident':
      return { status: 'Green', done: true };
    case 'in_progress':
      return { status: 'Amber', done: false };
    case 'needs_revision':
      return { status: 'Amber', done: true };
    case 'not_started':
    default:
      return { status: null, done: false };
  }
}
