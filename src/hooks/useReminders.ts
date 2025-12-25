/**
 * useReminders Hook - Manage reminders with notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { Reminder } from '@/types/reminders';
import {
  loadReminders,
  saveReminders,
  checkDueReminders,
  dismissReminder as dismissReminderLib,
  snoozeReminder as snoozeReminderLib,
  clearReminder,
  scheduleReminder,
  showNotification,
  requestNotificationPermission,
  getUpcomingReminders,
} from '@/lib/notifications';

const CHECK_INTERVAL = 60000; // 1 minute

export interface UseRemindersReturn {
  reminders: Reminder[];
  upcomingReminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id' | 'dismissed'>) => Reminder;
  dismissReminder: (id: string) => void;
  snoozeReminder: (id: string, minutes: number) => void;
  deleteReminder: (id: string) => void;
  requestPermission: () => Promise<NotificationPermission>;
  permissionStatus: NotificationPermission;
}

export function useReminders(): UseRemindersReturn {
  const [reminders, setReminders] = useState<Reminder[]>(() => loadReminders());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  // Check permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Check for due reminders periodically
  useEffect(() => {
    const checkReminders = () => {
      const dueReminders = checkDueReminders();
      
      dueReminders.forEach((reminder) => {
        showNotification(reminder.title, reminder.body, {
          type: reminder.type === 'exam' ? 'warning' : 'info',
          tag: reminder.id,
        });
        
        // Auto-dismiss if not repeating
        if (reminder.repeat === 'none') {
          dismissReminderLib(reminder.id);
        }
      });

      // Refresh reminders
      setReminders(loadReminders());
    };

    // Check immediately on mount
    checkReminders();

    // Set up interval
    const interval = setInterval(checkReminders, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const addReminder = useCallback((reminder: Omit<Reminder, 'id' | 'dismissed'>): Reminder => {
    const newReminder = scheduleReminder(reminder);
    setReminders(loadReminders());
    return newReminder;
  }, []);

  const dismissReminder = useCallback((id: string) => {
    dismissReminderLib(id);
    setReminders(loadReminders());
  }, []);

  const snoozeReminder = useCallback((id: string, minutes: number) => {
    snoozeReminderLib(id, minutes);
    setReminders(loadReminders());
  }, []);

  const deleteReminder = useCallback((id: string) => {
    clearReminder(id);
    setReminders(loadReminders());
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    const permission = await requestNotificationPermission();
    setPermissionStatus(permission);
    return permission;
  }, []);

  const upcomingReminders = getUpcomingReminders(5);

  return {
    reminders,
    upcomingReminders,
    addReminder,
    dismissReminder,
    snoozeReminder,
    deleteReminder,
    requestPermission,
    permissionStatus,
  };
}
