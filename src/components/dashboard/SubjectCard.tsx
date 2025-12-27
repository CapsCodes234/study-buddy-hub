import { memo, forwardRef } from 'react';
import { Subject, SubjectProgress, NavigationFilters } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { formatProgress } from '@/lib/progress';
import { BookOpen, FileText, AlertCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubjectCardProps {
  subject: Subject;
  progress: SubjectProgress;
  className?: string;
  style?: React.CSSProperties;
  onNavigate: (filters: NavigationFilters) => void;
}

export const SubjectCard = memo(forwardRef<HTMLDivElement, SubjectCardProps>(({ subject, progress, className, style, onNavigate }, ref) => {
  const combinedProgress = (progress.syllabusProgress + progress.pastPaperProgress) / 2;

  const handleRedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate({
      tab: 'syllabus',
      bulletFilters: {
        subjectId: subject.id,
        searchText: '',
        statusFilter: 'Red',
        hideCompleted: false,
      },
    });
  };

  const handleSyllabusClick = () => {
    onNavigate({
      tab: 'syllabus',
      bulletFilters: {
        subjectId: subject.id,
        searchText: '',
        statusFilter: 'all',
        hideCompleted: false,
      },
    });
  };

  const handlePapersClick = () => {
    onNavigate({
      tab: 'papers',
      paperFilters: {
        subjectId: subject.id,
        year: null,
        completionFilter: 'all',
      },
    });
  };

  return (
    <Card ref={ref} className={cn('glass-card overflow-hidden', className)} style={style}>
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
          <button
            onClick={handleSyllabusClick}
            className="w-full flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Syllabus</span>
                <span className="font-medium">{formatProgress(progress.syllabusProgress)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${progress.syllabusProgress * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {progress.completedBullets} / {progress.totalBullets} topics
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Past Papers Progress */}
          <button
            onClick={handlePapersClick}
            className="w-full flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Past Papers</span>
                <span className="font-medium">{formatProgress(progress.pastPaperProgress)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress.pastPaperProgress * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {progress.completedPapers} / {progress.totalPapers} papers
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Red bullets preview */}
        {progress.redBullets.length > 0 && (
          <button
            onClick={handleRedClick}
            className="w-full pt-3 border-t border-border text-left hover:bg-status-red/5 -mx-2 px-2 pb-2 rounded-b-lg transition-colors group"
          >
            <div className="flex items-center gap-2 text-sm text-status-red mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Needs attention</span>
              <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
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
          </button>
        )}
      </CardContent>
    </Card>
  );
}));

SubjectCard.displayName = 'SubjectCard';
