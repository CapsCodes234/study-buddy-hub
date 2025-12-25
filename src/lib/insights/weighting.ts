/**
 * Smart Progress Weighting - Calculate weighted progress based on difficulty and exam relevance
 */

import { Bullet, PastPaper, Subject } from '@/types';
import { statusToConfidence } from '@/components/ui/ConfidenceToggle';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type ExamRelevance = 'low' | 'medium' | 'high';

export interface TopicWeighting {
  topicId: string;
  difficulty: Difficulty;
  examRelevance: ExamRelevance;
  customWeight?: number;
}

export interface PaperWeighting {
  componentName: string;
  weight: number; // Percentage (e.g., 30 for 30%)
}

export interface WeightingConfig {
  topicWeights: TopicWeighting[];
  paperWeights: PaperWeighting[];
}

// Weight multipliers
const DIFFICULTY_WEIGHTS: Record<Difficulty, number> = {
  easy: 0.8,
  medium: 1.0,
  hard: 1.2,
};

const RELEVANCE_WEIGHTS: Record<ExamRelevance, number> = {
  low: 0.8,
  medium: 1.0,
  high: 1.3,
};

// Storage key for weighting config
const WEIGHTING_CONFIG_KEY = 'study-tracker-weighting';

/**
 * Load weighting configuration from storage
 */
export function loadWeightingConfig(): WeightingConfig {
  try {
    const stored = localStorage.getItem(WEIGHTING_CONFIG_KEY);
    return stored ? JSON.parse(stored) : { topicWeights: [], paperWeights: [] };
  } catch {
    return { topicWeights: [], paperWeights: [] };
  }
}

/**
 * Save weighting configuration to storage
 */
export function saveWeightingConfig(config: WeightingConfig): void {
  try {
    localStorage.setItem(WEIGHTING_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving weighting config:', error);
  }
}

/**
 * Get topic weight (combines difficulty and exam relevance)
 */
export function getTopicWeight(
  topicId: string,
  config: WeightingConfig
): number {
  const topicWeight = config.topicWeights.find((w) => w.topicId === topicId);
  
  if (!topicWeight) {
    return 1.0; // Default weight
  }

  if (topicWeight.customWeight !== undefined) {
    return topicWeight.customWeight;
  }

  return DIFFICULTY_WEIGHTS[topicWeight.difficulty] * RELEVANCE_WEIGHTS[topicWeight.examRelevance];
}

/**
 * Calculate raw (unweighted) progress
 */
export function calculateRawProgress(bullets: Bullet[]): {
  totalTopics: number;
  confidentTopics: number;
  percentage: number;
} {
  const totalTopics = bullets.length;
  const confidentTopics = bullets.filter((b) => {
    const confidence = statusToConfidence(b.status, b.done);
    return confidence === 'confident';
  }).length;

  return {
    totalTopics,
    confidentTopics,
    percentage: totalTopics > 0 ? (confidentTopics / totalTopics) * 100 : 0,
  };
}

/**
 * Calculate weighted progress (accounts for difficulty and exam relevance)
 */
export function calculateWeightedProgress(
  bullets: Bullet[],
  config: WeightingConfig
): {
  totalWeight: number;
  confidentWeight: number;
  percentage: number;
} {
  let totalWeight = 0;
  let confidentWeight = 0;

  bullets.forEach((bullet) => {
    const weight = getTopicWeight(bullet.id, config);
    totalWeight += weight;

    const confidence = statusToConfidence(bullet.status, bullet.done);
    if (confidence === 'confident') {
      confidentWeight += weight;
    }
  });

  return {
    totalWeight,
    confidentWeight,
    percentage: totalWeight > 0 ? (confidentWeight / totalWeight) * 100 : 0,
  };
}

/**
 * Calculate subject-specific weighted progress
 */
export function calculateSubjectWeightedProgress(
  subjectId: string,
  bullets: Bullet[],
  config: WeightingConfig
): {
  raw: { percentage: number; confident: number; total: number };
  weighted: { percentage: number };
  difference: number;
} {
  const subjectBullets = bullets.filter((b) => b.subjectId === subjectId);
  const raw = calculateRawProgress(subjectBullets);
  const weighted = calculateWeightedProgress(subjectBullets, config);

  return {
    raw: {
      percentage: raw.percentage,
      confident: raw.confidentTopics,
      total: raw.totalTopics,
    },
    weighted: {
      percentage: weighted.percentage,
    },
    difference: weighted.percentage - raw.percentage,
  };
}

/**
 * Infer default weights for topics based on heuristics
 */
export function inferDefaultWeights(bullets: Bullet[]): TopicWeighting[] {
  // Group by main topic
  const topicGroups = new Map<string, Bullet[]>();
  
  bullets.forEach((bullet) => {
    const key = `${bullet.subjectId}-${bullet.mainTopic}`;
    if (!topicGroups.has(key)) {
      topicGroups.set(key, []);
    }
    topicGroups.get(key)!.push(bullet);
  });

  const weights: TopicWeighting[] = [];
  
  // Assign weights based on topic complexity (number of bullets)
  const topicSizes = Array.from(topicGroups.values()).map((g) => g.length);
  const avgSize = topicSizes.reduce((a, b) => a + b, 0) / topicSizes.length || 1;

  bullets.forEach((bullet) => {
    const groupKey = `${bullet.subjectId}-${bullet.mainTopic}`;
    const groupSize = topicGroups.get(groupKey)?.length || 1;
    
    // Larger topics are assumed to be harder and more important
    let difficulty: Difficulty = 'medium';
    let relevance: ExamRelevance = 'medium';
    
    if (groupSize > avgSize * 1.5) {
      difficulty = 'hard';
      relevance = 'high';
    } else if (groupSize < avgSize * 0.5) {
      difficulty = 'easy';
      relevance = 'low';
    }

    weights.push({
      topicId: bullet.id,
      difficulty,
      examRelevance: relevance,
    });
  });

  return weights;
}

/**
 * Get progress summary with both raw and weighted metrics
 */
export function getProgressSummary(
  subjects: Subject[],
  bullets: Bullet[],
  pastPapers: PastPaper[]
): {
  overall: {
    rawProgress: number;
    weightedProgress: number;
    difference: number;
  };
  bySubject: {
    subjectId: string;
    subjectName: string;
    rawProgress: number;
    weightedProgress: number;
    difference: number;
  }[];
  papers: {
    total: number;
    completed: number;
    percentage: number;
  };
} {
  const config = loadWeightingConfig();
  
  // Overall progress
  const rawOverall = calculateRawProgress(bullets);
  const weightedOverall = calculateWeightedProgress(bullets, config);

  // By subject
  const bySubject = subjects.map((subject) => {
    const progress = calculateSubjectWeightedProgress(subject.id, bullets, config);
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      rawProgress: progress.raw.percentage,
      weightedProgress: progress.weighted.percentage,
      difference: progress.difference,
    };
  });

  // Papers
  const completedPapers = pastPapers.filter((p) => p.completed).length;

  return {
    overall: {
      rawProgress: rawOverall.percentage,
      weightedProgress: weightedOverall.percentage,
      difference: weightedOverall.percentage - rawOverall.percentage,
    },
    bySubject,
    papers: {
      total: pastPapers.length,
      completed: completedPapers,
      percentage: pastPapers.length > 0 ? (completedPapers / pastPapers.length) * 100 : 0,
    },
  };
}
