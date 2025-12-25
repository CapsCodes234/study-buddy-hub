import { useMemo, useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Subject } from '@/types';
import { UpcomingExams } from '@/components/dashboard/UpcomingExams';
import { ExamScheduleEditor } from '@/components/exams/ExamScheduleEditor';
import { loadSubjectComponents } from '@/lib/storage/syllabusStorage';

interface ExamsProps {
  subjects: Subject[];
}

export default function Exams({ subjects }: ExamsProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const subjectComponents = useMemo(() => loadSubjectComponents(), []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Exams</h2>
        </div>

        <Button onClick={() => setScheduleOpen(true)} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Edit Schedule
        </Button>
      </div>

      <div className="grid gap-6">
        <UpcomingExams
          subjects={subjects}
          components={subjectComponents}
          onViewSchedule={() => setScheduleOpen(true)}
          maxItems={10}
        />

        <Card>
          <CardHeader>
            <CardTitle>How this works</CardTitle>
            <CardDescription>
              Exams are managed via the Exam Schedule (with reminder lead days).
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Use “Edit Schedule” to add your exam dates. The dashboard will automatically show countdowns and reminders.
          </CardContent>
        </Card>
      </div>

      <ExamScheduleEditor
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        subjects={subjects}
        components={subjectComponents}
      />
    </div>
  );
}
