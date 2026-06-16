import { ReactNode, useState } from 'react'

export default function Tooltip({
  children,
  text,
  position = 'top',
}: {
  children: ReactNode
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}) {
  const [visible, setVisible] = useState(false)

  const pos: Record<string, object> = {
    top:    { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '6px' },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '6px' },
    left:   { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '6px' },
    right:  { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '6px' },
  }

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div style={{
          position: 'absolute',
          ...pos[position],
          background: '#1f2937',
          color: 'white',
          padding: '0.35rem 0.75rem',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          pointerEvents: 'none',
        }}>
          {text}
        </div>
      )}
    </div>
  )
}