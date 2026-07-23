/**
 * Input Validation Utilities
 * 
 * Provides zod schemas and sanitization for user input to prevent:
 * - XSS through malicious content
 * - DoS through oversized fields
 * - JSON prototype pollution
 */

import { z } from 'zod';

// Field length limits
const MAX_TEXT_LENGTH = 1000;
const MAX_TOPIC_LENGTH = 200;
const MAX_COMMENT_LENGTH = 2000;
const MAX_SUBJECT_NAME_LENGTH = 100;

/**
 * Sanitize string to prevent XSS - removes potentially dangerous characters
 * but preserves normal text content
 */
export const sanitizeString = (value: string): string => {
  if (typeof value !== 'string') return '';
  
  return value
    // Remove null bytes
    .replace(/\0/g, '')
    // Trim to reasonable length first
    .substring(0, MAX_TEXT_LENGTH)
    // Normalize whitespace
    .replace(/[\r\n]+/g, ' ')
    .trim();
};

/**
 * Sanitize CSV cell value to prevent formula injection
 * Strips leading =, +, -, @, \t, \r characters that could be interpreted as formulas
 */
export const sanitizeCSVCell = (value: string): string => {
  if (typeof value !== 'string') return '';
  
  // Remove formula injection prefixes: =, +, -, @, tab, carriage return
  // This prevents CSV injection attacks when data is exported and opened in Excel/Sheets
  const sanitized = value.replace(/^[=+\-@\t\r]/, '');
  
  return sanitizeString(sanitized);
};

/**
 * Sanitize and validate text with length limit
 */
export const sanitizeText = (value: unknown, maxLength = MAX_TEXT_LENGTH): string => {
  if (typeof value !== 'string') return '';
  return sanitizeString(value).substring(0, maxLength);
};

// CSV Bullet schema for validation
export const csvBulletSchema = z.object({
  subjectId: z.string().max(MAX_SUBJECT_NAME_LENGTH).default(''),
  mainTopic: z.string().max(MAX_TOPIC_LENGTH).transform(sanitizeString).default(''),
  subtopic: z.string().max(MAX_TOPIC_LENGTH).transform(sanitizeString).default(''),
  bulletText: z.string().min(1).max(MAX_TEXT_LENGTH).transform(sanitizeString),
  status: z.union([z.literal('red'), z.literal('amber'), z.literal('green'), z.null()]).default(null),
  comment: z.string().max(MAX_COMMENT_LENGTH).transform(sanitizeString).default(''),
  done: z.boolean().default(false),
});

export type ValidatedCSVBullet = z.infer<typeof csvBulletSchema>;

// Subject schema
export const subjectSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(MAX_SUBJECT_NAME_LENGTH),
  color: z.string(),
  weight: z.number().optional(),
  // Extended fields for Supabase-backed subject selection
  userSubjectId: z.string().optional(),
  catalogueSubjectId: z.string().optional(),
  customSubjectId: z.string().optional(),
  syllabusVersionId: z.string().nullable().optional(),
  catalogueCode: z.string().nullable().optional(),
  catalogueSlug: z.string().nullable().optional(),
  source: z.enum(['catalogue', 'custom', 'local']).optional(),
  sortOrder: z.number().optional(),
  version: z.number().optional(),
});

// Past paper schema
export const pastPaperSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1),
  componentId: z.string().max(100),
  year: z.number().int().min(1900).max(2100),
  session: z.enum(['May/June', 'Oct/Nov', 'Feb/Mar', 'Specimen']),
  paper: z.string().max(50),
  variant: z.enum(['1', '2', '3', '4', '5']).optional(),
  rawScore: z.number().min(0).optional(),
  totalMarks: z.number().min(0),
  percentageScore: z.number().min(0).max(100).optional(),
  durationUsed: z.number().optional(),
  completed: z.boolean(),
  attemptDate: z.string().optional(),
  notes: z.string().max(MAX_COMMENT_LENGTH).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  linkedTopicIds: z.array(z.string()).optional(),
  aiAnalysis: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  score: z.number().optional(),
  comment: z.string().optional(),
});

// Bullet schema for full validation
export const bulletSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1),
  mainTopic: z.string().max(MAX_TOPIC_LENGTH),
  subtopic: z.string().max(MAX_TOPIC_LENGTH),
  bulletText: z.string().min(1).max(MAX_TEXT_LENGTH),
  topicNumber: z.string().optional(),
  outcomeNumber: z.string().optional(),
  status: z.union([z.literal('Red'), z.literal('Amber'), z.literal('Green'), z.null()]).nullable(),
  comment: z.string().max(MAX_COMMENT_LENGTH),
  done: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  aiConfidence: z.number().optional(),
  aiSuggestions: z.array(z.string()).optional(),
  linkedPaperIds: z.array(z.string()).optional(),
});

// Settings schema
export const settingsSchema = z.object({
  aiExtractionEnabled: z.boolean().default(false),
  aiFeaturesEnabled: z.boolean().default(false),
  hasCompletedOnboarding: z.boolean().default(false),
  aiProvider: z.enum(['openai', 'gemini', 'local']).optional(),
  aiApiKeyConfigured: z.boolean().optional(),
}).passthrough();

// Full app state schema
export const appStateSchema = z.object({
  subjects: z.array(subjectSchema),
  bullets: z.array(bulletSchema),
  pastPapers: z.array(pastPaperSchema),
  settings: settingsSchema.optional(),
});

/**
 * Safely parse JSON with validation against prototype pollution
 */
export function safeJSONParse<T>(jsonString: string): T | null {
  try {
    const parsed = JSON.parse(jsonString, (key, value) => {
      // Prevent prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined;
      }
      return value;
    });
    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Validate and sanitize parsed JSON data against a schema
 */
export function validateWithSchema<T>(data: unknown, schema: z.ZodType<T>): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.message };
}

/**
 * Validate CSV row data and return sanitized bullet or null
 */
export function validateCSVBullet(rawData: {
  bulletText: string;
  mainTopic?: string;
  subtopic?: string;
  subjectId?: string;
}): ValidatedCSVBullet | null {
  const result = csvBulletSchema.safeParse({
    ...rawData,
    bulletText: sanitizeText(rawData.bulletText, MAX_TEXT_LENGTH),
    mainTopic: sanitizeText(rawData.mainTopic || '', MAX_TOPIC_LENGTH),
    subtopic: sanitizeText(rawData.subtopic || '', MAX_TOPIC_LENGTH),
    subjectId: rawData.subjectId || '',
  });
  
  if (result.success) {
    return result.data;
  }
  return null;
}

/**
 * Validate extracted AI syllabus response
 */
export const extractedSyllabusSchema = z.object({
  subject: z.string().max(MAX_SUBJECT_NAME_LENGTH),
  topics: z.array(z.object({
    mainTopic: z.string().max(MAX_TOPIC_LENGTH),
    subtopics: z.array(z.object({
      name: z.string().max(MAX_TOPIC_LENGTH),
      bullets: z.array(z.string().max(MAX_TEXT_LENGTH)),
    })),
  })),
  components: z.array(z.object({
    name: z.string().max(100),
    totalMarks: z.number().optional(),
  })).optional(),
});

export type ValidatedExtractedSyllabus = z.infer<typeof extractedSyllabusSchema>;

/**
 * Validate AI extraction result
 */
export function validateExtractedSyllabus(data: unknown): ValidatedExtractedSyllabus | null {
  const result = extractedSyllabusSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.warn('AI extraction validation failed:', result.error.message);
  return null;
}
