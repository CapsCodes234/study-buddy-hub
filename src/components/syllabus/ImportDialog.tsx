import { useState, useCallback } from 'react';
import { Subject, Bullet, ExtractedSyllabus } from '@/types';
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
import { extractTextFromPDF } from '@/lib/pdfExtractor';
import { getAIProvider } from '@/ai/aiClient';
import { generateSyllabusExtractionPrompt, SYLLABUS_EXTRACTION_SYSTEM_PROMPT } from '@/ai/prompts';
import { parseAIResponse } from '@/ai/aiClient';
import { Upload, FileText, Wand2, Loader2 } from 'lucide-react';

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
  const [isExtractingPDF, setIsExtractingPDF] = useState(false);
  const { toast } = useToast();

  // Convert extracted syllabus to bullets format
  const convertExtractedSyllabusToBullets = useCallback((extracted: ExtractedSyllabus): Omit<Bullet, 'id' | 'createdAt' | 'updatedAt'>[] => {
    const bullets: Omit<Bullet, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    
    // Find the subject
    const subject = subjects.find(s => 
      s.name.toLowerCase() === extracted.subject.toLowerCase()
    );
    
    if (!subject) {
      throw new Error(`Subject "${extracted.subject}" not found. Available subjects: ${subjects.map(s => s.name).join(', ')}`);
    }
    
    // Convert topics to bullets
    extracted.topics.forEach(topic => {
      topic.subtopics.forEach(subtopic => {
        subtopic.bullets.forEach(bulletText => {
          bullets.push({
            subjectId: subject.id,
            mainTopic: topic.mainTopic,
            subtopic: subtopic.name,
            bulletText: bulletText,
            status: null,
            comment: '',
            done: false,
          });
        });
      });
    });
    
    return bullets;
  }, [subjects]);

  const handlePDFExtraction = useCallback(async (file: File) => {
    setIsExtractingPDF(true);
    
    try {
      // Step 1: Extract text from PDF
      toast({
        title: 'Extracting PDF text...',
        description: 'Please wait while we extract text from the PDF.',
      });
      
      const pdfText = await extractTextFromPDF(file);
      
      if (!pdfText || pdfText.trim().length === 0) {
        throw new Error('No text could be extracted from the PDF. The PDF may be image-based or corrupted.');
      }

      // Step 2: Use AI to extract syllabus structure
      toast({
        title: 'Analyzing syllabus structure...',
        description: 'Using AI to extract topics and bullet points.',
      });

      const aiProvider = getAIProvider();
      if (!aiProvider) {
        throw new Error('AI extraction is deferred until protected server-side infrastructure is available.');
      }

      const availableSubjects = subjects.map(s => s.name);
      const prompt = generateSyllabusExtractionPrompt(pdfText, availableSubjects);
      
      const aiResponse = await aiProvider.generateText(prompt, {
        systemPrompt: SYLLABUS_EXTRACTION_SYSTEM_PROMPT,
        maxTokens: 4000,
        temperature: 0.3, // Lower temperature for more structured output
      });

      // Step 3: Parse AI response
      const extractedSyllabus = parseAIResponse<ExtractedSyllabus>(aiResponse);
      
      // Step 4: Convert to bullets format
      const bullets = convertExtractedSyllabusToBullets(extractedSyllabus);
      
      if (bullets.length === 0) {
        throw new Error('No syllabus items were extracted from the PDF.');
      }

      // Step 5: Import the bullets
      onImport(bullets);
      
      toast({
        title: 'PDF extraction successful',
        description: `Extracted ${bullets.length} bullet points from the PDF.`,
      });
      
      setCsvContent('');
      onOpenChange(false);
    } catch (error) {
      console.error('PDF extraction error:', error);
      toast({
        title: 'PDF extraction failed',
        description: error instanceof Error ? error.message : 'Failed to extract syllabus from PDF. Please try again or use CSV import.',
        variant: 'destructive',
      });
    } finally {
      setIsExtractingPDF(false);
    }
  }, [subjects, convertExtractedSyllabusToBullets, onImport, onOpenChange, toast]);

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
        handlePDFExtraction(file);
      } else {
        toast({
          title: 'PDF Support',
          description: 'Enable AI extraction or convert your PDF to CSV format.',
        });
      }
    }
  }, [useAI, aiEnabled, toast, handlePDFExtraction]);

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
      const message = error instanceof Error ? error.message : 'There was an error parsing your CSV.';
      toast({
        title: 'Import failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 z-10 bg-background pb-4 border-b">
          <DialogTitle>Import Syllabus Data</DialogTitle>
          <DialogDescription>
            Upload a CSV file or paste data directly. CSV should have columns:
            Subject, Main Topic, Subtopic, Bullet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 pb-24">
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
              disabled={isProcessing || isExtractingPDF}
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

        <DialogFooter className="sticky bottom-0 z-10 bg-background pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing || isExtractingPDF}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isProcessing || isExtractingPDF || !csvContent.trim()}>
            {isProcessing || isExtractingPDF ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isExtractingPDF ? 'Extracting...' : 'Processing...'}
              </>
            ) : (
              'Import Data'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
