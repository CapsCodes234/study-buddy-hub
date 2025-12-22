/**
 * Exam Schedule - Countdown calculations and reminder logic
 */

import { ExamScheduleItem, ExamCountdown, ExamType } from '@/types/paper';
import { Subject } from '@/types';
import { SubjectComponent, ReminderSettings, DEFAULT_REMINDER_SETTINGS } from '@/types/syllabus';
import { generateId } from '@/lib/storage';

const EXAM_SCHEDULE_KEY = 'study-tracker-exam-schedule';
const REMINDER_SETTINGS_KEY = 'study-tracker-reminder-settings';

/**
 * Load exam schedule from storage
 */
export function loadExamSchedule(): ExamScheduleItem[] {
  try {
    const stored = localStorage.getItem(EXAM_SCHEDULE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading exam schedule:', error);
    return [];
  }
}

/**
 * Save exam schedule to storage
 */
export function saveExamSchedule(schedule: ExamScheduleItem[]): void {
  try {
    localStorage.setItem(EXAM_SCHEDULE_KEY, JSON.stringify(schedule));
  } catch (error) {
    console.error('Error saving exam schedule:', error);
  }
}

/**
 * Add exam to schedule
 */
export function addExamToSchedule(
  exam: Omit<ExamScheduleItem, 'id' | 'createdAt' | 'reminderDismissed'>
): ExamScheduleItem {
  const newExam: ExamScheduleItem = {
    ...exam,
    id: generateId(),
    createdAt: new Date().toISOString(),
    reminderDismissed: [],
  };
  
  const schedule = loadExamSchedule();
  schedule.push(newExam);
  saveExamSchedule(schedule);
  
  return newExam;
}

/**
 * Update exam in schedule
 */
export function updateExamInSchedule(id: string, updates: Partial<ExamScheduleItem>): void {
  const schedule = loadExamSchedule();
  const index = schedule.findIndex(e => e.id === id);
  
  if (index >= 0) {
    schedule[index] = { ...schedule[index], ...updates };
    saveExamSchedule(schedule);
  }
}

/**
 * Delete exam from schedule
 */
export function deleteExamFromSchedule(id: string): void {
  const schedule = loadExamSchedule().filter(e => e.id !== id);
  saveExamSchedule(schedule);
}

/**
 * Calculate countdown for an exam
 */
export function calculateCountdown(
  exam: ExamScheduleItem,
  subjects: Subject[],
  components: SubjectComponent[]
): ExamCountdown {
  const examDate = new Date(exam.date);
  const now = new Date();
  
  // Reset to start of day for accurate day calculation
  examDate.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = examDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const weeksRemaining = Math.ceil(daysRemaining / 7);
  
  const subject = subjects.find(s => s.id === exam.subjectId);
  const component = exam.componentId 
    ? components.find(c => c.id === exam.componentId)
    : undefined;
  
  return {
    examItem: exam,
    subjectName: subject?.name || 'Unknown Subject',
    componentName: component?.name,
    daysRemaining,
    weeksRemaining,
    isUrgent: daysRemaining <= 7 && daysRemaining > 0,
    isPast: daysRemaining < 0,
  };
}

/**
 * Get all countdowns sorted by urgency
 */
export function getUpcomingExams(
  subjects: Subject[],
  components: SubjectComponent[],
  includeType?: ExamType
): ExamCountdown[] {
  const schedule = loadExamSchedule();
  
  const countdowns = schedule
    .filter(exam => !includeType || exam.examType === includeType)
    .map(exam => calculateCountdown(exam, subjects, components))
    .filter(c => !c.isPast)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
  
  return countdowns;
}

/**
 * Get the nearest main exam
 */
export function getNearestMainExam(
  subjects: Subject[],
  components: SubjectComponent[]
): ExamCountdown | null {
  const mainExams = getUpcomingExams(subjects, components, 'main');
  return mainExams.length > 0 ? mainExams[0] : null;
}

/**
 * Get exams with pending reminders
 */
export function getExamsWithPendingReminders(
  subjects: Subject[],
  components: SubjectComponent[]
): ExamCountdown[] {
  const countdowns = getUpcomingExams(subjects, components);
  
  return countdowns.filter(countdown => {
    const { examItem, daysRemaining } = countdown;
    
    // Check if any reminder days match and haven't been dismissed
    return examItem.reminderDays.some(days => {
      const reminderKey = `${days}-days`;
      return daysRemaining <= days && !examItem.reminderDismissed.includes(reminderKey);
    });
  });
}

/**
 * Dismiss a reminder
 */
export function dismissReminder(examId: string, daysBefore: number): void {
  const schedule = loadExamSchedule();
  const exam = schedule.find(e => e.id === examId);
  
  if (exam) {
    const reminderKey = `${daysBefore}-days`;
    if (!exam.reminderDismissed.includes(reminderKey)) {
      exam.reminderDismissed.push(reminderKey);
      saveExamSchedule(schedule);
    }
  }
}

/**
 * Load reminder settings
 */
export function loadReminderSettings(): ReminderSettings {
  try {
    const stored = localStorage.getItem(REMINDER_SETTINGS_KEY);
    return stored ? { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(stored) } : DEFAULT_REMINDER_SETTINGS;
  } catch (error) {
    console.error('Error loading reminder settings:', error);
    return DEFAULT_REMINDER_SETTINGS;
  }
}

/**
 * Save reminder settings
 */
export function saveReminderSettings(settings: ReminderSettings): void {
  try {
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving reminder settings:', error);
  }
}

/**
 * Get default reminder days based on exam type
 */
export function getDefaultReminderDays(
  examType: ExamType,
  settings: ReminderSettings = DEFAULT_REMINDER_SETTINGS
): number[] {
  return examType === 'main' ? settings.mainExamLeadDays : settings.mockExamLeadDays;
}

/**
 * Format countdown for display
 */
export function formatCountdown(countdown: ExamCountdown): string {
  const { daysRemaining, weeksRemaining } = countdown;
  
  if (daysRemaining === 0) return 'Today!';
  if (daysRemaining === 1) return 'Tomorrow';
  if (daysRemaining < 7) return `${daysRemaining} days`;
  if (weeksRemaining === 1) return '1 week';
  return `${weeksRemaining} weeks`;
}

/**
 * Get urgency level for styling
 */
export function getUrgencyLevel(daysRemaining: number): 'critical' | 'urgent' | 'warning' | 'normal' {
  if (daysRemaining <= 1) return 'critical';
  if (daysRemaining <= 7) return 'urgent';
  if (daysRemaining <= 14) return 'warning';
  return 'normal';
}
