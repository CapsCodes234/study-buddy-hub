import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SubjectSelectionGate } from '../SubjectSelectionGate';
import type { Bullet } from '@/types';

const mocks = vi.hoisted(() => ({
  catalogueQuery: {
    data: undefined as unknown,
    isLoading: true,
    isError: false,
    refetch: vi.fn(),
  },
  addCatalogueSubject: vi.fn(),
  addCustomSubject: vi.fn(),
}));

vi.mock('@/features/subjects/useCatalogueSubjects', () => ({
  useCatalogueSubjects: () => mocks.catalogueQuery,
}));

vi.mock('@/features/subjects/useSubjectMutations', () => ({
  useSubjectMutations: () => ({
    addCatalogueSubject: { mutateAsync: mocks.addCatalogueSubject },
    addCustomSubject: { mutateAsync: mocks.addCustomSubject },
  }),
}));

const mathBullet: Bullet = {
  id: 'bullet-1',
  subjectId: 'math',
  mainTopic: 'Mechanics',
  subtopic: 'Forces',
  bulletText: 'describe motion',
  status: null,
  comment: '',
  done: false,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('SubjectSelectionGate preselection lifecycle', () => {
  beforeEach(() => {
    mocks.catalogueQuery = {
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    };
    mocks.addCatalogueSubject.mockReset();
    mocks.addCustomSubject.mockReset();
  });

  it('preselects legacy UI IDs when the catalogue arrives and does not overwrite later choices', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const view = render(
      <QueryClientProvider client={queryClient}>
        <SubjectSelectionGate bullets={[mathBullet]} pastPapers={[]} onComplete={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(screen.queryByLabelText('Mathematics')).not.toBeInTheDocument();

    mocks.catalogueQuery = {
      data: [
        { id: 'catalogue-math', slug: 'mathematics', name: 'Mathematics', code: '9709' },
        { id: 'catalogue-physics', slug: 'physics', name: 'Physics', code: '9702' },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <SubjectSelectionGate bullets={[mathBullet]} pastPapers={[]} onComplete={vi.fn()} />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByLabelText('Mathematics')).toBeChecked());
    expect(screen.getByLabelText('Physics')).not.toBeChecked();

    fireEvent.click(screen.getByLabelText('Physics'));
    expect(screen.getByLabelText('Physics')).toBeChecked();

    mocks.catalogueQuery = {
      ...mocks.catalogueQuery,
      data: [
        ...(mocks.catalogueQuery.data as object[]),
        { id: 'catalogue-economics', slug: 'economics', name: 'Economics', code: '9708' },
      ],
    };
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <SubjectSelectionGate bullets={[mathBullet]} pastPapers={[]} onComplete={vi.fn()} />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByLabelText('Economics')).toBeInTheDocument());
    expect(screen.getByLabelText('Mathematics')).toBeChecked();
    expect(screen.getByLabelText('Physics')).toBeChecked();
  });
});
