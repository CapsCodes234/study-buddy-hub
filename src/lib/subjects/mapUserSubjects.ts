/**
 * User Subject Mapping
 * 
 * Maps Supabase user_subject rows (with joins) to the UI Subject model.
 * Handles name resolution, stable UI ID generation, and metadata attachment.
 */

import type { Subject } from '@/types';
import type { Database } from '@/integrations/supabase/types';
import {
  catalogueSlugToUiId,
  customSubjectToUiId,
  getFallbackColor,
} from './catalogueUiIds';

type UserSubjectRow = Database['public']['Tables']['user_subjects']['Row'];
type CatalogueSubjectRow = Database['public']['Tables']['catalogue_subjects']['Row'];
type CustomSubjectRow = Database['public']['Tables']['custom_subjects']['Row'];

/**
 * Joined user subject data with catalogue and custom subject details
 */
export interface JoinedUserSubject {
  userSubject: UserSubjectRow;
  catalogueSubject?: CatalogueSubjectRow | null;
  customSubject?: CustomSubjectRow | null;
}

/**
 * Map a joined user subject row to the UI Subject model
 * 
 * Name precedence:
 * 1. display_name_override
 * 2. catalogue subject name
 * 3. custom subject name
 * 
 * @param joined - The joined user subject data
 * @returns The mapped Subject for the UI
 */
export function mapUserSubjectToSubject(joined: JoinedUserSubject): Subject {
  const { userSubject, catalogueSubject, customSubject } = joined;

  // Determine the display name
  let displayName: string;
  if (userSubject.display_name_override && userSubject.display_name_override.trim()) {
    displayName = userSubject.display_name_override.trim();
  } else if (catalogueSubject) {
    displayName = catalogueSubject.name;
  } else if (customSubject) {
    displayName = customSubject.name;
  } else {
    displayName = 'Unknown Subject';
  }

  // Generate stable UI ID
  let uiId: string;
  if (catalogueSubject) {
    uiId = catalogueSlugToUiId(catalogueSubject.slug);
  } else if (customSubject) {
    uiId = customSubjectToUiId(customSubject.id);
  } else {
    // Fallback - should not happen with proper constraints
    uiId = userSubject.id;
  }

  // Determine source
  const source: 'catalogue' | 'custom' | 'local' = catalogueSubject
    ? 'catalogue'
    : customSubject
    ? 'custom'
    : 'local';

  // Get color (use fallback for now - could be stored in DB later)
  const color = getFallbackColor(uiId);

  return {
    id: uiId,
    name: displayName,
    color,
    userSubjectId: userSubject.id,
    catalogueSubjectId: userSubject.catalogue_subject_id || undefined,
    customSubjectId: userSubject.custom_subject_id || undefined,
    syllabusVersionId: userSubject.syllabus_version_id || undefined,
    catalogueCode: catalogueSubject?.code || undefined,
    catalogueSlug: catalogueSubject?.slug || undefined,
    source,
    sortOrder: userSubject.sort_order,
    version: userSubject.version,
  };
}

/**
 * Map an array of joined user subjects to UI Subjects
 * Sorts by sort_order ascending
 * 
 * @param joinedSubjects - Array of joined user subject data
 * @returns Array of mapped Subjects sorted by sort_order
 */
export function mapUserSubjectsToSubjects(
  joinedSubjects: JoinedUserSubject[]
): Subject[] {
  return joinedSubjects
    .map(mapUserSubjectToSubject)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

/**
 * Extract the catalogue subject ID from a UI Subject
 * 
 * @param subject - The UI Subject
 * @returns The catalogue subject ID, or null if not a catalogue subject
 */
export function getCatalogueSubjectId(subject: Subject): string | null {
  if (subject.source !== 'catalogue') {
    return null;
  }
  return subject.catalogueSubjectId || null;
}

/**
 * Extract the custom subject ID from a UI Subject
 * 
 * @param subject - The UI Subject
 * @returns The custom subject ID, or null if not a custom subject
 */
export function getCustomSubjectId(subject: Subject): string | null {
  if (subject.source !== 'custom') {
    return null;
  }
  return subject.customSubjectId || null;
}
