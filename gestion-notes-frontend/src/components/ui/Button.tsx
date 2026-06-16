import { LucideIcon, Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

const styles: Record<ButtonVariant, { bg: string; color: string; border: string; hover: string }> = {
  primary:   { bg: '#065f46', color: 'white',   border: 'none',          hover: '#047857' },
  secondary: { bg: 'white',   color: '#065f46', border: '1px solid #065f46', hover: '#f0fdf4' },
  danger:    { bg: '#dc2626', color: 'white',   border: 'none',          hover: '#b91c1c' },
  ghost:     { bg: 'transparent', color: '#374151', border: '1px solid #e5e7eb', hover: '#f9fafb' },
}

export default function Button({
  label,
  onClick,
  variant = 'primary',
  icon: Icon,
  loading = false,
  disabled = false,
  type = 'button',
}: {
  label: string
  onClick?: () => void
  variant?: ButtonVariant
  icon?: LucideIcon
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const s = styles[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.6rem 1.25rem',
        borderRadius: '10px',
        border: s.border,
        background: s.bg,
        color: s.color,
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'background 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        if (!disabled && !loading)
          e.currentTarget.style.background = s.hover
      }}
      onMouseLeave={e => {
        if (!disabled && !loading)
          e.currentTarget.style.background = s.bg
      }}
    >
      {loading
        ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
        : Icon && <Icon size={15} />
      }
      {label}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  )
}