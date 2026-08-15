/**
 * SubjectsSyncErrorBanner Component
 * 
 * Displays a non-blocking error banner when server sync fails.
 * Shows legacy fallback when available, with retry option.
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SubjectsSyncErrorBannerProps {
  hasGenuineFallback: boolean;
  onRetry?: () => void;
}

export function SubjectsSyncErrorBanner({
  hasGenuineFallback,
  onRetry,
}: SubjectsSyncErrorBannerProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Unable to sync subjects</AlertTitle>
      <AlertDescription className="mt-2">
        {hasGenuineFallback ? (
          <>
            Showing your saved local recovery subjects while we reconnect to the server.
            Your local study data remains safe. Retry when the connection is available.
          </>
        ) : (
          <>
            Unable to load your cloud subject selection. Your local study data remains safe.
            Retry when the connection is available.
          </>
        )}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
