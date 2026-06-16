// src/design-system/styles.ts
// ─── Styles inline réutilisables ─────────────────────────────────────────────
// Toutes les pages importent depuis ici → cohérence garantie

import { colors, shadows, radius, typography, spacing } from './tokens'

const C = colors
const S = shadows
const R = radius
const T = typography

// ─── Layout ───────────────────────────────────────────────────────────────────

export const layout = {
  page: {
    padding: spacing[8],
    minHeight: '100vh',
    backgroundColor: C.stone[50],
    fontFamily: T.fontFamily,
  } as React.CSSProperties,

  sidebar: {
    width: '220px',
    minHeight: '100vh',
    backgroundColor: C.sage[800],
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  } as React.CSSProperties,

  header: {
    height: '52px',
    backgroundColor: C.white,
    borderBottom: `1px solid ${C.stone[200]}`,
    padding: `0 ${spacing[8]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    position: 'sticky' as const,
    top: 0,
    zIndex: 20,
  } as React.CSSProperties,
} as const

// ─── Cards ────────────────────────────────────────────────────────────────────

export const card = {
  base: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    border: `1px solid ${C.stone[100]}`,
    boxShadow: S.md,
  } as React.CSSProperties,

  flat: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    border: `1px solid ${C.stone[200]}`,
  } as React.CSSProperties,

  overflow: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    border: `1px solid ${C.stone[100]}`,
    boxShadow: S.md,
    overflow: 'hidden',
  } as React.CSSProperties,

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing[5]} ${spacing[6]}`,
    borderBottom: `1px solid ${C.stone[100]}`,
  } as React.CSSProperties,

  body: {
    padding: `${spacing[4]} ${spacing[6]}`,
  } as React.CSSProperties,

  title: {
    fontSize: T.size.base,
    fontWeight: T.weight.medium,
    color: C.stone[700],
  } as React.CSSProperties,
} as const

// ─── Typography ───────────────────────────────────────────────────────────────

export const text = {
  pageTitle: {
    fontSize: T.size['3xl'],
    fontWeight: T.weight.medium,
    color: C.stone[800],
    margin: 0,
  } as React.CSSProperties,

  sectionLabel: {
    fontSize: T.size.xs,
    fontWeight: T.weight.medium,
    color: C.stone[400],
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    marginBottom: spacing[3],
  } as React.CSSProperties,

  breadcrumb: {
    fontSize: T.size.xs,
    color: C.stone[400],
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[1],
  } as React.CSSProperties,

  muted: {
    fontSize: T.size.sm,
    color: C.stone[400],
  } as React.CSSProperties,

  label: {
    display: 'block',
    fontSize: T.size.sm,
    fontWeight: T.weight.medium,
    color: C.stone[600],
    marginBottom: spacing[1],
  } as React.CSSProperties,

  code: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: T.size.xs,
    color: C.stone[500],
    backgroundColor: C.stone[100],
    padding: '2px 6px',
    borderRadius: R.sm,
  } as React.CSSProperties,
} as const

// ─── Buttons ──────────────────────────────────────────────────────────────────

export const btn = {
  primary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: `${spacing[2]} ${spacing[6]}`,
    borderRadius: R.md,
    fontSize: T.size.md,
    fontWeight: T.weight.medium,
    cursor: 'pointer',
    border: 'none',
    backgroundColor: C.sage[600],
    color: C.white,
    transition: 'background .15s',
  } as React.CSSProperties,

  ghost: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: `7px ${spacing[5]}`,
    borderRadius: R.md,
    fontSize: T.size.base,
    fontWeight: T.weight.regular,
    cursor: 'pointer',
    border: `1px solid ${C.stone[200]}`,
    backgroundColor: 'transparent',
    color: C.stone[600],
    transition: 'all .15s',
  } as React.CSSProperties,

  danger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: `${spacing[2]} ${spacing[6]}`,
    borderRadius: R.md,
    fontSize: T.size.md,
    fontWeight: T.weight.medium,
    cursor: 'pointer',
    border: 'none',
    backgroundColor: C.rose[500],
    color: C.white,
  } as React.CSSProperties,

  sm: (bg: string, color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[1],
    padding: `5px ${spacing[3]}`,
    borderRadius: R.md,
    fontSize: T.size.sm,
    fontWeight: T.weight.medium,
    cursor: 'pointer',
    border: 'none',
    backgroundColor: bg,
    color,
  }),

  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    borderRadius: R.md,
    border: `1px solid ${C.stone[200]}`,
    backgroundColor: 'transparent',
    color: C.stone[500],
    cursor: 'pointer',
    fontSize: '14px',
  } as React.CSSProperties,

  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: T.size.xs,
    color: C.sage[500],
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    fontWeight: T.weight.medium,
  } as React.CSSProperties,
} as const

// ─── Table ────────────────────────────────────────────────────────────────────

export const table = {
  root: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: T.size.base,
  } as React.CSSProperties,

  th: {
    padding: `${spacing[2]} ${spacing[6]}`,
    textAlign: 'left' as const,
    fontWeight: T.weight.medium,
    fontSize: T.size.xs,
    color: C.stone[400],
    borderBottom: `1px solid ${C.stone[100]}`,
    backgroundColor: C.stone[50],
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  td: {
    padding: `${spacing[3]} ${spacing[6]}`,
    borderBottom: `1px solid ${C.stone[100]}`,
    color: C.stone[700],
    verticalAlign: 'middle' as const,
  } as React.CSSProperties,

  tdMuted: {
    padding: `${spacing[3]} ${spacing[6]}`,
    borderBottom: `1px solid ${C.stone[100]}`,
    color: C.stone[400],
    verticalAlign: 'middle' as const,
    fontSize: T.size.sm,
  } as React.CSSProperties,
} as const

// ─── Form ─────────────────────────────────────────────────────────────────────

export const form = {
  group: {
    marginBottom: spacing[5],
  } as React.CSSProperties,

  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing[4],
  } as React.CSSProperties,

  input: {
    width: '100%',
    padding: `${spacing[2]} ${spacing[4]}`,
    borderRadius: R.md,
    border: `1px solid ${C.stone[200]}`,
    fontSize: T.size.md,
    backgroundColor: C.white,
    color: C.stone[800],
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: typography.fontFamily,
    transition: 'border-color .15s',
  } as React.CSSProperties,

  inputFocus: {
    borderColor: C.sage[400],
  } as React.CSSProperties,

  inputError: {
    borderColor: C.rose[500],
  } as React.CSSProperties,

  textarea: {
    width: '100%',
    padding: `${spacing[2]} ${spacing[4]}`,
    borderRadius: R.md,
    border: `1px solid ${C.stone[200]}`,
    fontSize: T.size.md,
    backgroundColor: C.white,
    color: C.stone[800],
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: typography.fontFamily,
    resize: 'vertical' as const,
    minHeight: '90px',
  } as React.CSSProperties,

  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing[2],
    marginTop: spacing[7],
    borderTop: `1px solid ${C.stone[100]}`,
    paddingTop: spacing[5],
  } as React.CSSProperties,
} as const

// ─── Filters bar ──────────────────────────────────────────────────────────────

export const filters = {
  bar: {
    display: 'flex',
    gap: spacing[2],
    marginBottom: spacing[5],
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  } as React.CSSProperties,

  search: {
    padding: `7px ${spacing[4]}`,
    borderRadius: R.md,
    border: `1px solid ${C.stone[200]}`,
    fontSize: T.size.base,
    backgroundColor: C.white,
    color: C.stone[800],
    outline: 'none',
    flex: 1,
    minWidth: '200px',
    fontFamily: typography.fontFamily,
  } as React.CSSProperties,

  select: {
    padding: `7px ${spacing[4]}`,
    borderRadius: R.md,
    border: `1px solid ${C.stone[200]}`,
    fontSize: T.size.base,
    backgroundColor: C.white,
    color: C.stone[800],
    outline: 'none',
    fontFamily: typography.fontFamily,
  } as React.CSSProperties,

  count: {
    fontSize: T.size.sm,
    color: C.stone[400],
    marginLeft: 'auto',
  } as React.CSSProperties,
} as const

// ─── Badges / Pills ───────────────────────────────────────────────────────────

export const badge = {
  base: (bg: string, color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: `3px 9px`,
    borderRadius: R.full,
    fontSize: T.size.xs,
    fontWeight: T.weight.medium,
    backgroundColor: bg,
    color,
    whiteSpace: 'nowrap' as const,
  }),

  sage:   { bg: colors.sage[50],   color: colors.sage[600]   },
  blue:   { bg: colors.blue[50],   color: colors.blue[700]   },
  amber:  { bg: colors.amber[50],  color: colors.amber[700]  },
  rose:   { bg: colors.rose[50],   color: colors.rose[700]   },
  violet: { bg: colors.violet[50], color: colors.violet[700] },
  stone:  { bg: colors.stone[100], color: colors.stone[600]  },
} as const

// ─── Feedback messages ────────────────────────────────────────────────────────

export const feedback = {
  success: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[5],
    padding: `${spacing[3]} ${spacing[5]}`,
    borderRadius: R.md,
    backgroundColor: colors.sage[50],
    color: colors.sage[700],
    fontSize: T.size.base,
    borderLeft: `3px solid ${colors.sage[400]}`,
  } as React.CSSProperties,

  error: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[5],
    padding: `${spacing[3]} ${spacing[5]}`,
    borderRadius: R.md,
    backgroundColor: colors.rose[50],
    color: colors.rose[700],
    fontSize: T.size.base,
    borderLeft: `3px solid ${colors.rose[500]}`,
  } as React.CSSProperties,

  warning: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[5],
    padding: `${spacing[3]} ${spacing[5]}`,
    borderRadius: R.md,
    backgroundColor: colors.amber[50],
    color: colors.amber[700],
    fontSize: T.size.base,
    borderLeft: `3px solid ${colors.amber[500]}`,
  } as React.CSSProperties,

  info: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[5],
    padding: `${spacing[3]} ${spacing[5]}`,
    borderRadius: R.md,
    backgroundColor: colors.blue[50],
    color: colors.blue[700],
    fontSize: T.size.base,
    borderLeft: `3px solid ${colors.blue[500]}`,
  } as React.CSSProperties,
} as const

// ─── Modal ────────────────────────────────────────────────────────────────────

export const modal = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(28,25,23,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    backdropFilter: 'blur(2px)',
  } as React.CSSProperties,

  container: {
    backgroundColor: C.white,
    borderRadius: R.xl,
    border: `1px solid ${C.stone[100]}`,
    boxShadow: S.lg,
    width: '100%',
    maxWidth: '480px',
    padding: `${spacing[8]}`,
    margin: spacing[6],
  } as React.CSSProperties,

  containerLg: {
    backgroundColor: C.white,
    borderRadius: R.xl,
    border: `1px solid ${C.stone[100]}`,
    boxShadow: S.lg,
    width: '100%',
    maxWidth: '720px',
    padding: `${spacing[8]}`,
    margin: spacing[6],
    maxHeight: '90vh',
    overflowY: 'auto' as const,
  } as React.CSSProperties,

  title: {
    fontSize: T.size['2xl'],
    fontWeight: T.weight.medium,
    color: C.stone[800],
    marginBottom: spacing[6],
  } as React.CSSProperties,
} as const

// ─── Misc ─────────────────────────────────────────────────────────────────────

export const misc = {
  divider: {
    borderTop: `1px solid ${C.stone[100]}`,
    margin: `${spacing[5]} 0`,
  } as React.CSSProperties,

  avatar: (size = 36, bg = colors.sage[500]): React.CSSProperties => ({
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: R.full,
    backgroundColor: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: C.white,
    fontWeight: T.weight.medium,
    fontSize: size > 40 ? T.size.md : T.size.sm,
    flexShrink: 0,
  }),

  spinner: {
    textAlign: 'center' as const,
    padding: `${spacing[12]} ${spacing[6]}`,
    color: C.stone[400],
    fontSize: T.size.base,
  } as React.CSSProperties,

  empty: {
    textAlign: 'center' as const,
    padding: `${spacing[12]} ${spacing[6]}`,
    color: C.stone[400],
  } as React.CSSProperties,

  dot: (color: string): React.CSSProperties => ({
    width: '7px',
    height: '7px',
    borderRadius: R.full,
    backgroundColor: color,
    display: 'inline-block',
    marginRight: spacing[2],
  }),

  noteValue: (note: number): React.CSSProperties => ({
    fontWeight: T.weight.medium,
    fontSize: T.size.lg,
    color: note >= 12 ? colors.sage[600]
         : note >= 10 ? colors.amber[700]
         : colors.rose[700],
  }),
} as const