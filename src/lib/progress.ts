/**
 * Progress Calculation Functions
 * 
 * Formulas:
 * - Status mapping: Red=0, Amber=0.5, Green=1, Done checkbox overrides to 1
 * - subject_progress = sum(bulletScores) / number_of_bullets_in_subject
 * - pastpaper_progress = completed_papers / total_papers_for_subject
 * - overall_progress = average(all subject_progress values)
 * 
 * Future: Support optional subject weights
 */

import { Bullet, PastPaper, Subject, SubjectProgress, OverallProgress, Status } from '@/types';

/**
 * Calculate numeric score for a bullet point
 * Done checkbox overrides status to 1
 */
export const getBulletScore = (bullet: Bullet): number => {
  if (bullet.done) return 1;
  
  switch (bullet.status) {
    case 'Green':
      return 1;
    case 'Amber':
      return 0.5;
    case 'Red':
      return 0;
    default:
      return 0;
  }
};

/**
 * Calculate progress for a single subject
 */
export const calculateSubjectProgress = (
  subject: Subject,
  bullets: Bullet[],
  pastPapers: PastPaper[]
): SubjectProgress => {
  const subjectBullets = bullets.filter(b => b.subjectId === subject.id);
  const subjectPapers = pastPapers.filter(p => p.subjectId === subject.id);
  
  const totalBullets = subjectBullets.length;
  const completedBullets = subjectBullets.filter(b => b.done || b.status === 'Green').length;
  
  const syllabusProgress = totalBullets > 0
    ? subjectBullets.reduce((sum, b) => sum + getBulletScore(b), 0) / totalBullets
    : 0;
  
  const totalPapers = subjectPapers.length;
  const completedPapers = subjectPapers.filter(p => p.completed).length;
  
  const pastPaperProgress = totalPapers > 0
    ? completedPapers / totalPapers
    : 0;
  
  // Get top Red bullets for dashboard display
  const redBullets = subjectBullets
    .filter(b => b.status === 'Red' && !b.done)
    .slice(0, 3);
  
  // Get Amber bullets for focus tracking
  const amberBullets = subjectBullets
    .filter(b => b.status === 'Amber' && !b.done)
    .slice(0, 3);
  
  return {
    subjectId: subject.id,
    subjectName: subject.name,
    syllabusProgress,
    pastPaperProgress,
    totalBullets,
    completedBullets,
    totalPapers,
    completedPapers,
    redBullets,
    amberBullets,
  };
};

/**
 * Calculate overall progress across all subjects
 */
export const calculateOverallProgress = (
  subjects: Subject[],
  bullets: Bullet[],
  pastPapers: PastPaper[]
): OverallProgress => {
  if (subjects.length === 0) {
    return {
      averageSyllabusProgress: 0,
      averagePastPaperProgress: 0,
      totalBullets: 0,
      totalCompletedBullets: 0,
      totalPapers: 0,
      totalCompletedPapers: 0,
    };
  }
  
  const subjectProgresses = subjects.map(s => 
    calculateSubjectProgress(s, bullets, pastPapers)
  );
  
  // Filter subjects that have content for averaging
  const subjectsWithBullets = subjectProgresses.filter(sp => sp.totalBullets > 0);
  const subjectsWithPapers = subjectProgresses.filter(sp => sp.totalPapers > 0);
  
  const averageSyllabusProgress = subjectsWithBullets.length > 0
    ? subjectsWithBullets.reduce((sum, sp) => sum + sp.syllabusProgress, 0) / subjectsWithBullets.length
    : 0;
  
  const averagePastPaperProgress = subjectsWithPapers.length > 0
    ? subjectsWithPapers.reduce((sum, sp) => sum + sp.pastPaperProgress, 0) / subjectsWithPapers.length
    : 0;
  
  return {
    averageSyllabusProgress,
    averagePastPaperProgress,
    totalBullets: bullets.length,
    totalCompletedBullets: bullets.filter(b => b.done || b.status === 'Green').length,
    totalPapers: pastPapers.length,
    totalCompletedPapers: pastPapers.filter(p => p.completed).length,
  };
};

/**
 * Format progress as percentage string
 */
export const formatProgress = (progress: number): string => {
  return `${Math.round(progress * 100)}%`;
};

/**
 * Get status color class based on progress
 */
export const getProgressColor = (progress: number): string => {
  if (progress >= 0.8) return 'text-status-green';
  if (progress >= 0.5) return 'text-status-amber';
  if (progress > 0) return 'text-status-red';
  return 'text-muted-foreground';
};

/**
 * Get background color class for status
 */
export const getStatusBgClass = (status: Status | 'Done'): string => {
  switch (status) {
    case 'Red':
      return 'status-red';
    case 'Amber':
      return 'status-amber';
    case 'Green':
      return 'status-green';
    case 'Done':
      return 'status-done';
    default:
      return 'bg-muted text-muted-foreground';
  }
};
