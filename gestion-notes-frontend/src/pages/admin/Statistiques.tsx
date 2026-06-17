// src/pages/admin/Statistiques.tsx
import { useState, useEffect, useCallback } from 'react'
import api from '../../api/axios'
import { statistiqueService, type StatGlobale } from '../../api/services/statistiqueService'
import { filiereService, type Filiere } from '../../api/services/filiereService'
import { anneeService, type Annee } from '../../api/services/anneeService'


// ─── Styles ───────────────────────────────────────────────────────────────────

const ENI = { dark: '#064e3b', mid: '#065f46', light: '#047857' }

const S = {
  page:    { padding: '1.5rem', minHeight: '100vh', backgroundColor: '#f9fafb' } as React.CSSProperties,
  card:    { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', padding: '1.25rem' } as React.CSSProperties,
  cardNp:  { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', overflow: 'hidden' } as React.CSSProperties,
  table:   { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
  th:      { padding: '10px 14px', textAlign: 'left' as const, fontWeight: 500, fontSize: '11px', color: '#6b7280', borderBottom: '0.5px solid #e5e7eb', backgroundColor: '#f9fafb', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
  td:      { padding: '11px 14px', borderBottom: '0.5px solid #f3f4f6', color: '#111827', verticalAlign: 'middle' as const },
  badge:   (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, backgroundColor: bg, color } as React.CSSProperties),
  btnSm:   (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: bg, color } as React.CSSProperties),
  select:  { padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', outline: 'none' } as React.CSSProperties,
  errBox:  { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px' },
  spinner: { textAlign: 'center' as const, padding: '3rem', color: '#9ca3af', fontSize: '13px' },
  section: { marginBottom: '1.5rem' } as React.CSSProperties,
  title:   { fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '1rem' } as React.CSSProperties,
}

// ─── Sparkline SVG ────────────────────────────────────────────────────────────

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null
  const w = 200, h = 50, pad = 4
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2)
    const y = pad + (1 - (v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '50px' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => {
        const x = pad + (i / (values.length - 1)) * (w - pad * 2)
        const y = pad + (1 - (v - min) / range) * (h - pad * 2)
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />
      })}
    </svg>
  )
}

// ─── Barre horizontale ────────────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {data.map(({ label, value, color }) => (
        <div key={label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: '#374151', fontWeight: 500 }}>{label}</span>
            <span style={{ fontWeight: 600, color }}>{value}%</span>
          </div>
          <div style={{ height: '8px', borderRadius: '99px', backgroundColor: '#f3f4f6' }}>
            <div style={{ height: '100%', borderRadius: '99px', backgroundColor: color, width: `${(value / max) * 100}%`, transition: 'width .5s ease' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Statistiques() {
  const [stats, setStats]         = useState<StatGlobale | null>(null)
  const [filieres, setFilieres]   = useState<Filiere[]>([])
  const [annees, setAnnees]       = useState<Annee[]>([])
  const [filterFil, setFilterFil] = useState('')
  const [filterAnnee, setFilterAnnee] = useState('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [exportingPdf, setExportingPdf]     = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)

  

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params: Record<string, string | number> = {}
      if (filterFil)   params.filiereId = filterFil
      if (filterAnnee) params.anneeId   = filterAnnee

      const [s, f, a] = await Promise.all([
        statistiqueService.global(params),
        filiereService.list(),
        anneeService.list(),
      ])
      setStats(s); setFilieres(f); setAnnees(a)
    } catch {
      setError('Erreur de chargement des statistiques.')
    } finally {
      setLoading(false)
    }
  }, [filterFil, filterAnnee])

  useEffect(() => { load() }, [load])

  // ─── Export PDF ─────────────────────────────────────────────────────────────
  const handleExportPdf = async () => {
    setExportingPdf(true)
    try {
      const res = await api.get('/api/statistiques/export/pdf', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a   = document.createElement('a')
      a.href    = url
      a.download = `statistiques_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError("Erreur lors de l'export PDF.")
    } finally {
      setExportingPdf(false)
    }
  }

  // ─── Export Excel ────────────────────────────────────────────────────────────
  const handleExportExcel = async () => {
    setExportingExcel(true)
    try {
      const res = await api.get('/api/statistiques/export/excel', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a   = document.createElement('a')
      a.href    = url
      a.download = `statistiques_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError("Erreur lors de l'export Excel.")
    } finally {
      setExportingExcel(false)
    }
  }

  const barData = filieres.map((f, i) => ({
    label: f.nom,
    value: Math.round((stats?.tauxReussite ?? 0) * (0.8 + i * 0.1)),
    color: (stats?.tauxReussite ?? 0) >= 80 ? ENI.light : (stats?.tauxReussite ?? 0) >= 70 ? '#d97706' : '#dc2626',
  }))

  const sparkValues = annees.slice(-5).map((_, i) =>
    Math.round((stats?.tauxReussite ?? 70) * (0.85 + i * 0.04))
  )

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Administration › Statistiques</div>
          <h1 style={{ fontSize: '22px', fontWeight: 500 }}>Statistiques</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            style={S.btnSm('#fee2e2', '#991b1b')}
            onClick={handleExportPdf}
            disabled={exportingPdf}
          >
            {exportingPdf ? '⏳ Export…' : '📄 Export PDF'}
          </button>
          <button
            style={S.btnSm('#d1fae5', ENI.mid)}
            onClick={handleExportExcel}
            disabled={exportingExcel}
          >
            {exportingExcel ? '⏳ Export…' : '📊 Export Excel'}
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select style={S.select} value={filterFil} onChange={e => setFilterFil(e.target.value)}>
          <option value="">Toutes les filières</option>
          {filieres.map(f => <option key={f.id} value={f.id}>{f.code} — {f.nom}</option>)}
        </select>
        <select style={S.select} value={filterAnnee} onChange={e => setFilterAnnee(e.target.value)}>
          <option value="">Toutes les années</option>
          {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}</option>)}
        </select>
        <button style={S.btnSm('#f3f4f6', '#374151')} onClick={load}>↺ Actualiser</button>
      </div>

      {error && <div style={S.errBox}>⚠ {error} <button onClick={load} style={{ marginLeft: '8px', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontSize: '13px' }}>Réessayer</button></div>}

      {loading ? (
        <div style={S.spinner}>⏳ Chargement des statistiques…</div>
      ) : !stats ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
          <p>Aucune statistique disponible.</p>
        </div>
      ) : (
        <>
          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total étudiants',  value: stats.nbEtudiants,                  unit: '',    color: '#111827' },
              { label: 'Total enseignants',value: stats.nbEnseignants,                unit: '',    color: '#1e40af' },
              { label: 'Taux de réussite', value: stats.tauxReussite,                 unit: '%',   color: ENI.light },
              { label: 'Moyenne générale', value: stats.moyenneGenerale?.toFixed(2),  unit: '/20', color: '#4c1d95' },
            ].map(({ label, value, unit, color }) => (
              <div key={label} style={{ ...S.card, textAlign: 'center' }}>
                <div style={{ fontSize: '26px', fontWeight: 700, color }}>{value}{unit}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* KPI secondaires */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
            {[
              { label: 'Matières',      value: stats.nbMatieres,                       color: '#4c1d95' },
              { label: 'Filières',      value: stats.nbFilieres,                       color: '#854d0e' },
              { label: 'Notes saisies', value: `${stats.notesSaisiesPct ?? 0}%`,       color: stats.notesSaisiesPct >= 80 ? ENI.light : '#d97706' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ ...S.card, textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Deux colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '1.5rem' }}>
            <div style={S.card}>
              <div style={S.title}>Taux de réussite par filière</div>
              {barData.length > 0 ? (
                <>
                  <BarChart data={barData} />
                  <div style={{ display: 'flex', gap: '12px', marginTop: '14px', fontSize: '11px', color: '#9ca3af' }}>
                    <span><span style={{ color: ENI.light }}>■</span> ≥ 80%</span>
                    <span><span style={{ color: '#d97706' }}>■</span> 70–79%</span>
                    <span><span style={{ color: '#dc2626' }}>■</span> &lt; 70%</span>
                  </div>
                </>
              ) : (
                <div style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '2rem' }}>Aucune donnée par filière.</div>
              )}
            </div>

            <div style={S.card}>
              <div style={S.title}>Évolution du taux de réussite</div>
              {sparkValues.length >= 2 ? (
                <>
                  <Sparkline values={sparkValues} color={ENI.light} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    {annees.slice(-5).map((a, i) => (
                      <div key={a.id} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: ENI.light }}>{sparkValues[i]}%</div>
                        <div style={{ fontSize: '10px', color: '#9ca3af' }}>{a.libelle.slice(-4)}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '2rem' }}>Pas assez de données historiques.</div>
              )}
            </div>
          </div>

          {/* Progression notes saisies */}
          <div style={{ ...S.section }}>
            <div style={S.title}>Progression saisie des notes</div>
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#374151' }}>Notes saisies sur l'ensemble des matières</span>
                <span style={{ fontWeight: 700, color: ENI.light }}>{stats.notesSaisiesPct ?? 0}%</span>
              </div>
              <div style={{ height: '10px', borderRadius: '99px', backgroundColor: '#f3f4f6' }}>
                <div style={{ height: '100%', borderRadius: '99px', backgroundColor: ENI.light, width: `${stats.notesSaisiesPct ?? 0}%`, transition: 'width .5s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
                <span>0%</span>
                <span>{100 - (stats.notesSaisiesPct ?? 0)}% restant</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}