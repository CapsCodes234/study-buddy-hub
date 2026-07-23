/**
 * SubjectSelectionGate Component
 * 
 * Shown when an authenticated user has zero selected subjects.
 * Provides a generic, catalogue-driven subject selection interface.
 * Pre-checks subjects that have local study data.
 */

import { useState, useMemo } from 'react';
import { useCatalogueSubjects } from '@/features/subjects/useCatalogueSubjects';
import { useSubjectMutations } from '@/features/subjects/useSubjectMutations';
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
import { Loader2, Search, Plus } from 'lucide-react';
import { toast } from 'sonner';

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
  const { data: catalogueSubjects, isLoading: isLoadingCatalogue, isError: isCatalogueError, error: catalogueError } = useCatalogueSubjects();
  const { addCatalogueSubject, addCustomSubject } = useSubjectMutations();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Get pre-selected local UI IDs (e.g., "math", "physics", "it")
  const preSelectedLocalIds = useMemo(() => {
    return new Set(getPreSelectedSubjectIds(bullets, pastPapers));
  }, [bullets, pastPapers]);

  // Map catalogue subjects to their UI IDs and preselect matching ones
  const [selectedCatalogueIds, setSelectedCatalogueIds] = useState<Set<string>>(() => {
    const selected = new Set<string>();
    if (catalogueSubjects) {
      catalogueSubjects.forEach(subject => {
        const uiId = catalogueSlugToUiId(subject.slug);
        if (preSelectedLocalIds.has(uiId)) {
          selected.add(subject.id);
        }
      });
    }
    return selected;
  });

  // Filter catalogue subjects by search
  const filteredCatalogueSubjects = catalogueSubjects?.filter(subject =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.code?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleToggleCatalogueSubject = (catalogueSubjectId: string) => {
    setSelectedCatalogueIds(prev => {
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

    try {
      // Add each selected catalogue subject
      const promises = Array.from(selectedCatalogueIds).map(id =>
        addCatalogueSubject.mutateAsync(id)
      );

      await Promise.all(promises);

      toast.success('Subjects added successfully');
      onComplete();
    } catch (error) {
      console.error('Failed to add subjects:', error);
      toast.error('Failed to add subjects. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomSubject = async (params: {
    name: string;
    code?: string;
    qualificationLabel?: string;
    description?: string;
  }) => {
    setIsSubmitting(true);

    try {
      await addCustomSubject.mutateAsync(params);
      toast.success('Custom subject added successfully');
      setShowCustomForm(false);
      onComplete();
    } catch (error) {
      console.error('Failed to add custom subject:', error);
      toast.error('Failed to add custom subject. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryCatalogue = () => {
    window.location.reload();
  };

  if (isLoadingCatalogue) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isCatalogueError) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
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
    <div className="container max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Select Your Subjects</CardTitle>
          <CardDescription>
            Choose up to 7 subjects from the catalogue or create custom subjects.
            Subjects with existing study data are pre-selected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="catalogue" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="catalogue">Catalogue Subjects</TabsTrigger>
              <TabsTrigger value="custom">Custom Subject</TabsTrigger>
            </TabsList>

            <TabsContent value="catalogue" className="mt-4">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search subjects by name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Subject List */}
                <ScrollArea className="h-[300px] rounded-md border">
                  <div className="p-4 space-y-2">
                    {filteredCatalogueSubjects.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No subjects found matching your search.
                      </p>
                    ) : (
                      filteredCatalogueSubjects.map(subject => (
                        <div
                          key={subject.id}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
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
                  disabled={selectedCatalogueIds.size === 0 || selectedCatalogueIds.size > 7 || isSubmitting}
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
                onCancel={() => setShowCustomForm(false)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Custom Subject Form Component
 */
function CustomSubjectForm({
  onSubmit,
  isSubmitting,
  onCancel,
}: {
  onSubmit: (params: {
    name: string;
    code?: string;
    qualificationLabel?: string;
    description?: string;
  }) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [qualificationLabel, setQualificationLabel] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    onSubmit({
      name: name.trim(),
      code: code.trim() || undefined,
      qualificationLabel: qualificationLabel.trim() || undefined,
      description: description.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="custom-name">Subject Name *</Label>
        <Input
          id="custom-name"
          placeholder="e.g., Computer Science"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-code">Subject Code (optional)</Label>
        <Input
          id="custom-code"
          placeholder="e.g., CS"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-qualification">Qualification (optional)</Label>
        <Input
          id="custom-qualification"
          placeholder="e.g., A-Level, IB"
          value={qualificationLabel}
          onChange={(e) => setQualificationLabel(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-description">Description (optional)</Label>
        <Input
          id="custom-description"
          placeholder="Brief description of the subject"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Subject
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
