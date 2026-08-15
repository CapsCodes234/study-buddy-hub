/**
 * Tests for legacy subject usage detection utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getSubjectsWithStudyData,
  subjectHasStudyData,
  getPreSelectedSubjectIds,
  hasGenuineLegacyData,
} from '../legacySubjectUsage';
import type { Bullet, PastPaper } from '@/types';

describe('getSubjectsWithStudyData', () => {
  it('should return empty set when no data exists', () => {
    const bullets: Bullet[] = [];
    const pastPapers: PastPaper[] = [];
    const subjectIds = getSubjectsWithStudyData(bullets, pastPapers);
    expect(subjectIds.size).toBe(0);
  });

  it('should extract subject IDs from bullets', () => {
    const bullets: Bullet[] = [
      {
        id: 'bullet-1',
        subjectId: 'math',
        mainTopic: 'Topic 1',
        subtopic: 'Subtopic 1',
        bulletText: 'Bullet 1',
        status: null,
        comment: '',
        done: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: 'bullet-2',
        subjectId: 'physics',
        mainTopic: 'Topic 1',
        subtopic: 'Subtopic 1',
        bulletText: 'Bullet 2',
        status: null,
        comment: '',
        done: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];
    const pastPapers: PastPaper[] = [];

    const subjectIds = getSubjectsWithStudyData(bullets, pastPapers);
    expect(subjectIds.size).toBe(2);
    expect(subjectIds.has('math')).toBe(true);
    expect(subjectIds.has('physics')).toBe(true);
  });

  it('should extract subject IDs from past papers', () => {
    const bullets: Bullet[] = [];
    const pastPapers: PastPaper[] = [
      {
        id: 'paper-1',
        subjectId: 'math',
        componentId: 'comp-1',
        year: 2024,
        session: 'May/June',
        paper: '1',
        totalMarks: 100,
        completed: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: 'paper-2',
        subjectId: 'physics',
        componentId: 'comp-2',
        year: 2024,
        session: 'May/June',
        paper: '1',
        totalMarks: 100,
        completed: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    const subjectIds = getSubjectsWithStudyData(bullets, pastPapers);
    expect(subjectIds.size).toBe(2);
    expect(subjectIds.has('math')).toBe(true);
    expect(subjectIds.has('physics')).toBe(true);
  });

  it('should combine subject IDs from bullets and past papers', () => {
    const bullets: Bullet[] = [
      {
        id: 'bullet-1',
        subjectId: 'math',
        mainTopic: 'Topic 1',
        subtopic: 'Subtopic 1',
        bulletText: 'Bullet 1',
        status: null,
        comment: '',
        done: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];
    const pastPapers: PastPaper[] = [
      {
        id: 'paper-1',
        subjectId: 'physics',
        componentId: 'comp-1',
        year: 2024,
        session: 'May/June',
        paper: '1',
        totalMarks: 100,
        completed: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    const subjectIds = getSubjectsWithStudyData(bullets, pastPapers);
    expect(subjectIds.size).toBe(2);
    expect(subjectIds.has('math')).toBe(true);
    expect(subjectIds.has('physics')).toBe(true);
  });

  it('should handle whitespace in subject IDs', () => {
    const bullets: Bullet[] = [
      {
        id: 'bullet-1',
        subjectId: '  math  ',
        mainTopic: 'Topic 1',
        subtopic: 'Subtopic 1',
        bulletText: 'Bullet 1',
        status: null,
        comment: '',
        done: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    const subjectIds = getSubjectsWithStudyData(bullets, []);
    expect(subjectIds.has('math')).toBe(true);
  });
});

describe('subjectHasStudyData', () => {
  it('should return true when subject has bullets', () => {
    const bullets: Bullet[] = [
      {
        id: 'bullet-1',
        subjectId: 'math',
        mainTopic: 'Topic 1',
        subtopic: 'Subtopic 1',
        bulletText: 'Bullet 1',
        status: null,
        comment: '',
        done: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];
    const pastPapers: PastPaper[] = [];

    expect(subjectHasStudyData('math', bullets, pastPapers)).toBe(true);
  });

  it('should return true when subject has past papers', () => {
    const bullets: Bullet[] = [];
    const pastPapers: PastPaper[] = [
      {
        id: 'paper-1',
        subjectId: 'math',
        componentId: 'comp-1',
        year: 2024,
        session: 'May/June',
        paper: '1',
        totalMarks: 100,
        completed: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    expect(subjectHasStudyData('math', bullets, pastPapers)).toBe(true);
  });

  it('should return false when subject has no data', () => {
    const bullets: Bullet[] = [
      {
        id: 'bullet-1',
        subjectId: 'physics',
        mainTopic: 'Topic 1',
        subtopic: 'Subtopic 1',
        bulletText: 'Bullet 1',
        status: null,
        comment: '',
        done: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];
    const pastPapers: PastPaper[] = [];

    expect(subjectHasStudyData('math', bullets, pastPapers)).toBe(false);
  });
});

describe('getPreSelectedSubjectIds', () => {
  it('should return array of subject IDs with study data', () => {
    const bullets: Bullet[] = [
      {
        id: 'bullet-1',
        subjectId: 'math',
        mainTopic: 'Topic 1',
        subtopic: 'Subtopic 1',
        bulletText: 'Bullet 1',
        status: null,
        comment: '',
        done: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];
    const pastPapers: PastPaper[] = [];

    const preSelected = getPreSelectedSubjectIds(bullets, pastPapers);
    expect(preSelected).toEqual(['math']);
  });

  it('should return empty array when no study data exists', () => {
    const bullets: Bullet[] = [];
    const pastPapers: PastPaper[] = [];

    const preSelected = getPreSelectedSubjectIds(bullets, pastPapers);
    expect(preSelected).toEqual([]);
  });
});

describe('hasGenuineLegacyData', () => {
  it('should return true when bullets exist', () => {
    const bullets: Bullet[] = [
      {
        id: 'bullet-1',
        subjectId: 'math',
        mainTopic: 'Topic 1',
        subtopic: 'Subtopic 1',
        bulletText: 'Bullet 1',
        status: null,
        comment: '',
        done: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];
    const pastPapers: PastPaper[] = [];

    expect(hasGenuineLegacyData(bullets, pastPapers)).toBe(true);
  });

  it('should return true when past papers exist', () => {
    const bullets: Bullet[] = [];
    const pastPapers: PastPaper[] = [
      {
        id: 'paper-1',
        subjectId: 'math',
        componentId: 'comp-1',
        year: 2024,
        session: 'May/June',
        paper: '1',
        totalMarks: 100,
        completed: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    expect(hasGenuineLegacyData(bullets, pastPapers)).toBe(true);
  });

  it('should return false when no data exists', () => {
    const bullets: Bullet[] = [];
    const pastPapers: PastPaper[] = [];

    expect(hasGenuineLegacyData(bullets, pastPapers)).toBe(false);
  });

  it('should distinguish genuine data from DEFAULT_SUBJECTS', () => {
    // This test verifies the logic that checks for actual study data
    // rather than just the presence of subjects in state.subjects
    const bullets: Bullet[] = [];
    const pastPapers: PastPaper[] = [];

    // Even if DEFAULT_SUBJECTS exist, without bullets/papers there's no genuine legacy data
    expect(hasGenuineLegacyData(bullets, pastPapers)).toBe(false);
  });
});
