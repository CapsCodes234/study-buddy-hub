import { useCallback, useEffect, useState } from 'react';
import { Component } from '@/types/components';
import { loadAndDedupeComponents, deduplicateComponents } from '@/lib/dataIntegrity';
import { COMPONENTS_STORAGE_KEY } from '@/lib/storage';

export function useComponents(subjectId?: string) {
  const [components, setComponents] = useState<Component[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Reload components when refreshKey changes or on mount
  useEffect(() => {
    const all = loadAndDedupeComponents();
    setComponents(subjectId ? all.filter((c) => c.subjectId === subjectId) : all);
  }, [subjectId, refreshKey]);

  // Force refresh - useful after imports
  const refreshComponents = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const addComponents = useCallback(
    (newComponents: Omit<Component, 'id' | 'createdAt' | 'updatedAt'>[]) => {
      // Load existing with deduplication
      const existing = loadAndDedupeComponents();

      const now = new Date().toISOString();
      const toAdd: Component[] = newComponents.map((c) => ({
        ...c,
        id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      }));

      // Merge and deduplicate to prevent duplicates on import
      const merged = [...existing, ...toAdd];
      const { deduped } = deduplicateComponents(merged);
      
      localStorage.setItem(COMPONENTS_STORAGE_KEY, JSON.stringify(deduped));
      setComponents(subjectId ? deduped.filter((c) => c.subjectId === subjectId) : deduped);

      // Return only the components that were actually added (not duplicates)
      const addedIds = new Set(deduped.filter(d => toAdd.some(t => 
        t.subjectId === d.subjectId && 
        t.componentName.toLowerCase().trim() === d.componentName.toLowerCase().trim()
      )).map(d => d.id));
      
      return toAdd.filter(t => addedIds.has(t.id));
    },
    [subjectId]
  );

  const updateComponent = useCallback(
    (id: string, updates: Partial<Component>) => {
      const all = loadAndDedupeComponents();
      const updated = all.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      );

      localStorage.setItem(COMPONENTS_STORAGE_KEY, JSON.stringify(updated));
      setComponents(subjectId ? updated.filter((c) => c.subjectId === subjectId) : updated);
    },
    [subjectId]
  );

  const deleteComponent = useCallback(
    (id: string) => {
      const all = loadAndDedupeComponents();
      const updated = all.filter((c) => c.id !== id);

      localStorage.setItem(COMPONENTS_STORAGE_KEY, JSON.stringify(updated));
      setComponents(subjectId ? updated.filter((c) => c.subjectId === subjectId) : updated);
    },
    [subjectId]
  );

  return { components, addComponents, updateComponent, deleteComponent, refreshComponents };
}
