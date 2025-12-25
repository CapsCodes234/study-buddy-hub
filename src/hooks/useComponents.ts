import { useCallback, useEffect, useState } from 'react';
import { Component } from '@/types/components';

const STORAGE_KEY = 'study-tracker-components';

export function useComponents(subjectId?: string) {
  const [components, setComponents] = useState<Component[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const all: Component[] = JSON.parse(stored);
      setComponents(subjectId ? all.filter((c) => c.subjectId === subjectId) : all);
    } else {
      setComponents([]);
    }
  }, [subjectId]);

  const addComponents = useCallback(
    (newComponents: Omit<Component, 'id' | 'createdAt' | 'updatedAt'>[]) => {
      const stored = localStorage.getItem(STORAGE_KEY);
      const existing: Component[] = stored ? JSON.parse(stored) : [];

      const now = new Date().toISOString();
      const toAdd: Component[] = newComponents.map((c) => ({
        ...c,
        id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      }));

      const updated = [...existing, ...toAdd];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setComponents(subjectId ? updated.filter((c) => c.subjectId === subjectId) : updated);

      return toAdd;
    },
    [subjectId]
  );

  const updateComponent = useCallback(
    (id: string, updates: Partial<Component>) => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const all: Component[] = JSON.parse(stored);
      const updated = all.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      );

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setComponents(subjectId ? updated.filter((c) => c.subjectId === subjectId) : updated);
    },
    [subjectId]
  );

  const deleteComponent = useCallback(
    (id: string) => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const all: Component[] = JSON.parse(stored);
      const updated = all.filter((c) => c.id !== id);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setComponents(subjectId ? updated.filter((c) => c.subjectId === subjectId) : updated);
    },
    [subjectId]
  );

  return { components, addComponents, updateComponent, deleteComponent };
}
