/**
 * useSubjectMutations Hook
 * 
 * TanStack Query mutations for subject operations.
 * Handles archive/restore, custom subject creation, and proper rollback on failure.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import {
  createCatalogueUserSubject,
  createCustomSubject,
  createCustomUserSubject,
  archiveUserSubject,
  restoreUserSubject,
  softDeleteCustomSubject,
  updateCustomSubject,
  findArchivedUserSubjectByCatalogueId,
  fetchActiveSyllabusVersion,
} from './subjectsApi';
import { subjectQueryKeys } from './queryKeys';
import { createCustomSubjectSelection } from './customSubjectCreation';
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
    mutationFn: async (input: string | { catalogueSubjectId: string; sortOrder?: number }) => {
      if (!userId) throw new Error('Authentication required');

      const catalogueSubjectId = typeof input === 'string' ? input : input.catalogueSubjectId;
      const sortOrder = typeof input === 'string' ? 0 : (input.sortOrder ?? 0);

      // Check for archived row first
      const archived = await findArchivedUserSubjectByCatalogueId(
        userId,
        catalogueSubjectId
      );

      if (archived) {
        // Restore existing archived row (preserves original stored sort_order)
        return await restoreUserSubject(archived.userSubject.id, archived.userSubject.version);
      }

      // Resolve active syllabus version if available
      const syllabusVersion = await fetchActiveSyllabusVersion(catalogueSubjectId);

      // Create new user subject
      return await createCatalogueUserSubject(
        catalogueSubjectId,
        syllabusVersion?.id || null,
        sortOrder
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
      sortOrder?: number;
    }) => {
      if (!userId) throw new Error('Authentication required');

      return createCustomSubjectSelection(params, {
        createDefinition: (input) => createCustomSubject(
          input.name,
          input.code || null,
          input.qualificationLabel || null,
          input.description || null,
        ),
        createSelection: createCustomUserSubject,
        cleanupDefinition: softDeleteCustomSubject,
        logCleanupError: (cleanupError) => {
          console.error('Failed to rollback custom subject cleanup:', cleanupError);
        },
      });
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
