import { FileText, BarChart3, Users, TrendingUp } from 'lucide-react'
import { StatCard, PageHeader, Breadcrumb } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'

export default function DashboardDepartement() {
  const { user } = useAuth()
  return (
    <div>
      <Breadcrumb items={[{ label: 'Chef de Département' }, { label: 'Tableau de bord' }]} />
      <PageHeader
        title="Espace Chef de Département"
        subtitle={`Bienvenue, ${user?.prenom} ${user?.nom}`}
      />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <StatCard label="Résultats"       value="—" icon={FileText}   color="#065f46" bg="#d1fae5" />
        <StatCard label="Statistiques"    value="—" icon={BarChart3}  color="#1e40af" bg="#dbeafe" />
        <StatCard label="Enseignants"     value="—" icon={Users}      color="#7c3aed" bg="#ede9fe" />
        <StatCard label="Taux réussite"   value="—" icon={TrendingUp} color="#b45309" bg="#fef3c7" />
      </div>
      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '1.5rem', boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#064e3b', fontSize: '0.95rem', fontWeight: 700 }}>
          Actions rapides
        </h3>
        {[
          { label: '📊 Voir les résultats',           path: '/departement/resultats' },
          { label: '📈 Statistiques du département',  path: '/departement/statistiques' },
        ].map(item => (
          <a key={item.path} href={item.path} style={{
            display: 'block', padding: '0.75rem', borderRadius: '8px',
            textDecoration: 'none', color: '#065f46', fontSize: '0.875rem',
            fontWeight: 500, marginBottom: '0.25rem',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  )
}