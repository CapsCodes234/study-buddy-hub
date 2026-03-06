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
  Upload,
  Info,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ConfidenceExplanation, statusToConfidence } from '@/components/ui/ConfidenceToggle';
import { NextActionPanel } from '@/components/dashboard/NextActionPanel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Subject, Bullet, PastPaper } from '@/types';
import { ConfidenceState, CONFIDENCE_CONFIG } from '@/types/reminders';
import { generatePreview, parseCSV, type CSVImportResult } from '@/lib/csvImport';
import { useComponents } from '@/hooks/useComponents';
import { SubjectTabs } from '@/components/layout/SubjectTabs';
import { SubjectPageWrapper } from '@/components/layout/SubjectPageWrapper';
import { getSubjectPlannings } from '@/lib/chapterPlanningStorage';
import { getDeadlineInfo, normalizeChapterKey } from '@/types/chapterPlanning';
import { DeadlineBadge } from '@/components/syllabus/DeadlineBadge';
import { CalendarClock } from 'lucide-react';

interface SubjectOverviewProps {
  subject: Subject;
  bullets: Bullet[];
  pastPapers: PastPaper[];
  allSubjects: Subject[];
  aiFeaturesEnabled?: boolean;
  onUpdateBullet?: (id: string, updates: Partial<Bullet>) => void;
  onAddBullets?: (bullets: Omit<Bullet, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

export const SubjectOverview = memo(function SubjectOverview({
  subject,
  bullets,
  pastPapers,
  allSubjects,
  aiFeaturesEnabled = false,
  onUpdateBullet,
  onAddBullets,
}: SubjectOverviewProps) {
  const navigate = useNavigate();
  const [showExplanation, setShowExplanation] = useState(false);
  const { toast } = useToast();
  const { addComponents } = useComponents(subject.id);

  const [previewData, setPreviewData] = useState<ReturnType<typeof generatePreview> | null>(null);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [useAI, setUseAI] = useState(false);
  const [importing, setImporting] = useState(false);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = parseCSV(text, subject.id);

      if (result.errors.length > 0) {
        toast({
          title: 'Import Failed',
          description: result.errors.join(', '),
          variant: 'destructive',
        });
        return;
      }

      setImportResult(result);
      setPreviewData(generatePreview(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to read the CSV file.';
      toast({
        title: 'Import Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      e.target.value = '';
    }
  };

  const confirmImport = async () => {
    if (!importResult) return;
    if (!onAddBullets) {
      toast({
        title: 'Import Failed',
        description: 'Import is not available in the current app state.',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    try {
      const bulletsToAdd: Omit<Bullet, 'id' | 'createdAt' | 'updatedAt'>[] = importResult.syllabus.map((row) => ({
        subjectId: subject.id,
        mainTopic: row.mainTopic,
        subtopic: row.subtopic,
        bulletText: row.bulletText,
        topicNumber: row.topicNumber,
        outcomeNumber: row.outcomeNumber,
        status: null,
        comment: '',
        done: false,
      }));

      if (bulletsToAdd.length > 0) {
        onAddBullets(bulletsToAdd);
      }

      const componentsToAdd = importResult.components.map((row) => ({
        subjectId: subject.id,
        componentName: row.componentName,
        paperCode: row.paperCode,
        durationMin: row.durationMin,
        totalMarks: row.totalMarks,
        weightingPercent: row.weightingPercent,
      }));

      if (componentsToAdd.length > 0) {
        addComponents(componentsToAdd);
      }

      toast({
        title: 'Import Complete',
        description: `Imported ${importResult.syllabus.length} topics and ${importResult.components.length} components for ${subject.name}`,
      });

      setPreviewData(null);
      setImportResult(null);
      void useAI;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import data.';
      toast({
        title: 'Import Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const cancelImport = () => {
    setPreviewData(null);
    setImportResult(null);
  };

  return (
    <SubjectPageWrapper 
      subjectId={subject.id}
      title={subject.name}
      subtitle={`Your command center for ${subject.name} preparation`}
    >

      <div className="flex items-center justify-end -mt-4 mb-4">
        <Badge variant="secondary" className={cn('text-sm py-1', paceStatus.color)}>
          {paceStatus.icon} {paceStatus.label}
        </Badge>
      </div>

      <SubjectTabs subjectId={subject.id} />

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data for {subject.name}
          </CardTitle>
          <CardDescription>
            Upload CSV to populate syllabus topics and component metadata. All data will be assigned to {subject.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground mt-2 space-y-1">
                <div><strong>For Syllabus:</strong> Main Topic, Subtopic, Bullet Point Text, Level (optional), Topic Number (optional)</div>
                <div><strong>For Components:</strong> Component Name, Paper Code, Duration (min), Total Marks, Weighting (%)</div>
              </p>
            </div>

            {previewData && (
              <div className="space-y-3">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Import Preview</AlertTitle>
                  <AlertDescription>
                    Found: <strong>{previewData.bulletCount}</strong> syllabus entries, <strong>{previewData.componentCount}</strong> components
                  </AlertDescription>
                </Alert>

                {previewData.sampleRows.length > 0 && (
                  <div className="text-sm space-y-1">
                    <p className="font-medium">Sample rows:</p>
                    {previewData.sampleRows.slice(0, 3).map((row, idx) => (
                      <p key={idx} className="text-muted-foreground">
                        {'mainTopic' in row ? row.mainTopic : row.componentName} → {'subtopic' in row ? row.subtopic : row.paperCode}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={confirmImport} className="flex-1" disabled={importing}>
                    {importing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Confirm Import
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={cancelImport} className="flex-1" disabled={importing}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {aiFeaturesEnabled && (
              <div className="flex items-center justify-between p-3 border rounded">
                <Label htmlFor="ai-extract" className="text-sm font-normal">
                  Use AI to validate and categorize entries
                </Label>
                <Switch id="ai-extract" checked={useAI} onCheckedChange={setUseAI} />
              </div>
            )}
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

      {/* Chapter Deadlines Card */}
      {(() => {
        const plannings = getSubjectPlannings(subject.id);
        const subjectBullets = bullets.filter(b => b.subjectId === subject.id);
        const chapterMap = new Map<string, { total: number; confident: number }>();
        subjectBullets.forEach(b => {
          const key = normalizeChapterKey(b.mainTopic);
          const s = chapterMap.get(key) || { total: 0, confident: 0 };
          s.total++;
          if (statusToConfidence(b.status, b.done) === 'confident') s.confident++;
          chapterMap.set(key, s);
        });

        const upcoming = plannings
          .filter(p => p.completeBy)
          .map(p => {
            const stats = chapterMap.get(p.chapterKey);
            const isComplete = stats ? stats.total > 0 && stats.confident === stats.total : false;
            return { ...p, deadline: getDeadlineInfo(p.completeBy, isComplete) };
          })
          .filter(p => p.deadline.status !== 'completed' && p.deadline.status !== 'no_deadline')
          .sort((a, b) => (a.deadline.daysRemaining ?? 0) - (b.deadline.daysRemaining ?? 0));

        const totalChapters = chapterMap.size;
        const completedChapters = Array.from(chapterMap.values()).filter(s => s.total > 0 && s.confident === s.total).length;

        if (totalChapters === 0) return null;

        return (
          <Card className="max-h-[340px] flex flex-col overflow-hidden">
            <CardHeader className="pb-2 shrink-0">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                Chapter Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 flex flex-col pt-0">
              <div className="text-sm text-muted-foreground">
                {completedChapters} / {totalChapters} chapters completed
              </div>
              {upcoming.length > 0 ? (
                <div className="relative flex-1 min-h-0 flex flex-col">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-card/95 to-transparent z-[1]" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-card/95 to-transparent z-[1]" />
                  <div
                    className={cn(
                      'overflow-y-auto overscroll-contain scrollbar-thin pr-1 pt-1 pb-2',
                      'touch-pan-y [-webkit-overflow-scrolling:touch]',
                      'max-h-[180px] sm:max-h-[220px] md:max-h-[240px]'
                    )}
                  >
                    <div className="space-y-2">
                    {upcoming.map(p => (
                      <button
                        key={p.chapterKey}
                        type="button"
                        className={cn(
                          'flex items-center justify-between p-2 rounded-lg bg-muted/30 min-h-[44px] w-full text-left cursor-pointer',
                          'hover:bg-muted/60 active:scale-[0.99] transition-colors motion-reduce:active:scale-100'
                        )}
                        onClick={() => navigate(`/${subject.id}/syllabus?chapter=${p.chapterKey}`)}
                      >
                        <span className="text-sm font-medium truncate flex-1 mr-2">{p.chapterTitle}</span>
                        <DeadlineBadge deadline={p.deadline} />
                      </button>
                    ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground flex-1 flex items-center">No upcoming deadlines</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full min-h-[44px] mt-1"
                onClick={() => navigate(`/${subject.id}/syllabus`)}
              >
                Plan deadlines
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );
      })()}

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </SubjectPageWrapper>
  );
});

export default SubjectOverview;
