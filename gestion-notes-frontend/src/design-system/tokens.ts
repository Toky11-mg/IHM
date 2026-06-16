// src/design-system/tokens.ts
// ─── Palette Stone + Sage ─────────────────────────────────────────────────────

export const colors = {
  // Stone — neutres chauds
  stone: {
    50:  '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
  },
  // Sage — vert principal ENI
  sage: {
    50:  '#f0f7f4',
    100: '#d9ede6',
    200: '#a8d5c2',
    300: '#6fb99e',
    400: '#3d9e7e',
    500: '#2d7a61',
    600: '#1f5c48',
    700: '#154232',
    800: '#0d2d22',
    900: '#071a14',
  },
  // Sémantiques
  blue: {
    50: '#eff6ff', 200: '#bfdbfe', 500: '#3b82f6', 700: '#1d4ed8',
  },
  amber: {
    50: '#fffbeb', 200: '#fde68a', 500: '#f59e0b', 700: '#b45309',
  },
  rose: {
    50: '#fff1f2', 200: '#fecdd3', 500: '#f43f5e', 700: '#be123c',
  },
  violet: {
    50: '#f5f3ff', 200: '#ddd6fe', 500: '#8b5cf6', 700: '#6d28d9',
  },
  // Blanc pur
  white: '#ffffff',
} as const

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const shadows = {
  sm:  '0 1px 3px rgba(0,0,0,.06), 0 1px 8px rgba(0,0,0,.04)',
  md:  '0 1px 4px rgba(0,0,0,.07), 0 2px 12px rgba(0,0,0,.05)',
  lg:  '0 4px 16px rgba(0,0,0,.08), 0 8px 32px rgba(0,0,0,.05)',
  none:'none',
} as const

// ─── Radius ───────────────────────────────────────────────────────────────────

export const radius = {
  sm:   '6px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',
  full: '9999px',
} as const

// ─── Typography ───────────────────────────────────────────────────────────────

export const typography = {
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  size: {
    xs:   '11px',
    sm:   '12px',
    base: '13px',
    md:   '14px',
    lg:   '15px',
    xl:   '16px',
    '2xl':'18px',
    '3xl':'22px',
    '4xl':'26px',
  },
  weight: {
    regular: 400,
    medium:  500,
    semibold: 600,
  },
  lineHeight: {
    tight:  1.3,
    normal: 1.5,
    relaxed:1.7,
  },
} as const

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const spacing = {
  1:  '4px',
  2:  '8px',
  3:  '10px',
  4:  '12px',
  5:  '14px',
  6:  '16px',
  7:  '20px',
  8:  '24px',
  10: '32px',
  12: '40px',
} as const

// ─── Z-index ──────────────────────────────────────────────────────────────────

export const zIndex = {
  base:    0,
  dropdown:10,
  sticky:  20,
  overlay: 100,
  modal:   200,
  toast:   300,
} as const