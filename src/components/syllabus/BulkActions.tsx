import { Status } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Circle, CircleDot, CheckCircle2, Download, ChevronDown } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  onBulkStatusChange: (status: Status) => void;
  onExportSelected: () => void;
}

export const BulkActions = ({
  selectedCount,
  onBulkStatusChange,
  onExportSelected,
}: BulkActionsProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg animate-fade-in">
      <span className="text-sm font-medium">
        {selectedCount} selected
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            Mark as
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onBulkStatusChange('Red')}>
            <Circle className="h-3.5 w-3.5 mr-2 text-status-red fill-status-red" />
            Red
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onBulkStatusChange('Amber')}>
            <CircleDot className="h-3.5 w-3.5 mr-2 text-status-amber" />
            Amber
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onBulkStatusChange('Green')}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-status-green" />
            Green
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="sm" className="h-8" onClick={onExportSelected}>
        <Download className="h-3.5 w-3.5 mr-1" />
        Export
      </Button>
    </div>
  );
};
