/**
 * Tests for user subject mapping utilities
 */

import { describe, it, expect } from 'vitest';
import { mapUserSubjectToSubject, mapUserSubjectsToSubjects, getCatalogueSubjectId, getCustomSubjectId } from '../mapUserSubjects';

describe('mapUserSubjectToSubject', () => {
  it('should map catalogue subject to UI Subject', () => {
    const joined = {
      userSubject: {
        id: 'user-subject-1',
        user_id: 'user-1',
        catalogue_subject_id: 'catalogue-1',
        custom_subject_id: null,
        syllabus_version_id: 'syllabus-1',
        display_name_override: null,
        sort_order: 0,
        is_archived: false,
        deleted_at: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        client_operation_id: null,
        version: 1,
      },
      catalogueSubject: {
        id: 'catalogue-1',
        name: 'Mathematics',
        slug: 'mathematics',
        code: '9709',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      customSubject: null,
    };

    const subject = mapUserSubjectToSubject(joined);

    expect(subject.id).toBe('math'); // Legacy slug override
    expect(subject.name).toBe('Mathematics');
    expect(subject.source).toBe('catalogue');
    expect(subject.userSubjectId).toBe('user-subject-1');
    expect(subject.catalogueSubjectId).toBe('catalogue-1');
    expect(subject.syllabusVersionId).toBe('syllabus-1');
    expect(subject.catalogueCode).toBe('9709');
    expect(subject.catalogueSlug).toBe('mathematics');
    expect(subject.sortOrder).toBe(0);
    expect(subject.version).toBe(1);
  });

  it('should use display_name_override when present', () => {
    const joined = {
      userSubject: {
        id: 'user-subject-1',
        user_id: 'user-1',
        catalogue_subject_id: 'catalogue-1',
        custom_subject_id: null,
        syllabus_version_id: null,
        display_name_override: 'My Math',
        sort_order: 0,
        is_archived: false,
        deleted_at: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        client_operation_id: null,
        version: 1,
      },
      catalogueSubject: {
        id: 'catalogue-1',
        name: 'Mathematics',
        slug: 'mathematics',
        code: '9709',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      customSubject: null,
    };

    const subject = mapUserSubjectToSubject(joined);
    expect(subject.name).toBe('My Math');
  });

  it('should map custom subject to UI Subject', () => {
    const joined = {
      userSubject: {
        id: 'user-subject-1',
        user_id: 'user-1',
        catalogue_subject_id: null,
        custom_subject_id: 'custom-1',
        syllabus_version_id: null,
        display_name_override: null,
        sort_order: 0,
        is_archived: false,
        deleted_at: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        client_operation_id: null,
        version: 1,
      },
      catalogueSubject: null,
      customSubject: {
        id: 'custom-1',
        user_id: 'user-1',
        name: 'Computer Science',
        code: null,
        qualification_label: 'A-Level',
        description: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        deleted_at: null,
        client_operation_id: null,
        version: 1,
      },
    };

    const subject = mapUserSubjectToSubject(joined);

    expect(subject.id).toBe('custom-custom-1');
    expect(subject.name).toBe('Computer Science');
    expect(subject.source).toBe('custom');
    expect(subject.userSubjectId).toBe('user-subject-1');
    expect(subject.customSubjectId).toBe('custom-1');
  });

  it('should handle missing catalogue and custom subjects gracefully', () => {
    const joined = {
      userSubject: {
        id: 'user-subject-1',
        user_id: 'user-1',
        catalogue_subject_id: null,
        custom_subject_id: null,
        syllabus_version_id: null,
        display_name_override: null,
        sort_order: 0,
        is_archived: false,
        deleted_at: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        client_operation_id: null,
        version: 1,
      },
      catalogueSubject: null,
      customSubject: null,
    };

    const subject = mapUserSubjectToSubject(joined);
    expect(subject.name).toBe('Unknown Subject');
    expect(subject.source).toBe('local');
  });
});

describe('mapUserSubjectsToSubjects', () => {
  it('should map array of joined subjects and sort by sort_order', () => {
    const joinedSubjects = [
      {
        userSubject: {
          id: 'user-subject-2',
          user_id: 'user-1',
          catalogue_subject_id: 'catalogue-2',
          custom_subject_id: null,
          syllabus_version_id: null,
          display_name_override: null,
          sort_order: 1,
          is_archived: false,
          deleted_at: null,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          client_operation_id: null,
          version: 1,
        },
        catalogueSubject: {
          id: 'catalogue-2',
          name: 'Physics',
          slug: 'physics',
          code: '9702',
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        customSubject: null,
      },
      {
        userSubject: {
          id: 'user-subject-1',
          user_id: 'user-1',
          catalogue_subject_id: 'catalogue-1',
          custom_subject_id: null,
          syllabus_version_id: null,
          display_name_override: null,
          sort_order: 0,
          is_archived: false,
          deleted_at: null,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          client_operation_id: null,
          version: 1,
        },
        catalogueSubject: {
          id: 'catalogue-1',
          name: 'Mathematics',
          slug: 'mathematics',
          code: '9709',
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        customSubject: null,
      },
    ];

    const subjects = mapUserSubjectsToSubjects(joinedSubjects);

    expect(subjects).toHaveLength(2);
    expect(subjects[0].name).toBe('Mathematics'); // sort_order 0
    expect(subjects[1].name).toBe('Physics'); // sort_order 1
  });
});

describe('getCatalogueSubjectId', () => {
  it('should return catalogue subject ID for catalogue subjects', () => {
    const subject = {
      id: 'math',
      name: 'Mathematics',
      color: 'hsl(222, 47%, 20%)',
      source: 'catalogue' as const,
      catalogueSubjectId: 'catalogue-1',
    };

    expect(getCatalogueSubjectId(subject)).toBe('catalogue-1');
  });

  it('should return null for non-catalogue subjects', () => {
    const customSubject = {
      id: 'custom-abc',
      name: 'Custom',
      color: 'hsl(222, 47%, 20%)',
      source: 'custom' as const,
      customSubjectId: 'custom-1',
    };

    expect(getCatalogueSubjectId(customSubject)).toBeNull();

    const localSubject = {
      id: 'math',
      name: 'Mathematics',
      color: 'hsl(222, 47%, 20%)',
      source: 'local' as const,
    };

    expect(getCatalogueSubjectId(localSubject)).toBeNull();
  });
});

describe('getCustomSubjectId', () => {
  it('should return custom subject ID for custom subjects', () => {
    const subject = {
      id: 'custom-abc',
      name: 'Custom',
      color: 'hsl(222, 47%, 20%)',
      source: 'custom' as const,
      customSubjectId: 'custom-1',
    };

    expect(getCustomSubjectId(subject)).toBe('custom-1');
  });

  it('should return null for non-custom subjects', () => {
    const catalogueSubject = {
      id: 'math',
      name: 'Mathematics',
      color: 'hsl(222, 47%, 20%)',
      source: 'catalogue' as const,
      catalogueSubjectId: 'catalogue-1',
    };

    expect(getCustomSubjectId(catalogueSubject)).toBeNull();

    const localSubject = {
      id: 'math',
      name: 'Mathematics',
      color: 'hsl(222, 47%, 20%)',
      source: 'local' as const,
    };

    expect(getCustomSubjectId(localSubject)).toBeNull();
  });
});
