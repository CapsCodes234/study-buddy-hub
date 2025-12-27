import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

export const ProgressRing = forwardRef<HTMLDivElement, ProgressRingProps>(({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
  children,
}, ref) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress * circumference;

  // Color based on progress
  const getStrokeColor = () => {
    if (progress >= 0.8) return 'hsl(var(--status-green))';
    if (progress >= 0.5) return 'hsl(var(--status-amber))';
    if (progress > 0) return 'hsl(var(--status-red))';
    return 'hsl(var(--muted))';
  };

  return (
    <div ref={ref} className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
});

ProgressRing.displayName = 'ProgressRing';
