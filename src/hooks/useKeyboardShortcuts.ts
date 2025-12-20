import { useEffect, useCallback } from 'react';
import { Status } from '@/types';
import { toast } from '@/hooks/use-toast';

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
    
    // Don't trigger shortcuts when typing in inputs or textareas
    const activeElement = document.activeElement;
    if (
      activeElement &&
      (activeElement.tagName === 'INPUT' ||
       activeElement.tagName === 'TEXTAREA' ||
       activeElement.getAttribute('contenteditable') === 'true' ||
       (activeElement as HTMLElement).isContentEditable)
    ) {
      return;
    }
    
    switch (event.key.toLowerCase()) {
      case 'r':
        event.preventDefault();
        if (onStatusChange) {
          onStatusChange('Red');
          toast({
            title: 'Status changed',
            description: 'Marked as Red',
            duration: 2000,
          });
        }
        break;
      case 'a':
        event.preventDefault();
        if (onStatusChange) {
          onStatusChange('Amber');
          toast({
            title: 'Status changed',
            description: 'Marked as Amber',
            duration: 2000,
          });
        }
        break;
      case 'g':
        event.preventDefault();
        if (onStatusChange) {
          onStatusChange('Green');
          toast({
            title: 'Status changed',
            description: 'Marked as Green',
            duration: 2000,
          });
        }
        break;
      case 'd':
        event.preventDefault();
        if (onToggleDone) {
          onToggleDone();
          toast({
            title: 'Done toggled',
            description: 'Done status updated',
            duration: 2000,
          });
        }
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
