/**
 * Catalogue UI ID Mapping
 *
 * Maps catalogue subjects to stable UI IDs used throughout the application.
 * Legacy mappings preserve existing stable IDs (math, physics, it).
 * Future catalogue subjects use their slug directly as the UI ID.
 */

/**
 * Legacy slug override map for backward compatibility
 * Maps catalogue slugs to the stable UI IDs used in routes, navigation, bullets, etc.
 */
const LEGACY_SLUG_OVERRIDES: Record<string, string> = {
  'mathematics': 'math',
  'physics': 'physics',
  'information-technology': 'it',
};

/**
 * Legacy color preservation map
 * Preserves the original colors for legacy subjects
 */
const LEGACY_COLORS: Record<string, string> = {
  'math': 'hsl(222, 47%, 20%)',
  'physics': 'hsl(173, 58%, 39%)',
  'it': 'hsl(38, 92%, 50%)',
};

/**
 * Convert a catalogue slug to a stable UI ID
 *
 * - Legacy subjects use the override map
 * - Future subjects use their slug directly
 *
 * @param slug - The catalogue subject slug
 * @returns The stable UI ID for the subject
 */
export function catalogueSlugToUiId(slug: string): string {
  const normalized = slug.toLowerCase().trim();
  return LEGACY_SLUG_OVERRIDES[normalized] || normalized;
}

/**
 * Get a deterministic fallback color for a subject based on its UI ID
 * Preserves legacy colors for math, physics, it
 * Uses HSL color space with consistent hue based on string hash for other subjects
 *
 * @param uiId - The stable UI ID
 * @returns An HSL color string
 */
export function getFallbackColor(uiId: string): string {
  // Preserve legacy colors for backward compatibility
  if (LEGACY_COLORS[uiId]) {
    return LEGACY_COLORS[uiId];
  }

  // Use hash to generate consistent hue (0-360) for new subjects
  let hash = 0;
  for (let i = 0; i < uiId.length; i++) {
    hash = uiId.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash % 360);
  // Use moderate saturation and lightness for readability
  return `hsl(${hue}, 60%, 40%)`;
}

/**
 * Generate a stable UI ID for a custom subject
 * Format: custom-{fullUuid}
 * 
 * @param customSubjectId - The UUID of the custom subject
 * @returns The stable UI ID for the custom subject
 */
export function customSubjectToUiId(customSubjectId: string): string {
  return `custom-${customSubjectId}`;
}

/**
 * Check if a UI ID represents a custom subject
 * 
 * @param uiId - The UI ID to check
 * @returns True if the ID represents a custom subject
 */
export function isCustomSubjectUiId(uiId: string): boolean {
  return uiId.startsWith('custom-');
}

/**
 * Extract the custom subject UUID from a UI ID
 * 
 * @param uiId - The UI ID
 * @returns The custom subject UUID, or null if not a custom subject
 */
export function extractCustomSubjectId(uiId: string): string | null {
  if (!isCustomSubjectUiId(uiId)) {
    return null;
  }
  return uiId.replace('custom-', '');
}
