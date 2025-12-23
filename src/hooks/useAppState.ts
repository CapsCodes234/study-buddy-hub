import { useState, useEffect, useCallback } from 'react';
import { AppState, Bullet, PastPaper, Status } from '@/types';
import { loadData, saveData, generateId, clearAllAppData } from '@/lib/storage';

export const useAppState = () => {
  const [state, setState] = useState<AppState>(() => loadData());
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const data = loadData();
    setState(data);
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
    setState(newState);
  }, []);

  const clearAllData = useCallback(() => {
    // Nuclear wipe: clear all persistence layers and reload clean.
    // We set loading to prevent any stale state from being saved during teardown.
    setIsLoading(true);
    void (async () => {
      await clearAllAppData();
      window.location.reload();
    })();
  }, []);

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
  };
};
