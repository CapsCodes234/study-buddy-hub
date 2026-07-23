/**
 * useSubjectMutations Hook
 * 
 * TanStack Query mutations for subject operations.
 * Handles archive/restore, custom subject creation, and proper rollback on failure.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  createCatalogueUserSubject,
  createCustomSubject,
  createCustomUserSubject,
  archiveUserSubject,
  restoreUserSubject,
  softDeleteCustomSubject,
  updateCustomSubject,
  findArchivedUserSubjectByCatalogueId,
  findArchivedUserSubjectByCustomId,
  fetchActiveSyllabusVersion,
} from './subjectsApi';
import { subjectQueryKeys } from './queryKeys';
import type { Subject } from '@/types';

/**
 * Hook for subject mutations
 * 
 * @returns Object containing mutation functions
 */
export function useSubjectMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  /**
   * Add a catalogue subject
   * Checks for archived row first, restores if found, otherwise creates new
   */
  const addCatalogueSubject = useMutation({
    mutationFn: async (catalogueSubjectId: string) => {
      if (!userId) throw new Error('Authentication required');

      // Check for archived row first
      const archived = await findArchivedUserSubjectByCatalogueId(
        userId,
        catalogueSubjectId
      );

      if (archived) {
        // Restore existing archived row
        return await restoreUserSubject(archived.userSubject.id, archived.userSubject.version);
      }

      // Resolve active syllabus version if available
      const syllabusVersion = await fetchActiveSyllabusVersion(catalogueSubjectId);

      // Create new user subject
      return await createCatalogueUserSubject(
        catalogueSubjectId,
        syllabusVersion?.id || null
      );
    },
    onSuccess: () => {
      // Invalidate user subject queries
      if (userId) {
        queryClient.invalidateQueries({ queryKey: subjectQueryKeys.user(userId) });
        queryClient.invalidateQueries({ queryKey: subjectQueryKeys.userArchived(userId) });
      }
    },
  });

  /**
   * Add a custom subject
   * Creates custom definition first, then user subject with rollback on failure
   */
  const addCustomSubject = useMutation({
    mutationFn: async (params: {
      name: string;
      code?: string;
      qualificationLabel?: string;
      description?: string;
    }) => {
      if (!userId) throw new Error('Authentication required');

      let customSubjectId: string;

      try {
        // Step 1: Create custom definition
        const customSubject = await createCustomSubject(
          params.name,
          params.code || null,
          params.qualificationLabel || null,
          params.description || null
        );
        customSubjectId = customSubject.id;

        // Step 2: Create user subject
        await createCustomUserSubject(customSubjectId);

        return customSubject;
      } catch (error) {
        // Step 3: Rollback custom definition if user subject creation failed
        if (customSubjectId) {
          try {
            // Fetch the custom subject to get its version
            const { data: customData, error: fetchError } = await supabase
              .from('custom_subjects')
              .select('version')
              .eq('id', customSubjectId)
              .single();

            if (!fetchError && customData) {
              await softDeleteCustomSubject(customSubjectId, customData.version);
            }
          } catch (rollbackError) {
            console.error('Failed to rollback custom subject:', rollbackError);
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate user subject queries
      if (userId) {
        queryClient.invalidateQueries({ queryKey: subjectQueryKeys.user(userId) });
      }
    },
  });

  /**
   * Remove a subject (archive, not soft-delete)
   */
  const removeSubject = useMutation({
    mutationFn: async (subject: Subject) => {
      if (!subject.userSubjectId) {
        throw new Error('Subject has no user subject ID');
      }

      return await archiveUserSubject(
        subject.userSubjectId,
        subject.version || 0
      );
    },
    onSuccess: () => {
      // Invalidate user subject queries
      if (userId) {
        queryClient.invalidateQueries({ queryKey: subjectQueryKeys.user(userId) });
        queryClient.invalidateQueries({ queryKey: subjectQueryKeys.userArchived(userId) });
      }
    },
  });

  /**
   * Restore an archived subject
   */
  const restoreSubject = useMutation({
    mutationFn: async (subject: Subject) => {
      if (!subject.userSubjectId) {
        throw new Error('Subject has no user subject ID');
      }

      return await restoreUserSubject(
        subject.userSubjectId,
        subject.version || 0
      );
    },
    onSuccess: () => {
      // Invalidate user subject queries
      if (userId) {
        queryClient.invalidateQueries({ queryKey: subjectQueryKeys.user(userId) });
        queryClient.invalidateQueries({ queryKey: subjectQueryKeys.userArchived(userId) });
      }
    },
  });

  /**
   * Update a custom subject
   */
  const updateCustomSubjectMutation = useMutation({
    mutationFn: async (params: {
      customSubjectId: string;
      baseVersion: number;
      name: string;
      code?: string;
      qualificationLabel?: string;
      description?: string;
    }) => {
      return await updateCustomSubject(
        params.customSubjectId,
        params.baseVersion,
        params.name,
        params.code || null,
        params.qualificationLabel || null,
        params.description || null
      );
    },
    onSuccess: () => {
      // Invalidate user subject queries
      if (userId) {
        queryClient.invalidateQueries({ queryKey: subjectQueryKeys.user(userId) });
      }
    },
  });

  /**
   * Delete a custom subject definition
   */
  const deleteCustomSubjectMutation = useMutation({
    mutationFn: async (params: { customSubjectId: string; baseVersion: number }) => {
      return await softDeleteCustomSubject(
        params.customSubjectId,
        params.baseVersion
      );
    },
    onSuccess: () => {
      // Invalidate user subject queries
      if (userId) {
        queryClient.invalidateQueries({ queryKey: subjectQueryKeys.user(userId) });
      }
    },
  });

  return {
    addCatalogueSubject,
    addCustomSubject,
    removeSubject,
    restoreSubject,
    updateCustomSubject: updateCustomSubjectMutation,
    deleteCustomSubject: deleteCustomSubjectMutation,
  };
}
