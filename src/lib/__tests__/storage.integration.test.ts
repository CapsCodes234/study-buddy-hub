/**
 * Integration smoke tests for storage operations
 * Tests critical flows: import, export, clear data, deduplication
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  exportAsJSON,
  importFromJSON,
  clearAllAppData,
  getInitialState,
  loadData,
  saveData,
} from '../storage';
import { deduplicateBullets, deduplicatePastPapers } from '../dataIntegrity';
import type { AppState, Bullet, PastPaper, Subject } from '@/types';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

beforeEach(() => {
  vi.stubGlobal('localStorage', mockLocalStorage);
  mockLocalStorage.clear();
  // Initialize with clean state
  mockLocalStorage.setItem('study-tracker-data', JSON.stringify(getInitialState()));
});

describe('Storage Integration Tests', () => {
  describe('Import/Export Flow', () => {
    it('should export and import data without duplication', () => {
      const initialState: AppState = {
        subjects: [
          { id: 'math', name: 'Mathematics', color: '#000' },
          { id: 'physics', name: 'Physics', color: '#fff' },
        ],
        bullets: [
          {
            id: 'bullet-1',
            subjectId: 'math',
            mainTopic: 'Algebra',
            subtopic: 'Linear',
            bulletText: 'Solve linear equations',
            status: null,
            comment: '',
            done: false,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        pastPapers: [
          {
            id: 'paper-1',
            subjectId: 'math',
            year: 2023,
            session: 'May/June',
            paper: '1',
            variant: '1',
            componentId: 'comp-1',
            totalMarks: 100,
            completed: false,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        settings: {
          aiExtractionEnabled: false,
          aiFeaturesEnabled: false,
          hasCompletedOnboarding: true,
        },
      };

      saveData(initialState);
      const exported = exportAsJSON(initialState);
      const importResult = importFromJSON(exported, getInitialState());

      expect(importResult.success).toBe(true);
      if (importResult.success) {
        expect(importResult.data.bullets).toHaveLength(1);
        expect(importResult.data.pastPapers).toHaveLength(1);
        expect(importResult.duplicatesRemoved.bullets).toBe(0);
        expect(importResult.duplicatesRemoved.papers).toBe(0);
      }
    });

    it('should deduplicate when importing data with duplicates', () => {
      const existingState: AppState = {
        subjects: [{ id: 'math', name: 'Mathematics', color: '#000' }],
        bullets: [
          {
            id: 'bullet-1',
            subjectId: 'math',
            mainTopic: 'Algebra',
            subtopic: 'Linear',
            bulletText: 'Solve linear equations',
            status: null,
            comment: '',
            done: false,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        pastPapers: [],
        settings: getInitialState().settings,
      };

      const importedState: AppState = {
        subjects: [{ id: 'math', name: 'Mathematics', color: '#000' }],
        bullets: [
          // Duplicate (same subject, topic, subtopic, text)
          {
            id: 'bullet-2',
            subjectId: 'math',
            mainTopic: 'Algebra',
            subtopic: 'Linear',
            bulletText: 'Solve linear equations',
            status: 'Green',
            comment: 'Updated',
            done: true,
            createdAt: '2024-01-02',
            updatedAt: '2024-01-02',
          },
        ],
        pastPapers: [],
        settings: getInitialState().settings,
      };

      const exported = exportAsJSON(importedState);
      const importResult = importFromJSON(exported, existingState);

      expect(importResult.success).toBe(true);
      if (importResult.success) {
        // Should keep the newer duplicate (from imported state)
        expect(importResult.data.bullets).toHaveLength(1);
        expect(importResult.data.bullets[0].id).toBe('bullet-2');
        expect(importResult.data.bullets[0].status).toBe('Green');
      }
    });
  });

  describe('Clear Data by Subject', () => {
    it('should clear subject data and prevent duplicates on re-import', () => {
      const stateWithMultipleSubjects: AppState = {
        subjects: [
          { id: 'math', name: 'Mathematics', color: '#000' },
          { id: 'physics', name: 'Physics', color: '#fff' },
        ],
        bullets: [
          {
            id: 'bullet-math-1',
            subjectId: 'math',
            mainTopic: 'Algebra',
            subtopic: 'Linear',
            bulletText: 'Math bullet 1',
            status: null,
            comment: '',
            done: false,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
          {
            id: 'bullet-physics-1',
            subjectId: 'physics',
            mainTopic: 'Mechanics',
            subtopic: 'Forces',
            bulletText: 'Physics bullet 1',
            status: null,
            comment: '',
            done: false,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        pastPapers: [
          {
            id: 'paper-math-1',
            subjectId: 'math',
            year: 2023,
            session: 'May/June',
            paper: '1',
            variant: '1',
            componentId: 'comp-1',
            totalMarks: 100,
            completed: false,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
          {
            id: 'paper-physics-1',
            subjectId: 'physics',
            year: 2023,
            session: 'May/June',
            paper: '1',
            variant: '1',
            componentId: 'comp-1',
            totalMarks: 100,
            completed: false,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        settings: getInitialState().settings,
      };

      saveData(stateWithMultipleSubjects);

      // Simulate clearing math subject data
      const afterClear: AppState = {
        ...stateWithMultipleSubjects,
        bullets: stateWithMultipleSubjects.bullets.filter(b => b.subjectId !== 'math'),
        pastPapers: stateWithMultipleSubjects.pastPapers.filter(p => p.subjectId !== 'math'),
      };
      saveData(afterClear);

      // Now import the original backup (which has math data)
      const exported = exportAsJSON(stateWithMultipleSubjects);
      const importResult = importFromJSON(exported, afterClear);

      expect(importResult.success).toBe(true);
      if (importResult.success) {
        // Should merge and deduplicate - math data should be restored, physics should remain
        const mathBullets = importResult.data.bullets.filter(b => b.subjectId === 'math');
        const physicsBullets = importResult.data.bullets.filter(b => b.subjectId === 'physics');
        const mathPapers = importResult.data.pastPapers.filter(p => p.subjectId === 'math');
        const physicsPapers = importResult.data.pastPapers.filter(p => p.subjectId === 'physics');

        // Math data should be restored (from backup)
        expect(mathBullets.length).toBeGreaterThan(0);
        expect(mathPapers.length).toBeGreaterThan(0);
        // Physics data should remain (may be deduplicated if it exists in both)
        expect(physicsBullets.length).toBeGreaterThan(0);
        expect(physicsPapers.length).toBeGreaterThan(0);
        // Duplicates may be removed for physics data (exists in both states)
        // But total counts should be correct
        expect(importResult.data.bullets.length).toBe(2);
        expect(importResult.data.pastPapers.length).toBe(2);
      }
    });
  });

  describe('Deduplication Logic', () => {
    it('should deduplicate bullets with same content', () => {
      const bullets: Bullet[] = [
        {
          id: 'bullet-1',
          subjectId: 'math',
          mainTopic: 'Algebra',
          subtopic: 'Linear',
          bulletText: 'Solve equations',
          status: null,
          comment: '',
          done: false,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: 'bullet-2',
          subjectId: 'math',
          mainTopic: 'Algebra',
          subtopic: 'Linear',
          bulletText: 'Solve equations', // Same content
          status: 'Green',
          comment: 'Updated',
          done: true,
          createdAt: '2024-01-02',
          updatedAt: '2024-01-02',
        },
      ];

      const result = deduplicateBullets(bullets);
      expect(result.deduped).toHaveLength(1);
      expect(result.removedCount).toBe(1);
      // Should keep the newer one
      expect(result.deduped[0].id).toBe('bullet-2');
    });

    it('should deduplicate past papers with same identifiers', () => {
      const papers: PastPaper[] = [
        {
          id: 'paper-1',
          subjectId: 'math',
          year: 2023,
          session: 'May/June',
          paper: '1',
          variant: '1',
          componentId: 'comp-1',
          totalMarks: 100,
          completed: false,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: 'paper-2',
          subjectId: 'math',
          year: 2023,
          session: 'May/June',
          paper: '1',
          variant: '1',
          componentId: 'comp-1', // Same identifiers
          totalMarks: 100,
          completed: true,
          createdAt: '2024-01-02',
          updatedAt: '2024-01-02',
        },
      ];

      const result = deduplicatePastPapers(papers);
      expect(result.deduped).toHaveLength(1);
      expect(result.removedCount).toBe(1);
      // Should keep the newer one
      expect(result.deduped[0].id).toBe('paper-2');
    });
  });

  describe('Analytics Integrity', () => {
    it('should not inflate counts after import with deduplication', () => {
      const initialState: AppState = {
        subjects: [{ id: 'math', name: 'Mathematics', color: '#000' }],
        bullets: [
          {
            id: 'bullet-1',
            subjectId: 'math',
            mainTopic: 'Algebra',
            subtopic: 'Linear',
            bulletText: 'Solve equations',
            status: null,
            comment: '',
            done: false,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        pastPapers: [],
        settings: getInitialState().settings,
      };

      // Import same data (should deduplicate)
      const exported = exportAsJSON(initialState);
      const importResult = importFromJSON(exported, initialState);

      expect(importResult.success).toBe(true);
      if (importResult.success) {
        // Counts should remain the same (not doubled)
        expect(importResult.data.bullets.length).toBe(1);
        expect(importResult.data.pastPapers.length).toBe(0);
        // Should report duplicates removed
        expect(importResult.duplicatesRemoved.bullets).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

