/**
 * SubjectManageSection Component
 *
 * Displays current subjects with add/remove/archive/restore functionality.
 * Provides add-subject interface supporting both catalogue and custom subjects for existing users.
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Archive, ArchiveRestore, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CustomSubjectForm, type CustomSubjectFormValues } from './CustomSubjectForm';

interface SubjectManageSectionProps {
  bullets: Bullet[];
  pastPapers: PastPaper[];
  onSubjectsChange: () => void;
}

export function SubjectManageSection({
  onSubjectsChange,
}: SubjectManageSectionProps) {
  const { data: userSubjects, isLoading: isLoadingActive } = useUserSubjects();
  const { data: archivedSubjects, isLoading: isLoadingArchived } = useArchivedUserSubjects();
  const { removeSubject, restoreSubject, addCatalogueSubject, addCustomSubject } = useSubjectMutations();
  const {
    data: catalogueSubjects,
    isLoading: isLoadingCatalogue,
    isError: isCatalogueError,
    refetch: refetchCatalogue,
  } = useCatalogueSubjects();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalogue' | 'custom'>('catalogue');

  // Compute next sort order (append after highest active sort order)
  const nextSortOrder = useMemo(() => {
    if (!userSubjects || userSubjects.length === 0) return 0;
    const maxSortOrder = userSubjects.reduce(
      (max, item) => Math.max(max, item.userSubject.sort_order ?? 0),
      -1
    );
    return maxSortOrder + 1;
  }, [userSubjects]);

  // Get active catalogue subject IDs to exclude from add dialog
  const activeCatalogueIds = useMemo(() => {
    return new Set(
      userSubjects
        ?.filter((joined) => joined.catalogueSubject)
        .map((joined) => joined.catalogueSubject!.id) || []
    );
  }, [userSubjects]);

  // Filter available catalogue subjects (exclude already active)
  const availableCatalogueSubjects = useMemo(() => {
    if (!catalogueSubjects) return [];
    return catalogueSubjects.filter((subject) => !activeCatalogueIds.has(subject.id));
  }, [catalogueSubjects, activeCatalogueIds]);

  // Filter by search
  const filteredCatalogueSubjects = useMemo(() => {
    return availableCatalogueSubjects.filter(
      (subject) =>
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
    if (!canAddMore) {
      toast.error('Maximum 7 active subjects allowed');
      return;
    }
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
      await addCatalogueSubject.mutateAsync({
        catalogueSubjectId,
        sortOrder: nextSortOrder,
      });
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

  const handleAddCustomSubject = async (values: CustomSubjectFormValues) => {
    if (!canAddMore) {
      toast.error('Maximum 7 subjects allowed');
      return;
    }

    setIsAdding(true);
    try {
      await addCustomSubject.mutateAsync({
        ...values,
        sortOrder: nextSortOrder,
      });
      toast.success('Custom subject added successfully');
      setShowAddDialog(false);
      onSubjectsChange();
    } catch (error) {
      console.error('Failed to add custom subject:', error);
      toast.error('Failed to add custom subject. Please try again.');
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
                <Button disabled={!canAddMore}>
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

                <Tabs
                  value={activeTab}
                  onValueChange={(val) => setActiveTab(val as 'catalogue' | 'custom')}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
                    <TabsTrigger value="custom">Custom Subject</TabsTrigger>
                  </TabsList>

                  <TabsContent value="catalogue" className="mt-4 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search subjects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <ScrollArea className="h-[280px] rounded-md border">
                      <div className="space-y-1 p-2">
                        {isLoadingCatalogue ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : isCatalogueError ? (
                          <div className="space-y-3 py-8 text-center text-sm text-muted-foreground">
                            <p>Unable to load the subject catalogue.</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void refetchCatalogue()}
                            >
                              Retry
                            </Button>
                          </div>
                        ) : filteredCatalogueSubjects.length === 0 ? (
                          <p className="py-8 text-center text-sm text-muted-foreground">
                            {searchQuery ? 'No subjects found' : 'No available catalogue subjects'}
                          </p>
                        ) : (
                          filteredCatalogueSubjects.map((subject) => (
                            <button
                              key={subject.id}
                              onClick={() => handleAddCatalogueSubject(subject.id)}
                              disabled={isAdding}
                              className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-muted disabled:opacity-50"
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
                  </TabsContent>

                  <TabsContent value="custom" className="mt-4">
                    <CustomSubjectForm
                      onSubmit={handleAddCustomSubject}
                      isSubmitting={isAdding}
                      onCancel={() => setShowAddDialog(false)}
                    />
                  </TabsContent>
                </Tabs>
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
                  const displayName =
                    joined.catalogueSubject?.name || joined.customSubject?.name || 'Unknown';
                  const isCustom = !!joined.customSubject;

                  return (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{displayName}</p>
                        {joined.catalogueSubject?.code && (
                          <p className="text-xs text-muted-foreground">
                            {joined.catalogueSubject.code}
                          </p>
                        )}
                        {isCustom && (
                          <p className="text-xs text-muted-foreground">Custom subject</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Archive ${displayName}`}
                        onClick={() =>
                          handleRemoveSubject({
                            id: subject.id,
                            name: displayName,
                            color: '',
                            userSubjectId: subject.id,
                            version: subject.version,
                          })
                        }
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
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
                  const displayName =
                    joined.catalogueSubject?.name || joined.customSubject?.name || 'Unknown';

                  return (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{displayName}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Restore ${displayName}`}
                        onClick={() =>
                          handleRestoreSubject({
                            id: subject.id,
                            name: displayName,
                            color: '',
                            userSubjectId: subject.id,
                            version: subject.version,
                          })
                        }
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
