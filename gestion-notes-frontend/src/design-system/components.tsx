// src/design-system/components.tsx
// ─── Composants UI réutilisables ─────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react'
import { colors, radius, typography, spacing } from './tokens'
import { feedback, modal, btn, badge, misc, text } from './styles'

const C = colors

// ─── Flash Message ────────────────────────────────────────────────────────────

export function Flash({ message, type = 'success', onDismiss }: {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  onDismiss?: () => void
}) {
  if (!message) return null
  const icons = { success: 'ti-circle-check', error: 'ti-alert-circle', warning: 'ti-alert-triangle', info: 'ti-info-circle' }
  return (
    <div style={{ ...feedback[type], justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
        <i className={`ti ${icons[type]}`} style={{ fontSize: '16px', flexShrink: 0 }} aria-hidden="true" />
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, padding: 0, fontSize: '14px' }}>
          <i className="ti ti-x" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────

export function Spinner({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div style={misc.spinner}>
      <i className="ti ti-loader-2" style={{ fontSize: '28px', color: C.sage[400], display: 'block', marginBottom: spacing[2], animation: 'spin 1s linear infinite' }} aria-hidden="true" />
      <span>{label}</span>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({ icon = 'ti-inbox', title, description, action }: {
  icon?: string
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div style={misc.empty}>
      <i className={`ti ${icon}`} style={{ fontSize: '36px', color: C.stone[300], display: 'block', marginBottom: spacing[3] }} aria-hidden="true" />
      <p style={{ fontSize: typography.size.md, fontWeight: typography.weight.medium, color: C.stone[600], marginBottom: spacing[1] }}>{title}</p>
      {description && <p style={{ fontSize: typography.size.sm, color: C.stone[400], marginBottom: spacing[5] }}>{description}</p>}
      {action && (
        <button style={btn.primary} onClick={action.onClick}>{action.label}</button>
      )}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

export function Badge({ children, variant = 'stone' }: {
  children: React.ReactNode
  variant?: keyof typeof badge | 'custom'
  bg?: string; color?: string
}) {
  const v = badge[variant as keyof typeof badge] as { bg: string; color: string }
  return <span style={badge.base(v.bg, v.color)}>{children}</span>
}

export function BadgeCustom({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
  return <span style={badge.base(bg, color)}>{children}</span>
}

// ─── Section Header ───────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={text.sectionLabel}>{children}</div>
}

// ─── Page Header ─────────────────────────────────────────────────────────────

export function PageHeader({
  crumbs, title, subtitle, action,
}: {
  crumbs: string[]
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing[7], gap: spacing[4], flexWrap: 'wrap' }}>
      <div>
        <div style={text.breadcrumb}>
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ color: C.stone[300] }}>›</span>}
              <span style={i === crumbs.length - 1 ? { color: C.stone[600] } : {}}>{c}</span>
            </React.Fragment>
          ))}
        </div>
        <h1 style={text.pageTitle}>{title}</h1>
        {subtitle && <p style={{ ...text.muted, marginTop: spacing[1] }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

export function KpiCard({ label, value, unit, icon, iconBg, iconColor, delta, deltaType = 'neutral', onClick }: {
  label: string
  value: number | string
  unit?: string
  icon: string
  iconBg: string
  iconColor: string
  delta?: string
  deltaType?: 'up' | 'down' | 'neutral' | 'warn'
  onClick?: () => void
}) {
  const [hov, setHov] = useState(false)
  const deltaColors = {
    up:      { bg: C.sage[50],   color: C.sage[600]  },
    down:    { bg: C.rose[50],   color: C.rose[700]  },
    warn:    { bg: C.amber[50],  color: C.amber[700] },
    neutral: { bg: C.stone[100], color: C.stone[500] },
  }
  const dc = deltaColors[deltaType]

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        backgroundColor: C.white,
        borderRadius: radius.lg,
        border: `1px solid ${hov && onClick ? C.sage[200] : C.stone[100]}`,
        boxShadow: hov && onClick ? '0 2px 8px rgba(0,0,0,.09), 0 4px 20px rgba(0,0,0,.06)' : '0 1px 4px rgba(0,0,0,.06), 0 2px 10px rgba(0,0,0,.04)',
        padding: `${spacing[5]} ${spacing[6]}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow .15s, border-color .15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] }}>
        <div style={{ width: '36px', height: '36px', borderRadius: radius.md, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`ti ${icon}`} style={{ fontSize: '17px', color: iconColor }} aria-hidden="true" />
        </div>
        {delta && (
          <span style={{ fontSize: '10px', fontWeight: typography.weight.medium, padding: '2px 8px', borderRadius: radius.full, backgroundColor: dc.bg, color: dc.color }}>
            {delta}
          </span>
        )}
      </div>
      <div style={{ fontSize: '26px', fontWeight: typography.weight.medium, color: C.stone[800], lineHeight: 1, marginBottom: spacing[1] }}>
        {value}{unit}
      </div>
      <div style={{ fontSize: typography.size.xs, color: C.stone[400], fontWeight: typography.weight.medium }}>
        {label}
      </div>
    </div>
  )
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

export function ConfirmModal({ title, description, confirmLabel = 'Confirmer', danger = false, loading = false, onConfirm, onCancel }: {
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div style={modal.overlay}>
      <div style={{ ...modal.container, maxWidth: '400px' }} role="dialog" aria-modal="true">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[4], marginBottom: spacing[6] }}>
          <div style={{ width: '40px', height: '40px', borderRadius: radius.full, backgroundColor: danger ? C.rose[50] : C.amber[50], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`ti ${danger ? 'ti-trash' : 'ti-alert-triangle'}`} style={{ fontSize: '18px', color: danger ? C.rose[500] : C.amber[500] }} aria-hidden="true" />
          </div>
          <div>
            <h2 style={{ fontSize: typography.size.xl, fontWeight: typography.weight.medium, color: C.stone[800], marginBottom: spacing[1] }}>{title}</h2>
            {description && <p style={{ fontSize: typography.size.base, color: C.stone[500], lineHeight: 1.6 }}>{description}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing[2] }}>
          <button style={btn.ghost} onClick={onCancel} disabled={loading}>Annuler</button>
          <button
            style={{ ...(danger ? btn.danger : btn.primary), opacity: loading ? 0.7 : 1 }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <><i className="ti ti-loader-2" style={{ fontSize: '14px', animation: 'spin 1s linear infinite' }} aria-hidden="true" /> En cours…</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

export function ProgressBar({ value, total, showLabel = true }: { value: number; total: number; showLabel?: boolean }) {
  const pct   = total ? Math.round((value / total) * 100) : 0
  const color = pct >= 80 ? C.sage[500] : pct >= 50 ? C.amber[500] : C.rose[500]
  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: typography.size.xs, marginBottom: '4px' }}>
          <span style={{ color: C.stone[500] }}>Progression</span>
          <span style={{ fontWeight: typography.weight.medium, color }}>{value}/{total} ({pct}%)</span>
        </div>
      )}
      <div style={{ height: '5px', borderRadius: radius.full, backgroundColor: C.stone[100] }}>
        <div style={{ height: '100%', borderRadius: radius.full, backgroundColor: color, width: `${pct}%`, transition: 'width .4s ease' }} />
      </div>
    </div>
  )
}

// ─── Note Value ───────────────────────────────────────────────────────────────

export function NoteValue({ note, suffix = '/20' }: { note: number | null; suffix?: string }) {
  if (note === null) return <span style={{ color: C.stone[300], fontSize: typography.size.sm }}>— en attente</span>
  return (
    <span>
      <span style={misc.noteValue(note)}>{note.toFixed(2)}</span>
      <span style={{ fontSize: typography.size.xs, color: C.stone[400] }}>{suffix}</span>
    </span>
  )
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

export function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  const [show, setShow] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '6px', backgroundColor: C.stone[800], color: C.white, fontSize: typography.size.xs, padding: '4px 8px', borderRadius: radius.md, whiteSpace: 'nowrap', zIndex: 300, pointerEvents: 'none' }}>
          {label}
        </span>
      )}
    </span>
  )
}

// ─── Input with focus style ───────────────────────────────────────────────────

export function Input({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <input
        {...props}
        style={{
          width: '100%',
          padding: `${spacing[2]} ${spacing[4]}`,
          borderRadius: radius.md,
          border: `1px solid ${error ? C.rose[500] : focused ? C.sage[400] : C.stone[200]}`,
          fontSize: typography.size.md,
          backgroundColor: C.white,
          color: C.stone[800],
          outline: 'none',
          boxSizing: 'border-box' as const,
          fontFamily: typography.fontFamily,
          transition: 'border-color .15s',
          ...props.style,
        }}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e  => { setFocused(false); props.onBlur?.(e) }}
      />
      {error && <p style={{ fontSize: typography.size.xs, color: C.rose[600], marginTop: spacing[1] }}>{error}</p>}
    </div>
  )
}

// ─── Select ──────────────────────────────────────────────────────────────────

export function Select({ error, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <select
        {...props}
        style={{
          width: '100%',
          padding: `${spacing[2]} ${spacing[4]}`,
          borderRadius: radius.md,
          border: `1px solid ${error ? C.rose[500] : focused ? C.sage[400] : C.stone[200]}`,
          fontSize: typography.size.md,
          backgroundColor: C.white,
          color: C.stone[800],
          outline: 'none',
          boxSizing: 'border-box' as const,
          fontFamily: typography.fontFamily,
          transition: 'border-color .15s',
          ...props.style,
        }}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e  => { setFocused(false); props.onBlur?.(e) }}
      />
      {error && <p style={{ fontSize: typography.size.xs, color: C.rose[600], marginTop: spacing[1] }}>{error}</p>}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function Pagination({ page, total, pageSize = 10, onChange }: {
  page: number; total: number; pageSize?: number; onChange: (p: number) => void
}) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
    .reduce<(number | '…')[]>((acc, n, i, arr) => {
      if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('…')
      acc.push(n)
      return acc
    }, [])

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing[3]} ${spacing[6]}`, borderTop: `1px solid ${C.stone[100]}` }}>
      <span style={{ fontSize: typography.size.sm, color: C.stone[400] }}>
        Page {page} sur {totalPages} · {total} entrée{total !== 1 ? 's' : ''}
      </span>
      <div style={{ display: 'flex', gap: spacing[1] }}>
        <button
          style={{ ...btn.icon, opacity: page === 1 ? 0.4 : 1 }}
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Page précédente"
        >
          <i className="ti ti-chevron-left" style={{ fontSize: '14px' }} aria-hidden="true" />
        </button>
        {pages.map((n, i) =>
          n === '…' ? (
            <span key={`e-${i}`} style={{ padding: `0 ${spacing[2]}`, color: C.stone[400], fontSize: typography.size.sm, display: 'flex', alignItems: 'center' }}>…</span>
          ) : (
            <button
              key={n}
              onClick={() => onChange(n as number)}
              style={{
                ...btn.icon,
                backgroundColor: page === n ? C.sage[600] : 'transparent',
                color: page === n ? C.white : C.stone[600],
                borderColor: page === n ? C.sage[600] : C.stone[200],
                fontWeight: page === n ? typography.weight.medium : typography.weight.regular,
              }}
              aria-label={`Page ${n}`}
              aria-current={page === n ? 'page' : undefined}
            >
              {n}
            </button>
          )
        )}
        <button
          style={{ ...btn.icon, opacity: page === totalPages ? 0.4 : 1 }}
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Page suivante"
        >
          <i className="ti ti-chevron-right" style={{ fontSize: '14px' }} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}