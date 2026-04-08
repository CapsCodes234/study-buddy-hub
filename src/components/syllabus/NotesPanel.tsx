/**
 * NotesPanel Component
 * Slide-in panel for editing topic notes with autosave
 */

import { memo, useEffect, useState, useCallback, useRef } from 'react';
import { X, Save, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Bullet } from '@/types';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface NotesPanelProps {
  bullet: Bullet | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, notes: string) => Promise<void> | void;
}

const MAX_CHARS = 2000;
const AUTOSAVE_DELAY = 3000;

export const NotesPanel = memo(function NotesPanel({
  bullet,
  isOpen,
  onClose,
  onSave,
}: NotesPanelProps) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize notes when bullet changes
  useEffect(() => {
    if (bullet) {
      setNotes(bullet.comment || '');
      setIsDirty(false);
      setLastSaved(bullet.updatedAt ? new Date(bullet.updatedAt) : null);
    }
  }, [bullet]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Keyboard shortcut to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Autosave logic
  useEffect(() => {
    if (!bullet || !isDirty) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      saveNotes();
    }, AUTOSAVE_DELAY);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [notes, isDirty]);

  const saveNotes = useCallback(async () => {
    if (!bullet || !isDirty) return;

    setIsSaving(true);
    try {
      await onSave(bullet.id, notes);
      setLastSaved(new Date());
      setIsDirty(false);
      toast({
        title: 'Notes saved',
        description: 'Your notes have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Could not save notes. Will retry when online.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [bullet, notes, isDirty, onSave]);

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= MAX_CHARS) {
        setNotes(value);
        setIsDirty(true);
      }
    },
    []
  );

  const handleClose = useCallback(() => {
    // Save on close if dirty
    if (isDirty && bullet) {
      saveNotes();
    }
    onClose();
  }, [isDirty, bullet, saveNotes, onClose]);

  const handleSaveAndClose = useCallback(async () => {
    await saveNotes();
    onClose();
  }, [saveNotes, onClose]);

  if (!bullet) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Topic notes"
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-[400px] md:w-[480px] bg-card border-l shadow-2xl z-50',
          'flex flex-col transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="font-semibold text-lg truncate">Topic Notes</h2>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {bullet.bulletText.slice(0, 60)}
              {bullet.bulletText.length > 60 ? '...' : ''}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            aria-label="Close notes panel"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {isSaving && (
                <Badge variant="secondary" className="text-xs">
                  Saving...
                </Badge>
              )}
              {!isSaving && isDirty && (
                <Badge variant="outline" className="text-xs">
                  Unsaved changes
                </Badge>
              )}
              {!isSaving && !isDirty && lastSaved && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Saved {format(lastSaved, 'HH:mm')}
                </span>
              )}
            </div>
            <span>
              {notes.length}/{MAX_CHARS}
            </span>
          </div>

          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={notes}
            onChange={handleNotesChange}
            onBlur={saveNotes}
            placeholder="Add your notes, explanations, or links here..."
            className="flex-1 resize-none font-mono text-sm leading-relaxed min-h-[200px]"
            aria-label="Topic notes"
          />
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end gap-2 p-4 border-t shrink-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveAndClose} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Save & Close
          </Button>
        </footer>
      </aside>
    </>
  );
});

export default NotesPanel;
