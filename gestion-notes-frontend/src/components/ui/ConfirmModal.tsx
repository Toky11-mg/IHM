import { AlertTriangle } from 'lucide-react'

export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
}: {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '2rem', maxWidth: '400px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: '#fef2f2', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <AlertTriangle size={22} color="#dc2626" />
          </div>
          <div>
            <p style={{ fontWeight: 700, color: '#111827', margin: '0 0 0.25rem 0' }}>{title}</p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>{message}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '0.6rem 1.25rem', borderRadius: '8px',
            border: '1px solid #e5e7eb', background: 'white',
            color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
          }}>
            Annuler
          </button>
          <button onClick={onConfirm} disabled={loading} style={{
            padding: '0.6rem 1.25rem', borderRadius: '8px',
            border: 'none', background: '#dc2626',
            color: 'white', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Suppression...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}