/**
 * Data Integrity Utilities
 * 
 * Handles deduplication and integrity checks for app data.
 */

import { PastPaper, Bullet } from '@/types';
import { Component } from '@/types/components';

// Use the same key as storage.ts to avoid duplication
const COMPONENTS_STORAGE_KEY = 'study-tracker-components';

/**
 * Get a unique key for a past paper to detect duplicates.
 * We consider papers duplicates if they have the same subject, year, session, paper, variant, and componentId.
 */
function getPaperUniqueKey(paper: PastPaper): string {
  return `${paper.subjectId}|${paper.year}|${paper.session}|${paper.paper}|${paper.variant || ''}|${paper.componentId || ''}`;
}

/**
 * Get a unique key for a component to detect duplicates.
 * We consider components duplicates if they have the same subject and name (case-insensitive).
 */
function getComponentUniqueKey(component: Component): string {
  return `${component.subjectId}|${component.componentName.toLowerCase().trim()}`;
}

/**
 * Get a unique key for a bullet to detect duplicates.
 * Bullets with same subject, main topic, subtopic, and bullet text are considered duplicates.
 */
function getBulletUniqueKey(bullet: Bullet): string {
  return `${bullet.subjectId}|${bullet.mainTopic}|${bullet.subtopic}|${bullet.bulletText}`.toLowerCase();
}

/**
 * Deduplicate an array keeping the newest items (by updatedAt or createdAt).
 */
function deduplicateByKey<T extends { id: string; createdAt?: string; updatedAt?: string }> (
  items: T[],
  getKey: (item: T) => string
): { deduped: T[]; removedCount: number } {
  const seen = new Map<string, T>();

  for (const item of items) {
    const key = getKey(item);
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, item);
    } else {
      // Keep the newer one
      const existingDate = existing.updatedAt || existing.createdAt || '';
      const itemDate = item.updatedAt || item.createdAt || '';
      if (itemDate > existingDate) {
        seen.set(key, item);
      }
    }
  }

  const deduped = Array.from(seen.values());
  return {
    deduped,
    removedCount: items.length - deduped.length,
  };
}

/**
 * Deduplicate past papers.
 */
export function deduplicatePastPapers(papers: PastPaper[]): { deduped: PastPaper[]; removedCount: number } {
  return deduplicateByKey(papers, getPaperUniqueKey);
}

/**
 * Deduplicate bullets/topics.
 */
export function deduplicateBullets(bullets: Bullet[]): { deduped: Bullet[]; removedCount: number } {
  return deduplicateByKey(bullets, getBulletUniqueKey);
}

/**
 * Deduplicate components.
 */
export function deduplicateComponents(components: Component[]): { deduped: Component[]; removedCount: number } {
  return deduplicateByKey(components, getComponentUniqueKey);
}

/**
 * Load and deduplicate components from localStorage.
 */
export function loadAndDedupeComponents(): Component[] {
  try {
    const stored = localStorage.getItem(COMPONENTS_STORAGE_KEY);
    if (!stored) return [];
    
    const components: Component[] = JSON.parse(stored);
    const { deduped, removedCount } = deduplicateComponents(components);
    
    // If we removed duplicates, save the cleaned data back
    if (removedCount > 0) {
      console.log(`Data integrity: removed ${removedCount} duplicate components`);
      localStorage.setItem(COMPONENTS_STORAGE_KEY, JSON.stringify(deduped));
    }
    
    return deduped;
  } catch {
    return [];
  }
}

/**
 * Clear all components for a specific subject.
 */
export function clearSubjectComponents(subjectId: string): void {
  try {
    const stored = localStorage.getItem(COMPONENTS_STORAGE_KEY);
    if (!stored) return;
    
    const components: Component[] = JSON.parse(stored);
    const filtered = components.filter(c => c.subjectId !== subjectId);
    localStorage.setItem(COMPONENTS_STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore errors
  }
}

/**
 * Run a full data integrity check and return stats.
 */
export interface IntegrityCheckResult {
  bullets: { total: number; duplicates: number };
  papers: { total: number; duplicates: number };
  components: { total: number; duplicates: number };
  hasDuplicates: boolean;
}

export function runIntegrityCheck(
  bullets: Bullet[],
  papers: PastPaper[]
): IntegrityCheckResult {
  // Load components from localStorage
  let components: Component[] = [];
  try {
    const stored = localStorage.getItem(COMPONENTS_STORAGE_KEY);
    if (stored) {
      components = JSON.parse(stored);
    }
  } catch {
    // Ignore
  }

  const bulletResult = deduplicateBullets(bullets);
  const paperResult = deduplicatePastPapers(papers);
  const componentResult = deduplicateComponents(components);

  return {
    bullets: { total: bullets.length, duplicates: bulletResult.removedCount },
    papers: { total: papers.length, duplicates: paperResult.removedCount },
    components: { total: components.length, duplicates: componentResult.removedCount },
    hasDuplicates:
      bulletResult.removedCount > 0 ||
      paperResult.removedCount > 0 ||
      componentResult.removedCount > 0,
  };
}

/**
 * Repair all duplicates and return the cleaned data.
 */
export function repairDuplicates(
  bullets: Bullet[],
  papers: PastPaper[]
): {
  bullets: Bullet[];
  papers: PastPaper[];
  components: Component[];
  stats: IntegrityCheckResult;
} {
  // Load and clean components
  const components = loadAndDedupeComponents();
  
  const bulletResult = deduplicateBullets(bullets);
  const paperResult = deduplicatePastPapers(papers);
  const componentResult = deduplicateComponents(components);

  // Save cleaned components back
  localStorage.setItem(COMPONENTS_STORAGE_KEY, JSON.stringify(componentResult.deduped));

  return {
    bullets: bulletResult.deduped,
    papers: paperResult.deduped,
    components: componentResult.deduped,
    stats: {
      bullets: { total: bullets.length, duplicates: bulletResult.removedCount },
      papers: { total: papers.length, duplicates: paperResult.removedCount },
      components: { total: components.length, duplicates: componentResult.removedCount },
      hasDuplicates:
        bulletResult.removedCount > 0 ||
        paperResult.removedCount > 0 ||
        componentResult.removedCount > 0,
    },
  };
}

/**
 * Runtime integrity scan that detects and automatically cleans duplicates.
 * This ensures data integrity after imports, clear operations, and on app load.
 * 
 * @param bullets - Current bullets array
 * @param papers - Current past papers array
 * @param onCleanup - Optional callback to update state with cleaned data
 * @param showToast - Optional callback to show toast notifications
 * @returns Cleaned data and statistics
 */
export interface IntegrityScanResult {
  bullets: Bullet[];
  papers: PastPaper[];
  components: Component[];
  cleaned: boolean;
  stats: IntegrityCheckResult;
}

export function runIntegrityScan(
  bullets: Bullet[],
  papers: PastPaper[],
  onCleanup?: (cleaned: { bullets: Bullet[]; papers: PastPaper[] }) => void,
  showToast?: (message: string) => void
): IntegrityScanResult {
  // Load and check components
  const components = loadAndDedupeComponents();
  
  // Run deduplication
  const bulletResult = deduplicateBullets(bullets);
  const paperResult = deduplicatePastPapers(papers);
  const componentResult = deduplicateComponents(components);

  const hasDuplicates = 
    bulletResult.removedCount > 0 ||
    paperResult.removedCount > 0 ||
    componentResult.removedCount > 0;

  // If duplicates found, clean them
  if (hasDuplicates) {
    const totalRemoved = bulletResult.removedCount + paperResult.removedCount + componentResult.removedCount;
    const warningMsg = `Data integrity: Removed ${totalRemoved} duplicate record${totalRemoved !== 1 ? 's' : ''} (${bulletResult.removedCount} bullets, ${paperResult.removedCount} papers, ${componentResult.removedCount} components)`;
    
    console.warn(warningMsg);
    
    if (showToast) {
      showToast(warningMsg);
    }

    // Save cleaned components
    if (componentResult.removedCount > 0) {
      localStorage.setItem(COMPONENTS_STORAGE_KEY, JSON.stringify(componentResult.deduped));
    }

    // Notify parent to update state
    if (onCleanup) {
      onCleanup({
        bullets: bulletResult.deduped,
        papers: paperResult.deduped,
      });
    }
  }

  return {
    bullets: bulletResult.deduped,
    papers: paperResult.deduped,
    components: componentResult.deduped,
    cleaned: hasDuplicates,
    stats: {
      bullets: { total: bullets.length, duplicates: bulletResult.removedCount },
      papers: { total: papers.length, duplicates: paperResult.removedCount },
      components: { total: components.length, duplicates: componentResult.removedCount },
      hasDuplicates,
    },
  };
}