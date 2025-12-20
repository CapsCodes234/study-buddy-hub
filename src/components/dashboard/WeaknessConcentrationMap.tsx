import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WeakArea } from '@/lib/insights';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { NavigationFilters } from '@/types';

interface WeaknessConcentrationMapProps {
  weakAreas: WeakArea[];
  onNavigate: (filters: NavigationFilters) => void;
  maxItems?: number;
}

export const WeaknessConcentrationMap = memo(({
  weakAreas,
  onNavigate,
  maxItems = 10,
}: WeaknessConcentrationMapProps) => {
  const topAreas = weakAreas.slice(0, maxItems);

  if (topAreas.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-status-green" />
            Top Weak Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No weak areas identified. Great work!
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleAreaClick = (area: WeakArea) => {
    onNavigate({
      tab: 'syllabus',
      bulletFilters: {
        subjectId: area.subjectId,
        searchText: area.mainTopic,
        statusFilter: 'all',
        hideCompleted: false,
      },
    });
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-status-red" />
          Top Weak Areas Across All Subjects
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topAreas.map((area, index) => (
            <div
              key={`${area.subjectId}-${area.mainTopic}-${area.subtopic}`}
              className="flex items-start justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleAreaClick(area)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">
                    #{index + 1}
                  </span>
                  <span className="text-sm font-semibold">{area.subjectName}</span>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {area.mainTopic} → {area.subtopic}
                </div>
                <div className="flex items-center gap-2">
                  {area.redCount > 0 && (
                    <Badge variant="outline" className="border-status-red/50 text-status-red text-xs">
                      {area.redCount} Red
                    </Badge>
                  )}
                  {area.amberCount > 0 && (
                    <Badge variant="outline" className="border-status-amber/50 text-status-amber text-xs">
                      {area.amberCount} Amber
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {area.totalWeakCount} total
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAreaClick(area);
                }}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

WeaknessConcentrationMap.displayName = 'WeaknessConcentrationMap';

