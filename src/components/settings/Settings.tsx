import { useState } from 'react';
import { AppState } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { exportAsJSON, importFromJSON, isImportSuccess } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/components/ui/ThemeProvider';
import { testAIConnection, getProviderName, isAIConfigured } from '@/ai/aiClient';
import { loadReminderSettings, saveReminderSettings } from '@/lib/examSchedule';
import { DEFAULT_REMINDER_SETTINGS, ReminderSettings } from '@/types/syllabus';
import { SubjectThemeSettings } from './SubjectThemeSettings';
import { type IntegrityCheckResult } from '@/lib/dataIntegrity';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  Wand2,
  Database,
  Info,
  Sun,
  Moon,
  Monitor,
  Palette,
  Bell,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  AlertTriangle,
} from 'lucide-react';

interface SettingsProps {
  state: AppState;
  onUpdateSettings: (updates: Partial<AppState['settings']>) => void;
  onImportState: (state: AppState) => void;
  onClearData: () => void;
  onClearSubjectData?: (subjectId: string) => void;
  onCheckIntegrity?: () => IntegrityCheckResult;
  onRepairDuplicates?: () => IntegrityCheckResult;
}

export const Settings = ({
  state,
  onUpdateSettings,
  onImportState,
  onClearData,
  onClearSubjectData,
  onCheckIntegrity,
  onRepairDuplicates,
}: SettingsProps) => {
  const { toast } = useToast();
  const { theme, setTheme, reducedMotion, setReducedMotion, highContrast, setHighContrast } = useTheme();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [subjectClearModalOpen, setSubjectClearModalOpen] = useState(false);
  const [pendingSubjectClear, setPendingSubjectClear] = useState<{ id: string; name: string } | null>(null);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [aiTestStatus, setAiTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [aiTestMessage, setAiTestMessage] = useState('');
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => loadReminderSettings());
  const [integrityResult, setIntegrityResult] = useState<IntegrityCheckResult | null>(null);
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);

  const handleTestAIConnection = async () => {
    setAiTestStatus('testing');
    setAiTestMessage('');
    try {
      const result = await testAIConnection();
      if (result.success) {
        setAiTestStatus('success');
        const msg = result.isMock ? 'Mock provider active' : 'Connection successful';
        setAiTestMessage(msg);
        toast({ title: 'AI Connection Successful', description: msg });
      } else {
        setAiTestStatus('error');
        const msg = result.error || 'Connection failed';
        setAiTestMessage(msg);
        toast({ title: 'AI Connection Failed', description: msg, variant: 'destructive' });
      }
    } catch (error) {
      setAiTestStatus('error');
      setAiTestMessage('Unexpected error testing connection');
      toast({ title: 'Error', description: 'Failed to test AI connection', variant: 'destructive' });
    }
  };

  const handleUpdateReminderSettings = (updates: Partial<ReminderSettings>) => {
    const updated = { ...reminderSettings, ...updates };
    setReminderSettings(updated);
    saveReminderSettings(updated);
    toast({ title: 'Reminder settings saved' });
  };

  const handleExportBackup = async () => {
    const json = exportAsJSON(state);
    const blob = new Blob([json], { type: 'application/json' });
    const date = new Date().toISOString().split('T')[0];
    const fileName = `study-tracker-backup-${date}.json`;

    // Try Web Share API first (better for mobile/tablet)
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], fileName, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Study Tracker Backup',
          });
          toast({ title: 'Backup exported', description: 'Your data has been shared.' });
          return;
        }
      } catch (err) {
        // User cancelled or share failed - fall through to download
        if ((err as Error).name === 'AbortError') {
          return; // User cancelled, don't show error
        }
      }
    }

    // Fallback: standard download approach
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a); // Append to body for better compatibility
    a.click();
    document.body.removeChild(a);
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

    // Check file size before reading
    if (pendingImportFile.size > 10 * 1024 * 1024) {
      toast({
        title: 'Import failed',
        description: 'Backup file is too large. Maximum size is 10MB.',
        variant: 'destructive',
      });
      setPendingImportFile(null);
      setImportModalOpen(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        // Pass existing state to merge and deduplicate properly
        const result = importFromJSON(json, state);
        
        // Use type guard for proper narrowing
        if (!isImportSuccess(result)) {
          toast({
            title: 'Import failed',
            description: result.error,
            variant: 'destructive',
          });
          return;
        }
        
        // Success case - result is now narrowed to success type
        onImportState(result.data);
        
        // Show success message with deduplication info if applicable
        const dupInfo = result.duplicatesRemoved;
        const hasDuplicates = dupInfo.bullets > 0 || dupInfo.papers > 0 || dupInfo.components > 0;
        const dupMessage = hasDuplicates
          ? ` Removed ${dupInfo.bullets} duplicate bullet${dupInfo.bullets !== 1 ? 's' : ''}, ${dupInfo.papers} paper${dupInfo.papers !== 1 ? 's' : ''}, and ${dupInfo.components} component${dupInfo.components !== 1 ? 's' : ''}.`
          : '';
        
        toast({
          title: 'Backup restored',
          description: `Your data has been restored from the backup.${dupMessage}`,
        });
      } catch (error) {
        console.error('Error reading backup file:', error);
        toast({
          title: 'Import failed',
          description: 'Failed to read backup file. Please try again.',
          variant: 'destructive',
        });
      }
    };
    
    reader.onerror = () => {
      toast({
        title: 'Import failed',
        description: 'Failed to read backup file. Please try again.',
        variant: 'destructive',
      });
    };
    
    reader.readAsText(pendingImportFile);
    setPendingImportFile(null);
    setImportModalOpen(false);
  };

  const handleConfirmReset = () => {
    onClearData();
    toast({ title: 'Data cleared', description: 'All data has been deleted.' });
  };

  const handleClearSubjectClick = (subjectId: string, subjectName: string) => {
    setPendingSubjectClear({ id: subjectId, name: subjectName });
    setSubjectClearModalOpen(true);
  };

  const handleConfirmSubjectClear = () => {
    if (pendingSubjectClear && onClearSubjectData) {
      onClearSubjectData(pendingSubjectClear.id);
      toast({ 
        title: `Cleared ${pendingSubjectClear.name} data`,
        description: 'Topics and past papers for this subject have been deleted.'
      });
    }
    setPendingSubjectClear(null);
  };

  // Get counts per subject
  const getSubjectCounts = (subjectId: string) => {
    const topicCount = state.bullets.filter(b => b.subjectId === subjectId).length;
    const paperCount = state.pastPapers.filter(p => p.subjectId === subjectId).length;
    return { topicCount, paperCount };
  };

  // Data integrity check
  const handleCheckIntegrity = () => {
    if (!onCheckIntegrity) return;
    setIsCheckingIntegrity(true);
    try {
      const result = onCheckIntegrity();
      setIntegrityResult(result);
      if (!result.hasDuplicates) {
        toast({ title: 'Data Integrity OK', description: 'No duplicate records found.' });
      }
    } finally {
      setIsCheckingIntegrity(false);
    }
  };

  const handleRepairDuplicates = () => {
    if (!onRepairDuplicates) return;
    const result = onRepairDuplicates();
    setIntegrityResult(result);
    const totalRemoved = result.bullets.duplicates + result.papers.duplicates + result.components.duplicates;
    toast({ 
      title: 'Duplicates Repaired', 
      description: `Removed ${totalRemoved} duplicate record${totalRemoved !== 1 ? 's' : ''}.` 
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Settings</h2>
      </div>

      {/* Appearance & Accessibility Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-accent" />
            Appearance & Accessibility
          </CardTitle>
          <CardDescription>
            Customize the look and feel of the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
                className="justify-start gap-2"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="justify-start gap-2"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
                className="justify-start gap-2"
              >
                <Monitor className="h-4 w-4" />
                System
              </Button>
            </div>
          </div>

          <Separator />

          {/* Accessibility Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reduced-motion">Reduced Motion</Label>
                <p className="text-xs text-muted-foreground">
                  Disable animations for accessibility or preference
                </p>
              </div>
              <Switch
                id="reduced-motion"
                checked={reducedMotion}
                onCheckedChange={setReducedMotion}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="high-contrast">High Contrast</Label>
                <p className="text-xs text-muted-foreground">
                  Enhanced contrast for better visibility
                </p>
              </div>
              <Switch
                id="high-contrast"
                checked={highContrast}
                onCheckedChange={setHighContrast}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Theme Settings */}
      <SubjectThemeSettings />

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
                {isAIConfigured()
                  ? `Ready to use (${getProviderName()})`
                  : 'Requires API key configuration (see README)'}
              </p>
            </div>
            <Switch
              id="ai-enabled"
              checked={state.settings.aiExtractionEnabled}
              onCheckedChange={(checked) =>
                onUpdateSettings({ aiExtractionEnabled: checked })
              }
            />
          </div>

          {/* Provider Selection */}
          <div className="space-y-1.5">
            <Label>AI Provider</Label>
            <Select
              value={import.meta.env.VITE_AI_PROVIDER || 'openrouter'}
              disabled
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openrouter">OpenRouter (default)</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="mock">Mock (for development)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Set via VITE_AI_PROVIDER in .env.local
            </p>
          </div>

          {/* Test Connection Button */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestAIConnection}
              disabled={aiTestStatus === 'testing'}
            >
              {aiTestStatus === 'testing' && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {aiTestStatus === 'success' && <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />}
              {aiTestStatus === 'error' && <XCircle className="h-4 w-4 mr-1 text-destructive" />}
              Test AI Connection
            </Button>
            {aiTestMessage && (
              <span className={`text-xs ${aiTestStatus === 'success' ? 'text-green-600' : 'text-destructive'}`}>
                {aiTestMessage}
              </span>
            )}
          </div>
          
          <div className={`p-3 rounded-lg flex gap-3 ${isAIConfigured() ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/50'}`}>
            <Info className={`h-4 w-4 shrink-0 mt-0.5 ${isAIConfigured() ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
            <div className={`text-xs ${isAIConfigured() ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}`}>
              {isAIConfigured() ? (
                <p>API key is configured. You can enable AI extraction above.</p>
              ) : (
                <>
                  <p className="mb-1">To enable AI extraction:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Create <code className="bg-muted px-1 rounded">.env.local</code></li>
                    <li>Add <code className="bg-muted px-1 rounded">VITE_AI_API_KEY=your_key</code></li>
                    <li>Set <code className="bg-muted px-1 rounded">VITE_AI_PROVIDER=openrouter</code></li>
                  </ol>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Reminder Settings
          </CardTitle>
          <CardDescription>
            Configure default reminder intervals and exam notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reminders-enabled">Enable Reminders</Label>
              <p className="text-xs text-muted-foreground">
                Show in-app reminders for topics and exams
              </p>
            </div>
            <Switch
              id="reminders-enabled"
              checked={reminderSettings.enabled}
              onCheckedChange={(enabled) => handleUpdateReminderSettings({ enabled })}
            />
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label>Default "Remind Me Later" Interval</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={reminderSettings.defaultIntervalDays}
                onChange={(e) =>
                  handleUpdateReminderSettings({
                    defaultIntervalDays: parseInt(e.target.value) || 3,
                  })
                }
                className="w-20"
                min={1}
                max={30}
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Main Exam Lead Days</Label>
              <Input
                value={reminderSettings.mainExamLeadDays.join(', ')}
                onChange={(e) =>
                  handleUpdateReminderSettings({
                    mainExamLeadDays: e.target.value
                      .split(',')
                      .map((s) => parseInt(s.trim()))
                      .filter((n) => !isNaN(n)),
                  })
                }
                placeholder="7, 3, 1"
              />
              <p className="text-xs text-muted-foreground">
                Days before exam to remind (comma-separated)
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Mock Exam Lead Days</Label>
              <Input
                value={reminderSettings.mockExamLeadDays.join(', ')}
                onChange={(e) =>
                  handleUpdateReminderSettings({
                    mockExamLeadDays: e.target.value
                      .split(',')
                      .map((s) => parseInt(s.trim()))
                      .filter((n) => !isNaN(n)),
                  })
                }
                placeholder="3, 1"
              />
              <p className="text-xs text-muted-foreground">
                Days before mock to remind (comma-separated)
              </p>
            </div>
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
            <Button variant="outline" onClick={handleExportBackup} className="min-h-[44px]">
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
              <Button variant="outline" asChild className="min-h-[44px]">
                <label htmlFor="import-backup" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Backup
                </label>
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              className="min-h-[44px] w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Data
            </Button>
          </div>

          <Separator />

          {/* Per-Subject Data Clearing */}
          {onClearSubjectData && (
            <div className="space-y-3">
              <div>
                <p className="font-medium">Clear Data by Subject</p>
                <p className="text-xs text-muted-foreground">
                  Delete topics and past papers for a specific subject only
                </p>
              </div>
              <div className="space-y-2">
                {state.subjects.map((subject) => {
                  const { topicCount, paperCount } = getSubjectCounts(subject.id);
                  const hasData = topicCount > 0 || paperCount > 0;
                  
                  return (
                    <div 
                      key={subject.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{subject.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {topicCount} topic{topicCount !== 1 ? 's' : ''} · {paperCount} paper{paperCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClearSubjectClick(subject.id, subject.name)}
                        disabled={!hasData}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 min-h-[44px] w-full sm:w-auto"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* Data Integrity Check */}
          {onCheckIntegrity && onRepairDuplicates && (
            <div className="space-y-3">
              <div>
                <p className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Data Integrity
                </p>
                <p className="text-xs text-muted-foreground">
                  Check for and repair duplicate records that may cause issues
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckIntegrity}
                  disabled={isCheckingIntegrity}
                  className="min-h-[44px]"
                >
                  {isCheckingIntegrity ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Check Integrity
                </Button>
                
                {integrityResult?.hasDuplicates && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRepairDuplicates}
                    className="text-status-amber hover:text-status-amber min-h-[44px]"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Repair Duplicates
                  </Button>
                )}
              </div>

              {integrityResult && (
                <div className={`p-3 rounded-lg border ${integrityResult.hasDuplicates ? 'border-status-amber/30 bg-status-amber/5' : 'border-status-green/30 bg-status-green/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {integrityResult.hasDuplicates ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-status-amber" />
                        <span className="text-sm font-medium text-status-amber">Duplicates Found</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-status-green" />
                        <span className="text-sm font-medium text-status-green">All Clear</span>
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Topics:</span>{' '}
                      <span className="font-medium">{integrityResult.bullets.total}</span>
                      {integrityResult.bullets.duplicates > 0 && (
                        <Badge variant="outline" className="ml-1 text-status-amber border-status-amber/30">
                          {integrityResult.bullets.duplicates} dupe
                        </Badge>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Papers:</span>{' '}
                      <span className="font-medium">{integrityResult.papers.total}</span>
                      {integrityResult.papers.duplicates > 0 && (
                        <Badge variant="outline" className="ml-1 text-status-amber border-status-amber/30">
                          {integrityResult.papers.duplicates} dupe
                        </Badge>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Components:</span>{' '}
                      <span className="font-medium">{integrityResult.components.total}</span>
                      {integrityResult.components.duplicates > 0 && (
                        <Badge variant="outline" className="ml-1 text-status-amber border-status-amber/30">
                          {integrityResult.components.duplicates} dupe
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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

      <ConfirmationModal
        open={subjectClearModalOpen}
        onOpenChange={setSubjectClearModalOpen}
        title={`Clear ${pendingSubjectClear?.name} data?`}
        description={`This will permanently delete all topics and past paper logs for ${pendingSubjectClear?.name}. This cannot be undone.`}
        confirmLabel="Yes, clear"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConfirmSubjectClear}
      />
    </div>
  );
};
