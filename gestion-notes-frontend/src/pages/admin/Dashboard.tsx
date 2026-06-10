import { useQuery } from '@tanstack/react-query'
import { Users, GraduationCap, BookOpen, TrendingUp } from 'lucide-react'
import api from '../../api/axios'

export default function DashboardAdmin() {
  const { data: etudiants } = useQuery({
    queryKey: ['etudiants-count'],
    queryFn: () => api.get('/api/etudiants').then(r => r.data)
  })

  const { data: enseignants } = useQuery({
    queryKey: ['enseignants-count'],
    queryFn: () => api.get('/api/enseignants').then(r => r.data)
  })

  const { data: matieres } = useQuery({
    queryKey: ['matieres-count'],
    queryFn: () => api.get('/api/matieres').then(r => r.data)
  })

  const stats = [
    {
      label: 'Étudiants',
      value: etudiants?.total ?? '...',
      icon: GraduationCap,
      color: 'bg-blue-500',
    },
    {
      label: 'Enseignants',
      value: enseignants?.total ?? '...',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      label: 'Matières',
      value: matieres?.total ?? '...',
      icon: BookOpen,
      color: 'bg-purple-500',
    },
    {
      label: 'Taux réussite',
      value: '—',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Tableau de bord
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map(stat => (
          <div key={stat.label}
               className="bg-white rounded-xl shadow-sm p-6
                          flex items-center gap-4">
            <div className={`${stat.color} p-3 rounded-lg`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Message de bienvenue */}
      <div className="bg-blue-50 border border-blue-200
                      rounded-xl p-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">
          🎓 Système de Gestion des Notes
        </h2>
        <p className="text-blue-600 text-sm">
          Bienvenue sur la plateforme de gestion académique.
          Utilisez le menu de gauche pour naviguer.
        </p>
      </div>
    </div>
  )
}