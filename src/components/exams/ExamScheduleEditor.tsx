/**
 * Exam Schedule Editor - Manage exam dates and reminder settings
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Save,
  Trophy,
  GraduationCap,
  Bell,
} from 'lucide-react';
import { Subject } from '@/types';
import { SubjectComponent, ReminderSettings, DEFAULT_REMINDER_SETTINGS } from '@/types/syllabus';
import { ExamScheduleItem, ExamType } from '@/types/paper';
import {
  loadExamSchedule,
  addExamToSchedule,
  updateExamInSchedule,
  deleteExamFromSchedule,
  getDefaultReminderDays,
  loadReminderSettings,
  saveReminderSettings,
} from '@/lib/examSchedule';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ExamScheduleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  components: SubjectComponent[];
}

const EXAM_TYPES: { value: ExamType; label: string; icon: typeof Trophy }[] = [
  { value: 'main', label: 'Main A-Level', icon: Trophy },
  { value: 'mock', label: 'Mock/Internal', icon: GraduationCap },
];

export const ExamScheduleEditor = ({
  open,
  onOpenChange,
  subjects,
  components,
}: ExamScheduleEditorProps) => {
  const [schedule, setSchedule] = useState<ExamScheduleItem[]>(() => loadExamSchedule());
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() =>
    loadReminderSettings()
  );
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state for adding/editing
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formComponentId, setFormComponentId] = useState('');
  const [formExamType, setFormExamType] = useState<ExamType>('main');
  const [formDate, setFormDate] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formReminderDays, setFormReminderDays] = useState<number[]>([7, 3, 1]);

  const { toast } = useToast();

  const subjectComponents = useMemo(() => {
    if (!formSubjectId) return [];
    return components.filter((c) => c.subjectId === formSubjectId);
  }, [components, formSubjectId]);

  const resetForm = () => {
    setFormSubjectId('');
    setFormComponentId('');
    setFormExamType('main');
    setFormDate('');
    setFormTitle('');
    setFormReminderDays([7, 3, 1]);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAddExam = () => {
    if (!formSubjectId || !formDate) {
      toast({ title: 'Error', description: 'Subject and date are required', variant: 'destructive' });
      return;
    }

    const newExam = addExamToSchedule({
      subjectId: formSubjectId,
      componentId: formComponentId || undefined,
      examType: formExamType,
      date: formDate,
      title: formTitle || undefined,
      reminderDays: formReminderDays,
    });

    setSchedule([...schedule, newExam]);
    toast({ title: 'Exam Added', description: 'Exam has been added to your schedule' });
    resetForm();
  };

  const handleUpdateExam = () => {
    if (!editingId || !formSubjectId || !formDate) return;

    updateExamInSchedule(editingId, {
      subjectId: formSubjectId,
      componentId: formComponentId || undefined,
      examType: formExamType,
      date: formDate,
      title: formTitle || undefined,
      reminderDays: formReminderDays,
    });

    setSchedule(
      schedule.map((e) =>
        e.id === editingId
          ? {
              ...e,
              subjectId: formSubjectId,
              componentId: formComponentId || undefined,
              examType: formExamType,
              date: formDate,
              title: formTitle || undefined,
              reminderDays: formReminderDays,
            }
          : e
      )
    );

    toast({ title: 'Exam Updated' });
    resetForm();
  };

  const handleDeleteExam = (id: string) => {
    deleteExamFromSchedule(id);
    setSchedule(schedule.filter((e) => e.id !== id));
    toast({ title: 'Exam Deleted' });
  };

  const startEdit = (exam: ExamScheduleItem) => {
    setEditingId(exam.id);
    setFormSubjectId(exam.subjectId);
    setFormComponentId(exam.componentId || '');
    setFormExamType(exam.examType);
    setFormDate(exam.date.split('T')[0]);
    setFormTitle(exam.title || '');
    setFormReminderDays(exam.reminderDays);
    setIsAdding(true);
  };

  const handleReminderSettingsChange = (updates: Partial<ReminderSettings>) => {
    const newSettings = { ...reminderSettings, ...updates };
    setReminderSettings(newSettings);
    saveReminderSettings(newSettings);
  };

  const getSubjectName = (id: string) => subjects.find((s) => s.id === id)?.name || id;
  const getComponentName = (id: string) => components.find((c) => c.id === id)?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 z-10 bg-background pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Exam Schedule
          </DialogTitle>
          <DialogDescription>
            Manage your exam dates and reminder settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 pb-24">
            {/* Add/Edit Form */}
            {isAdding && (
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-medium mb-4">
                  {editingId ? 'Edit Exam' : 'Add New Exam'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Subject</Label>
                    <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Component (optional)</Label>
                    <Select
                      value={formComponentId}
                      onValueChange={setFormComponentId}
                      disabled={!formSubjectId}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All components" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Components</SelectItem>
                        {subjectComponents.map((comp) => (
                          <SelectItem key={comp.id} value={comp.id}>
                            {comp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Exam Type</Label>
                    <Select
                      value={formExamType}
                      onValueChange={(v) => {
                        setFormExamType(v as ExamType);
                        setFormReminderDays(getDefaultReminderDays(v as ExamType, reminderSettings));
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXAM_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <span className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Custom Title (optional)</Label>
                    <Input
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g., Physics Paper 1 - Final"
                      className="mt-1"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Reminder Days</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[1, 2, 3, 5, 7, 14, 21, 30].map((day) => (
                        <Badge
                          key={day}
                          variant={formReminderDays.includes(day) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            if (formReminderDays.includes(day)) {
                              setFormReminderDays(formReminderDays.filter((d) => d !== day));
                            } else {
                              setFormReminderDays([...formReminderDays, day].sort((a, b) => b - a));
                            }
                          }}
                        >
                          {day}d
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button onClick={editingId ? handleUpdateExam : handleAddExam}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingId ? 'Update' : 'Add Exam'}
                  </Button>
                </div>
              </div>
            )}

            {!isAdding && (
              <Button onClick={() => setIsAdding(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Exam Date
              </Button>
            )}

            <Separator />

            {/* Exam List */}
            <div>
              <h3 className="font-medium mb-3">Scheduled Exams</h3>
              {schedule.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No exams scheduled yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reminders</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((exam) => (
                        <TableRow key={exam.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{getSubjectName(exam.subjectId)}</p>
                              {exam.componentId && (
                                <p className="text-xs text-muted-foreground">
                                  {getComponentName(exam.componentId)}
                                </p>
                              )}
                              {exam.title && (
                                <p className="text-xs text-muted-foreground">{exam.title}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(exam.date).toLocaleDateString('en-GB', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={exam.examType === 'main' ? 'default' : 'secondary'}
                            >
                              {exam.examType === 'main' ? (
                                <>
                                  <Trophy className="h-3 w-3 mr-1" />
                                  Main
                                </>
                              ) : (
                                <>
                                  <GraduationCap className="h-3 w-3 mr-1" />
                                  Mock
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {exam.reminderDays.map((d) => (
                                <Badge key={d} variant="outline" className="text-xs">
                                  {d}d
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => startEdit(exam)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => handleDeleteExam(exam.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <Separator />

            {/* Reminder Settings */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Default Reminder Settings
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Default "Remind Later" Interval</Label>
                  <Select
                    value={reminderSettings.defaultIntervalDays.toString()}
                    onValueChange={(v) =>
                      handleReminderSettingsChange({ defaultIntervalDays: parseInt(v) })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="2">2 days</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="5">5 days</SelectItem>
                      <SelectItem value="7">1 week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="reminders-enabled"
                    checked={reminderSettings.enabled}
                    onCheckedChange={(checked) =>
                      handleReminderSettingsChange({ enabled: !!checked })
                    }
                  />
                  <Label htmlFor="reminders-enabled">Enable exam reminders</Label>
                </div>
              </div>
            </div>
        </div>

        <DialogFooter className="sticky bottom-0 z-10 bg-background pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
