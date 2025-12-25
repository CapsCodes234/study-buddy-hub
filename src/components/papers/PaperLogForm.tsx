/**
 * Paper Log Form - Enhanced form with component-based scoring
 */

import { useState, useMemo, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calculator,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';
import { Subject } from '@/types';
import { SubjectComponent } from '@/types/syllabus';
import { PaperSession, PaperComponentResult, EnhancedPastPaper } from '@/types/paper';
import { convertRawToPercent, calculateOverallPercentage, estimateGrade } from '@/lib/conversion';
import { cn } from '@/lib/utils';

interface PaperLogFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  components: SubjectComponent[];
  existingPaper?: EnhancedPastPaper;
  onSave: (paper: Omit<EnhancedPastPaper, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const SESSIONS: PaperSession[] = ['May/June', 'Oct/Nov', 'Feb/Mar', 'Specimen'];
const YEARS = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i);

interface ComponentScore {
  componentId: string;
  componentName: string;
  rawMark: string;
  totalMark: number;
  selected: boolean;
}

export const PaperLogForm = ({
  open,
  onOpenChange,
  subjects,
  components,
  existingPaper,
  onSave,
}: PaperLogFormProps) => {
  const [subjectId, setSubjectId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [session, setSession] = useState<PaperSession>('May/June');
  const [paperId, setPaperId] = useState('1');
  const [variant, setVariant] = useState('');
  const [comment, setComment] = useState('');
  const [componentScores, setComponentScores] = useState<ComponentScore[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | ''>('');

  // Get components for selected subject
  const subjectComponents = useMemo(() => {
    return components.filter(c => c.subjectId === subjectId);
  }, [components, subjectId]);

  // Initialize component scores when subject changes
  useEffect(() => {
    if (subjectId && subjectComponents.length > 0) {
      setComponentScores(
        subjectComponents.map(c => ({
          componentId: c.id,
          componentName: c.name,
          rawMark: '',
          totalMark: c.totalMarks,
          selected: false,
        }))
      );
    } else {
      setComponentScores([]);
    }
  }, [subjectId, subjectComponents]);

  // Load existing paper data
  useEffect(() => {
    if (existingPaper) {
      setSubjectId(existingPaper.subjectId);
      setYear(existingPaper.year.toString());
      setSession(existingPaper.session);
      setPaperId(existingPaper.paperId);
      setVariant(existingPaper.variant || '');
      setComment(existingPaper.comment || '');
      setDifficulty(existingPaper.difficulty || '');
      
      // Load component results
      if (existingPaper.componentResults.length > 0) {
        setComponentScores(
          existingPaper.componentResults.map(r => ({
            componentId: r.componentId,
            componentName: r.componentName,
            rawMark: r.rawMark.toString(),
            totalMark: r.totalMark,
            selected: true,
          }))
        );
      }
    }
  }, [existingPaper]);

  // Calculate results
  const calculatedResults = useMemo(() => {
    const selectedScores = componentScores.filter(s => s.selected && s.rawMark);
    
    if (selectedScores.length === 0) {
      return null;
    }

    const results: PaperComponentResult[] = selectedScores.map(s => ({
      componentId: s.componentId,
      componentName: s.componentName,
      rawMark: parseFloat(s.rawMark) || 0,
      totalMark: s.totalMark,
      percentage: convertRawToPercent(parseFloat(s.rawMark) || 0, s.totalMark),
    }));

    const overallRaw = results.reduce((sum, r) => sum + r.rawMark, 0);
    const overallTotal = results.reduce((sum, r) => sum + r.totalMark, 0);
    const overallPercentage = calculateOverallPercentage(results);

    return {
      componentResults: results,
      overallRawMark: overallRaw,
      overallTotalMark: overallTotal,
      overallPercentage,
      grade: estimateGrade(overallPercentage),
    };
  }, [componentScores]);

  const updateComponentScore = (componentId: string, updates: Partial<ComponentScore>) => {
    setComponentScores(prev =>
      prev.map(s =>
        s.componentId === componentId ? { ...s, ...updates } : s
      )
    );
  };

  const handleSave = () => {
    if (!calculatedResults) return;

    const paper: Omit<EnhancedPastPaper, 'id' | 'createdAt' | 'updatedAt'> = {
      subjectId,
      year: parseInt(year),
      session,
      paperId,
      variant: variant || undefined,
      completed: true,
      componentResults: calculatedResults.componentResults,
      overallRawMark: calculatedResults.overallRawMark,
      overallTotalMark: calculatedResults.overallTotalMark,
      overallPercentage: calculatedResults.overallPercentage,
      comment: comment || undefined,
      difficulty: difficulty || undefined,
    };

    onSave(paper);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setSubjectId('');
    setYear(new Date().getFullYear().toString());
    setSession('May/June');
    setPaperId('1');
    setVariant('');
    setComment('');
    setComponentScores([]);
    setDifficulty('');
  };

  const isValid = subjectId && year && session && paperId && calculatedResults;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 z-10 bg-background pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            {existingPaper ? 'Edit Past Paper' : 'Log Past Paper'}
          </DialogTitle>
          <DialogDescription>
            Record your past paper results with component-level scoring
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 pb-24">
          {/* Paper Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="mt-1">
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

            <div>
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Session</Label>
              <Select value={session} onValueChange={(v) => setSession(v as PaperSession)}>
                <SelectTrigger className="mt-1">
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
              <Label>Paper ID</Label>
              <Input
                value={paperId}
                onChange={(e) => setPaperId(e.target.value)}
                placeholder="e.g., 1, 2, 3"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Variant (optional)</Label>
              <Input
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="e.g., 1, 2, 3"
                className="mt-1"
              />
            </div>
          </div>

          <Separator />

          {/* Component Scores */}
          <div>
            <Label className="text-base">Component Scores</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              Select the components you attempted and enter your raw marks
            </p>

            {componentScores.length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {subjectId
                    ? 'No components set up for this subject. Go to Settings to configure component marks.'
                    : 'Select a subject to see available components'}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {componentScores.map((score) => (
                  <div
                    key={score.componentId}
                    className={cn(
                      'flex items-center gap-4 p-3 rounded-lg border transition-colors',
                      score.selected
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border'
                    )}
                  >
                    <Checkbox
                      checked={score.selected}
                      onCheckedChange={(checked) =>
                        updateComponentScore(score.componentId, { selected: !!checked })
                      }
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{score.componentName}</p>
                      <p className="text-xs text-muted-foreground">
                        Max: {score.totalMark} marks
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={score.rawMark}
                        onChange={(e) =>
                          updateComponentScore(score.componentId, {
                            rawMark: e.target.value,
                            selected: true,
                          })
                        }
                        placeholder="Raw"
                        className="w-20 text-center"
                        type="number"
                        min={0}
                        max={score.totalMark}
                      />
                      <span className="text-muted-foreground">/</span>
                      <span className="text-sm w-8">{score.totalMark}</span>
                      {score.selected && score.rawMark && (
                        <Badge
                          variant={
                            convertRawToPercent(parseFloat(score.rawMark), score.totalMark) >= 70
                              ? 'default'
                              : convertRawToPercent(parseFloat(score.rawMark), score.totalMark) >= 50
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {Math.round(convertRawToPercent(parseFloat(score.rawMark), score.totalMark))}%
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {calculatedResults && (
            <>
              <Separator />
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                    <p className="text-2xl font-bold">
                      {calculatedResults.overallRawMark} / {calculatedResults.overallTotalMark}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Percentage</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">
                        {Math.round(calculatedResults.overallPercentage)}%
                      </p>
                      <Badge variant="outline" className="text-lg">
                        {calculatedResults.grade}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Difficulty (optional)</Label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as 'easy' | 'medium' | 'hard' | '')}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Any notes about this paper..."
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 z-10 bg-background pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {existingPaper ? 'Update Paper' : 'Save Paper'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
