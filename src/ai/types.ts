/**
 * AI Intelligence Layer - Type Definitions
 * 
 * All AI features are READ-ONLY and advisory only.
 * AI never modifies user data.
 */

import { Bullet, PastPaper, Subject } from '@/types';

/**
 * Data snapshot sent to AI for analysis
 */
export interface AIDataSnapshot {
  subjects: Subject[];
  bullets: Bullet[];
  pastPapers: PastPaper[];
  redBullets: Bullet[];
  amberBullets: Bullet[];
  subjectProgress: Array<{
    subjectId: string;
    subjectName: string;
    syllabusProgress: number;
    pastPaperProgress: number;
    totalBullets: number;
    completedBullets: number;
    totalPapers: number;
    completedPapers: number;
  }>;
  lastActivityTimestamp?: string;
}

/**
 * AI Study Summary Response
 */
export interface AIStudySummary {
  summary: string;
  recommendations: string[];
  weaknesses: string[];
  strengths: string[];
}

/**
 * AI Daily Focus Response
 */
export interface AIDailyFocus {
  focusItems: Array<{
    priority: 'high' | 'medium' | 'low';
    subject: string;
    topic: string;
    reason: string;
    action: string;
  }>;
  overallAdvice: string;
}

/**
 * AI Provider Interface (Provider-agnostic)
 */
export interface AIProvider {
  generateText(prompt: string, options?: AIRequestOptions): Promise<string>;
}

/**
 * AI Request Options
 */
export interface AIRequestOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * AI Error Types
 */
export class AIError extends Error {
  constructor(
    message: string,
    public code: 'API_ERROR' | 'VALIDATION_ERROR' | 'RATE_LIMIT' | 'UNKNOWN',
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AIError';
  }
}

