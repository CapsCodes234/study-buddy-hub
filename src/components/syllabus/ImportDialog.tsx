import { useState, useCallback } from 'react';
import { Subject, Bullet } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { importBulletsFromCSV } from '@/lib/storage';
import { Upload, FileText, Wand2 } from 'lucide-react';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  onImport: (bullets: Omit<Bullet, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  aiEnabled: boolean;
}

export const ImportDialog = ({
  open,
  onOpenChange,
  subjects,
  onImport,
  aiEnabled,
}: ImportDialogProps) => {
  const [csvContent, setCsvContent] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvContent(event.target?.result as string);
      };
      reader.readAsText(file);
    } else if (file.type === 'application/pdf') {
      if (useAI && aiEnabled) {
        // AI extraction would be handled here
        toast({
          title: 'AI Extraction',
          description: 'AI extraction is not yet connected. Please use CSV import.',
        });
      } else {
        toast({
          title: 'PDF Support',
          description: 'Enable AI extraction or convert your PDF to CSV format.',
        });
      }
    }
  }, [useAI, aiEnabled, toast]);

  const handleImport = () => {
    if (!csvContent.trim()) {
      toast({
        title: 'No data',
        description: 'Please paste or upload CSV data first.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const bullets = importBulletsFromCSV(csvContent, subjects);
      
      if (bullets.length === 0) {
        toast({
          title: 'No valid data',
          description: 'Could not parse any bullet points. Check your CSV format.',
          variant: 'destructive',
        });
        return;
      }

      onImport(bullets);
      toast({
        title: 'Import successful',
        description: `Imported ${bullets.length} bullet points.`,
      });
      setCsvContent('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Import failed',
        description: 'There was an error parsing your CSV.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Syllabus Data</DialogTitle>
          <DialogDescription>
            Upload a CSV file or paste data directly. CSV should have columns:
            Subject, Main Topic, Subtopic, Bullet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* AI Toggle (disabled by default) */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Wand2 className="h-5 w-5 text-accent" />
              <div>
                <Label htmlFor="ai-toggle" className="font-medium">
                  Use AI Extraction
                </Label>
                <p className="text-xs text-muted-foreground">
                  {aiEnabled
                    ? 'Extract topics from PDF automatically'
                    : 'Enable in settings to use AI extraction'}
                </p>
              </div>
            </div>
            <Switch
              id="ai-toggle"
              checked={useAI}
              onCheckedChange={setUseAI}
              disabled={!aiEnabled}
            />
          </div>

          {/* File upload */}
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              type="file"
              id="file-upload"
              accept=".csv,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center gap-2 cursor-pointer"
            >
              <div className="p-3 bg-muted rounded-full">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium">
                Click to upload or drag and drop
              </span>
              <span className="text-xs text-muted-foreground">
                CSV (max 10MB) {useAI && '• PDF with AI extraction'}
              </span>
            </label>
          </div>

          {/* Or paste directly */}
          <div className="space-y-2">
            <Label htmlFor="csv-content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Or paste CSV content
            </Label>
            <Textarea
              id="csv-content"
              placeholder="Subject,Main Topic,Subtopic,Bullet&#10;Mathematics,Algebra,Quadratics,Factorising quadratics"
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isProcessing || !csvContent.trim()}>
            {isProcessing ? 'Processing...' : 'Import Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
