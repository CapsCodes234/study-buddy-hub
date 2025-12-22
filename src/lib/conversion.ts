/**
 * Conversion Utilities - Raw marks to percentage and score calculations
 */

/**
 * Convert raw marks to percentage
 * @param raw - Raw marks obtained
 * @param total - Total marks available
 * @returns Percentage (0-100)
 */
export function convertRawToPercent(raw: number, total: number): number {
  if (total <= 0) {
    throw new Error('Total marks must be greater than 0');
  }
  if (raw < 0) {
    throw new Error('Raw marks cannot be negative');
  }
  if (raw > total) {
    console.warn(`Raw marks (${raw}) exceed total marks (${total})`);
  }
  return Math.round((raw / total) * 100 * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate overall percentage from multiple component results
 * @param componentResults - Array of component results with raw and total marks
 * @returns Overall percentage
 */
export function calculateOverallPercentage(
  componentResults: Array<{ rawMark: number; totalMark: number }>
): number {
  if (componentResults.length === 0) return 0;
  
  const totalRaw = componentResults.reduce((sum, r) => sum + r.rawMark, 0);
  const totalMarks = componentResults.reduce((sum, r) => sum + r.totalMark, 0);
  
  return convertRawToPercent(totalRaw, totalMarks);
}

/**
 * Get score category based on percentage
 */
export function getScoreCategory(percentage: number): 'excellent' | 'good' | 'average' | 'needs-improvement' {
  if (percentage >= 80) return 'excellent';
  if (percentage >= 60) return 'good';
  if (percentage >= 40) return 'average';
  return 'needs-improvement';
}

/**
 * Get grade boundary estimate (CIE A-Level style)
 */
export function estimateGrade(percentage: number): string {
  if (percentage >= 90) return 'A*';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  if (percentage >= 40) return 'E';
  return 'U';
}

/**
 * Format percentage for display
 */
export function formatPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`;
}

/**
 * Calculate weighted average
 */
export function calculateWeightedAverage(
  items: Array<{ value: number; weight: number }>
): number {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  if (totalWeight === 0) return 0;
  
  const weightedSum = items.reduce((sum, i) => sum + i.value * i.weight, 0);
  return weightedSum / totalWeight;
}

/**
 * Calculate progress towards exam readiness
 * Combines syllabus completion and past paper performance
 */
export function calculateReadinessScore(
  syllabusProgress: number, // 0-1
  paperAverageScore: number, // 0-100
  paperCompletionRate: number, // 0-1
  weights: { syllabus: number; paperScore: number; paperCompletion: number } = {
    syllabus: 0.4,
    paperScore: 0.4,
    paperCompletion: 0.2,
  }
): number {
  const normalizedPaperScore = paperAverageScore / 100;
  
  const score =
    syllabusProgress * weights.syllabus +
    normalizedPaperScore * weights.paperScore +
    paperCompletionRate * weights.paperCompletion;
  
  return Math.round(score * 100);
}
