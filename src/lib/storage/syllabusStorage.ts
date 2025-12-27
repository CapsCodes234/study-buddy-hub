/**
 * Syllabus Storage - Import/save helpers with validation and changelog
 */

import { ExtractionResult, ExtractionChangelog, SubjectComponent } from '@/types/syllabus';
import { DEFAULT_SUBJECTS, generateId } from '@/lib/storage';

const CHANGELOG_KEY = 'study-tracker-extraction-changelog';
const COMPONENTS_KEY = 'study-tracker-subject-components';
const APP_STATE_KEY = 'study-tracker-data';

/**
 * Save extraction to changelog (before user edits)
 */
export function saveExtractionToChangelog(
  subjectId: string,
  extraction: ExtractionResult
): ExtractionChangelog {
  const changelog: ExtractionChangelog = {
    id: generateId(),
    subjectId,
    originalExtraction: extraction,
    createdAt: new Date().toISOString(),
  };
  
  const existing = getExtractionChangelogs();
  existing.push(changelog);
  
  try {
    localStorage.setItem(CHANGELOG_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Error saving extraction changelog:', error);
  }
  
  return changelog;
}

/**
 * Update changelog with edited extraction after user saves
 */
export function updateChangelogWithEdits(
  changelogId: string,
  editedExtraction: ExtractionResult
): void {
  const changelogs = getExtractionChangelogs();
  const index = changelogs.findIndex(c => c.id === changelogId);
  
  if (index >= 0) {
    changelogs[index].editedExtraction = editedExtraction;
    changelogs[index].savedAt = new Date().toISOString();
    
    try {
      localStorage.setItem(CHANGELOG_KEY, JSON.stringify(changelogs));
    } catch (error) {
      console.error('Error updating extraction changelog:', error);
    }
  }
}

/**
 * Get all extraction changelogs
 */
export function getExtractionChangelogs(): ExtractionChangelog[] {
  try {
    const stored = localStorage.getItem(CHANGELOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading extraction changelogs:', error);
    return [];
  }
}

/**
 * Get changelogs for a specific subject
 */
export function getSubjectChangelogs(subjectId: string): ExtractionChangelog[] {
  return getExtractionChangelogs().filter(c => c.subjectId === subjectId);
}

/**
 * Save subject components
 */
export function saveSubjectComponents(components: SubjectComponent[]): void {
  try {
    localStorage.setItem(COMPONENTS_KEY, JSON.stringify(components));
  } catch (error) {
    console.error('Error saving subject components:', error);
  }
}

/**
 * Load subject components
 */
export function loadSubjectComponents(): SubjectComponent[] {
  try {
    const stored = localStorage.getItem(COMPONENTS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;

    const seeded = seedDefaultComponents();
    return seeded;
  } catch (error) {
    console.error('Error loading subject components:', error);
    return [];
  }
}

function seedDefaultComponents(): SubjectComponent[] {
  const subjects = getStoredSubjects();
  const components: SubjectComponent[] = [];

  for (const subject of subjects) {
    const defaults = getDefaultComponents(subject.name);
    defaults.forEach((partial, index) => {
      const orderNumber = partial.orderNumber ?? index + 1;
      components.push({
        id: `component-${subject.id}-${orderNumber}`,
        subjectId: subject.id,
        name: partial.name || `Paper ${orderNumber}`,
        totalMarks: partial.totalMarks ?? 100,
        weight: partial.weight,
        orderNumber,
      });
    });
  }

  saveSubjectComponents(components);
  return components;
}

function getStoredSubjects(): { id: string; name: string }[] {
  try {
    const stored = localStorage.getItem(APP_STATE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as { subjects?: unknown };
      if (Array.isArray(parsed.subjects) && parsed.subjects.length > 0) {
        return parsed.subjects
          .map(s => s as { id?: string; name?: string })
          .filter(s => typeof s.id === 'string' && typeof s.name === 'string') as { id: string; name: string }[];
      }
    }
  } catch {
    // Fall through to defaults
  }
  return DEFAULT_SUBJECTS.map(s => ({ id: s.id, name: s.name }));
}

/**
 * Get components for a specific subject
 */
export function getSubjectComponentsById(subjectId: string): SubjectComponent[] {
  return loadSubjectComponents().filter(c => c.subjectId === subjectId);
}

/**
 * Add or update a component
 */
export function upsertComponent(component: SubjectComponent): void {
  const components = loadSubjectComponents();
  const index = components.findIndex(c => c.id === component.id);
  
  if (index >= 0) {
    components[index] = component;
  } else {
    components.push(component);
  }
  
  saveSubjectComponents(components);
}

/**
 * Delete a component
 */
export function deleteComponent(componentId: string): void {
  const components = loadSubjectComponents().filter(c => c.id !== componentId);
  saveSubjectComponents(components);
}

/**
 * Validate extraction result structure
 */
export function validateExtractionResult(data: unknown): data is ExtractionResult {
  if (!data || typeof data !== 'object') return false;
  
  const result = data as Record<string, unknown>;
  
  if (typeof result.subject !== 'string') return false;
  if (typeof result.subjectConfidence !== 'number') return false;
  if (!Array.isArray(result.topics)) return false;
  if (!Array.isArray(result.components)) return false;
  if (typeof result.extractedAt !== 'string') return false;
  
  // Validate topics structure
  for (const topic of result.topics) {
    if (typeof topic !== 'object' || !topic) return false;
    if (typeof (topic as { name: string }).name !== 'string') return false;
    if (!Array.isArray((topic as { subtopics: unknown[] }).subtopics)) return false;
  }
  
  return true;
}

/**
 * Create default components for common subjects
 */
export function getDefaultComponents(subjectName: string): Partial<SubjectComponent>[] {
  const defaults: Record<string, Partial<SubjectComponent>[]> = {
    'Mathematics': [
      { name: 'Paper 1 (Pure Mathematics 1)', totalMarks: 75, orderNumber: 1 },
      { name: 'Paper 3 (Pure Mathematics 3)', totalMarks: 75, orderNumber: 2 },
      { name: 'Paper 4 (Mechanics)', totalMarks: 50, orderNumber: 3 },
      { name: 'Paper 5 (Statistics)', totalMarks: 50, orderNumber: 4 },
    ],
    'Physics': [
      { name: 'Paper 1 (Multiple Choice)', totalMarks: 40, orderNumber: 1 },
      { name: 'Paper 2 (AS Structured Questions)', totalMarks: 60, orderNumber: 2 },
      { name: 'Paper 3 (Advanced Practical)', totalMarks: 40, orderNumber: 3 },
      { name: 'Paper 4 (A2 Structured Questions)', totalMarks: 100, orderNumber: 4 },
      { name: 'Paper 5 (Planning/Analysis)', totalMarks: 30, orderNumber: 5 },
    ],
    'Information Technology': [
      { name: 'Paper 3 (Adv. Theory)', totalMarks: 70, orderNumber: 1 },
      { name: 'Paper 4 (Adv. Practical)', totalMarks: 90, orderNumber: 2 },
    ],
  };
  
  // Try exact match first, then partial match
  if (defaults[subjectName]) return defaults[subjectName];
  
  const lowerName = subjectName.toLowerCase();
  for (const [key, value] of Object.entries(defaults)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return value;
    }
  }
  
  // Generic default
  return [
    { name: 'Paper 1', totalMarks: 100, orderNumber: 1 },
    { name: 'Paper 2', totalMarks: 100, orderNumber: 2 },
  ];
}
