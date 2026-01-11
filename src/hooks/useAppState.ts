import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Bullet, PastPaper, Status } from '@/types';
import { loadData, saveData, generateId, clearAllAppData } from '@/lib/storage';
import { clearCelebratedChaptersForSubject } from '@/lib/chapterCompletion';
import { 
  clearSubjectComponents, 
  deduplicateBullets, 
  deduplicatePastPapers,
  repairDuplicates,
  runIntegrityCheck,
  runIntegrityScan,
  type IntegrityCheckResult
} from '@/lib/dataIntegrity';

export type ClearOption = 'syllabus' | 'papers' | 'both';

export const useAppState = () => {
  const [state, setState] = useState<AppState>(() => loadData());
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount and run integrity scan (once)
  useEffect(() => {
    const data = loadData();
    
    // Run integrity scan on app load to detect and clean duplicates
    const scanResult = runIntegrityScan(
      data.bullets,
      data.pastPapers,
      (cleaned) => {
        setState(prev => ({
          ...prev,
          bullets: cleaned.bullets,
          pastPapers: cleaned.papers,
        }));
      },
      (message) => {
        // Log warning (toast can be added later if needed)
        console.warn(message);
      }
    );
    
    // Update state with cleaned data
    setState(prev => ({
      ...prev,
      bullets: scanResult.bullets,
      pastPapers: scanResult.papers,
    }));
    
    setIsLoading(false);
  }, []);

  // Save data whenever state changes
  useEffect(() => {
    if (!isLoading) {
      saveData(state);
    }
  }, [state, isLoading]);

  // Bullet operations
  const addBullet = useCallback((bullet: Omit<Bullet, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newBullet: Bullet = {
      ...bullet,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    setState(prev => ({
      ...prev,
      bullets: [...prev.bullets, newBullet],
    }));
    return newBullet;
  }, []);

  const updateBullet = useCallback((id: string, updates: Partial<Bullet>) => {
    setState(prev => ({
      ...prev,
      bullets: prev.bullets.map(b =>
        b.id === id
          ? { ...b, ...updates, updatedAt: new Date().toISOString() }
          : b
      ),
    }));
  }, []);

  const deleteBullet = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      bullets: prev.bullets.filter(b => b.id !== id),
    }));
  }, []);

  const bulkUpdateBullets = useCallback((ids: string[], updates: Partial<Bullet>) => {
    const now = new Date().toISOString();
    setState(prev => ({
      ...prev,
      bullets: prev.bullets.map(b =>
        ids.includes(b.id)
          ? { ...b, ...updates, updatedAt: now }
          : b
      ),
    }));
  }, []);

  const addBullets = useCallback((bullets: Omit<Bullet, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const now = new Date().toISOString();
    const newBullets: Bullet[] = bullets.map((bullet, index) => ({
      ...bullet,
      id: generateId() + `-${index}`,
      createdAt: now,
      updatedAt: now,
    }));
    setState(prev => ({
      ...prev,
      bullets: [...prev.bullets, ...newBullets],
    }));
    return newBullets;
  }, []);

  // Past paper operations
  const addPastPaper = useCallback((paper: Omit<PastPaper, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newPaper: PastPaper = {
      ...paper,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    setState(prev => ({
      ...prev,
      pastPapers: [...prev.pastPapers, newPaper],
    }));
    return newPaper;
  }, []);

  const updatePastPaper = useCallback((id: string, updates: Partial<PastPaper>) => {
    setState(prev => ({
      ...prev,
      pastPapers: prev.pastPapers.map(p =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
  }, []);

  const deletePastPaper = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      pastPapers: prev.pastPapers.filter(p => p.id !== id),
    }));
  }, []);

  // Settings operations
  const updateSettings = useCallback((updates: Partial<AppState['settings']>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, []);

  // Full state operations
  const importState = useCallback((newState: AppState) => {
    // Run integrity scan after import to ensure no duplicates
    const scanResult = runIntegrityScan(
      newState.bullets,
      newState.pastPapers,
      undefined, // State will be set below
      (message) => {
        console.warn(message);
      }
    );
    
    setState({
      ...newState,
      bullets: scanResult.bullets,
      pastPapers: scanResult.papers,
    });
  }, []);

  const clearAllData = useCallback((redirectTo?: string) => {
    // Nuclear wipe: clear all persistence layers and reload clean.
    // We set loading to prevent any stale state from being saved during teardown.
    setIsLoading(true);
    void (async () => {
      await clearAllAppData();
      // Redirect to specified path (default: dashboard) to show onboarding
      window.location.href = redirectTo ?? '/';
    })();
  }, []);

  // Clear data for a specific subject with selective options
  // IMPORTANT: Does NOT delete component metadata (paper components) - only study data
  const clearSubjectData = useCallback((subjectId: string, option: ClearOption = 'both') => {
    setState(prev => {
      let filtered = { ...prev };
      
      // Clear syllabus (bullets) if requested
      if (option === 'syllabus' || option === 'both') {
        filtered = {
          ...filtered,
          bullets: prev.bullets.filter(b => b.subjectId !== subjectId),
        };
      }
      
      // Clear past papers if requested
      if (option === 'papers' || option === 'both') {
        filtered = {
          ...filtered,
          pastPapers: prev.pastPapers.filter(p => p.subjectId !== subjectId),
        };
      }
      
      // Run integrity scan after clearing to ensure no leftover duplicates
      const scanResult = runIntegrityScan(
        filtered.bullets,
        filtered.pastPapers,
        undefined,
        (message) => {
          console.warn(message);
        }
      );
      
      return {
        ...filtered,
        bullets: scanResult.bullets,
        pastPapers: scanResult.papers,
      };
    });
    
    // NOTE: We intentionally do NOT clear subject components (paper metadata) here
    // Component metadata should persist so users can still log papers after clearing
    
    // Clear subject theme overrides only when clearing both
    if (option === 'both') {
      try {
        const THEME_OVERRIDES_KEY = 'subject-theme-overrides';
        const stored = localStorage.getItem(THEME_OVERRIDES_KEY);
        if (stored) {
          const overrides = JSON.parse(stored);
          if (overrides[subjectId]) {
            delete overrides[subjectId];
            localStorage.setItem(THEME_OVERRIDES_KEY, JSON.stringify(overrides));
            // Notify theme provider of changes
            window.dispatchEvent(new CustomEvent('subject-theme-updated'));
          }
        }
      } catch {
        // Ignore localStorage errors
      }
      
      // Clear chapter completion celebrations for the subject
      clearCelebratedChaptersForSubject(subjectId);
    }
  }, []);
  
  // Convenience methods for clearing specific data types
  const clearSubjectSyllabus = useCallback((subjectId: string) => {
    clearSubjectData(subjectId, 'syllabus');
  }, [clearSubjectData]);
  
  const clearSubjectPastPapers = useCallback((subjectId: string) => {
    clearSubjectData(subjectId, 'papers');
  }, [clearSubjectData]);
  
  const clearSubjectAllStudyData = useCallback((subjectId: string) => {
    clearSubjectData(subjectId, 'both');
  }, [clearSubjectData]);

  // Check data integrity (for UI display)
  const checkDataIntegrity = useCallback((): IntegrityCheckResult => {
    return runIntegrityCheck(state.bullets, state.pastPapers);
  }, [state.bullets, state.pastPapers]);

  // Repair all duplicates
  const repairAllDuplicates = useCallback(() => {
    const result = repairDuplicates(state.bullets, state.pastPapers);
    setState(prev => ({
      ...prev,
      bullets: result.bullets,
      pastPapers: result.papers,
    }));
    return result.stats;
  }, [state.bullets, state.pastPapers]);

  return {
    state,
    isLoading,
    // Bullet operations
    addBullet,
    updateBullet,
    deleteBullet,
    bulkUpdateBullets,
    addBullets,
    // Past paper operations
    addPastPaper,
    updatePastPaper,
    deletePastPaper,
    // Settings
    updateSettings,
    // State operations
    importState,
    clearAllData,
    clearSubjectData,
    clearSubjectSyllabus,
    clearSubjectPastPapers,
    clearSubjectAllStudyData,
    // Data integrity
    checkDataIntegrity,
    repairAllDuplicates,
  };
};
