/**
 * Tests for storage persistence behavior
 * Tests that saveData preserves legacy subjects when persistSubjects is false
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveData, loadData, getInitialState } from '../storage';
import type { AppState, Subject } from '@/types';

describe('saveData persistence behavior', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  it('should save all data including subjects by default', () => {
    const state: AppState = {
      subjects: [
        { id: 'math', name: 'Mathematics', color: 'hsl(222, 47%, 20%)' },
      ],
      bullets: [],
      pastPapers: [],
      settings: { aiExtractionEnabled: false, aiFeaturesEnabled: false, hasCompletedOnboarding: false },
    };

    saveData(state);

    const loaded = loadData();
    expect(loaded.subjects).toHaveLength(1);
    expect(loaded.subjects[0].id).toBe('math');
  });

  it('should preserve legacy subjects when persistSubjects is false and legacy exists', () => {
    // First, save a state with legacy subjects
    const legacyState: AppState = {
      subjects: [
        { id: 'math', name: 'Mathematics', color: 'hsl(222, 47%, 20%)' },
        { id: 'physics', name: 'Physics', color: 'hsl(173, 58%, 39%)' },
      ],
      bullets: [{ id: 'b1', subjectId: 'math', mainTopic: 'T1', subtopic: 'S1', bulletText: 'B1', status: null, comment: '', done: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' }],
      pastPapers: [],
      settings: { aiExtractionEnabled: false, aiFeaturesEnabled: false, hasCompletedOnboarding: false },
    };
    saveData(legacyState);

    // Now save a new state with server-backed subjects but persistSubjects: false
    const serverState: AppState = {
      subjects: [
        { id: 'math', name: 'Mathematics', color: 'hsl(222, 47%, 20%)', userSubjectId: 'us-1', source: 'catalogue' },
      ],
      bullets: [{ id: 'b2', subjectId: 'math', mainTopic: 'T2', subtopic: 'S2', bulletText: 'B2', status: null, comment: '', done: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' }],
      pastPapers: [],
      settings: { aiExtractionEnabled: false, aiFeaturesEnabled: false, hasCompletedOnboarding: false },
    };
    saveData(serverState, { persistSubjects: false });

    // Load and verify legacy subjects are preserved
    const loaded = loadData();
    expect(loaded.subjects).toHaveLength(2); // Original legacy subjects preserved
    expect(loaded.subjects[0].id).toBe('math');
    expect(loaded.subjects[1].id).toBe('physics');
    // But bullets should be updated to the new state
    expect(loaded.bullets).toHaveLength(1);
    expect(loaded.bullets[0].id).toBe('b2');
  });

  it('should preserve empty subjects array when explicitly persisted', () => {
    // First, save a state with explicitly empty subjects
    const emptyState: AppState = {
      subjects: [],
      bullets: [],
      pastPapers: [],
      settings: { aiExtractionEnabled: false, aiFeaturesEnabled: false, hasCompletedOnboarding: false },
    };
    saveData(emptyState);

    // Load and verify empty array is preserved (not replaced with DEFAULT_SUBJECTS)
    const loaded = loadData();
    expect(loaded.subjects).toHaveLength(0);
  });

  it('should preserve empty subjects array when persistSubjects is false and no legacy exists', () => {
    // First, save a state with explicitly empty subjects
    const emptyState: AppState = {
      subjects: [],
      bullets: [],
      pastPapers: [],
      settings: { aiExtractionEnabled: false, aiFeaturesEnabled: false, hasCompletedOnboarding: false },
    };
    saveData(emptyState);

    // Now save a new state with server-backed subjects but persistSubjects: false
    const serverState: AppState = {
      subjects: [
        { id: 'math', name: 'Mathematics', color: 'hsl(222, 47%, 20%)', userSubjectId: 'us-1', source: 'catalogue' },
      ],
      bullets: [{ id: 'b1', subjectId: 'math', mainTopic: 'T1', subtopic: 'S1', bulletText: 'B1', status: null, comment: '', done: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' }],
      pastPapers: [],
      settings: { aiExtractionEnabled: false, aiFeaturesEnabled: false, hasCompletedOnboarding: false },
    };
    saveData(serverState, { persistSubjects: false });

    // Load and verify empty array is preserved (no legacy to preserve)
    const loaded = loadData();
    expect(loaded.subjects).toHaveLength(0);
    // But bullets should still be saved
    expect(loaded.bullets).toHaveLength(1);
  });

  it('should use DEFAULT_SUBJECTS when no stored AppState exists', () => {
    // No existing localStorage
    expect(localStorage.getItem('study-tracker-data')).toBeNull();

    const loaded = loadData();
    expect(loaded.subjects).toHaveLength(3); // DEFAULT_SUBJECTS has 3 subjects
    expect(loaded.subjects[0].id).toBe('math');
    expect(loaded.subjects[1].id).toBe('physics');
    expect(loaded.subjects[2].id).toBe('it');
  });

  it('should preserve non-empty legacy subject array', () => {
    const legacyState: AppState = {
      subjects: [
        { id: 'math', name: 'Mathematics', color: 'hsl(222, 47%, 20%)' },
        { id: 'physics', name: 'Physics', color: 'hsl(173, 58%, 39%)' },
      ],
      bullets: [],
      pastPapers: [],
      settings: { aiExtractionEnabled: false, aiFeaturesEnabled: false, hasCompletedOnboarding: false },
    };
    saveData(legacyState);

    const loaded = loadData();
    expect(loaded.subjects).toHaveLength(2);
    expect(loaded.subjects[0].id).toBe('math');
    expect(loaded.subjects[1].id).toBe('physics');
  });

  it('should handle missing localStorage gracefully when persistSubjects is false', () => {
    const state: AppState = {
      subjects: [
        { id: 'math', name: 'Mathematics', color: 'hsl(222, 47%, 20%)', userSubjectId: 'us-1', source: 'catalogue' },
      ],
      bullets: [],
      pastPapers: [],
      settings: { aiExtractionEnabled: false, aiFeaturesEnabled: false, hasCompletedOnboarding: false },
    };

    // No existing localStorage
    expect(localStorage.getItem('study-tracker-data')).toBeNull();

    // Should preserve empty subjects array when no legacy snapshot exists
    saveData(state, { persistSubjects: false });

    const loaded = loadData();
    expect(loaded.subjects).toHaveLength(0);
  });

  it('should handle corrupted localStorage gracefully when persistSubjects is false', () => {
    // Save corrupted data
    localStorage.setItem('study-tracker-data', 'invalid json');

    const state: AppState = {
      subjects: [
        { id: 'math', name: 'Mathematics', color: 'hsl(222, 47%, 20%)', userSubjectId: 'us-1', source: 'catalogue' },
      ],
      bullets: [],
      pastPapers: [],
      settings: { aiExtractionEnabled: false, aiFeaturesEnabled: false, hasCompletedOnboarding: false },
    };

    // Should preserve empty subjects array when no genuine legacy snapshot exists
    saveData(state, { persistSubjects: false });

    const loaded = loadData();
    expect(loaded.subjects).toHaveLength(0);
  });
});
