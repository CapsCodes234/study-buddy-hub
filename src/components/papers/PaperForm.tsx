import { useState } from 'react';
import { PastPaper, Subject } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaperFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  paper?: PastPaper;
  onSave: (paper: Omit<PastPaper, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const SESSIONS = ['May/June', 'Oct/Nov', 'Feb/Mar'] as const;
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 20 }, (_, i) => currentYear - i);

export const PaperForm = ({
  open,
  onOpenChange,
  subjects,
  paper,
  onSave,
}: PaperFormProps) => {
  const [formData, setFormData] = useState<Partial<PastPaper>>(
    paper || {
      subjectId: subjects[0]?.id || '',
      year: currentYear,
      session: 'May/June',
      paper: '1',
      variant: '',
      completed: false,
      score: undefined,
      comment: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subjectId || !formData.year || !formData.session || !formData.paper) {
      return;
    }

    onSave({
      subjectId: formData.subjectId,
      year: formData.year,
      session: formData.session as PastPaper['session'],
      paper: formData.paper,
      variant: formData.variant,
      completed: formData.completed || false,
      score: formData.score,
      comment: formData.comment,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{paper ? 'Edit Paper' : 'Add Past Paper'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select
              value={formData.subjectId}
              onValueChange={(v) => setFormData({ ...formData, subjectId: v })}
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

          {/* Year and Session */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select
                value={formData.year?.toString()}
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

            <div className="space-y-2">
              <Label htmlFor="session">Session</Label>
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

          {/* Paper and Variant */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paper">Paper</Label>
              <Input
                id="paper"
                value={formData.paper || ''}
                onChange={(e) => setFormData({ ...formData, paper: e.target.value })}
                placeholder="e.g., 1, 2, 3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="variant">Variant (optional)</Label>
              <Input
                id="variant"
                value={formData.variant || ''}
                onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                placeholder="e.g., 11, 12"
              />
            </div>
          </div>

          {/* Score */}
          <div className="space-y-2">
            <Label htmlFor="score">Score (optional)</Label>
            <Input
              id="score"
              type="number"
              min={0}
              max={100}
              value={formData.score ?? ''}
              onChange={(e) => setFormData({
                ...formData,
                score: e.target.value ? parseInt(e.target.value) : undefined,
              })}
              placeholder="Percentage score"
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Notes (optional)</Label>
            <Textarea
              id="comment"
              value={formData.comment || ''}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Any notes about this paper..."
              rows={2}
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {paper ? 'Save Changes' : 'Add Paper'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
