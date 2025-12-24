/**
 * Notification Library
 * Handles browser notifications with toast fallback
 */

import { Reminder } from '@/types/reminders';
import { toast } from 'sonner';

const REMINDERS_STORAGE_KEY = 'study-tracker-reminders';

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

// Check if notifications are supported and granted
export function canShowNotifications(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

// Show a notification (desktop if granted, toast fallback)
export function showNotification(
  title: string,
  body: string,
  options?: {
    icon?: string;
    tag?: string;
    onClick?: () => void;
    type?: 'info' | 'success' | 'warning' | 'error';
  }
): void {
  if (canShowNotifications()) {
    try {
      const notification = new Notification(title, {
        body,
        icon: options?.icon || '/favicon.ico',
        tag: options?.tag,
      });

      if (options?.onClick) {
        notification.onclick = () => {
          window.focus();
          options.onClick?.();
          notification.close();
        };
      }

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      // Fallback to toast
      showToastFallback(title, body, options?.type);
    }
  } else {
    // Show toast as fallback
    showToastFallback(title, body, options?.type);
  }
}

function showToastFallback(
  title: string,
  body: string,
  type?: 'info' | 'success' | 'warning' | 'error'
): void {
  const message = `${title}: ${body}`;
  
  switch (type) {
    case 'success':
      toast.success(message);
      break;
    case 'warning':
      toast.warning(message);
      break;
    case 'error':
      toast.error(message);
      break;
    default:
      toast.info(message);
  }
}

// Load reminders from localStorage
export function loadReminders(): Reminder[] {
  try {
    const stored = localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading reminders:', error);
  }
  return [];
}

// Save reminders to localStorage
export function saveReminders(reminders: Reminder[]): void {
  try {
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
  } catch (error) {
    console.error('Error saving reminders:', error);
  }
}

// Generate unique reminder ID
export function generateReminderId(): string {
  return `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Schedule a new reminder
export function scheduleReminder(reminder: Omit<Reminder, 'id' | 'dismissed'>): Reminder {
  const newReminder: Reminder = {
    ...reminder,
    id: generateReminderId(),
    dismissed: false,
  };

  const reminders = loadReminders();
  reminders.push(newReminder);
  saveReminders(reminders);

  return newReminder;
}

// Get all due reminders (remindAtISO <= now and not dismissed)
export function checkDueReminders(): Reminder[] {
  const reminders = loadReminders();
  const now = new Date();

  return reminders.filter((reminder) => {
    if (reminder.dismissed) return false;
    
    // Check if snoozed
    if (reminder.snoozedUntil) {
      const snoozeDate = new Date(reminder.snoozedUntil);
      if (snoozeDate > now) return false;
    }

    const remindDate = new Date(reminder.remindAtISO);
    return remindDate <= now;
  });
}

// Dismiss a reminder
export function dismissReminder(reminderId: string): void {
  const reminders = loadReminders();
  const updated = reminders.map((r) =>
    r.id === reminderId ? { ...r, dismissed: true } : r
  );
  saveReminders(updated);
}

// Snooze a reminder
export function snoozeReminder(reminderId: string, minutes: number): void {
  const reminders = loadReminders();
  const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  
  const updated = reminders.map((r) =>
    r.id === reminderId ? { ...r, snoozedUntil: snoozeUntil } : r
  );
  saveReminders(updated);
}

// Clear a specific reminder
export function clearReminder(reminderId: string): void {
  const reminders = loadReminders();
  const filtered = reminders.filter((r) => r.id !== reminderId);
  saveReminders(filtered);
}

// Create exam reminders based on cadence
export function createExamReminders(
  examDate: string,
  subjectId: string,
  examTitle: string,
  cadence: number[] = [14, 7, 1]
): Reminder[] {
  const examDateTime = new Date(examDate);
  const createdReminders: Reminder[] = [];

  for (const daysBeforeArr of cadence) {
    const remindDate = new Date(examDateTime);
    remindDate.setDate(remindDate.getDate() - daysBeforeArr);
    
    // Don't create reminders for past dates
    if (remindDate <= new Date()) continue;

    const reminder = scheduleReminder({
      title: `${examTitle} in ${daysBeforeArr} day${daysBeforeArr === 1 ? '' : 's'}`,
      body: `Your ${examTitle} exam is coming up. Make sure you're prepared!`,
      remindAtISO: remindDate.toISOString(),
      repeat: 'none',
      subjectId,
      type: 'exam',
    });

    createdReminders.push(reminder);
  }

  return createdReminders;
}

// Get upcoming reminders (sorted by date)
export function getUpcomingReminders(limit: number = 5): Reminder[] {
  const reminders = loadReminders();
  const now = new Date();

  return reminders
    .filter((r) => !r.dismissed && new Date(r.remindAtISO) > now)
    .sort((a, b) => new Date(a.remindAtISO).getTime() - new Date(b.remindAtISO).getTime())
    .slice(0, limit);
}
