/**
 * Offline Sync Queue
 * Stores pending changes when offline and auto-syncs when connection is restored
 */

export interface QueuedChange {
  id: string;
  type: 'status' | 'notes';
  bulletId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

const SYNC_QUEUE_KEY = 'study-tracker-sync-queue';

// Get queued changes from localStorage
export const getSyncQueue = (): QueuedChange[] => {
  try {
    const stored = localStorage.getItem(SYNC_QUEUE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading sync queue:', error);
  }
  return [];
};

// Save sync queue to localStorage
export const saveSyncQueue = (queue: QueuedChange[]): void => {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving sync queue:', error);
  }
};

// Add a change to the queue
export const addToSyncQueue = (change: Omit<QueuedChange, 'id' | 'timestamp'>): void => {
  const queue = getSyncQueue();
  
  // Remove any existing change for the same bullet and type (latest wins)
  const filtered = queue.filter(
    (q) => !(q.bulletId === change.bulletId && q.type === change.type)
  );
  
  filtered.push({
    ...change,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  });
  
  saveSyncQueue(filtered);
};

// Remove a change from the queue after successful sync
export const removeFromSyncQueue = (changeId: string): void => {
  const queue = getSyncQueue();
  saveSyncQueue(queue.filter((q) => q.id !== changeId));
};

// Clear entire queue
export const clearSyncQueue = (): void => {
  saveSyncQueue([]);
};

// Check if there are pending changes
export const hasPendingChanges = (): boolean => {
  return getSyncQueue().length > 0;
};

// Get count of pending changes
export const getPendingCount = (): number => {
  return getSyncQueue().length;
};
