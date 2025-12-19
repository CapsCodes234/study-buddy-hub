import { OverallProgress } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { formatProgress } from '@/lib/progress';
import { Trophy, Target, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OverallProgressCardProps {
  progress: OverallProgress;
  className?: string;
}

export const OverallProgressCard = ({ progress, className }: OverallProgressCardProps) => {
  const overallProgress = (progress.averageSyllabusProgress + progress.averagePastPaperProgress) / 2;

  return (
    <Card className={cn('glass-card border-primary/20 animate-fade-in', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" />
          Overall Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ProgressRing progress={overallProgress} size={140} strokeWidth={10}>
            <div className="text-center">
              <span className="text-3xl font-bold">{formatProgress(overallProgress)}</span>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </ProgressRing>

          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Syllabus</span>
              </div>
              <p className="text-2xl font-bold">{formatProgress(progress.averageSyllabusProgress)}</p>
              <p className="text-xs text-muted-foreground">
                {progress.totalCompletedBullets} / {progress.totalBullets} topics
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Papers</span>
              </div>
              <p className="text-2xl font-bold">{formatProgress(progress.averagePastPaperProgress)}</p>
              <p className="text-xs text-muted-foreground">
                {progress.totalCompletedPapers} / {progress.totalPapers} papers
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
