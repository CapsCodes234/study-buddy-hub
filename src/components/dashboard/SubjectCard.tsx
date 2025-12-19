import { Subject, SubjectProgress } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { formatProgress } from '@/lib/progress';
import { BookOpen, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubjectCardProps {
  subject: Subject;
  progress: SubjectProgress;
  className?: string;
}

export const SubjectCard = ({ subject, progress, className }: SubjectCardProps) => {
  const combinedProgress = (progress.syllabusProgress + progress.pastPaperProgress) / 2;

  return (
    <Card className={cn('glass-card overflow-hidden animate-fade-in', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: subject.color }}
          />
          {subject.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center py-2">
          <ProgressRing progress={combinedProgress} size={100} strokeWidth={8}>
            <div className="text-center">
              <span className="text-2xl font-bold">
                {formatProgress(combinedProgress)}
              </span>
            </div>
          </ProgressRing>
        </div>

        <div className="space-y-3">
          {/* Syllabus Progress */}
          <div className="flex items-center gap-3">
            <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Syllabus</span>
                <span className="font-medium">{formatProgress(progress.syllabusProgress)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500 animate-progress-fill"
                  style={{ width: `${progress.syllabusProgress * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {progress.completedBullets} / {progress.totalBullets} topics
              </p>
            </div>
          </div>

          {/* Past Papers Progress */}
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Past Papers</span>
                <span className="font-medium">{formatProgress(progress.pastPaperProgress)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 animate-progress-fill"
                  style={{ width: `${progress.pastPaperProgress * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {progress.completedPapers} / {progress.totalPapers} papers
              </p>
            </div>
          </div>
        </div>

        {/* Red bullets preview */}
        {progress.redBullets.length > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-status-red mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Needs attention</span>
            </div>
            <ul className="space-y-1">
              {progress.redBullets.map(bullet => (
                <li
                  key={bullet.id}
                  className="text-xs text-muted-foreground truncate"
                >
                  {bullet.subtopic}: {bullet.bulletText}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
