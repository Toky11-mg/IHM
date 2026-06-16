import { LucideIcon } from 'lucide-react'

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = '#065f46',
  bg = '#d1fae5',
  trend,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  color?: string
  bg?: string
  trend?: { value: string; up: boolean }
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1rem',
      border: '1px solid #f3f4f6',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={22} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: '0.8rem',
          color: '#6b7280',
          margin: '0 0 0.25rem 0',
          fontWeight: 500,
        }}>{label}</p>
        <p style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#111827',
          margin: 0,
          lineHeight: 1,
        }}>{value}</p>
        {trend && (
          <p style={{
            fontSize: '0.75rem',
            color: trend.up ? '#065f46' : '#dc2626',
            marginTop: '0.35rem',
            fontWeight: 500,
          }}>
            {trend.up ? '▲' : '▼'} {trend.value}
          </p>
        )}
      </div>
    </div>
  )
}