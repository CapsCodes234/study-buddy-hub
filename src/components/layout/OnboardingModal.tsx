import {
  CheckCircle2,
  Circle,
  CircleDot,
  GraduationCap,
  Loader2,
  Wand2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => Promise<void> | void;
  completing?: boolean;
  errorMessage?: string | null;
}

export const OnboardingModal = ({
  open,
  onComplete,
  completing = false,
  errorMessage = null,
}: OnboardingModalProps) => {
  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        className="max-w-lg [&>button]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">
              Welcome to Study Tracker!
            </DialogTitle>
          </div>
          <DialogDescription>
            Track your A-level syllabus mastery and past paper practice in one
            place.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div>
            <h3 className="mb-3 font-semibold">R/A/G Status System</h3>
            <p className="mb-3 text-sm text-muted-foreground">
              Mark each syllabus topic based on your confidence level:
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-lg bg-status-red-bg p-2">
                <Circle className="h-4 w-4 fill-status-red text-status-red" />
                <div>
                  <p className="text-sm font-medium">Red</p>
                  <p className="text-xs text-muted-foreground">
                    Not understood / needs study
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-status-amber-bg p-2">
                <CircleDot className="h-4 w-4 text-status-amber" />
                <div>
                  <p className="text-sm font-medium">Amber</p>
                  <p className="text-xs text-muted-foreground">
                    Partially understood / needs practice
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-status-green-bg p-2">
                <CheckCircle2 className="h-4 w-4 text-status-green" />
                <div>
                  <p className="text-sm font-medium">Green</p>
                  <p className="text-xs text-muted-foreground">
                    Confident / ready for exam
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">
                AI Extraction (Optional)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              You can enable AI-powered syllabus extraction in Settings. This
              allows you to upload PDF syllabi and automatically extract topics.
              AI extraction is disabled by default.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Getting Started</h3>
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              <li>
                Go to the <strong>Syllabus</strong> tab and import your topics
                via CSV
              </li>
              <li>Mark each topic with R/A/G status as you study</li>
              <li>
                Log your past paper practice in the <strong>Papers</strong> tab
              </li>
              <li>
                Track your progress on the <strong>Dashboard</strong>
              </li>
            </ol>
          </div>

          {errorMessage ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              void onComplete();
            }}
            disabled={completing}
            className="w-full sm:w-auto"
          >
            {completing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {completing ? 'Saving…' : 'Get Started'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
