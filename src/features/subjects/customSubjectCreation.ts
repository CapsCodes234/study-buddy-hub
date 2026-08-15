export interface CustomSubjectCreationInput {
  name: string;
  code?: string;
  qualificationLabel?: string;
  description?: string;
  sortOrder?: number;
}

interface CreatedCustomSubject {
  id: string;
  version: number;
}

interface CustomSubjectCreationDependencies<T extends CreatedCustomSubject> {
  createDefinition: (input: CustomSubjectCreationInput) => Promise<T>;
  createSelection: (customSubjectId: string, sortOrder: number) => Promise<unknown>;
  cleanupDefinition: (customSubjectId: string, version: number) => Promise<unknown>;
  logCleanupError?: (error: unknown) => void;
}

/**
 * Create a custom definition and select it as one operation from the user's
 * perspective. Only the exact definition created here is eligible for cleanup.
 */
export async function createCustomSubjectSelection<T extends CreatedCustomSubject>(
  input: CustomSubjectCreationInput,
  dependencies: CustomSubjectCreationDependencies<T>,
): Promise<T> {
  const customSubject = await dependencies.createDefinition(input);

  try {
    await dependencies.createSelection(customSubject.id, input.sortOrder ?? 0);
    return customSubject;
  } catch (originalError) {
    try {
      await dependencies.cleanupDefinition(customSubject.id, customSubject.version);
    } catch (cleanupError) {
      dependencies.logCleanupError?.(cleanupError);
    }
    throw originalError;
  }
}
