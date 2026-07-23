/**
 * SubjectManageSection Component
 * 
 * Displays current subjects with add/remove/archive/restore functionality.
 * Integrates with the subject selection gate for adding new subjects.
 */

import { useState } from 'react';
import { useUserSubjects } from '@/features/subjects/useUserSubjects';
import { useArchivedUserSubjects } from '@/features/subjects/useUserSubjects';
import { useSubjectMutations } from '@/features/subjects/useSubjectMutations';
import { useCatalogueSubjects } from '@/features/subjects/useCatalogueSubjects';
import { getPreSelectedSubjectIds } from '@/lib/subjects/legacySubjectUsage';
import type { Subject, Bullet, PastPaper } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Archive, ArchiveRestore, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SubjectSelectionGate } from './SubjectSelectionGate';

interface SubjectManageSectionProps {
  bullets: Bullet[];
  pastPapers: PastPaper[];
  onSubjectsChange: () => void;
}

export function SubjectManageSection({
  bullets,
  pastPapers,
  onSubjectsChange,
}: SubjectManageSectionProps) {
  const { data: userSubjects, isLoading: isLoadingActive } = useUserSubjects();
  const { data: archivedSubjects, isLoading: isLoadingArchived } = useArchivedUserSubjects();
  const { removeSubject, restoreSubject } = useSubjectMutations();
  const { data: catalogueSubjects } = useCatalogueSubjects();

  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleRemoveSubject = async (subject: Subject) => {
    try {
      await removeSubject.mutateAsync(subject);
      toast.success('Subject archived');
      onSubjectsChange();
    } catch (error) {
      console.error('Failed to archive subject:', error);
      toast.error('Failed to archive subject. Please try again.');
    }
  };

  const handleRestoreSubject = async (subject: Subject) => {
    try {
      await restoreSubject.mutateAsync(subject);
      toast.success('Subject restored');
      onSubjectsChange();
    } catch (error) {
      console.error('Failed to restore subject:', error);
      toast.error('Failed to restore subject. Please try again.');
    }
  };

  if (isLoadingActive || isLoadingArchived) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (showAddDialog) {
    return (
      <SubjectSelectionGate
        bullets={bullets}
        pastPapers={pastPapers}
        onComplete={() => {
          setShowAddDialog(false);
          onSubjectsChange();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Subjects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Subjects</CardTitle>
              <CardDescription>
                Your currently selected subjects (max 7)
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              disabled={!catalogueSubjects || catalogueSubjects.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {userSubjects && userSubjects.length > 0 ? (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {userSubjects.map((joined) => {
                  const subject = joined.userSubject;
                  const displayName = joined.catalogueSubject?.name || joined.customSubject?.name || 'Unknown';
                  const isCustom = !!joined.customSubject;

                  return (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{displayName}</p>
                        {isCustom && (
                          <p className="text-xs text-muted-foreground">Custom subject</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSubject({
                          id: subject.id,
                          name: displayName,
                          color: '',
                          userSubjectId: subject.id,
                          version: subject.version,
                        })}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No active subjects</p>
              <Button
                variant="link"
                onClick={() => setShowAddDialog(true)}
                className="mt-2"
              >
                Add your first subject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archived Subjects */}
      {archivedSubjects && archivedSubjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Archived Subjects</CardTitle>
            <CardDescription>
              Previously selected subjects that can be restored
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {archivedSubjects.map((joined) => {
                  const subject = joined.userSubject;
                  const displayName = joined.catalogueSubject?.name || joined.customSubject?.name || 'Unknown';

                  return (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{displayName}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRestoreSubject({
                          id: subject.id,
                          name: displayName,
                          color: '',
                          userSubjectId: subject.id,
                          version: subject.version,
                        })}
                      >
                        <ArchiveRestore className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
