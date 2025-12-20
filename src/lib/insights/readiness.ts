/**
 * Global Readiness Score Calculation
 * 
 * Computes a 0-100 score indicating exam readiness based on:
 * - Syllabus coverage (40%)
 * - Red+Amber pressure penalty (30%)
 * - Past paper completion (20%)
 * - Recency of practice (10%)
 */

import { Bullet, PastPaper, Subject } from '@/types';
import { getBulletScore } from '../progress';

export interface ReadinessScore {
  score: number;
  label: 'At Risk' | 'Behind' | 'Catching Up' | 'On Track' | 'Exam Ready';
  breakdown: {
    syllabusCoverage: number;
    pressurePenalty: number;
    paperCompletion: number;
    recencyScore: number;
  };
}

/**
 * Calculate global readiness score
 */
export function calculateReadinessScore(
  subjects: Subject[],
  bullets: Bullet[],
  pastPapers: PastPaper[]
): ReadinessScore {
  if (subjects.length === 0 || bullets.length === 0) {
    return {
      score: 0,
      label: 'At Risk',
      breakdown: {
        syllabusCoverage: 0,
        pressurePenalty: 0,
        paperCompletion: 0,
        recencyScore: 0,
      },
    };
  }

  // 1. Syllabus Coverage (40% weight)
  // Green bullets / total bullets
  const totalBullets = bullets.length;
  const greenBullets = bullets.filter(b => b.status === 'Green' || b.done).length;
  const syllabusCoverage = totalBullets > 0 ? greenBullets / totalBullets : 0;

  // 2. Red+Amber Pressure Penalty (30% weight)
  // Penalty increases with more red/amber items
  const redBullets = bullets.filter(b => b.status === 'Red' && !b.done).length;
  const amberBullets = bullets.filter(b => b.status === 'Amber' && !b.done).length;
  const pressureRatio = totalBullets > 0 ? (redBullets + amberBullets * 0.5) / totalBullets : 0;
  const pressurePenalty = Math.max(0, 1 - pressureRatio); // Invert: lower pressure = higher score

  // 3. Past Paper Completion (20% weight)
  const totalPapers = pastPapers.length;
  const completedPapers = pastPapers.filter(p => p.completed).length;
  const paperCompletion = totalPapers > 0 ? completedPapers / totalPapers : 0.5; // Default to 50% if no papers

  // 4. Recency Score (10% weight)
  // Based on last activity timestamp
  const allTimestamps = [
    ...bullets.map(b => new Date(b.updatedAt).getTime()),
    ...pastPapers.map(p => new Date(p.updatedAt).getTime()),
  ].filter(ts => !isNaN(ts));

  let recencyScore = 0.5; // Default
  if (allTimestamps.length > 0) {
    const mostRecent = Math.max(...allTimestamps);
    const daysSinceActivity = (Date.now() - mostRecent) / (1000 * 60 * 60 * 24);
    
    // Score decreases with days since activity
    if (daysSinceActivity <= 1) recencyScore = 1.0;
    else if (daysSinceActivity <= 3) recencyScore = 0.8;
    else if (daysSinceActivity <= 7) recencyScore = 0.6;
    else if (daysSinceActivity <= 14) recencyScore = 0.4;
    else if (daysSinceActivity <= 30) recencyScore = 0.2;
    else recencyScore = 0.1;
  }

  // Weighted calculation
  const weightedScore =
    syllabusCoverage * 0.4 +
    pressurePenalty * 0.3 +
    paperCompletion * 0.2 +
    recencyScore * 0.1;

  const score = Math.round(weightedScore * 100);

  // Determine label
  let label: ReadinessScore['label'];
  if (score >= 90) label = 'Exam Ready';
  else if (score >= 75) label = 'On Track';
  else if (score >= 60) label = 'Catching Up';
  else if (score >= 40) label = 'Behind';
  else label = 'At Risk';

  return {
    score,
    label,
    breakdown: {
      syllabusCoverage: Math.round(syllabusCoverage * 100),
      pressurePenalty: Math.round(pressurePenalty * 100),
      paperCompletion: Math.round(paperCompletion * 100),
      recencyScore: Math.round(recencyScore * 100),
    },
  };
}

/**
 * Get readiness score color
 */
export function getReadinessColor(score: number): string {
  if (score >= 90) return 'text-status-green';
  if (score >= 75) return 'text-status-green';
  if (score >= 60) return 'text-status-amber';
  if (score >= 40) return 'text-status-amber';
  return 'text-status-red';
}

/**
 * Get readiness score background color
 */
export function getReadinessBgColor(score: number): string {
  if (score >= 90) return 'bg-status-green/10 border-status-green/30';
  if (score >= 75) return 'bg-status-green/10 border-status-green/20';
  if (score >= 60) return 'bg-status-amber/10 border-status-amber/20';
  if (score >= 40) return 'bg-status-amber/10 border-status-amber/30';
  return 'bg-status-red/10 border-status-red/30';
}

