import { useState, useCallback, useEffect } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { Navigation, Tab } from '@/components/layout/Navigation';
import { OnboardingModal } from '@/components/layout/OnboardingModal';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { SyllabusTable } from '@/components/syllabus/SyllabusTable';
import { PastPapers } from '@/components/papers/PastPapers';
import { Settings } from '@/components/settings/Settings';
import { NavigationFilters, BulletFilters, PaperFilters } from '@/types';

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [bulletFilters, setBulletFilters] = useState<BulletFilters>({
    subjectId: null,
    searchText: '',
    statusFilter: 'all',
    hideCompleted: false,
  });
  const [paperFilters, setPaperFilters] = useState<PaperFilters>({
    subjectId: null,
    year: null,
    completionFilter: 'all',
  });
  const [highlightId, setHighlightId] = useState<string | undefined>();
  
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

  // Handle deep navigation from dashboard
  const handleNavigate = useCallback((filters: NavigationFilters) => {
    setActiveTab(filters.tab);
    
    if (filters.bulletFilters) {
      setBulletFilters(filters.bulletFilters);
    }
    
    if (filters.paperFilters) {
      setPaperFilters(filters.paperFilters);
    }
    
    if (filters.highlightId) {
      setHighlightId(filters.highlightId);
      // Clear highlight after a delay
      setTimeout(() => setHighlightId(undefined), 3000);
    }
  }, []);

  // Clear highlight when changing tabs
  useEffect(() => {
    if (highlightId) {
      // Scroll to highlighted element
      const element = document.getElementById(`bullet-${highlightId}`) || 
                      document.getElementById(`paper-${highlightId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightId, activeTab]);

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
            aiFeaturesEnabled={state.settings.aiFeaturesEnabled}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'syllabus' && (
          <SyllabusTable
            bullets={state.bullets}
            subjects={state.subjects}
            aiEnabled={state.settings.aiExtractionEnabled}
            initialFilters={bulletFilters}
            highlightId={highlightId}
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
            initialFilters={paperFilters}
            highlightId={highlightId}
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
