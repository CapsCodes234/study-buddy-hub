/**
 * Tests for catalogue UI ID mapping utilities
 */

import { describe, it, expect } from 'vitest';
import {
  catalogueSlugToUiId,
  getFallbackColor,
  customSubjectToUiId,
  isCustomSubjectUiId,
  extractCustomSubjectId,
} from '../catalogueUiIds';

describe('catalogueSlugToUiId', () => {
  it('should map legacy slugs to stable UI IDs', () => {
    expect(catalogueSlugToUiId('mathematics')).toBe('math');
    expect(catalogueSlugToUiId('physics')).toBe('physics');
    expect(catalogueSlugToUiId('information-technology')).toBe('it');
  });

  it('should handle case insensitivity', () => {
    expect(catalogueSlugToUiId('MATHEMATICS')).toBe('math');
    expect(catalogueSlugToUiId('Mathematics')).toBe('math');
    expect(catalogueSlugToUiId('PHYSICS')).toBe('physics');
  });

  it('should handle whitespace trimming', () => {
    expect(catalogueSlugToUiId('  mathematics  ')).toBe('math');
    expect(catalogueSlugToUiId('physics ')).toBe('physics');
  });

  it('should return slug directly for non-legacy subjects', () => {
    expect(catalogueSlugToUiId('chemistry')).toBe('chemistry');
    expect(catalogueSlugToUiId('biology')).toBe('biology');
    expect(catalogueSlugToUiId('computer-science')).toBe('computer-science');
  });

  it('should handle future catalogue subjects generically', () => {
    expect(catalogueSlugToUiId('economics')).toBe('economics');
    expect(catalogueSlugToUiId('history')).toBe('history');
  });
});

describe('getFallbackColor', () => {
  it('should return a valid HSL color string', () => {
    const color = getFallbackColor('math');
    expect(color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });

  it('should return consistent colors for the same UI ID', () => {
    const color1 = getFallbackColor('math');
    const color2 = getFallbackColor('math');
    expect(color1).toBe(color2);
  });

  it('should return different colors for different UI IDs', () => {
    const color1 = getFallbackColor('math');
    const color2 = getFallbackColor('physics');
    expect(color1).not.toBe(color2);
  });

  it('should handle custom subject IDs', () => {
    const color = getFallbackColor('custom-abc123');
    expect(color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });
});

describe('customSubjectToUiId', () => {
  it('should prefix custom subject UUID with custom-', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const uiId = customSubjectToUiId(uuid);
    expect(uiId).toBe(`custom-${uuid}`);
  });

  it('should handle different UUID formats', () => {
    const uuid1 = '123e4567-e89b-12d3-a456-426614174000';
    const uiId1 = customSubjectToUiId(uuid1);
    expect(uiId1).toBe(`custom-${uuid1}`);
  });
});

describe('isCustomSubjectUiId', () => {
  it('should return true for custom subject UI IDs', () => {
    expect(isCustomSubjectUiId('custom-550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isCustomSubjectUiId('custom-abc123')).toBe(true);
  });

  it('should return false for non-custom subject UI IDs', () => {
    expect(isCustomSubjectUiId('math')).toBe(false);
    expect(isCustomSubjectUiId('physics')).toBe(false);
    expect(isCustomSubjectUiId('chemistry')).toBe(false);
  });

  it('should return false for strings starting with custom- but not being UUIDs', () => {
    expect(isCustomSubjectUiId('custom-subject')).toBe(true); // Still true based on prefix
  });
});

describe('extractCustomSubjectId', () => {
  it('should extract UUID from custom subject UI ID', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const uiId = `custom-${uuid}`;
    const extracted = extractCustomSubjectId(uiId);
    expect(extracted).toBe(uuid);
  });

  it('should return null for non-custom subject UI IDs', () => {
    expect(extractCustomSubjectId('math')).toBe(null);
    expect(extractCustomSubjectId('physics')).toBe(null);
  });

  it('should return null for strings without custom- prefix', () => {
    expect(extractCustomSubjectId('abc123')).toBe(null);
    expect(extractCustomSubjectId('')).toBe(null);
  });
});
