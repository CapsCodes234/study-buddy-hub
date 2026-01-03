/**
 * Subject Syllabus Page
 * Per-subject syllabus tracking with TopicCard dropdown and NotesPanel
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

interface SubjectSyllabusProps {
  subject: Subject;
  bullets: Bullet[];
  onUpdateBullet: (id: string, updates: Partial<Bullet>) => void;
}

type FilterState = 'all' | ConfidenceState;

export const SubjectSyllabus = memo(function SubjectSyllabus({
  subject,
  bullets,
  onUpdateBullet,
}: SubjectSyllabusProps) {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [searchText, setSearchText] = useState('');
  const [filterState, setFilterState] = useState<FilterState>('all');
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  
  // Notes panel state
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [selectedBullet, setSelectedBullet] = useState<Bullet | null>(null);

  // Keyboard shortcut for notes panel (N key when a bullet is focused)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'n' || e.key === 'N') {
        // Only trigger if not in an input
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          // Find the focused bullet card and open its notes
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

  // Group bullets by main topic and subtopic
  const groupedData = useMemo(() => {
    const subjectBullets = bullets.filter((b) => b.subjectId === subject.id);

    // Apply filters
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
    
    // Group by mainTopic for chapter stats
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
    
    for (const [topic, stats] of chapterMap) {
      const isComplete = stats.total > 0 && stats.confident === stats.total;
      if (isComplete) completedChapters++;
      chapterDetails.set(topic, { ...stats, isComplete });
    }

    return {
      totalChapters: chapterMap.size,
      completedChapters,
      chapterDetails,
      progress: chapterMap.size > 0 ? (completedChapters / chapterMap.size) * 100 : 0,
    };
  }, [bullets, subject.id]);

  // Calculate overall stats
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

  // Check for newly completed chapters and celebrate
  useEffect(() => {
    const currentStates = new Map<string, boolean>();
    
    for (const [topic, details] of chapterStats.chapterDetails) {
      currentStates.set(topic, details.isComplete);
      
      const wasComplete = prevChapterStatesRef.current.get(topic);
      const isNowComplete = details.isComplete;
      
      // Only celebrate if: was not complete -> now complete, and not already celebrated
      if (wasComplete === false && isNowComplete && !isChapterCelebrated(subject.id, topic)) {
        markChapterCelebrated(subject.id, topic);
        toast({
          title: getRandomCelebrationMessage(topic),
          duration: 4000,
        });
      }
    }
    
    prevChapterStatesRef.current = currentStates;
  }, [chapterStats.chapterDetails, subject.id]);

  const handleStatusChange = useCallback(
    (bulletId: string, newConfidence: ConfidenceState) => {
      const { status, done } = confidenceToStatus(newConfidence);
      
      // Optimistic update
      onUpdateBullet(bulletId, {
        status: status as 'Red' | 'Amber' | 'Green' | null,
        done,
        updatedAt: new Date().toISOString(),
      });

      // Queue for sync (for offline support)
      if (!navigator.onLine) {
        addToSyncQueue({
          type: 'status',
          bulletId,
          payload: { status, done },
        });
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
    // Keep selectedBullet for animation, clear after transition
    setTimeout(() => {
      if (!notesPanelOpen) setSelectedBullet(null);
    }, 300);
  }, [notesPanelOpen]);

  const handleSaveNotes = useCallback(
    async (bulletId: string, notes: string) => {
      onUpdateBullet(bulletId, {
        comment: notes,
        updatedAt: new Date().toISOString(),
      });

      // Queue for sync if offline
      if (!navigator.onLine) {
        addToSyncQueue({
          type: 'notes',
          bulletId,
          payload: { notes },
        });
      }
    },
    [onUpdateBullet]
  );

  const toggleTopic = useCallback((topicName: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicName)) {
        next.delete(topicName);
      } else {
        next.add(topicName);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedTopics(new Set(Object.keys(groupedData)));
  }, [groupedData]);

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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-3 pb-8">
        {Object.keys(groupedData).length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No topics found</h3>
              <p className="text-sm text-muted-foreground">
                {searchText || filterState !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Import syllabus data to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedData).map(([mainTopic, data]) => {
            const chapterDetail = chapterStats.chapterDetails.get(mainTopic);
            const isChapterComplete = chapterDetail?.isComplete ?? false;
            
            return (
            <Card 
              key={mainTopic} 
              className={cn(
                "overflow-hidden transition-all duration-300",
                isChapterComplete && "ring-2 ring-status-green/30 bg-status-green-bg/20"
              )}
            >
              <Collapsible
                open={expandedTopics.has(mainTopic)}
                onOpenChange={() => toggleTopic(mainTopic)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {expandedTopics.has(mainTopic) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <CardTitle className="text-base">{mainTopic}</CardTitle>
                        {isChapterComplete && (
                          <CheckCircle2 className="h-4 w-4 text-status-green" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isChapterComplete ? (
                          <Badge variant="secondary" className="text-xs bg-status-green-bg text-status-green border-status-green/30">
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
          )})
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
