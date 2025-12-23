/**
 * Unit Tests - Conversion utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  convertRawToPercent,
  calculateOverallPercentage,
  getScoreCategory,
  estimateGrade,
  formatPercentage,
  calculateWeightedAverage,
  calculateReadinessScore,
} from '../conversion';

describe('convertRawToPercent', () => {
  it('calculates percentage correctly', () => {
    expect(convertRawToPercent(30, 40)).toBe(75);
    expect(convertRawToPercent(45, 60)).toBe(75);
    expect(convertRawToPercent(0, 100)).toBe(0);
    expect(convertRawToPercent(100, 100)).toBe(100);
  });

  it('rounds to 2 decimal places', () => {
    expect(convertRawToPercent(1, 3)).toBe(33.33);
    expect(convertRawToPercent(2, 3)).toBe(66.67);
  });

  it('throws error for zero total', () => {
    expect(() => convertRawToPercent(10, 0)).toThrow('Total marks must be greater than 0');
  });

  it('throws error for negative raw marks', () => {
    expect(() => convertRawToPercent(-5, 40)).toThrow('Raw marks cannot be negative');
  });

  it('warns but allows raw > total', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = convertRawToPercent(50, 40);
    expect(result).toBe(125);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('calculateOverallPercentage', () => {
  it('calculates overall from multiple components', () => {
    const results = [
      { rawMark: 30, totalMark: 40 }, // 75%
      { rawMark: 45, totalMark: 60 }, // 75%
    ];
    expect(calculateOverallPercentage(results)).toBe(75);
  });

  it('handles weighted totals correctly', () => {
    const results = [
      { rawMark: 40, totalMark: 40 }, // 100%
      { rawMark: 0, totalMark: 60 },  // 0%
    ];
    expect(calculateOverallPercentage(results)).toBe(40);
  });

  it('returns 0 for empty array', () => {
    expect(calculateOverallPercentage([])).toBe(0);
  });
});

describe('getScoreCategory', () => {
  it('returns correct categories', () => {
    expect(getScoreCategory(95)).toBe('excellent');
    expect(getScoreCategory(80)).toBe('excellent');
    expect(getScoreCategory(79)).toBe('good');
    expect(getScoreCategory(60)).toBe('good');
    expect(getScoreCategory(59)).toBe('average');
    expect(getScoreCategory(40)).toBe('average');
    expect(getScoreCategory(39)).toBe('needs-improvement');
    expect(getScoreCategory(0)).toBe('needs-improvement');
  });
});

describe('estimateGrade', () => {
  it('returns correct CIE-style grades', () => {
    expect(estimateGrade(95)).toBe('A*');
    expect(estimateGrade(90)).toBe('A*');
    expect(estimateGrade(89)).toBe('A');
    expect(estimateGrade(80)).toBe('A');
    expect(estimateGrade(79)).toBe('B');
    expect(estimateGrade(70)).toBe('B');
    expect(estimateGrade(69)).toBe('C');
    expect(estimateGrade(60)).toBe('C');
    expect(estimateGrade(59)).toBe('D');
    expect(estimateGrade(50)).toBe('D');
    expect(estimateGrade(49)).toBe('E');
    expect(estimateGrade(40)).toBe('E');
    expect(estimateGrade(39)).toBe('U');
    expect(estimateGrade(0)).toBe('U');
  });
});

describe('formatPercentage', () => {
  it('formats percentage with % symbol', () => {
    expect(formatPercentage(75.5)).toBe('76%');
    expect(formatPercentage(33.33)).toBe('33%');
    expect(formatPercentage(100)).toBe('100%');
  });
});

describe('calculateWeightedAverage', () => {
  it('calculates weighted average correctly', () => {
    const items = [
      { value: 80, weight: 1 },
      { value: 60, weight: 1 },
    ];
    expect(calculateWeightedAverage(items)).toBe(70);
  });

  it('respects different weights', () => {
    const items = [
      { value: 100, weight: 2 },
      { value: 50, weight: 1 },
    ];
    // (100*2 + 50*1) / 3 = 250/3 ≈ 83.33
    expect(calculateWeightedAverage(items)).toBeCloseTo(83.33, 1);
  });

  it('returns 0 for zero total weight', () => {
    expect(calculateWeightedAverage([{ value: 100, weight: 0 }])).toBe(0);
  });
});

describe('calculateReadinessScore', () => {
  it('calculates readiness with default weights', () => {
    // syllabus: 1.0 (100%), paperScore: 80, paperCompletion: 0.5
    // 1.0 * 0.4 + 0.8 * 0.4 + 0.5 * 0.2 = 0.4 + 0.32 + 0.1 = 0.82 = 82%
    const score = calculateReadinessScore(1.0, 80, 0.5);
    expect(score).toBe(82);
  });

  it('handles zero values', () => {
    expect(calculateReadinessScore(0, 0, 0)).toBe(0);
  });

  it('handles perfect scores', () => {
    expect(calculateReadinessScore(1, 100, 1)).toBe(100);
  });

  it('accepts custom weights', () => {
    const score = calculateReadinessScore(1.0, 100, 1.0, {
      syllabus: 0.5,
      paperScore: 0.5,
      paperCompletion: 0,
    });
    expect(score).toBe(100);
  });
});
