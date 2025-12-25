import { PastPaper } from '@/types';

export interface VariantGroup {
  variant: string;
  papers: PastPaper[];
  totalRaw: number;
  totalMarks: number;
  percentage: number;
}

export interface SessionGroup {
  session: string;
  variants: VariantGroup[];
  averagePercentage: number;
  papersCount: number;
}

export interface YearGroup {
  year: number;
  sessions: SessionGroup[];
  yearAverage: number;
  totalPapers: number;
}

export function groupPapersByYear(papers: PastPaper[]): YearGroup[] {
  const years = new Map<number, Map<string, Map<string, PastPaper[]>>>();

  papers.forEach((paper) => {
    if (!years.has(paper.year)) {
      years.set(paper.year, new Map());
    }
    const yearMap = years.get(paper.year)!;

    if (!yearMap.has(paper.session)) {
      yearMap.set(paper.session, new Map());
    }
    const sessionMap = yearMap.get(paper.session)!;

    const variant = paper.variant || 'no-variant';
    if (!sessionMap.has(variant)) {
      sessionMap.set(variant, []);
    }
    sessionMap.get(variant)!.push(paper);
  });

  const result: YearGroup[] = [];

  years.forEach((sessionsMap, year) => {
    const sessions: SessionGroup[] = [];
    let yearTotalPapers = 0;

    sessionsMap.forEach((variantsMap, session) => {
      const variants: VariantGroup[] = [];
      let sessionPapersCount = 0;

      variantsMap.forEach((variantPapers, variant) => {
        const totalRaw = variantPapers.reduce((sum, p) => sum + (p.rawScore || 0), 0);
        const totalMarks = variantPapers.reduce((sum, p) => sum + (p.totalMarks || 0), 0);
        const percentage = (() => {
          if (totalMarks > 0) return (totalRaw / totalMarks) * 100;
          const percentages = variantPapers
            .map((p) => (p.percentageScore ?? p.score))
            .filter((v): v is number => v !== undefined && v !== null);
          if (percentages.length > 0) {
            return percentages.reduce((sum, v) => sum + v, 0) / percentages.length;
          }
          return 0;
        })();

        variants.push({
          variant: variant === 'no-variant' ? 'Default' : `Variant ${variant}`,
          papers: variantPapers,
          totalRaw,
          totalMarks,
          percentage: Math.round(percentage * 10) / 10,
        });

        sessionPapersCount += variantPapers.length;
      });

      const averagePercentage =
        variants.length > 0
          ? variants.reduce((sum, v) => sum + v.percentage, 0) / variants.length
          : 0;

      sessions.push({
        session,
        variants,
        averagePercentage: Math.round(averagePercentage * 10) / 10,
        papersCount: sessionPapersCount,
      });

      yearTotalPapers += sessionPapersCount;
    });

    const yearAverage =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.averagePercentage, 0) / sessions.length
        : 0;

    result.push({
      year,
      sessions,
      yearAverage: Math.round(yearAverage * 10) / 10,
      totalPapers: yearTotalPapers,
    });
  });

  return result.sort((a, b) => b.year - a.year);
}

export function calculateYearlyPerformance(
  allPapers: PastPaper[],
  subjects: string[]
): {
  year: number;
  subjectAverages: Record<string, number>;
  overallAverage: number;
  papersCount: number;
}[] {
  void subjects;

  const years = new Map<number, Map<string, number[]>>();

  allPapers.forEach((paper) => {
    if (paper.percentageScore === undefined || paper.percentageScore === null) return;

    if (!years.has(paper.year)) {
      years.set(paper.year, new Map());
    }
    const yearMap = years.get(paper.year)!;

    if (!yearMap.has(paper.subjectId)) {
      yearMap.set(paper.subjectId, []);
    }
    yearMap.get(paper.subjectId)!.push(paper.percentageScore);
  });

  const result: Array<{
    year: number;
    subjectAverages: Record<string, number>;
    overallAverage: number;
    papersCount: number;
  }> = [];

  years.forEach((subjectsMap, year) => {
    const subjectAverages: Record<string, number> = {};
    let totalSum = 0;
    let totalCount = 0;
    let papersCount = 0;

    subjectsMap.forEach((scores, subjectId) => {
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      subjectAverages[subjectId] = Math.round(avg * 10) / 10;
      totalSum += avg;
      totalCount++;
      papersCount += scores.length;
    });

    result.push({
      year,
      subjectAverages,
      overallAverage: totalCount > 0 ? Math.round((totalSum / totalCount) * 10) / 10 : 0,
      papersCount,
    });
  });

  return result.sort((a, b) => b.year - a.year);
}
