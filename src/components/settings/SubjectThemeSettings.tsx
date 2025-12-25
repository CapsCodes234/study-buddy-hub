/**
 * Subject Theme Settings Component
 * 
 * Allows users to toggle per-subject theming on/off,
 * customize primary/accent colors per subject, and
 * restore defaults. Stores settings in localStorage.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { checkContrast } from '@/lib/contrastChecker';
import { SUBJECT_THEMES, SubjectThemeColors } from '@/lib/subjectThemes';
import { useTheme } from '@/components/ui/ThemeProvider';
import {
  Palette,
  RotateCcw,
  Calculator,
  Atom,
  Cpu,
  AlertTriangle,
  Check,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Storage keys
const THEME_ENABLED_KEY = 'subject-theme-enabled';
const THEME_OVERRIDES_KEY = 'subject-theme-overrides';

// Subject icons
const SUBJECT_ICONS: Record<string, React.ElementType> = {
  math: Calculator,
  physics: Atom,
  it: Cpu,
};

interface ColorOverride {
  primary?: string;
  accent?: string;
}

interface ThemeOverrides {
  [subjectId: string]: ColorOverride;
}

export function loadThemeOverrides(): ThemeOverrides {
  try {
    const stored = localStorage.getItem(THEME_OVERRIDES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveThemeOverrides(overrides: ThemeOverrides): void {
  localStorage.setItem(THEME_OVERRIDES_KEY, JSON.stringify(overrides));
}

export function SubjectThemeSettings() {
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const [themeEnabled, setThemeEnabled] = useState(() => {
    const stored = localStorage.getItem(THEME_ENABLED_KEY);
    return stored !== 'false';
  });
  
  const [overrides, setOverrides] = useState<ThemeOverrides>(() => loadThemeOverrides());
  const [contrastWarnings, setContrastWarnings] = useState<Record<string, string>>({});

  // Toggle global subject theme
  const handleToggleGlobal = (enabled: boolean) => {
    setThemeEnabled(enabled);
    localStorage.setItem(THEME_ENABLED_KEY, String(enabled));
    toast({
      title: enabled ? 'Subject themes enabled' : 'Subject themes disabled',
      description: enabled 
        ? 'Subject-specific colors will be applied on subject pages.' 
        : 'Using default app colors on all pages.',
    });
  };

  // Update color override
  const handleColorChange = (subjectId: string, colorKey: 'primary' | 'accent', value: string) => {
    const newOverrides = {
      ...overrides,
      [subjectId]: {
        ...overrides[subjectId],
        [colorKey]: value,
      },
    };
    setOverrides(newOverrides);
    saveThemeOverrides(newOverrides);
    
    // Check contrast
    validateContrast(subjectId, colorKey, value);
  };

  // Validate contrast for a color
  const validateContrast = (subjectId: string, colorKey: string, hslValue: string) => {
    const theme = SUBJECT_THEMES[subjectId];
    if (!theme) return;
    
    const mode = isDark ? 'dark' : 'light';
    const bgColor = theme.colors[mode].background;
    
    try {
      const result = checkContrast(hslValue, bgColor);
      const warningKey = `${subjectId}-${colorKey}`;
      
      if (!result.meetsAALarge) {
        setContrastWarnings(prev => ({
          ...prev,
          [warningKey]: `Low contrast (${result.ratio.toFixed(1)}:1) - may be hard to read`,
        }));
      } else {
        setContrastWarnings(prev => {
          const newWarnings = { ...prev };
          delete newWarnings[warningKey];
          return newWarnings;
        });
      }
    } catch {
      // Invalid HSL format
    }
  };

  // Restore defaults for a subject
  const handleRestoreSubject = (subjectId: string) => {
    const newOverrides = { ...overrides };
    delete newOverrides[subjectId];
    setOverrides(newOverrides);
    saveThemeOverrides(newOverrides);
    
    // Clear warnings for this subject
    setContrastWarnings(prev => {
      const newWarnings = { ...prev };
      delete newWarnings[`${subjectId}-primary`];
      delete newWarnings[`${subjectId}-accent`];
      return newWarnings;
    });
    
    toast({ title: `${SUBJECT_THEMES[subjectId]?.name || subjectId} colors restored to defaults` });
  };

  // Restore all defaults
  const handleRestoreAll = () => {
    setOverrides({});
    saveThemeOverrides({});
    setContrastWarnings({});
    toast({ title: 'All subject theme colors restored to defaults' });
  };

  // Get effective color (override or default)
  const getEffectiveColor = (subjectId: string, colorKey: 'primary' | 'accent'): string => {
    const override = overrides[subjectId]?.[colorKey];
    if (override) return override;
    
    const theme = SUBJECT_THEMES[subjectId];
    const mode = isDark ? 'dark' : 'light';
    return theme?.colors[mode][colorKey] || '';
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Subject Theme Settings
        </CardTitle>
        <CardDescription>
          Customize the visual appearance for each subject
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="subject-themes-enabled">Enable Subject Themes</Label>
            <p className="text-xs text-muted-foreground">
              Apply unique color palettes when viewing subject pages
            </p>
          </div>
          <Switch
            id="subject-themes-enabled"
            checked={themeEnabled}
            onCheckedChange={handleToggleGlobal}
          />
        </div>

        {themeEnabled && (
          <>
            <Separator />
            
            <div className="p-3 bg-muted/50 rounded-lg flex gap-3">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p>
                  Colors use HSL format: <code className="bg-muted px-1 rounded">H S% L%</code> (e.g., "222 47% 20%").
                  Visit <a href="/theme-demo" className="text-primary underline">Theme Demo</a> to preview.
                </p>
              </div>
            </div>

            {/* Per-Subject Settings */}
            <div className="space-y-4">
              {Object.entries(SUBJECT_THEMES).map(([id, theme]) => {
                const Icon = SUBJECT_ICONS[id] || Calculator;
                const hasOverrides = overrides[id] && (overrides[id].primary || overrides[id].accent);
                
                return (
                  <div key={id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{theme.name}</span>
                        {hasOverrides && (
                          <Badge variant="secondary" className="text-xs">Customized</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreSubject(id)}
                        disabled={!hasOverrides}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Primary Color */}
                      <div className="space-y-2">
                        <Label className="text-xs">Primary Color (HSL)</Label>
                        <div className="flex gap-2">
                          <div 
                            className="w-10 h-10 rounded border shrink-0"
                            style={{ backgroundColor: `hsl(${getEffectiveColor(id, 'primary')})` }}
                          />
                          <Input
                            value={overrides[id]?.primary || ''}
                            onChange={(e) => handleColorChange(id, 'primary', e.target.value)}
                            placeholder={isDark ? theme.colors.dark.primary : theme.colors.light.primary}
                            className="text-xs font-mono"
                          />
                        </div>
                        {contrastWarnings[`${id}-primary`] && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {contrastWarnings[`${id}-primary`]}
                          </p>
                        )}
                      </div>

                      {/* Accent Color */}
                      <div className="space-y-2">
                        <Label className="text-xs">Accent Color (HSL)</Label>
                        <div className="flex gap-2">
                          <div 
                            className="w-10 h-10 rounded border shrink-0"
                            style={{ backgroundColor: `hsl(${getEffectiveColor(id, 'accent')})` }}
                          />
                          <Input
                            value={overrides[id]?.accent || ''}
                            onChange={(e) => handleColorChange(id, 'accent', e.target.value)}
                            placeholder={isDark ? theme.colors.dark.accent : theme.colors.light.accent}
                            className="text-xs font-mono"
                          />
                        </div>
                        {contrastWarnings[`${id}-accent`] && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {contrastWarnings[`${id}-accent`]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Restore All */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleRestoreAll}
                disabled={Object.keys(overrides).length === 0}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore All Defaults
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
