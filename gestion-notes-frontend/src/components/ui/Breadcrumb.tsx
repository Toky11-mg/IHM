import { useNavigate } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  path?: string
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const navigate = useNavigate()
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      fontSize: '0.8rem',
      color: '#6b7280',
      marginBottom: '1rem',
      flexWrap: 'wrap',
    }}>
      <Home size={13} color="#065f46" />
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <ChevronRight size={13} color="#d1d5db" />
          {item.path && i < items.length - 1 ? (
            <button
              onClick={() => navigate(item.path!)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#065f46',
                fontWeight: 500,
                fontSize: '0.8rem',
                padding: 0,
              }}
            >
              {item.label}
            </button>
          ) : (
            <span style={{
              color: i === items.length - 1 ? '#111827' : '#6b7280',
              fontWeight: i === items.length - 1 ? 600 : 400,
            }}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}