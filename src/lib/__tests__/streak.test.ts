/**
 * Unit tests for streak logic
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock localStorage
const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
});

describe('Streak Library', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getTodayDate', () => {
    it('returns date in YYYY-MM-DD format', async () => {
      const { getTodayDate } = await import('@/lib/streak');
      
      vi.setSystemTime(new Date('2025-06-15T10:30:00Z'));
      
      const today = getTodayDate();
      expect(today).toBe('2025-06-15');
    });
  });

  describe('loadStreakData', () => {
    it('returns default data when no streak exists', async () => {
      const { loadStreakData } = await import('@/lib/streak');
      
      const data = loadStreakData();
      
      expect(data.currentStreak).toBe(0);
      expect(data.bestStreak).toBe(0);
      expect(data.lastActivityDate).toBeNull();
      expect(data.streakHistory).toEqual([]);
      expect(data.totalStudyDays).toBe(0);
    });
  });

  describe('saveStreakData', () => {
    it('persists streak data', async () => {
      const { saveStreakData, loadStreakData } = await import('@/lib/streak');
      
      const testData = {
        currentStreak: 5,
        bestStreak: 10,
        lastActivityDate: '2025-06-15',
        streakHistory: ['2025-06-11', '2025-06-12', '2025-06-13', '2025-06-14', '2025-06-15'],
        totalStudyDays: 5,
      };
      
      saveStreakData(testData);
      const loaded = loadStreakData();
      
      expect(loaded).toEqual(testData);
    });
  });

  describe('checkStreakHealth', () => {
    it('returns healthy status for same-day activity', async () => {
      const { checkStreakHealth } = await import('@/lib/streak');
      
      vi.setSystemTime(new Date('2025-06-15T15:00:00Z'));
      
      const health = checkStreakHealth({
        currentStreak: 3,
        bestStreak: 5,
        lastActivityDate: '2025-06-15',
        streakHistory: [],
        totalStudyDays: 3,
      });
      
      expect(health.isAtRisk).toBe(false);
      expect(health.shouldReset).toBe(false);
      expect(health.daysGap).toBe(0);
    });

    it('returns at-risk for next day without activity', async () => {
      const { checkStreakHealth } = await import('@/lib/streak');
      
      vi.setSystemTime(new Date('2025-06-16T15:00:00Z'));
      
      const health = checkStreakHealth({
        currentStreak: 3,
        bestStreak: 5,
        lastActivityDate: '2025-06-15',
        streakHistory: [],
        totalStudyDays: 3,
      });
      
      expect(health.isAtRisk).toBe(true);
      expect(health.shouldReset).toBe(false);
      expect(health.daysGap).toBe(1);
    });

    it('returns should-reset for 2+ days gap', async () => {
      const { checkStreakHealth } = await import('@/lib/streak');
      
      vi.setSystemTime(new Date('2025-06-18T15:00:00Z'));
      
      const health = checkStreakHealth({
        currentStreak: 3,
        bestStreak: 5,
        lastActivityDate: '2025-06-15',
        streakHistory: [],
        totalStudyDays: 3,
      });
      
      expect(health.isAtRisk).toBe(false);
      expect(health.shouldReset).toBe(true);
      expect(health.daysGap).toBe(3);
    });
  });

  describe('recordActivity', () => {
    it('starts streak at 1 for first activity', async () => {
      const { recordActivity } = await import('@/lib/streak');
      
      vi.setSystemTime(new Date('2025-06-15T10:00:00Z'));
      
      const data = recordActivity();
      
      expect(data.currentStreak).toBe(1);
      expect(data.bestStreak).toBe(1);
      expect(data.lastActivityDate).toBe('2025-06-15');
      expect(data.totalStudyDays).toBe(1);
    });

    it('does not increment for same-day activity', async () => {
      const { recordActivity, saveStreakData } = await import('@/lib/streak');
      
      vi.setSystemTime(new Date('2025-06-15T10:00:00Z'));
      
      saveStreakData({
        currentStreak: 3,
        bestStreak: 5,
        lastActivityDate: '2025-06-15',
        streakHistory: [],
        totalStudyDays: 3,
      });
      
      const data = recordActivity();
      
      expect(data.currentStreak).toBe(3); // Unchanged
      expect(data.totalStudyDays).toBe(3);
    });

    it('increments streak for consecutive day', async () => {
      const { recordActivity, saveStreakData } = await import('@/lib/streak');
      
      vi.setSystemTime(new Date('2025-06-16T10:00:00Z'));
      
      saveStreakData({
        currentStreak: 3,
        bestStreak: 5,
        lastActivityDate: '2025-06-15',
        streakHistory: ['2025-06-13', '2025-06-14', '2025-06-15'],
        totalStudyDays: 3,
      });
      
      const data = recordActivity();
      
      expect(data.currentStreak).toBe(4);
      expect(data.lastActivityDate).toBe('2025-06-16');
      expect(data.totalStudyDays).toBe(4);
    });

    it('resets streak after gap', async () => {
      const { recordActivity, saveStreakData } = await import('@/lib/streak');
      
      vi.setSystemTime(new Date('2025-06-18T10:00:00Z'));
      
      saveStreakData({
        currentStreak: 10,
        bestStreak: 10,
        lastActivityDate: '2025-06-15',
        streakHistory: [],
        totalStudyDays: 10,
      });
      
      const data = recordActivity();
      
      expect(data.currentStreak).toBe(1); // Reset
      expect(data.bestStreak).toBe(10); // Best preserved
      expect(data.lastActivityDate).toBe('2025-06-18');
    });

    it('updates best streak when current exceeds it', async () => {
      const { recordActivity, saveStreakData } = await import('@/lib/streak');
      
      vi.setSystemTime(new Date('2025-06-16T10:00:00Z'));
      
      saveStreakData({
        currentStreak: 5,
        bestStreak: 5,
        lastActivityDate: '2025-06-15',
        streakHistory: [],
        totalStudyDays: 5,
      });
      
      const data = recordActivity();
      
      expect(data.currentStreak).toBe(6);
      expect(data.bestStreak).toBe(6); // Updated
    });
  });

  describe('getStreakStatus', () => {
    it('returns healthy status for active streak', async () => {
      const { getStreakStatus } = await import('@/lib/streak');
      
      vi.setSystemTime(new Date('2025-06-15T15:00:00Z'));
      
      const status = getStreakStatus({
        currentStreak: 5,
        bestStreak: 10,
        lastActivityDate: '2025-06-15',
        streakHistory: [],
        totalStudyDays: 5,
      });
      
      expect(status.status).toBe('healthy');
      expect(status.streak).toBe(5);
    });

    it('returns at-risk status when streak might break', async () => {
      const { getStreakStatus } = await import('@/lib/streak');
      
      vi.setSystemTime(new Date('2025-06-16T15:00:00Z'));
      
      const status = getStreakStatus({
        currentStreak: 5,
        bestStreak: 10,
        lastActivityDate: '2025-06-15',
        streakHistory: [],
        totalStudyDays: 5,
      });
      
      expect(status.status).toBe('at_risk');
      expect(status.streak).toBe(5);
    });

    it('returns broken status when streak is lost', async () => {
      const { getStreakStatus } = await import('@/lib/streak');
      
      vi.setSystemTime(new Date('2025-06-18T15:00:00Z'));
      
      const status = getStreakStatus({
        currentStreak: 5,
        bestStreak: 10,
        lastActivityDate: '2025-06-15',
        streakHistory: [],
        totalStudyDays: 5,
      });
      
      expect(status.status).toBe('broken');
      expect(status.streak).toBe(0);
    });
  });

  describe('checkMilestones', () => {
    it('creates milestone for topic achievements', async () => {
      const { checkMilestones, loadMilestones } = await import('@/lib/streak');
      
      // Clear any existing milestones
      localStorage.clear();
      
      const newMilestones = checkMilestones({
        confidentTopics: 10,
        completedPapers: 0,
        currentStreak: 0,
        subjectsComplete: [],
      });
      
      // Should create milestones for 1 and 10 topics
      expect(newMilestones.length).toBeGreaterThan(0);
      expect(newMilestones.some((m) => m.title.includes('10'))).toBe(true);
    });

    it('creates milestone for streak achievements', async () => {
      const { checkMilestones, loadMilestones } = await import('@/lib/streak');
      
      localStorage.clear();
      
      const newMilestones = checkMilestones({
        confidentTopics: 0,
        completedPapers: 0,
        currentStreak: 7,
        subjectsComplete: [],
      });
      
      expect(newMilestones.some((m) => m.title.includes('7-Day'))).toBe(true);
    });

    it('does not duplicate existing milestones', async () => {
      const { checkMilestones } = await import('@/lib/streak');
      
      localStorage.clear();
      
      // First call
      const first = checkMilestones({
        confidentTopics: 10,
        completedPapers: 5,
        currentStreak: 7,
        subjectsComplete: [],
      });
      
      // Second call with same stats
      const second = checkMilestones({
        confidentTopics: 10,
        completedPapers: 5,
        currentStreak: 7,
        subjectsComplete: [],
      });
      
      // Second call should return no new milestones
      expect(second.length).toBe(0);
    });
  });
});
