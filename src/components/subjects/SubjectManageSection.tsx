/**
 * SubjectManageSection Component
 *
 * Displays current subjects with add/remove/archive/restore functionality.
 * Provides a simplified add-subject interface for existing users.
 */

import { useState, useMemo } from 'react';
import { useUserSubjects } from '@/features/subjects/useUserSubjects';
import { useArchivedUserSubjects } from '@/features/subjects/useUserSubjects';
import { useSubjectMutations } from '@/features/subjects/useSubjectMutations';
import { useCatalogueSubjects } from '@/features/subjects/useCatalogueSubjects';
import type { Subject, Bullet, PastPaper } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Plus, Archive, ArchiveRestore, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

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
  const { removeSubject, restoreSubject, addCatalogueSubject } = useSubjectMutations();
  const { data: catalogueSubjects } = useCatalogueSubjects();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Get active catalogue subject IDs to exclude from add dialog
  const activeCatalogueIds = useMemo(() => {
    return new Set(
      userSubjects
        ?.filter(joined => joined.catalogueSubject)
        .map(joined => joined.catalogueSubject!.id) || []
    );
  }, [userSubjects]);

  // Filter available catalogue subjects (exclude already active)
  const availableCatalogueSubjects = useMemo(() => {
    if (!catalogueSubjects) return [];
    return catalogueSubjects.filter(subject => !activeCatalogueIds.has(subject.id));
  }, [catalogueSubjects, activeCatalogueIds]);

  // Filter by search
  const filteredCatalogueSubjects = useMemo(() => {
    return availableCatalogueSubjects.filter(subject =>
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableCatalogueSubjects, searchQuery]);

  // Calculate remaining slots
  const activeCount = userSubjects?.length || 0;
  const remainingSlots = 7 - activeCount;
  const canAddMore = remainingSlots > 0;

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

  const handleAddCatalogueSubject = async (catalogueSubjectId: string) => {
    if (!canAddMore) {
      toast.error('Maximum 7 subjects allowed');
      return;
    }

    setIsAdding(true);
    try {
      await addCatalogueSubject.mutateAsync(catalogueSubjectId);
      toast.success('Subject added successfully');
      setShowAddDialog(false);
      setSearchQuery('');
      onSubjectsChange();
    } catch (error) {
      console.error('Failed to add subject:', error);
      toast.error('Failed to add subject. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoadingActive || isLoadingArchived) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
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
                {activeCount} / 7 subjects selected
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button
                  disabled={!canAddMore || !catalogueSubjects || availableCatalogueSubjects.length === 0}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Subject</DialogTitle>
                  <DialogDescription>
                    {canAddMore
                      ? `You can add ${remainingSlots} more subject${remainingSlots > 1 ? 's' : ''}`
                      : 'Maximum 7 subjects allowed'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search subjects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <ScrollArea className="h-[300px] rounded-md border">
                    <div className="p-2 space-y-1">
                      {filteredCatalogueSubjects.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          {searchQuery ? 'No subjects found' : 'No available subjects'}
                        </p>
                      ) : (
                        filteredCatalogueSubjects.map(subject => (
                          <button
                            key={subject.id}
                            onClick={() => handleAddCatalogueSubject(subject.id)}
                            disabled={isAdding}
                            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left disabled:opacity-50"
                          >
                            <div>
                              <p className="font-medium">{subject.name}</p>
                              {subject.code && (
                                <p className="text-xs text-muted-foreground">{subject.code}</p>
                              )}
                            </div>
                            <Plus className="h-4 w-4" />
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
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
