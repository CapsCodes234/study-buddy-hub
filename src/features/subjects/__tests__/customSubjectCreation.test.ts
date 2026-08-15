import { describe, expect, it, vi } from 'vitest';

import { createCustomSubjectSelection } from '../customSubjectCreation';

describe('createCustomSubjectSelection', () => {
  it('cleans up only the exact definition created when selection fails', async () => {
    const originalError = new Error('subject limit reached');
    const cleanupDefinition = vi.fn().mockResolvedValue(undefined);

    await expect(
      createCustomSubjectSelection(
        { name: 'Astronomy', sortOrder: 4 },
        {
          createDefinition: vi.fn().mockResolvedValue({ id: 'custom-new', version: 7 }),
          createSelection: vi.fn().mockRejectedValue(originalError),
          cleanupDefinition,
        },
      ),
    ).rejects.toBe(originalError);

    expect(cleanupDefinition).toHaveBeenCalledOnce();
    expect(cleanupDefinition).toHaveBeenCalledWith('custom-new', 7);
  });

  it('preserves the original failure when best-effort cleanup also fails', async () => {
    const originalError = new Error('selection failed');
    const cleanupError = new Error('cleanup failed');
    const logCleanupError = vi.fn();

    await expect(
      createCustomSubjectSelection(
        { name: 'Astronomy' },
        {
          createDefinition: vi.fn().mockResolvedValue({ id: 'custom-new', version: 1 }),
          createSelection: vi.fn().mockRejectedValue(originalError),
          cleanupDefinition: vi.fn().mockRejectedValue(cleanupError),
          logCleanupError,
        },
      ),
    ).rejects.toBe(originalError);

    expect(logCleanupError).toHaveBeenCalledWith(cleanupError);
  });

  it('does not clean up when definition creation itself fails', async () => {
    const cleanupDefinition = vi.fn();

    await expect(
      createCustomSubjectSelection(
        { name: 'Astronomy' },
        {
          createDefinition: vi.fn().mockRejectedValue(new Error('insert failed')),
          createSelection: vi.fn(),
          cleanupDefinition,
        },
      ),
    ).rejects.toThrow('insert failed');

    expect(cleanupDefinition).not.toHaveBeenCalled();
  });
});
