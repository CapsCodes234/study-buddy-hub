// Core data types for the Study Tracker

export type Status = 'Red' | 'Amber' | 'Green' | null;

export interface Subject {
  id: string;
  name: string;
  weight?: number; // Optional weight for weighted progress calculation
  color: string; // Accent color for the subject
}

export interface Bullet {
  id: string;
  subjectId: string;
  mainTopic: string;
  subtopic: string;
  bulletText: string;
  topicNumber?: string;
  outcomeNumber?: string;
  status: Status;
  comment: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
  // AI-ready fields (future use)
  aiConfidence?: number;
  aiSuggestions?: string[];
  linkedPaperIds?: string[];
}

export interface PastPaper {
  id: string;
  subjectId: string;
  componentId: string;
  year: number;
  session: 'May/June' | 'Oct/Nov' | 'Feb/Mar' | 'Specimen';
  paper: string;
  variant?: '1' | '2' | '3' | '4' | '5';
  rawScore?: number;
  totalMarks: number;
  percentageScore?: number;
  durationUsed?: number;
  completed: boolean;
  attemptDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // AI-ready fields (future use)
  linkedTopicIds?: string[];
  aiAnalysis?: string;
  difficulty?: 'easy' | 'medium' | 'hard';

  // Backwards-compatible aliases (older UI/components)
  score?: number;
  comment?: string;
}

// AI Extraction Schema (matches required JSON schema)
export interface ExtractedSubtopic {
  name: string;
  bullets: string[];
}

export interface ExtractedTopic {
  mainTopic: string;
  subtopics: ExtractedSubtopic[];
}

export interface ExtractedSyllabus {
  subject: string;
  topics: ExtractedTopic[];
}

// App State
export interface AppState {
  subjects: Subject[];
  bullets: Bullet[];
  pastPapers: PastPaper[];
  settings: AppSettings;
}

export interface AppSettings {
  aiExtractionEnabled: boolean;
  aiFeaturesEnabled: boolean; // AI intelligence features (study summary, daily focus)
  hasCompletedOnboarding: boolean;
  // AI-ready settings
  aiProvider?: 'openai' | 'gemini' | 'local';
  aiApiKeyConfigured?: boolean;
}

// Filter State
export interface BulletFilters {
  subjectId: string | null;
  searchText: string;
  statusFilter: Status | 'all';
  hideCompleted: boolean;
  sortBy?: 'status' | 'updated' | 'topic';
  sortDirection?: 'asc' | 'desc';
}

export interface PaperFilters {
  subjectId: string | null;
  year: number | null;
  completionFilter: 'all' | 'completed' | 'incomplete';
}

// Progress calculations
export interface SubjectProgress {
  subjectId: string;
  subjectName: string;
  syllabusProgress: number;
  pastPaperProgress: number;
  totalBullets: number;
  completedBullets: number;
  totalPapers: number;
  completedPapers: number;
  redBullets: Bullet[];
  amberBullets: Bullet[];
}

export interface OverallProgress {
  averageSyllabusProgress: number;
  averagePastPaperProgress: number;
  totalBullets: number;
  totalCompletedBullets: number;
  totalPapers: number;
  totalCompletedPapers: number;
}

// Today's Focus items for dashboard
export interface FocusItem {
  id: string;
  type: 'bullet' | 'paper';
  priority: 'high' | 'medium' | 'low';
  title: string;
  subtitle: string;
  subjectId: string;
  reason: string;
  data: Bullet | PastPaper;
}

// Navigation filter state for deep linking
export interface NavigationFilters {
  tab: 'dashboard' | 'syllabus' | 'papers' | 'settings';
  bulletFilters?: BulletFilters;
  paperFilters?: PaperFilters;
  highlightId?: string;
}

// Grouped syllabus structure for collapsible view
export interface GroupedSyllabus {
  subjectId: string;
  subjectName: string;
  mainTopics: {
    name: string;
    subtopics: {
      name: string;
      bullets: Bullet[];
    }[];
  }[];
}

// AI Extension hooks (disabled by default)
export interface AIHooks {
  extractSyllabus?: (pdfContent: string) => Promise<ExtractedSyllabus>;
  analyzePaper?: (paper: PastPaper) => Promise<string>;
  suggestFocus?: (bullets: Bullet[], papers: PastPaper[]) => Promise<FocusItem[]>;
  generateSummary?: (subject: Subject, bullets: Bullet[]) => Promise<string>;
}
