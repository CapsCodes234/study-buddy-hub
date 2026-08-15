/**
 * AI Study Summary Generator
 * 
 * Generates study summaries and daily focus recommendations.
 * All functions are READ-ONLY and return advisory information only.
 */

import { AIDataSnapshot, AIStudySummary, AIDailyFocus, AIError } from './types';
import { generateStudySummaryPrompt, generateDailyFocusPrompt, STUDY_SUMMARY_SYSTEM_PROMPT, DAILY_FOCUS_SYSTEM_PROMPT } from './prompts';
import { validateStudySummary, validateDailyFocus, sanitizeAIText, containsForbiddenContent } from './guards';
import { getAIProvider, parseAIResponse } from './aiClient';
import { calculateSubjectProgress } from '@/lib/progress';

/**
 * Prepare data snapshot for AI analysis
 */
export function prepareDataSnapshot(
  subjects: AIDataSnapshot['subjects'],
  bullets: AIDataSnapshot['bullets'],
  pastPapers: AIDataSnapshot['pastPapers']
): AIDataSnapshot {
  // Filter bullets by status
  const redBullets = bullets.filter(b => b.status === 'Red' && !b.done);
  const amberBullets = bullets.filter(b => b.status === 'Amber' && !b.done);

  // Calculate subject progress
  const subjectProgress = subjects.map(subject =>
    calculateSubjectProgress(subject, bullets, pastPapers)
  );

  // Get last activity timestamp (most recent update)
  const allTimestamps = [
    ...bullets.map(b => b.updatedAt),
    ...pastPapers.map(p => p.updatedAt),
  ].filter(Boolean);
  const lastActivityTimestamp = allTimestamps.length > 0
    ? new Date(Math.max(...allTimestamps.map(ts => new Date(ts).getTime()))).toISOString()
    : undefined;

  return {
    subjects,
    bullets,
    pastPapers,
    redBullets,
    amberBullets,
    subjectProgress,
    lastActivityTimestamp,
  };
}

/**
 * Generate AI Study Summary
 */
export async function generateStudySummary(
  snapshot: AIDataSnapshot
): Promise<AIStudySummary> {
  const provider = getAIProvider();
  
  if (!provider) {
    throw new AIError(
      'AI summaries are unavailable until protected server-side infrastructure is implemented.',
      'API_ERROR'
    );
  }

  try {
    const prompt = generateStudySummaryPrompt(snapshot);
    const rawResponse = await provider.generateText(prompt, {
      systemPrompt: STUDY_SUMMARY_SYSTEM_PROMPT,
      maxTokens: 2000,
      temperature: 0.7,
    });

    // Sanitize response
    const sanitized = sanitizeAIText(rawResponse);

    // Check for forbidden content
    if (containsForbiddenContent(sanitized)) {
      throw new AIError(
        'AI response contains inappropriate content',
        'VALIDATION_ERROR'
      );
    }

    // Parse JSON response
    const parsed = parseAIResponse<AIStudySummary>(sanitized);

    // Validate structure
    if (!validateStudySummary(parsed)) {
      throw new AIError(
        'AI response validation failed',
        'VALIDATION_ERROR'
      );
    }

    // Sanitize all text fields
    return {
      summary: sanitizeAIText(parsed.summary),
      recommendations: parsed.recommendations.map(sanitizeAIText),
      weaknesses: parsed.weaknesses.map(sanitizeAIText),
      strengths: parsed.strengths.map(sanitizeAIText),
    };
  } catch (error) {
    if (error instanceof AIError) {
      throw error;
    }

    throw new AIError(
      `Failed to generate study summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'UNKNOWN',
      error
    );
  }
}

/**
 * Generate AI Daily Focus Recommendations
 */
export async function generateDailyFocus(
  snapshot: AIDataSnapshot
): Promise<AIDailyFocus> {
  const provider = getAIProvider();
  
  if (!provider) {
    throw new AIError(
      'AI recommendations are unavailable until protected server-side infrastructure is implemented.',
      'API_ERROR'
    );
  }

  try {
    const prompt = generateDailyFocusPrompt(snapshot);
    const rawResponse = await provider.generateText(prompt, {
      systemPrompt: DAILY_FOCUS_SYSTEM_PROMPT,
      maxTokens: 1500,
      temperature: 0.7,
    });

    // Sanitize response
    const sanitized = sanitizeAIText(rawResponse);

    // Check for forbidden content
    if (containsForbiddenContent(sanitized)) {
      throw new AIError(
        'AI response contains inappropriate content',
        'VALIDATION_ERROR'
      );
    }

    // Parse JSON response
    const parsed = parseAIResponse<AIDailyFocus>(sanitized);

    // Validate structure
    if (!validateDailyFocus(parsed)) {
      throw new AIError(
        'AI response validation failed',
        'VALIDATION_ERROR'
      );
    }

    // Sanitize all text fields
    return {
      focusItems: parsed.focusItems.map(item => ({
        ...item,
        subject: sanitizeAIText(item.subject),
        topic: sanitizeAIText(item.topic),
        reason: sanitizeAIText(item.reason),
        action: sanitizeAIText(item.action),
      })),
      overallAdvice: sanitizeAIText(parsed.overallAdvice),
    };
  } catch (error) {
    if (error instanceof AIError) {
      throw error;
    }

    throw new AIError(
      `Failed to generate daily focus: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'UNKNOWN',
      error
    );
  }
}

