import { memo, useMemo, useState, useCallback } from 'react';
import { Bullet, Subject, Status } from '@/types';
import { StatusSelect } from './StatusSelect';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBulletScore } from '@/lib/progress';

interface CollapsibleSyllabusProps {
  bullets: Bullet[];
  subjects: Subject[];
  highlightId?: string;
  onUpdateBullet: (id: string, updates: Partial<Bullet>) => void;
  onDeleteBullet: (id: string) => void;
  onQuickStatus: (id: string, status: Status) => void;
}

interface GroupedTopic {
  name: string;
  subtopics: {
    name: string;
    bullets: Bullet[];
  }[];
  totalBullets: number;
  progress: number;
}

interface SubjectGroup {
  subject: Subject;
  mainTopics: GroupedTopic[];
  totalBullets: number;
  progress: number;
}

// Inline bullet editor component
const BulletItem = memo(({ 
  bullet, 
  highlighted,
  onUpdate, 
  onDelete,
  onQuickStatus,
}: { 
  bullet: Bullet; 
  highlighted: boolean;
  onUpdate: (id: string, updates: Partial<Bullet>) => void;
  onDelete: (id: string) => void;
  onQuickStatus: (id: string, status: Status) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState(bullet.comment);
  
  const handleCommentSave = () => {
    onUpdate(bullet.id, { comment });
    setIsEditing(false);
  };
  
  return (
    <div 
      className={cn(
        'group flex items-start gap-2 p-2 rounded-md transition-colors',
        bullet.done && 'bg-status-done-bg/30 opacity-70',
        highlighted && 'bg-primary/10 ring-2 ring-primary/30',
        !bullet.done && !highlighted && 'hover:bg-muted/50'
      )}
      id={`bullet-${bullet.id}`}
    >
      {/* Done checkbox */}
      <Checkbox
        checked={bullet.done}
        onCheckedChange={(checked) => onUpdate(bullet.id, { done: !!checked })}
        className="mt-1 shrink-0"
        aria-label={`Mark ${bullet.bulletText} as done`}
      />
      
      {/* Bullet text */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm',
          bullet.done && 'line-through text-muted-foreground'
        )}>
          {bullet.bulletText}
        </p>
        
        {/* Comment section */}
        {isEditing ? (
          <div className="mt-1 flex items-center gap-1">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onBlur={handleCommentSave}
              onKeyDown={(e) => e.key === 'Enter' && handleCommentSave()}
              className="h-7 text-xs"
              placeholder="Add a note..."
              autoFocus
            />
          </div>
        ) : bullet.comment ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-muted-foreground mt-1 flex items-center gap-1 hover:text-foreground"
          >
            <MessageSquare className="h-3 w-3" />
            {bullet.comment}
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 flex items-center gap-1 hover:text-foreground transition-opacity"
          >
            <MessageSquare className="h-3 w-3" />
            Add note
          </button>
        )}
      </div>
      
      {/* Quick status buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onQuickStatus(bullet.id, 'Red')}
          disabled={bullet.done}
          className={cn(
            'w-6 h-6 rounded-full border-2 transition-all',
            bullet.status === 'Red' ? 'bg-status-red border-status-red scale-110' : 'border-status-red/50 hover:border-status-red hover:bg-status-red/20',
            bullet.done && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Mark as Red"
          title="Red - Need to learn (Press R)"
        />
        <button
          onClick={() => onQuickStatus(bullet.id, 'Amber')}
          disabled={bullet.done}
          className={cn(
            'w-6 h-6 rounded-full border-2 transition-all',
            bullet.status === 'Amber' ? 'bg-status-amber border-status-amber scale-110' : 'border-status-amber/50 hover:border-status-amber hover:bg-status-amber/20',
            bullet.done && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Mark as Amber"
          title="Amber - Partially understand (Press A)"
        />
        <button
          onClick={() => onQuickStatus(bullet.id, 'Green')}
          disabled={bullet.done}
          className={cn(
            'w-6 h-6 rounded-full border-2 transition-all',
            bullet.status === 'Green' ? 'bg-status-green border-status-green scale-110' : 'border-status-green/50 hover:border-status-green hover:bg-status-green/20',
            bullet.done && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Mark as Green"
          title="Green - Confident (Press G)"
        />
        
        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(bullet.id)}
          aria-label="Delete bullet"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
});

BulletItem.displayName = 'BulletItem';

// Subtopic section
const SubtopicSection = memo(({ 
  name, 
  bullets, 
  highlightId,
  onUpdate, 
  onDelete,
  onQuickStatus,
  defaultOpen = true,
}: {
  name: string;
  bullets: Bullet[];
  highlightId?: string;
  onUpdate: (id: string, updates: Partial<Bullet>) => void;
  onDelete: (id: string) => void;
  onQuickStatus: (id: string, status: Status) => void;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const progress = useMemo(() => {
    if (bullets.length === 0) return 0;
    return bullets.reduce((sum, b) => sum + getBulletScore(b), 0) / bullets.length;
  }, [bullets]);
  
  const statusCounts = useMemo(() => ({
    red: bullets.filter(b => b.status === 'Red' && !b.done).length,
    amber: bullets.filter(b => b.status === 'Amber' && !b.done).length,
    green: bullets.filter(b => b.status === 'Green' || b.done).length,
  }), [bullets]);
  
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="pl-4 border-l-2 border-border">
      <CollapsibleTrigger className="flex items-center gap-2 py-1 w-full text-left hover:bg-muted/30 rounded px-2 -ml-2">
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="text-sm font-medium flex-1">{name}</span>
        <div className="flex items-center gap-1">
          {statusCounts.red > 0 && (
            <Badge variant="outline" className="text-xs py-0 h-5 border-status-red/50 text-status-red">
              {statusCounts.red}
            </Badge>
          )}
          {statusCounts.amber > 0 && (
            <Badge variant="outline" className="text-xs py-0 h-5 border-status-amber/50 text-status-amber">
              {statusCounts.amber}
            </Badge>
          )}
          {statusCounts.green > 0 && (
            <Badge variant="outline" className="text-xs py-0 h-5 border-status-green/50 text-status-green">
              {statusCounts.green}
            </Badge>
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-2 mt-1 space-y-1">
        {bullets.map(bullet => (
          <BulletItem
            key={bullet.id}
            bullet={bullet}
            highlighted={bullet.id === highlightId}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onQuickStatus={onQuickStatus}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
});

SubtopicSection.displayName = 'SubtopicSection';

// Main topic section
const MainTopicSection = memo(({ 
  topic, 
  highlightId,
  onUpdate, 
  onDelete,
  onQuickStatus,
  defaultOpen = true,
}: {
  topic: GroupedTopic;
  highlightId?: string;
  onUpdate: (id: string, updates: Partial<Bullet>) => void;
  onDelete: (id: string) => void;
  onQuickStatus: (id: string, status: Status) => void;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border border-border rounded-lg">
      <CollapsibleTrigger className="flex items-center gap-3 p-3 w-full text-left hover:bg-muted/30 rounded-t-lg">
        {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        <div className="flex-1">
          <span className="font-medium">{topic.name}</span>
          <span className="text-sm text-muted-foreground ml-2">
            ({topic.totalBullets} items)
          </span>
        </div>
        <div className="flex items-center gap-3 w-32">
          <Progress value={topic.progress * 100} className="h-2" />
          <span className="text-sm font-medium w-10 text-right">
            {Math.round(topic.progress * 100)}%
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-3 pt-0 space-y-3">
        {topic.subtopics.map(subtopic => (
          <SubtopicSection
            key={subtopic.name}
            name={subtopic.name}
            bullets={subtopic.bullets}
            highlightId={highlightId}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onQuickStatus={onQuickStatus}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
});

MainTopicSection.displayName = 'MainTopicSection';

// Subject section with all topics
const SubjectSection = memo(({ 
  group, 
  highlightId,
  onUpdate, 
  onDelete,
  onQuickStatus,
  defaultOpen = true,
}: {
  group: SubjectGroup;
  highlightId?: string;
  onUpdate: (id: string, updates: Partial<Bullet>) => void;
  onDelete: (id: string) => void;
  onQuickStatus: (id: string, status: Status) => void;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-2">
      <CollapsibleTrigger className="flex items-center gap-3 p-4 w-full text-left bg-card border border-border rounded-xl hover:shadow-md transition-shadow">
        {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        <div
          className="w-4 h-4 rounded-full shrink-0"
          style={{ backgroundColor: group.subject.color }}
        />
        <div className="flex-1">
          <span className="text-lg font-semibold">{group.subject.name}</span>
          <span className="text-sm text-muted-foreground ml-2">
            ({group.totalBullets} topics • {group.mainTopics.length} sections)
          </span>
        </div>
        <div className="flex items-center gap-3 w-36">
          <Progress value={group.progress * 100} className="h-2.5" />
          <span className="text-sm font-bold w-12 text-right">
            {Math.round(group.progress * 100)}%
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4 space-y-2">
        {group.mainTopics.map(topic => (
          <MainTopicSection
            key={topic.name}
            topic={topic}
            highlightId={highlightId}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onQuickStatus={onQuickStatus}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
});

SubjectSection.displayName = 'SubjectSection';

export const CollapsibleSyllabus = memo(({
  bullets,
  subjects,
  highlightId,
  onUpdateBullet,
  onDeleteBullet,
  onQuickStatus,
}: CollapsibleSyllabusProps) => {
  // Group bullets by subject -> mainTopic -> subtopic
  const groupedData = useMemo((): SubjectGroup[] => {
    return subjects.map(subject => {
      const subjectBullets = bullets.filter(b => b.subjectId === subject.id);
      
      // Group by main topic
      const mainTopicMap = new Map<string, Map<string, Bullet[]>>();
      subjectBullets.forEach(bullet => {
        if (!mainTopicMap.has(bullet.mainTopic)) {
          mainTopicMap.set(bullet.mainTopic, new Map());
        }
        const subtopicMap = mainTopicMap.get(bullet.mainTopic)!;
        if (!subtopicMap.has(bullet.subtopic)) {
          subtopicMap.set(bullet.subtopic, []);
        }
        subtopicMap.get(bullet.subtopic)!.push(bullet);
      });
      
      const mainTopics: GroupedTopic[] = Array.from(mainTopicMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, subtopicMap]) => {
          const subtopics = Array.from(subtopicMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([subName, subBullets]) => ({
              name: subName,
              bullets: subBullets,
            }));
          
          const allBullets = subtopics.flatMap(s => s.bullets);
          const totalBullets = allBullets.length;
          const progress = totalBullets > 0 
            ? allBullets.reduce((sum, b) => sum + getBulletScore(b), 0) / totalBullets
            : 0;
          
          return {
            name,
            subtopics,
            totalBullets,
            progress,
          };
        });
      
      const totalBullets = subjectBullets.length;
      const progress = totalBullets > 0
        ? subjectBullets.reduce((sum, b) => sum + getBulletScore(b), 0) / totalBullets
        : 0;
      
      return {
        subject,
        mainTopics,
        totalBullets,
        progress,
      };
    }).filter(g => g.totalBullets > 0);
  }, [bullets, subjects]);
  
  if (groupedData.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      {groupedData.map(group => (
        <SubjectSection
          key={group.subject.id}
          group={group}
          highlightId={highlightId}
          onUpdate={onUpdateBullet}
          onDelete={onDeleteBullet}
          onQuickStatus={onQuickStatus}
        />
      ))}
    </div>
  );
});

CollapsibleSyllabus.displayName = 'CollapsibleSyllabus';
