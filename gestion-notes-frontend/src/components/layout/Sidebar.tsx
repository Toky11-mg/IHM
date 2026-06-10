import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, GraduationCap,
  BookOpen, FileText, BarChart3,
  ClipboardList, Settings, School
} from 'lucide-react'

const menuAdmin = [
  { label: 'Tableau de bord', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Étudiants',       icon: GraduationCap,   path: '/admin/etudiants' },
  { label: 'Enseignants',     icon: Users,            path: '/admin/enseignants' },
  { label: 'Filières',        icon: School,           path: '/admin/filieres' },
  { label: 'Matières',        icon: BookOpen,         path: '/admin/matieres' },
  { label: 'Délibérations',   icon: ClipboardList,    path: '/admin/deliberations' },
  { label: 'Statistiques',    icon: BarChart3,        path: '/admin/statistiques' },
  { label: 'Audit',           icon: FileText,         path: '/admin/audit' },
]

const menuEnseignant = [
  { label: 'Tableau de bord', icon: LayoutDashboard, path: '/enseignant/dashboard' },
  { label: 'Saisie notes',    icon: FileText,        path: '/enseignant/notes' },
]

const menuEtudiant = [
  { label: 'Tableau de bord', icon: LayoutDashboard, path: '/etudiant/dashboard' },
  { label: 'Mes notes',       icon: FileText,        path: '/etudiant/notes' },
]

export default function Sidebar() {
  const { hasRole } = useAuth()

  const menu = hasRole('ROLE_ADMIN')
    ? menuAdmin
    : hasRole('ROLE_ENSEIGNANT')
    ? menuEnseignant
    : menuEtudiant

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <School className="w-8 h-8 text-blue-300" />
          <div>
            <h1 className="font-bold text-sm">Gestion Notes</h1>
            <p className="text-xs text-blue-400">Université</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menu.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg
               text-sm transition-colors ${
                isActive
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Version */}
      <div className="p-4 border-t border-blue-800">
        <p className="text-xs text-blue-400 text-center">v1.0.0 — IHM 2025</p>
      </div>
    </aside>
  )
}