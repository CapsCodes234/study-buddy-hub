/**
 * Subject Syllabus Page
 * Per-subject syllabus tracking with confidence toggles
 */

import { memo, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Filter, BookOpen, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  ConfidenceToggle,
  statusToConfidence,
  confidenceToStatus,
} from '@/components/ui/ConfidenceToggle';
import { cn } from '@/lib/utils';
import { Subject, Bullet } from '@/types';
import { ConfidenceState, CONFIDENCE_CONFIG } from '@/types/reminders';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [searchText, setSearchText] = useState('');
  const [filterState, setFilterState] = useState<FilterState>('all');
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

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

  const handleConfidenceChange = useCallback(
    (bulletId: string, newConfidence: ConfidenceState) => {
      const { status, done } = confidenceToStatus(newConfidence);
      onUpdateBullet(bulletId, { status: status as 'Red' | 'Amber' | 'Green' | null, done });
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/${subject.id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{subject.name} Syllabus</h1>
          <p className="text-sm text-muted-foreground">
            Track your topic confidence and progress
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Syllabus Progress</span>
            <span className="text-sm text-muted-foreground">
              {overallStats.confident} / {overallStats.total} confident
            </span>
          </div>
          <Progress value={overallStats.progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search topics..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filterState}
          onValueChange={(v) => setFilterState(v as FilterState)}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
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

      {/* Topics List */}
      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="space-y-3 pr-4">
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
            Object.entries(groupedData).map(([mainTopic, data]) => (
              <Card key={mainTopic} className="overflow-hidden">
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
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {data.stats.confident}/{data.stats.total}
                          </Badge>
                          <Progress
                            value={(data.stats.confident / data.stats.total) * 100}
                            className="w-20 h-2"
                          />
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
                          <div className="space-y-1">
                            {bulletItems.map((bullet) => {
                              const confidence = statusToConfidence(bullet.status, bullet.done);
                              const isHighlighted = bullet.id === highlightId;

                              return (
                                <div
                                  key={bullet.id}
                                  id={`bullet-${bullet.id}`}
                                  className={cn(
                                    'flex items-center gap-3 p-2 rounded-lg transition-all',
                                    isHighlighted
                                      ? 'bg-primary/10 ring-2 ring-primary'
                                      : 'hover:bg-muted/50'
                                  )}
                                >
                                  <ConfidenceToggle
                                    value={confidence}
                                    onChange={(v) => handleConfidenceChange(bullet.id, v)}
                                    size="sm"
                                  />
                                  <span className="text-sm flex-1">{bullet.bulletText}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

export default SubjectSyllabus;
