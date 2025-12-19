import { Subject, Bullet, PastPaper } from '@/types';
import { SubjectCard } from './SubjectCard';
import { OverallProgressCard } from './OverallProgressCard';
import { calculateSubjectProgress, calculateOverallProgress } from '@/lib/progress';
import { GraduationCap } from 'lucide-react';

interface DashboardProps {
  subjects: Subject[];
  bullets: Bullet[];
  pastPapers: PastPaper[];
}

export const Dashboard = ({ subjects, bullets, pastPapers }: DashboardProps) => {
  const subjectProgresses = subjects.map(subject =>
    calculateSubjectProgress(subject, bullets, pastPapers)
  );
  const overallProgress = calculateOverallProgress(subjects, bullets, pastPapers);

  const hasAnyData = bullets.length > 0 || pastPapers.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Study Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Track your A-level progress across all subjects
          </p>
        </div>
      </div>

      {!hasAnyData && (
        <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Welcome to Study Tracker!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start by uploading a syllabus PDF or importing CSV data from the Syllabus tab.
            You can also log your past paper practice in the Papers tab.
          </p>
        </div>
      )}

      {hasAnyData && (
        <>
          <OverallProgressCard progress={overallProgress} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject, index) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                progress={subjectProgresses[index]}
                className="animate-fade-in"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
