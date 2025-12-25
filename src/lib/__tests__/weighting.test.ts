/**
 * Unit tests for weighting calculations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Bullet, Subject } from '@/types';

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

// Mock bullets for testing
const createMockBullet = (
  id: string,
  subjectId: string,
  status: 'Red' | 'Amber' | 'Green' | null,
  done: boolean
): Bullet => ({
  id,
  subjectId,
  mainTopic: 'Test Topic',
  subtopic: 'Test Subtopic',
  bulletText: `Bullet ${id}`,
  status,
  done,
  comment: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('Weighting Library', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('calculateRawProgress', () => {
    it('calculates correct percentage for mixed bullets', async () => {
      const { calculateRawProgress } = await import('@/lib/insights/weighting');
      
      const bullets: Bullet[] = [
        createMockBullet('1', 'math', 'Green', true), // Confident
        createMockBullet('2', 'math', 'Amber', false), // In progress
        createMockBullet('3', 'math', 'Red', false), // Not started
        createMockBullet('4', 'math', 'Green', true), // Confident
      ];
      
      const progress = calculateRawProgress(bullets);
      
      expect(progress.totalTopics).toBe(4);
      expect(progress.confidentTopics).toBe(2);
      expect(progress.percentage).toBe(50);
    });

    it('returns 0 for empty bullets array', async () => {
      const { calculateRawProgress } = await import('@/lib/insights/weighting');
      
      const progress = calculateRawProgress([]);
      
      expect(progress.totalTopics).toBe(0);
      expect(progress.confidentTopics).toBe(0);
      expect(progress.percentage).toBe(0);
    });

    it('returns 100 when all bullets are confident', async () => {
      const { calculateRawProgress } = await import('@/lib/insights/weighting');
      
      const bullets: Bullet[] = [
        createMockBullet('1', 'math', 'Green', true),
        createMockBullet('2', 'math', 'Green', true),
        createMockBullet('3', 'math', 'Green', true),
      ];
      
      const progress = calculateRawProgress(bullets);
      
      expect(progress.percentage).toBe(100);
    });
  });

  describe('calculateWeightedProgress', () => {
    it('applies default weight of 1.0 when no config exists', async () => {
      const { calculateWeightedProgress, loadWeightingConfig } = await import('@/lib/insights/weighting');
      
      const bullets: Bullet[] = [
        createMockBullet('1', 'math', 'Green', true),
        createMockBullet('2', 'math', 'Red', false),
      ];
      
      const config = loadWeightingConfig();
      const progress = calculateWeightedProgress(bullets, config);
      
      // With default weights, weighted should equal raw
      expect(progress.percentage).toBe(50);
    });

    it('applies topic weights correctly', async () => {
      const { calculateWeightedProgress, saveWeightingConfig } = await import('@/lib/insights/weighting');
      
      const config = {
        topicWeights: [
          { topicId: '1', difficulty: 'hard' as const, examRelevance: 'high' as const },
          { topicId: '2', difficulty: 'easy' as const, examRelevance: 'low' as const },
        ],
        paperWeights: [],
      };
      
      saveWeightingConfig(config);
      
      const bullets: Bullet[] = [
        createMockBullet('1', 'math', 'Green', true), // Hard + High = 1.2 * 1.3 = 1.56
        createMockBullet('2', 'math', 'Red', false), // Easy + Low = 0.8 * 0.8 = 0.64
      ];
      
      const progress = calculateWeightedProgress(bullets, config);
      
      // Total weight = 1.56 + 0.64 = 2.2
      // Confident weight = 1.56
      // Percentage = 1.56 / 2.2 * 100 ≈ 70.9%
      expect(progress.percentage).toBeCloseTo(70.9, 0);
    });

    it('respects custom weight override', async () => {
      const { calculateWeightedProgress } = await import('@/lib/insights/weighting');
      
      const config = {
        topicWeights: [
          { topicId: '1', difficulty: 'medium' as const, examRelevance: 'medium' as const, customWeight: 2.0 },
          { topicId: '2', difficulty: 'medium' as const, examRelevance: 'medium' as const, customWeight: 1.0 },
        ],
        paperWeights: [],
      };
      
      const bullets: Bullet[] = [
        createMockBullet('1', 'math', 'Green', true), // Custom weight 2.0
        createMockBullet('2', 'math', 'Red', false), // Custom weight 1.0
      ];
      
      const progress = calculateWeightedProgress(bullets, config);
      
      // Total = 3.0, Confident = 2.0, Percentage = 66.67%
      expect(progress.percentage).toBeCloseTo(66.67, 0);
    });
  });

  describe('calculateSubjectWeightedProgress', () => {
    it('filters bullets by subject', async () => {
      const { calculateSubjectWeightedProgress, loadWeightingConfig } = await import('@/lib/insights/weighting');
      
      const bullets: Bullet[] = [
        createMockBullet('1', 'math', 'Green', true),
        createMockBullet('2', 'math', 'Red', false),
        createMockBullet('3', 'physics', 'Green', true),
        createMockBullet('4', 'physics', 'Green', true),
      ];
      
      const config = loadWeightingConfig();
      const mathProgress = calculateSubjectWeightedProgress('math', bullets, config);
      const physicsProgress = calculateSubjectWeightedProgress('physics', bullets, config);
      
      expect(mathProgress.raw.total).toBe(2);
      expect(mathProgress.raw.percentage).toBe(50);
      
      expect(physicsProgress.raw.total).toBe(2);
      expect(physicsProgress.raw.percentage).toBe(100);
    });

    it('calculates difference between raw and weighted', async () => {
      const { calculateSubjectWeightedProgress, saveWeightingConfig } = await import('@/lib/insights/weighting');
      
      const config = {
        topicWeights: [
          { topicId: '1', difficulty: 'hard' as const, examRelevance: 'high' as const },
          { topicId: '2', difficulty: 'easy' as const, examRelevance: 'low' as const },
        ],
        paperWeights: [],
      };
      
      saveWeightingConfig(config);
      
      const bullets: Bullet[] = [
        createMockBullet('1', 'math', 'Green', true),
        createMockBullet('2', 'math', 'Red', false),
      ];
      
      const progress = calculateSubjectWeightedProgress('math', bullets, config);
      
      expect(progress.raw.percentage).toBe(50);
      expect(progress.weighted.percentage).toBeCloseTo(70.9, 0);
      expect(progress.difference).toBeCloseTo(20.9, 0);
    });
  });

  describe('inferDefaultWeights', () => {
    it('assigns higher weights to larger topics', async () => {
      const { inferDefaultWeights } = await import('@/lib/insights/weighting');
      
      // Create bullets with varying topic sizes
      const bullets: Bullet[] = [
        // Large topic (4 bullets)
        { ...createMockBullet('1', 'math', null, false), mainTopic: 'Large Topic' },
        { ...createMockBullet('2', 'math', null, false), mainTopic: 'Large Topic' },
        { ...createMockBullet('3', 'math', null, false), mainTopic: 'Large Topic' },
        { ...createMockBullet('4', 'math', null, false), mainTopic: 'Large Topic' },
        // Small topic (1 bullet)
        { ...createMockBullet('5', 'math', null, false), mainTopic: 'Small Topic' },
      ];
      
      const weights = inferDefaultWeights(bullets);
      
      // Large topic bullets should have higher difficulty/relevance
      const largeTopicWeight = weights.find((w) => w.topicId === '1');
      const smallTopicWeight = weights.find((w) => w.topicId === '5');
      
      expect(largeTopicWeight?.difficulty).toBe('hard');
      expect(largeTopicWeight?.examRelevance).toBe('high');
      expect(smallTopicWeight?.difficulty).toBe('easy');
      expect(smallTopicWeight?.examRelevance).toBe('low');
    });
  });

  describe('getProgressSummary', () => {
    it('returns comprehensive summary', async () => {
      const { getProgressSummary } = await import('@/lib/insights/weighting');
      
      const subjects: Subject[] = [
        { id: 'math', name: 'Mathematics', color: '#000' },
        { id: 'physics', name: 'Physics', color: '#000' },
      ];
      
      const bullets: Bullet[] = [
        createMockBullet('1', 'math', 'Green', true),
        createMockBullet('2', 'math', 'Red', false),
        createMockBullet('3', 'physics', 'Green', true),
      ];
      
      const papers = [
        { id: 'p1', subjectId: 'math', completed: true },
        { id: 'p2', subjectId: 'math', completed: false },
      ];
      
      const summary = getProgressSummary(subjects, bullets, papers as any);
      
      expect(summary.overall.rawProgress).toBeCloseTo(66.67, 0);
      expect(summary.bySubject).toHaveLength(2);
      expect(summary.papers.total).toBe(2);
      expect(summary.papers.completed).toBe(1);
      expect(summary.papers.percentage).toBe(50);
    });
  });
});
