/**
 * useUserSubjects Hook
 * 
 * TanStack Query hook for fetching user subjects.
 * Enabled only for authenticated users with proper user-specific keys.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchUserSubjects, fetchArchivedUserSubjects } from './subjectsApi';
import { subjectQueryKeys } from './queryKeys';
import { useAuth } from '@/features/auth/useAuth';

/**
 * Hook to fetch active user subjects
 * 
 * @returns Query result with user subjects data
 */
export function useUserSubjects() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: userId ? subjectQueryKeys.user(userId) : ['subjects', 'user', 'null'],
    queryFn: () => fetchUserSubjects(userId!),
    enabled: !!userId, // Only fetch when authenticated
    staleTime: 0, // Always refetch for user-specific data
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch archived user subjects
 * 
 * @returns Query result with archived user subjects data
 */
export function useArchivedUserSubjects() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: userId ? subjectQueryKeys.userArchived(userId) : ['subjects', 'user', 'null', 'archived'],
    queryFn: () => fetchArchivedUserSubjects(userId!),
    enabled: !!userId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
}
