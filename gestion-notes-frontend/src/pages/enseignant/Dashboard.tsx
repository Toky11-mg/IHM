// src/pages/enseignant/Dashboard.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Matiere {
  id: number
  nom: string
  code: string
  semestre: { id: number; nom: string }
  isActive: boolean
}

interface EnseignantProfile {
  id: number
  nomComplet: string
  nom: string
  prenom: string
  matricule: string
  grade: string
  specialite: string
  email: string
  statut: string
  dateEmbauche: string
  nbMatieresActives: number
  matieres: Matiere[]
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ENI = '#065f46'

const S: Record<string, React.CSSProperties> = {
  page:    { padding: '1.5rem', minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Inter, system-ui, sans-serif' },
  card:    { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', padding: '1.25rem' },
  cardNp:  { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', overflow: 'hidden' },
  title:   { fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '1rem' },
  skeleton:{ backgroundColor: '#f3f4f6', borderRadius: '8px', animation: 'pulse 1.5s infinite' },
}

// ─── Accès rapides ────────────────────────────────────────────────────────────

const QUICK = [
  { label: 'Saisir des notes',   path: '/enseignant/saisie-notes', icon: '✎',  color: '#1e40af', bg: '#dbeafe' },
  { label: 'Mes matières',       path: '/enseignant/mes-matieres', icon: '📚', color: '#065f46', bg: '#d1fae5' },
  { label: 'Historique',         path: '/enseignant/historique',   icon: '🕒', color: '#4c1d95', bg: '#ede9fe' },
]

// ─── Composant ────────────────────────────────────────────────────────────────

export default function DashboardEnseignant() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [profile, setProfile]   = useState<EnseignantProfile | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [time, setTime]         = useState(new Date())

  // Horloge
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Chargement profil
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<{ success: boolean; data: EnseignantProfile }>('/api/enseignants/me')
        if (res.data.success) setProfile(res.data.data)
      } catch {
        setError('Impossible de charger votre profil.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const prenom = profile?.prenom ?? user?.prenom ?? '—'

  return (
    <div style={S.page}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Enseignant › Dashboard</div>
          <h1 style={{ fontSize: '22px', fontWeight: 500, color: '#111827', margin: 0 }}>
            Bonjour, {prenom} 👋
          </h1>
          <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px', textTransform: 'capitalize' }}>
            {fmtDate(time)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: ENI, fontFamily: 'monospace' }}>
            {fmtTime(time)}
          </div>
          {profile && (
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>{profile.grade} · {profile.specialite}</div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* ── KPI ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
        {[
          {
            label: 'Matières actives',
            value: loading ? '…' : (profile?.nbMatieresActives ?? 0),
            icon: '📚', color: '#065f46', bg: '#d1fae5',
            sub: 'ce semestre',
          },
          {
            label: 'Matricule',
            value: loading ? '…' : (profile?.matricule ?? '—'),
            icon: '🪪', color: '#1e40af', bg: '#dbeafe',
            sub: 'identifiant unique',
          },
          {
            label: 'Statut',
            value: loading ? '…' : (profile?.statut === 'actif' ? 'Actif' : profile?.statut ?? '—'),
            icon: '✅', color: '#065f46', bg: '#d1fae5',
            sub: `depuis ${profile?.dateEmbauche?.slice(0, 4) ?? '—'}`,
          },
        ].map(({ label, value, icon, color, bg, sub }) => (
          <div key={label} style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                {icon}
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color, marginBottom: '2px' }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── 2 colonnes ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '1.5rem' }}>

        {/* Mes matières */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={S.title}>Mes matières</div>
            <button
              onClick={() => navigate('/enseignant/mes-matieres')}
              style={{ fontSize: '12px', color: ENI, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              Voir tout →
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1, 2].map(i => <div key={i} style={{ ...S.skeleton, height: '56px' }} />)}
            </div>
          ) : profile?.matieres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '13px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📭</div>
              Aucune matière assignée
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {profile?.matieres.map(m => (
                <div
                  key={m.id}
                  onClick={() => navigate('/enseignant/saisie-notes')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', border: '0.5px solid #e5e7eb', cursor: 'pointer', transition: 'background .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{m.nom}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                      <span style={{ fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '1px 5px', borderRadius: '4px' }}>{m.code}</span>
                      {' · '}{m.semestre.nom}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: m.isActive ? '#065f46' : '#9ca3af', backgroundColor: m.isActive ? '#d1fae5' : '#f3f4f6', padding: '3px 8px', borderRadius: '99px' }}>
                    {m.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accès rapides */}
        <div style={S.card}>
          <div style={S.title}>Accès rapides</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {QUICK.map(({ label, path, icon, color, bg }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: '0.5px solid #e5e7eb', backgroundColor: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'background .15s, border-color .15s' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = bg; e.currentTarget.style.borderColor = color }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb' }}
              >
                <span style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 }}>
                  {icon}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 500, color }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Profil résumé ───────────────────────────────────────────────── */}
      {profile && (
        <div style={S.card}>
          <div style={S.title}>Mon profil</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              { label: 'Nom complet',  value: profile.nomComplet },
              { label: 'Email',        value: profile.email },
              { label: 'Grade',        value: profile.grade.replace('_', ' ') },
              { label: 'Spécialité',   value: profile.specialite },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}