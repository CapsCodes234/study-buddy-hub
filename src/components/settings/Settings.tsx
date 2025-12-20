import { useState } from 'react';
import { AppState } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { exportAsJSON, importFromJSON } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  Wand2,
  Database,
  Info,
} from 'lucide-react';

interface SettingsProps {
  state: AppState;
  onUpdateSettings: (updates: Partial<AppState['settings']>) => void;
  onImportState: (state: AppState) => void;
  onClearData: () => void;
}

export const Settings = ({
  state,
  onUpdateSettings,
  onImportState,
  onClearData,
}: SettingsProps) => {
  const { toast } = useToast();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);

  const handleExportBackup = () => {
    const json = exportAsJSON(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `study-tracker-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Backup exported', description: 'Your data has been saved to a file.' });
  };

  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset input so same file can be selected again
    e.target.value = '';
    
    setPendingImportFile(file);
    setImportModalOpen(true);
  };

  const handleConfirmImport = () => {
    if (!pendingImportFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      const imported = importFromJSON(json);
      if (imported) {
        onImportState(imported);
        toast({ title: 'Backup restored', description: 'Your data has been restored from the backup.' });
      } else {
        toast({ 
          title: 'Import failed', 
          description: 'Invalid backup file. Please ensure the file contains valid subjects, bullets, and pastPapers data.', 
          variant: 'destructive' 
        });
      }
    };
    reader.readAsText(pendingImportFile);
    setPendingImportFile(null);
  };

  const handleConfirmReset = () => {
    onClearData();
    toast({ title: 'Data cleared', description: 'All data has been deleted.' });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Settings</h2>
      </div>

      {/* AI Features Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-accent" />
            AI Intelligence Features
          </CardTitle>
          <CardDescription>
            Enable AI-powered study insights and recommendations (optional, disabled by default)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ai-features-enabled">Enable AI Features</Label>
              <p className="text-xs text-muted-foreground">
                Study summaries, daily focus recommendations, and insights
              </p>
            </div>
            <Switch
              id="ai-features-enabled"
              checked={state.settings.aiFeaturesEnabled}
              onCheckedChange={(checked) =>
                onUpdateSettings({ aiFeaturesEnabled: checked })
              }
            />
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg flex gap-3">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                AI features are <strong>advisory only</strong> and never modify your data.
              </p>
              <p>
                To use AI features, set <code className="font-mono bg-muted px-1 rounded">VITE_AI_API_KEY</code> in your environment.
                See the README for setup instructions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Extraction Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-accent" />
            AI Extraction
          </CardTitle>
          <CardDescription>
            Enable AI-powered syllabus extraction from PDF files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ai-enabled">Enable AI Extraction</Label>
              <p className="text-xs text-muted-foreground">
                {import.meta.env.VITE_AI_API_KEY
                  ? 'API key detected - Ready to use'
                  : 'Requires API key configuration (see README)'}
              </p>
            </div>
            <Switch
              id="ai-enabled"
              checked={state.settings.aiExtractionEnabled}
              onCheckedChange={(checked) =>
                onUpdateSettings({ aiExtractionEnabled: checked })
              }
              disabled={!import.meta.env.VITE_AI_API_KEY}
            />
          </div>
          
          <div className={`p-3 rounded-lg flex gap-3 ${import.meta.env.VITE_AI_API_KEY ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/50'}`}>
            <Info className={`h-4 w-4 shrink-0 mt-0.5 ${import.meta.env.VITE_AI_API_KEY ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
            <p className={`text-xs ${import.meta.env.VITE_AI_API_KEY ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}`}>
              {import.meta.env.VITE_AI_API_KEY
                ? `API key is configured (${import.meta.env.VITE_AI_PROVIDER || 'openai'}). You can enable AI extraction above.`
                : 'To enable AI extraction, set the VITE_AI_API_KEY environment variable in .env.local. See the README for setup instructions.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export, import, or clear your study data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExportBackup}>
              <Download className="h-4 w-4 mr-2" />
              Export Backup
            </Button>
            
            <div>
              <input
                type="file"
                id="import-backup"
                accept=".json"
                onChange={handleImportFileSelect}
                className="hidden"
              />
              <Button variant="outline" asChild>
                <label htmlFor="import-backup" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Backup
                </label>
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">Clear All Data</p>
              <p className="text-xs text-muted-foreground">
                This will permanently delete all your syllabus and paper data
              </p>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setResetModalOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Migration Info */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            Database Configuration
          </CardTitle>
          <CardDescription>
            Currently using localStorage for data persistence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              To switch to Supabase for cloud storage:
            </p>
            <ol className="text-xs text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
              <li>Set <code className="font-mono bg-muted px-1 rounded">SUPABASE_URL</code> and <code className="font-mono bg-muted px-1 rounded">SUPABASE_ANON_KEY</code></li>
              <li>Create tables: subjects, bullets, past_papers</li>
              <li>Update storage.ts to use Supabase client</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{state.subjects.length}</p>
              <p className="text-xs text-muted-foreground">Subjects</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{state.bullets.length}</p>
              <p className="text-xs text-muted-foreground">Syllabus Items</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{state.pastPapers.length}</p>
              <p className="text-xs text-muted-foreground">Past Papers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modals */}
      <ConfirmationModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        title="Import Backup"
        description="This will replace all your current data with the backup file. This action cannot be undone. Are you sure you want to continue?"
        confirmLabel="Import"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConfirmImport}
      />

      <ConfirmationModal
        open={resetModalOpen}
        onOpenChange={setResetModalOpen}
        title="Clear All Data"
        description="This action cannot be undone. This will permanently delete all your syllabus progress and past paper records."
        confirmLabel="Delete All Data"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConfirmReset}
      />
    </div>
  );
};
