// src/pages/enseignant/MesMatieres.tsx
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { enseignantService, type Enseignant } from '../../api/services/enseignantService'
import { noteService, type Note } from '../../api/services/noteService'

type Matiere = NonNullable<Enseignant['matieres']>[number]

// ─── Styles ───────────────────────────────────────────────────────────────────

const ENI = { dark: '#064e3b', mid: '#065f46', light: '#047857' }

const S = {
  page:    { padding: '1.5rem', minHeight: '100vh', backgroundColor: '#f9fafb' } as React.CSSProperties,
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '1.5rem' } as React.CSSProperties,
  card:    { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', padding: '1.25rem', cursor: 'pointer', transition: 'box-shadow .15s' } as React.CSSProperties,
  cardSel: { backgroundColor: '#fff', borderRadius: '12px', border: `2px solid ${ENI.light}`, padding: '1.25rem', cursor: 'pointer' } as React.CSSProperties,
  cardNp:  { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', overflow: 'hidden' } as React.CSSProperties,
  table:   { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
  th:      { padding: '10px 14px', textAlign: 'left' as const, fontWeight: 500, fontSize: '11px', color: '#6b7280', borderBottom: '0.5px solid #e5e7eb', backgroundColor: '#f9fafb', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
  td:      { padding: '11px 14px', borderBottom: '0.5px solid #f3f4f6', color: '#111827', verticalAlign: 'middle' as const },
  badge:   (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, backgroundColor: bg, color } as React.CSSProperties),
  btnSm:   (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: bg, color } as React.CSSProperties),
  input:   { padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', outline: 'none', flex: 1, minWidth: '200px' } as React.CSSProperties,
  select:  { padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', outline: 'none' } as React.CSSProperties,
  spinner: { textAlign: 'center' as const, padding: '3rem', color: '#9ca3af', fontSize: '13px' },
  errBox:  { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px' },
}

const noteColor = (n: number) =>
  n >= 12 ? ENI.light : n >= 10 ? '#d97706' : '#dc2626'

// ─── Barre progression ────────────────────────────────────────────────────────

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct   = total ? Math.round((value / total) * 100) : 0
  const color = pct === 100 ? ENI.light : pct >= 50 ? '#d97706' : '#dc2626'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
        <span>Notes saisies</span>
        <span style={{ fontWeight: 600, color }}>{value}/{total} ({pct}%)</span>
      </div>
      <div style={{ height: '5px', borderRadius: '99px', backgroundColor: '#f3f4f6' }}>
        <div style={{ height: '100%', borderRadius: '99px', backgroundColor: color, width: `${pct}%`, transition: 'width .4s' }} />
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function MesMatieres() {
  const navigate = useNavigate()
  const [profile, setProfile]     = useState<Enseignant | null>(null)
  const [notes, setNotes]         = useState<Note[]>([])
  const [selected, setSelected]   = useState<Matiere | null>(null)
  const [search, setSearch]       = useState('')
  const [filterSem, setFilterSem] = useState('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [res, notesRes] = await Promise.all([
        enseignantService.me(),
        noteService.list(),
      ])
      if (res.success) setProfile(res.data)
      setNotes(notesRes)
    } catch {
      setError('Impossible de charger vos matières.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const matieres = profile?.matieres ?? []

  const filtered = useMemo(() => matieres.filter(m => {
    const q = search.toLowerCase()
    return (
      (!q || m.nom.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)) &&
      (!filterSem || m.semestre.nom.toLowerCase().includes(filterSem.toLowerCase()))
    )
  }), [matieres, search, filterSem])

  // Notes pour la matière sélectionnée
  const notesMatiere = useMemo(() => {
    if (!selected) return []
    return notes.filter(n => n.code === selected.code)
  }, [notes, selected])

  const moyenneMatiere = useMemo(() => {
    const valides = notesMatiere.filter(n => n.noteFinale !== null)
    if (!valides.length) return null
    return (valides.reduce((s, n) => s + parseFloat(n.noteFinale!), 0) / valides.length).toFixed(2)
  }, [notesMatiere])

  const nbAdmis     = notesMatiere.filter(n => n.noteFinale && parseFloat(n.noteFinale) >= 12).length
  const nbTotal     = notesMatiere.length
  const nbSaisies   = notesMatiere.filter(n => n.noteFinale !== null).length

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Enseignant › Mes matières</div>
        <h1 style={{ fontSize: '22px', fontWeight: 500 }}>Mes matières</h1>
      </div>

      {error && <div style={S.errBox}>⚠ {error} <button onClick={load} style={{ marginLeft: '8px', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontSize: '13px' }}>Réessayer</button></div>}

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
        {[
          { label: 'Matières assignées', value: matieres.length,                                      color: '#111827' },
          { label: 'Notes complètes',    value: matieres.filter(m => m.isActive).length,              color: ENI.light },
          { label: 'Inactives',          value: matieres.filter(m => !m.isActive).length,             color: '#9ca3af' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '0.5px solid #e5e7eb', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input style={S.input} placeholder="Rechercher une matière…" value={search} onChange={e => { setSearch(e.target.value); setSelected(null) }} />
        <select style={S.select} value={filterSem} onChange={e => setFilterSem(e.target.value)}>
  <option value="">Tous les semestres</option>
  {[...new Set(
  matieres
    .map(m => typeof m.semestre === 'object' ? m.semestre?.nom : m.semestre)
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
)].map(s => (
  <option key={s} value={s}>{s}</option>
))}
</select>
      </div>

      {loading ? (
        <div style={S.spinner}>⏳ Chargement…</div>
      ) : (
        <>
          {/* Grille matières */}
          <div style={S.grid}>
            {filtered.map(m => (
              <div
                key={m.id}
                style={selected?.id === m.id ? S.cardSel : S.card}
                onClick={() => setSelected(selected?.id === m.id ? null : m)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                    {m.code}
                  </span>
                  <span style={S.badge(m.isActive ? '#d1fae5' : '#f3f4f6', m.isActive ? '#065f46' : '#9ca3af')}>
                    {m.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '8px', lineHeight: 1.4 }}>{m.nom}</h3>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>{m.semestre.nom}</div>
                <ProgressBar value={nbSaisies} total={nbTotal || 0} />
              </div>
            ))}

            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                <p>Aucune matière trouvée.</p>
              </div>
            )}
          </div>

          {/* Panneau étudiants */}
          {selected && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Notes — {selected.nom}</h2>
                  <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
                    {nbTotal} étudiants · Moyenne : <span style={{ fontWeight: 600, color: moyenneMatiere ? noteColor(parseFloat(moyenneMatiere)) : '#9ca3af' }}>{moyenneMatiere ?? '—'}/20</span>
                    · Admis : <span style={{ fontWeight: 600, color: ENI.light }}>{nbAdmis}</span>
                  </div>
                </div>
                <button style={S.btnSm(ENI.light, '#fff')} onClick={() => navigate('/enseignant/saisie-notes')}>
                  ✎ Saisir les notes
                </button>
              </div>

              <div style={S.cardNp}>
                {notesMatiere.length === 0 ? (
                  <div style={S.spinner}>Aucune note saisie pour cette matière.</div>
                ) : (
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {['Matricule', 'Nom & Prénom', 'Note CC', 'Note Examen', 'Note Finale', 'Mention'].map(h => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {notesMatiere.map(n => (
                        <tr key={n.id}>
                          <td style={S.td}>
                            <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                              {n.etudiant?.matricule ?? '—'}
                            </span>
                          </td>
                          <td style={{ ...S.td, fontWeight: 500 }}>{n.etudiant?.nomComplet ?? '—'}</td>
                          <td style={{ ...S.td, color: '#6b7280' }}>{n.noteCc ?? '—'}</td>
                          <td style={{ ...S.td, color: '#6b7280' }}>{n.noteExamen ?? '—'}</td>
                          <td style={S.td}>
                            {n.noteFinale ? (
                              <span style={{ fontWeight: 700, fontSize: '15px', color: noteColor(parseFloat(n.noteFinale)) }}>
                                {parseFloat(n.noteFinale).toFixed(2)}
                              </span>
                            ) : (
                              <span style={{ color: '#d1d5db', fontSize: '12px' }}>— non saisie</span>
                            )}
                          </td>
                          <td style={S.td}>
                            {n.mention ? (
                              <span style={S.badge(
                                n.mention === 'Très Bien' || n.mention === 'Bien' ? '#d1fae5' :
                                n.mention === 'Assez Bien' || n.mention === 'Passable' ? '#fef9c3' : '#fee2e2',
                                n.mention === 'Très Bien' || n.mention === 'Bien' ? '#065f46' :
                                n.mention === 'Assez Bien' || n.mention === 'Passable' ? '#854d0e' : '#991b1b',
                              )}>{n.mention}</span>
                            ) : (
                              <span style={{ color: '#d1d5db' }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}