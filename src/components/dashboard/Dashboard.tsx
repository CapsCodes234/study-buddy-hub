import { memo, useMemo, useState } from 'react';
import { Subject, Bullet, PastPaper, NavigationFilters } from '@/types';
import { Reminder } from '@/types/reminders';
import { SubjectCard } from './SubjectCard';
import { OverallProgressCard } from './OverallProgressCard';
import { TodaysFocus } from './TodaysFocus';
import { GlobalReadinessScore } from './GlobalReadinessScore';
import { SubjectHealthCard } from './SubjectHealthCard';
import { WeaknessConcentrationMap } from './WeaknessConcentrationMap';
import { PastPaperPerformanceOverview } from './PastPaperPerformanceOverview';
import { StudyMomentumIndicator } from './StudyMomentumIndicator';
import { ExamSimulationCard } from './ExamSimulationCard';
import { NextActionPanel } from './NextActionPanel';
import { YearlyPerformanceCard } from './YearlyPerformanceCard';
import { AIDailyFocusCard } from '@/components/ai/AIDailyFocus';
import { AIStudySummaryModal } from '@/components/ai/AIStudySummaryModal';
import { UpcomingReminders } from '@/components/reminders/UpcomingReminders';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { calculateSubjectProgress, calculateOverallProgress } from '@/lib/progress';
import {
  calculateReadinessScore,
  calculateSubjectHealth,
  calculateWeaknessMap,
  calculateMomentum,
  simulateExamReadiness,
} from '@/lib/insights';
import { GraduationCap, Sparkles, Target } from 'lucide-react';

interface DashboardProps {
  subjects: Subject[];
  bullets: Bullet[];
  pastPapers: PastPaper[];
  aiFeaturesEnabled: boolean;
  onNavigate: (filters: NavigationFilters) => void;
  upcomingReminders?: Reminder[];
  onDismissReminder?: (id: string) => void;
  onSnoozeReminder?: (id: string, minutes: number) => void;
  onOpenReflection?: () => void;
}

export const Dashboard = memo(({ 
  subjects, 
  bullets, 
  pastPapers, 
  aiFeaturesEnabled, 
  onNavigate,
  upcomingReminders = [],
  onDismissReminder,
  onSnoozeReminder,
  onOpenReflection,
}: DashboardProps) => {
  const subjectProgresses = useMemo(() => 
    subjects.map(subject => calculateSubjectProgress(subject, bullets, pastPapers)),
    [subjects, bullets, pastPapers]
  );
  
  const overallProgress = useMemo(() => 
    calculateOverallProgress(subjects, bullets, pastPapers),
    [subjects, bullets, pastPapers]
  );

  // Phase 4: Progress Intelligence calculations
  const readinessScore = useMemo(() =>
    calculateReadinessScore(subjects, bullets, pastPapers),
    [subjects, bullets, pastPapers]
  );

  const subjectHealths = useMemo(() =>
    subjects
      .map(subject => calculateSubjectHealth(subject, bullets, pastPapers))
      .sort((a, b) => b.urgency - a.urgency), // Sort by urgency
    [subjects, bullets, pastPapers]
  );

  const weaknessMap = useMemo(() =>
    calculateWeaknessMap(subjects, bullets),
    [subjects, bullets]
  );

  const momentum = useMemo(() =>
    calculateMomentum(bullets, pastPapers),
    [bullets, pastPapers]
  );

  const examSimulation = useMemo(() =>
    simulateExamReadiness(subjects, bullets, pastPapers),
    [subjects, bullets, pastPapers]
  );

  const hasAnyData = bullets.length > 0 || pastPapers.length > 0;
  const hasSubjects = subjects.length > 0;
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
        <div className="flex flex-col sm:flex-row gap-2">
          {aiFeaturesEnabled && hasAnyData && (
            <Button
              variant="outline"
              onClick={() => setSummaryModalOpen(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate Study Summary
            </Button>
          )}
          {onOpenReflection && (
            <Button
              variant="outline"
              onClick={onOpenReflection}
              className="gap-2"
            >
              <Target className="h-4 w-4" />
              Weekly Reflection
            </Button>
          )}
        </div>
      </div>

      {/* Empty States */}
      {!hasSubjects && (
        <EmptyState
          icon={GraduationCap}
          title="No Subjects Added"
          description="Start by adding subjects to track your A-level progress. You can import syllabus data from the Syllabus tab."
        />
      )}

      {hasSubjects && !hasAnyData && (
        <EmptyState
          icon={GraduationCap}
          title="Welcome to Study Tracker!"
          description="Start by uploading a syllabus PDF or importing CSV data from the Syllabus tab. You can also log your past paper practice in the Papers tab."
          action={{
            label: 'Go to Syllabus',
            onClick: () => onNavigate({ tab: 'syllabus' }),
          }}
        />
      )}

      {/* Tier 1: Baseline-friendly components (always visible when subjects exist) */}
      {hasSubjects && (
        <>
          {/* Phase 4: Global Readiness Score - Top KPI */}
          <GlobalReadinessScore readiness={readinessScore} />

          {/* Phase 4: Study Momentum & Past Paper Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StudyMomentumIndicator momentum={momentum} />
            <PastPaperPerformanceOverview
              subjects={subjects}
              pastPapers={pastPapers}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <YearlyPerformanceCard papers={pastPapers} subjects={subjects} />
          </div>

          {/* Next Action Panel */}
          <NextActionPanel
            subjects={subjects}
            bullets={bullets}
            pastPapers={pastPapers}
            onStartTopic={(bullet) => {
              onNavigate({
                tab: 'syllabus',
                bulletFilters: { subjectId: bullet.subjectId, searchText: '', statusFilter: 'all', hideCompleted: false },
                highlightId: bullet.id,
              });
            }}
            onStartPaper={(paper) => {
              onNavigate({
                tab: 'papers',
                paperFilters: { subjectId: paper.subjectId, year: null, completionFilter: 'all' },
                highlightId: paper.id,
              });
            }}
          />

          {/* Upcoming Reminders */}
          {upcomingReminders.length > 0 && onDismissReminder && onSnoozeReminder && (
            <UpcomingReminders
              reminders={upcomingReminders}
              onDismiss={onDismissReminder}
              onSnooze={onSnoozeReminder}
            />
          )}
        </>
      )}

      {/* Tier 2: Data-dependent components (only when real data exists) */}
      {hasAnyData && (
        <>
          {/* Phase 4: Subject Health Cards */}
          {subjectHealths.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Subject Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjectHealths.map((health) => (
                  <SubjectHealthCard
                    key={health.subject.id}
                    health={health}
                    onClick={() => onNavigate({
                      tab: 'syllabus',
                      bulletFilters: {
                        subjectId: health.subject.id,
                        searchText: '',
                        statusFilter: 'all',
                        hideCompleted: false,
                      },
                    })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Phase 4: Weakness Concentration Map */}
          {weaknessMap.length > 0 && (
            <WeaknessConcentrationMap
              weakAreas={weaknessMap}
              onNavigate={onNavigate}
            />
          )}

          {/* Phase 4: Exam Simulation Card */}
          <ExamSimulationCard simulation={examSimulation} />

          {/* AI Daily Focus Assistant */}
          {aiFeaturesEnabled && (
            <AIDailyFocusCard
              subjects={subjects}
              bullets={bullets}
              pastPapers={pastPapers}
            />
          )}

          {/* Today's Focus - Command Center */}
          <TodaysFocus 
            bullets={bullets}
            pastPapers={pastPapers}
            subjects={subjects}
            onNavigate={onNavigate}
          />
          
          {/* Overall Progress */}
          <OverallProgressCard progress={overallProgress} />

          {/* Legacy Subject Cards (kept for backward compatibility) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject, index) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                progress={subjectProgresses[index]}
                onNavigate={onNavigate}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              />
            ))}
          </div>
        </>
      )}

      {/* AI Study Summary Modal */}
      {aiFeaturesEnabled && (
        <AIStudySummaryModal
          open={summaryModalOpen}
          onOpenChange={setSummaryModalOpen}
          subjects={subjects}
          bullets={bullets}
          pastPapers={pastPapers}
        />
      )}
    </div>
  );
});

Dashboard.displayName = 'Dashboard';
