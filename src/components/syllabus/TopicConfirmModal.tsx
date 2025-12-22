/**
 * Topic Confirm Modal - Shown when the last child item is marked done
 * Enforces strict 100% completion semantics with 3 explicit choices
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  Clock,
  Edit,
  Info,
} from 'lucide-react';
import { DEFAULT_REMINDER_SETTINGS } from '@/types/syllabus';

interface TopicConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicName: string;
  completedCount: number;
  totalCount: number;
  defaultRemindDays?: number;
  onMarkDone: () => void;
  onRemindLater: (days: number) => void;
  onReviewTopic: () => void;
}

const REMIND_OPTIONS = [
  { value: '1', label: '1 day' },
  { value: '2', label: '2 days' },
  { value: '3', label: '3 days' },
  { value: '5', label: '5 days' },
  { value: '7', label: '1 week' },
  { value: '14', label: '2 weeks' },
];

export const TopicConfirmModal = ({
  open,
  onOpenChange,
  topicName,
  completedCount,
  totalCount,
  defaultRemindDays = DEFAULT_REMINDER_SETTINGS.defaultIntervalDays,
  onMarkDone,
  onRemindLater,
  onReviewTopic,
}: TopicConfirmModalProps) => {
  const [remindDays, setRemindDays] = useState(defaultRemindDays.toString());

  const handleMarkDone = () => {
    onMarkDone();
    onOpenChange(false);
  };

  const handleRemindLater = () => {
    onRemindLater(parseInt(remindDays));
    onOpenChange(false);
  };

  const handleReviewTopic = () => {
    onReviewTopic();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-status-green" />
            Completed All Items
          </DialogTitle>
          <DialogDescription>
            You have completed the last item in this main topic. What would you like to do?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="font-medium text-sm">{topicName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {completedCount} of {totalCount} items completed
            </p>
          </div>

          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Strict 100% Rule:</strong> A main topic is only marked as "Done" when 
              you explicitly confirm it. This ensures you've truly mastered all content.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {/* Option 1: Mark Done */}
            <button
              onClick={handleMarkDone}
              className="w-full p-4 rounded-lg border border-status-green/30 bg-status-green/5 hover:bg-status-green/10 transition-colors text-left group"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-status-green mt-0.5" />
                <div>
                  <p className="font-medium text-status-green">Mark main topic done</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    I've fully understood and mastered this topic
                  </p>
                </div>
              </div>
            </button>

            {/* Option 2: Remind Later */}
            <div className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Keep as incomplete (remind me later)</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    I need more time to review this topic
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Label className="text-sm shrink-0">Remind in:</Label>
                    <Select value={remindDays} onValueChange={setRemindDays}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REMIND_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleRemindLater}>
                      Set Reminder
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Option 3: Review Now */}
            <button
              onClick={handleReviewTopic}
              className="w-full p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
            >
              <div className="flex items-start gap-3">
                <Edit className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Review main topic now</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Open the topic to review or edit items
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Decide Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
