/**
 * Reminder & Streak Types
 */

export interface Reminder {
  id: string;
  title: string;
  body: string;
  remindAtISO: string;  // ISO 8601 timestamp
  repeat: 'none' | 'daily' | 'weekly';
  subjectId?: string;
  topicId?: string;
  type: 'exam' | 'study' | 'streak' | 'reflection' | 'custom';
  dismissed: boolean;
  snoozedUntil?: string;
}

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastActivityDate: string | null; // ISO date string (YYYY-MM-DD)
  streakHistory: string[]; // Array of ISO date strings
  totalStudyDays: number;
}

export interface MilestoneAchievement {
  id: string;
  type: 'topics' | 'papers' | 'streak' | 'subject_complete';
  title: string;
  description: string;
  achievedAt: string;
  celebrated: boolean;
}

export interface WeeklyReflection {
  id: string;
  weekStartDate: string; // ISO date string
  improved: string;
  slipped: string;
  adjustments: string;
  subjectTags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReminderSettings {
  enabled: boolean;
  examCadence: number[]; // Days before exam to remind (e.g., [14, 7, 1])
  dailyStudyTime?: string; // HH:MM format
  streakReminderTime?: string; // HH:MM format for "streak at risk"
  reflectionDay: number; // 0 = Sunday, 6 = Saturday
  reflectionTime?: string; // HH:MM format
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  examCadence: [14, 7, 1],
  dailyStudyTime: '09:00',
  streakReminderTime: '21:00',
  reflectionDay: 0, // Sunday
  reflectionTime: '18:00',
};

export const DEFAULT_STREAK_DATA: StreakData = {
  currentStreak: 0,
  bestStreak: 0,
  lastActivityDate: null,
  streakHistory: [],
  totalStudyDays: 0,
};

// Confidence states (4-state system)
export type ConfidenceState = 'not_started' | 'in_progress' | 'confident' | 'needs_revision';

export const CONFIDENCE_CONFIG: Record<ConfidenceState, {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  not_started: {
    label: 'Not Started',
    emoji: '❌',
    color: 'text-status-red',
    bgColor: 'bg-status-red-bg',
    description: "Haven't reviewed this material yet",
  },
  in_progress: {
    label: 'In Progress',
    emoji: '⚠️',
    color: 'text-status-amber',
    bgColor: 'bg-status-amber-bg',
    description: 'Currently studying this topic',
  },
  confident: {
    label: 'Confident',
    emoji: '✅',
    color: 'text-status-green',
    bgColor: 'bg-status-green-bg',
    description: 'Feel ready for exam questions on this',
  },
  needs_revision: {
    label: 'Needs Revision',
    emoji: '🔁',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    description: 'Completed but needs more practice',
  },
};

// Exam schedule types
export interface ExamSchedule {
  id: string;
  subjectId: string;
  componentId?: string;
  examType: 'mock' | 'alevel';
  date: string; // ISO date string
  time?: string; // HH:MM format
  notes?: string;
  remindersCreated: boolean;
}

// Subject weighting for smart progress
export interface TopicWeighting {
  topicId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  examRelevance: 'low' | 'medium' | 'high';
  customWeight?: number;
}

export interface PaperWeighting {
  componentName: string;
  weight: number; // Percentage (e.g., 30 for 30%)
}
