import { useState, useMemo } from 'react';
import { PastPaper, Subject } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useComponents } from '@/hooks/useComponents';
import { useToast } from '@/hooks/use-toast';

interface PaperFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  paper?: PastPaper;
  onSave: (paper: Omit<PastPaper, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const SESSIONS = ['May/June', 'Oct/Nov', 'Feb/Mar', 'Specimen'] as const;
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 20 }, (_, i) => currentYear - i);

export const PaperForm = ({
  open,
  onOpenChange,
  subjects,
  paper,
  onSave,
}: PaperFormProps) => {
  const { toast } = useToast();
  const [selectedSubjectId, setSelectedSubjectId] = useState(paper?.subjectId || subjects[0]?.id || '');
  const { components } = useComponents(selectedSubjectId);
  const selectedComponent = useMemo(
    () => components.find((c) => c.id === paper?.componentId),
    [components, paper?.componentId]
  );

  const [formData, setFormData] = useState<Partial<PastPaper>>(
    paper || {
      subjectId: subjects[0]?.id || '',
      componentId: '',
      year: currentYear,
      session: 'May/June',
      paper: '',
      variant: undefined,
      rawScore: undefined,
      totalMarks: 0,
      percentageScore: undefined,
      durationUsed: undefined,
      notes: '',
      completed: false,
      score: undefined,
      comment: '',
    }
  );

  const handleComponentChange = (componentId: string) => {
    const comp = components.find((c) => c.id === componentId);
    setFormData({
      ...formData,
      componentId,
      paper: comp?.paperCode || '',
      totalMarks: comp?.totalMarks || 0,
      rawScore: undefined,
      percentageScore: undefined,
    });
  };

  const handleRawScoreChange = (raw: string) => {
    const rawScore = parseInt(raw) || undefined;
    const percentageScore =
      rawScore !== undefined && formData.totalMarks && formData.totalMarks > 0
        ? Math.round((rawScore / formData.totalMarks) * 100)
        : undefined;
    setFormData({ ...formData, rawScore, percentageScore });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subjectId || !formData.componentId || formData.rawScore === undefined) {
      toast({ title: 'Missing required fields', description: 'Subject, component, and raw score are required.' });
      return;
    }

    if (formData.rawScore > (formData.totalMarks || 0)) {
      toast({ title: 'Invalid score', description: 'Raw score cannot exceed total marks.' });
      return;
    }

    const payload = {
      subjectId: formData.subjectId,
      componentId: formData.componentId,
      year: formData.year!,
      session: formData.session as PastPaper['session'],
      paper: formData.paper || '',
      variant: formData.variant,
      rawScore: formData.rawScore,
      totalMarks: formData.totalMarks,
      percentageScore: formData.percentageScore,
      durationUsed: formData.durationUsed,
      notes: formData.notes,
      completed: formData.completed || false,
      // Legacy fallbacks
      score: formData.percentageScore,
      comment: formData.notes,
    };

    onSave(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 z-10 bg-background pb-4 border-b">
          <DialogTitle>{paper ? 'Edit Paper' : 'Add Past Paper'}</DialogTitle>
          <DialogDescription>
            Enter your marks and details for this past paper attempt.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4 pb-24">
          {/* Subject */}
          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Select
              value={formData.subjectId}
              onValueChange={(v) => {
                setSelectedSubjectId(v);
                setFormData({ ...formData, subjectId: v, componentId: '', paper: '', totalMarks: 0, rawScore: undefined, percentageScore: undefined });
              }}
            >
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      {subject.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Component */}
          <div>
            <Label htmlFor="component">Component *</Label>
            <Select value={formData.componentId || ''} onValueChange={handleComponentChange}>
              <SelectTrigger id="component">
                <SelectValue placeholder="Select component" />
              </SelectTrigger>
              <SelectContent>
                {components.map((comp) => (
                  <SelectItem key={comp.id} value={comp.id}>
                    {comp.paperCode} - {comp.componentName} ({comp.totalMarks} marks)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {components.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No components found. Import component metadata first via CSV.
              </p>
            )}
          </div>

          {/* Year and Session */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Year *</Label>
              <Select
                value={formData.year?.toString() || ''}
                onValueChange={(v) => setFormData({ ...formData, year: parseInt(v) })}
              >
                <SelectTrigger id="year">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="session">Session *</Label>
              <Select
                value={formData.session}
                onValueChange={(v) => setFormData({ ...formData, session: v as PastPaper['session'] })}
              >
                <SelectTrigger id="session">
                  <SelectValue placeholder="Session" />
                </SelectTrigger>
                <SelectContent>
                  {SESSIONS.map((session) => (
                    <SelectItem key={session} value={session}>
                      {session}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Variant */}
          <div>
            <Label htmlFor="variant">Variant (optional)</Label>
            <Select
              value={formData.variant ?? ''}
              onValueChange={(v) =>
                setFormData({
                  ...formData,
                  variant: v === '' ? undefined : (v as PastPaper['variant']),
                })
              }
            >
              <SelectTrigger id="variant">
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Raw Score */}
          {formData.totalMarks && formData.totalMarks > 0 && (
            <div>
              <Label htmlFor="rawScore">Raw Score *</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="rawScore"
                  type="number"
                  min={0}
                  max={formData.totalMarks}
                  value={formData.rawScore ?? ''}
                  onChange={(e) => handleRawScoreChange(e.target.value)}
                  className="w-24"
                />
                <span className="text-muted-foreground">/ {formData.totalMarks}</span>
                <div className="flex-1" />
                <Badge variant="outline" className="text-lg px-4 py-1">
                  {formData.percentageScore ?? 0}%
                </Badge>
              </div>
              {formData.rawScore !== undefined && formData.rawScore > (formData.totalMarks || 0) && (
                <p className="text-sm text-destructive mt-1">
                  Raw score cannot exceed total marks ({formData.totalMarks})
                </p>
              )}
            </div>
          )}

          {/* Duration */}
          <div>
            <Label htmlFor="duration">Duration Used (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="duration"
                type="number"
                min={0}
                value={formData.durationUsed ?? ''}
                onChange={(e) => setFormData({ ...formData, durationUsed: parseInt(e.target.value) || undefined })}
                className="w-32"
              />
              <span className="text-muted-foreground">minutes</span>
              {selectedComponent && formData.durationUsed && (
                <span className="text-sm text-muted-foreground ml-4">
                  (Standard: {selectedComponent.durationMin} min
                  {formData.durationUsed < selectedComponent.durationMin && ' - Fast!'}
                  {formData.durationUsed > selectedComponent.durationMin && ' - Slow'})
                </span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Reflection on the paper, topics to review..."
              rows={3}
            />
          </div>

          {/* Completed */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="completed"
              checked={formData.completed}
              onCheckedChange={(checked) => setFormData({ ...formData, completed: !!checked })}
            />
            <Label htmlFor="completed" className="cursor-pointer">
              Mark as completed
            </Label>
          </div>

          <DialogFooter className="sticky bottom-0 z-10 bg-background pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.subjectId || !formData.componentId || formData.rawScore === undefined}
            >
              {paper ? 'Save Changes' : 'Add Paper'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
