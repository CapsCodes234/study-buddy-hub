/**
 * Subject Past Papers Page
 * Per-subject past papers tracking with completion and confidence
 */

import { memo, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Filter,
  FileText,
  Plus,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Subject, PastPaper } from '@/types';
import { Label } from '@/components/ui/label';
import { useComponents } from '@/hooks/useComponents';
import { groupPapersByYear } from '@/lib/paperAnalytics';
import { SubjectTabs } from '@/components/layout/SubjectTabs';
import { useSubjectTheme } from '@/components/providers/SubjectThemeProvider';
import { Calculator, Atom, Cpu } from 'lucide-react';

interface SubjectPapersProps {
  subject: Subject;
  pastPapers: PastPaper[];
  onAddPaper: (paper: Omit<PastPaper, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdatePaper: (id: string, updates: Partial<PastPaper>) => void;
}

type CompletionFilter = 'all' | 'completed' | 'incomplete';

export const SubjectPapers = memo(function SubjectPapers({
  subject,
  pastPapers,
  onAddPaper,
  onUpdatePaper,
}: SubjectPapersProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const { toast } = useToast();
  const { components } = useComponents(subject.id);
  const { isSubjectPage } = useSubjectTheme();

  // Subject icon mapping
  const SUBJECT_ICONS: Record<string, React.ElementType> = {
    math: Calculator,
    physics: Atom,
    it: Cpu,
  };
  const SubjectIcon = SUBJECT_ICONS[subject.id] || FileText;

  const [searchText, setSearchText] = useState('');
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // New paper form state
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

  const handleSavePaper = useCallback(() => {
    if (!selectedComponentId || rawScore === undefined) return;
    if (rawScore > totalMarks) return;

    const paper: Omit<PastPaper, 'id' | 'createdAt' | 'updatedAt'> = {
      subjectId: subject.id,
      componentId: selectedComponentId,
      year,
      session,
      paper: selectedComponent?.paperCode || '',
      variant,
      rawScore,
      totalMarks,
      percentageScore,
      durationUsed,
      completed,
      attemptDate: new Date().toISOString(),
      notes: notes || undefined,
      comment: notes || undefined,
    };

    onAddPaper(paper);

    toast({
      title: 'Paper Logged',
      description: `${paper.paper} ${session} ${year}: ${rawScore}/${totalMarks} (${percentageScore ?? 0}%)`,
    });

    setAddDialogOpen(false);
    setSelectedComponentId('');
    setTotalMarks(0);
    setRawScore(undefined);
    setPercentageScore(undefined);
    setDurationUsed(undefined);
    setNotes('');
    setCompleted(false);
    setVariant(undefined);
  }, [selectedComponentId, rawScore, totalMarks, subject.id, year, session, selectedComponent, variant, percentageScore, durationUsed, notes, completed, onAddPaper, toast]);

  const groupedPapers = useMemo(() => groupPapersByYear(filteredPapers), [filteredPapers]);

  return (
    <div className="relative space-y-6 animate-fade-in min-h-[calc(100vh-4rem)]">
      {/* Background pattern layer */}
      {isSubjectPage && (
        <div className="subject-bg" aria-hidden="true" />
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/${subject.id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          {/* Subject Icon */}
          {isSubjectPage && (
            <div 
              className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0 subject-icon-badge"
              style={{ 
                backgroundColor: `hsl(var(--subject-primary) / 0.15)`,
                border: `2px solid hsl(var(--subject-primary) / 0.3)`
              }}
            >
              <SubjectIcon 
                className="h-5 w-5" 
                style={{ color: `hsl(var(--subject-primary))` }}
              />
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{subject.name} Past Papers</h1>
            <p className="text-sm text-muted-foreground">
              Track your paper practice and scores
            </p>
          </div>
        </div>
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
            </div>

            <DialogFooter className="sticky bottom-0 z-10 bg-background pt-4 border-t">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSavePaper}
                disabled={!selectedComponentId || rawScore === undefined || rawScore > totalMarks}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Paper
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
      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="space-y-6 pr-4">
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
                                <div>
                                  <p className="font-medium">
                                    {paper.paper || label?.paperCode || 'Paper'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {label ? `${label.componentName} • ` : ''}
                                    {paper.rawScore ?? '—'}/{paper.totalMarks || '—'}
                                    {paper.durationUsed ? ` • ${paper.durationUsed} min` : ''}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3">
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
      </ScrollArea>
    </div>
  );
});

export default SubjectPapers;
