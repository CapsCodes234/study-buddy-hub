/**
 * AI Safety Guards
 * 
 * Prevents hallucinations, predictions, and unauthorized data modifications.
 * All AI outputs are validated before being shown to users.
 */

import { AIStudySummary, AIDailyFocus } from './types';

/**
 * Validate AI Study Summary response
 * Ensures response structure is correct and content is safe
 */
export function validateStudySummary(response: unknown): response is AIStudySummary {
  if (!response || typeof response !== 'object') {
    return false;
  }

  const summary = response as Record<string, unknown>;

  // Check required fields
  if (typeof summary.summary !== 'string' || summary.summary.length === 0) {
    return false;
  }

  // Validate recommendations array
  if (!Array.isArray(summary.recommendations)) {
    return false;
  }
  if (!summary.recommendations.every((rec: unknown) => typeof rec === 'string' && rec.length > 0)) {
    return false;
  }

  // Validate weaknesses array
  if (!Array.isArray(summary.weaknesses)) {
    return false;
  }
  if (!summary.weaknesses.every((w: unknown) => typeof w === 'string' && w.length > 0)) {
    return false;
  }

  // Validate strengths array
  if (!Array.isArray(summary.strengths)) {
    return false;
  }
  if (!summary.strengths.every((s: unknown) => typeof s === 'string' && s.length > 0)) {
    return false;
  }

  // Safety check: Ensure no predictions or guarantees
  const combinedText = [
    summary.summary,
    ...summary.recommendations,
    ...summary.weaknesses,
    ...summary.strengths,
  ].join(' ').toLowerCase();

  const forbiddenPhrases = [
    'guaranteed',
    'will definitely',
    'certain to',
    'guarantee',
    'promise',
    'assured',
  ];

  if (forbiddenPhrases.some(phrase => combinedText.includes(phrase))) {
    return false;
  }

  return true;
}

/**
 * Validate AI Daily Focus response
 */
export function validateDailyFocus(response: unknown): response is AIDailyFocus {
  if (!response || typeof response !== 'object') {
    return false;
  }

  const focus = response as Record<string, unknown>;

  // Validate overallAdvice
  if (typeof focus.overallAdvice !== 'string' || focus.overallAdvice.length === 0) {
    return false;
  }

  // Validate focusItems array
  if (!Array.isArray(focus.focusItems)) {
    return false;
  }

  for (const item of focus.focusItems) {
    if (typeof item !== 'object' || !item) {
      return false;
    }

    const itemObj = item as Record<string, unknown>;

    // Check required fields
    if (!['high', 'medium', 'low'].includes(itemObj.priority as string)) {
      return false;
    }
    if (typeof itemObj.subject !== 'string' || itemObj.subject.length === 0) {
      return false;
    }
    if (typeof itemObj.topic !== 'string' || itemObj.topic.length === 0) {
      return false;
    }
    if (typeof itemObj.reason !== 'string' || itemObj.reason.length === 0) {
      return false;
    }
    if (typeof itemObj.action !== 'string' || itemObj.action.length === 0) {
      return false;
    }
  }

  return true;
}

/**
 * Sanitize AI text output
 * Removes any potentially harmful content
 */
export function sanitizeAIText(text: string): string {
  // Remove any HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // Limit length (safety measure)
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000) + '...';
  }

  return sanitized;
}

/**
 * Check if AI response contains forbidden content
 */
export function containsForbiddenContent(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Forbidden patterns: predictions, guarantees, data modification suggestions
  const forbiddenPatterns = [
    /\bwill\s+(definitely|certainly|surely|absolutely)\b/,
    /\bguaranteed\b/,
    /\bpromise\b/,
    /\bassured\b/,
    /\bdelete\b.*\bdata\b/,
    /\bmodify\b.*\bdirectly\b/,
    /\bchange\b.*\bautomatically\b/,
  ];

  return forbiddenPatterns.some(pattern => pattern.test(lowerText));
}

