import { Status } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Circle, CircleDot, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusSelectProps {
  value: Status;
  onChange: (value: Status) => void;
  disabled?: boolean;
}

export const StatusSelect = ({ value, onChange, disabled }: StatusSelectProps) => {
  const getStatusDisplay = (status: Status) => {
    switch (status) {
      case 'Red':
        return { label: 'Red', icon: Circle, className: 'text-status-red' };
      case 'Amber':
        return { label: 'Amber', icon: CircleDot, className: 'text-status-amber' };
      case 'Green':
        return { label: 'Green', icon: CheckCircle2, className: 'text-status-green' };
      default:
        return { label: 'Not Set', icon: Circle, className: 'text-muted-foreground' };
    }
  };

  const currentStatus = getStatusDisplay(value);
  const Icon = currentStatus.icon;

  return (
    <Select
      value={value || 'none'}
      onValueChange={(v) => onChange(v === 'none' ? null : (v as Status))}
      disabled={disabled}
    >
      <SelectTrigger className="w-28 h-8" aria-label="Select status">
        <SelectValue>
          <span className={cn('flex items-center gap-2', currentStatus.className)}>
            <Icon className="h-3.5 w-3.5" />
            <span className="text-xs">{currentStatus.label}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Circle className="h-3.5 w-3.5" />
            Not Set
          </span>
        </SelectItem>
        <SelectItem value="Red">
          <span className="flex items-center gap-2 text-status-red">
            <Circle className="h-3.5 w-3.5 fill-current" />
            Red
          </span>
        </SelectItem>
        <SelectItem value="Amber">
          <span className="flex items-center gap-2 text-status-amber">
            <CircleDot className="h-3.5 w-3.5" />
            Amber
          </span>
        </SelectItem>
        <SelectItem value="Green">
          <span className="flex items-center gap-2 text-status-green">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Green
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
