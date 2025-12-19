import { useState } from 'react';
import { Bullet, Subject } from '@/types';
import { StatusSelect } from './StatusSelect';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Trash2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulletRowProps {
  bullet: Bullet;
  subject: Subject | undefined;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onUpdate: (id: string, updates: Partial<Bullet>) => void;
  onDelete: (id: string) => void;
}

export const BulletRow = ({
  bullet,
  subject,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: BulletRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState(bullet.comment);

  const handleCommentSave = () => {
    onUpdate(bullet.id, { comment });
    setIsEditing(false);
  };

  return (
    <TableRow
      className={cn(
        'group transition-colors',
        bullet.done && 'bg-status-done-bg/50',
        isSelected && 'bg-accent/10'
      )}
    >
      <TableCell className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(bullet.id, !!checked)}
          aria-label={`Select ${bullet.bulletText}`}
        />
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {subject && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: subject.color }}
            />
          )}
          <span className="text-sm">{subject?.name || bullet.subjectId}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{bullet.mainTopic}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{bullet.subtopic}</TableCell>
      <TableCell className="max-w-xs">
        <span className="text-sm line-clamp-2">{bullet.bulletText}</span>
      </TableCell>
      <TableCell>
        <StatusSelect
          value={bullet.status}
          onChange={(status) => onUpdate(bullet.id, { status })}
          disabled={bullet.done}
        />
      </TableCell>
      <TableCell className="max-w-32">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onBlur={handleCommentSave}
              onKeyDown={(e) => e.key === 'Enter' && handleCommentSave()}
              className="h-7 text-xs"
              autoFocus
            />
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Edit comment"
          >
            {bullet.comment ? (
              <span className="line-clamp-1">{bullet.comment}</span>
            ) : (
              <>
                <MessageSquare className="h-3 w-3" />
                <span className="opacity-0 group-hover:opacity-100">Add note</span>
              </>
            )}
          </button>
        )}
      </TableCell>
      <TableCell className="w-10 text-center">
        <Checkbox
          checked={bullet.done}
          onCheckedChange={(checked) => onUpdate(bullet.id, { done: !!checked })}
          aria-label={`Mark ${bullet.bulletText} as done`}
        />
      </TableCell>
      <TableCell className="w-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(bullet.id)}
          aria-label="Delete bullet"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
