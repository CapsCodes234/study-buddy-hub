/**
 * Chapter Planning - normalizeChapterKey invariant tests
 * Ensures chapterKey normalization is consistent across SubjectSyllabus, chapterPlanningStorage, and DeadlinesCard.
 */
import { describe, it, expect } from 'vitest';
import { normalizeChapterKey, getDeadlineInfo } from '../chapterPlanning';

describe('normalizeChapterKey', () => {
  it('lowercases and trims mainTopic', () => {
    expect(normalizeChapterKey('Introduction')).toBe('introduction');
    expect(normalizeChapterKey('  Introduction  ')).toBe('introduction');
    expect(normalizeChapterKey('INTRODUCTION')).toBe('introduction');
  });

  it('produces same key for equivalent display strings', () => {
    expect(normalizeChapterKey('Introduction')).toBe(normalizeChapterKey('introduction'));
    expect(normalizeChapterKey('  Chapter 1  ')).toBe(normalizeChapterKey('chapter 1'));
  });

  it('handles empty and whitespace', () => {
    expect(normalizeChapterKey('')).toBe('');
    expect(normalizeChapterKey('   ')).toBe('');
  });
});

describe('getDeadlineInfo', () => {
  it('returns completed when isComplete is true', () => {
    const info = getDeadlineInfo('2025-12-31', true);
    expect(info.status).toBe('completed');
    expect(info.label).toBe('Completed');
  });

  it('returns no_deadline when completeBy is undefined', () => {
    const info = getDeadlineInfo(undefined, false);
    expect(info.status).toBe('no_deadline');
    expect(info.label).toBe('No deadline');
  });
});
