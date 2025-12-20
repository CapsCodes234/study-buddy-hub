/**
 * Subject Health Analysis
 * 
 * Calculates health metrics for individual subjects
 */

import { Bullet, PastPaper, Subject } from '@/types';
import { calculateSubjectProgress } from '../progress';

export type SubjectHealthStatus = 'At Risk' | 'Stabilizing' | 'On Track' | 'Strong';

export interface SubjectHealth {
  subject: Subject;
  syllabusCoverage: number;
  redCount: number;
  amberCount: number;
  greenCount: number;
  doneCount: number;
  papersAttempted: number;
  papersTotal: number;
  papersCompletion: number;
  lastPracticedDate?: Date;
  status: SubjectHealthStatus;
  urgency: number; // Higher = more urgent
}

/**
 * Calculate subject health
 */
export function calculateSubjectHealth(
  subject: Subject,
  bullets: Bullet[],
  pastPapers: PastPaper[]
): SubjectHealth {
  const subjectBullets = bullets.filter(b => b.subjectId === subject.id);
  const subjectPapers = pastPapers.filter(p => p.subjectId === subject.id);

  const totalBullets = subjectBullets.length;
  const redCount = subjectBullets.filter(b => b.status === 'Red' && !b.done).length;
  const amberCount = subjectBullets.filter(b => b.status === 'Amber' && !b.done).length;
  const greenCount = subjectBullets.filter(b => b.status === 'Green' && !b.done).length;
  const doneCount = subjectBullets.filter(b => b.done).length;

  const syllabusCoverage = totalBullets > 0
    ? (greenCount + doneCount) / totalBullets
    : 0;

  const papersTotal = subjectPapers.length;
  const papersAttempted = subjectPapers.filter(p => p.completed).length;
  const papersCompletion = papersTotal > 0 ? papersAttempted / papersTotal : 0;

  // Get last practiced date
  const allDates = [
    ...subjectBullets.map(b => new Date(b.updatedAt)),
    ...subjectPapers.map(p => new Date(p.updatedAt)),
  ].filter(d => !isNaN(d.getTime()));

  const lastPracticedDate = allDates.length > 0
    ? new Date(Math.max(...allDates.map(d => d.getTime())))
    : undefined;

  // Determine status
  const status = determineSubjectStatus(
    syllabusCoverage,
    redCount,
    amberCount,
    papersCompletion,
    totalBullets
  );

  // Calculate urgency (0-100, higher = more urgent)
  const redRatio = totalBullets > 0 ? redCount / totalBullets : 0;
  const amberRatio = totalBullets > 0 ? amberCount / totalBullets : 0;
  const daysSincePractice = lastPracticedDate
    ? (Date.now() - lastPracticedDate.getTime()) / (1000 * 60 * 60 * 24)
    : 999;

  const urgency = Math.min(100, Math.round(
    redRatio * 50 + // Red items contribute heavily
    amberRatio * 30 + // Amber items contribute moderately
    (1 - papersCompletion) * 20 + // Incomplete papers
    Math.min(daysSincePractice / 30, 1) * 20 // Recency penalty
  ));

  return {
    subject,
    syllabusCoverage: Math.round(syllabusCoverage * 100),
    redCount,
    amberCount,
    greenCount,
    doneCount,
    papersAttempted,
    papersTotal,
    papersCompletion: Math.round(papersCompletion * 100),
    lastPracticedDate,
    status,
    urgency,
  };
}

/**
 * Determine subject health status based on metrics
 */
function determineSubjectStatus(
  syllabusCoverage: number,
  redCount: number,
  amberCount: number,
  papersCompletion: number,
  totalBullets: number
): SubjectHealthStatus {
  const redRatio = totalBullets > 0 ? redCount / totalBullets : 0;
  const amberRatio = totalBullets > 0 ? amberCount / totalBullets : 0;

  // Strong: High coverage, low red/amber, good paper completion
  if (syllabusCoverage >= 0.8 && redRatio < 0.1 && papersCompletion >= 0.7) {
    return 'Strong';
  }

  // On Track: Good coverage, manageable red/amber
  if (syllabusCoverage >= 0.6 && redRatio < 0.25 && papersCompletion >= 0.5) {
    return 'On Track';
  }

  // Stabilizing: Some progress but needs work
  if (syllabusCoverage >= 0.4 || (redRatio < 0.4 && amberRatio < 0.5)) {
    return 'Stabilizing';
  }

  // At Risk: Low coverage, high red/amber
  return 'At Risk';
}

/**
 * Get status color
 */
export function getStatusColor(status: SubjectHealthStatus): string {
  switch (status) {
    case 'Strong':
      return 'text-status-green';
    case 'On Track':
      return 'text-status-green';
    case 'Stabilizing':
      return 'text-status-amber';
    case 'At Risk':
      return 'text-status-red';
  }
}

/**
 * Get status background color
 */
export function getStatusBgColor(status: SubjectHealthStatus): string {
  switch (status) {
    case 'Strong':
      return 'bg-status-green/10 border-status-green/30';
    case 'On Track':
      return 'bg-status-green/10 border-status-green/20';
    case 'Stabilizing':
      return 'bg-status-amber/10 border-status-amber/20';
    case 'At Risk':
      return 'bg-status-red/10 border-status-red/30';
  }
}

