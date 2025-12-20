import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExamSimulation, getRiskColor, getRiskBgColor } from '@/lib/insights';
import { AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ExamSimulationCardProps {
  simulation: ExamSimulation;
}

export const ExamSimulationCard = memo(({ simulation }: ExamSimulationCardProps) => {
  const riskColor = getRiskColor(simulation.overallRisk);
  const riskBg = getRiskBgColor(simulation.overallRisk);

  return (
    <Card className={cn('glass-card', riskBg)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            If Exam Was in 30 Days
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  This is a rule-based simulation based on current progress, not a prediction.
                  It considers red bullet density, past paper gaps, and subject balance.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Rule-based simulation, not a prediction
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Risk */}
        <div className="text-center">
          <div className={cn('text-3xl font-bold mb-2', riskColor)}>
            {simulation.overallRisk}
          </div>
          <div className="text-sm text-muted-foreground mb-3">
            Estimated Readiness: {simulation.estimatedReadiness}%
          </div>
          <Progress value={simulation.estimatedReadiness} className="h-2" />
        </div>

        {/* Subjects at Risk */}
        {simulation.subjectsAtRisk.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Subjects at Risk</h4>
            {simulation.subjectsAtRisk.map((item, index) => (
              <div
                key={item.subject.id}
                className="p-3 rounded-lg border border-border bg-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.subject.color }}
                    />
                    <span className="text-sm font-medium">{item.subject.name}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      item.riskLevel === 'Critical' && 'border-status-red/50 text-status-red',
                      item.riskLevel === 'High' && 'border-status-red/30 text-status-red',
                      item.riskLevel === 'Moderate' && 'border-status-amber/50 text-status-amber'
                    )}
                  >
                    {item.riskLevel}
                  </Badge>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {item.reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Immediate Focus */}
        {simulation.immediateFocus.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-sm font-semibold">Immediate Focus</h4>
            <ul className="text-sm space-y-1">
              {simulation.immediateFocus.map((focus, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary font-bold shrink-0">{index + 1}.</span>
                  <span>{focus}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ExamSimulationCard.displayName = 'ExamSimulationCard';

