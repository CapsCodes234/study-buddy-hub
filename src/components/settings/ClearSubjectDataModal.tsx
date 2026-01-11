/**
 * Clear Subject Data Modal
 * Allows selective clearing of syllabus only, past papers only, or both
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertTriangle, BookOpen, FileText, Trash2 } from 'lucide-react';

export type ClearOption = 'syllabus' | 'papers' | 'both';

interface ClearSubjectDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectName: string;
  topicCount: number;
  paperCount: number;
  onConfirm: (option: ClearOption) => void;
}

export const ClearSubjectDataModal = ({
  open,
  onOpenChange,
  subjectName,
  topicCount,
  paperCount,
  onConfirm,
}: ClearSubjectDataModalProps) => {
  const [selectedOption, setSelectedOption] = useState<ClearOption>('both');

  const handleConfirm = () => {
    onConfirm(selectedOption);
    onOpenChange(false);
    // Reset selection for next use
    setSelectedOption('both');
  };

  const getOptionDescription = (option: ClearOption) => {
    switch (option) {
      case 'syllabus':
        return `Delete ${topicCount} topic${topicCount !== 1 ? 's' : ''} and syllabus bullets. Component metadata (paper components) will be kept.`;
      case 'papers':
        return `Delete ${paperCount} past paper attempt${paperCount !== 1 ? 's' : ''}. Component metadata (paper components) will be kept.`;
      case 'both':
        return `Delete ${topicCount} topic${topicCount !== 1 ? 's' : ''} and ${paperCount} paper attempt${paperCount !== 1 ? 's' : ''}. Component metadata will be kept.`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Clear Data for {subjectName}
          </DialogTitle>
          <DialogDescription>
            Choose what data to clear. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <RadioGroup
            value={selectedOption}
            onValueChange={(value) => setSelectedOption(value as ClearOption)}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
              <RadioGroupItem value="syllabus" id="syllabus" className="mt-1" />
              <Label htmlFor="syllabus" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 font-medium">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  Clear syllabus only
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {topicCount} topic{topicCount !== 1 ? 's' : ''} will be deleted
                </p>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
              <RadioGroupItem value="papers" id="papers" className="mt-1" />
              <Label htmlFor="papers" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Clear past paper logs only
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {paperCount} paper attempt{paperCount !== 1 ? 's' : ''} will be deleted
                </p>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
              <RadioGroupItem value="both" id="both" className="mt-1" />
              <Label htmlFor="both" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 font-medium">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                  Clear both syllabus + past paper logs
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  All study data for this subject will be deleted
                </p>
              </Label>
            </div>
          </RadioGroup>

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {getOptionDescription(selectedOption)}
            </p>
          </div>

          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Component metadata (paper codes, total marks, etc.) will NOT be deleted.
              You can still log new past papers after clearing.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-h-[44px] w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={
              (selectedOption === 'syllabus' && topicCount === 0) ||
              (selectedOption === 'papers' && paperCount === 0) ||
              (selectedOption === 'both' && topicCount === 0 && paperCount === 0)
            }
            className="min-h-[44px] w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear {selectedOption === 'syllabus' ? 'Syllabus' : selectedOption === 'papers' ? 'Papers' : 'Both'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
