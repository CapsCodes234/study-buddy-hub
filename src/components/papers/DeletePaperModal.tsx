/**
 * Delete Paper Modal
 * Confirmation dialog for deleting a past paper attempt
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { PastPaper } from '@/types';

interface DeletePaperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paper: PastPaper | null;
  onConfirm: () => void;
}

export const DeletePaperModal = ({
  open,
  onOpenChange,
  paper,
  onConfirm,
}: DeletePaperModalProps) => {
  if (!paper) return null;

  const paperLabel = `${paper.paper || 'Paper'} ${paper.session} ${paper.year}${paper.variant ? ` V${paper.variant}` : ''}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Paper Attempt
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{paperLabel}</strong>?
            {paper.rawScore !== undefined && (
              <span className="block mt-2">
                Score: {paper.rawScore}/{paper.totalMarks} ({paper.percentageScore ?? 0}%)
              </span>
            )}
            <span className="block mt-2 text-destructive">
              This action cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="min-h-[44px] w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="min-h-[44px] w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
