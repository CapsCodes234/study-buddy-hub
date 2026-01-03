/**
 * Chapter Completion Tracking
 * Tracks which chapters have been celebrated to avoid repeat toasts
 */

const STORAGE_KEY = 'chapter-completion-celebrated';

export interface CelebratedChapters {
  [subjectId: string]: string[]; // Array of mainTopic names that have been celebrated
}

// Celebration messages - picked randomly
const CELEBRATION_MESSAGES = [
  '🔥 Nice! You completed "{chapter}".',
  '✅ Chapter cleared: "{chapter}". Keep going!',
  '🚀 Momentum! "{chapter}" is done.',
  '💪 Crushed it! "{chapter}" complete.',
  '⭐ "{chapter}" mastered. You\'re on fire!',
  '🎯 Bullseye! "{chapter}" is in the bag.',
  '📚 One more down: "{chapter}" complete!',
  '🏆 Victory! "{chapter}" conquered.',
];

/**
 * Get all celebrated chapters from localStorage
 */
export function getCelebratedChapters(): CelebratedChapters {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Check if a chapter has already been celebrated
 */
export function isChapterCelebrated(subjectId: string, mainTopic: string): boolean {
  const celebrated = getCelebratedChapters();
  return celebrated[subjectId]?.includes(mainTopic) ?? false;
}

/**
 * Mark a chapter as celebrated
 */
export function markChapterCelebrated(subjectId: string, mainTopic: string): void {
  try {
    const celebrated = getCelebratedChapters();
    if (!celebrated[subjectId]) {
      celebrated[subjectId] = [];
    }
    if (!celebrated[subjectId].includes(mainTopic)) {
      celebrated[subjectId].push(mainTopic);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(celebrated));
    }
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Clear celebrated chapters for a specific subject
 * Called when subject data is cleared
 */
export function clearCelebratedChaptersForSubject(subjectId: string): void {
  try {
    const celebrated = getCelebratedChapters();
    if (celebrated[subjectId]) {
      delete celebrated[subjectId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(celebrated));
    }
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Get a random celebration message
 */
export function getRandomCelebrationMessage(chapterName: string): string {
  const randomIndex = Math.floor(Math.random() * CELEBRATION_MESSAGES.length);
  return CELEBRATION_MESSAGES[randomIndex].replace('{chapter}', chapterName);
}

/**
 * Calculate chapter completion stats for a subject
 */
export interface ChapterStats {
  totalChapters: number;
  completedChapters: number;
  chapterDetails: Map<string, { total: number; confident: number; isComplete: boolean }>;
}

export function calculateChapterStats(
  bulletsConfidenceMap: Map<string, boolean> // mainTopic -> isConfident for each bullet
): ChapterStats {
  const chapterDetails = new Map<string, { total: number; confident: number; isComplete: boolean }>();
  
  for (const [mainTopic, isConfident] of bulletsConfidenceMap) {
    const existing = chapterDetails.get(mainTopic) || { total: 0, confident: 0, isComplete: false };
    existing.total++;
    if (isConfident) existing.confident++;
    chapterDetails.set(mainTopic, existing);
  }
  
  // Calculate isComplete for each chapter
  let completedChapters = 0;
  for (const [topic, stats] of chapterDetails) {
    stats.isComplete = stats.total > 0 && stats.confident === stats.total;
    if (stats.isComplete) completedChapters++;
    chapterDetails.set(topic, stats);
  }
  
  return {
    totalChapters: chapterDetails.size,
    completedChapters,
    chapterDetails,
  };
}
