/**
 * WCAG Contrast Checker Utility
 * 
 * Validates that color combinations meet WCAG accessibility standards.
 * Run in development mode to catch contrast issues early.
 */

import { SUBJECT_THEMES } from './subjectThemes';

/**
 * Parse HSL string to components
 * Accepts formats: "222 47% 20%" or "hsl(222, 47%, 20%)"
 */
function parseHSL(hslString: string): { h: number; s: number; l: number } | null {
  // Handle "h s% l%" format (CSS variable format)
  const simpleMatch = hslString.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%?\s+(\d+(?:\.\d+)?)%?$/);
  if (simpleMatch) {
    return {
      h: parseFloat(simpleMatch[1]),
      s: parseFloat(simpleMatch[2]),
      l: parseFloat(simpleMatch[3]),
    };
  }
  
  // Handle "hsl(h, s%, l%)" format
  const hslMatch = hslString.match(/hsl\((\d+(?:\.\d+)?),?\s*(\d+(?:\.\d+)?)%?,?\s*(\d+(?:\.\d+)?)%?\)/);
  if (hslMatch) {
    return {
      h: parseFloat(hslMatch[1]),
      s: parseFloat(hslMatch[2]),
      l: parseFloat(hslMatch[3]),
    };
  }
  
  return null;
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * Calculate relative luminance
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const sRGB = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
function calculateContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastResult {
  ratio: number;
  meetsAA: boolean;        // 4.5:1 for normal text
  meetsAALarge: boolean;   // 3:1 for large text (18pt+ or 14pt bold)
  meetsAAA: boolean;       // 7:1 for normal text
  meetsAAALarge: boolean;  // 4.5:1 for large text
}

/**
 * Check contrast between two HSL color strings
 */
export function checkContrast(foregroundHSL: string, backgroundHSL: string): ContrastResult {
  const fg = parseHSL(foregroundHSL);
  const bg = parseHSL(backgroundHSL);
  
  if (!fg || !bg) {
    console.warn('Could not parse HSL colors:', { foregroundHSL, backgroundHSL });
    return {
      ratio: 0,
      meetsAA: false,
      meetsAALarge: false,
      meetsAAA: false,
      meetsAAALarge: false,
    };
  }
  
  const fgRgb = hslToRgb(fg.h, fg.s, fg.l);
  const bgRgb = hslToRgb(bg.h, bg.s, bg.l);
  
  const fgLum = getRelativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLum = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  const ratio = calculateContrastRatio(fgLum, bgLum);
  
  return {
    ratio,
    meetsAA: ratio >= 4.5,
    meetsAALarge: ratio >= 3,
    meetsAAA: ratio >= 7,
    meetsAAALarge: ratio >= 4.5,
  };
}

/**
 * Validate all subject theme colors in development mode
 */
export function validateSubjectThemes(): void {
  if (import.meta.env?.MODE !== 'development') return;
  
  console.group('🎨 Subject Theme Contrast Validation');
  
  Object.entries(SUBJECT_THEMES).forEach(([id, theme]) => {
    console.group(`Theme: ${theme.name} (${id})`);
    
    // Check light mode
    const lightTextBg = checkContrast(theme.colors.light.text, theme.colors.light.background);
    const lightTextCard = checkContrast(theme.colors.light.text, theme.colors.light.cardBg);
    const lightPrimaryBg = checkContrast(theme.colors.light.primary, theme.colors.light.background);
    
    console.log(`Light Mode:`);
    console.log(`  Text on Background: ${lightTextBg.ratio.toFixed(2)}:1 ${lightTextBg.meetsAA ? '✅' : '❌ FAILS AA'}`);
    console.log(`  Text on Card: ${lightTextCard.ratio.toFixed(2)}:1 ${lightTextCard.meetsAA ? '✅' : '❌ FAILS AA'}`);
    console.log(`  Primary on Background: ${lightPrimaryBg.ratio.toFixed(2)}:1 ${lightPrimaryBg.meetsAALarge ? '✅' : '⚠️ May fail for small text'}`);
    
    // Check dark mode
    const darkTextBg = checkContrast(theme.colors.dark.text, theme.colors.dark.background);
    const darkTextCard = checkContrast(theme.colors.dark.text, theme.colors.dark.cardBg);
    const darkPrimaryBg = checkContrast(theme.colors.dark.primary, theme.colors.dark.background);
    
    console.log(`Dark Mode:`);
    console.log(`  Text on Background: ${darkTextBg.ratio.toFixed(2)}:1 ${darkTextBg.meetsAA ? '✅' : '❌ FAILS AA'}`);
    console.log(`  Text on Card: ${darkTextCard.ratio.toFixed(2)}:1 ${darkTextCard.meetsAA ? '✅' : '❌ FAILS AA'}`);
    console.log(`  Primary on Background: ${darkPrimaryBg.ratio.toFixed(2)}:1 ${darkPrimaryBg.meetsAALarge ? '✅' : '⚠️ May fail for small text'}`);
    
    // Warnings for failures
    if (!lightTextBg.meetsAA || !lightTextCard.meetsAA) {
      console.warn(`⚠️ [${id}] Light mode has contrast issues!`);
    }
    if (!darkTextBg.meetsAA || !darkTextCard.meetsAA) {
      console.warn(`⚠️ [${id}] Dark mode has contrast issues!`);
    }
    
    console.groupEnd();
  });
  
  console.groupEnd();
}
