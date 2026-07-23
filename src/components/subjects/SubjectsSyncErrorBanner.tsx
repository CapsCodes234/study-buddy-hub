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
            Showing your local subjects while we reconnect to the server.
            Your data is safe and will sync when connection is restored.
          </>
        ) : (
          <>
            We couldn't load your subjects from the server. Please check your
            internet connection and try again.
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
