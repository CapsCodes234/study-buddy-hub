/**
 * Edit Paper Modal
 * Dialog for editing individual past paper attempts
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Edit, Save } from 'lucide-react';
import { PastPaper } from '@/types';
import { Component } from '@/types/components';

export type AttemptStatus = 'started' | 'completed';

interface EditPaperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paper: PastPaper | null;
  components: Component[];
  onSave: (id: string, updates: Partial<PastPaper>) => void;
}

const SESSIONS: PastPaper['session'][] = ['May/June', 'Oct/Nov', 'Feb/Mar', 'Specimen'];
const VARIANTS: PastPaper['variant'][] = ['1', '2', '3', '4', '5'];

export const EditPaperModal = ({
  open,
  onOpenChange,
  paper,
  components,
  onSave,
}: EditPaperModalProps) => {
  const [attemptStatus, setAttemptStatus] = useState<AttemptStatus>('completed');
  const [year, setYear] = useState(new Date().getFullYear());
  const [session, setSession] = useState<PastPaper['session']>('May/June');
  const [variant, setVariant] = useState<PastPaper['variant'] | undefined>(undefined);
  const [componentId, setComponentId] = useState('');
  const [rawScore, setRawScore] = useState<number | undefined>(undefined);
  const [totalMarks, setTotalMarks] = useState(100);
  const [percentageScore, setPercentageScore] = useState<number | undefined>(undefined);
  const [durationUsed, setDurationUsed] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<string[]>([]);

  // Get current component
  const selectedComponent = useMemo(
    () => components.find((c) => c.id === componentId),
    [components, componentId]
  );

  // Load paper data when modal opens
  useEffect(() => {
    if (paper && open) {
      setYear(paper.year);
      setSession(paper.session);
      setVariant(paper.variant);
      setComponentId(paper.componentId || '');
      setRawScore(paper.rawScore);
      setTotalMarks(paper.totalMarks || 100);
      setPercentageScore(paper.percentageScore);
      setDurationUsed(paper.durationUsed);
      setNotes(paper.notes || paper.comment || '');
      setCompleted(paper.completed);
      
      // Determine attempt status from paper state
      if (paper.completed && paper.rawScore !== undefined) {
        setAttemptStatus('completed');
      } else {
        setAttemptStatus('started');
      }
      
      setErrors([]);
    }
  }, [paper, open]);

  // Update totalMarks when component changes
  useEffect(() => {
    if (selectedComponent) {
      setTotalMarks(selectedComponent.totalMarks);
      // Recalculate percentage if raw score exists
      if (rawScore !== undefined && selectedComponent.totalMarks > 0) {
        setPercentageScore(Math.round((rawScore / selectedComponent.totalMarks) * 100));
      }
    }
  }, [selectedComponent, rawScore]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (attemptStatus === 'completed') {
      if (rawScore === undefined || rawScore === null) {
        newErrors.push('Raw score is required for completed attempts');
      }
      if (totalMarks <= 0) {
        newErrors.push('Total marks must be greater than 0');
      }
      if (rawScore !== undefined && rawScore > totalMarks) {
        newErrors.push('Raw score cannot exceed total marks');
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = () => {
    if (!paper || !validate()) return;

    const updates: Partial<PastPaper> = {
      year,
      session,
      variant: variant || undefined,
      componentId: componentId || undefined,
      rawScore: attemptStatus === 'completed' ? rawScore : undefined,
      totalMarks,
      percentageScore: attemptStatus === 'completed' ? percentageScore : undefined,
      durationUsed,
      notes: notes || undefined,
      comment: notes || undefined,
      completed: attemptStatus === 'completed' ? true : completed,
    };

    onSave(paper.id, updates);
    onOpenChange(false);
  };

  const handleRawScoreChange = (value: string) => {
    const score = parseInt(value);
    if (isNaN(score)) {
      setRawScore(undefined);
      setPercentageScore(undefined);
    } else {
      setRawScore(score);
      if (totalMarks > 0) {
        setPercentageScore(Math.round((score / totalMarks) * 100));
      }
    }
  };

  if (!paper) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 z-10 bg-background pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Edit Paper Attempt
          </DialogTitle>
          <DialogDescription>
            Update the details of this past paper attempt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4 pb-20">
          {/* Attempt Status */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Attempt Status</Label>
            <RadioGroup
              value={attemptStatus}
              onValueChange={(v) => setAttemptStatus(v as AttemptStatus)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="started" id="started" />
                <Label htmlFor="started" className="cursor-pointer font-normal">
                  Started
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="completed" id="completed" />
                <Label htmlFor="completed" className="cursor-pointer font-normal">
                  Completed
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              {attemptStatus === 'started'
                ? 'Scores are optional for started attempts'
                : 'Scores are required for completed attempts'}
            </p>
          </div>

          <Separator />

          {/* Paper Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-year">Year</Label>
              <Input
                id="edit-year"
                type="number"
                min={2015}
                max={2030}
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-session">Session</Label>
              <Select value={session} onValueChange={(v) => setSession(v as PastPaper['session'])}>
                <SelectTrigger id="edit-session" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-variant">Variant</Label>
              <Select value={variant || ''} onValueChange={(v) => setVariant(v as PastPaper['variant'] || undefined)}>
                <SelectTrigger id="edit-variant" className="mt-1">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {VARIANTS.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-component">Component</Label>
              <Select
                value={componentId}
                onValueChange={(id) => {
                  setComponentId(id);
                  const comp = components.find((c) => c.id === id);
                  if (comp) {
                    setTotalMarks(comp.totalMarks);
                  }
                }}
              >
                <SelectTrigger id="edit-component" className="mt-1">
                  <SelectValue placeholder="Select component" />
                </SelectTrigger>
                <SelectContent>
                  {components.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.paperCode} - {comp.componentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Score Section */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Score</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="edit-rawScore" className="text-sm">
                  Raw Score {attemptStatus === 'completed' && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="edit-rawScore"
                  type="number"
                  min={0}
                  max={totalMarks}
                  value={rawScore ?? ''}
                  onChange={(e) => handleRawScoreChange(e.target.value)}
                  className="mt-1"
                  placeholder={attemptStatus === 'started' ? 'Optional' : 'Required'}
                />
              </div>
              <div className="flex items-end gap-2 pb-0.5">
                <span className="text-muted-foreground">/</span>
                <Input
                  type="number"
                  min={1}
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(parseInt(e.target.value) || 100)}
                  className="w-20"
                />
              </div>
              {percentageScore !== undefined && (
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {percentageScore}%
                </Badge>
              )}
            </div>
            {rawScore !== undefined && rawScore > totalMarks && (
              <p className="text-sm text-destructive">
                Raw score cannot exceed total marks ({totalMarks})
              </p>
            )}
          </div>

          {/* Duration */}
          <div>
            <Label htmlFor="edit-duration">Duration Used (optional)</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="edit-duration"
                type="number"
                min={0}
                value={durationUsed ?? ''}
                onChange={(e) => setDurationUsed(parseInt(e.target.value) || undefined)}
                className="w-32"
              />
              <span className="text-muted-foreground">minutes</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reflection, topics to review..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Completed checkbox (for started attempts) */}
          {attemptStatus === 'started' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-completed"
                checked={completed}
                onCheckedChange={(checked) => setCompleted(checked as boolean)}
              />
              <Label htmlFor="edit-completed" className="font-normal cursor-pointer">
                Mark as completed
              </Label>
            </div>
          )}

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <ul className="text-sm text-destructive space-y-1">
                {errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="sticky bottom-0 z-10 bg-background pt-4 border-t flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-h-[44px] w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="min-h-[44px] w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
