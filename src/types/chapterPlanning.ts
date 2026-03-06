/**
 * Chapter Planning Types
 * "Complete by" deadlines and optional "Start by" dates for syllabus chapters.
 */

import { z } from 'zod';

export interface ChapterPlanning {
  subjectId: string;
  chapterKey: string; // normalized mainTopic (lowercase/trim)
  chapterTitle: string; // original mainTopic for display
  completeBy?: string; // ISO date: YYYY-MM-DD
  startBy?: string; // ISO date: YYYY-MM-DD (optional P1)
  createdAt: string;
  updatedAt: string;
}

export const chapterPlanningSchema = z.object({
  subjectId: z.string().min(1).max(200),
  chapterKey: z.string().min(1).max(500),
  chapterTitle: z.string().min(1).max(500),
  completeBy: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startBy: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const chapterPlanningArraySchema = z.array(chapterPlanningSchema).max(5000);

/** Deadline status for a chapter */
export type DeadlineStatus = 'on_track' | 'due_soon' | 'overdue' | 'completed' | 'no_deadline';

export interface DeadlineInfo {
  status: DeadlineStatus;
  daysRemaining?: number; // negative = overdue
  completeBy?: string;
  label: string;
}

/**
 * Calculate deadline status for a chapter.
 * @param completeBy ISO date string (YYYY-MM-DD) or undefined
 * @param isComplete whether all bullets are confident
 */
export function getDeadlineInfo(completeBy: string | undefined, isComplete: boolean): DeadlineInfo {
  if (isComplete) {
    return { status: 'completed', completeBy, label: 'Completed' };
  }
  if (!completeBy) {
    return { status: 'no_deadline', label: 'No deadline' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(completeBy + 'T00:00:00');
  const diffMs = deadline.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      status: 'overdue',
      daysRemaining,
      completeBy,
      label: `Overdue by ${Math.abs(daysRemaining)}d`,
    };
  }
  if (daysRemaining <= 7) {
    return {
      status: 'due_soon',
      daysRemaining,
      completeBy,
      label: daysRemaining === 0 ? 'Due today' : `Due in ${daysRemaining}d`,
    };
  }
  return {
    status: 'on_track',
    daysRemaining,
    completeBy,
    label: `Due in ${daysRemaining}d`,
  };
}

/** Normalize a mainTopic string to a stable chapterKey */
export function normalizeChapterKey(mainTopic: string): string {
  return mainTopic.toLowerCase().trim();
}
