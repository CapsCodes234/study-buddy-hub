import { describe, expect, it, vi } from 'vitest';

import { createInitialCatalogueSelections } from '../initialSubjectSelection';

describe('createInitialCatalogueSelections', () => {
  it('assigns incremental sort order and reports complete success', async () => {
    const createSelection = vi.fn().mockResolvedValue(undefined);

    const result = await createInitialCatalogueSelections(
      ['math-id', 'physics-id', 'it-id'],
      createSelection,
    );

    expect(createSelection.mock.calls).toEqual([
      ['math-id', 0],
      ['physics-id', 1],
      ['it-id', 2],
    ]);
    expect(result).toEqual({
      successfulIds: ['math-id', 'physics-id', 'it-id'],
      failedId: null,
      error: null,
    });
  });

  it('retains successes and stops at the first failure', async () => {
    const createSelection = vi.fn(async (id: string) => {
      if (id === 'physics-id') throw new Error('network failure');
    });

    const result = await createInitialCatalogueSelections(
      ['math-id', 'physics-id', 'it-id'],
      createSelection,
    );

    expect(result.successfulIds).toEqual(['math-id']);
    expect(result.failedId).toBe('physics-id');
    expect(result.error).toBeInstanceOf(Error);
    expect(createSelection).toHaveBeenCalledTimes(2);
    expect(createSelection).not.toHaveBeenCalledWith('it-id', 2);
  });
});
