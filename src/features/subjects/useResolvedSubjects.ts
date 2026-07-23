/**
 * useResolvedSubjects Hook
 * 
 * Integrates server-backed subject selection with local state.
 * Handles the authority model: server subjects for authenticated users,
 * legacy fallback for sync errors, and proper error handling.
 */

import { useMemo } from 'react';
import { useUserSubjects } from './useUserSubjects';
import { mapUserSubjectsToSubjects } from '@/lib/subjects/mapUserSubjects';
import { hasGenuineLegacyData } from '@/lib/subjects/legacySubjectUsage';
import type { Subject, AppState } from '@/types';

/**
 * Hook to resolve the authoritative subject list
 * 
 * For authenticated users:
 * - On successful fetch: use mapped server subjects
 * - On successful fetch returning []: show selection gate (no subjects)
 * - On failed fetch with genuine legacy data: show legacy fallback with sync error
 * - On failed fetch without genuine legacy data: show sync error only
 * 
 * @param localState - The local AppState from useAppState
 * @returns Object containing resolved subjects, loading state, and error state
 */
export function useResolvedSubjects(localState: AppState) {
  const { data: userSubjects, isLoading, error, isError } = useUserSubjects();

  const result = useMemo(() => {
    // Case 1: Still loading
    if (isLoading) {
      return {
        resolvedSubjects: localState.subjects,
        isLoading: true,
        isError: false,
        error: null,
        shouldShowSelectionGate: false,
        shouldShowSyncError: false,
        hasGenuineFallback: false,
      };
    }

    // Case 2: Successful fetch
    if (!isError && userSubjects) {
      const mappedSubjects = mapUserSubjectsToSubjects(userSubjects);

      // Empty result means user has zero selected subjects
      if (mappedSubjects.length === 0) {
        return {
          resolvedSubjects: [],
          isLoading: false,
          isError: false,
          error: null,
          shouldShowSelectionGate: true,
          shouldShowSyncError: false,
          hasGenuineFallback: false,
        };
      }

      // Non-empty result: use server subjects
      return {
        resolvedSubjects: mappedSubjects,
        isLoading: false,
        isError: false,
        error: null,
        shouldShowSelectionGate: false,
        shouldShowSyncError: false,
        hasGenuineFallback: false,
      };
    }

    // Case 3: Failed fetch
    const hasGenuineData = hasGenuineLegacyData(localState.bullets, localState.pastPapers);

    if (hasGenuineData) {
      // Has genuine legacy data: show as fallback with sync error
      return {
        resolvedSubjects: localState.subjects,
        isLoading: false,
        isError: true,
        error: error || new Error('Failed to fetch subjects'),
        shouldShowSelectionGate: false,
        shouldShowSyncError: true,
        hasGenuineFallback: true,
      };
    }

    // No genuine legacy data: show sync error only (no DEFAULT_SUBJECTS)
    return {
      resolvedSubjects: [],
      isLoading: false,
      isError: true,
      error: error || new Error('Failed to fetch subjects'),
      shouldShowSelectionGate: false,
      shouldShowSyncError: true,
      hasGenuineFallback: false,
    };
  }, [userSubjects, isLoading, error, isError, localState]);

  return result;
}

/**
 * Create a display state with resolved subjects
 * 
 * This combines the local state with resolved server subjects
 * for use in components that need the current subject list.
 * 
 * @param localState - The local AppState from useAppState
 * @param resolvedSubjects - The resolved subjects from useResolvedSubjects
 * @returns Display state with resolved subjects
 */
export function createDisplayState(
  localState: AppState,
  resolvedSubjects: Subject[]
): AppState {
  return {
    ...localState,
    subjects: resolvedSubjects,
  };
}
