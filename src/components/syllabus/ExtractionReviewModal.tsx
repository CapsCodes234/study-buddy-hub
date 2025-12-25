/**
 * Extraction Review Modal - Review and edit AI-extracted syllabus before saving
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Edit2,
  Trash2,
  Plus,
  Merge,
  Split,
  Sparkles,
  Save,
} from 'lucide-react';
import { ExtractionResult, ExtractedMainTopicItem, ExtractedSubtopicItem, ExtractedComponent, ComponentMarksSuggestion } from '@/types/syllabus';
import { cn } from '@/lib/utils';

interface ExtractionReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extraction: ExtractionResult | null;
  componentSuggestions?: ComponentMarksSuggestion[];
  onAccept: (editedExtraction: ExtractionResult) => void;
  onCancel: () => void;
}

// Confidence badge component
const ConfidenceBadge = ({ confidence }: { confidence: number }) => {
  const level = confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low';
  const colors = {
    high: 'bg-status-green/20 text-status-green border-status-green/30',
    medium: 'bg-status-amber/20 text-status-amber border-status-amber/30',
    low: 'bg-status-red/20 text-status-red border-status-red/30',
  };

  return (
    <Badge variant="outline" className={cn('text-xs', colors[level])}>
      {Math.round(confidence * 100)}%
    </Badge>
  );
};

// Editable bullet item
const EditableBullet = ({
  text,
  confidence,
  onEdit,
  onDelete,
}: {
  text: string;
  confidence: number;
  onEdit: (newText: string) => void;
  onDelete: () => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);

  const handleSave = () => {
    onEdit(editText);
    setIsEditing(false);
  };

  return (
    <div className="flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 group">
      <span className="text-muted-foreground mt-0.5">•</span>
      {isEditing ? (
        <div className="flex-1 flex gap-2">
          <Input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="h-7 text-sm"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button size="sm" variant="ghost" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm">{text}</span>
          <ConfidenceBadge confidence={confidence} />
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

// Editable component
const EditableComponent = ({
  component,
  suggestion,
  onEdit,
  onDelete,
  onApplySuggestion,
}: {
  component: ExtractedComponent;
  suggestion?: ComponentMarksSuggestion;
  onEdit: (updates: Partial<ExtractedComponent>) => void;
  onDelete: () => void;
  onApplySuggestion?: () => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(component.name);
  const [marks, setMarks] = useState(component.totalMarks?.toString() || '');

  const handleSave = () => {
    onEdit({
      name,
      totalMarks: marks ? parseInt(marks) : undefined,
    });
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
      {isEditing ? (
        <>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Component name"
            className="flex-1"
          />
          <Input
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            placeholder="Marks"
            className="w-24"
            type="number"
          />
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </>
      ) : (
        <>
          <div className="flex-1">
            <p className="font-medium">{component.name}</p>
            {component.totalMarks && (
              <p className="text-sm text-muted-foreground">
                {component.totalMarks} marks
              </p>
            )}
          </div>
          <ConfidenceBadge confidence={component.confidence} />
          {suggestion && suggestion.suggestedMarks !== component.totalMarks && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-xs"
              onClick={onApplySuggestion}
            >
              <Sparkles className="h-3 w-3" />
              Suggest: {suggestion.suggestedMarks}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};

export const ExtractionReviewModal = ({
  open,
  onOpenChange,
  extraction,
  componentSuggestions = [],
  onAccept,
  onCancel,
}: ExtractionReviewModalProps) => {
  const [editedExtraction, setEditedExtraction] = useState<ExtractionResult | null>(null);

  // Initialize edited extraction when extraction changes
  useMemo(() => {
    if (extraction) {
      setEditedExtraction({ ...extraction });
    }
  }, [extraction]);

  if (!editedExtraction) return null;

  const updateTopic = (topicIndex: number, updates: Partial<ExtractedMainTopicItem>) => {
    setEditedExtraction((prev) => {
      if (!prev) return prev;
      const newTopics = [...prev.topics];
      newTopics[topicIndex] = { ...newTopics[topicIndex], ...updates };
      return { ...prev, topics: newTopics };
    });
  };

  const updateSubtopic = (
    topicIndex: number,
    subtopicIndex: number,
    updates: Partial<ExtractedSubtopicItem>
  ) => {
    setEditedExtraction((prev) => {
      if (!prev) return prev;
      const newTopics = [...prev.topics];
      const newSubtopics = [...newTopics[topicIndex].subtopics];
      newSubtopics[subtopicIndex] = { ...newSubtopics[subtopicIndex], ...updates };
      newTopics[topicIndex] = { ...newTopics[topicIndex], subtopics: newSubtopics };
      return { ...prev, topics: newTopics };
    });
  };

  const updateBullet = (
    topicIndex: number,
    subtopicIndex: number,
    bulletIndex: number,
    newText: string
  ) => {
    setEditedExtraction((prev) => {
      if (!prev) return prev;
      const newTopics = [...prev.topics];
      const newSubtopics = [...newTopics[topicIndex].subtopics];
      const newBullets = [...newSubtopics[subtopicIndex].bullets];
      newBullets[bulletIndex] = { ...newBullets[bulletIndex], text: newText };
      newSubtopics[subtopicIndex] = { ...newSubtopics[subtopicIndex], bullets: newBullets };
      newTopics[topicIndex] = { ...newTopics[topicIndex], subtopics: newSubtopics };
      return { ...prev, topics: newTopics };
    });
  };

  const deleteBullet = (topicIndex: number, subtopicIndex: number, bulletIndex: number) => {
    setEditedExtraction((prev) => {
      if (!prev) return prev;
      const newTopics = [...prev.topics];
      const newSubtopics = [...newTopics[topicIndex].subtopics];
      const newBullets = newSubtopics[subtopicIndex].bullets.filter((_, i) => i !== bulletIndex);
      newSubtopics[subtopicIndex] = { ...newSubtopics[subtopicIndex], bullets: newBullets };
      newTopics[topicIndex] = { ...newTopics[topicIndex], subtopics: newSubtopics };
      return { ...prev, topics: newTopics };
    });
  };

  const deleteSubtopic = (topicIndex: number, subtopicIndex: number) => {
    setEditedExtraction((prev) => {
      if (!prev) return prev;
      const newTopics = [...prev.topics];
      const newSubtopics = newTopics[topicIndex].subtopics.filter((_, i) => i !== subtopicIndex);
      newTopics[topicIndex] = { ...newTopics[topicIndex], subtopics: newSubtopics };
      return { ...prev, topics: newTopics };
    });
  };

  const deleteTopic = (topicIndex: number) => {
    setEditedExtraction((prev) => {
      if (!prev) return prev;
      return { ...prev, topics: prev.topics.filter((_, i) => i !== topicIndex) };
    });
  };

  const updateComponent = (index: number, updates: Partial<ExtractedComponent>) => {
    setEditedExtraction((prev) => {
      if (!prev) return prev;
      const newComponents = [...prev.components];
      newComponents[index] = { ...newComponents[index], ...updates };
      return { ...prev, components: newComponents };
    });
  };

  const deleteComponent = (index: number) => {
    setEditedExtraction((prev) => {
      if (!prev) return prev;
      return { ...prev, components: prev.components.filter((_, i) => i !== index) };
    });
  };

  const addComponent = () => {
    setEditedExtraction((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        components: [
          ...prev.components,
          { name: 'New Component', totalMarks: 100, confidence: 1 },
        ],
      };
    });
  };

  const applyAllSuggestions = () => {
    setEditedExtraction((prev) => {
      if (!prev) return prev;
      const newComponents = prev.components.map((comp) => {
        const suggestion = componentSuggestions.find(
          (s) => s.componentName.toLowerCase() === comp.name.toLowerCase()
        );
        if (suggestion && suggestion.suggestedMarks) {
          return { ...comp, totalMarks: suggestion.suggestedMarks };
        }
        return comp;
      });
      return { ...prev, components: newComponents };
    });
  };

  const totalBullets = editedExtraction.topics.reduce(
    (sum, t) => sum + t.subtopics.reduce((s, st) => s + st.bullets.length, 0),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 z-10 bg-background pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Review Extracted Syllabus for {editedExtraction.subject}
          </DialogTitle>
          <DialogDescription>
            Edit or accept the extracted content. Changes are only saved when you click Accept.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Overall Confidence:</span>
            <ConfidenceBadge confidence={editedExtraction.confidence.overall} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Topics:</span>
            <Badge variant="secondary">{editedExtraction.topics.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Bullets:</span>
            <Badge variant="secondary">{totalBullets}</Badge>
          </div>
        </div>

        <div className="space-y-6 py-4 pb-24">
            {/* Subject name editing */}
            <div>
              <Label>Subject Name</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={editedExtraction.subject}
                  onChange={(e) =>
                    setEditedExtraction((prev) =>
                      prev ? { ...prev, subject: e.target.value } : prev
                    )
                  }
                  className="max-w-xs"
                />
                <ConfidenceBadge confidence={editedExtraction.subjectConfidence} />
              </div>
            </div>

            <Separator />

            {/* Components section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base">Components & Marks</Label>
                <div className="flex gap-2">
                  {componentSuggestions.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={applyAllSuggestions}
                      className="gap-1"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Apply All Suggestions
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={addComponent}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Component
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {editedExtraction.components.map((component, index) => (
                  <EditableComponent
                    key={index}
                    component={component}
                    suggestion={componentSuggestions.find(
                      (s) => s.componentName.toLowerCase() === component.name.toLowerCase()
                    )}
                    onEdit={(updates) => updateComponent(index, updates)}
                    onDelete={() => deleteComponent(index)}
                    onApplySuggestion={() => {
                      const suggestion = componentSuggestions.find(
                        (s) => s.componentName.toLowerCase() === component.name.toLowerCase()
                      );
                      if (suggestion) {
                        updateComponent(index, { totalMarks: suggestion.suggestedMarks });
                      }
                    }}
                  />
                ))}
                {editedExtraction.components.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No components detected. Add components manually or they will be created with defaults.
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Topics section */}
            <div>
              <Label className="text-base mb-3 block">Topics & Content</Label>
              <Accordion type="multiple" className="space-y-2">
                {editedExtraction.topics.map((topic, topicIndex) => (
                  <AccordionItem
                    key={topicIndex}
                    value={`topic-${topicIndex}`}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="font-medium">{topic.name}</span>
                        <ConfidenceBadge confidence={topic.confidence} />
                        <Badge variant="outline" className="ml-auto mr-2">
                          {topic.subtopics.length} subtopics
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <div className="space-y-3">
                        {topic.subtopics.map((subtopic, subtopicIndex) => (
                          <Collapsible key={subtopicIndex} defaultOpen>
                            <div className="border-l-2 border-border pl-4">
                              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-1 hover:bg-muted/30 rounded px-2 -ml-2">
                                <ChevronDown className="h-4 w-4 transition-transform" />
                                <span className="text-sm font-medium flex-1">
                                  {subtopic.name}
                                </span>
                                <ConfidenceBadge confidence={subtopic.confidence} />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-destructive opacity-50 hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSubtopic(topicIndex, subtopicIndex);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pl-6 mt-1">
                                {subtopic.bullets.map((bullet, bulletIndex) => (
                                  <EditableBullet
                                    key={bulletIndex}
                                    text={bullet.text}
                                    confidence={bullet.confidence}
                                    onEdit={(newText) =>
                                      updateBullet(topicIndex, subtopicIndex, bulletIndex, newText)
                                    }
                                    onDelete={() =>
                                      deleteBullet(topicIndex, subtopicIndex, bulletIndex)
                                    }
                                  />
                                ))}
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        ))}
                      </div>
                      <div className="flex justify-end mt-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteTopic(topicIndex)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete Topic
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
        </div>

        <DialogFooter className="sticky bottom-0 z-10 bg-background pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onAccept(editedExtraction)} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Accept & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
