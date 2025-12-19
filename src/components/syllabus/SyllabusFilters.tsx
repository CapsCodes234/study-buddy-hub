import { BulletFilters, Subject, Status } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, Filter, X } from 'lucide-react';

interface SyllabusFiltersProps {
  filters: BulletFilters;
  subjects: Subject[];
  onFiltersChange: (filters: BulletFilters) => void;
}

export const SyllabusFilters = ({
  filters,
  subjects,
  onFiltersChange,
}: SyllabusFiltersProps) => {
  const hasActiveFilters =
    filters.subjectId !== null ||
    filters.searchText !== '' ||
    filters.statusFilter !== 'all' ||
    filters.hideCompleted;

  const clearFilters = () => {
    onFiltersChange({
      subjectId: null,
      searchText: '',
      statusFilter: 'all',
      hideCompleted: false,
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters</span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search topics..."
            value={filters.searchText}
            onChange={(e) =>
              onFiltersChange({ ...filters, searchText: e.target.value })
            }
            className="pl-9 h-9"
          />
        </div>

        {/* Subject filter */}
        <Select
          value={filters.subjectId || 'all'}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, subjectId: v === 'all' ? null : v })
          }
        >
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  {subject.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={filters.statusFilter || 'all'}
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              statusFilter: v === 'all' ? 'all' : (v as Status),
            })
          }
        >
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Red">
              <span className="text-status-red">Red Only</span>
            </SelectItem>
            <SelectItem value="Amber">
              <span className="text-status-amber">Amber Only</span>
            </SelectItem>
            <SelectItem value="Green">
              <span className="text-status-green">Green Only</span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Hide completed toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id="hide-completed"
            checked={filters.hideCompleted}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, hideCompleted: checked })
            }
          />
          <Label htmlFor="hide-completed" className="text-sm cursor-pointer">
            Hide completed
          </Label>
        </div>
      </div>
    </div>
  );
};
