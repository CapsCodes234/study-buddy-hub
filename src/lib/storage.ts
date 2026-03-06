/**
 * Storage Layer - Local-first with hooks for Supabase migration
 * 
 * To migrate to Supabase:
 * 1. Install @supabase/supabase-js
 * 2. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env
 * 3. Replace localStorage calls with Supabase client calls
 * 4. Example:
 *    import { createClient } from '@supabase/supabase-js';
 *    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 *    // Replace: localStorage.getItem('bullets')
 *    // With: const { data } = await supabase.from('bullets').select('*');
 */

import { AppState, Bullet, PastPaper, Subject, AppSettings } from '@/types';
import { safeJSONParse, sanitizeText, sanitizeCSVCell, validateCSVBullet, appStateSchema } from '@/lib/validation';
import { deduplicateBullets, deduplicatePastPapers, deduplicateComponents, loadAndDedupeComponents } from '@/lib/dataIntegrity';
import { Component } from '@/types/components';
import { SubjectComponent, ExtractionChangelog } from '@/types/syllabus';
import { 
  loadSubjectComponents, 
  saveSubjectComponents, 
  getExtractionChangelogs,
  CHANGELOG_KEY,
  SUBJECT_COMPONENTS_KEY
} from '@/lib/storage/syllabusStorage';
import { ChapterPlanning } from '@/types/chapterPlanning';
import {
  loadChapterPlannings,
  saveChapterPlannings,
  CHAPTER_PLANNING_STORAGE_KEY,
} from '@/lib/chapterPlanningStorage';

const STORAGE_KEY = 'study-tracker-data';

// Default subjects for A-level
export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'math', name: 'Mathematics', color: 'hsl(222, 47%, 20%)' },
  { id: 'physics', name: 'Physics', color: 'hsl(173, 58%, 39%)' },
  { id: 'it', name: 'Information Technology', color: 'hsl(38, 92%, 50%)' },
];

const DEFAULT_SETTINGS: AppSettings = {
  aiExtractionEnabled: false,
  aiFeaturesEnabled: false, // Disabled by default
  hasCompletedOnboarding: false,
};

export const getInitialState = (): AppState => ({
  subjects: DEFAULT_SUBJECTS,
  bullets: [],
  pastPapers: [],
  settings: DEFAULT_SETTINGS,
});

// Load data from localStorage with safe JSON parsing
export const loadData = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      // Use safe JSON parse to prevent prototype pollution
      const parsed = safeJSONParse<Record<string, unknown>>(stored);
      if (!parsed) {
        console.error('Failed to parse stored data safely');
        return getInitialState();
      }
      
      // Validate against schema
      const validation = appStateSchema.safeParse(parsed);
      if (validation.success) {
        return {
          subjects: validation.data.subjects.length > 0 ? validation.data.subjects as Subject[] : DEFAULT_SUBJECTS,
          bullets: validation.data.bullets as Bullet[],
          pastPapers: validation.data.pastPapers as PastPaper[],
          settings: { ...DEFAULT_SETTINGS, ...validation.data.settings },
        };
      }
      
      // Fallback: partial recovery for legacy data
      const parsedSubjects = Array.isArray(parsed.subjects) ? parsed.subjects : undefined;
      const subjects = parsedSubjects && parsedSubjects.length > 0 ? parsedSubjects as Subject[] : DEFAULT_SUBJECTS;
      return {
        subjects,
        bullets: Array.isArray(parsed.bullets) ? parsed.bullets as Bullet[] : [],
        pastPapers: Array.isArray(parsed.pastPapers) ? parsed.pastPapers as PastPaper[] : [],
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings as Partial<AppSettings> || {}) },
      };
    }
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
  }
  return getInitialState();
};

// Save data to localStorage
export const saveData = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
};

export const clearAllAppData = async (): Promise<void> => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }

  try {
    sessionStorage.clear();
  } catch (error) {
    console.error('Error clearing sessionStorage:', error);
  }

  try {
    await deleteAllIndexedDBDatabases();
  } catch (error) {
    console.error('Error deleting IndexedDB databases:', error);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getInitialState()));
  } catch (error) {
    console.error('Error writing empty state:', error);
  }
};

// Storage keys for component data
export const COMPONENTS_STORAGE_KEY = 'study-tracker-components';

// Backup format interface - version 4 includes chapter planning
interface BackupFormat {
  version: number;
  exportedAt: string;
  app: string;
  data: AppState;
  components?: Component[];
  subjectComponents?: SubjectComponent[];
  extractionChangelogs?: ExtractionChangelog[];
  chapterPlanning?: ChapterPlanning[];
}

// Export data as JSON for backup with versioning
// Version 4: includes chapter planning
export const exportAsJSON = (state: AppState): string => {
  const components = loadAndDedupeComponents();
  const subjectComponents = loadSubjectComponents();
  const extractionChangelogs = getExtractionChangelogs();
  const chapterPlanningData = loadChapterPlannings();
  
  const backup: BackupFormat = {
    version: 4,
    exportedAt: new Date().toISOString(),
    app: 'study-buddy-hub',
    data: state,
    components: components.length > 0 ? components : undefined,
    subjectComponents: subjectComponents.length > 0 ? subjectComponents : undefined,
    extractionChangelogs: extractionChangelogs.length > 0 ? extractionChangelogs : undefined,
    chapterPlanning: chapterPlanningData.length > 0 ? chapterPlanningData : undefined,
  };
  return JSON.stringify(backup, null, 2);
};

// Validate AppState schema
export const validateAppState = (data: unknown): data is AppState => {
  if (!data || typeof data !== 'object') return false;
  
  const state = data as Record<string, unknown>;
  
  // Check required top-level keys
  if (!state.subjects || !state.bullets || !state.pastPapers) {
    return false;
  }
  
  // Validate subjects array
  if (!Array.isArray(state.subjects)) return false;
  for (const subject of state.subjects) {
    if (typeof subject !== 'object' || !subject) return false;
    if (typeof (subject as Subject).id !== 'string') return false;
    if (typeof (subject as Subject).name !== 'string') return false;
    if (typeof (subject as Subject).color !== 'string') return false;
  }
  
  // Validate bullets array
  if (!Array.isArray(state.bullets)) return false;
  for (const bullet of state.bullets) {
    if (typeof bullet !== 'object' || !bullet) return false;
    if (typeof (bullet as Bullet).id !== 'string') return false;
    if (typeof (bullet as Bullet).subjectId !== 'string') return false;
    if (typeof (bullet as Bullet).bulletText !== 'string') return false;
  }
  
  // Validate pastPapers array
  if (!Array.isArray(state.pastPapers)) return false;
  for (const paper of state.pastPapers) {
    if (typeof paper !== 'object' || !paper) return false;
    if (typeof (paper as PastPaper).id !== 'string') return false;
    if (typeof (paper as PastPaper).subjectId !== 'string') return false;
    if (typeof (paper as PastPaper).year !== 'number') return false;
  }
  
  // Settings is optional but if present should be an object
  if (state.settings !== undefined && (typeof state.settings !== 'object' || !state.settings)) {
    return false;
  }
  
  return true;
};

// Import result type for better error handling
export type ImportResult =
  | {
      success: true;
      data: AppState;
      duplicatesRemoved: { bullets: number; papers: number; components: number; subjectComponents: number };
      warnings?: string[];
    }
  | {
      success: false;
      error: string;
    };

// Type guard for ImportResult
export function isImportSuccess(result: ImportResult): result is { 
  success: true; 
  data: AppState; 
  duplicatesRemoved: { bullets: number; papers: number; components: number; subjectComponents: number };
  warnings?: string[];
} {
  return result.success === true;
}

// Maximum backup file size (10MB)
const MAX_BACKUP_SIZE = 10 * 1024 * 1024;

// Import data from JSON with safe parsing, schema validation, and deduplication
// Merges with existing state to prevent duplicates after clear operations
export const importFromJSON = (jsonString: string, existingState?: AppState): ImportResult => {
  try {
    // Check file size before parsing
    if (jsonString.length > MAX_BACKUP_SIZE) {
      return {
        success: false,
        error: 'Backup file is too large. Maximum size is 10MB.',
      };
    }

    // Use safe JSON parse to prevent prototype pollution
    const parsed = safeJSONParse<unknown>(jsonString);
    if (!parsed) {
      return {
        success: false,
        error: 'Backup file is corrupted or contains invalid JSON.',
      };
    }

    // Handle both legacy format (raw AppState) and new format (wrapped with version)
    let appStateData: unknown;
    let importedComponents: Component[] = [];
    let importedSubjectComponents: SubjectComponent[] = [];
    let importedChangelogs: ExtractionChangelog[] = [];
    let importedChapterPlanning: ChapterPlanning[] = [];
    let backupVersion = 0;

    if (typeof parsed === 'object' && parsed !== null) {
      const obj = parsed as Record<string, unknown>;
      
      // Check if it's the new wrapped format (has version, data, and app fields)
      if ('version' in obj && 'data' in obj && 'app' in obj && typeof obj.version === 'number') {
        appStateData = obj.data;
        backupVersion = obj.version;
        // Extract components from v2+ backups
        if (Array.isArray(obj.components)) {
          importedComponents = obj.components as Component[];
        }
        // Extract subjectComponents from v3+ backups
        if (Array.isArray(obj.subjectComponents)) {
          importedSubjectComponents = obj.subjectComponents as SubjectComponent[];
        }
        // Extract extractionChangelogs from v3+ backups
        if (Array.isArray(obj.extractionChangelogs)) {
          importedChangelogs = obj.extractionChangelogs as ExtractionChangelog[];
        }
        // Extract chapterPlanning from v4+ backups
        if (Array.isArray(obj.chapterPlanning)) {
          importedChapterPlanning = obj.chapterPlanning as ChapterPlanning[];
        }
      } else {
        // Legacy format: raw AppState (treat as version 0)
        appStateData = parsed;
      }
    } else {
      return {
        success: false,
        error: 'Backup file has an invalid format.',
      };
    }

    // Validate against Zod schema
    const validation = appStateSchema.safeParse(appStateData);
    if (!validation.success) {
      const errorMessage = validation.error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      
      return {
        success: false,
        error: `Backup file is invalid or from a newer version. ${errorMessage}`,
      };
    }

    // Use validated data (not raw parsed)
    const validatedState = validation.data;

    // Load existing state if not provided (for merge deduplication)
    const currentState = existingState ?? loadData();

    // Merge settings with defaults, ensuring boolean types for dangerous flags
    const mergedSettings: AppSettings = { ...DEFAULT_SETTINGS, ...currentState.settings };
    if (validatedState.settings) {
      // Only merge valid boolean values for dangerous flags
      if (typeof validatedState.settings.aiExtractionEnabled === 'boolean') {
        mergedSettings.aiExtractionEnabled = validatedState.settings.aiExtractionEnabled;
      }
      if (typeof validatedState.settings.aiFeaturesEnabled === 'boolean') {
        mergedSettings.aiFeaturesEnabled = validatedState.settings.aiFeaturesEnabled;
      }
      if (typeof validatedState.settings.hasCompletedOnboarding === 'boolean') {
        mergedSettings.hasCompletedOnboarding = validatedState.settings.hasCompletedOnboarding;
      }
      // Merge other optional settings
      Object.keys(validatedState.settings).forEach(key => {
        if (!(key in mergedSettings)) {
          (mergedSettings as unknown as Record<string, unknown>)[key] = (validatedState.settings as unknown as Record<string, unknown>)[key];
        }
      });
    }

    // Merge subjects (prefer imported, but keep existing if imported is empty)
    // Type assertion is safe because Zod validation ensures required fields
    const mergedSubjects: Subject[] = validatedState.subjects.length > 0 
      ? (validatedState.subjects as Subject[])
      : (currentState.subjects.length > 0 ? currentState.subjects : DEFAULT_SUBJECTS);

    // CRITICAL FIX: Merge bullets and past papers with existing data, then deduplicate
    // This prevents duplicates when importing after clearing subject data
    // Type assertions are safe because Zod validation ensures required fields
    const mergedBullets: Bullet[] = [...currentState.bullets, ...(validatedState.bullets as Bullet[])];
    const mergedPapers: PastPaper[] = [...currentState.pastPapers, ...(validatedState.pastPapers as PastPaper[])];

    // Deduplicate the merged arrays (this removes duplicates between existing and imported)
    const bulletResult = deduplicateBullets(mergedBullets);
    const paperResult = deduplicatePastPapers(mergedPapers);

    // Handle components from v2+ backups - merge with existing and deduplicate
    // These are stored in study-tracker-components and used by useComponents hook
    let componentResult = { deduped: [] as Component[], removedCount: 0 };
    if (importedComponents.length > 0) {
      const existingComponents = loadAndDedupeComponents();
      const mergedComponents = [...existingComponents, ...importedComponents];
      componentResult = deduplicateComponents(mergedComponents);
      // Save to the correct storage key that useComponents reads from
      localStorage.setItem(COMPONENTS_STORAGE_KEY, JSON.stringify(componentResult.deduped));
    }

    // Handle subjectComponents from v3+ backups - merge with existing and deduplicate
    // These are stored in study-tracker-subject-components
    const subjectComponentResult = { count: 0, duplicatesRemoved: 0 };
    const warnings: string[] = [];
    
    if (importedSubjectComponents.length > 0) {
      const existingSubjectComponents = loadSubjectComponents();
      // Deduplicate by id AND by normalized key (subjectId + name)
      const existingIds = new Set(existingSubjectComponents.map(c => c.id));
      const existingKeys = new Set(existingSubjectComponents.map(c => 
        `${c.subjectId}|${c.name.toLowerCase().trim()}`
      ));
      const newComponents = importedSubjectComponents.filter(c => {
        const key = `${c.subjectId}|${c.name.toLowerCase().trim()}`;
        return !existingIds.has(c.id) && !existingKeys.has(key);
      });
      const merged = [...existingSubjectComponents, ...newComponents];
      subjectComponentResult.duplicatesRemoved = importedSubjectComponents.length - newComponents.length;
      subjectComponentResult.count = newComponents.length;
      saveSubjectComponents(merged);
    }

    // Handle extractionChangelogs from v3+ backups
    if (importedChangelogs.length > 0) {
      const existingChangelogs = getExtractionChangelogs();
      const existingIds = new Set(existingChangelogs.map(c => c.id));
      const newChangelogs = importedChangelogs.filter(c => !existingIds.has(c.id));
      const merged = [...existingChangelogs, ...newChangelogs];
      try {
        localStorage.setItem(CHANGELOG_KEY, JSON.stringify(merged));
      } catch (e) {
        console.warn('Failed to restore extraction changelogs:', e);
      }
    }

    // Handle chapterPlanning from v4+ backups
    if (importedChapterPlanning.length > 0) {
      const existing = loadChapterPlannings();
      const existingKeys = new Set(existing.map(p => `${p.subjectId}|${p.chapterKey}`));
      const newPlannings = importedChapterPlanning.filter(
        p => !existingKeys.has(`${p.subjectId}|${p.chapterKey}`)
      );
      if (newPlannings.length > 0) {
        saveChapterPlannings([...existing, ...newPlannings]);
      }
    }

    // Post-import verification: check if subjects have components in EITHER store
    const allSubjectComponents = loadSubjectComponents();
    const allComponents = loadAndDedupeComponents();
    const subjectsWithoutComponents = mergedSubjects.filter(s => {
      const hasSubjectComponent = allSubjectComponents.some(c => c.subjectId === s.id);
      const hasComponent = allComponents.some(c => c.subjectId === s.id);
      return !hasSubjectComponent && !hasComponent;
    });
    if (subjectsWithoutComponents.length > 0 && backupVersion < 3) {
      warnings.push(
        `${subjectsWithoutComponents.length} subject(s) have no paper components. ` +
        `You may need to import component metadata via CSV or configure in Settings.`
      );
    }

    const dedupedState: AppState = {
      subjects: mergedSubjects,
      bullets: bulletResult.deduped,
      pastPapers: paperResult.deduped,
      settings: mergedSettings,
    };

    return {
      success: true,
      data: dedupedState,
      duplicatesRemoved: {
        bullets: bulletResult.removedCount,
        papers: paperResult.removedCount,
        components: componentResult.removedCount,
        subjectComponents: subjectComponentResult.duplicatesRemoved,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    console.error('Error importing JSON:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to import backup: ${errorMessage}`,
    };
  }
};

// Export bullets as CSV
export const exportBulletsAsCSV = (bullets: Bullet[], subjects: Subject[]): string => {
  const headers = ['Subject', 'Main Topic', 'Subtopic', 'Bullet', 'Status', 'Comment', 'Done'];
  const rows = bullets.map(b => {
    const subject = subjects.find(s => s.id === b.subjectId);
    return [
      subject?.name || b.subjectId,
      b.mainTopic,
      b.subtopic,
      b.bulletText,
      b.status || '',
      b.comment,
      b.done ? 'Yes' : 'No',
    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
};

// Export past papers as CSV
export const exportPastPapersAsCSV = (papers: PastPaper[], subjects: Subject[]): string => {
  const headers = [
    'Subject',
    'Year',
    'Session',
    'Paper',
    'Variant',
    'ComponentId',
    'Completed',
    'RawScore',
    'TotalMarks',
    'Percentage',
    'Notes',
  ];
  const rows = papers.map(p => {
    const subject = subjects.find(s => s.id === p.subjectId);
    const percentage = p.percentageScore ?? p.score ?? '';
    return [
      subject?.name || p.subjectId,
      p.year,
      p.session,
      p.paper,
      p.variant || '',
      p.componentId || '',
      p.completed ? 'Yes' : 'No',
      p.rawScore ?? '',
      p.totalMarks ?? '',
      percentage,
      p.notes || p.comment || '',
    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
};

// Import bullets from CSV with validation and sanitization
export const importBulletsFromCSV = (csvString: string, subjects: Subject[]): Bullet[] => {
  // Validate input size (max 5MB of CSV data)
  if (csvString.length > 5 * 1024 * 1024) {
    throw new Error('CSV file is too large. Maximum size is 5MB.');
  }

  const lines = csvString.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];
  
  // Limit number of rows to prevent DoS
  const MAX_ROWS = 10000;
  if (lines.length > MAX_ROWS) {
    throw new Error(`CSV has too many rows (${lines.length}). Maximum is ${MAX_ROWS}.`);
  }

  const bullets: Bullet[] = [];
  const now = new Date().toISOString();

  // Header-based parsing so externally-generated syllabus CSVs work.
  const headerCells = parseCSVLine(lines[0]);
  const headerIndex = buildHeaderIndex(headerCells);

  let lockedSubject: Subject | undefined;
  let lockedSubjectRaw = '';

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    if (cells.length === 0) continue;

    const rawOutcomeText = getCellByHeader(cells, headerIndex, [
      'learning_outcome',
      'learning outcome',
      'outcome',
      'bullet',
      'bulletpoint',
      'bullet_point',
    ]);

    // If there's no learning_outcome text, this row does not represent a bullet point.
    if (!rawOutcomeText.trim()) continue;

    const rawMainTopic = getCellByHeader(cells, headerIndex, ['main_topic', 'main topic', 'topic', 'maintopic']);
    const rawSubtopic = getCellByHeader(cells, headerIndex, ['subtopic', 'sub topic', 'sub_topic']);
    const subjectNameOrId = getCellByHeader(cells, headerIndex, ['subject', 'subject_id', 'subjectid']);

    // Sanitize CSV cells to prevent formula injection
    const sanitizedOutcomeText = sanitizeCSVCell(rawOutcomeText);
    const sanitizedMainTopic = sanitizeCSVCell(rawMainTopic);
    const sanitizedSubtopic = sanitizeCSVCell(rawSubtopic);
    const sanitizedSubjectNameOrId = sanitizeCSVCell(subjectNameOrId);

    // Validate and sanitize the bullet data
    const validated = validateCSVBullet({
      bulletText: sanitizedOutcomeText,
      mainTopic: sanitizedMainTopic,
      subtopic: sanitizedSubtopic,
      subjectId: '',
    });

    if (!validated) {
      console.warn(`Skipping invalid row ${i + 1}: validation failed`);
      continue;
    }

    // Subject resolution is import-scoped and locked
    if (sanitizedSubjectNameOrId.trim()) {
      const sanitizedSubject = sanitizeText(sanitizedSubjectNameOrId, 100);
      const resolved = resolveSubject(sanitizedSubject, subjects);
      if (!resolved) {
        throw new Error(`Unknown subject: "${sanitizedSubject}". Please create/select the subject first or fix the CSV subject column.`);
      }
      if (!lockedSubject) {
        lockedSubject = resolved;
        lockedSubjectRaw = sanitizedSubject;
        bullets.forEach(b => {
          if (!b.subjectId) b.subjectId = lockedSubject!.id;
        });
      } else if (lockedSubject.id !== resolved.id) {
        throw new Error(
          `CSV contains multiple subjects (e.g. "${lockedSubjectRaw}" and "${sanitizedSubject}"). A single import must target exactly one subject.`,
        );
      }
      lockedSubjectRaw = sanitizedSubject;
    }

    bullets.push({
      id: `bullet-${Date.now()}-${i}`,
      subjectId: lockedSubject?.id || '',
      mainTopic: validated.mainTopic,
      subtopic: validated.subtopic,
      bulletText: validated.bulletText,
      status: null,
      comment: '',
      done: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (bullets.length > 0 && !lockedSubject) {
    if (subjects.length === 1) {
      bullets.forEach(b => {
        b.subjectId = subjects[0].id;
      });
    } else if (subjects.length === 0) {
      throw new Error('No subjects exist to import into. Create a subject first or include a subject column in the CSV.');
    } else {
      throw new Error('CSV does not specify a subject. Please add a subject column or ensure only one subject exists before importing.');
    }
  }

  // Deduplicate against existing bullets to prevent duplicates on re-import
  // This uses normalized keys: subjectId|mainTopic|subtopic|bulletText (lowercase, trimmed)
  const existingState = loadData();
  const existingKeys = new Set(
    existingState.bullets.map(b => 
      `${b.subjectId}|${b.mainTopic}|${b.subtopic}|${b.bulletText}`.toLowerCase().trim()
    )
  );
  
  const dedupedBullets = bullets.filter(b => {
    const key = `${b.subjectId}|${b.mainTopic}|${b.subtopic}|${b.bulletText}`.toLowerCase().trim();
    if (existingKeys.has(key)) {
      return false; // Skip duplicate
    }
    existingKeys.add(key); // Also dedupe within the import itself
    return true;
  });

  const duplicatesRemoved = bullets.length - dedupedBullets.length;
  if (duplicatesRemoved > 0) {
    console.log(`CSV Import: Skipped ${duplicatesRemoved} duplicate bullet(s)`);
  }

  return dedupedBullets;
};

const normalizeHeader = (value: string): string => {
  return value
    .replace(/^"|"$/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const buildHeaderIndex = (headers: string[]): Record<string, number> => {
  const index: Record<string, number> = {};
  headers.forEach((h, i) => {
    const normalized = normalizeHeader(h);
    if (normalized) index[normalized] = i;
  });
  return index;
};

const getCellByHeader = (
  cells: string[],
  headerIndex: Record<string, number>,
  possibleHeaders: string[],
): string => {
  for (const header of possibleHeaders) {
    const idx = headerIndex[normalizeHeader(header)];
    if (idx !== undefined && idx < cells.length) {
      return (cells[idx] ?? '').trim();
    }
  }
  return '';
};

const resolveSubject = (subjectValue: string, subjects: Subject[]): Subject | undefined => {
  const v = subjectValue.trim();
  if (!v) return undefined;
  const byId = subjects.find(s => s.id.toLowerCase() === v.toLowerCase());
  if (byId) return byId;
  const byName = subjects.find(s => s.name.toLowerCase() === v.toLowerCase());
  if (byName) return byName;
  return undefined;
};

const deleteAllIndexedDBDatabases = async (): Promise<void> => {
  if (typeof indexedDB === 'undefined') return;

  const deleteDb = (name: string) =>
    new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve();
    });

  const anyIndexedDB = indexedDB as unknown as { databases?: () => Promise<Array<{ name?: string }>> };
  if (typeof anyIndexedDB.databases === 'function') {
    const dbs = await anyIndexedDB.databases();
    await Promise.all(
      (dbs || [])
        .map(d => d.name)
        .filter((n): n is string => Boolean(n))
        .map(deleteDb),
    );
  }
};

// Helper to parse CSV line (handles quoted fields)
const parseCSVLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  cells.push(current.trim());
  return cells;
};

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
