/**
 * Weakness Concentration Map
 * 
 * Identifies and ranks weak areas across all subjects
 */

import { Bullet, Subject } from '@/types';

export interface WeakArea {
  subjectId: string;
  subjectName: string;
  mainTopic: string;
  subtopic: string;
  redCount: number;
  amberCount: number;
  totalWeakCount: number;
  neglectScore: number; // Higher = more neglected
}

/**
 * Calculate weakness concentration map
 */
export function calculateWeaknessMap(
  subjects: Subject[],
  bullets: Bullet[]
): WeakArea[] {
  // Filter to only red and amber bullets
  const weakBullets = bullets.filter(
    b => (b.status === 'Red' || b.status === 'Amber') && !b.done
  );

  if (weakBullets.length === 0) {
    return [];
  }

  // Group by subject + mainTopic + subtopic
  const weaknessMap = new Map<string, {
    subjectId: string;
    subjectName: string;
    mainTopic: string;
    subtopic: string;
    redBullets: Bullet[];
    amberBullets: Bullet[];
    lastUpdated?: Date;
  }>();

  for (const bullet of weakBullets) {
    const key = `${bullet.subjectId}:${bullet.mainTopic}:${bullet.subtopic}`;
    const subject = subjects.find(s => s.id === bullet.subjectId);

    if (!weaknessMap.has(key)) {
      weaknessMap.set(key, {
        subjectId: bullet.subjectId,
        subjectName: subject?.name || bullet.subjectId,
        mainTopic: bullet.mainTopic,
        subtopic: bullet.subtopic,
        redBullets: [],
        amberBullets: [],
      });
    }

    const area = weaknessMap.get(key)!;
    if (bullet.status === 'Red') {
      area.redBullets.push(bullet);
    } else {
      area.amberBullets.push(bullet);
    }

    // Track last update
    const updated = new Date(bullet.updatedAt);
    if (!area.lastUpdated || updated > area.lastUpdated) {
      area.lastUpdated = updated;
    }
  }

  // Convert to WeakArea array and calculate scores
  const weakAreas: WeakArea[] = Array.from(weaknessMap.values()).map(area => {
    const redCount = area.redBullets.length;
    const amberCount = area.amberBullets.length;
    const totalWeakCount = redCount + amberCount;

    // Neglect score: higher for areas with more items and older updates
    const daysSinceUpdate = area.lastUpdated
      ? (Date.now() - area.lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
      : 999;
    
    const neglectScore = totalWeakCount * 10 + Math.min(daysSinceUpdate, 90);

    return {
      subjectId: area.subjectId,
      subjectName: area.subjectName,
      mainTopic: area.mainTopic,
      subtopic: area.subtopic,
      redCount,
      amberCount,
      totalWeakCount,
      neglectScore,
    };
  });

  // Sort by total weak count (descending), then by neglect score
  return weakAreas.sort((a, b) => {
    if (b.totalWeakCount !== a.totalWeakCount) {
      return b.totalWeakCount - a.totalWeakCount;
    }
    return b.neglectScore - a.neglectScore;
  });
}

