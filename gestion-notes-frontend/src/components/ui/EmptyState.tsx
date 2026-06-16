import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      gap: '0.75rem',
      textAlign: 'center',
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        background: '#f0fdf4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '0.5rem',
      }}>
        <Icon size={28} color="#065f46" />
      </div>
      <p style={{
        fontSize: '1rem',
        fontWeight: 700,
        color: '#111827',
        margin: 0,
      }}>{title}</p>
      {description && (
        <p style={{
          fontSize: '0.875rem',
          color: '#6b7280',
          margin: 0,
          maxWidth: '360px',
        }}>{description}</p>
      )}
      {action && <div style={{ marginTop: '0.5rem' }}>{action}</div>}
    </div>
  )
}