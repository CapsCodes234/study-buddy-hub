/**
 * Streak Management Library
 */

import { StreakData, DEFAULT_STREAK_DATA, MilestoneAchievement } from '@/types/reminders';

const STREAK_STORAGE_KEY = 'study-tracker-streak';
const MILESTONES_STORAGE_KEY = 'study-tracker-milestones';

// Get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Load streak data from localStorage
export function loadStreakData(): StreakData {
  try {
    const stored = localStorage.getItem(STREAK_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_STREAK_DATA, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading streak data:', error);
  }
  return { ...DEFAULT_STREAK_DATA };
}

// Save streak data to localStorage
export function saveStreakData(data: StreakData): void {
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving streak data:', error);
  }
}

// Check if streak should be reset (no activity yesterday)
export function checkStreakHealth(data: StreakData): {
  isAtRisk: boolean;
  shouldReset: boolean;
  daysGap: number;
} {
  if (!data.lastActivityDate) {
    return { isAtRisk: false, shouldReset: false, daysGap: 0 };
  }

  const today = getTodayDate();
  const lastActivity = data.lastActivityDate;
  
  // Calculate days between last activity and today
  const lastDate = new Date(lastActivity);
  const todayDate = new Date(today);
  const diffTime = todayDate.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return {
    isAtRisk: diffDays === 1 || (diffDays === 0 && new Date().getHours() >= 21), // After 9 PM
    shouldReset: diffDays > 1,
    daysGap: diffDays,
  };
}

// Record activity and update streak
export function recordActivity(): StreakData {
  const data = loadStreakData();
  const today = getTodayDate();

  // Already logged activity today
  if (data.lastActivityDate === today) {
    return data;
  }

  const health = checkStreakHealth(data);

  let newStreak: number;
  
  if (health.shouldReset) {
    // Reset streak due to gap
    newStreak = 1;
  } else if (data.lastActivityDate === null) {
    // First activity ever
    newStreak = 1;
  } else {
    // Continue streak (yesterday or today)
    newStreak = data.currentStreak + 1;
  }

  const newData: StreakData = {
    currentStreak: newStreak,
    bestStreak: Math.max(data.bestStreak, newStreak),
    lastActivityDate: today,
    streakHistory: [...data.streakHistory, today].slice(-365), // Keep last year
    totalStudyDays: data.totalStudyDays + 1,
  };

  saveStreakData(newData);
  return newData;
}

// Get streak status for display
export function getStreakStatus(data: StreakData): {
  streak: number;
  status: 'healthy' | 'at_risk' | 'broken';
  message: string;
} {
  const health = checkStreakHealth(data);

  if (data.currentStreak === 0 || health.shouldReset) {
    return {
      streak: 0,
      status: 'broken',
      message: 'Start a new streak today!',
    };
  }

  if (health.isAtRisk) {
    return {
      streak: data.currentStreak,
      status: 'at_risk',
      message: `Don't lose your ${data.currentStreak}-day streak! Study something today.`,
    };
  }

  return {
    streak: data.currentStreak,
    status: 'healthy',
    message: `You're on a ${data.currentStreak}-day streak! Keep it up!`,
  };
}

// Milestone management
export function loadMilestones(): MilestoneAchievement[] {
  try {
    const stored = localStorage.getItem(MILESTONES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading milestones:', error);
  }
  return [];
}

export function saveMilestones(milestones: MilestoneAchievement[]): void {
  try {
    localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(milestones));
  } catch (error) {
    console.error('Error saving milestones:', error);
  }
}

export function addMilestone(
  type: MilestoneAchievement['type'],
  title: string,
  description: string
): MilestoneAchievement | null {
  const milestones = loadMilestones();
  
  // Check if this milestone already exists
  const exists = milestones.some(
    (m) => m.type === type && m.title === title
  );
  
  if (exists) return null;

  const newMilestone: MilestoneAchievement = {
    id: `milestone-${Date.now()}`,
    type,
    title,
    description,
    achievedAt: new Date().toISOString(),
    celebrated: false,
  };

  milestones.push(newMilestone);
  saveMilestones(milestones);

  return newMilestone;
}

export function markMilestoneCelebrated(milestoneId: string): void {
  const milestones = loadMilestones();
  const updated = milestones.map((m) =>
    m.id === milestoneId ? { ...m, celebrated: true } : m
  );
  saveMilestones(updated);
}

// Check for new milestones based on progress
export function checkMilestones(stats: {
  confidentTopics: number;
  completedPapers: number;
  currentStreak: number;
  subjectsComplete: string[];
}): MilestoneAchievement[] {
  const newMilestones: MilestoneAchievement[] = [];

  // Topic milestones
  const topicMilestones = [1, 10, 25, 50, 100];
  for (const count of topicMilestones) {
    if (stats.confidentTopics >= count) {
      const milestone = addMilestone(
        'topics',
        `${count} Topics Confident`,
        `You've marked ${count} topics as confident!`
      );
      if (milestone) newMilestones.push(milestone);
    }
  }

  // Paper milestones
  const paperMilestones = [1, 5, 10, 25];
  for (const count of paperMilestones) {
    if (stats.completedPapers >= count) {
      const milestone = addMilestone(
        'papers',
        `${count} Paper${count === 1 ? '' : 's'} Completed`,
        `You've completed ${count} past paper${count === 1 ? '' : 's'}!`
      );
      if (milestone) newMilestones.push(milestone);
    }
  }

  // Streak milestones
  const streakMilestones = [7, 14, 30, 60, 100];
  for (const count of streakMilestones) {
    if (stats.currentStreak >= count) {
      const milestone = addMilestone(
        'streak',
        `${count}-Day Streak`,
        `Amazing! ${count} consecutive study days!`
      );
      if (milestone) newMilestones.push(milestone);
    }
  }

  // Subject completion milestones
  for (const subjectName of stats.subjectsComplete) {
    const milestone = addMilestone(
      'subject_complete',
      `${subjectName} Mastered`,
      `You've completed all topics in ${subjectName}!`
    );
    if (milestone) newMilestones.push(milestone);
  }

  return newMilestones;
}
