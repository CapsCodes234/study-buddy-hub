import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Target, AlertCircle } from 'lucide-react';
import { AIDailyFocus, AIError } from '@/ai/types';
import { generateDailyFocus, prepareDataSnapshot } from '@/ai/summarizer';
import { useToast } from '@/hooks/use-toast';
import { Subject, Bullet, PastPaper } from '@/types';
import { cn } from '@/lib/utils';

interface AIDailyFocusProps {
  subjects: Subject[];
  bullets: Bullet[];
  pastPapers: PastPaper[];
}

export const AIDailyFocus = ({
  subjects,
  bullets,
  pastPapers,
}: AIDailyFocusProps) => {
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState<AIDailyFocus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setFocus(null);

    try {
      const snapshot = prepareDataSnapshot(subjects, bullets, pastPapers);
      const result = await generateDailyFocus(snapshot);
      setFocus(result);
    } catch (err) {
      const errorMessage = err instanceof AIError
        ? err.message
        : 'Failed to generate daily focus. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-status-red/10 border-status-red/30 text-status-red';
      case 'medium':
        return 'bg-status-amber/10 border-status-amber/30 text-status-amber';
      case 'low':
        return 'bg-status-green/10 border-status-green/30 text-status-green';
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            AI Daily Focus Assistant
          </CardTitle>
          {!focus && !loading && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={loading}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Get Focus
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Generating focus recommendations...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <AlertCircle className="h-5 w-5 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={handleGenerate}>
              Try Again
            </Button>
          </div>
        )}

        {!focus && !loading && !error && (
          <div className="text-center py-6">
            <Target className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">
              Get AI-powered recommendations for what to focus on today.
            </p>
            <Button onClick={handleGenerate}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Focus
            </Button>
          </div>
        )}

        {focus && (
          <div className="space-y-4">
            {focus.overallAdvice && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm leading-relaxed">{focus.overallAdvice}</p>
              </div>
            )}

            {focus.focusItems.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Focus Items</h4>
                {focus.focusItems.map((item, index) => (
                  <Card
                    key={index}
                    className={cn(
                      'border',
                      getPriorityColor(item.priority)
                    )}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                item.priority === 'high' && 'border-status-red/50 text-status-red',
                                item.priority === 'medium' && 'border-status-amber/50 text-status-amber',
                                item.priority === 'low' && 'border-status-green/50 text-status-green'
                              )}
                            >
                              {item.priority.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium">{item.subject}</span>
                          </div>
                          <p className="text-sm font-medium mb-1">{item.topic}</p>
                          <p className="text-xs text-muted-foreground mb-2">{item.reason}</p>
                          <p className="text-sm">{item.action}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={handleGenerate}>
                <Sparkles className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

