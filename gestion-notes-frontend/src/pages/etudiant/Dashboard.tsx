// src/pages/etudiant/Dashboard.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Note {
  id: number
  matiere: string
  code: string
  noteCc: string | null
  noteExamen: string | null
  noteFinale: string | null
  mention: string | null
  isValidee: boolean
  semestre: string
}

interface Deliberation {
  id: number
  semestre: string
  moyenneGenerale: string
  decision: string
  mentionGlobale: string
  isPublie: boolean
}

interface EtudiantProfile {
  id: number
  nomComplet: string
  prenom: string
  nom: string
  matricule: string
  email: string
  statut: string
  anneeEntree: number
  niveau: { id: number; nom: string }
  filiere: { id: number; nom: string }
  notes: Note[]
  deliberations: Deliberation[]
  reclamations: { id: number; statut: string }[]
  nbNotes: number
  nbReclamations: number
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

const MENTION_COLOR: Record<string, { color: string; bg: string }> = {
  'Très Bien': { color: '#065f46', bg: '#d1fae5' },
  'Bien':      { color: '#1e40af', bg: '#dbeafe' },
  'Assez Bien':{ color: '#854d0e', bg: '#fef9c3' },
  'Passable':  { color: '#374151', bg: '#f3f4f6' },
  'Insuffisant':{ color: '#991b1b', bg: '#fee2e2' },
}

const QUICK = [
  { label: 'Mes notes',        path: '/etudiant/mes-notes',        icon: '📊', color: '#1e40af', bg: '#dbeafe' },
  { label: 'Mes relevés',      path: '/etudiant/mes-releves',      icon: '📄', color: '#065f46', bg: '#d1fae5' },
  { label: 'Mes réclamations', path: '/etudiant/mes-reclamations', icon: '📩', color: '#854d0e', bg: '#fef9c3' },
]

// ─── Composant ────────────────────────────────────────────────────────────────

export default function DashboardEtudiant() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [profile, setProfile] = useState<EtudiantProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [time, setTime]       = useState(new Date())

  // Horloge
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Chargement profil
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<{ success: boolean; data: EtudiantProfile }>('/api/etudiants/me')
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

  // Dernière délibération publiée
  const lastDelib = profile?.deliberations.find(d => d.isPublie)

  // Réclamations en attente
  const reclamAttente = profile?.reclamations.filter(r => r.statut === 'en_attente').length ?? 0

  const prenom = profile?.prenom ?? user?.prenom ?? '—'

  return (
    <div style={S.page}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Étudiant › Dashboard</div>
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
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              {profile.filiere.nom} · {profile.niveau.nom}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* ── KPI ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
        {[
          {
            label: 'Notes enregistrées',
            value: loading ? '…' : profile?.nbNotes ?? 0,
            icon: '📝', color: '#1e40af', bg: '#dbeafe',
            sub: 'toutes matières',
          },
          {
            label: 'Moyenne générale',
            value: loading ? '…' : lastDelib ? `${parseFloat(lastDelib.moyenneGenerale).toFixed(2)}/20` : '—',
            icon: '📊', color: ENI, bg: '#d1fae5',
            sub: lastDelib ? lastDelib.semestre : 'pas encore de délibération',
          },
          {
            label: 'Statut académique',
            value: loading ? '…' : lastDelib ? lastDelib.decision : 'En cours',
            icon: lastDelib?.decision === 'Admis' ? '✅' : '📋',
            color: lastDelib?.decision === 'Admis' ? '#065f46' : '#854d0e',
            bg: lastDelib?.decision === 'Admis' ? '#d1fae5' : '#fef9c3',
            sub: lastDelib?.mentionGlobale ?? 'résultats en attente',
          },
          {
            label: 'Réclamations',
            value: loading ? '…' : profile?.nbReclamations ?? 0,
            icon: '📩', color: reclamAttente > 0 ? '#991b1b' : '#374151',
            bg: reclamAttente > 0 ? '#fee2e2' : '#f3f4f6',
            sub: reclamAttente > 0 ? `${reclamAttente} en attente` : 'aucune en attente',
          },
        ].map(({ label, value, icon, color, bg, sub }) => (
          <div key={label} style={S.card}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '10px' }}>
              {icon}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color, marginBottom: '2px' }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── 2 colonnes ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '1.5rem' }}>

        {/* Mes dernières notes */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={S.title}>Mes dernières notes</div>
            <button
              onClick={() => navigate('/etudiant/mes-notes')}
              style={{ fontSize: '12px', color: ENI, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              Voir tout →
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1, 2, 3].map(i => <div key={i} style={{ ...S.skeleton, height: '48px' }} />)}
            </div>
          ) : profile?.notes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '13px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📭</div>
              Aucune note disponible
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Les notes apparaîtront ici après saisie</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {profile?.notes.slice(0, 5).map(n => {
                const mc = n.mention ? (MENTION_COLOR[n.mention] ?? MENTION_COLOR['Passable']) : { color: '#9ca3af', bg: '#f3f4f6' }
                return (
                  <div key={n.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: '#111827' }}>{n.matiere}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                        <span style={{ fontFamily: 'monospace', backgroundColor: '#e5e7eb', padding: '1px 4px', borderRadius: '3px' }}>{n.code}</span>
                        {' · '}{n.semestre}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: mc.color }}>
                        {n.noteFinale ? parseFloat(n.noteFinale).toFixed(2) : '—'}/20
                      </div>
                      {n.mention && (
                        <span style={{ fontSize: '10px', fontWeight: 500, color: mc.color, backgroundColor: mc.bg, padding: '1px 6px', borderRadius: '99px' }}>
                          {n.mention}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Accès rapides + Infos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Accès rapides */}
          <div style={S.card}>
            <div style={S.title}>Accès rapides</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {QUICK.map(({ label, path, icon, color, bg }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: '0.5px solid #e5e7eb', backgroundColor: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'background .15s, border-color .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = bg; e.currentTarget.style.borderColor = color }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb' }}
                >
                  <span style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
                    {icon}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Infos académiques */}
          {profile && (
            <div style={S.card}>
              <div style={S.title}>Informations académiques</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Matricule', value: profile.matricule },
                  { label: 'Filière',   value: profile.filiere.nom },
                  { label: 'Niveau',    value: profile.niveau.nom },
                  { label: 'Promotion', value: `${profile.anneeEntree}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid #f3f4f6' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}