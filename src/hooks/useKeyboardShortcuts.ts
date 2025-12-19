import { useEffect, useCallback } from 'react';
import { Status } from '@/types';

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  onStatusChange?: (status: Status) => void;
  onToggleDone?: () => void;
  onDelete?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
}

/**
 * Keyboard shortcuts for syllabus interaction
 * 
 * Shortcuts:
 * - R: Set status to Red
 * - A: Set status to Amber
 * - G: Set status to Green
 * - D: Toggle done
 * - Delete/Backspace: Delete item (when focused)
 * - Arrow Up/Down: Navigate between items
 */
export const useKeyboardShortcuts = ({
  enabled = true,
  onStatusChange,
  onToggleDone,
  onDelete,
  onNavigateUp,
  onNavigateDown,
}: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }
    
    switch (event.key.toLowerCase()) {
      case 'r':
        event.preventDefault();
        onStatusChange?.('Red');
        break;
      case 'a':
        event.preventDefault();
        onStatusChange?.('Amber');
        break;
      case 'g':
        event.preventDefault();
        onStatusChange?.('Green');
        break;
      case 'd':
        event.preventDefault();
        onToggleDone?.();
        break;
      case 'delete':
      case 'backspace':
        if (event.shiftKey) {
          event.preventDefault();
          onDelete?.();
        }
        break;
      case 'arrowup':
        event.preventDefault();
        onNavigateUp?.();
        break;
      case 'arrowdown':
        event.preventDefault();
        onNavigateDown?.();
        break;
    }
  }, [enabled, onStatusChange, onToggleDone, onDelete, onNavigateUp, onNavigateDown]);
  
  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);
};

/**
 * Keyboard shortcut hints for display
 */
export const KEYBOARD_SHORTCUTS = [
  { key: 'R', description: 'Mark as Red' },
  { key: 'A', description: 'Mark as Amber' },
  { key: 'G', description: 'Mark as Green' },
  { key: 'D', description: 'Toggle done' },
  { key: '↑/↓', description: 'Navigate items' },
  { key: 'Shift+Del', description: 'Delete item' },
];
