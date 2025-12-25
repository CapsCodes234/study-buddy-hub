import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PastPaper } from '@/types';
import { calculateYearlyPerformance } from '@/lib/paperAnalytics';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  papers: PastPaper[];
  subjects: Array<{ id: string; name: string }>;
}

export function YearlyPerformanceCard({ papers, subjects }: Props) {
  const yearlyData = useMemo(
    () => calculateYearlyPerformance(papers, subjects.map((s) => s.id)),
    [papers, subjects]
  );

  if (yearlyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Yearly Performance</CardTitle>
          <CardDescription>No past paper data yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const bestYear = yearlyData.reduce((best, curr) =>
    curr.overallAverage > best.overallAverage ? curr : best
  );
  const worstYear = yearlyData.reduce((worst, curr) =>
    curr.overallAverage < worst.overallAverage ? curr : worst
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yearly Performance</CardTitle>
        <CardDescription>Cross-subject average scores by year</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 p-3 rounded border">
              <p className="text-sm text-muted-foreground">Best Year</p>
              <p className="text-2xl font-bold">{bestYear.year}</p>
              <Badge variant="default">{bestYear.overallAverage}%</Badge>
            </div>
            {worstYear.year !== bestYear.year && (
              <div className="flex-1 p-3 rounded border">
                <p className="text-sm text-muted-foreground">Needs Focus</p>
                <p className="text-2xl font-bold">{worstYear.year}</p>
                <Badge variant="secondary">{worstYear.overallAverage}%</Badge>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {yearlyData.map((yearData, idx) => {
              const prevYear = yearlyData[idx + 1];
              const trend = prevYear ? yearData.overallAverage - prevYear.overallAverage : 0;

              return (
                <div
                  key={yearData.year}
                  className="flex items-center justify-between p-3 rounded border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{yearData.year}</span>
                    {trend > 0 && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {trend < 0 && <TrendingDown className="h-4 w-4 text-red-500" />}
                    {trend === 0 && idx < yearlyData.length - 1 && (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      {subjects.map((subject) => {
                        const avg = yearData.subjectAverages[subject.id];
                        if (!avg) return null;
                        return (
                          <Badge
                            key={subject.id}
                            variant="outline"
                            title={`${subject.name}: ${avg}%`}
                          >
                            {subject.name.charAt(0)}: {avg}%
                          </Badge>
                        );
                      })}
                    </div>

                    <Badge className="text-base px-3">{yearData.overallAverage}%</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
