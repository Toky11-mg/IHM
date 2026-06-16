import { ReactNode } from 'react'

export default function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: '1.5rem',
      gap: '1rem',
      flexWrap: 'wrap',
    }}>
      <div>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: '#064e3b',
          margin: 0,
        }}>{title}</h1>
        {subtitle && (
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            marginTop: '0.25rem',
            margin: '0.25rem 0 0 0',
          }}>{subtitle}</p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  )
}