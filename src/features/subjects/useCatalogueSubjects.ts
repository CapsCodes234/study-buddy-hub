/**
 * useCatalogueSubjects Hook
 *
 * TanStack Query hook for fetching catalogue subjects.
 * Uses a longer stale time since catalogue data changes infrequently.
 * Distinguishes between loading, empty, and failure states.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchCatalogueSubjects } from './subjectsApi';
import { subjectQueryKeys } from './queryKeys';

/**
 * Hook to fetch active catalogue subjects
 *
 * @returns Query result with catalogue subjects data and status
 */
export function useCatalogueSubjects() {
  return useQuery({
    queryKey: subjectQueryKeys.catalogue(),
    queryFn: fetchCatalogueSubjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3, // Retry failed requests up to 3 times
  });
}
