/**
 * Exam Readiness Simulation (30 Days)
 * 
 * Rule-based simulation of exam readiness if exam was in 30 days
 */

import { Bullet, PastPaper, Subject } from '@/types';
import { calculateSubjectProgress } from '../progress';

export interface ExamSimulation {
  overallRisk: 'Critical' | 'High' | 'Moderate' | 'Low';
  subjectsAtRisk: Array<{
    subject: Subject;
    riskLevel: 'Critical' | 'High' | 'Moderate';
    reasons: string[];
  }>;
  immediateFocus: string[];
  estimatedReadiness: number; // 0-100
}

/**
 * Simulate exam readiness in 30 days
 */
export function simulateExamReadiness(
  subjects: Subject[],
  bullets: Bullet[],
  pastPapers: PastPaper[]
): ExamSimulation {
  if (subjects.length === 0 || bullets.length === 0) {
    return {
      overallRisk: 'Critical',
      subjectsAtRisk: [],
      immediateFocus: ['Add syllabus data to begin assessment'],
      estimatedReadiness: 0,
    };
  }

  const subjectsAtRisk: ExamSimulation['subjectsAtRisk'] = [];
  const immediateFocus: string[] = [];

  // Analyze each subject
  for (const subject of subjects) {
    const subjectBullets = bullets.filter(b => b.subjectId === subject.id);
    const subjectPapers = pastPapers.filter(p => p.subjectId === subject.id);

    if (subjectBullets.length === 0) continue;

    const progress = calculateSubjectProgress(subject, bullets, pastPapers);
    const redCount = subjectBullets.filter(b => b.status === 'Red' && !b.done).length;
    const amberCount = subjectBullets.filter(b => b.status === 'Amber' && !b.done).length;
    const redRatio = redCount / subjectBullets.length;
    const amberRatio = amberCount / subjectBullets.length;

    const reasons: string[] = [];
    let riskLevel: 'Critical' | 'High' | 'Moderate' | null = null;

    // Critical risk factors
    if (redRatio > 0.4 || progress.syllabusProgress < 0.3) {
      riskLevel = 'Critical';
      if (redRatio > 0.4) {
        reasons.push(`${Math.round(redRatio * 100)}% of items are red`);
      }
      if (progress.syllabusProgress < 0.3) {
        reasons.push(`Only ${Math.round(progress.syllabusProgress * 100)}% syllabus coverage`);
      }
    }
    // High risk factors
    else if (redRatio > 0.25 || progress.syllabusProgress < 0.5 || progress.pastPaperProgress < 0.3) {
      riskLevel = riskLevel || 'High';
      if (redRatio > 0.25) {
        reasons.push(`${Math.round(redRatio * 100)}% of items are red`);
      }
      if (progress.syllabusProgress < 0.5) {
        reasons.push(`Low syllabus coverage (${Math.round(progress.syllabusProgress * 100)}%)`);
      }
      if (progress.pastPaperProgress < 0.3) {
        reasons.push(`Low past paper completion (${Math.round(progress.pastPaperProgress * 100)}%)`);
      }
    }
    // Moderate risk factors
    else if (redRatio > 0.15 || amberRatio > 0.4 || progress.syllabusProgress < 0.7) {
      riskLevel = riskLevel || 'Moderate';
      if (redRatio > 0.15) {
        reasons.push(`Some red items need attention (${Math.round(redRatio * 100)}%)`);
      }
      if (amberRatio > 0.4) {
        reasons.push(`Many amber items need practice (${Math.round(amberRatio * 100)}%)`);
      }
      if (progress.syllabusProgress < 0.7) {
        reasons.push(`Syllabus coverage below target (${Math.round(progress.syllabusProgress * 100)}%)`);
      }
    }

    if (riskLevel) {
      subjectsAtRisk.push({
        subject,
        riskLevel,
        reasons,
      });
    }
  }

  // Determine overall risk
  const criticalCount = subjectsAtRisk.filter(s => s.riskLevel === 'Critical').length;
  const highCount = subjectsAtRisk.filter(s => s.riskLevel === 'High').length;
  const moderateCount = subjectsAtRisk.filter(s => s.riskLevel === 'Moderate').length;

  let overallRisk: ExamSimulation['overallRisk'];
  if (criticalCount > 0 || highCount >= subjects.length * 0.5) {
    overallRisk = 'Critical';
  } else if (highCount > 0 || moderateCount >= subjects.length * 0.5) {
    overallRisk = 'High';
  } else if (moderateCount > 0) {
    overallRisk = 'Moderate';
  } else {
    overallRisk = 'Low';
  }

  // Generate immediate focus recommendations
  if (criticalCount > 0) {
    immediateFocus.push(`Address ${criticalCount} subject(s) with critical risk`);
  }
  if (highCount > 0) {
    immediateFocus.push(`Prioritize ${highCount} high-risk subject(s)`);
  }

  const totalRed = bullets.filter(b => b.status === 'Red' && !b.done).length;
  if (totalRed > 0) {
    immediateFocus.push(`Focus on ${totalRed} red items across all subjects`);
  }

  const incompletePapers = pastPapers.filter(p => !p.completed).length;
  if (incompletePapers > 0) {
    immediateFocus.push(`Complete ${incompletePapers} incomplete past paper(s)`);
  }

  // Estimate readiness (0-100)
  const avgSyllabusProgress = subjects.reduce((sum, s) => {
    const p = calculateSubjectProgress(s, bullets, pastPapers);
    return sum + p.syllabusProgress;
  }, 0) / subjects.length;

  const avgPaperProgress = subjects.reduce((sum, s) => {
    const p = calculateSubjectProgress(s, bullets, pastPapers);
    return sum + p.pastPaperProgress;
  }, 0) / subjects.length;

  const redRatio = bullets.filter(b => b.status === 'Red' && !b.done).length / bullets.length;
  const estimatedReadiness = Math.round(
    (avgSyllabusProgress * 0.6 + avgPaperProgress * 0.4) * (1 - redRatio * 0.3) * 100
  );

  return {
    overallRisk,
    subjectsAtRisk,
    immediateFocus,
    estimatedReadiness: Math.min(100, Math.max(0, estimatedReadiness)),
  };
}

/**
 * Get risk color
 */
export function getRiskColor(risk: ExamSimulation['overallRisk']): string {
  switch (risk) {
    case 'Critical':
      return 'text-status-red';
    case 'High':
      return 'text-status-red';
    case 'Moderate':
      return 'text-status-amber';
    case 'Low':
      return 'text-status-green';
  }
}

/**
 * Get risk background color
 */
export function getRiskBgColor(risk: ExamSimulation['overallRisk']): string {
  switch (risk) {
    case 'Critical':
      return 'bg-status-red/10 border-status-red/30';
    case 'High':
      return 'bg-status-red/10 border-status-red/20';
    case 'Moderate':
      return 'bg-status-amber/10 border-status-amber/20';
    case 'Low':
      return 'bg-status-green/10 border-status-green/20';
  }
}

