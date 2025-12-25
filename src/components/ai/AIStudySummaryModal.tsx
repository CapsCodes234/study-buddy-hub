import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { AIStudySummary, AIError } from '@/ai/types';
import { generateStudySummary, prepareDataSnapshot } from '@/ai/summarizer';
import { useToast } from '@/hooks/use-toast';
import { Subject, Bullet, PastPaper } from '@/types';

interface AIStudySummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  bullets: Bullet[];
  pastPapers: PastPaper[];
}

export const AIStudySummaryModal = ({
  open,
  onOpenChange,
  subjects,
  bullets,
  pastPapers,
}: AIStudySummaryModalProps) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<AIStudySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const snapshot = prepareDataSnapshot(subjects, bullets, pastPapers);
      const result = await generateStudySummary(snapshot);
      setSummary(result);
    } catch (err) {
      const errorMessage = err instanceof AIError
        ? err.message
        : 'Failed to generate study summary. Please try again.';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        <DialogHeader className="sticky top-0 z-10 bg-background pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            AI Study Summary
          </DialogTitle>
          <DialogDescription>
            Get AI-powered insights about your study progress. This is advisory only and does not modify your data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 pb-24">
          {!summary && !error && !loading && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">
                Generate an AI-powered analysis of your study progress, including recommendations and areas for improvement.
              </p>
              <Button onClick={handleGenerate} size="lg">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Study Summary
              </Button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Analyzing your study data...</p>
            </div>
          )}

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive mb-1">Error</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={handleGenerate}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {summary && (
            <div className="space-y-4">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{summary.summary}</p>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-status-green" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {summary.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary font-medium shrink-0">{index + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Weaknesses */}
              {summary.weaknesses.length > 0 && (
                <Card className="border-status-red/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-status-red" />
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {summary.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Badge variant="outline" className="border-status-red/50 text-status-red shrink-0 mt-0.5">
                            {index + 1}
                          </Badge>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Strengths */}
              {summary.strengths.length > 0 && (
                <Card className="border-status-green/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-status-green" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {summary.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Badge variant="outline" className="border-status-green/50 text-status-green shrink-0 mt-0.5">
                            {index + 1}
                          </Badge>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

            </div>
          )}
        </div>

        <DialogFooter className="sticky bottom-0 z-10 bg-background pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {summary && (
            <Button onClick={handleGenerate} disabled={loading}>
              <Sparkles className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

