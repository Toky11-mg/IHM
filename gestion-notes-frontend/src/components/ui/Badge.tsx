type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral'

const styles: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: '#d1fae5', color: '#065f46' },
  danger:  { bg: '#fee2e2', color: '#991b1b' },
  warning: { bg: '#fef3c7', color: '#92400e' },
  info:    { bg: '#dbeafe', color: '#1e40af' },
  neutral: { bg: '#f3f4f6', color: '#374151' },
}

export default function Badge({
  label,
  variant = 'neutral',
}: {
  label: string
  variant?: BadgeVariant
}) {
  const s = styles[variant]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.65rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      background: s.bg,
      color: s.color,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}