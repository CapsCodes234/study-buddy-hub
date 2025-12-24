/**
 * Subject Overview Page
 * Command center for individual subjects
 */

import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Calendar,
  TrendingUp,
  ArrowRight,
  Clock,
  Target,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ConfidenceExplanation, statusToConfidence } from '@/components/ui/ConfidenceToggle';
import { NextActionPanel } from '@/components/dashboard/NextActionPanel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Subject, Bullet, PastPaper } from '@/types';
import { ConfidenceState, CONFIDENCE_CONFIG } from '@/types/reminders';

interface SubjectOverviewProps {
  subject: Subject;
  bullets: Bullet[];
  pastPapers: PastPaper[];
  allSubjects: Subject[];
  aiFeaturesEnabled?: boolean;
  onUpdateBullet?: (id: string, updates: Partial<Bullet>) => void;
}

export const SubjectOverview = memo(function SubjectOverview({
  subject,
  bullets,
  pastPapers,
  allSubjects,
  aiFeaturesEnabled = false,
  onUpdateBullet,
}: SubjectOverviewProps) {
  const navigate = useNavigate();
  const [showExplanation, setShowExplanation] = useState(false);

  // Calculate progress stats
  const stats = useMemo(() => {
    const subjectBullets = bullets.filter((b) => b.subjectId === subject.id);
    const subjectPapers = pastPapers.filter((p) => p.subjectId === subject.id);

    // Count by confidence state
    const confidenceCounts: Record<ConfidenceState, number> = {
      not_started: 0,
      in_progress: 0,
      confident: 0,
      needs_revision: 0,
    };

    subjectBullets.forEach((b) => {
      const confidence = statusToConfidence(b.status, b.done);
      confidenceCounts[confidence]++;
    });

    const totalTopics = subjectBullets.length;
    const confidentTopics = confidenceCounts.confident;
    const topicProgress = totalTopics > 0 ? (confidentTopics / totalTopics) * 100 : 0;

    const totalPapers = subjectPapers.length;
    const completedPapers = subjectPapers.filter((p) => p.completed).length;
    const paperProgress = totalPapers > 0 ? (completedPapers / totalPapers) * 100 : 0;

    // Overall progress (weighted: 60% topics, 40% papers)
    const overallProgress = totalTopics > 0 || totalPapers > 0
      ? (topicProgress * 0.6 + paperProgress * 0.4)
      : 0;

    // Weak areas (top topics needing attention)
    const weakAreas = subjectBullets
      .filter((b) => {
        const conf = statusToConfidence(b.status, b.done);
        return conf === 'not_started' || conf === 'needs_revision';
      })
      .slice(0, 3);

    return {
      totalTopics,
      confidentTopics,
      topicProgress,
      totalPapers,
      completedPapers,
      paperProgress,
      overallProgress,
      confidenceCounts,
      weakAreas,
      subjectBullets,
      subjectPapers,
    };
  }, [bullets, pastPapers, subject.id]);

  // Pace indicator based on progress
  const paceStatus = useMemo(() => {
    if (stats.overallProgress >= 70) {
      return { label: 'Ahead of schedule', color: 'text-status-green', icon: '🎯' };
    }
    if (stats.overallProgress >= 40) {
      return { label: 'On track', color: 'text-status-green', icon: '✅' };
    }
    if (stats.overallProgress >= 20) {
      return { label: 'Behind schedule', color: 'text-status-amber', icon: '⚠️' };
    }
    return { label: 'Getting started', color: 'text-muted-foreground', icon: '🚀' };
  }, [stats.overallProgress]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{subject.name}</h1>
          <p className="text-muted-foreground mt-1">
            Your command center for {subject.name} preparation
          </p>
        </div>
        <Badge variant="secondary" className={cn('text-sm py-1', paceStatus.color)}>
          {paceStatus.icon} {paceStatus.label}
        </Badge>
      </div>

      {/* Main Progress Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Overall Progress</h2>
            <span className="text-3xl font-bold text-primary">
              {Math.round(stats.overallProgress)}%
            </span>
          </div>
          <Progress value={stats.overallProgress} className="h-3 mb-4" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{stats.confidentTopics}</div>
              <div className="text-xs text-muted-foreground">
                of {stats.totalTopics} topics confident
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.completedPapers}</div>
              <div className="text-xs text-muted-foreground">
                of {stats.totalPapers} papers done
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-status-amber">
                {stats.confidenceCounts.in_progress}
              </div>
              <div className="text-xs text-muted-foreground">
                topics in progress
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Explanation (Collapsible) */}
      <Collapsible open={showExplanation} onOpenChange={setShowExplanation}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            {showExplanation ? 'Hide' : 'Show'} confidence states explanation
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ConfidenceExplanation className="mt-2" />
        </CollapsibleContent>
      </Collapsible>

      {/* Next Action Panel */}
      <NextActionPanel
        subjects={allSubjects}
        bullets={bullets}
        pastPapers={pastPapers}
        subjectFilter={subject.id}
        onStartTopic={(bullet) => {
          navigate(`/${subject.id}/syllabus?highlight=${bullet.id}`);
        }}
        onStartPaper={(paper) => {
          navigate(`/${subject.id}/papers?highlight=${paper.id}`);
        }}
        onMarkDone={(bullet) => {
          onUpdateBullet?.(bullet.id, { done: true, status: 'Green' });
        }}
      />

      {/* Confidence Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Confidence Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(['confident', 'in_progress', 'needs_revision', 'not_started'] as ConfidenceState[]).map(
              (state) => {
                const config = CONFIDENCE_CONFIG[state];
                const count = stats.confidenceCounts[state];
                const percentage = stats.totalTopics > 0
                  ? (count / stats.totalTopics) * 100
                  : 0;

                return (
                  <div key={state} className="flex items-center gap-3">
                    <span className="text-lg">{config.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{config.label}</span>
                        <span className="text-muted-foreground">
                          {count} ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weak Areas */}
      {stats.weakAreas.length > 0 && (
        <Card className="border-status-amber/20 bg-status-amber-bg/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-status-amber" />
              Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.weakAreas.map((bullet) => (
                <div
                  key={bullet.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{bullet.mainTopic}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {bullet.subtopic}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/${subject.id}/syllabus?highlight=${bullet.id}`)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Suggestions */}
      {aiFeaturesEnabled && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground italic">
              AI suggestions are based on your progress data. They're advisory only.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-muted/50">
              <p className="text-sm">
                {stats.confidenceCounts.in_progress > 0
                  ? `Focus on completing ${stats.confidenceCounts.in_progress} in-progress topics before starting new ones.`
                  : stats.confidenceCounts.not_started > 0
                  ? `You have ${stats.confidenceCounts.not_started} topics to start. Begin with commonly tested areas.`
                  : `Great progress! Consider revising ${stats.confidenceCounts.needs_revision} topics that need review.`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          size="lg"
          className="h-auto py-4 gap-3"
          onClick={() => navigate(`/${subject.id}/syllabus`)}
        >
          <BookOpen className="h-5 w-5" />
          <div className="text-left">
            <div className="font-semibold">Syllabus</div>
            <div className="text-xs opacity-80">
              {stats.confidentTopics}/{stats.totalTopics} confident
            </div>
          </div>
          <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>

        <Button
          size="lg"
          variant="secondary"
          className="h-auto py-4 gap-3"
          onClick={() => navigate(`/${subject.id}/papers`)}
        >
          <FileText className="h-5 w-5" />
          <div className="text-left">
            <div className="font-semibold">Past Papers</div>
            <div className="text-xs opacity-80">
              {stats.completedPapers}/{stats.totalPapers} completed
            </div>
          </div>
          <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>
      </div>
    </div>
  );
});

export default SubjectOverview;
