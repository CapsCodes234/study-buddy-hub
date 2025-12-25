/**
 * Weekly Reflection Modal - Self-reflection for study progress
 */

import { useState, useEffect, memo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  History,
  Save,
  Download,
  Trash2,
} from 'lucide-react';
import { WeeklyReflection as WeeklyReflectionType } from '@/types/reminders';
import { Subject } from '@/types';
import { format, startOfWeek, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const REFLECTIONS_STORAGE_KEY = 'study-tracker-reflections';

// Load reflections from storage
function loadReflections(): WeeklyReflectionType[] {
  try {
    const stored = localStorage.getItem(REFLECTIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save reflections to storage
function saveReflections(reflections: WeeklyReflectionType[]): void {
  try {
    localStorage.setItem(REFLECTIONS_STORAGE_KEY, JSON.stringify(reflections));
  } catch (error) {
    console.error('Error saving reflections:', error);
  }
}

interface WeeklyReflectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
}

export const WeeklyReflection = memo(function WeeklyReflection({
  open,
  onOpenChange,
  subjects,
}: WeeklyReflectionProps) {
  const [reflections, setReflections] = useState<WeeklyReflectionType[]>(() =>
    loadReflections()
  );
  const [currentTab, setCurrentTab] = useState<'new' | 'history'>('new');
  const [improved, setImproved] = useState('');
  const [slipped, setSlipped] = useState('');
  const [adjustments, setAdjustments] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const { toast } = useToast();

  const currentWeekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
  const existingReflection = reflections.find(
    (r) => r.weekStartDate === currentWeekStart
  );

  // Load existing reflection if editing
  useEffect(() => {
    if (existingReflection) {
      setImproved(existingReflection.improved);
      setSlipped(existingReflection.slipped);
      setAdjustments(existingReflection.adjustments);
      setSelectedSubjects(existingReflection.subjectTags || []);
    } else {
      setImproved('');
      setSlipped('');
      setAdjustments('');
      setSelectedSubjects([]);
    }
  }, [existingReflection, open]);

  const handleSave = useCallback(() => {
    const now = new Date().toISOString();
    
    const newReflection: WeeklyReflectionType = {
      id: existingReflection?.id || `reflection-${Date.now()}`,
      weekStartDate: currentWeekStart,
      improved,
      slipped,
      adjustments,
      subjectTags: selectedSubjects,
      createdAt: existingReflection?.createdAt || now,
      updatedAt: now,
    };

    const updated = existingReflection
      ? reflections.map((r) => (r.id === existingReflection.id ? newReflection : r))
      : [...reflections, newReflection];

    setReflections(updated);
    saveReflections(updated);

    toast({
      title: 'Reflection Saved',
      description: 'Your weekly reflection has been saved.',
    });

    onOpenChange(false);
  }, [
    improved,
    slipped,
    adjustments,
    selectedSubjects,
    existingReflection,
    currentWeekStart,
    reflections,
    onOpenChange,
    toast,
  ]);

  const handleDelete = useCallback((id: string) => {
    const updated = reflections.filter((r) => r.id !== id);
    setReflections(updated);
    saveReflections(updated);
    toast({ title: 'Reflection Deleted' });
  }, [reflections, toast]);

  const handleExport = useCallback(() => {
    const data = JSON.stringify(reflections, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-reflections-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Reflections exported as JSON' });
  }, [reflections, toast]);

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 z-10 bg-background pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Weekly Reflection
          </DialogTitle>
          <DialogDescription>
            Reflect on your study progress this week
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 pb-24">
          <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as typeof currentTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">
              <Calendar className="h-4 w-4 mr-2" />
              This Week
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-4 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Week of {format(parseISO(currentWeekStart), 'MMMM d, yyyy')}
              {existingReflection && (
                <Badge variant="outline" className="ml-2">
                  Editing
                </Badge>
              )}
            </div>

            {/* Subject Tags */}
            <div>
              <Label className="text-sm">Focus subjects (optional)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {subjects.map((subject) => (
                  <Badge
                    key={subject.id}
                    variant={selectedSubjects.includes(subject.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleSubject(subject.id)}
                  >
                    {subject.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Improved */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-status-green" />
                What improved this week?
              </Label>
              <Textarea
                value={improved}
                onChange={(e) => setImproved(e.target.value)}
                placeholder="Topics mastered, papers completed, habits formed..."
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Slipped */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-status-amber" />
                What slipped or was challenging?
              </Label>
              <Textarea
                value={slipped}
                onChange={(e) => setSlipped(e.target.value)}
                placeholder="Missed study sessions, difficult topics, distractions..."
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Adjustments */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                What adjustments for next week?
              </Label>
              <Textarea
                value={adjustments}
                onChange={(e) => setAdjustments(e.target.value)}
                placeholder="New strategies, schedule changes, focus areas..."
                className="min-h-[80px] resize-none"
              />
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {reflections.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-muted-foreground">No reflections yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reflections
                  .sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate))
                  .map((reflection) => (
                    <div
                      key={reflection.id}
                      className="border rounded-lg p-4 bg-card"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            Week of{' '}
                            {format(parseISO(reflection.weekStartDate), 'MMMM d, yyyy')}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDelete(reflection.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {reflection.subjectTags && reflection.subjectTags.length > 0 && (
                        <div className="flex gap-1 mb-3">
                          {reflection.subjectTags.map((tag) => {
                            const subject = subjects.find((s) => s.id === tag);
                            return (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {subject?.name || tag}
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      <div className="space-y-3 text-sm">
                        {reflection.improved && (
                          <div>
                            <p className="text-xs text-status-green font-medium flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              Improved
                            </p>
                            <p className="text-muted-foreground mt-1">{reflection.improved}</p>
                          </div>
                        )}
                        {reflection.slipped && (
                          <div>
                            <p className="text-xs text-status-amber font-medium flex items-center gap-1">
                              <TrendingDown className="h-3 w-3" />
                              Challenges
                            </p>
                            <p className="text-muted-foreground mt-1">{reflection.slipped}</p>
                          </div>
                        )}
                        {reflection.adjustments && (
                          <div>
                            <p className="text-xs text-primary font-medium flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              Adjustments
                            </p>
                            <p className="text-muted-foreground mt-1">{reflection.adjustments}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {reflections.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" onClick={handleExport} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Reflections
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
        </div>

        <DialogFooter className="sticky bottom-0 z-10 bg-background pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {currentTab === 'new' && (
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Reflection
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
