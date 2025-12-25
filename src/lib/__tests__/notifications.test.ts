/**
 * Unit tests for notification scheduling logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
});

// Mock Notification API
vi.stubGlobal('Notification', {
  permission: 'granted',
  requestPermission: vi.fn().mockResolvedValue('granted'),
});

describe('Notification Library', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('generateReminderId', () => {
    it('generates unique IDs', async () => {
      const { generateReminderId } = await import('@/lib/notifications');
      
      const id1 = generateReminderId();
      const id2 = generateReminderId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^reminder-\d+-[a-z0-9]+$/);
    });
  });

  describe('loadReminders and saveReminders', () => {
    it('returns empty array when no reminders exist', async () => {
      const { loadReminders } = await import('@/lib/notifications');
      
      const reminders = loadReminders();
      expect(reminders).toEqual([]);
    });

    it('saves and loads reminders correctly', async () => {
      const { loadReminders, saveReminders } = await import('@/lib/notifications');
      
      const testReminders = [
        {
          id: 'test-1',
          title: 'Test Reminder',
          body: 'Test body',
          remindAtISO: new Date().toISOString(),
          repeat: 'none' as const,
          type: 'study' as const,
          dismissed: false,
        },
      ];
      
      saveReminders(testReminders);
      const loaded = loadReminders();
      
      expect(loaded).toHaveLength(1);
      expect(loaded[0].title).toBe('Test Reminder');
    });
  });

  describe('scheduleReminder', () => {
    it('creates a new reminder with generated ID', async () => {
      const { scheduleReminder, loadReminders } = await import('@/lib/notifications');
      
      const reminder = scheduleReminder({
        title: 'New Reminder',
        body: 'Reminder body',
        remindAtISO: new Date().toISOString(),
        repeat: 'none',
        type: 'exam',
      });
      
      expect(reminder.id).toMatch(/^reminder-/);
      expect(reminder.dismissed).toBe(false);
      
      const all = loadReminders();
      expect(all).toContainEqual(reminder);
    });
  });

  describe('checkDueReminders', () => {
    it('returns reminders that are due', async () => {
      const { saveReminders, checkDueReminders } = await import('@/lib/notifications');
      
      const pastDate = new Date(Date.now() - 60000).toISOString(); // 1 minute ago
      const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
      
      saveReminders([
        {
          id: 'due-1',
          title: 'Due Reminder',
          body: 'Should be due',
          remindAtISO: pastDate,
          repeat: 'none' as const,
          type: 'study' as const,
          dismissed: false,
        },
        {
          id: 'future-1',
          title: 'Future Reminder',
          body: 'Not due yet',
          remindAtISO: futureDate,
          repeat: 'none' as const,
          type: 'study' as const,
          dismissed: false,
        },
      ]);
      
      const due = checkDueReminders();
      
      expect(due).toHaveLength(1);
      expect(due[0].id).toBe('due-1');
    });

    it('excludes dismissed reminders', async () => {
      const { saveReminders, checkDueReminders } = await import('@/lib/notifications');
      
      const pastDate = new Date(Date.now() - 60000).toISOString();
      
      saveReminders([
        {
          id: 'dismissed-1',
          title: 'Dismissed Reminder',
          body: 'Was dismissed',
          remindAtISO: pastDate,
          repeat: 'none' as const,
          type: 'study' as const,
          dismissed: true,
        },
      ]);
      
      const due = checkDueReminders();
      expect(due).toHaveLength(0);
    });
  });

  describe('dismissReminder', () => {
    it('marks a reminder as dismissed', async () => {
      const { saveReminders, dismissReminder, loadReminders } = await import('@/lib/notifications');
      
      saveReminders([
        {
          id: 'to-dismiss',
          title: 'To Dismiss',
          body: 'Will be dismissed',
          remindAtISO: new Date().toISOString(),
          repeat: 'none' as const,
          type: 'study' as const,
          dismissed: false,
        },
      ]);
      
      dismissReminder('to-dismiss');
      
      const updated = loadReminders();
      expect(updated[0].dismissed).toBe(true);
    });
  });

  describe('snoozeReminder', () => {
    it('sets snoozedUntil to future time', async () => {
      const { saveReminders, snoozeReminder, loadReminders } = await import('@/lib/notifications');
      
      saveReminders([
        {
          id: 'to-snooze',
          title: 'To Snooze',
          body: 'Will be snoozed',
          remindAtISO: new Date().toISOString(),
          repeat: 'none' as const,
          type: 'study' as const,
          dismissed: false,
        },
      ]);
      
      snoozeReminder('to-snooze', 60); // Snooze 60 minutes
      
      const updated = loadReminders();
      expect(updated[0].snoozedUntil).toBeDefined();
      
      const snoozedTime = new Date(updated[0].snoozedUntil!).getTime();
      const now = Date.now();
      expect(snoozedTime).toBeGreaterThan(now);
    });
  });

  describe('createExamReminders', () => {
    it('creates reminders at correct intervals before exam', async () => {
      const { createExamReminders, loadReminders } = await import('@/lib/notifications');
      
      // Set exam date 30 days in future
      const examDate = new Date();
      examDate.setDate(examDate.getDate() + 30);
      
      const reminders = createExamReminders(
        examDate.toISOString(),
        'math',
        'Math Final Exam',
        [14, 7, 1]
      );
      
      expect(reminders.length).toBe(3);
      expect(reminders[0].title).toContain('14 days');
      expect(reminders[1].title).toContain('7 days');
      expect(reminders[2].title).toContain('1 day');
      
      reminders.forEach((r) => {
        expect(r.type).toBe('exam');
        expect(r.subjectId).toBe('math');
      });
    });

    it('skips reminders for past dates', async () => {
      const { createExamReminders } = await import('@/lib/notifications');
      
      // Set exam date 5 days in future - should skip 14 and 7 day reminders
      const examDate = new Date();
      examDate.setDate(examDate.getDate() + 5);
      
      const reminders = createExamReminders(
        examDate.toISOString(),
        'physics',
        'Physics Test',
        [14, 7, 1]
      );
      
      // Only 1-day reminder should be created
      expect(reminders.length).toBe(1);
      expect(reminders[0].title).toContain('1 day');
    });
  });

  describe('getUpcomingReminders', () => {
    it('returns sorted upcoming reminders', async () => {
      const { saveReminders, getUpcomingReminders } = await import('@/lib/notifications');
      
      const now = Date.now();
      
      saveReminders([
        {
          id: 'later',
          title: 'Later',
          body: 'In 2 hours',
          remindAtISO: new Date(now + 7200000).toISOString(),
          repeat: 'none' as const,
          type: 'study' as const,
          dismissed: false,
        },
        {
          id: 'soon',
          title: 'Soon',
          body: 'In 1 hour',
          remindAtISO: new Date(now + 3600000).toISOString(),
          repeat: 'none' as const,
          type: 'study' as const,
          dismissed: false,
        },
        {
          id: 'past',
          title: 'Past',
          body: 'Already past',
          remindAtISO: new Date(now - 3600000).toISOString(),
          repeat: 'none' as const,
          type: 'study' as const,
          dismissed: false,
        },
      ]);
      
      const upcoming = getUpcomingReminders(5);
      
      // Should exclude past reminder
      expect(upcoming.length).toBe(2);
      // Should be sorted by time
      expect(upcoming[0].id).toBe('soon');
      expect(upcoming[1].id).toBe('later');
    });
  });
});
