/**
 * Subjects API Layer
 * 
 * Data access functions for subject-related Supabase operations.
 * Uses approved RPCs for mutations and proper joins for queries.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { subjectQueryKeys } from './queryKeys';
import type { JoinedUserSubject } from '@/lib/subjects/mapUserSubjects';

type CatalogueSubject = Database['public']['Tables']['catalogue_subjects']['Row'];
type UserSubject = Database['public']['Tables']['user_subjects']['Row'];
type CustomSubject = Database['public']['Tables']['custom_subjects']['Row'];
type SyllabusVersion = Database['public']['Tables']['syllabus_versions']['Row'];

/**
 * Fetch active catalogue subjects
 * 
 * @returns Promise resolving to array of active catalogue subjects
 */
export async function fetchCatalogueSubjects(): Promise<CatalogueSubject[]> {
  const { data, error } = await supabase
    .from('catalogue_subjects')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    throw new Error(`Failed to fetch catalogue subjects: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch active user subjects with joins
 * 
 * @param userId - The user ID
 * @returns Promise resolving to array of joined user subject data
 */
export async function fetchUserSubjects(
  userId: string
): Promise<JoinedUserSubject[]> {
  const { data, error } = await supabase
    .from('user_subjects')
    .select(`
      *,
      catalogue_subjects (*),
      custom_subjects (*)
    `)
    .eq('user_id', userId)
    .eq('is_archived', false)
    .is('deleted_at', null)
    .order('sort_order');

  if (error) {
    throw new Error(`Failed to fetch user subjects: ${error.message}`);
  }

  return (data || []).map(row => ({
    userSubject: row,
    catalogueSubject: row.catalogue_subjects,
    customSubject: row.custom_subjects,
  }));
}

/**
 * Fetch archived user subjects with joins
 * 
 * @param userId - The user ID
 * @returns Promise resolving to array of joined archived user subject data
 */
export async function fetchArchivedUserSubjects(
  userId: string
): Promise<JoinedUserSubject[]> {
  const { data, error } = await supabase
    .from('user_subjects')
    .select(`
      *,
      catalogue_subjects (*),
      custom_subjects (*)
    `)
    .eq('user_id', userId)
    .eq('is_archived', true)
    .is('deleted_at', null)
    .order('sort_order');

  if (error) {
    throw new Error(`Failed to fetch archived user subjects: ${error.message}`);
  }

  return (data || []).map(row => ({
    userSubject: row,
    catalogueSubject: row.catalogue_subjects,
    customSubject: row.custom_subjects,
  }));
}

/**
 * Find an archived user subject by catalogue subject ID
 * 
 * @param userId - The user ID
 * @param catalogueSubjectId - The catalogue subject ID
 * @returns Promise resolving to the archived user subject or null
 */
export async function findArchivedUserSubjectByCatalogueId(
  userId: string,
  catalogueSubjectId: string
): Promise<JoinedUserSubject | null> {
  const { data, error } = await supabase
    .from('user_subjects')
    .select(`
      *,
      catalogue_subjects (*),
      custom_subjects (*)
    `)
    .eq('user_id', userId)
    .eq('catalogue_subject_id', catalogueSubjectId)
    .eq('is_archived', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to find archived user subject: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    userSubject: data,
    catalogueSubject: data.catalogue_subjects,
    customSubject: data.custom_subjects,
  };
}

/**
 * Find an archived user subject by custom subject ID
 * 
 * @param userId - The user ID
 * @param customSubjectId - The custom subject ID
 * @returns Promise resolving to the archived user subject or null
 */
export async function findArchivedUserSubjectByCustomId(
  userId: string,
  customSubjectId: string
): Promise<JoinedUserSubject | null> {
  const { data, error } = await supabase
    .from('user_subjects')
    .select(`
      *,
      catalogue_subjects (*),
      custom_subjects (*)
    `)
    .eq('user_id', userId)
    .eq('custom_subject_id', customSubjectId)
    .eq('is_archived', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to find archived user subject: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    userSubject: data,
    catalogueSubject: data.catalogue_subjects,
    customSubject: data.custom_subjects,
  };
}

/**
 * Fetch active syllabus version for a catalogue subject
 * 
 * @param catalogueSubjectId - The catalogue subject ID
 * @returns Promise resolving to the active syllabus version or null
 */
export async function fetchActiveSyllabusVersion(
  catalogueSubjectId: string
): Promise<SyllabusVersion | null> {
  // First get the syllabus ID from the catalogue subject
  const { data: catalogueData, error: catalogueError } = await supabase
    .from('catalogue_subjects')
    .select('id')
    .eq('id', catalogueSubjectId)
    .single();

  if (catalogueError) {
    throw new Error(`Failed to fetch catalogue subject: ${catalogueError.message}`);
  }

  // Then get the syllabus
  const { data: syllabusData, error: syllabusError } = await supabase
    .from('syllabuses')
    .select('id')
    .eq('catalogue_subject_id', catalogueSubjectId)
    .eq('is_active', true)
    .single();

  if (syllabusError) {
    // No syllabus exists yet - this is allowed
    return null;
  }

  // Get the active syllabus version
  const { data, error } = await supabase
    .from('syllabus_versions')
    .select('*')
    .eq('syllabus_id', syllabusData.id)
    .eq('status', 'active')
    .order('valid_from_year', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch syllabus version: ${error.message}`);
  }

  return data;
}

/**
 * Create a catalogue user subject
 * 
 * @param catalogueSubjectId - The catalogue subject ID
 * @param syllabusVersionId - Optional syllabus version ID
 * @param sortOrder - Optional sort order
 * @returns Promise resolving to the created user subject
 */
export async function createCatalogueUserSubject(
  catalogueSubjectId: string,
  syllabusVersionId: string | null = null,
  sortOrder: number = 0
): Promise<UserSubject> {
  const clientOperationId = crypto.randomUUID();

  const { data, error } = await supabase.rpc('create_user_subject', {
    p_catalogue_subject_id: catalogueSubjectId,
    p_syllabus_version_id: syllabusVersionId,
    p_sort_order: sortOrder,
    p_client_operation_id: clientOperationId,
  });

  if (error) {
    throw new Error(`Failed to create user subject: ${error.message}`);
  }

  return data;
}

/**
 * Create a custom subject definition
 * 
 * @param name - The custom subject name
 * @param code - Optional subject code
 * @param qualificationLabel - Optional qualification label
 * @param description - Optional description
 * @returns Promise resolving to the created custom subject
 */
export async function createCustomSubject(
  name: string,
  code: string | null = null,
  qualificationLabel: string | null = null,
  description: string | null = null
): Promise<CustomSubject> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error('Authentication required');
  }

  const clientOperationId = crypto.randomUUID();

  const { data, error } = await supabase
    .from('custom_subjects')
    .insert({
      user_id: userData.user.id,
      name,
      code,
      qualification_label: qualificationLabel,
      description,
      client_operation_id: clientOperationId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create custom subject: ${error.message}`);
  }

  return data;
}

/**
 * Create a custom user subject
 * 
 * @param customSubjectId - The custom subject ID
 * @param sortOrder - Optional sort order
 * @returns Promise resolving to the created user subject
 */
export async function createCustomUserSubject(
  customSubjectId: string,
  sortOrder: number = 0
): Promise<UserSubject> {
  const clientOperationId = crypto.randomUUID();

  const { data, error } = await supabase.rpc('create_user_subject', {
    p_custom_subject_id: customSubjectId,
    p_sort_order: sortOrder,
    p_client_operation_id: clientOperationId,
  });

  if (error) {
    throw new Error(`Failed to create user subject: ${error.message}`);
  }

  return data;
}

/**
 * Archive a user subject
 * 
 * @param userSubjectId - The user subject ID
 * @param baseVersion - The current version for optimistic locking
 * @returns Promise resolving to the updated user subject
 */
export async function archiveUserSubject(
  userSubjectId: string,
  baseVersion: number
): Promise<UserSubject> {
  const { data, error } = await supabase.rpc('set_user_subject_archived', {
    p_subject_id: userSubjectId,
    p_archived: true,
    p_base_version: baseVersion,
  });

  if (error) {
    throw new Error(`Failed to archive user subject: ${error.message}`);
  }

  return data;
}

/**
 * Restore an archived user subject
 * 
 * @param userSubjectId - The user subject ID
 * @param baseVersion - The current version for optimistic locking
 * @returns Promise resolving to the updated user subject
 */
export async function restoreUserSubject(
  userSubjectId: string,
  baseVersion: number
): Promise<UserSubject> {
  const { data, error } = await supabase.rpc('set_user_subject_archived', {
    p_subject_id: userSubjectId,
    p_archived: false,
    p_base_version: baseVersion,
  });

  if (error) {
    throw new Error(`Failed to restore user subject: ${error.message}`);
  }

  return data;
}

/**
 * Soft delete a custom subject
 * 
 * @param customSubjectId - The custom subject ID
 * @param baseVersion - The current version for optimistic locking
 * @returns Promise resolving to the deleted custom subject
 */
export async function softDeleteCustomSubject(
  customSubjectId: string,
  baseVersion: number
): Promise<CustomSubject> {
  const { data, error } = await supabase.rpc('soft_delete_custom_subject', {
    p_custom_subject_id: customSubjectId,
    p_base_version: baseVersion,
  });

  if (error) {
    throw new Error(`Failed to delete custom subject: ${error.message}`);
  }

  return data;
}

/**
 * Update a custom subject
 * 
 * @param customSubjectId - The custom subject ID
 * @param baseVersion - The current version for optimistic locking
 * @param name - The new name
 * @param code - Optional new code
 * @param qualificationLabel - Optional new qualification label
 * @param description - Optional new description
 * @returns Promise resolving to the updated custom subject
 */
export async function updateCustomSubject(
  customSubjectId: string,
  baseVersion: number,
  name: string,
  code: string | null = null,
  qualificationLabel: string | null = null,
  description: string | null = null
): Promise<CustomSubject> {
  const { data, error } = await supabase.rpc('update_custom_subject_if_version', {
    p_subject_id: customSubjectId,
    p_base_version: baseVersion,
    p_name: name,
    p_code: code,
    p_qualification_label: qualificationLabel,
    p_description: description,
  });

  if (error) {
    throw new Error(`Failed to update custom subject: ${error.message}`);
  }

  return data;
}
