/**
 * Next Action Panel Component
 * Shows the most important next action for the user
 */

import { memo, useMemo } from 'react';
import { ArrowRight, BookOpen, FileText, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Subject, Bullet, PastPaper } from '@/types';
import { statusToConfidence } from '@/components/ui/ConfidenceToggle';

interface NextActionPanelProps {
  subjects: Subject[];
  bullets: Bullet[];
  pastPapers: PastPaper[];
  subjectFilter?: string; // Filter to specific subject
  onStartTopic?: (bullet: Bullet) => void;
  onStartPaper?: (paper: PastPaper) => void;
  onMarkDone?: (bullet: Bullet) => void;
  onSnooze?: (id: string, type: 'bullet' | 'paper') => void;
  className?: string;
}

interface NextAction {
  type: 'topic' | 'paper';
  priority: 'high' | 'medium' | 'low';
  title: string;
  subtitle: string;
  subject: Subject;
  reason: string;
  estimatedTime: string;
  data: Bullet | PastPaper;
}

function calculateNextAction(
  subjects: Subject[],
  bullets: Bullet[],
  pastPapers: PastPaper[],
  subjectFilter?: string
): NextAction | null {
  const filteredBullets = subjectFilter
    ? bullets.filter((b) => b.subjectId === subjectFilter)
    : bullets;
  const filteredPapers = subjectFilter
    ? pastPapers.filter((p) => p.subjectId === subjectFilter)
    : pastPapers;

  // Priority 1: Red status bullets (not started, high priority)
  const redBullets = filteredBullets.filter((b) => {
    const confidence = statusToConfidence(b.status, b.done);
    return confidence === 'not_started';
  });

  // Priority 2: Amber status bullets (in progress)
  const amberBullets = filteredBullets.filter((b) => {
    const confidence = statusToConfidence(b.status, b.done);
    return confidence === 'in_progress';
  });

  // Priority 3: Needs revision
  const revisionBullets = filteredBullets.filter((b) => {
    const confidence = statusToConfidence(b.status, b.done);
    return confidence === 'needs_revision';
  });

  // Priority 4: Incomplete papers
  const incompletePapers = filteredPapers.filter((p) => !p.completed);

  // Select the best next action
  let selectedBullet: Bullet | null = null;
  let priority: 'high' | 'medium' | 'low' = 'medium';
  let reason = '';

  if (redBullets.length > 0) {
    // Pick the first red bullet, preferring subjects with less progress
    selectedBullet = redBullets[0];
    priority = 'high';
    reason = 'Not yet started - highest priority';
  } else if (amberBullets.length > 0) {
    selectedBullet = amberBullets[0];
    priority = 'medium';
    reason = 'Continue where you left off';
  } else if (revisionBullets.length > 0) {
    selectedBullet = revisionBullets[0];
    priority = 'low';
    reason = 'Needs another review';
  }

  // Compare with papers
  const shouldSuggestPaper = incompletePapers.length > 0 && (
    !selectedBullet || 
    (amberBullets.length === 0 && redBullets.length < 3)
  );

  if (shouldSuggestPaper && incompletePapers.length > 0) {
    const paper = incompletePapers[0];
    const subject = subjects.find((s) => s.id === paper.subjectId);
    
    if (subject) {
      return {
        type: 'paper',
        priority: 'medium',
        title: `${paper.paper} - ${paper.session} ${paper.year}`,
        subtitle: subject.name,
        subject,
        reason: 'Practice with past papers to test your knowledge',
        estimatedTime: '45-90 min',
        data: paper,
      };
    }
  }

  if (selectedBullet) {
    const subject = subjects.find((s) => s.id === selectedBullet!.subjectId);
    
    if (subject) {
      return {
        type: 'topic',
        priority,
        title: selectedBullet.bulletText.slice(0, 80) + (selectedBullet.bulletText.length > 80 ? '...' : ''),
        subtitle: `${selectedBullet.mainTopic} › ${selectedBullet.subtopic}`,
        subject,
        reason,
        estimatedTime: '15-30 min',
        data: selectedBullet,
      };
    }
  }

  return null;
}

export const NextActionPanel = memo(function NextActionPanel({
  subjects,
  bullets,
  pastPapers,
  subjectFilter,
  onStartTopic,
  onStartPaper,
  onMarkDone,
  onSnooze,
  className,
}: NextActionPanelProps) {
  const nextAction = useMemo(
    () => calculateNextAction(subjects, bullets, pastPapers, subjectFilter),
    [subjects, bullets, pastPapers, subjectFilter]
  );

  if (!nextAction) {
    return (
      <Card className={cn('bg-status-green-bg border-status-green/20', className)}>
        <CardContent className="py-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="font-semibold text-lg">All caught up!</h3>
          <p className="text-sm text-muted-foreground">
            You've completed all available tasks. Great work!
          </p>
        </CardContent>
      </Card>
    );
  }

  const priorityColors = {
    high: 'bg-status-red-bg border-status-red/20',
    medium: 'bg-status-amber-bg border-status-amber/20',
    low: 'bg-primary/5 border-primary/20',
  };

  const priorityLabels = {
    high: 'High Priority',
    medium: 'Suggested',
    low: 'Optional',
  };

  return (
    <Card className={cn('overflow-hidden', priorityColors[nextAction.priority], className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-status-amber" />
            Next Action
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {priorityLabels[nextAction.priority]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-background/50">
              {nextAction.type === 'topic' ? (
                <BookOpen className="h-5 w-5 text-primary" />
              ) : (
                <FileText className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-tight line-clamp-2">
                {nextAction.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {nextAction.subtitle}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className="text-xs">
                  {nextAction.subject.name}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {nextAction.estimatedTime}
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">
            {nextAction.reason}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 gap-2"
            onClick={() => {
              if (nextAction.type === 'topic') {
                onStartTopic?.(nextAction.data as Bullet);
              } else {
                onStartPaper?.(nextAction.data as PastPaper);
              }
            }}
          >
            Start
            <ArrowRight className="h-4 w-4" />
          </Button>
          {nextAction.type === 'topic' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onMarkDone?.(nextAction.data as Bullet)}
            >
              Mark Done
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSnooze?.(
              nextAction.type === 'topic' 
                ? (nextAction.data as Bullet).id 
                : (nextAction.data as PastPaper).id,
              nextAction.type === 'topic' ? 'bullet' : 'paper'
            )}
          >
            Later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

export default NextActionPanel;
