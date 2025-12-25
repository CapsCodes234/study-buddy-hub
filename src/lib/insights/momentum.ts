/**
 * Study Momentum Analysis
 * 
 * Calculates study activity patterns and streaks
 */

import { Bullet, PastPaper } from '@/types';

export interface StudyMomentum {
  daysStudiedLast7: number;
  daysStudiedLast14: number;
  currentStreak: number;
  longestStreak: number;
  activityLevel: 'Low' | 'Moderate' | 'Strong';
  lastActivityDate?: Date;
}

/**
 * Calculate study momentum
 */
export function calculateMomentum(
  bullets: Bullet[],
  pastPapers: PastPaper[]
): StudyMomentum {
  // Collect all activity dates
  const activityDates = new Set<string>();

  // Add bullet update dates
  for (const bullet of bullets) {
    const date = new Date(bullet.updatedAt);
    if (!isNaN(date.getTime())) {
      activityDates.add(date.toISOString().split('T')[0]);
    }
  }

  // Add past paper attempt dates
  for (const paper of pastPapers) {
    const date = new Date(paper.updatedAt);
    if (!isNaN(date.getTime())) {
      activityDates.add(date.toISOString().split('T')[0]);
    }
  }

  const sortedDates = Array.from(activityDates)
    .map(d => new Date(d))
    .filter(d => !isNaN(d.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Count days studied in last 7 and 14 days
  const daysStudiedLast7 = sortedDates.filter(d => d >= sevenDaysAgo).length;
  const daysStudiedLast14 = sortedDates.filter(d => d >= fourteenDaysAgo).length;

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;

  if (sortedDates.length > 0) {
    // Current streak (consecutive days from today backwards)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Convert sorted dates to date strings for easier comparison
    const dateStrings = sortedDates.map(d => d.toISOString().split('T')[0]);
    const uniqueDateStrings = Array.from(new Set(dateStrings)).sort().reverse();
    
    const checkDate = new Date(today);
    let dateIndex = 0;
    
    while (dateIndex < uniqueDateStrings.length) {
      const checkStr = checkDate.toISOString().split('T')[0];
      const dateStr = uniqueDateStrings[dateIndex];
      
      if (dateStr === checkStr) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
        dateIndex++;
      } else if (dateStr < checkStr) {
        // Gap found, streak broken
        break;
      } else {
        // Skip past dates
        dateIndex++;
      }
    }

    // Longest streak (any consecutive period)
    let tempStreak = 1;
    for (let i = 1; i < uniqueDateStrings.length; i++) {
      const prevDate = new Date(uniqueDateStrings[i - 1]);
      const currDate = new Date(uniqueDateStrings[i]);
      const daysDiff = Math.floor(
        (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  // Determine activity level
  let activityLevel: 'Low' | 'Moderate' | 'Strong';
  if (daysStudiedLast7 >= 5) {
    activityLevel = 'Strong';
  } else if (daysStudiedLast7 >= 3) {
    activityLevel = 'Moderate';
  } else {
    activityLevel = 'Low';
  }

  const lastActivityDate = sortedDates.length > 0 ? sortedDates[0] : undefined;

  return {
    daysStudiedLast7,
    daysStudiedLast14,
    currentStreak,
    longestStreak,
    activityLevel,
    lastActivityDate,
  };
}

