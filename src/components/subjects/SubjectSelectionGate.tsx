/**
 * SubjectSelectionGate Component
 * 
 * Shown when an authenticated user has zero selected subjects.
 * Provides a generic, catalogue-driven subject selection interface.
 * Pre-checks subjects that have local study data once catalogue data arrives.
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCatalogueSubjects } from '@/features/subjects/useCatalogueSubjects';
import { useSubjectMutations } from '@/features/subjects/useSubjectMutations';
import { createInitialCatalogueSelections } from '@/features/subjects/initialSubjectSelection';
import { getPreSelectedSubjectIds } from '@/lib/subjects/legacySubjectUsage';
import { catalogueSlugToUiId } from '@/lib/subjects/catalogueUiIds';
import type { Bullet, PastPaper } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { CustomSubjectForm, type CustomSubjectFormValues } from './CustomSubjectForm';

interface SubjectSelectionGateProps {
  bullets: Bullet[];
  pastPapers: PastPaper[];
  onComplete: () => void;
}

export function SubjectSelectionGate({
  bullets,
  pastPapers,
  onComplete,
}: SubjectSelectionGateProps) {
  const {
    data: catalogueSubjects,
    isLoading: isLoadingCatalogue,
    isError: isCatalogueError,
    refetch: refetchCatalogue,
  } = useCatalogueSubjects();
  const { addCatalogueSubject, addCustomSubject } = useSubjectMutations();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalogue' | 'custom'>('catalogue');
  const [selectedCatalogueIds, setSelectedCatalogueIds] = useState<Set<string>>(new Set());

  const hasInitializedPreselectionRef = useRef(false);
  const hasUserInteractedRef = useRef(false);

  // Get pre-selected local UI IDs (e.g., "math", "physics", "it")
  const preSelectedLocalIds = useMemo(() => {
    return new Set(getPreSelectedSubjectIds(bullets, pastPapers));
  }, [bullets, pastPapers]);

  // Asynchronous pre-selection initialization: run exactly once when catalogue data arrives
  useEffect(() => {
    if (
      catalogueSubjects &&
      catalogueSubjects.length > 0 &&
      !hasInitializedPreselectionRef.current &&
      !hasUserInteractedRef.current
    ) {
      hasInitializedPreselectionRef.current = true;
      const initialSet = new Set<string>();
      catalogueSubjects.forEach((subject) => {
        const uiId = catalogueSlugToUiId(subject.slug);
        if (preSelectedLocalIds.has(uiId)) {
          initialSet.add(subject.id);
        }
      });
      setSelectedCatalogueIds(initialSet);
    }
  }, [catalogueSubjects, preSelectedLocalIds]);

  // Filter catalogue subjects by search
  const filteredCatalogueSubjects = useMemo(() => {
    return (
      catalogueSubjects?.filter(
        (subject) =>
          subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subject.code?.toLowerCase().includes(searchQuery.toLowerCase())
      ) || []
    );
  }, [catalogueSubjects, searchQuery]);

  const handleToggleCatalogueSubject = (catalogueSubjectId: string) => {
    hasUserInteractedRef.current = true;
    if (!selectedCatalogueIds.has(catalogueSubjectId) && selectedCatalogueIds.size >= 7) {
      toast.error('You can select up to 7 subjects');
      return;
    }
    setSelectedCatalogueIds((prev) => {
      const next = new Set(prev);
      if (next.has(catalogueSubjectId)) {
        next.delete(catalogueSubjectId);
      } else {
        next.add(catalogueSubjectId);
      }
      return next;
    });
  };

  const handleConfirmSelection = async () => {
    if (selectedCatalogueIds.size === 0) {
      toast.error('Please select at least one subject');
      return;
    }

    if (selectedCatalogueIds.size > 7) {
      toast.error('You can select up to 7 subjects');
      return;
    }

    setIsSubmitting(true);
    const selectedArray = (catalogueSubjects || [])
      .filter((subject) => selectedCatalogueIds.has(subject.id))
      .map((subject) => subject.id);
    const { successfulIds, failedId: failedSubjectId, error: creationError } =
      await createInitialCatalogueSelections(
        selectedArray,
        (catalogueSubjectId, sortOrder) => addCatalogueSubject.mutateAsync({
          catalogueSubjectId,
          sortOrder,
        }),
      );
    const successCount = successfulIds.length;
    if (failedSubjectId) {
      console.error(`Failed to add subject ${failedSubjectId}:`, creationError);
    }

    if (successCount > 0) {
      await queryClient.refetchQueries({ queryKey: ['subjects', 'user'] });
    }
    setIsSubmitting(false);

    if (successCount > 0 && !failedSubjectId) {
      toast.success(
        `Successfully added ${successCount} subject${successCount > 1 ? 's' : ''}`
      );
      onComplete();
    } else if (successCount > 0) {
      toast.warning(
        `Added ${successCount} subject${successCount > 1 ? 's' : ''}. The remaining selection was not added after an error.`
      );
      onComplete();
    } else {
      toast.error('Failed to add subjects. Please try again.');
    }
  };

  const handleAddCustomSubject = async (values: CustomSubjectFormValues) => {
    setIsSubmitting(true);

    try {
      await addCustomSubject.mutateAsync({
        ...values,
        sortOrder: 0,
      });
      toast.success('Custom subject added successfully');
      onComplete();
    } catch (error) {
      console.error('Failed to add custom subject:', error);
      toast.error('Failed to add custom subject. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryCatalogue = () => void refetchCatalogue();

  if (isLoadingCatalogue) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isCatalogueError) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Unable to Load Subjects</CardTitle>
            <CardDescription>
              We couldn't load the subject catalogue. Please check your internet connection and try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRetryCatalogue} variant="outline">
              <Loader2 className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Select Your Subjects</CardTitle>
          <CardDescription>
            Choose up to 7 subjects from the catalogue or create custom subjects.
            Subjects with existing study data are pre-selected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as 'catalogue' | 'custom')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="catalogue">Catalogue Subjects</TabsTrigger>
              <TabsTrigger value="custom">Custom Subject</TabsTrigger>
            </TabsList>

            <TabsContent value="catalogue" className="mt-4">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search subjects by name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Subject List */}
                <ScrollArea className="h-[300px] rounded-md border">
                  <div className="space-y-2 p-4">
                    {filteredCatalogueSubjects.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        {searchQuery
                          ? 'No subjects found matching your search.'
                          : 'No catalogue subjects available.'}
                      </p>
                    ) : (
                      filteredCatalogueSubjects.map((subject) => (
                        <div
                          key={subject.id}
                          className="flex items-center space-x-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                        >
                          <Checkbox
                            id={subject.id}
                            checked={selectedCatalogueIds.has(subject.id)}
                            onCheckedChange={() => handleToggleCatalogueSubject(subject.id)}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={subject.id}
                              className="cursor-pointer font-medium"
                            >
                              {subject.name}
                            </Label>
                            {subject.code && (
                              <p className="text-xs text-muted-foreground">
                                {subject.code}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Selection Count */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {selectedCatalogueIds.size} / 7 selected
                  </span>
                  {selectedCatalogueIds.size > 7 && (
                    <span className="text-destructive">
                      Maximum 7 subjects allowed
                    </span>
                  )}
                </div>

                {/* Confirm Button */}
                <Button
                  onClick={handleConfirmSelection}
                  disabled={
                    selectedCatalogueIds.size === 0 ||
                    selectedCatalogueIds.size > 7 ||
                    isSubmitting
                  }
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Subjects...
                    </>
                  ) : (
                    'Confirm Selection'
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="mt-4">
              <CustomSubjectForm
                onSubmit={handleAddCustomSubject}
                isSubmitting={isSubmitting}
                onCancel={() => setActiveTab('catalogue')}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
