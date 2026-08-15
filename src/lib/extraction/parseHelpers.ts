/**
 * Parse Helpers - Heuristics for parsing syllabus content and detecting component marks
 */

import { ComponentMarksSuggestion, ExtractedComponent } from '@/types/syllabus';

/**
 * Common patterns for detecting component/paper marks in syllabus text
 */
const MARKS_PATTERNS = [
  // "Paper 1 - 40 marks" or "Paper 1: 40 marks" or "Paper 1 — 40 marks"
  /paper\s*(\d+)\s*(?:-|:|\u2013|\u2014)\s*(\d+)\s*marks?/gi,
  // "Paper 1 (40 marks)" 
  /paper\s*(\d+)\s*\((\d+)\s*marks?\)/gi,
  // "Component 1: 40 marks"
  /component\s*(\d+)\s*(?:-|:|\u2013|\u2014)\s*(\d+)\s*marks?/gi,
  // "Written Paper — 80 marks"
  /(written\s*paper|practical|theory|coursework)\s*(?:-|:|\u2013|\u2014)\s*(\d+)\s*marks?/gi,
  // Table-like: "| Paper 1 | 40 |"
  /\|\s*(paper\s*\d+|component\s*\d+)\s*\|\s*(\d+)\s*\|/gi,
  // "Paper 1 worth 40 marks"
  /paper\s*(\d+)\s*worth\s*(\d+)\s*marks?/gi,
  // "40 marks for Paper 1"
  /(\d+)\s*marks?\s*for\s*paper\s*(\d+)/gi,
  // "Maximum mark: 40" followed by component context
  /maximum\s*mark[s]?\s*[:=]\s*(\d+)/gi,
];

/**
 * Parse text to extract component marks suggestions
 */
export function extractComponentMarks(text: string): ComponentMarksSuggestion[] {
  const suggestions: ComponentMarksSuggestion[] = [];
  const seen = new Set<string>();
  
  for (const pattern of MARKS_PATTERNS) {
    let match;
    // Reset regex state
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(text)) !== null) {
      let componentName: string;
      let marks: number;
      let source: 'pattern' | 'table' | 'text' = 'pattern';
      
      // Different patterns have different group orders
      if (match[0].includes('|')) {
        source = 'table';
        componentName = match[1].trim();
        marks = parseInt(match[2]);
      } else if (/^\d+\s*marks?\s*for/i.test(match[0])) {
        marks = parseInt(match[1]);
        componentName = `Paper ${match[2]}`;
      } else if (/maximum\s*mark/i.test(match[0])) {
        marks = parseInt(match[1]);
        componentName = 'Unknown Component';
        source = 'text';
      } else {
        // Standard patterns
        if (isNaN(parseInt(match[1]))) {
          componentName = match[1].trim();
          marks = parseInt(match[2]);
        } else {
          componentName = `Paper ${match[1]}`;
          marks = parseInt(match[2]);
        }
      }
      
      // Normalize component name
      componentName = normalizeComponentName(componentName);
      
      // Avoid duplicates
      const key = `${componentName}-${marks}`;
      if (!seen.has(key) && !isNaN(marks) && marks > 0) {
        seen.add(key);
        suggestions.push({
          componentName,
          suggestedMarks: marks,
          source,
          confidence: calculatePatternConfidence(match[0], source),
          rawMatch: match[0],
        });
      }
    }
  }
  
  return suggestions;
}

/**
 * Normalize component name for consistency
 */
function normalizeComponentName(name: string): string {
  // Capitalize first letter of each word
  return name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate confidence based on pattern match quality
 */
function calculatePatternConfidence(
  matchText: string,
  source: 'pattern' | 'table' | 'text'
): number {
  let confidence = 0.5;
  
  // Table sources are more reliable
  if (source === 'table') confidence = 0.85;
  
  // Explicit "marks" keyword increases confidence
  if (/marks?/i.test(matchText)) confidence += 0.15;
  
  // Paper/Component number increases confidence
  if (/paper\s*\d+|component\s*\d+/i.test(matchText)) confidence += 0.1;
  
  return Math.min(confidence, 1);
}

/**
 * Common syllabus action verbs for detecting bullet points
 */
const SYLLABUS_ACTION_VERBS = new Set([
  'describe', 'explain', 'calculate', 'state', 'define', 'identify',
  'determine', 'outline', 'discuss', 'evaluate', 'compare', 'show',
  'sketch', 'predict', 'suggest', 'contrast', 'derive', 'draw',
  'analyse', 'analyze', 'list', 'estimate', 'understand', 'apply',
  'recall', 'demonstrate', 'use', 'select', 'formulate'
]);

/**
 * Parse topic numbering from text
 * Handles formats like "1.0", "1.1", "1.1.1", "A.", "A.1", etc.
 */
export function parseTopicNumbering(text: string): {
  number: string | null;
  cleanText: string;
  level: number;
} {
  const trimmed = text.trim();
  
  // Match full dot notation sequence first (e.g., 2.1, 1.1.1)
  const dotSeqMatch = trimmed.match(/^(\d+(?:\.\d+)+)\s*[-.:)]?\s*/);
  if (dotSeqMatch) {
    const number = dotSeqMatch[1];
    const cleanText = trimmed.slice(dotSeqMatch[0].length).trim();
    const level = (number.match(/\./g) || []).length + 1;
    return { number, cleanText, level };
  }

  // Single number prefix (e.g., 1. Mechanics)
  const singleNumMatch = trimmed.match(/^(\d+)\s*[-.:)]\s*/);
  if (singleNumMatch) {
    const number = singleNumMatch[1];
    const cleanText = trimmed.slice(singleNumMatch[0].length).trim();
    return { number, cleanText, level: 1 };
  }

  // Capital letter prefix (e.g., A.1, A.)
  const letterSeqMatch = trimmed.match(/^([A-Z](?:\.\d+)+)\s*[-.:)]?\s*/i);
  if (letterSeqMatch) {
    const number = letterSeqMatch[1];
    const cleanText = trimmed.slice(letterSeqMatch[0].length).trim();
    const level = (number.match(/\./g) || []).length + 1;
    return { number, cleanText, level };
  }

  const singleLetterMatch = trimmed.match(/^([A-Z])\s*[-.:)]\s*/i);
  if (singleLetterMatch) {
    const number = singleLetterMatch[1];
    const cleanText = trimmed.slice(singleLetterMatch[0].length).trim();
    return { number, cleanText, level: 1 };
  }

  // Letter in parens: (a), (b)
  const parenLetterMatch = trimmed.match(/^\(?([a-z])\)\s*/i);
  if (parenLetterMatch) {
    const number = parenLetterMatch[1];
    const cleanText = trimmed.slice(parenLetterMatch[0].length).trim();
    return { number, cleanText, level: 2 };
  }

  // Roman numerals: i, ii, iii
  const romanMatch = trimmed.match(/^([ivxlcdm]+)\s*[-.:)]\s*/i);
  if (romanMatch) {
    const number = romanMatch[1];
    const cleanText = trimmed.slice(romanMatch[0].length).trim();
    return { number, cleanText, level: 3 };
  }

  return { number: null, cleanText: trimmed, level: 0 };
}

/**
 * Detect if a line is likely a main topic header
 */
export function isLikelyMainTopic(line: string): boolean {
  const indicators = [
    /^[A-Z\d]\.?\s+[A-Z]/,  // Starts with capital letter/number and continues with capitals
    /^\d+\.0?\s+/,  // Starts with X.0 or just a number
    /^(unit|chapter|module|section|topic)\s+\d+/i,
    line.length < 100 && /^[A-Z][^.!?]*$/.test(line.trim()),  // Short line, starts with capital, no sentence punctuation
  ];
  
  return indicators.some(pattern => 
    typeof pattern === 'boolean' ? pattern : pattern.test(line)
  );
}

/**
 * Detect if a line is likely a subtopic
 */
export function isLikelySubtopic(line: string): boolean {
  return /^\d+\.\d+\s+/.test(line) || /^\(?\b[a-z]\)\s+/i.test(line) || /^\([a-z]+\)\s+/i.test(line);
}

/**
 * Detect if a line is likely a bullet point
 */
export function isLikelyBullet(line: string): boolean {
  const bulletIndicators = [
    /^[-•●○◦▪▫]\s+/,  // Common bullet characters
    /^\*\s+/,  // Asterisk
    /^[a-z]\)\s+/i,  // a), b)
    /^\(\d+\)\s+/,  // (1), (2)
    /^\d+\.\d+\.\d+\s+/,  // 1.1.1 style
  ];
  
  if (bulletIndicators.some(pattern => pattern.test(line))) {
    return true;
  }

  // Check action verb start
  const firstWord = line.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
  if (firstWord && SYLLABUS_ACTION_VERBS.has(firstWord)) {
    return true;
  }

  return false;
}

/**
 * Clean extracted text - remove common artifacts
 */
export function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/^\s*[-•●○◦▪▫*]\s*/, '')  // Remove leading bullets
    .replace(/\s*[-•●○◦▪▫*]\s*$/, '')  // Remove trailing bullets
    .replace(/^\s*\d+\.\s*/, '')  // Remove leading numbers
    .trim();
}

/**
 * Merge components from extraction with user-defined components
 */
export function mergeComponentSuggestions(
  extracted: ExtractedComponent[],
  suggestions: ComponentMarksSuggestion[]
): ExtractedComponent[] {
  const merged: ExtractedComponent[] = [...extracted];
  
  for (const suggestion of suggestions) {
    const existing = merged.find(
      c => c.name.toLowerCase() === suggestion.componentName.toLowerCase()
    );
    
    if (existing) {
      // Update if suggestion has higher confidence
      if (suggestion.confidence > existing.confidence && suggestion.suggestedMarks) {
        existing.totalMarks = suggestion.suggestedMarks;
        existing.confidence = suggestion.confidence;
      }
    } else {
      merged.push({
        name: suggestion.componentName,
        totalMarks: suggestion.suggestedMarks,
        confidence: suggestion.confidence,
      });
    }
  }
  
  return merged;
}
