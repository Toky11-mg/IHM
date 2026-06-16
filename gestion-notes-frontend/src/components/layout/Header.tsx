// src/components/layout/Header.tsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ENI = { dark: '#064e3b', mid: '#065f46', light: '#047857' }

const ROLE_LABELS: Record<string, string> = {
  ROLE_SUPER_ADMIN: 'Super Administrateur',
  ROLE_ADMIN:       'Administrateur',
  ROLE_ENSEIGNANT:  'Enseignant',
  ROLE_ETUDIANT:    'Étudiant',
}

const BREADCRUMB_MAP: Record<string, string> = {
  // Admin
  'admin':          'Administration',
  'dashboard':      'Dashboard',
  'matieres':       'Matières',
  'annees':         'Années',
  'filieres':       'Filières',
  'etudiants':      'Étudiants',
  'enseignants':    'Enseignants',
  'deliberations':  'Délibérations',
  'statistiques':   'Statistiques',
  'audit':          'Audit',
  // Enseignant
  'enseignant':     'Enseignant',
  'mes-matieres':   'Mes matières',
  'saisie-notes':   'Saisie des notes',
  'historique':     'Historique',
  // Étudiant
  'etudiant':       'Étudiant',
  'mes-notes':      'Mes notes',
  'mes-releves':    'Mes relevés',
  'mes-reclamations': 'Mes réclamations',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  header: {
    height: '56px',
    backgroundColor: '#fff',
    borderBottom: '0.5px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.5rem',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#9ca3af',
  },
  sep: {
    color: '#d1d5db',
    fontSize: '12px',
  },
  current: {
    color: '#111827',
    fontWeight: 500,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: ENI.light,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    flexShrink: 0,
    border: '2px solid transparent',
    transition: 'border-color .15s',
  },
  avatarOpen: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: ENI.light,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    flexShrink: 0,
    border: `2px solid ${ENI.light}`,
  },
  dropdown: {
    position: 'absolute' as const,
    top: '52px',
    right: '1.5rem',
    width: '260px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '0.5px solid #e5e7eb',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    zIndex: 200,
    overflow: 'hidden',
  },
  dropHeader: {
    padding: '14px 16px',
    borderBottom: '0.5px solid #f3f4f6',
    backgroundColor: '#f9fafb',
  },
  dropItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    textAlign: 'left' as const,
    transition: 'background .1s',
  },
  notifDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#dc2626',
    position: 'absolute' as const,
    top: '0px',
    right: '0px',
    border: '1.5px solid #fff',
  },
}

// ─── Composant notification ───────────────────────────────────────────────────

function NotifBell({ count }: { count: number }) {
  return (
    <div style={{ position: 'relative', cursor: 'pointer' }} title={`${count} notification${count > 1 ? 's' : ''}`}>
      <span style={{ fontSize: '18px' }}>🔔</span>
      {count > 0 && (
        <div style={S.notifDot} />
      )}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Header() {
  const { user, logout, hasRole } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [open, setOpen] = useState(false)
  const dropRef   = useRef<HTMLDivElement>(null)

  // Fermer dropdown au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fermer au changement de route
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Breadcrumb depuis l'URL
  const segments = location.pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map(s => BREADCRUMB_MAP[s] ?? s)

  // Initiales
  const initials = user
    ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()
    : '?'

  // Rôle affiché
  const roleLabel = user?.roles
    ? (ROLE_LABELS[user.roles[0]] ?? user.roles[0])
    : '—'

  // Lien profil selon rôle
  const profilePath =
    hasRole('ROLE_ADMIN') || hasRole('ROLE_SUPER_ADMIN') ? '/admin/dashboard' :
    hasRole('ROLE_ENSEIGNANT') ? '/enseignant/dashboard' :
    '/etudiant/dashboard'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header style={S.header}>

      {/* ── Breadcrumb ────────────────────────────────────────────────── */}
      <nav style={S.breadcrumb} aria-label="Fil d'Ariane">
        <span
          style={{ cursor: 'pointer', color: ENI.light, fontWeight: 500 }}
          onClick={() => navigate(profilePath)}
        >
          ENI Notes
        </span>
        {breadcrumbs.map((crumb, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={S.sep}>›</span>
            <span style={i === breadcrumbs.length - 1 ? S.current : { cursor: 'pointer' }}
              onClick={() => {
                if (i < breadcrumbs.length - 1) {
                  const path = '/' + segments.slice(0, i + 1).join('/')
                  navigate(path)
                }
              }}
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* ── Droite ────────────────────────────────────────────────────── */}
      <div style={S.right}>

        {/* Notif */}
        <NotifBell count={3} />

        {/* Année active */}
        <div style={{ fontSize: '12px', color: '#9ca3af', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '99px', fontWeight: 500 }}>
          📅 2024-2025
        </div>

        {/* Avatar + dropdown */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <div
            style={open ? S.avatarOpen : S.avatar}
            onClick={() => setOpen(o => !o)}
            title="Mon compte"
            role="button"
            aria-expanded={open}
            aria-label="Menu utilisateur"
          >
            {initials}
          </div>

          {open && (
            <div style={S.dropdown}>

              {/* Infos utilisateur */}
              <div style={S.dropHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ ...S.avatarOpen, width: '40px', height: '40px', fontSize: '15px', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.prenom} {user?.nom}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.email}
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: ENI.light, backgroundColor: '#d1fae5', padding: '2px 7px', borderRadius: '99px' }}>
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: '6px 0' }}>
                <button
                  style={S.dropItem}
                  onClick={() => { navigate(profilePath); setOpen(false) }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ fontSize: '16px' }}>🏠</span>
                  <span>Dashboard</span>
                </button>

                {(hasRole('ROLE_ADMIN') || hasRole('ROLE_SUPER_ADMIN')) && (
                  <button
                    style={S.dropItem}
                    onClick={() => { navigate('/admin/audit'); setOpen(false) }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span style={{ fontSize: '16px' }}>🔍</span>
                    <span>Journal d'audit</span>
                  </button>
                )}

                {hasRole('ROLE_ETUDIANT') && (
                  <button
                    style={S.dropItem}
                    onClick={() => { navigate('/etudiant/mes-reclamations'); setOpen(false) }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span style={{ fontSize: '16px' }}>📩</span>
                    <span>Mes réclamations</span>
                  </button>
                )}
              </div>

              {/* Séparateur */}
              <div style={{ borderTop: '0.5px solid #f3f4f6', padding: '6px 0' }}>
                <button
                  style={{ ...S.dropItem, color: '#dc2626' }}
                  onClick={handleLogout}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ fontSize: '16px' }}>🚪</span>
                  <span style={{ fontWeight: 500 }}>Déconnexion</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </header>
  )
}