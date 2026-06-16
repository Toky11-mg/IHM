// src/components/ui/Modal.tsx
// Composant Modal universel — ENI 2026
// Usage: <Modal title="..." onClose={...}> contenu </Modal>
// Usage confirm: <ConfirmModal message="..." onConfirm={...} onCancel={...} variant="danger|warning" />

import { useEffect, useRef } from 'react'

// ─── Tokens design ENI ────────────────────────────────────────────────────────

const ENI = {
  green:  '#065f46',
  red:    '#dc2626',
  yellow: '#d97706',
}

// ─── Overlay ─────────────────────────────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.4)',
  backdropFilter: 'blur(2px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 300,
  padding: '1rem',
  animation: 'fadeIn 0.15s ease',
}

// ─── Tailles modal ────────────────────────────────────────────────────────────

const SIZES = {
  sm:  '380px',
  md:  '500px',
  lg:  '640px',
  xl:  '760px',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ModalProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  onClose: () => void
  size?: keyof typeof SIZES
  icon?: React.ReactNode
  iconBg?: string
  iconColor?: string
  footer?: React.ReactNode
  loading?: boolean
  noPadding?: boolean
}

// ─── Modal principal ──────────────────────────────────────────────────────────

export function Modal({
  title,
  subtitle,
  children,
  onClose,
  size = 'md',
  icon,
  iconBg = '#d1fae5',
  iconColor = ENI.green,
  footer,
  loading = false,
  noPadding = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Fermer avec Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, loading])

  // Focus trap basique
  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  return (
    <div
      style={overlayStyle}
      onClick={e => e.target === e.currentTarget && !loading && onClose()}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: SIZES[size],
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
          border: '0.5px solid #e5e7eb',
          animation: 'slideUp 0.2s ease',
          outline: 'none',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '1.25rem 1.5rem',
          borderBottom: '0.5px solid #f3f4f6',
        }}>
          {icon && (
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '18px',
              color: iconColor,
            }}>
              {icon}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              id="modal-title"
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#111827',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Fermer"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: '18px',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            ✕
          </button>
        </div>

        {/* Corps */}
        <div style={{ padding: noPadding ? 0 : '1.5rem' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            padding: '1rem 1.5rem',
            borderTop: '0.5px solid #f3f4f6',
            backgroundColor: '#fafafa',
            borderRadius: '0 0 16px 16px',
          }}>
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  )
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  title?: string
  message: string
  detail?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  title,
  message,
  detail,
  confirmLabel = 'Confirmer',
  cancelLabel  = 'Annuler',
  variant      = 'danger',
  loading      = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const CFG = {
    danger:  { icon: '🗑️', iconBg: '#fee2e2', iconColor: '#dc2626', btnBg: '#dc2626', title: title ?? 'Supprimer ?' },
    warning: { icon: '⚠️', iconBg: '#fef9c3', iconColor: '#d97706', btnBg: '#d97706', title: title ?? 'Attention' },
    info:    { icon: 'ℹ️', iconBg: '#dbeafe', iconColor: '#1e40af', btnBg: ENI.green,  title: title ?? 'Confirmation' },
  }[variant]

  return (
    <Modal
      title={CFG.title}
      icon={CFG.icon}
      iconBg={CFG.iconBg}
      iconColor={CFG.iconColor}
      onClose={onCancel}
      size="sm"
      loading={loading}
      footer={
        <>
          <BtnGhost onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </BtnGhost>
          <BtnPrimary
            onClick={onConfirm}
            disabled={loading}
            bg={CFG.btnBg}
          >
            {loading ? '⏳ ...' : confirmLabel}
          </BtnPrimary>
        </>
      }
    >
      <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 8px', lineHeight: 1.6 }}>
        {message}
      </p>
      {detail && (
        <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>
          {detail}
        </p>
      )}
    </Modal>
  )
}

// ─── Boutons réutilisables ────────────────────────────────────────────────────

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  bg?: string
  color?: string
}

export function BtnPrimary({ children, bg = ENI.green, color = '#fff', disabled, style, ...rest }: BtnProps) {
  return (
    <button
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '9px 18px',
        borderRadius: '9px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none',
        backgroundColor: disabled ? '#d1d5db' : bg,
        color: disabled ? '#9ca3af' : color,
        transition: 'opacity 0.15s',
        opacity: disabled ? 0.7 : 1,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

export function BtnGhost({ children, disabled, style, ...rest }: BtnProps) {
  return (
    <button
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        borderRadius: '9px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: '0.5px solid #d1d5db',
        backgroundColor: 'transparent',
        color: '#374151',
        transition: 'background 0.15s',
        ...style,
      }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.backgroundColor = '#f9fafb')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      {...rest}
    >
      {children}
    </button>
  )
}

// ─── FormField ────────────────────────────────────────────────────────────────
// Champ de formulaire avec label, erreur et aide intégrés

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}

export function FormField({ label, required, error, hint, children }: FormFieldProps) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: 600,
        color: '#374151',
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
      {hint && !error && (
        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{hint}</p>
      )}
      {error && (
        <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ⚠ {error}
        </p>
      )}
    </div>
  )
}

// ─── Input stylisé ────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ error, style, ...rest }: InputProps) {
  return (
    <input
      style={{
        width: '100%',
        padding: '9px 12px',
        borderRadius: '9px',
        border: `1px solid ${error ? '#ef4444' : '#e5e7eb'}`,
        fontSize: '14px',
        color: '#111827',
        backgroundColor: '#f9fafb',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s, background 0.15s',
        ...style,
      }}
      onFocus={e => { e.target.style.borderColor = ENI.green; e.target.style.backgroundColor = '#fff' }}
      onBlur={e  => { e.target.style.borderColor = error ? '#ef4444' : '#e5e7eb'; e.target.style.backgroundColor = '#f9fafb' }}
      {...rest}
    />
  )
}

// ─── Select stylisé ───────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export function Select({ error, style, children, ...rest }: SelectProps) {
  return (
    <select
      style={{
        width: '100%',
        padding: '9px 12px',
        borderRadius: '9px',
        border: `1px solid ${error ? '#ef4444' : '#e5e7eb'}`,
        fontSize: '14px',
        color: '#111827',
        backgroundColor: '#f9fafb',
        outline: 'none',
        boxSizing: 'border-box',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        ...style,
      }}
      onFocus={e => { e.target.style.borderColor = ENI.green; e.target.style.backgroundColor = '#fff' }}
      onBlur={e  => { e.target.style.borderColor = error ? '#ef4444' : '#e5e7eb'; e.target.style.backgroundColor = '#f9fafb' }}
      {...rest}
    >
      {children}
    </select>
  )
}

// ─── Textarea stylisé ─────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function Textarea({ error, style, ...rest }: TextareaProps) {
  return (
    <textarea
      style={{
        width: '100%',
        padding: '9px 12px',
        borderRadius: '9px',
        border: `1px solid ${error ? '#ef4444' : '#e5e7eb'}`,
        fontSize: '14px',
        color: '#111827',
        backgroundColor: '#f9fafb',
        outline: 'none',
        boxSizing: 'border-box',
        resize: 'vertical',
        minHeight: '90px',
        fontFamily: 'inherit',
        transition: 'border-color 0.15s, background 0.15s',
        ...style,
      }}
      onFocus={e => { e.target.style.borderColor = ENI.green; e.target.style.backgroundColor = '#fff' }}
      onBlur={e  => { e.target.style.borderColor = error ? '#ef4444' : '#e5e7eb'; e.target.style.backgroundColor = '#f9fafb' }}
      {...rest}
    />
  )
}

// ─── Alert inline ─────────────────────────────────────────────────────────────

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  children: React.ReactNode
  onDismiss?: () => void
}

const ALERT_CFG = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#065f46', icon: '✓' },
  error:   { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', icon: '✕' },
  warning: { bg: '#fffbeb', border: '#fde68a', color: '#d97706', icon: '⚠' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', icon: 'ℹ' },
}

export function Alert({ type, children, onDismiss }: AlertProps) {
  const cfg = ALERT_CFG[type]
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      padding: '11px 14px',
      borderRadius: '10px',
      backgroundColor: cfg.bg,
      border: `1px solid ${cfg.border}`,
      color: cfg.color,
      fontSize: '13px',
      marginBottom: '1rem',
    }}>
      <span style={{ fontSize: '14px', flexShrink: 0, fontWeight: 700 }}>{cfg.icon}</span>
      <span style={{ flex: 1, lineHeight: 1.5 }}>{children}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: cfg.color, fontSize: '16px', padding: '0 2px', flexShrink: 0 }}
        >
          ✕
        </button>
      )}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  bg: string
  color: string
  children: React.ReactNode
  dot?: boolean
}

export function Badge({ bg, color, children, dot }: BadgeProps) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: dot ? '5px' : 0,
      padding: '3px 9px',
      borderRadius: '99px',
      fontSize: '11px',
      fontWeight: 600,
      backgroundColor: bg,
      color,
    }}>
      {dot && (
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
      )}
      {children}
    </span>
  )
}