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
      return {
        subjects: parsed.subjects || DEFAULT_SUBJECTS,
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

// Export data as JSON for backup
export const exportAsJSON = (state: AppState): string => {
  return JSON.stringify(state, null, 2);
};

// Import data from JSON
export const importFromJSON = (jsonString: string): AppState | null => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.subjects && parsed.bullets && parsed.pastPapers) {
      return parsed as AppState;
    }
    throw new Error('Invalid data structure');
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
  const lines = csvString.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const bullets: Bullet[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    if (cells.length >= 4) {
      const subjectName = cells[0];
      const subject = subjects.find(s => 
        s.name.toLowerCase() === subjectName.toLowerCase()
      );
      
      if (subject) {
        bullets.push({
          id: `bullet-${Date.now()}-${i}`,
          subjectId: subject.id,
          mainTopic: cells[1] || '',
          subtopic: cells[2] || '',
          bulletText: cells[3] || '',
          status: null,
          comment: '',
          done: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }
  
  return bullets;
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
