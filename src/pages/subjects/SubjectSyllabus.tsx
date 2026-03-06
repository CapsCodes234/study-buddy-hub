/**
 * Subject Syllabus Page
 * Per-subject syllabus tracking with TopicCard dropdown, NotesPanel, and chapter deadlines
 */

import { memo, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, BookOpen, Trophy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { statusToConfidence, confidenceToStatus } from '@/components/ui/ConfidenceToggle';
import { TopicCard } from '@/components/syllabus/TopicCard';
import { NotesPanel } from '@/components/syllabus/NotesPanel';
import { SyncStatusIndicator } from '@/components/syllabus/SyncStatusIndicator';
import { DeadlineBadge } from '@/components/syllabus/DeadlineBadge';
import { ChapterDeadlinePicker } from '@/components/syllabus/ChapterDeadlinePicker';
import { cn } from '@/lib/utils';
import { Subject, Bullet } from '@/types';
import { ConfidenceState, CONFIDENCE_CONFIG } from '@/types/reminders';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SubjectTabs } from '@/components/layout/SubjectTabs';
import { SubjectPageWrapper } from '@/components/layout/SubjectPageWrapper';
import { addToSyncQueue } from '@/lib/syncQueue';
import { toast } from '@/hooks/use-toast';
import {
  isChapterCelebrated,
  markChapterCelebrated,
  getRandomCelebrationMessage,
} from '@/lib/chapterCompletion';
import {
  getDeadlineInfo,
  normalizeChapterKey,
  DeadlineStatus,
} from '@/types/chapterPlanning';
import {
  getSubjectPlannings,
  setChapterDeadline,
} from '@/lib/chapterPlanningStorage';

interface SubjectSyllabusProps {
  subject: Subject;
  bullets: Bullet[];
  onUpdateBullet: (id: string, updates: Partial<Bullet>) => void;
}

type FilterState = 'all' | ConfidenceState;
type DeadlineFilter = 'all' | 'due_soon' | 'overdue' | 'no_deadline' | 'completed_chapters';

export const SubjectSyllabus = memo(function SubjectSyllabus({
  subject,
  bullets,
  onUpdateBullet,
}: SubjectSyllabusProps) {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [searchText, setSearchText] = useState('');
  const [filterState, setFilterState] = useState<FilterState>('all');
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('all');
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  
  // Force re-render when deadlines change
  const [deadlineVersion, setDeadlineVersion] = useState(0);

  // Notes panel state
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [selectedBullet, setSelectedBullet] = useState<Bullet | null>(null);

  // Keyboard shortcut for notes panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'n' || e.key === 'N') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          const focused = document.activeElement?.closest('[id^="bullet-"]');
          if (focused) {
            const bulletId = focused.id.replace('bullet-', '');
            const bullet = bullets.find((b) => b.id === bulletId);
            if (bullet) {
              e.preventDefault();
              setSelectedBullet(bullet);
              setNotesPanelOpen(true);
            }
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bullets]);

  // Track previous chapter completion states for celebration detection
  const prevChapterStatesRef = useRef<Map<string, boolean>>(new Map());

  // Load deadline plannings for this subject
  const planningsMap = useMemo(() => {
    // deadlineVersion dependency forces re-read from storage
    void deadlineVersion;
    const plannings = getSubjectPlannings(subject.id);
    const map = new Map<string, string | undefined>(); // chapterKey -> completeBy
    for (const p of plannings) {
      map.set(p.chapterKey, p.completeBy);
    }
    return map;
  }, [subject.id, deadlineVersion]);

  // Group bullets by main topic and subtopic
  const groupedData = useMemo(() => {
    const subjectBullets = bullets.filter((b) => b.subjectId === subject.id);

    let filtered = subjectBullets;

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.mainTopic.toLowerCase().includes(search) ||
          b.subtopic.toLowerCase().includes(search) ||
          b.bulletText.toLowerCase().includes(search)
      );
    }

    if (filterState !== 'all') {
      filtered = filtered.filter((b) => {
        const confidence = statusToConfidence(b.status, b.done);
        return confidence === filterState;
      });
    }

    // Group by main topic
    const grouped: Record<
      string,
      {
        subtopics: Record<string, Bullet[]>;
        stats: { total: number; confident: number };
      }
    > = {};

    filtered.forEach((bullet) => {
      if (!grouped[bullet.mainTopic]) {
        grouped[bullet.mainTopic] = { subtopics: {}, stats: { total: 0, confident: 0 } };
      }
      if (!grouped[bullet.mainTopic].subtopics[bullet.subtopic]) {
        grouped[bullet.mainTopic].subtopics[bullet.subtopic] = [];
      }
      grouped[bullet.mainTopic].subtopics[bullet.subtopic].push(bullet);
      grouped[bullet.mainTopic].stats.total++;
      if (statusToConfidence(bullet.status, bullet.done) === 'confident') {
        grouped[bullet.mainTopic].stats.confident++;
      }
    });

    return grouped;
  }, [bullets, subject.id, searchText, filterState]);

  // Calculate chapter completion stats (unfiltered, for accuracy)
  const chapterStats = useMemo(() => {
    const subjectBullets = bullets.filter((b) => b.subjectId === subject.id);
    const chapterMap = new Map<string, { total: number; confident: number }>();

    subjectBullets.forEach((bullet) => {
      const existing = chapterMap.get(bullet.mainTopic) || { total: 0, confident: 0 };
      existing.total++;
      if (statusToConfidence(bullet.status, bullet.done) === 'confident') {
        existing.confident++;
      }
      chapterMap.set(bullet.mainTopic, existing);
    });

    let completedChapters = 0;
    const chapterDetails = new Map<string, { total: number; confident: number; isComplete: boolean }>();
    const completionStates: Array<[string, boolean]> = [];

    for (const [topic, stats] of chapterMap) {
      const isComplete = stats.total > 0 && stats.confident === stats.total;
      if (isComplete) completedChapters++;
      chapterDetails.set(topic, { ...stats, isComplete });
      completionStates.push([topic, isComplete]);
    }

    completionStates.sort((a, b) => a[0].localeCompare(b[0]));

    return {
      totalChapters: chapterMap.size,
      completedChapters,
      chapterDetails,
      completionStates,
      progress: chapterMap.size > 0 ? (completedChapters / chapterMap.size) * 100 : 0,
    };
  }, [bullets, subject.id]);

  // Overall stats
  const overallStats = useMemo(() => {
    const subjectBullets = bullets.filter((b) => b.subjectId === subject.id);
    const confident = subjectBullets.filter(
      (b) => statusToConfidence(b.status, b.done) === 'confident'
    ).length;
    return {
      total: subjectBullets.length,
      confident,
      progress: subjectBullets.length > 0 ? (confident / subjectBullets.length) * 100 : 0,
    };
  }, [bullets, subject.id]);

  // Check for newly completed chapters and celebrate (with deadline awareness)
  useEffect(() => {
    const currentStates = new Map<string, boolean>();

    for (const [topic, isComplete] of chapterStats.completionStates) {
      currentStates.set(topic, isComplete);

      const wasComplete = prevChapterStatesRef.current.get(topic);
      const isNowComplete = isComplete;

      if (wasComplete !== true && isNowComplete && !isChapterCelebrated(subject.id, topic)) {
        markChapterCelebrated(subject.id, topic);

        // Check deadline for contextual celebration
        const key = normalizeChapterKey(topic);
        const completeBy = planningsMap.get(key);
        const deadlineInfo = getDeadlineInfo(completeBy, true);

        if (completeBy) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const deadline = new Date(completeBy + 'T00:00:00');
          if (today <= deadline) {
            toast({
              title: `🎉 "${topic}" completed on time!`,
              description: 'Great job hitting your deadline!',
              duration: 5000,
            });
          } else {
            toast({
              title: `💪 "${topic}" completed!`,
              description: 'Better late than never — progress still counts! Consider setting your next deadline.',
              duration: 6000,
            });
          }
        } else {
          toast({
            title: getRandomCelebrationMessage(topic),
            duration: 4000,
          });
        }
      }
    }

    prevChapterStatesRef.current = currentStates;
  }, [chapterStats.completionStates, subject.id, planningsMap]);

  // Filter grouped data by deadline status
  const filteredGroupedData = useMemo(() => {
    if (deadlineFilter === 'all') return groupedData;

    const result: typeof groupedData = {};
    for (const [mainTopic, data] of Object.entries(groupedData)) {
      const key = normalizeChapterKey(mainTopic);
      const completeBy = planningsMap.get(key);
      const isComplete = chapterStats.chapterDetails.get(mainTopic)?.isComplete ?? false;
      const info = getDeadlineInfo(completeBy, isComplete);

      let match = false;
      if (deadlineFilter === 'overdue' && info.status === 'overdue') match = true;
      if (deadlineFilter === 'due_soon' && info.status === 'due_soon') match = true;
      if (deadlineFilter === 'no_deadline' && info.status === 'no_deadline') match = true;
      if (deadlineFilter === 'completed_chapters' && info.status === 'completed') match = true;

      if (match) result[mainTopic] = data;
    }
    return result;
  }, [groupedData, deadlineFilter, planningsMap, chapterStats.chapterDetails]);

  const handleDeadlineChange = useCallback(
    (mainTopic: string, date: string | undefined) => {
      setChapterDeadline(subject.id, mainTopic, date);
      setDeadlineVersion((v) => v + 1);
      if (date) {
        toast({ title: `Deadline set for "${mainTopic}"`, duration: 2000 });
      }
    },
    [subject.id]
  );

  const handleStatusChange = useCallback(
    (bulletId: string, newConfidence: ConfidenceState) => {
      const { status, done } = confidenceToStatus(newConfidence);
      onUpdateBullet(bulletId, {
        status: status as 'Red' | 'Amber' | 'Green' | null,
        done,
        updatedAt: new Date().toISOString(),
      });
      if (!navigator.onLine) {
        addToSyncQueue({ type: 'status', bulletId, payload: { status, done } });
      }
    },
    [onUpdateBullet]
  );

  const handleOpenNotes = useCallback((bullet: Bullet) => {
    setSelectedBullet(bullet);
    setNotesPanelOpen(true);
  }, []);

  const handleCloseNotes = useCallback(() => {
    setNotesPanelOpen(false);
    setTimeout(() => {
      if (!notesPanelOpen) setSelectedBullet(null);
    }, 300);
  }, [notesPanelOpen]);

  const handleSaveNotes = useCallback(
    async (bulletId: string, notes: string) => {
      onUpdateBullet(bulletId, { comment: notes, updatedAt: new Date().toISOString() });
      if (!navigator.onLine) {
        addToSyncQueue({ type: 'notes', bulletId, payload: { notes } });
      }
    },
    [onUpdateBullet]
  );

  const toggleTopic = useCallback((topicName: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicName)) next.delete(topicName);
      else next.add(topicName);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedTopics(new Set(Object.keys(filteredGroupedData)));
  }, [filteredGroupedData]);

  const collapseAll = useCallback(() => {
    setExpandedTopics(new Set());
  }, []);

  return (
    <SubjectPageWrapper
      subjectId={subject.id}
      title={`${subject.name} Syllabus`}
      subtitle="Track your syllabus coverage and confidence"
    >
      <SubjectTabs subjectId={subject.id} />

      {/* Chapter Progress Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="py-4">
          {chapterStats.totalChapters === 0 ? (
            <div className="text-center py-2">
              <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No chapters yet. Import syllabus data to get started.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold">Chapters Completed</span>
                </div>
                <span className="text-lg font-bold text-primary">
                  {chapterStats.completedChapters} / {chapterStats.totalChapters}
                </span>
              </div>
              <Progress value={chapterStats.progress} className="h-2.5" />
              <p className="text-xs text-muted-foreground mt-2">
                Complete all topics in a chapter to mark it as done
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Syllabus Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Topic Progress</span>
            <div className="flex items-center gap-3">
              <SyncStatusIndicator />
              <span className="text-sm text-muted-foreground">
                {overallStats.confident} / {overallStats.total} confident
              </span>
            </div>
          </div>
          <Progress value={overallStats.progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={filterState}
              onValueChange={(v) => setFilterState(v as FilterState)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-lg z-50">
                <SelectItem value="all">All Topics</SelectItem>
                <SelectItem value="not_started">
                  {CONFIDENCE_CONFIG.not_started.emoji} Not Started
                </SelectItem>
                <SelectItem value="in_progress">
                  {CONFIDENCE_CONFIG.in_progress.emoji} In Progress
                </SelectItem>
                <SelectItem value="confident">
                  {CONFIDENCE_CONFIG.confident.emoji} Confident
                </SelectItem>
                <SelectItem value="needs_revision">
                  {CONFIDENCE_CONFIG.needs_revision.emoji} Needs Revision
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={deadlineFilter}
              onValueChange={(v) => setDeadlineFilter(v as DeadlineFilter)}
            >
              <SelectTrigger className="w-full sm:w-[170px]">
                <SelectValue placeholder="Deadline filter" />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-lg z-50">
                <SelectItem value="all">All Deadlines</SelectItem>
                <SelectItem value="overdue">🔴 Overdue</SelectItem>
                <SelectItem value="due_soon">🟡 Due Soon</SelectItem>
                <SelectItem value="no_deadline">⬜ No Deadline</SelectItem>
                <SelectItem value="completed_chapters">✅ Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-3 pb-8">
        {Object.keys(filteredGroupedData).length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No topics found</h3>
              <p className="text-sm text-muted-foreground">
                {searchText || filterState !== 'all' || deadlineFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Import syllabus data to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(filteredGroupedData).map(([mainTopic, data]) => {
            const chapterDetail = chapterStats.chapterDetails.get(mainTopic);
            const isChapterComplete = chapterDetail?.isComplete ?? false;
            const chapterKey = normalizeChapterKey(mainTopic);
            const completeBy = planningsMap.get(chapterKey);
            const deadlineInfo = getDeadlineInfo(completeBy, isChapterComplete);

            return (
              <Card
                key={mainTopic}
                className={cn(
                  'overflow-hidden transition-all duration-300',
                  isChapterComplete && 'ring-2 ring-status-green/30 bg-status-green-bg/20'
                )}
              >
                <Collapsible
                  open={expandedTopics.has(mainTopic)}
                  onOpenChange={() => toggleTopic(mainTopic)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                      <div className="flex flex-col md:flex-row md:items-center gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {expandedTopics.has(mainTopic) ? (
                            <ChevronDown className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0" />
                          )}
                          <CardTitle className="text-base truncate">{mainTopic}</CardTitle>
                          {isChapterComplete && (
                            <CheckCircle2 className="h-4 w-4 text-status-green shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap ml-6 md:ml-0">
                          <DeadlineBadge deadline={deadlineInfo} />
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center"
                          >
                            <ChapterDeadlinePicker
                              value={completeBy}
                              onChange={(d) => handleDeadlineChange(mainTopic, d)}
                              compact
                            />
                          </div>
                          {isChapterComplete ? (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-status-green-bg text-status-green border-status-green/30"
                            >
                              ✅ Completed
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              {data.stats.confident}/{data.stats.total}
                            </Badge>
                          )}
                          {!isChapterComplete && (
                            <Progress
                              value={(data.stats.confident / data.stats.total) * 100}
                              className="w-20 h-2"
                            />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      {Object.entries(data.subtopics).map(([subtopic, bulletItems]) => (
                        <div key={subtopic} className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            {subtopic}
                          </h4>
                          <div className="space-y-2">
                            {bulletItems.map((bullet) => (
                              <TopicCard
                                key={bullet.id}
                                bullet={bullet}
                                onStatusChange={handleStatusChange}
                                onOpenNotes={handleOpenNotes}
                                isHighlighted={bullet.id === highlightId}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        )}
      </div>

      {/* Notes Panel */}
      <NotesPanel
        bullet={selectedBullet}
        isOpen={notesPanelOpen}
        onClose={handleCloseNotes}
        onSave={handleSaveNotes}
      />
    </SubjectPageWrapper>
  );
});

export default SubjectSyllabus;
