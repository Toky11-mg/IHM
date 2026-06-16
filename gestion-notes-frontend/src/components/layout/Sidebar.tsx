// src/components/layout/Sidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface NavItem {
  label: string
  path: string
  icon: string
}

const NAV_ADMIN: NavItem[] = [
  { label: 'Dashboard',      path: '/admin/dashboard',     icon: '▦'  },
  { label: 'Matières',       path: '/admin/matieres',      icon: '📚' },
  { label: 'Filières',       path: '/admin/filieres',      icon: '🏫' },
  { label: 'Étudiants',      path: '/admin/etudiants',     icon: '👥' },
  { label: 'Enseignants',    path: '/admin/enseignants',   icon: '👨‍🏫' },
  { label: 'Années',         path: '/admin/annees',        icon: '📅' },
  { label: 'Délibérations',  path: '/admin/deliberations', icon: '📋' },
  { label: 'Statistiques',   path: '/admin/statistiques',  icon: '📊' },
  { label: 'Audit',          path: '/admin/audit',         icon: '🔍' },
]

const NAV_ENSEIGNANT: NavItem[] = [
  { label: 'Dashboard',      path: '/enseignant/dashboard',    icon: '▦'  },
  { label: 'Mes matières',   path: '/enseignant/mes-matieres', icon: '📚' },
  { label: 'Saisie notes',   path: '/enseignant/saisie-notes', icon: '✎'  },
  { label: 'Historique',     path: '/enseignant/historique',   icon: '🕐' },
]

const NAV_ETUDIANT: NavItem[] = [
  { label: 'Dashboard',      path: '/etudiant/dashboard',        icon: '▦'  },
  { label: 'Mes notes',      path: '/etudiant/mes-notes',        icon: '📝' },
  { label: 'Mes relevés',    path: '/etudiant/mes-releves',      icon: '📄' },
  { label: 'Réclamations',   path: '/etudiant/mes-reclamations', icon: '📩' },
]

const ENI = { dark: '#064e3b', mid: '#065f46', light: '#047857' }

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()

  const navItems =
    hasRole('ROLE_ADMIN') || hasRole('ROLE_SUPER_ADMIN') ? NAV_ADMIN :
    hasRole('ROLE_ENSEIGNANT') ? NAV_ENSEIGNANT :
    hasRole('ROLE_ETUDIANT')   ? NAV_ETUDIANT :
    []

  const roleLabel =
    hasRole('ROLE_SUPER_ADMIN') ? 'Super Admin' :
    hasRole('ROLE_ADMIN')       ? 'Administrateur' :
    hasRole('ROLE_ENSEIGNANT')  ? 'Enseignant' :
    hasRole('ROLE_ETUDIANT')    ? 'Étudiant' :
    'Utilisateur'

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside style={{ width: '240px', minHeight: '100vh', backgroundColor: ENI.dark, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

      {/* Logo */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
          ENI Notes
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
          Système de gestion des notes
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
              backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              textDecoration: 'none',
              transition: 'all .15s',
            })}
          >
            <span style={{ fontSize: '15px' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '1rem', borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: ENI.light, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.prenom} {user?.nom}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{roleLabel}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{ width: '100%', padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          🚪 Déconnexion
        </button>
      </div>
    </aside>
  )
}