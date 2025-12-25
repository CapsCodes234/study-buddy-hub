/**
 * Main Index Page - Route Handler
 * Handles all main routes and displays appropriate content
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '@/hooks/useAppState';
import { useReminders } from '@/hooks/useReminders';
import { Header } from '@/components/layout/Header';
import { OnboardingModal } from '@/components/layout/OnboardingModal';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Settings } from '@/components/settings/Settings';
import { SubjectOverview } from '@/pages/subjects/SubjectOverview';
import { SubjectSyllabus } from '@/pages/subjects/SubjectSyllabus';
import { SubjectPapers } from '@/pages/subjects/SubjectPapers';
import { MilestoneToast } from '@/components/motivation/MilestoneToast';
import { WeeklyReflection } from '@/components/reflection/WeeklyReflection';
import { NavigationFilters } from '@/types';
import { StreakData } from '@/types/reminders';
import { loadStreakData, recordActivity } from '@/lib/streak';

const Index = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [streakData, setStreakData] = useState<StreakData>(() => loadStreakData());
  const [reflectionOpen, setReflectionOpen] = useState(false);
  
  // Reminders hook for notifications
  const {
    upcomingReminders,
    dismissReminder,
    snoozeReminder,
  } = useReminders();
  const {
    state,
    isLoading,
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
  } = useAppState();

  // Determine current view based on route
  const currentView = useMemo(() => {
    const path = location.pathname;

    if (path === '/settings') {
      return 'settings';
    }

    if (subjectId) {
      const subject = state.subjects.find((s) => s.id === subjectId);
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
  }, [location.pathname, subjectId, state.subjects]);

  // Get current subject if on a subject page
  const currentSubject = useMemo(() => {
    if (subjectId) {
      return state.subjects.find((s) => s.id === subjectId);
    }
    return null;
  }, [subjectId, state.subjects]);

  // Handle navigation from dashboard cards
  const handleNavigate = useCallback(
    (filters: NavigationFilters) => {
      if (filters.tab === 'dashboard') {
        navigate('/');
      } else if (filters.tab === 'settings') {
        navigate('/settings');
      } else if (filters.tab === 'syllabus' && filters.bulletFilters?.subjectId) {
        const path = filters.highlightId
          ? `/${filters.bulletFilters.subjectId}/syllabus?highlight=${filters.highlightId}`
          : `/${filters.bulletFilters.subjectId}/syllabus`;
        navigate(path);
      } else if (filters.tab === 'papers' && filters.paperFilters?.subjectId) {
        const path = filters.highlightId
          ? `/${filters.paperFilters.subjectId}/papers?highlight=${filters.highlightId}`
          : `/${filters.paperFilters.subjectId}/papers`;
        navigate(path);
      }
    },
    [navigate]
  );

  // Track activity for streak
  const handleActivityRecorded = useCallback(() => {
    const newStreakData = recordActivity();
    setStreakData(newStreakData);
  }, []);

  // Wrap update functions to record activity
  const handleUpdateBullet = useCallback(
    (id: string, updates: Partial<typeof state.bullets[0]>) => {
      updateBullet(id, updates);
      // Record activity when marking something done/confident
      if (updates.done || updates.status === 'Green') {
        handleActivityRecorded();
      }
    },
    [updateBullet, handleActivityRecorded]
  );

  const handleUpdatePaper = useCallback(
    (id: string, updates: Partial<typeof state.pastPapers[0]>) => {
      updatePastPaper(id, updates);
      // Record activity when completing a paper
      if (updates.completed) {
        handleActivityRecorded();
      }
    },
    [updatePastPaper, handleActivityRecorded]
  );

  const handleOnboardingComplete = () => {
    updateSettings({ hasCompletedOnboarding: true });
  };

  // Redirect invalid subject routes
  useEffect(() => {
    if (currentView === 'not_found' && subjectId) {
      navigate('/');
    }
  }, [currentView, subjectId, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header subjects={state.subjects} streakData={streakData} />

      <main className="container mx-auto px-4 py-6">
        {currentView === 'dashboard' && (
          <Dashboard
            subjects={state.subjects}
            bullets={state.bullets}
            pastPapers={state.pastPapers}
            aiFeaturesEnabled={state.settings.aiFeaturesEnabled}
            onNavigate={handleNavigate}
            upcomingReminders={upcomingReminders}
            onDismissReminder={dismissReminder}
            onSnoozeReminder={snoozeReminder}
            onOpenReflection={() => setReflectionOpen(true)}
          />
        )}

        {currentView === 'settings' && (
          <Settings
            state={state}
            onUpdateSettings={updateSettings}
            onImportState={importState}
            onClearData={clearAllData}
          />
        )}

        {currentView === 'subject_overview' && currentSubject && (
          <SubjectOverview
            subject={currentSubject}
            bullets={state.bullets}
            pastPapers={state.pastPapers}
            allSubjects={state.subjects}
            aiFeaturesEnabled={state.settings.aiFeaturesEnabled}
            onUpdateBullet={handleUpdateBullet}
            onAddBullets={addBullets}
          />
        )}

        {currentView === 'subject_syllabus' && currentSubject && (
          <SubjectSyllabus
            subject={currentSubject}
            bullets={state.bullets}
            onUpdateBullet={handleUpdateBullet}
          />
        )}

        {currentView === 'subject_papers' && currentSubject && (
          <SubjectPapers
            subject={currentSubject}
            pastPapers={state.pastPapers}
            onAddPaper={addPastPaper}
            onUpdatePaper={handleUpdatePaper}
          />
        )}
      </main>

      <OnboardingModal
        open={!state.settings.hasCompletedOnboarding}
        onComplete={handleOnboardingComplete}
      />

      {/* Milestone celebration toasts */}
      <MilestoneToast
        subjects={state.subjects}
        bullets={state.bullets}
        pastPapers={state.pastPapers}
        streakDays={streakData.currentStreak}
      />

      {/* Weekly reflection modal */}
      <WeeklyReflection
        open={reflectionOpen}
        onOpenChange={setReflectionOpen}
        subjects={state.subjects}
      />
    </div>
  );
};

export default Index;
