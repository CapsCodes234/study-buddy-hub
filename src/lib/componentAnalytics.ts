/**
 * Component Analytics — pure functions to compute per-component stats
 * from past paper attempts and component metadata.
 */

import { PastPaper } from '@/types';
import { Component } from '@/types/components';

export interface ComponentStat {
  componentId: string;
  componentName: string;
  paperCode: string;
  totalMarks: number;
  durationMin: number;
  weightingPercent: number;
  isUnknown: boolean; // true if component metadata not found

  totalAttempts: number;
  completedAttempts: number;
  startedAttempts: number; // attempts with no rawScore
  completionRate: number; // completedAttempts / totalAttempts

  avgPercentage: number | null; // completed only
  bestPercentage: number | null;
  latestPercentage: number | null;
  latestDate: string | null;

  trend: 'up' | 'down' | 'flat' | null; // last 3 vs prev 3 completed avg
  avgDurationUsed: number | null; // completed only
  timeEfficiency: number | null; // avgDurationUsed / durationMin (< 1 = fast)

  attempts: PastPaper[]; // all attempts sorted most-recent first
}

export function computeComponentStats(
  subjectId: string,
  papers: PastPaper[],
  components: Component[]
): ComponentStat[] {
  const subjectPapers = papers.filter((p) => p.subjectId === subjectId);

  // Index papers by componentId
  const byComponent = new Map<string, PastPaper[]>();
  for (const p of subjectPapers) {
    const key = p.componentId || '__none__';
    if (!byComponent.has(key)) byComponent.set(key, []);
    byComponent.get(key)!.push(p);
  }

  // Also ensure all known components appear even if no attempts
  for (const c of components) {
    if (c.subjectId === subjectId && !byComponent.has(c.id)) {
      byComponent.set(c.id, []);
    }
  }

  const componentMap = new Map(components.map((c) => [c.id, c]));
  const results: ComponentStat[] = [];

  byComponent.forEach((attempts, compId) => {
    const comp = componentMap.get(compId);
    const isUnknown = !comp;

    // Sort attempts by date, most recent first
    const sorted = [...attempts].sort((a, b) => {
      const da = a.attemptDate || a.createdAt;
      const db = b.attemptDate || b.createdAt;
      return db.localeCompare(da);
    });

    const completed = sorted.filter(
      (p) => p.completed && p.rawScore !== undefined && p.rawScore !== null
    );
    const started = sorted.filter(
      (p) => !p.completed || p.rawScore === undefined || p.rawScore === null
    );

    const percentages = completed
      .map((p) => p.percentageScore ?? (p.totalMarks > 0 ? (p.rawScore! / p.totalMarks) * 100 : null))
      .filter((v): v is number => v !== null);

    const avgPercentage =
      percentages.length > 0 ? Math.round((percentages.reduce((s, v) => s + v, 0) / percentages.length) * 10) / 10 : null;
    const bestPercentage = percentages.length > 0 ? Math.round(Math.max(...percentages) * 10) / 10 : null;

    // Latest = most recent completed
    const latestCompleted = completed[0];
    const latestPercentage = latestCompleted
      ? Math.round(
          ((latestCompleted.percentageScore ??
            (latestCompleted.totalMarks > 0 ? (latestCompleted.rawScore! / latestCompleted.totalMarks) * 100 : 0)) *
            10) /
            10
        )
      : null;
    const latestDate = latestCompleted ? latestCompleted.attemptDate || latestCompleted.createdAt : null;

    // Trend: last 3 completed avg vs previous 3
    let trend: 'up' | 'down' | 'flat' | null = null;
    if (percentages.length >= 4) {
      const recent3 = percentages.slice(0, 3);
      const prev3 = percentages.slice(3, 6);
      if (prev3.length > 0) {
        const recentAvg = recent3.reduce((s, v) => s + v, 0) / recent3.length;
        const prevAvg = prev3.reduce((s, v) => s + v, 0) / prev3.length;
        const diff = recentAvg - prevAvg;
        trend = diff > 2 ? 'up' : diff < -2 ? 'down' : 'flat';
      }
    }

    // Duration
    const durations = completed.filter((p) => p.durationUsed).map((p) => p.durationUsed!);
    const avgDurationUsed =
      durations.length > 0 ? Math.round(durations.reduce((s, v) => s + v, 0) / durations.length) : null;
    const durationMin = comp?.durationMin || 0;
    const timeEfficiency = avgDurationUsed && durationMin > 0 ? Math.round((avgDurationUsed / durationMin) * 100) / 100 : null;

    results.push({
      componentId: compId,
      componentName: comp?.componentName || 'Unknown Component',
      paperCode: comp?.paperCode || compId,
      totalMarks: comp?.totalMarks || 0,
      durationMin,
      weightingPercent: comp?.weightingPercent || 0,
      isUnknown,
      totalAttempts: sorted.length,
      completedAttempts: completed.length,
      startedAttempts: started.length,
      completionRate: sorted.length > 0 ? Math.round((completed.length / sorted.length) * 100) : 0,
      avgPercentage,
      bestPercentage,
      latestPercentage,
      latestDate,
      trend,
      avgDurationUsed,
      timeEfficiency,
      attempts: sorted,
    });
  });

  // Sort: most attempts first, then by name
  return results.sort((a, b) => b.totalAttempts - a.totalAttempts || a.componentName.localeCompare(b.componentName));
}
