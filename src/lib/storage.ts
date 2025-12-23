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

// Load data from localStorage
export const loadData = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const parsedSubjects = Array.isArray(parsed.subjects) ? parsed.subjects : undefined;
      const subjects = parsedSubjects && parsedSubjects.length > 0 ? parsedSubjects : DEFAULT_SUBJECTS;
      return {
        subjects,
        bullets: parsed.bullets || [],
        pastPapers: parsed.pastPapers || [],
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
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

// Export data as JSON for backup
export const exportAsJSON = (state: AppState): string => {
  return JSON.stringify(state, null, 2);
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

// Import data from JSON with schema validation
export const importFromJSON = (jsonString: string): AppState | null => {
  try {
    const parsed = JSON.parse(jsonString);
    if (validateAppState(parsed)) {
      // Merge with defaults to ensure all required fields exist
      return {
        subjects: parsed.subjects || DEFAULT_SUBJECTS,
        bullets: parsed.bullets || [],
        pastPapers: parsed.pastPapers || [],
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      };
    }
    throw new Error('Invalid data structure: missing required keys or invalid types');
  } catch (error) {
    console.error('Error importing JSON:', error);
    return null;
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
  const headers = ['Subject', 'Year', 'Session', 'Paper', 'Variant', 'Completed', 'Score', 'Comment'];
  const rows = papers.map(p => {
    const subject = subjects.find(s => s.id === p.subjectId);
    return [
      subject?.name || p.subjectId,
      p.year,
      p.session,
      p.paper,
      p.variant || '',
      p.completed ? 'Yes' : 'No',
      p.score ?? '',
      p.comment || '',
    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
};

// Import bullets from CSV
export const importBulletsFromCSV = (csvString: string, subjects: Subject[]): Bullet[] => {
  const lines = csvString.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];

  const bullets: Bullet[] = [];
  const now = new Date().toISOString();

  // Header-based parsing so externally-generated syllabus CSVs work.
  // Mapping: `learning_outcome` (or app-exported `Bullet`) -> Bullet.bulletText
  //          `main_topic` (or app-exported `Main Topic`) -> Bullet.mainTopic
  //          `subtopic` (or app-exported `Subtopic`) -> Bullet.subtopic
  const headerCells = parseCSVLine(lines[0]);
  const headerIndex = buildHeaderIndex(headerCells);

  let lockedSubject: Subject | undefined;
  let lockedSubjectRaw = '';

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    if (cells.length === 0) continue;

    const outcomeText = getCellByHeader(cells, headerIndex, [
      'learning_outcome',
      'learning outcome',
      'outcome',
      'bullet',
      'bulletpoint',
      'bullet_point',
    ]);

    // If there's no learning_outcome text, this row does not represent a bullet point.
    if (!outcomeText.trim()) continue;

    const mainTopic = getCellByHeader(cells, headerIndex, ['main_topic', 'main topic', 'topic', 'maintopic']);
    const subtopic = getCellByHeader(cells, headerIndex, ['subtopic', 'sub topic', 'sub_topic']);

    // Subject resolution is import-scoped and locked:
    // - If any row specifies a subject, we lock that subject for the entire import.
    // - The import must never write to more than one subject.
    const subjectNameOrId = getCellByHeader(cells, headerIndex, ['subject', 'subject_id', 'subjectid']);
    if (subjectNameOrId.trim()) {
      const resolved = resolveSubject(subjectNameOrId, subjects);
      if (!resolved) {
        throw new Error(`Unknown subject: "${subjectNameOrId}". Please create/select the subject first or fix the CSV subject column.`);
      }
      if (!lockedSubject) {
        lockedSubject = resolved;
        lockedSubjectRaw = subjectNameOrId;
        bullets.forEach(b => {
          if (!b.subjectId) b.subjectId = lockedSubject!.id;
        });
      } else if (lockedSubject.id !== resolved.id) {
        throw new Error(
          `CSV contains multiple subjects (e.g. "${lockedSubjectRaw}" and "${subjectNameOrId}"). A single import must target exactly one subject.`,
        );
      }
    }

    bullets.push({
      id: `bullet-${Date.now()}-${i}`,
      subjectId: lockedSubject?.id || '',
      mainTopic: mainTopic || '',
      subtopic: subtopic || '',
      bulletText: outcomeText,
      status: null,
      comment: '',
      done: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (bullets.length > 0 && !lockedSubject) {
    // If the CSV didn't specify a subject, we refuse to guess when multiple subjects exist.
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

  return bullets;
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
