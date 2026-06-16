import { ClipboardList, BarChart3, Trophy, CheckCircle } from 'lucide-react'
import { StatCard, PageHeader, Breadcrumb, Alert } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'

export default function DashboardResponsable() {
  const { user } = useAuth()
  return (
    <div>
      <Breadcrumb items={[{ label: 'Responsable Pédagogique' }, { label: 'Tableau de bord' }]} />
      <PageHeader
        title="Espace Responsable Pédagogique"
        subtitle={`Bienvenue, ${user?.prenom} ${user?.nom}`}
      />
      <Alert
        type="warning"
        title="Délibérations en attente"
        message="2 délibérations sont en attente de validation pour le semestre S2."
        dismissible
      />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <StatCard label="Délibérations"    value="—" icon={ClipboardList} color="#065f46" bg="#d1fae5" />
        <StatCard label="Statistiques"     value="—" icon={BarChart3}     color="#1e40af" bg="#dbeafe" />
        <StatCard label="Classements"      value="—" icon={Trophy}        color="#b45309" bg="#fef3c7" />
        <StatCard label="Validées"         value="—" icon={CheckCircle}   color="#7c3aed" bg="#ede9fe" />
      </div>
      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '1.5rem', boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#064e3b', fontSize: '0.95rem', fontWeight: 700 }}>
          Actions rapides
        </h3>
        {[
          { label: '📋 Gérer les délibérations', path: '/responsable/deliberations' },
          { label: '📊 Voir les statistiques',   path: '/responsable/statistiques' },
          { label: '🏆 Consulter les classements', path: '/responsable/classements' },
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