/**
 * Subject Query Keys
 * 
 * TanStack Query cache keys for subject-related queries.
 * Ensures proper cache invalidation and user isolation.
 */

export const subjectQueryKeys = {
  all: ['subjects'] as const,
  catalogue: () => [...subjectQueryKeys.all, 'catalogue'] as const,
  user: (userId: string) => [...subjectQueryKeys.all, 'user', userId] as const,
  userArchived: (userId: string) => [...subjectQueryKeys.user(userId), 'archived'] as const,
  syllabusVersions: (catalogueSubjectId: string) => 
    [...subjectQueryKeys.all, 'syllabus-versions', catalogueSubjectId] as const,
} as const;
