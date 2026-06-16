import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react'
import { useState } from 'react'

type AlertType = 'success' | 'warning' | 'info' | 'error'

const config: Record<AlertType, { icon: typeof Info; bg: string; color: string; border: string }> = {
  success: { icon: CheckCircle, bg: '#f0fdf4', color: '#065f46', border: '#bbf7d0' },
  warning: { icon: AlertTriangle, bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  info:    { icon: Info, bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  error:   { icon: XCircle, bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
}

export default function Alert({
  type = 'info',
  title,
  message,
  dismissible = false,
}: {
  type?: AlertType
  title?: string
  message: string
  dismissible?: boolean
}) {
  const [visible, setVisible] = useState(true)
  if (!visible) return null
  const c = config[type]
  const Icon = c.icon
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
      padding: '1rem 1.25rem', borderRadius: '12px',
      background: c.bg, border: `1px solid ${c.border}`,
      marginBottom: '1rem',
    }}>
      <Icon size={18} color={c.color} style={{ flexShrink: 0, marginTop: '1px' }} />
      <div style={{ flex: 1 }}>
        {title && <p style={{ fontWeight: 700, color: c.color, margin: '0 0 0.15rem 0', fontSize: '0.875rem' }}>{title}</p>}
        <p style={{ color: c.color, fontSize: '0.875rem', margin: 0 }}>{message}</p>
      </div>
      {dismissible && (
        <button onClick={() => setVisible(false)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: c.color, padding: 0, flexShrink: 0,
        }}>
          <X size={16} />
        </button>
      )}
    </div>
  )
}