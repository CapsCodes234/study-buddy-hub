/**
 * Chapter Planning Storage
 * localStorage-backed store for chapter deadlines.
 * Key: study-tracker-chapter-planning
 */

import {
  ChapterPlanning,
  chapterPlanningArraySchema,
  normalizeChapterKey,
} from '@/types/chapterPlanning';

const STORAGE_KEY = 'study-tracker-chapter-planning';

/** Load all chapter plannings from localStorage with validation */
export function loadChapterPlannings(): ChapterPlanning[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    const result = chapterPlanningArraySchema.safeParse(parsed);
    if (result.success) {
      return dedupeChapterPlannings(result.data as ChapterPlanning[]);
    }
    console.warn('Chapter planning data failed validation, returning empty');
    return [];
  } catch {
    return [];
  }
}

/** Save chapter plannings to localStorage */
export function saveChapterPlannings(plannings: ChapterPlanning[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dedupeChapterPlannings(plannings)));
  } catch {
    console.error('Failed to save chapter plannings');
  }
}

/** Deduplicate by (subjectId, chapterKey), keeping latest updatedAt */
function dedupeChapterPlannings(plannings: ChapterPlanning[]): ChapterPlanning[] {
  const map = new Map<string, ChapterPlanning>();
  for (const p of plannings) {
    const key = `${p.subjectId}|${p.chapterKey}`;
    const existing = map.get(key);
    if (!existing || p.updatedAt > existing.updatedAt) {
      map.set(key, p);
    }
  }
  return Array.from(map.values());
}

/** Get planning for a specific chapter */
export function getChapterPlanning(
  subjectId: string,
  mainTopic: string
): ChapterPlanning | undefined {
  const all = loadChapterPlannings();
  const key = normalizeChapterKey(mainTopic);
  return all.find((p) => p.subjectId === subjectId && p.chapterKey === key);
}

/** Set or update the "complete by" date for a chapter */
export function setChapterDeadline(
  subjectId: string,
  mainTopic: string,
  completeBy: string | undefined
): ChapterPlanning {
  const all = loadChapterPlannings();
  const key = normalizeChapterKey(mainTopic);
  const now = new Date().toISOString();

  const idx = all.findIndex((p) => p.subjectId === subjectId && p.chapterKey === key);
  const planning: ChapterPlanning = idx >= 0
    ? { ...all[idx], completeBy, updatedAt: now }
    : {
        subjectId,
        chapterKey: key,
        chapterTitle: mainTopic,
        completeBy,
        createdAt: now,
        updatedAt: now,
      };

  if (idx >= 0) {
    all[idx] = planning;
  } else {
    all.push(planning);
  }

  saveChapterPlannings(all);
  return planning;
}

/** Get all plannings for a subject */
export function getSubjectPlannings(subjectId: string): ChapterPlanning[] {
  return loadChapterPlannings().filter((p) => p.subjectId === subjectId);
}

/** Clear all plannings for a subject */
export function clearSubjectPlannings(subjectId: string): void {
  const all = loadChapterPlannings().filter((p) => p.subjectId !== subjectId);
  saveChapterPlannings(all);
}

export { STORAGE_KEY as CHAPTER_PLANNING_STORAGE_KEY };
