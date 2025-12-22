/**
 * Syllabus Types - Enhanced syllabus structure with components and extraction support
 */

export interface SubjectComponent {
  id: string;
  subjectId: string;
  name: string; // e.g., "Paper 1", "Paper 2", "Practical"
  totalMarks: number;
  weight?: number; // Optional weight percentage
  orderNumber: number;
}

export interface MainTopic {
  id: string;
  subjectId: string;
  name: string;
  orderNumber: number;
  completed: boolean;
  completedAt?: string;
  remindLaterDate?: string; // For "remind me later" functionality
  remindIntervalDays?: number; // Custom interval, default 3 days
}

export interface Subtopic {
  id: string;
  mainTopicId: string;
  name: string;
  orderNumber: number;
}

export interface EnhancedBullet {
  id: string;
  subtopicId: string;
  text: string;
  orderNumber: number;
}

// Extraction-related types
export interface ExtractionConfidence {
  overall: number; // 0-1
  subject: number;
  topics: number;
  components: number;
}

export interface ExtractedComponent {
  name: string;
  totalMarks?: number;
  confidence: number;
}

export interface ExtractedBulletItem {
  text: string;
  confidence: number;
}

export interface ExtractedSubtopicItem {
  name: string;
  bullets: ExtractedBulletItem[];
  confidence: number;
}

export interface ExtractedMainTopicItem {
  name: string;
  orderNumber?: number;
  subtopics: ExtractedSubtopicItem[];
  confidence: number;
}

export interface ExtractionResult {
  subject: string;
  subjectConfidence: number;
  topics: ExtractedMainTopicItem[];
  components: ExtractedComponent[];
  confidence: ExtractionConfidence;
  rawText?: string;
  extractedAt: string;
}

// Changelog for extraction history
export interface ExtractionChangelog {
  id: string;
  subjectId: string;
  originalExtraction: ExtractionResult;
  editedExtraction?: ExtractionResult;
  createdAt: string;
  savedAt?: string;
}

// Component marks mapping suggestion
export interface ComponentMarksSuggestion {
  componentName: string;
  suggestedMarks: number;
  source: 'pattern' | 'table' | 'text';
  confidence: number;
  rawMatch?: string;
}

// Reminder settings
export interface ReminderSettings {
  defaultIntervalDays: number; // Default: 3 days
  mainExamLeadDays: number[]; // e.g., [7, 3, 1] for 7 days, 3 days, 1 day before
  mockExamLeadDays: number[];
  enabled: boolean;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  defaultIntervalDays: 3,
  mainExamLeadDays: [7, 3, 1],
  mockExamLeadDays: [3, 1],
  enabled: true,
};
