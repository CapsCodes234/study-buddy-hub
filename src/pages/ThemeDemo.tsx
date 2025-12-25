import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { SUBJECT_THEMES, SubjectTheme } from '@/lib/subjectThemes';
import {
  ArrowLeft,
  Sun,
  Moon,
  Monitor,
  Eye,
  Accessibility,
  Palette,
  Check,
  X,
  AlertTriangle,
  Info,
  Sparkles,
  Target,
  BookOpen,
  FileText,
  Settings,
  ChevronRight,
  Zap,
  Calculator,
  Atom,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Theme Demo Page
 * 
 * Showcases all UI components in both light and dark themes
 * with accessibility information, design token examples,
 * and per-subject theme previews.
 */
export default function ThemeDemo() {
  const { theme, setTheme, resolvedTheme, reducedMotion, setReducedMotion, highContrast, setHighContrast } = useTheme();
  const { toast } = useToast();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [switchValue, setSwitchValue] = useState(false);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [selectedSubjectTheme, setSelectedSubjectTheme] = useState<string>('math');

  const showToast = (variant: 'default' | 'destructive' = 'default') => {
    toast({
      title: variant === 'destructive' ? 'Error occurred' : 'Action completed',
      description: variant === 'destructive' 
        ? 'Something went wrong. Please try again.' 
        : 'Your changes have been saved successfully.',
      variant,
    });
  };

  const subjectTheme = SUBJECT_THEMES[selectedSubjectTheme];
  const themeColors = resolvedTheme === 'dark' ? subjectTheme?.colors.dark : subjectTheme?.colors.light;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to App
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <span className="font-semibold">Theme Demo</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Theme Controls Section */}
        <section>
          <h1 className="text-3xl font-bold mb-2">Design System & Theme Demo</h1>
          <p className="text-muted-foreground mb-6">
            Preview all UI components in light and dark modes. Current theme: <Badge variant="secondary">{resolvedTheme}</Badge>
          </p>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Accessibility className="h-5 w-5" />
                Accessibility Controls
              </CardTitle>
              <CardDescription>
                Adjust theme and accessibility settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setTheme('light')}
                  className="justify-start gap-2"
                >
                  <Sun className="h-4 w-4" />
                  Light
                  {theme === 'light' && <Check className="h-4 w-4 ml-auto" />}
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme('dark')}
                  className="justify-start gap-2"
                >
                  <Moon className="h-4 w-4" />
                  Dark
                  {theme === 'dark' && <Check className="h-4 w-4 ml-auto" />}
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  onClick={() => setTheme('system')}
                  className="justify-start gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  System
                  {theme === 'system' && <Check className="h-4 w-4 ml-auto" />}
                </Button>
              </div>

              <Separator />

              {/* Accessibility Toggles */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="reduced-motion">Reduced Motion</Label>
                    <p className="text-xs text-muted-foreground">
                      Disable animations for accessibility
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
        </section>

        {/* Color Palette Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Palette
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: 'Primary', class: 'bg-primary text-primary-foreground' },
              { name: 'Secondary', class: 'bg-secondary text-secondary-foreground' },
              { name: 'Accent', class: 'bg-accent text-accent-foreground' },
              { name: 'Muted', class: 'bg-muted text-muted-foreground' },
              { name: 'Destructive', class: 'bg-destructive text-destructive-foreground' },
              { name: 'Card', class: 'bg-card text-card-foreground border' },
            ].map((color) => (
              <div
                key={color.name}
                className={cn(
                  'rounded-lg p-4 text-center font-medium transition-shadow hover:shadow-md',
                  color.class
                )}
              >
                {color.name}
              </div>
            ))}
          </div>
        </section>

        {/* Subject Themes Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Per-Subject Themes
          </h2>
          <p className="text-muted-foreground mb-4">
            Each subject has a unique visual identity with custom colors, animations, and patterns.
            Visit a subject page (e.g., /math) to see themes in action.
          </p>
          
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Subject Theme Preview</CardTitle>
              <CardDescription>
                Select a subject to preview its color palette
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Subject Selector */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(SUBJECT_THEMES).map(([id, theme]) => {
                  const icons: Record<string, React.ElementType> = {
                    math: Calculator,
                    physics: Atom,
                    it: Cpu,
                  };
                  const Icon = icons[id] || BookOpen;
                  
                  return (
                    <Button
                      key={id}
                      variant={selectedSubjectTheme === id ? 'default' : 'outline'}
                      onClick={() => setSelectedSubjectTheme(id)}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {theme.name}
                    </Button>
                  );
                })}
              </div>

              <Separator />

              {/* Color Swatches */}
              {themeColors && (
                <div className="space-y-4">
                  <h4 className="font-medium">
                    {subjectTheme.name} - {resolvedTheme === 'dark' ? 'Dark' : 'Light'} Mode
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(themeColors).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div 
                          className="h-12 rounded-lg border"
                          style={{ backgroundColor: `hsl(${value})` }}
                        />
                        <p className="text-xs font-medium capitalize">{key}</p>
                        <p className="text-xs text-muted-foreground font-mono">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Preview Cards */}
              <div className="space-y-4">
                <h4 className="font-medium">Component Preview</h4>
                <div 
                  className="p-6 rounded-lg border space-y-4"
                  style={{ 
                    backgroundColor: `hsl(${themeColors?.background})`,
                    borderColor: `hsl(${themeColors?.border})`,
                  }}
                >
                  <div 
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: `hsl(${themeColors?.cardBg})`,
                      borderColor: `hsl(${themeColors?.border})`,
                    }}
                  >
                    <h5 
                      className="font-semibold mb-2"
                      style={{ color: `hsl(${themeColors?.text})` }}
                    >
                      Sample Card
                    </h5>
                    <p 
                      className="text-sm mb-4"
                      style={{ color: `hsl(${themeColors?.text})` }}
                    >
                      This demonstrates how content looks in the {subjectTheme?.name} theme.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        style={{
                          backgroundColor: `hsl(${themeColors?.primary})`,
                          color: 'white',
                        }}
                      >
                        Primary
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        style={{
                          borderColor: `hsl(${themeColors?.accent})`,
                          color: `hsl(${themeColors?.accent})`,
                        }}
                      >
                        Accent
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar Preview */}
                  <div className="space-y-2">
                    <div 
                      className="text-sm font-medium"
                      style={{ color: `hsl(${themeColors?.text})` }}
                    >
                      Progress Example
                    </div>
                    <div 
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: `hsl(${themeColors?.border})` }}
                    >
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: '65%',
                          background: `linear-gradient(90deg, hsl(${themeColors?.primary}), hsl(${themeColors?.accent}))`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Animation Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Animation Style: {subjectTheme?.animations.cardEntrance}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedSubjectTheme === 'math' && 'Mathematics uses precise, clean slide-in animations reflecting logical precision.'}
                  {selectedSubjectTheme === 'physics' && 'Physics uses wave-like motion animations reflecting energy and dynamics.'}
                  {selectedSubjectTheme === 'it' && 'IT uses glitch-style animations reflecting digital/tech aesthetics.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
        {/* Status Colors Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Status Colors (R/A/G System)
          </h2>
          <p className="text-muted-foreground mb-4">
            These colors are tested for common color blindness types (deuteranopia, protanopia, tritanopia).
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="status-red p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-status-red" />
                <span className="font-semibold">Red</span>
              </div>
              <p className="text-xs">Needs attention</p>
            </Card>
            <Card className="status-amber p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-status-amber" />
                <span className="font-semibold">Amber</span>
              </div>
              <p className="text-xs">In progress</p>
            </Card>
            <Card className="status-green p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-status-green" />
                <span className="font-semibold">Green</span>
              </div>
              <p className="text-xs">Confident</p>
            </Card>
            <Card className="status-done p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-status-done" />
                <span className="font-semibold">Done</span>
              </div>
              <p className="text-xs">Completed</p>
            </Card>
          </div>
        </section>

        {/* Buttons Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
          <Card className="glass-card">
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Variants</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-3">Sizes</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon"><Sparkles className="h-4 w-4" /></Button>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-3">States</h3>
                <div className="flex flex-wrap gap-3">
                  <Button>Enabled</Button>
                  <Button disabled>Disabled</Button>
                  <Button className="btn-interactive">Interactive Effect</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Badges Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Badges</h2>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge className="status-badge status-red">Red Status</Badge>
                <Badge className="status-badge status-amber">Amber Status</Badge>
                <Badge className="status-badge status-green">Green Status</Badge>
                <Badge className="status-badge status-done">Done</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Form Elements Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Form Elements</h2>
          <Card className="glass-card">
            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="demo-input">Text Input</Label>
                  <Input
                    id="demo-input"
                    placeholder="Type something..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demo-select">Select</Label>
                  <Select value={selectedValue} onValueChange={setSelectedValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="math">Mathematics</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="it">Information Technology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="demo-switch"
                    checked={switchValue}
                    onCheckedChange={setSwitchValue}
                  />
                  <Label htmlFor="demo-switch">Toggle Switch</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="demo-checkbox"
                    checked={checkboxValue}
                    onCheckedChange={(checked) => setCheckboxValue(checked === true)}
                  />
                  <Label htmlFor="demo-checkbox">Checkbox</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Progress Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Progress Indicators</h2>
          <Card className="glass-card">
            <CardContent className="pt-6 space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">25% Complete</span>
                  <span className="text-sm text-muted-foreground">25/100</span>
                </div>
                <Progress value={25} />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">60% Complete</span>
                  <span className="text-sm text-muted-foreground">60/100</span>
                </div>
                <Progress value={60} />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">100% Complete</span>
                  <span className="text-sm text-muted-foreground">100/100</span>
                </div>
                <Progress value={100} />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Card Styles</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>Standard card component</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This is the default card style with subtle borders.
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Glass Card</CardTitle>
                <CardDescription>Glassmorphism effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This card uses backdrop blur and transparency.
                </p>
              </CardContent>
            </Card>
            <Card className="elevated-card">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>With enhanced shadow</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This card has more prominent elevation.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Alerts/Toasts Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Notifications & Alerts</h2>
          <Card className="glass-card">
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => showToast('default')} variant="outline">
                  <Check className="h-4 w-4 mr-2" />
                  Success Toast
                </Button>
                <Button onClick={() => showToast('destructive')} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Error Toast
                </Button>
                <Button onClick={() => setConfirmModalOpen(true)} variant="outline">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Confirmation Modal
                </Button>
              </div>

              {/* Alert Examples */}
              <div className="space-y-3 mt-6">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <Info className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-primary">Information</p>
                    <p className="text-sm text-muted-foreground">This is an informational alert message.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-status-amber-bg border border-status-amber/20">
                  <AlertTriangle className="h-5 w-5 text-status-amber mt-0.5" />
                  <div>
                    <p className="font-medium text-status-amber">Warning</p>
                    <p className="text-sm text-muted-foreground">This is a warning alert message.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <X className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Error</p>
                    <p className="text-sm text-muted-foreground">This is an error alert message.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-status-green-bg border border-status-green/20">
                  <Check className="h-5 w-5 text-status-green mt-0.5" />
                  <div>
                    <p className="font-medium text-status-green">Success</p>
                    <p className="text-sm text-muted-foreground">This is a success alert message.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Empty State Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Empty States</h2>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <EmptyState
                icon={Target}
                title="No Focus Items"
                description="All caught up! You don't have any urgent items to focus on right now."
                action={{
                  label: 'View Syllabus',
                  onClick: () => {},
                }}
              />
            </CardContent>
          </Card>
        </section>

        {/* Navigation Preview */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Navigation Items</h2>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Target, label: 'Dashboard', active: true },
                  { icon: BookOpen, label: 'Syllabus', active: false },
                  { icon: FileText, label: 'Papers', active: false },
                  { icon: Settings, label: 'Settings', active: false },
                ].map((item) => (
                  <Button
                    key={item.label}
                    variant={item.active ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn('gap-2', item.active && 'bg-primary/10 text-primary')}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Developer Notes */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Developer Notes
          </h2>
          <Card className="glass-card">
            <CardContent className="pt-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Accessibility</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>All text colors meet WCAG 2.1 AA contrast ratio (4.5:1 normal, 3:1 large)</li>
                  <li>Focus states use visible outlines with 3:1 contrast ratio</li>
                  <li>Status colors tested for deuteranopia, protanopia, and tritanopia</li>
                  <li>Reduced motion respects prefers-reduced-motion media query</li>
                </ul>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Theme Tokens</h3>
                <p className="text-sm text-muted-foreground">
                  Colors are defined as HSL values in <code className="bg-muted px-1 rounded">src/index.css</code>. 
                  To add a new color, add it to both <code className="bg-muted px-1 rounded">:root</code> and <code className="bg-muted px-1 rounded">.dark</code> sections.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Storage Keys</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li><code className="bg-muted px-1 rounded">study-tracker:theme</code> - light/dark/system</li>
                  <li><code className="bg-muted px-1 rounded">study-tracker:reduced-motion</code> - true/false</li>
                  <li><code className="bg-muted px-1 rounded">study-tracker:high-contrast</code> - true/false</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        title="Confirm Action"
        description="This is an example confirmation modal. In a real scenario, this would confirm a destructive action."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={() => {
          toast({ title: 'Confirmed', description: 'Action was confirmed.' });
        }}
      />
    </div>
  );
}
