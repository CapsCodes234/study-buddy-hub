import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SubjectHealth, getStatusColor, getStatusBgColor } from '@/lib/insights';
import { Calendar, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SubjectHealthCardProps {
  health: SubjectHealth;
  onClick?: () => void;
}

export const SubjectHealthCard = memo(({ health, onClick }: SubjectHealthCardProps) => {
  const statusColor = getStatusColor(health.status);
  const statusBg = getStatusBgColor(health.status);

  const totalBullets = health.redCount + health.amberCount + health.greenCount + health.doneCount;
  const redPercent = totalBullets > 0 ? (health.redCount / totalBullets) * 100 : 0;
  const amberPercent = totalBullets > 0 ? (health.amberCount / totalBullets) * 100 : 0;
  const greenPercent = totalBullets > 0 ? ((health.greenCount + health.doneCount) / totalBullets) * 100 : 0;

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo < 7) return `${daysAgo} days ago`;
    if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
    return `${Math.floor(daysAgo / 30)} months ago`;
  };

  return (
    <Card
      className={cn(
        'glass-card cursor-pointer transition-all hover:shadow-md',
        onClick && 'hover:border-primary/50',
        statusBg
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: health.subject.color }}
              />
              <CardTitle className="text-lg">{health.subject.name}</CardTitle>
            </div>
            <Badge
              variant="outline"
              className={cn('mt-1', statusColor, statusBg)}
            >
              {health.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Syllabus Coverage */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">Syllabus Coverage</span>
            <span className="text-sm font-semibold">{health.syllabusCoverage}%</span>
          </div>
          <Progress value={health.syllabusCoverage} className="h-2" />
        </div>

        {/* R/A/G Distribution */}
        {totalBullets > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Status Distribution</span>
              <span className="text-xs text-muted-foreground">
                {totalBullets} items
              </span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden border border-border">
              {redPercent > 0 && (
                <div
                  className="bg-status-red"
                  style={{ width: `${redPercent}%` }}
                  title={`${health.redCount} Red`}
                />
              )}
              {amberPercent > 0 && (
                <div
                  className="bg-status-amber"
                  style={{ width: `${amberPercent}%` }}
                  title={`${health.amberCount} Amber`}
                />
              )}
              {greenPercent > 0 && (
                <div
                  className="bg-status-green"
                  style={{ width: `${greenPercent}%` }}
                  title={`${health.greenCount + health.doneCount} Green/Done`}
                />
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span>R: {health.redCount}</span>
              <span>A: {health.amberCount}</span>
              <span>G: {health.greenCount + health.doneCount}</span>
            </div>
          </div>
        )}

        {/* Past Papers */}
        {health.papersTotal > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Past Papers</span>
            </div>
            <span className="font-medium">
              {health.papersAttempted}/{health.papersTotal} ({health.papersCompletion}%)
            </span>
          </div>
        )}

        {/* Last Practiced */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Last Practiced</span>
          </div>
          <span className="font-medium">{formatDate(health.lastPracticedDate)}</span>
        </div>
      </CardContent>
    </Card>
  );
});

SubjectHealthCard.displayName = 'SubjectHealthCard';

