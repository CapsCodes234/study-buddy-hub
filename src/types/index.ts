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
  status: Status;
  comment: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PastPaper {
  id: string;
  subjectId: string;
  year: number;
  session: 'May/June' | 'Oct/Nov' | 'Feb/Mar';
  paper: string;
  variant?: string;
  completed: boolean;
  score?: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
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
  hasCompletedOnboarding: boolean;
}

// Filter State
export interface BulletFilters {
  subjectId: string | null;
  searchText: string;
  statusFilter: Status | 'all';
  hideCompleted: boolean;
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
}

export interface OverallProgress {
  averageSyllabusProgress: number;
  averagePastPaperProgress: number;
  totalBullets: number;
  totalCompletedBullets: number;
  totalPapers: number;
  totalCompletedPapers: number;
}
