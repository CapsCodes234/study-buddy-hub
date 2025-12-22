/**
 * Syllabus Upload - PDF and CSV upload with AI extraction
 */

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Upload,
  FileText,
  FileSpreadsheet,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-react';
import { Subject } from '@/types';
import { ExtractionResult, ComponentMarksSuggestion } from '@/types/syllabus';
import { extractTextFromPDF } from '@/lib/pdfExtractor';
import { extractSyllabusFromPDF, isAIConfigured, getProviderName } from '@/ai/aiClient';
import { extractComponentMarks } from '@/lib/extraction/parseHelpers';
import { ExtractionReviewModal } from './ExtractionReviewModal';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SyllabusUploadProps {
  subjects: Subject[];
  aiEnabled: boolean;
  onImportBullets: (bullets: Array<{
    subjectId: string;
    mainTopic: string;
    subtopic: string;
    bulletText: string;
  }>) => void;
  onOpenCSVMapping?: (file: File) => void;
}

type UploadState = 'idle' | 'reading' | 'extracting' | 'reviewing' | 'error';

export const SyllabusUpload = ({
  subjects,
  aiEnabled,
  onImportBullets,
  onOpenCSVMapping,
}: SyllabusUploadProps) => {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [componentSuggestions, setComponentSuggestions] = useState<ComponentMarksSuggestion[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processFile = async (file: File) => {
    const fileType = file.name.toLowerCase().split('.').pop();

    // Handle CSV files
    if (fileType === 'csv') {
      if (onOpenCSVMapping) {
        onOpenCSVMapping(file);
      } else {
        toast({
          title: 'CSV Import',
          description: 'CSV mapping is not available. Please use PDF upload.',
          variant: 'destructive',
        });
      }
      return;
    }

    // Handle PDF files
    if (fileType !== 'pdf') {
      setError('Please upload a PDF or CSV file');
      setUploadState('error');
      return;
    }

    try {
      setUploadState('reading');
      setProgress(10);
      setError(null);

      // Extract text from PDF
      const pdfText = await extractTextFromPDF(file);
      setProgress(30);

      if (!pdfText || pdfText.trim().length < 100) {
        throw new Error('Could not extract enough text from the PDF. The file might be image-based or corrupted.');
      }

      // Extract component marks suggestions from text
      const suggestions = extractComponentMarks(pdfText);
      setComponentSuggestions(suggestions);
      setProgress(40);

      // If AI is enabled, use AI extraction
      if (aiEnabled && isAIConfigured()) {
        setUploadState('extracting');
        setProgress(50);

        const availableSubjects = subjects.map(s => s.name);
        const result = await extractSyllabusFromPDF(pdfText, availableSubjects);
        
        setProgress(90);
        setExtraction(result);
        setUploadState('reviewing');
        setReviewOpen(true);
      } else {
        // Fallback: Show message to use CSV or enable AI
        toast({
          title: 'AI Extraction Disabled',
          description: 'Enable AI extraction in Settings or use CSV import for manual mapping.',
        });
        setUploadState('idle');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process file');
      setUploadState('error');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [aiEnabled, subjects]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleAcceptExtraction = (editedExtraction: ExtractionResult) => {
    // Convert extraction to bullets
    const subjectMatch = subjects.find(
      s => s.name.toLowerCase() === editedExtraction.subject.toLowerCase()
    );
    
    if (!subjectMatch && !selectedSubject) {
      toast({
        title: 'Select Subject',
        description: 'Please select a subject to import the syllabus into.',
        variant: 'destructive',
      });
      return;
    }

    const targetSubjectId = subjectMatch?.id || selectedSubject;
    
    const bullets: Array<{
      subjectId: string;
      mainTopic: string;
      subtopic: string;
      bulletText: string;
    }> = [];

    for (const topic of editedExtraction.topics) {
      for (const subtopic of topic.subtopics) {
        for (const bullet of subtopic.bullets) {
          bullets.push({
            subjectId: targetSubjectId,
            mainTopic: topic.name,
            subtopic: subtopic.name,
            bulletText: bullet.text,
          });
        }
      }
    }

    onImportBullets(bullets);
    
    toast({
      title: 'Syllabus Imported',
      description: `Imported ${bullets.length} items into ${subjectMatch?.name || 'selected subject'}`,
    });

    // Reset state
    setReviewOpen(false);
    setExtraction(null);
    setUploadState('idle');
    setProgress(0);
  };

  const handleCancelReview = () => {
    setReviewOpen(false);
    setExtraction(null);
    setUploadState('idle');
    setProgress(0);
  };

  const resetUpload = () => {
    setUploadState('idle');
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isProcessing = uploadState === 'reading' || uploadState === 'extracting';

  return (
    <>
      <Card className="glass-card">
        <CardContent className="pt-6">
          {/* AI Status Banner */}
          {!aiEnabled || !isAIConfigured() ? (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>AI Extraction Disabled</AlertTitle>
              <AlertDescription>
                {!aiEnabled
                  ? 'Enable AI extraction in Settings to automatically extract syllabus from PDFs.'
                  : `Configure your ${getProviderName()} API key in Settings to enable AI extraction.`}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-4 border-primary/30 bg-primary/5">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertTitle>AI Extraction Ready</AlertTitle>
              <AlertDescription>
                Upload a PDF syllabus and AI will extract the structure automatically.
                You'll review all changes before saving.
              </AlertDescription>
            </Alert>
          )}

          {/* Subject selector for fallback */}
          {!aiEnabled && (
            <div className="mb-4">
              <Label>Target Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select subject for import" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Drop zone */}
          <div
            className={cn(
              'relative border-2 border-dashed rounded-xl p-8 text-center transition-all',
              dragActive && 'border-primary bg-primary/5',
              isProcessing && 'pointer-events-none opacity-70',
              uploadState === 'error' && 'border-destructive bg-destructive/5',
              !dragActive && uploadState !== 'error' && 'border-border hover:border-primary/50'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.csv"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />

            {uploadState === 'idle' && (
              <div className="space-y-4">
                <div className="flex justify-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div className="p-3 rounded-full bg-muted">
                    <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-medium">Drop files here or click to upload</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports PDF (with AI extraction) and CSV files
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="space-y-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                <div>
                  <p className="font-medium">
                    {uploadState === 'reading' ? 'Reading PDF...' : 'Extracting with AI...'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {uploadState === 'extracting'
                      ? 'AI is analyzing the syllabus structure'
                      : 'Parsing document content'}
                  </p>
                </div>
                <Progress value={progress} className="max-w-xs mx-auto" />
              </div>
            )}

            {uploadState === 'error' && (
              <div className="space-y-4">
                <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
                <div>
                  <p className="font-medium text-destructive">Upload Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={resetUpload}>
                  <X className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}
          </div>

          {/* Help text */}
          <p className="text-xs text-muted-foreground mt-4 text-center">
            PDF files will be processed with AI extraction (if enabled).
            CSV files open a mapping interface for manual column assignment.
          </p>
        </CardContent>
      </Card>

      {/* Extraction Review Modal */}
      <ExtractionReviewModal
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        extraction={extraction}
        componentSuggestions={componentSuggestions}
        onAccept={handleAcceptExtraction}
        onCancel={handleCancelReview}
      />
    </>
  );
};
