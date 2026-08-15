import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAppState } from '../useAppState';

describe('useAppState authenticated persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps synthesized subjects out of storage while local study data still saves', async () => {
    const { result } = renderHook(() => useAppState({ persistSubjects: false }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(localStorage.getItem('study-tracker-data')).not.toBeNull());

    const stored = JSON.parse(localStorage.getItem('study-tracker-data')!);
    expect(result.current.state.subjects).toHaveLength(3);
    expect(stored.subjects).toEqual([]);
    expect(stored.bullets).toEqual([]);
    expect(stored.pastPapers).toEqual([]);
  });
});
