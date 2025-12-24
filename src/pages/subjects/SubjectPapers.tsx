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
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ConfidenceToggle, statusToConfidence, confidenceToStatus } from '@/components/ui/ConfidenceToggle';
import { cn } from '@/lib/utils';
import { Subject, PastPaper } from '@/types';
import { ConfidenceState } from '@/types/reminders';
import { Label } from '@/components/ui/label';

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

  const [searchText, setSearchText] = useState('');
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // New paper form state
  const [newPaper, setNewPaper] = useState({
    year: new Date().getFullYear(),
    session: 'May/June' as PastPaper['session'],
    paper: 'Paper 1',
    variant: '',
  });

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
      filtered = filtered.filter(
        (p) =>
          p.paper.toLowerCase().includes(search) ||
          p.session.toLowerCase().includes(search) ||
          String(p.year).includes(search)
      );
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
  }, [subjectPapers, searchText, completionFilter, yearFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = subjectPapers.length;
    const completed = subjectPapers.filter((p) => p.completed).length;
    const avgScore =
      subjectPapers.filter((p) => p.score !== undefined).length > 0
        ? subjectPapers
            .filter((p) => p.score !== undefined)
            .reduce((sum, p) => sum + (p.score || 0), 0) /
          subjectPapers.filter((p) => p.score !== undefined).length
        : null;

    return {
      total,
      completed,
      progress: total > 0 ? (completed / total) * 100 : 0,
      avgScore,
    };
  }, [subjectPapers]);

  const handleAddPaper = useCallback(() => {
    onAddPaper({
      subjectId: subject.id,
      year: newPaper.year,
      session: newPaper.session,
      paper: newPaper.paper,
      variant: newPaper.variant || undefined,
      completed: false,
    });
    setAddDialogOpen(false);
    setNewPaper({
      year: new Date().getFullYear(),
      session: 'May/June',
      paper: 'Paper 1',
      variant: '',
    });
  }, [newPaper, subject.id, onAddPaper]);

  const handleToggleCompletion = useCallback(
    (paperId: string, completed: boolean) => {
      onUpdatePaper(paperId, { completed });
    },
    [onUpdatePaper]
  );

  const handleScoreChange = useCallback(
    (paperId: string, score: string) => {
      const numScore = score ? parseInt(score) : undefined;
      onUpdatePaper(paperId, { score: numScore });
    },
    [onUpdatePaper]
  );

  // Get confidence from paper (using difficulty as proxy)
  const getPaperConfidence = (paper: PastPaper): ConfidenceState => {
    if (!paper.completed) return 'not_started';
    if (paper.difficulty === 'hard') return 'needs_revision';
    if (paper.difficulty === 'easy') return 'confident';
    return 'in_progress';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/${subject.id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{subject.name} Past Papers</h1>
          <p className="text-sm text-muted-foreground">
            Track your paper practice and scores
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Paper
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Past Paper</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={newPaper.year}
                    onChange={(e) =>
                      setNewPaper({ ...newPaper, year: parseInt(e.target.value) })
                    }
                    min={2000}
                    max={new Date().getFullYear()}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Session</Label>
                  <Select
                    value={newPaper.session}
                    onValueChange={(v) =>
                      setNewPaper({ ...newPaper, session: v as PastPaper['session'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="May/June">May/June</SelectItem>
                      <SelectItem value="Oct/Nov">Oct/Nov</SelectItem>
                      <SelectItem value="Feb/Mar">Feb/Mar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Paper</Label>
                  <Input
                    value={newPaper.paper}
                    onChange={(e) => setNewPaper({ ...newPaper, paper: e.target.value })}
                    placeholder="Paper 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Variant (optional)</Label>
                  <Input
                    value={newPaper.variant}
                    onChange={(e) => setNewPaper({ ...newPaper, variant: e.target.value })}
                    placeholder="11"
                  />
                </div>
              </div>
              <Button onClick={handleAddPaper} className="w-full">
                Add Paper
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search papers..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={completionFilter}
          onValueChange={(v) => setCompletionFilter(v as CompletionFilter)}
        >
          <SelectTrigger className="w-[150px]">
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
          <SelectTrigger className="w-[120px]">
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

      {/* Papers List */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="space-y-2 pr-4">
          {filteredPapers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No papers found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchText || completionFilter !== 'all' || yearFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Add your first past paper to start tracking'}
                </p>
                <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Paper
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredPapers.map((paper) => {
              const isHighlighted = paper.id === highlightId;

              return (
                <Card
                  key={paper.id}
                  id={`paper-${paper.id}`}
                  className={cn(
                    'transition-all',
                    isHighlighted && 'ring-2 ring-primary bg-primary/5',
                    paper.completed && 'bg-status-green-bg/30'
                  )}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center gap-4">
                      {/* Completion Checkbox */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center">
                            <Checkbox
                              checked={paper.completed}
                              onCheckedChange={(checked) =>
                                handleToggleCompletion(paper.id, checked as boolean)
                              }
                              className="h-5 w-5"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {paper.completed ? 'Mark as incomplete' : 'Mark as completed'}
                        </TooltipContent>
                      </Tooltip>

                      {/* Paper Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {paper.paper}
                            {paper.variant && ` (${paper.variant})`}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {paper.session} {paper.year}
                          </Badge>
                        </div>
                        {paper.comment && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {paper.comment}
                          </p>
                        )}
                      </div>

                      {/* Score Input */}
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Score"
                          value={paper.score ?? ''}
                          onChange={(e) => handleScoreChange(paper.id, e.target.value)}
                          className="w-20 h-8 text-center"
                          min={0}
                          max={100}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>

                      {/* Status Icon */}
                      {paper.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-status-green" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Suggested Next Paper */}
      {filteredPapers.some((p) => !p.completed) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Suggested Next Paper</p>
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const next = filteredPapers.find((p) => !p.completed);
                    return next
                      ? `${next.paper} - ${next.session} ${next.year}`
                      : 'All papers completed!';
                  })()}
                </p>
              </div>
              <Button size="sm">Start</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

export default SubjectPapers;
