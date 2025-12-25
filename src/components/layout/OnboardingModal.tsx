import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Circle, CircleDot, CheckCircle2, Wand2, GraduationCap } from 'lucide-react';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export const OnboardingModal = ({ open, onComplete }: OnboardingModalProps) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="sticky top-0 z-10 bg-background pb-4 border-b">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">Welcome to Study Tracker!</DialogTitle>
          </div>
          <DialogDescription>
            Track your A-level syllabus mastery and past paper practice in one place.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 pb-24">
          {/* R/A/G System */}
          <div>
            <h3 className="font-semibold mb-3">R/A/G Status System</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Mark each syllabus topic based on your confidence level:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-status-red-bg">
                <Circle className="h-4 w-4 text-status-red fill-status-red" />
                <div>
                  <p className="text-sm font-medium">Red</p>
                  <p className="text-xs text-muted-foreground">Not understood / needs study</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-status-amber-bg">
                <CircleDot className="h-4 w-4 text-status-amber" />
                <div>
                  <p className="text-sm font-medium">Amber</p>
                  <p className="text-xs text-muted-foreground">Partially understood / needs practice</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-status-green-bg">
                <CheckCircle2 className="h-4 w-4 text-status-green" />
                <div>
                  <p className="text-sm font-medium">Green</p>
                  <p className="text-xs text-muted-foreground">Confident / ready for exam</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Extraction */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">AI Extraction (Optional)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              You can enable AI-powered syllabus extraction in Settings. 
              This allows you to upload PDF syllabi and automatically extract topics.
              AI extraction is disabled by default.
            </p>
          </div>

          {/* Getting Started */}
          <div>
            <h3 className="font-semibold mb-2">Getting Started</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Go to the <strong>Syllabus</strong> tab and import your topics via CSV</li>
              <li>Mark each topic with R/A/G status as you study</li>
              <li>Log your past paper practice in the <strong>Papers</strong> tab</li>
              <li>Track your progress on the <strong>Dashboard</strong></li>
            </ol>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 z-10 bg-background pt-4 border-t">
          <Button onClick={onComplete} className="w-full">
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
