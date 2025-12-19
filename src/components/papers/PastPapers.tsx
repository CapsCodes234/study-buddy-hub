import { useState, useMemo, useEffect } from 'react';
import { PastPaper, Subject, PaperFilters } from '@/types';
import { PaperForm } from './PaperForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { exportPastPapersAsCSV } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { calculateSubjectProgress } from '@/lib/progress';
import {
  FileText,
  Plus,
  Download,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
} from 'lucide-react';

interface PastPapersProps {
  papers: PastPaper[];
  subjects: Subject[];
  bullets: import('@/types').Bullet[];
  initialFilters?: PaperFilters;
  highlightId?: string;
  onAddPaper: (paper: Omit<PastPaper, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdatePaper: (id: string, updates: Partial<PastPaper>) => void;
  onDeletePaper: (id: string) => void;
}

export const PastPapers = ({
  papers,
  subjects,
  bullets,
  initialFilters,
  highlightId,
  onAddPaper,
  onUpdatePaper,
  onDeletePaper,
}: PastPapersProps) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<PastPaper | undefined>();
  const [filterSubject, setFilterSubject] = useState<string>(initialFilters?.subjectId || 'all');
  const [filterYear, setFilterYear] = useState<number | null>(initialFilters?.year || null);
  const [filterCompletion, setFilterCompletion] = useState<'all' | 'completed' | 'incomplete'>(
    initialFilters?.completionFilter || 'all'
  );
  const { toast } = useToast();
  
  // Update filters when initialFilters change (from navigation)
  useEffect(() => {
    if (initialFilters) {
      setFilterSubject(initialFilters.subjectId || 'all');
      setFilterYear(initialFilters.year);
      setFilterCompletion(initialFilters.completionFilter || 'all');
    }
  }, [initialFilters]);

  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      if (filterSubject !== 'all' && paper.subjectId !== filterSubject) {
        return false;
      }
      if (filterYear !== null && paper.year !== filterYear) {
        return false;
      }
      if (filterCompletion === 'completed' && !paper.completed) {
        return false;
      }
      if (filterCompletion === 'incomplete' && paper.completed) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      // Sort by year descending, then by session
      if (b.year !== a.year) return b.year - a.year;
      return a.session.localeCompare(b.session);
    });
  }, [papers, filterSubject, filterYear, filterCompletion]);
  
  // Get unique years for filter dropdown
  const availableYears = useMemo(() => {
    const years = [...new Set(papers.map(p => p.year))].sort((a, b) => b - a);
    return years;
  }, [papers]);

  const subjectStats = useMemo(() => {
    return subjects.map((subject) => {
      const progress = calculateSubjectProgress(subject, bullets, papers);
      return {
        subject,
        completed: progress.completedPapers,
        total: progress.totalPapers,
        progress: progress.pastPaperProgress,
      };
    });
  }, [subjects, papers, bullets]);

  const handleEdit = (paper: PastPaper) => {
    setEditingPaper(paper);
    setFormOpen(true);
  };

  const handleSave = (paperData: Omit<PastPaper, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingPaper) {
      onUpdatePaper(editingPaper.id, paperData);
      toast({ title: 'Paper updated' });
    } else {
      onAddPaper(paperData);
      toast({ title: 'Paper added' });
    }
    setEditingPaper(undefined);
  };

  const handleExport = () => {
    const csv = exportPastPapersAsCSV(filteredPapers, subjects);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `past-papers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `${filteredPapers.length} papers exported` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Past Papers</h2>
          <span className="text-sm text-muted-foreground">
            ({papers.filter(p => p.completed).length} / {papers.length} completed)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button size="sm" onClick={() => { setEditingPaper(undefined); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Add Paper
          </Button>
        </div>
      </div>

      {/* Subject stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {subjectStats.map(({ subject, completed, total, progress }) => (
          <Card key={subject.id} className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="font-medium">{subject.name}</span>
                </div>
                <span className="text-2xl font-bold">
                  {Math.round(progress * 100)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {completed} of {total} papers completed
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
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
        
        <Select 
          value={filterYear?.toString() || 'all'} 
          onValueChange={(v) => setFilterYear(v === 'all' ? null : parseInt(v))}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterCompletion} onValueChange={(v: 'all' | 'completed' | 'incomplete') => setFilterCompletion(v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="incomplete">Incomplete</SelectItem>
          </SelectContent>
        </Select>
        
        {(filterSubject !== 'all' || filterYear !== null || filterCompletion !== 'all') && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setFilterSubject('all');
              setFilterYear(null);
              setFilterCompletion('all');
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Papers table */}
      {filteredPapers.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">
            {papers.length === 0
              ? 'No past papers logged yet. Start tracking your practice!'
              : 'No papers match your current filter.'}
          </p>
          {papers.length === 0 && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Paper
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Paper</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPapers.map((paper) => {
                const subject = subjects.find(s => s.id === paper.subjectId);
                return (
                  <TableRow
                    key={paper.id}
                    id={`paper-${paper.id}`}
                    className={`${paper.completed ? 'bg-status-green-bg/30' : ''} ${highlightId === paper.id ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={paper.completed}
                        onCheckedChange={(checked) =>
                          onUpdatePaper(paper.id, { completed: !!checked })
                        }
                        aria-label="Mark as completed"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {subject && (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: subject.color }}
                          />
                        )}
                        {subject?.name || paper.subjectId}
                      </div>
                    </TableCell>
                    <TableCell>{paper.year}</TableCell>
                    <TableCell>{paper.session}</TableCell>
                    <TableCell>
                      P{paper.paper}
                      {paper.variant && <span className="text-muted-foreground"> v{paper.variant}</span>}
                    </TableCell>
                    <TableCell>
                      {paper.score !== undefined ? (
                        <Badge variant={paper.score >= 70 ? 'default' : paper.score >= 50 ? 'secondary' : 'destructive'}>
                          {paper.score}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-32 truncate text-sm text-muted-foreground">
                      {paper.comment || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(paper)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            onDeletePaper(paper.id);
                            toast({ title: 'Paper deleted' });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <PaperForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingPaper(undefined);
        }}
        subjects={subjects}
        paper={editingPaper}
        onSave={handleSave}
      />
    </div>
  );
};
