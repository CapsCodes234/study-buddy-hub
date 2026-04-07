/**
 * Subject Past Papers Page
 * Per-subject past papers tracking with completion and confidence
 */

import { memo, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, FileText, Plus, Save, Edit, Trash2, MoreVertical, BarChart3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComponentAnalyzer } from '@/components/papers/ComponentAnalyzer';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Subject, PastPaper } from '@/types';
import { Label } from '@/components/ui/label';
import { useComponents } from '@/hooks/useComponents';
import { groupPapersByYear } from '@/lib/paperAnalytics';
import { SubjectTabs } from '@/components/layout/SubjectTabs';
import { SubjectPageWrapper } from '@/components/layout/SubjectPageWrapper';
import { EditPaperModal } from '@/components/papers/EditPaperModal';
import { DeletePaperModal } from '@/components/papers/DeletePaperModal';

export type AttemptStatus = 'started' | 'completed';

interface SubjectPapersProps {
  subject: Subject;
  pastPapers: PastPaper[];
  onAddPaper: (paper: Omit<PastPaper, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdatePaper: (id: string, updates: Partial<PastPaper>) => void;
  onDeletePaper: (id: string) => void;
}

type CompletionFilter = 'all' | 'completed' | 'incomplete';

export const SubjectPapers = memo(function SubjectPapers({
  subject,
  pastPapers,
  onAddPaper,
  onUpdatePaper,
  onDeletePaper,
}: SubjectPapersProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const { toast } = useToast();
  const { components } = useComponents(subject.id);

  // Store deleted paper for undo
  const deletedPaperRef = useRef<PastPaper | null>(null);

  // SubjectPageWrapper supplies header, icon and back button

  const [searchText, setSearchText] = useState('');
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  // Edit/Delete modals
  const [editingPaper, setEditingPaper] = useState<PastPaper | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deletingPaper, setDeletingPaper] = useState<PastPaper | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // New paper form state with attempt status
  const [attemptStatus, setAttemptStatus] = useState<AttemptStatus>('completed');
  const [selectedComponentId, setSelectedComponentId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [session, setSession] = useState<PastPaper['session']>('May/June');
  const [variant, setVariant] = useState<PastPaper['variant']>();
  const [totalMarks, setTotalMarks] = useState(0);
  const [rawScore, setRawScore] = useState<number | undefined>(undefined);
  const [percentageScore, setPercentageScore] = useState<number | undefined>(undefined);
  const [durationUsed, setDurationUsed] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);

  const selectedComponent = useMemo(
    () => components.find((c) => c.id === selectedComponentId),
    [components, selectedComponentId]
  );

  // Get subject papers
  const subjectPapers = useMemo(
    () => pastPapers.filter((p) => p.subjectId === subject.id),
    [pastPapers, subject.id]
  );

  // Available years for filter
  const availableYears = useMemo(() => {
    const years = [...new Set(subjectPapers.map((p) => p.year))];
    return years.sort((a, b) => b - a);
  }, [subjectPapers]);

  // Filtered papers
  const filteredPapers = useMemo(() => {
    let filtered = subjectPapers;

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((p) => {
        const paperText = `${p.paper} ${p.session} ${p.year}`.toLowerCase();
        const compText = components.find((c) => c.id === p.componentId)?.componentName?.toLowerCase() || '';
        return paperText.includes(search) || compText.includes(search);
      });
    }

    if (completionFilter !== 'all') {
      filtered = filtered.filter((p) =>
        completionFilter === 'completed' ? p.completed : !p.completed
      );
    }

    if (yearFilter !== 'all') {
      filtered = filtered.filter((p) => p.year === parseInt(yearFilter));
    }

    // Sort by year desc, then session
    return filtered.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return a.session.localeCompare(b.session);
    });
  }, [subjectPapers, searchText, completionFilter, yearFilter, components]);

  // Stats
  const stats = useMemo(() => {
    const total = subjectPapers.length;
    const completedCount = subjectPapers.filter((p) => p.completed).length;
    const percentages = subjectPapers
      .filter((p) => p.percentageScore !== undefined && p.percentageScore !== null)
      .map((p) => p.percentageScore!);
    const avgScore = percentages.length > 0 ? percentages.reduce((sum, v) => sum + v, 0) / percentages.length : null;

    return {
      total,
      completed: completedCount,
      progress: total > 0 ? (completedCount / total) * 100 : 0,
      avgScore,
    };
  }, [subjectPapers]);

  // Form validation
  const formErrors = useMemo(() => {
    const errors: string[] = [];
    if (attemptStatus === 'completed') {
      if (rawScore === undefined) {
        errors.push('Raw score is required for completed attempts');
      }
      if (totalMarks <= 0 && selectedComponentId) {
        errors.push('Total marks must be greater than 0');
      }
      if (rawScore !== undefined && rawScore > totalMarks) {
        errors.push('Raw score cannot exceed total marks');
      }
    }
    return errors;
  }, [attemptStatus, rawScore, totalMarks, selectedComponentId]);

  const handleSavePaper = useCallback(() => {
    if (!selectedComponentId) return;
    
    // For completed attempts, validate required fields
    if (attemptStatus === 'completed') {
      if (rawScore === undefined) return;
      if (rawScore > totalMarks) return;
    }

    const paper: Omit<PastPaper, 'id' | 'createdAt' | 'updatedAt'> = {
      subjectId: subject.id,
      componentId: selectedComponentId,
      year,
      session,
      paper: selectedComponent?.paperCode || '',
      variant,
      rawScore: attemptStatus === 'completed' ? rawScore : undefined,
      totalMarks,
      percentageScore: attemptStatus === 'completed' ? percentageScore : undefined,
      durationUsed,
      completed: attemptStatus === 'completed' ? true : completed,
      attemptDate: new Date().toISOString(),
      notes: notes || undefined,
      comment: notes || undefined,
    };

    onAddPaper(paper);

    const statusLabel = attemptStatus === 'completed' ? 'completed' : 'started';
    toast({
      title: 'Paper Logged',
      description: attemptStatus === 'completed'
        ? `${paper.paper} ${session} ${year}: ${rawScore}/${totalMarks} (${percentageScore ?? 0}%)`
        : `${paper.paper} ${session} ${year} marked as ${statusLabel}`,
    });

    setAddDialogOpen(false);
    // Reset form
    setAttemptStatus('completed');
    setSelectedComponentId('');
    setTotalMarks(0);
    setRawScore(undefined);
    setPercentageScore(undefined);
    setDurationUsed(undefined);
    setNotes('');
    setCompleted(false);
    setVariant(undefined);
  }, [attemptStatus, selectedComponentId, rawScore, totalMarks, subject.id, year, session, selectedComponent, variant, percentageScore, durationUsed, notes, completed, onAddPaper, toast]);

  // Edit paper handler
  const handleEditPaper = useCallback((paper: PastPaper) => {
    setEditingPaper(paper);
    setEditModalOpen(true);
  }, []);

  const handleSaveEdit = useCallback((id: string, updates: Partial<PastPaper>) => {
    onUpdatePaper(id, updates);
    toast({
      title: 'Paper Updated',
      description: 'Your changes have been saved.',
    });
    setEditModalOpen(false);
    setEditingPaper(null);
  }, [onUpdatePaper, toast]);

  // Delete paper handler
  const handleDeleteClick = useCallback((paper: PastPaper) => {
    setDeletingPaper(paper);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deletingPaper) return;
    
    // Store for potential undo
    deletedPaperRef.current = deletingPaper;
    
    const paperLabel = `${deletingPaper.paper || 'Paper'} ${deletingPaper.session} ${deletingPaper.year}`;
    
    onDeletePaper(deletingPaper.id);
    setDeleteModalOpen(false);
    setDeletingPaper(null);
    
    toast({
      title: 'Paper Deleted',
      description: `${paperLabel} has been deleted.`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (deletedPaperRef.current) {
              // Re-add the paper (without id to generate new one)
              const { id, createdAt, updatedAt, ...paperData } = deletedPaperRef.current;
              onAddPaper(paperData);
              toast({
                title: 'Paper Restored',
                description: `${paperLabel} has been restored.`,
              });
              deletedPaperRef.current = null;
            }
          }}
        >
          Undo
        </Button>
      ),
    });
  }, [deletingPaper, onDeletePaper, onAddPaper, toast]);

  const groupedPapers = useMemo(() => groupPapersByYear(filteredPapers), [filteredPapers]);

  return (
    <SubjectPageWrapper
      subjectId={subject.id}
      title={`${subject.name} Past Papers`}
      subtitle="Track your paper practice and scores"
    >
      <div className="flex justify-end mb-4">
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Log Paper
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 z-10 bg-background pb-4 border-b">
              <DialogTitle>Log Past Paper Attempt</DialogTitle>
              <DialogDescription>
                Enter your marks for {subject.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 pb-24">
              {/* Attempt Status */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Attempt Status</Label>
                <RadioGroup
                  value={attemptStatus}
                  onValueChange={(v) => setAttemptStatus(v as AttemptStatus)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="started" id="add-started" />
                    <Label htmlFor="add-started" className="cursor-pointer font-normal">Started</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="completed" id="add-completed" />
                    <Label htmlFor="add-completed" className="cursor-pointer font-normal">Completed</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  {attemptStatus === 'started' ? 'Scores optional - track that you began this paper' : 'Scores required for completed attempts'}
                </p>
              </div>

              <div>
                <Label htmlFor="component">Component *</Label>
                <Select
                  value={selectedComponentId}
                  onValueChange={(id) => {
                    setSelectedComponentId(id);
                    const comp = components.find((c) => c.id === id);
                    if (comp) {
                      setTotalMarks(comp.totalMarks);
                      setRawScore(undefined);
                      setPercentageScore(undefined);
                    }
                  }}
                >
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    min={2015}
                    max={2030}
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                  />
                </div>
                <div>
                  <Label htmlFor="session">Session *</Label>
                  <Select value={session} onValueChange={(v) => setSession(v as PastPaper['session'])}>
                    <SelectTrigger id="session">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="May/June">May/June</SelectItem>
                      <SelectItem value="Oct/Nov">Oct/Nov</SelectItem>
                      <SelectItem value="Feb/Mar">Feb/Mar</SelectItem>
                      <SelectItem value="Specimen">Specimen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="variant">Variant</Label>
                  <Select value={variant} onValueChange={(v) => setVariant(v as PastPaper['variant'])}>
                    <SelectTrigger id="variant">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedComponent && (
                <div>
                  <Label htmlFor="rawScore">Raw Score *</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="rawScore"
                      type="number"
                      min={0}
                      max={totalMarks}
                      value={rawScore ?? ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        if (val <= totalMarks) {
                          setRawScore(val);
                          const pct = totalMarks > 0 ? Math.round((val / totalMarks) * 100) : 0;
                          setPercentageScore(pct);
                        }
                      }}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">/ {totalMarks}</span>
                    <div className="flex-1" />
                    <Badge variant="outline" className="text-lg px-4 py-1">
                      {percentageScore ?? 0}%
                    </Badge>
                  </div>
                  {rawScore !== undefined && rawScore > totalMarks && (
                    <p className="text-sm text-destructive mt-1">
                      Raw score cannot exceed total marks ({totalMarks})
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="duration">Duration Used (optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="duration"
                    type="number"
                    min={0}
                    value={durationUsed ?? ''}
                    onChange={(e) => setDurationUsed(parseInt(e.target.value) || undefined)}
                    className="w-32"
                  />
                  <span className="text-muted-foreground">minutes</span>
                  {selectedComponent && durationUsed && (
                    <span className="text-sm text-muted-foreground ml-4">
                      (Standard: {selectedComponent.durationMin} min
                      {durationUsed < selectedComponent.durationMin && ' - Fast!'}
                      {durationUsed > selectedComponent.durationMin && ' - Slow'})
                    </span>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reflection on the paper, topics to review..."
                  rows={3}
                />
              </div>

              {attemptStatus === 'started' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="completed"
                    checked={completed}
                    onCheckedChange={(checked) => setCompleted(checked as boolean)}
                  />
                  <Label htmlFor="completed" className="font-normal cursor-pointer">
                    Mark as completed
                  </Label>
                </div>
              )}

              {/* Validation Errors */}
              {formErrors.length > 0 && attemptStatus === 'completed' && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <ul className="text-sm text-destructive space-y-1">
                    {formErrors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter className="sticky bottom-0 z-10 bg-background pt-4 border-t flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="min-h-[44px] w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                onClick={handleSavePaper}
                disabled={!selectedComponentId || (attemptStatus === 'completed' && (rawScore === undefined || rawScore > totalMarks))}
                className="min-h-[44px] w-full sm:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                {attemptStatus === 'started' ? 'Log Started' : 'Save Paper'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <SubjectTabs subjectId={subject.id} />

      {/* Progress Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Papers Completed</span>
            <div className="flex items-center gap-4">
              {stats.avgScore !== null && (
                <span className="text-sm text-muted-foreground">
                  Avg Score: {Math.round(stats.avgScore)}%
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                {stats.completed} / {stats.total}
              </span>
            </div>
          </div>
          <Progress value={stats.progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search papers..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={completionFilter}
            onValueChange={(v) => setCompletionFilter(v as CompletionFilter)}
          >
            <SelectTrigger className="w-[130px] sm:w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Papers</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="incomplete">Not Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[100px] sm:w-[120px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {availableYears.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
      </div>

      {/* Papers List */}
      <div className="space-y-6 pb-8">
          {groupedPapers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No papers found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchText || completionFilter !== 'all' || yearFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Log your first past paper to start tracking'}
                </p>
                <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Paper
                </Button>
              </CardContent>
            </Card>
          ) : (
            groupedPapers.map((yearGroup) => (
              <Card key={yearGroup.year}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{yearGroup.year}</CardTitle>
                      <CardDescription>
                        {yearGroup.totalPapers} papers attempted
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xl px-4 py-2">
                      {yearGroup.yearAverage}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {yearGroup.sessions.map((sessionGroup) => (
                    <div key={sessionGroup.session} className="border-l-2 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{sessionGroup.session}</h4>
                        <Badge>{sessionGroup.averagePercentage}%</Badge>
                      </div>

                      {sessionGroup.variants.map((variantGroup) => (
                        <div key={variantGroup.variant} className="ml-4 space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            {variantGroup.variant}
                            {variantGroup.totalMarks > 0
                              ? ` - ${variantGroup.totalRaw}/${variantGroup.totalMarks} (${variantGroup.percentage}%)`
                              : ` - (${variantGroup.percentage}%)`}
                          </p>

                          {variantGroup.papers.map((paper) => {
                            const isHighlighted = paper.id === highlightId;
                            const label = components.find((c) => c.id === paper.componentId);
                            const pct = paper.percentageScore ?? paper.score ?? 0;

                            return (
                              <div
                                key={paper.id}
                                id={`paper-${paper.id}`}
                                className={cn(
                                  'flex items-center justify-between p-2 rounded border transition-colors',
                                  isHighlighted && 'ring-2 ring-primary bg-primary/5',
                                  paper.completed && 'bg-status-green-bg/30'
                                )}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {paper.paper || label?.paperCode || 'Paper'}
                                    {!paper.completed && paper.rawScore === undefined && (
                                      <Badge variant="outline" className="ml-2 text-xs">Started</Badge>
                                    )}
                                  </p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {label ? `${label.componentName} • ` : ''}
                                    {paper.rawScore ?? '—'}/{paper.totalMarks || '—'}
                                    {paper.durationUsed ? ` • ${paper.durationUsed} min` : ''}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                  <Checkbox
                                    checked={paper.completed}
                                    onCheckedChange={(checked) =>
                                      onUpdatePaper(paper.id, { completed: checked as boolean })
                                    }
                                  />
                                  <Badge
                                    variant={
                                      pct >= 75 ? 'default' : pct >= 60 ? 'secondary' : 'destructive'
                                    }
                                  >
                                    {pct}%
                                  </Badge>
                                  
                                  {/* Edit/Delete Actions */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Actions</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-popover">
                                      <DropdownMenuItem onClick={() => handleEditPaper(paper)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteClick(paper)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
      </div>
      {/* Edit Paper Modal */}
      <EditPaperModal
        paper={editingPaper}
        components={components}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={handleSaveEdit}
      />

      {/* Delete Paper Modal */}
      <DeletePaperModal
        paper={deletingPaper}
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleConfirmDelete}
      />
    </SubjectPageWrapper>
  );
});

export default SubjectPapers;
