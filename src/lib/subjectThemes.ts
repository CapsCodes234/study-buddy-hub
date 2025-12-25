/**
 * Subject-Specific Theme Configurations
 * 
 * Defines complete theme configurations for each subject (Math, Physics, IT)
 * with light and dark variants, animations, and patterns.
 * All colors meet WCAG AA contrast requirements (4.5:1 minimum).
 */

import { Calculator, Atom, Cpu, Binary, Waves, Pi, LucideIcon } from 'lucide-react';

export interface SubjectThemeColors {
  primary: string;      // HSL values for main brand color
  accent: string;       // HSL values for accent/highlight color
  background: string;   // HSL values for page background
  cardBg: string;       // HSL values for card backgrounds
  text: string;         // HSL values for text color
  border: string;       // HSL values for borders
}

export interface SubjectTheme {
  id: string;
  name: string;
  colors: {
    light: SubjectThemeColors;
    dark: SubjectThemeColors;
  };
  patterns: {
    background: string;
    overlay?: string;
  };
  animations: {
    cardEntrance: string;
    progressBar: string;
    buttonHover: string;
  };
  icons: {
    primary: LucideIcon;
    accent: LucideIcon;
  };
}

export const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  math: {
    id: 'math',
    name: 'Mathematics',
    colors: {
      light: {
        primary: '222 47% 20%',      // Deep Indigo
        accent: '173 58% 39%',       // Teal
        background: '220 20% 97%',   // Soft gray
        cardBg: '0 0% 100%',         // White
        text: '222 47% 11%',         // Near black
        border: '220 13% 87%',       // Light gray
      },
      dark: {
        primary: '217 91% 60%',      // Electric Blue
        accent: '262 83% 68%',       // Violet
        background: '222 47% 7%',    // Deep navy
        cardBg: '222 47% 12%',       // Slightly elevated
        text: '210 40% 96%',         // Near white
        border: '217 33% 22%',       // Dark gray
      },
    },
    patterns: {
      background: 'linear-gradient(to right, rgba(30,64,175,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(30,64,175,0.03) 1px, transparent 1px)',
    },
    animations: {
      cardEntrance: 'slideInPrecise',
      progressBar: 'fillWithSnap',
      buttonHover: 'scaleSmooth',
    },
    icons: {
      primary: Calculator,
      accent: Pi,
    },
  },
  physics: {
    id: 'physics',
    name: 'Physics',
    colors: {
      light: {
        primary: '262 83% 25%',      // Deep Plum
        accent: '38 92% 50%',        // Amber
        background: '166 76% 97%',   // Mint tint
        cardBg: '0 0% 100%',         // White
        text: '168 76% 14%',         // Dark teal
        border: '174 58% 78%',       // Soft teal
      },
      dark: {
        primary: '187 94% 50%',      // Bright Cyan
        accent: '166 76% 73%',       // Mint
        background: '201 90% 15%',   // Deep ocean
        cardBg: '194 69% 22%',       // Elevated teal
        text: '183 100% 96%',        // Near white cyan
        border: '197 71% 28%',       // Dark teal
      },
    },
    patterns: {
      background: 'radial-gradient(circle at 20px 20px, rgba(15,118,110,0.05) 2px, transparent 2px)',
    },
    animations: {
      cardEntrance: 'waveIn',
      progressBar: 'pulseWave',
      buttonHover: 'orbit',
    },
    icons: {
      primary: Atom,
      accent: Waves,
    },
  },
  it: {
    id: 'it',
    name: 'Information Technology',
    colors: {
      light: {
        primary: '168 76% 18%',      // Deep Cyan
        accent: '195 84% 37%',       // Electric Blue
        background: '30 100% 97%',   // Warm cream
        cardBg: '0 0% 100%',         // White
        text: '17 78% 18%',          // Deep brown
        border: '30 100% 84%',       // Soft orange
      },
      dark: {
        primary: '27 96% 61%',       // Neon Orange
        accent: '21 90% 53%',        // Coral
        background: '24 10% 8%',     // Warm dark
        cardBg: '20 9% 14%',         // Slightly elevated
        text: '48 96% 92%',          // Warm white
        border: '35 92% 18%',        // Dark amber
      },
    },
    patterns: {
      background: 'repeating-linear-gradient(45deg, rgba(234,88,12,0.02) 0px, rgba(234,88,12,0.02) 1px, transparent 1px, transparent 10px)',
    },
    animations: {
      cardEntrance: 'glitchIn',
      progressBar: 'scanProgress',
      buttonHover: 'digitalGlow',
    },
    icons: {
      primary: Cpu,
      accent: Binary,
    },
  },
};

/**
 * Get a subject theme by ID
 * Returns null if subject not found
 */
export function getSubjectTheme(subjectId: string): SubjectTheme | null {
  return SUBJECT_THEMES[subjectId] || null;
}

/**
 * Get all subject theme IDs
 */
export function getSubjectThemeIds(): string[] {
  return Object.keys(SUBJECT_THEMES);
}

/**
 * Check if a subject has a custom theme
 */
export function hasSubjectTheme(subjectId: string): boolean {
  return subjectId in SUBJECT_THEMES;
}
