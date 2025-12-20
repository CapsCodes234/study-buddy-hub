import { useState, useMemo, useCallback, useEffect } from 'react';
import { Bullet, Subject, BulletFilters, Status } from '@/types';
import { SyllabusFilters } from './SyllabusFilters';
import { BulletRow } from './BulletRow';
import { BulkActions } from './BulkActions';
import { ImportDialog } from './ImportDialog';
import { CollapsibleSyllabus } from './CollapsibleSyllabus';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { exportBulletsAsCSV } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { Download, Upload, BookOpen, ArrowUpDown, LayoutList, FolderTree, Keyboard } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SyllabusTableProps {
  bullets: Bullet[];
  subjects: Subject[];
  aiEnabled: boolean;
  initialFilters?: BulletFilters;
  highlightId?: string;
  onUpdateBullet: (id: string, updates: Partial<Bullet>) => void;
  onDeleteBullet: (id: string) => void;
  onBulkUpdate: (ids: string[], updates: Partial<Bullet>) => void;
  onImport: (bullets: Omit<Bullet, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

type SortField = 'subject' | 'status' | 'mainTopic';
type SortDirection = 'asc' | 'desc';

export const SyllabusTable = ({
  bullets,
  subjects,
  aiEnabled,
  initialFilters,
  highlightId,
  onUpdateBullet,
  onDeleteBullet,
  onBulkUpdate,
  onImport,
}: SyllabusTableProps) => {
  const [filters, setFilters] = useState<BulletFilters>(initialFilters || {
    subjectId: null,
    searchText: '',
    statusFilter: 'all',
    hideCompleted: false,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Update filters when initialFilters change (from navigation)
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);
  
  const [viewMode, setViewMode] = useState<'table' | 'grouped'>('table');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [focusedBulletId, setFocusedBulletId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Keyboard shortcuts for quick status changes
  const handleQuickStatus = useCallback((id: string, status: Status) => {
    onUpdateBullet(id, { status });
  }, [onUpdateBullet]);
  
  useKeyboardShortcuts({
    enabled: viewMode === 'grouped' && focusedBulletId !== null,
    onStatusChange: (status) => {
      if (focusedBulletId) {
        handleQuickStatus(focusedBulletId, status);
      }
    },
    onToggleDone: () => {
      if (focusedBulletId) {
        const bullet = bullets.find(b => b.id === focusedBulletId);
        if (bullet) {
          onUpdateBullet(focusedBulletId, { done: !bullet.done });
        }
      }
    },
  });
  // Filter bullets
  const filteredBullets = useMemo(() => {
    return bullets.filter((bullet) => {
      // Subject filter
      if (filters.subjectId && bullet.subjectId !== filters.subjectId) {
        return false;
      }

      // Status filter
      if (filters.statusFilter !== 'all') {
        if (bullet.status !== filters.statusFilter) {
          return false;
        }
      }

      // Hide completed
      if (filters.hideCompleted && bullet.done) {
        return false;
      }

      // Search text
      if (filters.searchText) {
        const search = filters.searchText.toLowerCase();
        const searchableText = `${bullet.mainTopic} ${bullet.subtopic} ${bullet.bulletText}`.toLowerCase();
        if (!searchableText.includes(search)) {
          return false;
        }
      }

      return true;
    });
  }, [bullets, filters]);

  // Sort bullets (Red first by default)
  const sortedBullets = useMemo(() => {
    const statusOrder = { Red: 0, Amber: 1, Green: 2, null: 3 };
    
    return [...filteredBullets].sort((a, b) => {
      if (sortField === 'status') {
        const aOrder = a.done ? 4 : statusOrder[a.status ?? 'null'];
        const bOrder = b.done ? 4 : statusOrder[b.status ?? 'null'];
        return sortDirection === 'asc' ? aOrder - bOrder : bOrder - aOrder;
      }
      
      if (sortField === 'subject') {
        const aSubject = subjects.find(s => s.id === a.subjectId)?.name || '';
        const bSubject = subjects.find(s => s.id === b.subjectId)?.name || '';
        return sortDirection === 'asc'
          ? aSubject.localeCompare(bSubject)
          : bSubject.localeCompare(aSubject);
      }
      
      if (sortField === 'mainTopic') {
        return sortDirection === 'asc'
          ? a.mainTopic.localeCompare(b.mainTopic)
          : b.mainTopic.localeCompare(a.mainTopic);
      }
      
      return 0;
    });
  }, [filteredBullets, sortField, sortDirection, subjects]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(sortedBullets.map(b => b.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [sortedBullets]);

  const handleSelectOne = useCallback((id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleBulkStatusChange = (status: Status) => {
    onBulkUpdate(Array.from(selectedIds), { status });
    setSelectedIds(new Set());
    toast({
      title: 'Updated',
      description: `${selectedIds.size} items marked as ${status}`,
    });
  };

  const handleExport = (onlySelected: boolean) => {
    const bulletsToExport = onlySelected
      ? bullets.filter(b => selectedIds.has(b.id))
      : filteredBullets;
    
    const csv = exportBulletsAsCSV(bulletsToExport, subjects);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syllabus-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Exported',
      description: `${bulletsToExport.length} items exported to CSV`,
    });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const allSelected = sortedBullets.length > 0 && selectedIds.size === sortedBullets.length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Syllabus Tracker</h2>
          <span className="text-sm text-muted-foreground">
            ({filteredBullets.length} of {bullets.length} items)
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'grouped')}>
            <TabsList className="h-8">
              <TabsTrigger value="table" className="h-7 px-2">
                <LayoutList className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="grouped" className="h-7 px-2">
                <FolderTree className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Keyboard shortcuts hint */}
          {viewMode === 'grouped' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="gap-1 cursor-help">
                    <Keyboard className="h-3 w-3" />
                    Shortcuts
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1 text-xs">
                    {KEYBOARD_SHORTCUTS.map((s) => (
                      <div key={s.key} className="flex justify-between gap-4">
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">{s.key}</kbd>
                        <span>{s.description}</span>
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button variant="outline" size="sm" onClick={() => handleExport(false)}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button size="sm" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
        </div>
      </div>

      <SyllabusFilters
        filters={filters}
        subjects={subjects}
        onFiltersChange={setFilters}
      />

      {viewMode === 'table' && (
        <BulkActions
          selectedCount={selectedIds.size}
          onBulkStatusChange={handleBulkStatusChange}
          onExportSelected={() => handleExport(true)}
        />
      )}

      {/* Grouped/Collapsible View */}
      {viewMode === 'grouped' && filteredBullets.length > 0 && (
        <CollapsibleSyllabus
          bullets={filteredBullets}
          subjects={subjects}
          highlightId={highlightId}
          onUpdateBullet={onUpdateBullet}
          onDeleteBullet={onDeleteBullet}
          onQuickStatus={handleQuickStatus}
        />
      )}

      {/* Table View */}
      {viewMode === 'table' && sortedBullets.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={bullets.length === 0 ? 'No Syllabus Data' : 'No Matching Items'}
          description={
            bullets.length === 0
              ? 'No syllabus data yet. Import a CSV or enable AI extraction.'
              : 'No items match your current filters. Try adjusting your search or filter criteria.'
          }
          action={
            bullets.length === 0
              ? {
                  label: 'Import Data',
                  onClick: () => setImportDialogOpen(true),
                }
              : undefined
          }
        />
      ) : viewMode === 'table' && sortedBullets.length > 0 ? (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('subject')}>
                    <span className="flex items-center gap-1">
                      Subject
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('mainTopic')}>
                    <span className="flex items-center gap-1">
                      Main Topic
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                  <TableHead>Subtopic</TableHead>
                  <TableHead>Bullet</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('status')}>
                    <span className="flex items-center gap-1">
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead className="w-10 text-center">Done</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBullets.map((bullet) => (
                  <BulletRow
                    key={bullet.id}
                    bullet={bullet}
                    subject={subjects.find(s => s.id === bullet.subjectId)}
                    isSelected={selectedIds.has(bullet.id)}
                    onSelect={handleSelectOne}
                    onUpdate={onUpdateBullet}
                    onDelete={onDeleteBullet}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      {/* Empty state for grouped view */}
      {viewMode === 'grouped' && filteredBullets.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title={bullets.length === 0 ? 'No Syllabus Data' : 'No Matching Items'}
          description={
            bullets.length === 0
              ? 'No syllabus data yet. Import a CSV or enable AI extraction.'
              : 'No items match your current filters. Try adjusting your search or filter criteria.'
          }
          action={
            bullets.length === 0
              ? {
                  label: 'Import Data',
                  onClick: () => setImportDialogOpen(true),
                }
              : undefined
          }
        />
      )}

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        subjects={subjects}
        onImport={onImport}
        aiEnabled={aiEnabled}
      />
    </div>
  );
};
