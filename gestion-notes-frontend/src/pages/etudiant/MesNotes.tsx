// src/pages/etudiant/MesNotes.tsx
import { useState, useMemo, useEffect, useCallback } from 'react'
import { noteService, type Note } from '../../api/services/noteService'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupeSemestre {
  semestre: string
  notes: Note[]
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ENI = { dark: '#064e3b', mid: '#065f46', light: '#047857' }

const S = {
  page:   { padding: '1.5rem', minHeight: '100vh', backgroundColor: '#f9fafb' } as React.CSSProperties,
  card:   { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', overflow: 'hidden', marginBottom: '1.5rem' } as React.CSSProperties,
  table:  { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
  th:     { padding: '10px 14px', textAlign: 'left' as const, fontWeight: 500, fontSize: '11px', color: '#6b7280', borderBottom: '0.5px solid #e5e7eb', backgroundColor: '#f9fafb', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
  td:     { padding: '11px 14px', borderBottom: '0.5px solid #f3f4f6', color: '#111827', verticalAlign: 'middle' as const },
  badge:  (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, backgroundColor: bg, color } as React.CSSProperties),
  select: { padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', outline: 'none' } as React.CSSProperties,
  errBox: { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px' },
  spinner:{ textAlign: 'center' as const, padding: '3rem', color: '#9ca3af', fontSize: '13px' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const noteColor = (n: number) =>
  n >= 12 ? ENI.light : n >= 10 ? '#d97706' : '#dc2626'

const MENTION_CFG: Record<string, { bg: string; color: string }> = {
  'Très Bien':  { bg: '#d1fae5', color: '#065f46' },
  'Bien':       { bg: '#dbeafe', color: '#1e40af' },
  'Assez Bien': { bg: '#ede9fe', color: '#4c1d95' },
  'Passable':   { bg: '#fef9c3', color: '#854d0e' },
  'Insuffisant':{ bg: '#fee2e2', color: '#991b1b' },
}

const calcMoyennePonderee = (notes: Note[]) => {
  const valides = notes.filter(n => n.noteFinale !== null)
  if (!valides.length) return null
  // Sans coefficient dans Note → moyenne simple
  const total = valides.reduce((s, n) => s + parseFloat(n.noteFinale!), 0)
  return (total / valides.length).toFixed(2)
}

// ─── Bloc semestre ────────────────────────────────────────────────────────────

function SemestreBlock({ groupe }: { groupe: GroupeSemestre }) {
  const [open, setOpen] = useState(true)
  const moyenne = calcMoyennePonderee(groupe.notes)
  const moy     = moyenne ? parseFloat(moyenne) : null

  const statutGlobal = groupe.notes.every(n => n.isValidee && n.noteFinale && parseFloat(n.noteFinale) >= 12)
    ? { label: 'Admis',      bg: '#d1fae5', color: '#065f46' }
    : groupe.notes.some(n => n.noteFinale && parseFloat(n.noteFinale) < 10)
    ? { label: 'Ajourné',    bg: '#fee2e2', color: '#991b1b' }
    : { label: 'En cours',   bg: '#fef9c3', color: '#854d0e' }

  return (
    <div style={S.card}>
      {/* En-tête */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '15px' }}>{groupe.semestre}</span>
          <span style={S.badge(statutGlobal.bg, statutGlobal.color)}>{statutGlobal.label}</span>
          {moy && (
            <span style={{ fontSize: '13px', fontWeight: 700, color: noteColor(moy) }}>
              Moyenne : {moyenne}/20
            </span>
          )}
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            {groupe.notes.length} matière{groupe.notes.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span style={{ color: '#9ca3af', fontSize: '18px' }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Tableau */}
      {open && (
        <table style={S.table}>
          <thead>
            <tr>
              {['Code', 'Matière', 'Note CC', 'Note Examen', 'Note Finale', 'Mention', 'Statut'].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupe.notes.map(n => {
              const finale = n.noteFinale ? parseFloat(n.noteFinale) : null
              const mc     = n.mention ? (MENTION_CFG[n.mention] ?? MENTION_CFG['Passable']) : null
              return (
                <tr key={n.id}>
                  <td style={S.td}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                      {n.code}
                    </span>
                  </td>
                  <td style={{ ...S.td, fontWeight: 500 }}>{typeof n.matiere === 'object' ? (n.matiere as any).nom : n.matiere}</td>
                  <td style={{ ...S.td, color: '#6b7280' }}>{n.noteCc ?? '—'}</td>
                  <td style={{ ...S.td, color: '#6b7280' }}>{n.noteExamen ?? '—'}</td>
                  <td style={S.td}>
                    {finale !== null ? (
                      <span style={{ fontWeight: 700, fontSize: '15px', color: noteColor(finale) }}>
                        {finale.toFixed(2)}
                      </span>
                    ) : (
                      <span style={{ color: '#d1d5db', fontSize: '12px' }}>— en attente</span>
                    )}
                  </td>
                  <td style={S.td}>
                    {mc ? (
                      <span style={S.badge(mc.bg, mc.color)}>{n.mention}</span>
                    ) : <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={S.td}>
                    <span style={S.badge(n.isValidee ? '#d1fae5' : '#f3f4f6', n.isValidee ? '#065f46' : '#9ca3af')}>
                      {n.isValidee ? '✓ Validée' : '○ En attente'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          {/* Pied de tableau */}
          <tfoot>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <td colSpan={4} style={{ ...S.td, fontWeight: 600, fontSize: '12px', color: '#374151' }}>
                MOYENNE DU SEMESTRE
              </td>
              <td style={{ ...S.td, fontWeight: 700, color: moy ? noteColor(moy) : '#9ca3af' }}>
                {moyenne ? `${moyenne}/20` : '—'}
              </td>
              <td colSpan={2} style={S.td}>
                <span style={S.badge(statutGlobal.bg, statutGlobal.color)}>{statutGlobal.label}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function MesNotes() {
  const [notes, setNotes]             = useState<Note[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [filterSem, setFilterSem]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await noteService.me()
      setNotes(res)
    } catch {
      setError('Impossible de charger vos notes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Grouper par semestre
  const groupes = useMemo<GroupeSemestre[]>(() => {
    const map: Record<string, Note[]> = {}
    notes.forEach(n => {
      const key = typeof n.semestre === 'object' ? (n.semestre as any).nom : n.semestre
      if (!map[key]) map[key] = []
      map[key].push(n)
    })
    return Object.entries(map)
      .map(([semestre, notes]) => ({ semestre, notes }))
      .sort((a, b) => b.semestre.localeCompare(a.semestre))
  }, [notes])

  const semestres = [...new Set(notes.map(n =>
  typeof n.semestre === 'object' ? (n.semestre as any).nom : n.semestre
))].sort().reverse()

  const filteredGroupes = useMemo(() =>
    filterSem ? groupes.filter(g => g.semestre === filterSem) : groupes,
    [groupes, filterSem]
  )

  // Stats globales
  const toutesValides   = notes.filter(n => n.noteFinale !== null)
  const moyenneGlobale  = calcMoyennePonderee(notes)
  const nbAdmis         = toutesValides.filter(n => parseFloat(n.noteFinale!) >= 12).length
  const nbAjourne       = toutesValides.filter(n => parseFloat(n.noteFinale!) < 10).length

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Étudiant › Mes notes</div>
        <h1 style={{ fontSize: '22px', fontWeight: 500 }}>Mes notes</h1>
      </div>

      {error && <div style={S.errBox}>⚠ {error} <button onClick={load} style={{ marginLeft: '8px', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontSize: '13px' }}>Réessayer</button></div>}

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
        {[
          { label: 'Moyenne générale', value: moyenneGlobale ? `${moyenneGlobale}/20` : '—', color: moyenneGlobale ? noteColor(parseFloat(moyenneGlobale)) : '#9ca3af' },
          { label: 'Semestres',        value: groupes.length,                                  color: '#111827'  },
          { label: 'Matières admises', value: nbAdmis,                                         color: ENI.light  },
          { label: 'Ajourné',          value: nbAjourne,                                       color: nbAjourne ? '#dc2626' : '#9ca3af' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '0.5px solid #e5e7eb', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filtre */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select style={S.select} value={filterSem} onChange={e => setFilterSem(e.target.value)}>
          <option value="">Tous les semestres</option>
          {semestres.map(s => <option key={s} value={s}>{s}</option>)}
          
        </select>
      </div>

      {/* Contenu */}
      {loading ? (
        <div style={S.spinner}>⏳ Chargement de vos notes…</div>
      ) : filteredGroupes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
          <p>Aucune note disponible pour le moment.</p>
        </div>
      ) : (
        filteredGroupes.map(g => <SemestreBlock key={g.semestre} groupe={g} />)
      )}
    </div>
  )
}