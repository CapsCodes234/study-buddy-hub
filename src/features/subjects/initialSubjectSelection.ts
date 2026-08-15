export interface InitialSubjectSelectionResult {
  successfulIds: string[];
  failedId: string | null;
  error: unknown | null;
}

/**
 * Create initial catalogue selections in deterministic order. Successful rows
 * remain authoritative; processing stops at the first failure so they are not
 * retried as duplicates within the same session.
 */
export async function createInitialCatalogueSelections(
  catalogueSubjectIds: string[],
  createSelection: (catalogueSubjectId: string, sortOrder: number) => Promise<unknown>,
): Promise<InitialSubjectSelectionResult> {
  const successfulIds: string[] = [];

  for (let sortOrder = 0; sortOrder < catalogueSubjectIds.length; sortOrder += 1) {
    const catalogueSubjectId = catalogueSubjectIds[sortOrder];
    try {
      await createSelection(catalogueSubjectId, sortOrder);
      successfulIds.push(catalogueSubjectId);
    } catch (error) {
      return { successfulIds, failedId: catalogueSubjectId, error };
    }
  }

  return { successfulIds, failedId: null, error: null };
}
