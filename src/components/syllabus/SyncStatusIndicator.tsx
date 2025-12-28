/**
 * Sync Status Indicator
 * Shows pending sync status with visual indicator
 */

import { memo, useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getSyncQueue, getPendingCount } from '@/lib/syncQueue';

interface SyncStatusIndicatorProps {
  className?: string;
  onSyncNow?: () => void;
}

export const SyncStatusIndicator = memo(function SyncStatusIndicator({
  className,
  onSyncNow,
}: SyncStatusIndicatorProps) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Update pending count
    const updateCount = () => {
      setPendingCount(getPendingCount());
    };

    updateCount();

    // Listen for storage changes (from other tabs)
    window.addEventListener('storage', updateCount);

    // Poll periodically
    const interval = setInterval(updateCount, 5000);

    return () => {
      window.removeEventListener('storage', updateCount);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show if everything is synced and online
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 px-2 gap-1.5',
            !isOnline && 'text-destructive',
            pendingCount > 0 && isOnline && 'text-amber-500',
            className
          )}
          onClick={onSyncNow}
        >
          {!isOnline ? (
            <CloudOff className="h-4 w-4" />
          ) : pendingCount > 0 ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Cloud className="h-4 w-4" />
          )}
          {pendingCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 min-w-[20px] px-1.5 text-xs"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {!isOnline ? (
          <p>You're offline. Changes will sync when you reconnect.</p>
        ) : pendingCount > 0 ? (
          <p>
            {pendingCount} change{pendingCount !== 1 ? 's' : ''} pending sync
          </p>
        ) : (
          <p>All changes synced</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
});

export default SyncStatusIndicator;
