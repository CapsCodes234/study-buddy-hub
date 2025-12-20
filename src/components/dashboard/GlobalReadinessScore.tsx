import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ReadinessScore, getReadinessColor, getReadinessBgColor } from '@/lib/insights';
import { Target, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GlobalReadinessScoreProps {
  readiness: ReadinessScore;
}

export const GlobalReadinessScore = memo(({ readiness }: GlobalReadinessScoreProps) => {
  const color = getReadinessColor(readiness.score);
  const bgColor = getReadinessBgColor(readiness.score);

  return (
    <Card className={cn('glass-card', bgColor)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Global Readiness Score
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-2 text-xs">
                  <p className="font-semibold">Score Calculation:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>40% Syllabus Coverage (Green/Done items)</li>
                    <li>30% Pressure Penalty (Red/Amber items)</li>
                    <li>20% Past Paper Completion</li>
                    <li>10% Recency of Practice</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Score */}
        <div className="text-center">
          <div className={cn('text-5xl font-bold mb-2', color)}>
            {readiness.score}
          </div>
          <div className={cn('text-lg font-semibold', color)}>
            {readiness.label}
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={readiness.score} className="h-3" />

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Syllabus</div>
            <div className="text-sm font-semibold">{readiness.breakdown.syllabusCoverage}%</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Pressure</div>
            <div className="text-sm font-semibold">{readiness.breakdown.pressurePenalty}%</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Papers</div>
            <div className="text-sm font-semibold">{readiness.breakdown.paperCompletion}%</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Recency</div>
            <div className="text-sm font-semibold">{readiness.breakdown.recencyScore}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

GlobalReadinessScore.displayName = 'GlobalReadinessScore';

