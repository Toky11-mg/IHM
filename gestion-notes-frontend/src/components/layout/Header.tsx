import { useAuth } from '../../context/AuthContext'
import { LogOut, User, Bell } from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuth()

  const getRoleLabel = (roles: string[]) => {
    if (roles.includes('ROLE_ADMIN')) return 'Administrateur'
    if (roles.includes('ROLE_ENSEIGNANT')) return 'Enseignant'
    if (roles.includes('ROLE_ETUDIANT')) return 'Étudiant'
    return 'Utilisateur'
  }

  return (
    <header className="bg-white shadow-sm px-6 py-4 flex
                       items-center justify-between">
      <div />

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-400
                           hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2
                           bg-red-500 rounded-full" />
        </button>

        {/* Profil */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-full
                          flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-800">
              {user?.email}
            </p>
            <p className="text-xs text-gray-500">
              {getRoleLabel(user?.roles ?? [])}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2
                     text-sm text-red-600 hover:bg-red-50
                     rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  )
}