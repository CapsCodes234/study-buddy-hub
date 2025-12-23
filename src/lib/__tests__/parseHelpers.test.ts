/**
 * Unit Tests - Parse Helpers for extraction
 */

import { describe, it, expect } from 'vitest';
import {
  extractComponentMarks,
  parseTopicNumbering,
  isLikelyMainTopic,
  isLikelySubtopic,
  isLikelyBullet,
  cleanExtractedText,
} from '../extraction/parseHelpers';

describe('extractComponentMarks', () => {
  it('extracts marks from "Paper 1 — 40 marks" pattern', () => {
    const result = extractComponentMarks('Paper 1 — 40 marks');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].componentName).toContain('Paper 1');
    expect(result[0].suggestedMarks).toBe(40);
  });

  it('extracts marks from "Paper 2: 60 marks" pattern', () => {
    const result = extractComponentMarks('Paper 2: 60 marks');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].suggestedMarks).toBe(60);
  });

  it('returns empty array for text without marks', () => {
    const result = extractComponentMarks('This is just some text');
    expect(result).toEqual([]);
  });

  it('handles multiple components in one text', () => {
    const text = 'Paper 1 (40 marks) and Paper 2 (60 marks)';
    const result = extractComponentMarks(text);
    expect(result.length).toBe(2);
  });
});

describe('parseTopicNumbering', () => {
  it('parses numbered topics', () => {
    const result = parseTopicNumbering('1. Mechanics');
    expect(result).toEqual({ orderNumber: 1, name: 'Mechanics' });
  });

  it('parses topics with dot notation', () => {
    const result = parseTopicNumbering('2.1 Forces');
    expect(result).toEqual({ orderNumber: 2, name: 'Forces' });
  });

  it('handles topics without numbers', () => {
    const result = parseTopicNumbering('Thermodynamics');
    expect(result).toEqual({ orderNumber: null, name: 'Thermodynamics' });
  });
});

describe('isLikelyMainTopic', () => {
  it('identifies numbered main topics', () => {
    expect(isLikelyMainTopic('1. Mechanics')).toBe(true);
    expect(isLikelyMainTopic('2. Thermodynamics')).toBe(true);
  });

  it('identifies capitalized topics', () => {
    expect(isLikelyMainTopic('MECHANICS')).toBe(true);
  });

  it('rejects bullet points', () => {
    expect(isLikelyMainTopic('• describe forces')).toBe(false);
    expect(isLikelyMainTopic('- explain motion')).toBe(false);
  });
});

describe('isLikelySubtopic', () => {
  it('identifies sub-numbered items', () => {
    expect(isLikelySubtopic('1.1 Forces')).toBe(true);
    expect(isLikelySubtopic('2.3 Energy')).toBe(true);
  });

  it('identifies letter-prefixed items', () => {
    expect(isLikelySubtopic('a) Motion')).toBe(true);
    expect(isLikelySubtopic('(b) Velocity')).toBe(true);
  });
});

describe('isLikelyBullet', () => {
  it('identifies bullet points', () => {
    expect(isLikelyBullet('• describe the motion')).toBe(true);
    expect(isLikelyBullet('- explain forces')).toBe(true);
    expect(isLikelyBullet('* calculate velocity')).toBe(true);
  });

  it('identifies action verb starts', () => {
    expect(isLikelyBullet('describe how forces affect motion')).toBe(true);
    expect(isLikelyBullet('explain the concept of energy')).toBe(true);
    expect(isLikelyBullet('calculate the velocity')).toBe(true);
  });
});

describe('cleanExtractedText', () => {
  it('trims whitespace', () => {
    expect(cleanExtractedText('  hello world  ')).toBe('hello world');
  });

  it('removes multiple spaces', () => {
    expect(cleanExtractedText('hello    world')).toBe('hello world');
  });

  it('removes bullet prefixes', () => {
    expect(cleanExtractedText('• hello')).toBe('hello');
    expect(cleanExtractedText('- hello')).toBe('hello');
    expect(cleanExtractedText('* hello')).toBe('hello');
  });
});
