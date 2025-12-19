import { useState } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { Navigation, Tab } from '@/components/layout/Navigation';
import { OnboardingModal } from '@/components/layout/OnboardingModal';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { SyllabusTable } from '@/components/syllabus/SyllabusTable';
import { PastPapers } from '@/components/papers/PastPapers';
import { Settings } from '@/components/settings/Settings';

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
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

  const handleOnboardingComplete = () => {
    updateSettings({ hasCompletedOnboarding: true });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="container mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            subjects={state.subjects}
            bullets={state.bullets}
            pastPapers={state.pastPapers}
          />
        )}

        {activeTab === 'syllabus' && (
          <SyllabusTable
            bullets={state.bullets}
            subjects={state.subjects}
            aiEnabled={state.settings.aiExtractionEnabled}
            onUpdateBullet={updateBullet}
            onDeleteBullet={deleteBullet}
            onBulkUpdate={bulkUpdateBullets}
            onImport={(bullets) => addBullets(bullets)}
          />
        )}

        {activeTab === 'papers' && (
          <PastPapers
            papers={state.pastPapers}
            subjects={state.subjects}
            bullets={state.bullets}
            onAddPaper={addPastPaper}
            onUpdatePaper={updatePastPaper}
            onDeletePaper={deletePastPaper}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            state={state}
            onUpdateSettings={updateSettings}
            onImportState={importState}
            onClearData={clearAllData}
          />
        )}
      </main>

      <OnboardingModal
        open={!state.settings.hasCompletedOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
};

export default Index;
