/**
 * CatalogueSubjectPicker Component
 * 
 * Generic, data-driven catalogue subject selector.
 * Supports search, multi-select, and pre-selection based on local data.
 */

import { useState } from 'react';
import type { Database } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

type CatalogueSubject = Database['public']['Tables']['catalogue_subjects']['Row'];

interface CatalogueSubjectPickerProps {
  catalogueSubjects: CatalogueSubject[];
  selectedIds: Set<string>;
  onToggle: (catalogueSubjectId: string) => void;
  maxSelections?: number;
}

export function CatalogueSubjectPicker({
  catalogueSubjects,
  selectedIds,
  onToggle,
  maxSelections = 7,
}: CatalogueSubjectPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter catalogue subjects by search
  const filteredSubjects = catalogueSubjects.filter(subject =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canSelectMore = selectedIds.size < maxSelections;

  return (
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
          {filteredSubjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No subjects found matching your search.
            </p>
          ) : (
            filteredSubjects.map(subject => {
              const isSelected = selectedIds.has(subject.id);
              const isDisabled = !canSelectMore && !isSelected;

              return (
                <div
                  key={subject.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-muted/50 cursor-pointer'
                  }`}
                  onClick={() => !isDisabled && onToggle(subject.id)}
                >
                  <Checkbox
                    id={subject.id}
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={() => !isDisabled && onToggle(subject.id)}
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
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Selection Count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {selectedIds.size} / {maxSelections} selected
        </span>
        {selectedIds.size > maxSelections && (
          <span className="text-destructive">
            Maximum {maxSelections} subjects allowed
          </span>
        )}
      </div>
    </div>
  );
}
