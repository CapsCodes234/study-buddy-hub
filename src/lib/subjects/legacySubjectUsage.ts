/**
 * Legacy Subject Usage Detection
 * 
 * Detects which subjects have actual local study data (bullets, past papers).
 * Used for pre-selection in the subject selection gate when server returns zero subjects.
 * 
 * IMPORTANT: Does NOT use DEFAULT_SUBJECTS or state.subjects for detection.
 * Only uses actual study data to avoid treating synthesized defaults as user selection.
 */

import type { Bullet, PastPaper } from '@/types';

/**
 * Get the set of subject IDs that have actual local study data
 * 
 * @param bullets - Array of bullets
 * @param pastPapers - Array of past papers
 * @returns Set of subject IDs with study data
 */
export function getSubjectsWithStudyData(
  bullets: Bullet[],
  pastPapers: PastPaper[]
): Set<string> {
  const subjectIds = new Set<string>();

  // Add subject IDs from bullets
  for (const bullet of bullets) {
    if (bullet.subjectId && bullet.subjectId.trim()) {
      subjectIds.add(bullet.subjectId.trim());
    }
  }

  // Add subject IDs from past papers
  for (const paper of pastPapers) {
    if (paper.subjectId && paper.subjectId.trim()) {
      subjectIds.add(paper.subjectId.trim());
    }
  }

  return subjectIds;
}

/**
 * Check if a specific subject has study data
 * 
 * @param subjectId - The subject ID to check
 * @param bullets - Array of bullets
 * @param pastPapers - Array of past papers
 * @returns True if the subject has bullets or past papers
 */
export function subjectHasStudyData(
  subjectId: string,
  bullets: Bullet[],
  pastPapers: PastPaper[]
): boolean {
  const normalizedId = subjectId.trim();

  // Check bullets
  const hasBullets = bullets.some(b => b.subjectId.trim() === normalizedId);
  if (hasBullets) return true;

  // Check past papers
  const hasPapers = pastPapers.some(p => p.subjectId.trim() === normalizedId);
  return hasPapers;
}

/**
 * Get subject IDs that should be pre-checked in the selection gate
 * 
 * This is based on actual local study data, not on DEFAULT_SUBJECTS or state.subjects.
 * 
 * @param bullets - Array of bullets
 * @param pastPapers - Array of past papers
 * @returns Array of subject IDs to pre-check
 */
export function getPreSelectedSubjectIds(
  bullets: Bullet[],
  pastPapers: PastPaper[]
): string[] {
  return Array.from(getSubjectsWithStudyData(bullets, pastPapers));
}

/**
 * Check if there is any genuine legacy subject data
 * 
 * This distinguishes between:
 * - A user who actually had subjects before (has bullets/papers)
 * - A brand new user who only has synthesized DEFAULT_SUBJECTS
 * 
 * @param bullets - Array of bullets
 * @param pastPapers - Array of past papers
 * @returns True if there is genuine legacy subject data
 */
export function hasGenuineLegacyData(
  bullets: Bullet[],
  pastPapers: PastPaper[]
): boolean {
  return bullets.length > 0 || pastPapers.length > 0;
}
