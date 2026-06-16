// src/pages/admin/Dashboard.tsx — version API réelle
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { statistiqueService, type StatGlobale } from '../../api/services/statistiqueService'
import { deliberationService, type Deliberation } from '../../api/services/deliberationService'
import { auditService, type AuditLog } from '../../api/services/auditService'
import { anneeService, type Annee } from '../../api/services/anneeService'

const ENI = { dark: '#064e3b', mid: '#065f46', light: '#047857' }

const S = {
  page:    { padding: '1.5rem', minHeight: '100vh', backgroundColor: '#f9fafb' } as React.CSSProperties,
  card:    { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', padding: '1.25rem' } as React.CSSProperties,
  cardNp:  { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', overflow: 'hidden' } as React.CSSProperties,
  title:   { fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '1rem' } as React.CSSProperties,
  badge:   (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, backgroundColor: bg, color } as React.CSSProperties),
  btnSm:   (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: bg, color } as React.CSSProperties),
  errBox:  { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px' },
  spinner: { textAlign: 'center' as const, padding: '2rem', color: '#9ca3af', fontSize: '13px' },
}

const ALERT_CFG = {
  warning: { bg: '#fef9c3', color: '#854d0e', border: '#fde68a', icon: '⚠️' },
  info:    { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe', icon: 'ℹ️' },
  error:   { bg: '#fee2e2', color: '#991b1b', border: '#fecaca', icon: '🔴' },
}

interface AlertItem { id: number; message: string; type: 'warning' | 'info' | 'error' }

function KpiCard({ label, value, unit, icon, color, bg, path, delta, deltaPositive, onClick }: {
  label: string; value: number | string; unit?: string; icon: string
  color: string; bg: string; path: string; delta?: string
  deltaPositive?: boolean; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ backgroundColor: '#fff', borderRadius: '12px', border: `0.5px solid ${hovered ? color : '#e5e7eb'}`, padding: '1.1rem', cursor: 'pointer', transition: 'border-color .15s, box-shadow .15s', boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.08)' : 'none' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
          {icon}
        </div>
        {delta && (
          <span style={{ fontSize: '11px', color: deltaPositive === false ? '#dc2626' : deltaPositive ? ENI.light : '#9ca3af', backgroundColor: deltaPositive === false ? '#fee2e2' : deltaPositive ? '#d1fae5' : '#f3f4f6', padding: '2px 7px', borderRadius: '99px', fontWeight: 500 }}>
            {delta}
          </span>
        )}
      </div>
      <div style={{ fontSize: '26px', fontWeight: 700, color, marginBottom: '2px' }}>{value}{unit}</div>
      <div style={{ fontSize: '12px', color: '#9ca3af' }}>{label}</div>
    </div>
  )
}

export default function DashboardAdmin() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats]           = useState<StatGlobale | null>(null)
  const [delibs, setDelibs]         = useState<Deliberation[]>([])
  const [logs, setLogs]             = useState<AuditLog[]>([])
  const [anneeActive, setAnneeActive] = useState<Annee | null>(null)
  const [alerts, setAlerts]         = useState<AlertItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [time, setTime]             = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [s, d, l, a] = await Promise.all([
        statistiqueService.global(),
        deliberationService.list(),
        auditService.list({ limit: 7 }),
        anneeService.current().catch(() => null),
      ])
      setStats(s); setDelibs(d); setLogs(l); setAnneeActive(a)

      // Générer alertes dynamiques
      const dynamicAlerts: AlertItem[] = []
      if (s.notesSaisiesPct < 100) {
        dynamicAlerts.push({ id: 1, message: `${100 - s.notesSaisiesPct}% des notes ne sont pas encore saisies.`, type: 'warning' })
      }
      const nonPubliees = d.filter(x => !x.isPublie).length
      if (nonPubliees > 0) {
        dynamicAlerts.push({ id: 2, message: `${nonPubliees} délibération${nonPubliees > 1 ? 's' : ''} en attente de publication.`, type: 'info' })
      }
      setAlerts(dynamicAlerts)
    } catch {
      setError('Erreur de chargement du dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const fmtTime = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const fmtDate = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  const fmtLog  = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  const ACTION_ICON: Record<string, string> = {
    CONNEXION: '🔓', DECONNEXION: '🔒', CREATION: '➕',
    MODIFICATION: '✎', SUPPRESSION: '✕', VALIDATION: '✓', EXPORT: '📤',
  }

  const kpis = stats ? [
    { label: 'Étudiants',        value: stats.nbEtudiants,                icon: '👥', color: '#1e40af', bg: '#dbeafe', path: '/admin/etudiants',     unit: '', delta: undefined, deltaPositive: undefined },
    { label: 'Enseignants',      value: stats.nbEnseignants,              icon: '👨‍🏫', color: ENI.light, bg: '#d1fae5', path: '/admin/enseignants',   unit: '', delta: undefined, deltaPositive: undefined },
    { label: 'Matières',         value: stats.nbMatieres,                 icon: '📚', color: '#4c1d95', bg: '#ede9fe', path: '/admin/matieres',      unit: '', delta: undefined, deltaPositive: undefined },
    { label: 'Filières',         value: stats.nbFilieres,                 icon: '🏫', color: '#854d0e', bg: '#fef9c3', path: '/admin/filieres',      unit: '', delta: undefined, deltaPositive: undefined },
    { label: 'Taux de réussite', value: stats.tauxReussite,               icon: '📈', color: ENI.light, bg: '#d1fae5', path: '/admin/statistiques',  unit: '%', delta: undefined, deltaPositive: undefined },
    { label: 'Notes saisies',    value: stats.notesSaisiesPct ?? 0,       icon: '✎',  color: '#1e40af', bg: '#dbeafe', path: '/admin/matieres',      unit: '%', delta: `${100 - (stats.notesSaisiesPct ?? 0)}% restant`, deltaPositive: (stats.notesSaisiesPct ?? 0) >= 80 },
    { label: 'Délibérations',    value: delibs.length,                    icon: '📋', color: '#991b1b', bg: '#fee2e2', path: '/admin/deliberations', unit: '', delta: `${delibs.filter(d => !d.isPublie).length} en cours`, deltaPositive: undefined },
    { label: 'Année active',     value: anneeActive?.libelle ?? '—',      icon: '📅', color: '#374151', bg: '#f3f4f6', path: '/admin/annees',        unit: '', delta: undefined, deltaPositive: undefined },
  ] : []

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Administration › Dashboard</div>
          <h1 style={{ fontSize: '22px', fontWeight: 500 }}>Bonjour, {user?.prenom} 👋</h1>
          <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px', textTransform: 'capitalize' }}>{fmtDate(time)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: ENI.mid, fontFamily: 'monospace' }}>{fmtTime(time)}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            {anneeActive ? `Année : ${anneeActive.libelle}` : 'Aucune année active'}
          </div>
        </div>
      </div>

      {error && <div style={S.errBox}>⚠ {error} <button onClick={load} style={{ marginLeft: '8px', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontSize: '13px' }}>Réessayer</button></div>}

      {/* Alertes dynamiques */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
          {alerts.map(a => {
            const cfg = ALERT_CFG[a.type]
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 14px', borderRadius: '10px', backgroundColor: cfg.bg, border: `0.5px solid ${cfg.border}`, color: cfg.color, fontSize: '13px' }}>
                <span>{cfg.icon} {a.message}</span>
                <button onClick={() => setAlerts(p => p.filter(x => x.id !== a.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: cfg.color, fontSize: '16px', flexShrink: 0 }}>✕</button>
              </div>
            )
          })}
        </div>
      )}

      {/* KPI */}
      {loading ? (
        <div style={S.spinner}>⏳ Chargement des statistiques…</div>
      ) : (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={S.title}>Vue d'ensemble</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {kpis.map(k => (
                <KpiCard key={k.label} {...k} onClick={() => navigate(k.path)} />
              ))}
            </div>
          </div>

          {/* Deux colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '1.5rem' }}>

            {/* Délibérations récentes */}
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={S.title}>Délibérations récentes</div>
                <button style={S.btnSm('#f3f4f6', '#374151')} onClick={() => navigate('/admin/deliberations')}>Voir tout →</button>
              </div>
              {delibs.length === 0 ? (
                <div style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '1.5rem' }}>Aucune délibération.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {delibs.slice(0, 5).map(d => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{d.semestre}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                          Moy. <span style={{ fontWeight: 600, color: ENI.light }}>{parseFloat(d.moyenneGenerale).toFixed(2)}/20</span>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px',
                        backgroundColor: d.isPublie ? '#d1fae5' : '#dbeafe',
                        color: d.isPublie ? '#065f46' : '#1e40af',
                      }}>
                        {d.isPublie ? '✓ Publiée' : '○ En cours'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accès rapides */}
            <div style={S.card}>
              <div style={S.title}>Accès rapides</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'Nouvelle matière',    path: '/admin/matieres',      icon: '📚', color: '#4c1d95', bg: '#ede9fe' },
                  { label: 'Nouvel étudiant',     path: '/admin/etudiants',     icon: '👤', color: '#1e40af', bg: '#dbeafe' },
                  { label: 'Lancer délibération', path: '/admin/deliberations', icon: '📋', color: '#991b1b', bg: '#fee2e2' },
                  { label: 'Statistiques',        path: '/admin/statistiques',  icon: '📊', color: ENI.light, bg: '#d1fae5' },
                  { label: 'Gérer les années',    path: '/admin/annees',        icon: '📅', color: '#854d0e', bg: '#fef9c3' },
                  { label: "Journal d'audit",     path: '/admin/audit',         icon: '🔍', color: '#374151', bg: '#f3f4f6' },
                ].map(({ label, path, icon, color, bg }) => (
                  <button
                    key={label}
                    onClick={() => navigate(path)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: '0.5px solid #e5e7eb', backgroundColor: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'background .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = bg)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
                  >
                    <span style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Activité récente */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={S.title}>Activité récente</div>
              <button style={S.btnSm('#f3f4f6', '#374151')} onClick={() => navigate('/admin/audit')}>Journal complet →</button>
            </div>
            <div style={S.cardNp}>
              {logs.length === 0 ? (
                <div style={S.spinner}>Aucune activité récente.</div>
              ) : (
                logs.slice(0, 7).map((l, i) => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i < logs.length - 1 ? '0.5px solid #f3f4f6' : 'none' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                      {ACTION_ICON[l.action] ?? '•'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', color: '#111827', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.detail}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                        {l.utilisateur} · {l.role}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#d1d5db', flexShrink: 0 }}>{fmtLog(l.date)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}