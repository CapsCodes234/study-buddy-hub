/**
 * Paper Types - Enhanced past paper logging with component-based scoring
 */

export type PaperSession = 'May/June' | 'Oct/Nov' | 'Feb/Mar' | 'Specimen';

export interface PaperComponentResult {
  componentId: string;
  componentName: string;
  rawMark: number;
  totalMark: number;
  percentage: number;
}

export interface EnhancedPastPaper {
  id: string;
  subjectId: string;
  year: number;
  session: PaperSession;
  paperId: string; // e.g., "1", "2", "3"
  variant?: string; // e.g., "1", "2", "3"
  completed: boolean;
  componentResults: PaperComponentResult[];
  overallRawMark: number;
  overallTotalMark: number;
  overallPercentage: number;
  comment?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  linkedTopicIds?: string[];
  aiAnalysis?: string;
  createdAt: string;
  updatedAt: string;
}

// For backwards compatibility with existing PastPaper type
export interface LegacyPaperMigration {
  oldPaper: {
    id: string;
    subjectId: string;
    year: number;
    session: string;
    paper: string;
    variant?: string;
    completed: boolean;
    score?: number;
    comment?: string;
  };
  newPaper: EnhancedPastPaper;
}

// Exam schedule types
export type ExamType = 'main' | 'mock';

export interface ExamScheduleItem {
  id: string;
  subjectId: string;
  componentId?: string; // Optional - can be per-component or per-subject
  examType: ExamType;
  date: string; // ISO date string
  title?: string; // Custom title
  reminderDays: number[]; // e.g., [7, 3, 1] for reminders
  reminderDismissed: string[]; // Dismissed reminder dates
  createdAt: string;
}

export interface ExamCountdown {
  examItem: ExamScheduleItem;
  subjectName: string;
  componentName?: string;
  daysRemaining: number;
  weeksRemaining: number;
  isUrgent: boolean; // Less than 7 days
  isPast: boolean;
}

// Paper statistics
export interface SubjectPaperStats {
  subjectId: string;
  totalPapers: number;
  completedPapers: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  byComponent: {
    componentId: string;
    componentName: string;
    averagePercentage: number;
    paperCount: number;
  }[];
}
