/**
 * Design System Constants
 * Central design tokens for CampusLink (AlumniLink) platform
 * Based on UI.md design specifications
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // Main primary
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Role-Based Colors
  roles: {
    student: {
      main: '#10b981',      // Emerald - Growth, Learning
      light: '#d1fae5',
      dark: '#065f46',
      gradient: 'from-emerald-500 to-teal-600',
    },
    alumni: {
      main: '#8b5cf6',      // Purple - Wisdom, Achievement
      light: '#ede9fe',
      dark: '#5b21b6',
      gradient: 'from-purple-500 to-indigo-600',
    },
    aspirant: {
      main: '#f59e0b',      // Amber - Ambition, Hope
      light: '#fef3c7',
      dark: '#d97706',
      gradient: 'from-amber-500 to-orange-600',
    },
    admin: {
      main: '#ef4444',      // Red - Authority, Control
      light: '#fee2e2',
      dark: '#991b1b',
      gradient: 'from-red-500 to-rose-600',
    },
  },

  // Semantic Colors
  semantic: {
    success: {
      main: '#10b981',
      light: '#d1fae5',
      dark: '#065f46',
    },
    warning: {
      main: '#f59e0b',
      light: '#fef3c7',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#fee2e2',
      dark: '#991b1b',
    },
    info: {
      main: '#3b82f6',
      light: '#dbeafe',
      dark: '#1e40af',
    },
  },

  // Neutral Colors (for text, backgrounds, borders)
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Background Colors
  background: {
    primary: '#ffffff',
    secondary: '#fafafa',
    tertiary: '#f5f5f5',
    dark: '#0f172a',
    darkSecondary: '#1e293b',
  },

  // Text Colors
  text: {
    primary: '#171717',
    secondary: '#525252',
    tertiary: '#a3a3a3',
    inverse: '#ffffff',
    disabled: '#d4d4d4',
  },

  // Border Colors
  border: {
    light: '#e5e5e5',
    medium: '#d4d4d4',
    dark: '#a3a3a3',
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Font Families
  fontFamily: {
    sans: 'var(--font-inter), Inter, system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },

  // Font Sizes (with corresponding line heights)
  fontSize: {
    xs: {
      size: '0.75rem',      // 12px
      lineHeight: '1rem',   // 16px
      letterSpacing: '0.025em',
    },
    sm: {
      size: '0.875rem',     // 14px
      lineHeight: '1.25rem', // 20px
      letterSpacing: '0.016em',
    },
    base: {
      size: '1rem',         // 16px
      lineHeight: '1.5rem', // 24px
      letterSpacing: '0',
    },
    lg: {
      size: '1.125rem',     // 18px
      lineHeight: '1.75rem', // 28px
      letterSpacing: '-0.011em',
    },
    xl: {
      size: '1.25rem',      // 20px
      lineHeight: '1.75rem', // 28px
      letterSpacing: '-0.014em',
    },
    '2xl': {
      size: '1.5rem',       // 24px
      lineHeight: '2rem',   // 32px
      letterSpacing: '-0.019em',
    },
    '3xl': {
      size: '1.875rem',     // 30px
      lineHeight: '2.25rem', // 36px
      letterSpacing: '-0.021em',
    },
    '4xl': {
      size: '2.25rem',      // 36px
      lineHeight: '2.5rem', // 40px
      letterSpacing: '-0.025em',
    },
    '5xl': {
      size: '3rem',         // 48px
      lineHeight: '1',
      letterSpacing: '-0.025em',
    },
  },

  // Font Weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

// ============================================================================
// SPACING SYSTEM
// ============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  base: '0.5rem',   // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.5rem',     // 24px
  '2xl': '2rem',    // 32px
  full: '9999px',
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const transitions = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  timing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  toast: 1500,
  tooltip: 1600,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get role-specific color
 */
export const getRoleColor = (role: 'student' | 'alumni' | 'aspirant' | 'admin') => {
  return colors.roles[role];
};

/**
 * Get role-specific gradient class
 */
export const getRoleGradient = (role: 'student' | 'alumni' | 'aspirant' | 'admin') => {
  return colors.roles[role].gradient;
};

/**
 * Get semantic color
 */
export const getSemanticColor = (type: 'success' | 'warning' | 'error' | 'info') => {
  return colors.semantic[type];
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Role = 'student' | 'alumni' | 'aspirant' | 'admin';
export type SemanticType = 'success' | 'warning' | 'error' | 'info';
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
