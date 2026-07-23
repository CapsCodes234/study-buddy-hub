/**
 * Main Index Page - Route Handler
 * Handles all main routes and displays appropriate content
 */

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Dashboard } from '@/components/dashboard/Dashboard';
import { Header } from '@/components/layout/Header';
import { OnboardingModal } from '@/components/layout/OnboardingModal';
import { MilestoneToast } from '@/components/motivation/MilestoneToast';
import { WeeklyReflection } from '@/components/reflection/WeeklyReflection';
import { Settings } from '@/components/settings/Settings';
import { SubjectSelectionGate } from '@/components/subjects/SubjectSelectionGate';
import { SubjectsSyncErrorBanner } from '@/components/subjects/SubjectsSyncErrorBanner';
import { useAuth } from '@/features/auth/useAuth';
import { useAppState } from '@/hooks/useAppState';
import { useResolvedSubjects } from '@/features/subjects/useResolvedSubjects';
import { useReminders } from '@/hooks/useReminders';
import { loadStreakData, recordActivity } from '@/lib/streak';
import { NavigationFilters } from '@/types';
import { StreakData } from '@/types/reminders';
import { useQueryClient } from '@tanstack/react-query';

const SubjectOverview = lazy(() =>
  import('@/pages/subjects/SubjectOverview').then((module) => ({
    default: module.default,
  })),
);
const SubjectSyllabus = lazy(() =>
  import('@/pages/subjects/SubjectSyllabus').then((module) => ({
    default: module.default,
  })),
);
const SubjectPapers = lazy(() =>
  import('@/pages/subjects/SubjectPapers').then((module) => ({
    default: module.default,
  })),
);
const Exams = lazy(() => import('@/pages/Exams'));

const Index = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, profileLoading, completeOnboarding } = useAuth();
  const queryClient = useQueryClient();

  const [streakData, setStreakData] = useState<StreakData>(() =>
    loadStreakData(),
  );
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [onboardingSaving, setOnboardingSaving] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  const {
    upcomingReminders,
    dismissReminder,
    snoozeReminder,
  } = useReminders();

  const {
    state: localState,
    isLoading: isLocalLoading,
    addBullet,
    updateBullet,
    deleteBullet,
    bulkUpdateBullets,
    addBullets,
    addPastPaper,
    updatePastPaper,
    deletePastPaper,
    updateSettings,
    importState,
    clearAllData,
    clearSubjectData,
    checkDataIntegrity,
    repairAllDuplicates,
  } = useAppState();

  // Resolve subjects from server with fallback to local
  const {
    resolvedSubjects,
    isLoading: isResolving,
    isError: isSyncError,
    shouldShowSelectionGate,
    shouldShowSyncError,
    hasGenuineFallback,
  } = useResolvedSubjects(localState);

  // Combine local state with resolved subjects for display
  const displayState = useMemo(() => ({
    ...localState,
    subjects: resolvedSubjects,
  }), [localState, resolvedSubjects]);

  const isLoading = isLocalLoading || isResolving;

  const currentView = useMemo(() => {
    const path = location.pathname;

    if (path === '/settings') {
      return 'settings';
    }

    if (path === '/exams') {
      return 'exams';
    }

    if (subjectId) {
      const subject = displayState.subjects.find((item) => item.id === subjectId);

      if (!subject) {
        return 'not_found';
      }

      if (path.endsWith('/syllabus')) {
        return 'subject_syllabus';
      }

      if (path.endsWith('/papers')) {
        return 'subject_papers';
      }

      return 'subject_overview';
    }

    return 'dashboard';
  }, [location.pathname, subjectId, displayState.subjects]);

  const currentSubject = useMemo(() => {
    if (subjectId) {
      return displayState.subjects.find((subject) => subject.id === subjectId);
    }

    return null;
  }, [subjectId, displayState.subjects]);

  const handleNavigate = useCallback(
    (filters: NavigationFilters) => {
      if (filters.tab === 'dashboard') {
        navigate('/');
      } else if (filters.tab === 'settings') {
        navigate('/settings');
      } else if (filters.tab === 'syllabus') {
        if (filters.bulletFilters?.subjectId) {
          const path = filters.highlightId
            ? `/${filters.bulletFilters.subjectId}/syllabus?highlight=${filters.highlightId}`
            : `/${filters.bulletFilters.subjectId}/syllabus`;

          navigate(path);
        } else {
          const firstSubject = displayState.subjects[0];

          if (firstSubject) {
            navigate(`/${firstSubject.id}/syllabus`);
          }
        }
      } else if (filters.tab === 'papers') {
        if (filters.paperFilters?.subjectId) {
          const path = filters.highlightId
            ? `/${filters.paperFilters.subjectId}/papers?highlight=${filters.highlightId}`
            : `/${filters.paperFilters.subjectId}/papers`;

          navigate(path);
        } else {
          const firstSubject = displayState.subjects[0];

          if (firstSubject) {
            navigate(`/${firstSubject.id}/papers`);
          }
        }
      }
    },
    [navigate, displayState.subjects],
  );

  const handleActivityRecorded = useCallback(() => {
    const newStreakData = recordActivity();
    setStreakData(newStreakData);
  }, []);

  const handleUpdateBullet = useCallback(
    (id: string, updates: Partial<typeof localState.bullets[0]>) => {
      updateBullet(id, updates);

      if (updates.done || updates.status === 'Green') {
        handleActivityRecorded();
      }
    },
    [handleActivityRecorded, updateBullet],
  );

  const handleUpdatePaper = useCallback(
    (id: string, updates: Partial<typeof localState.pastPapers[0]>) => {
      updatePastPaper(id, updates);

      if (updates.completed) {
        handleActivityRecorded();
      }
    },
    [handleActivityRecorded, updatePastPaper],
  );

  const handleOnboardingComplete = useCallback(async () => {
    if (onboardingSaving) {
      return;
    }

    setOnboardingSaving(true);
    setOnboardingError(null);

    try {
      await completeOnboarding();

      // Compatibility only: the database profile remains authoritative.
      updateSettings({ hasCompletedOnboarding: true });
    } catch (error) {
      setOnboardingError(
        error instanceof Error
          ? error.message
          : 'Unable to complete onboarding. Please try again.',
      );
    } finally {
      setOnboardingSaving(false);
    }
  }, [completeOnboarding, onboardingSaving, updateSettings]);

  useEffect(() => {
    if (currentView === 'not_found' && subjectId) {
      navigate('/');
    }
  }, [currentView, navigate, subjectId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const shouldShowOnboarding =
    !profileLoading &&
    profile !== null &&
    profile.onboarding_status !== 'completed';

  const handleRetrySync = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['subjects', 'user'] });
  }, [queryClient]);

  const handleSelectionComplete = useCallback(() => {
    // Invalidate user subjects query to refresh
    queryClient.invalidateQueries({ queryKey: ['subjects', 'user'] });
  }, [queryClient]);

  // Show subject selection gate if user has zero subjects
  if (shouldShowSelectionGate) {
    return (
      <div className="min-h-screen bg-background">
        <Header subjects={displayState.subjects} streakData={streakData} />
        <SubjectSelectionGate
          bullets={localState.bullets}
          pastPapers={localState.pastPapers}
          onComplete={handleSelectionComplete}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header subjects={displayState.subjects} streakData={streakData} />

      <main className="container mx-auto px-4 py-6">
        {shouldShowSyncError && (
          <SubjectsSyncErrorBanner
            hasGenuineFallback={hasGenuineFallback}
            onRetry={handleRetrySync}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            subjects={displayState.subjects}
            bullets={displayState.bullets}
            pastPapers={displayState.pastPapers}
            aiFeaturesEnabled={displayState.settings.aiFeaturesEnabled}
            onNavigate={handleNavigate}
            upcomingReminders={upcomingReminders}
            onDismissReminder={dismissReminder}
            onSnoozeReminder={snoozeReminder}
            onOpenReflection={() => setReflectionOpen(true)}
          />
        )}

        {currentView === 'settings' && (
          <Settings
            state={displayState}
            onUpdateSettings={updateSettings}
            onImportState={importState}
            onClearData={clearAllData}
            onClearSubjectData={clearSubjectData}
            onCheckIntegrity={checkDataIntegrity}
            onRepairDuplicates={repairAllDuplicates}
          />
        )}

        {currentView === 'exams' && (
          <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
            <Exams subjects={displayState.subjects} />
          </Suspense>
        )}

        {currentView === 'subject_overview' && currentSubject && (
          <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
            <SubjectOverview
              subject={currentSubject}
              bullets={displayState.bullets}
              pastPapers={displayState.pastPapers}
              allSubjects={displayState.subjects}
              aiFeaturesEnabled={displayState.settings.aiFeaturesEnabled}
              onUpdateBullet={handleUpdateBullet}
              onAddBullets={addBullets}
            />
          </Suspense>
        )}

        {currentView === 'subject_syllabus' && currentSubject && (
          <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
            <SubjectSyllabus
              subject={currentSubject}
              bullets={displayState.bullets}
              onUpdateBullet={handleUpdateBullet}
            />
          </Suspense>
        )}

        {currentView === 'subject_papers' && currentSubject && (
          <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
            <SubjectPapers
              subject={currentSubject}
              pastPapers={displayState.pastPapers}
              onAddPaper={addPastPaper}
              onUpdatePaper={handleUpdatePaper}
              onDeletePaper={deletePastPaper}
            />
          </Suspense>
        )}
      </main>

      <OnboardingModal
        open={shouldShowOnboarding}
        onComplete={handleOnboardingComplete}
        completing={onboardingSaving}
        errorMessage={onboardingError}
      />

      <MilestoneToast
        subjects={displayState.subjects}
        bullets={displayState.bullets}
        pastPapers={displayState.pastPapers}
        streakDays={streakData.currentStreak}
      />

      <WeeklyReflection
        open={reflectionOpen}
        onOpenChange={setReflectionOpen}
        subjects={displayState.subjects}
      />
    </div>
  );
};

export default Index;
