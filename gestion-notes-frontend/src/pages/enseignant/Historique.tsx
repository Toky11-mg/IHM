// src/pages/enseignant/Historique.tsx
import { useState, useMemo, useEffect, useCallback } from 'react'
import { noteService, type Note } from '../../api/services/noteService'
import { enseignantService } from '../../api/services/enseignantService'

// ─── Styles ───────────────────────────────────────────────────────────────────

const ENI = { dark: '#064e3b', mid: '#065f46', light: '#047857' }

const S = {
  page:    { padding: '1.5rem', minHeight: '100vh', backgroundColor: '#f9fafb' } as React.CSSProperties,
  card:    { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', padding: '1.25rem', marginBottom: '1rem', cursor: 'pointer' } as React.CSSProperties,
  cardSel: { backgroundColor: '#fff', borderRadius: '12px', border: `2px solid ${ENI.light}`, padding: '1.25rem', marginBottom: '1rem', cursor: 'pointer' } as React.CSSProperties,
  cardNp:  { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', overflow: 'hidden', marginBottom: '1.5rem' } as React.CSSProperties,
  table:   { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
  th:      { padding: '10px 14px', textAlign: 'left' as const, fontWeight: 500, fontSize: '11px', color: '#6b7280', borderBottom: '0.5px solid #e5e7eb', backgroundColor: '#f9fafb', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
  td:      { padding: '10px 14px', borderBottom: '0.5px solid #f3f4f6', color: '#111827', verticalAlign: 'middle' as const },
  badge:   (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, backgroundColor: bg, color } as React.CSSProperties),
  select:  { padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', outline: 'none' } as React.CSSProperties,
  input:   { padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', outline: 'none', flex: 1, minWidth: '180px' } as React.CSSProperties,
  errBox:  { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px' },
  spinner: { textAlign: 'center' as const, padding: '3rem', color: '#9ca3af', fontSize: '13px' },
}

const noteColor = (n: number) =>
  n >= 12 ? ENI.light : n >= 10 ? '#d97706' : '#dc2626'

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Historique() {
  const [matieres, setMatieres]         = useState<{ id: number; code: string; nom: string; semestre: { id: number; nom: string }; isActive: boolean }[]>([])
  const [selectedId, setSelectedId]     = useState<number | null>(null)
  const [notes, setNotes]               = useState<Note[]>([])
  const [filterSem, setFilterSem]       = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [searchNote, setSearchNote]     = useState('')
  const [loading, setLoading]           = useState(true)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [error, setError]               = useState('')

  // Chargement matières
  const loadMatieres = useCallback(async () => {
    setLoading(true)
    try {
      const res = await enseignantService.me()
      if (res.success) setMatieres(res.data.matieres ?? [])
    } catch {
      setError('Impossible de charger vos matières.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadMatieres() }, [loadMatieres])

  // Chargement notes à la sélection
  const handleSelect = useCallback(async (id: number | null) => {
    setSelectedId(id)
    setNotes([])
    if (!id) return
    setLoadingNotes(true)
    try {
      const res = await noteService.list({ matiereId: id })
      setNotes(res)
    } catch {
      setError('Erreur lors du chargement des notes.')
    } finally {
      setLoadingNotes(false)
    }
  }, [])

  // Semestres uniques
  const semestres = [...new Set(matieres.map(m => m.semestre.nom))]

  const filteredMatieres = useMemo(() => matieres.filter(m =>
    (!filterSem    || m.semestre.nom === filterSem)    &&
    (!filterStatut || (filterStatut === 'active' ? m.isActive : !m.isActive))
  ), [matieres, filterSem, filterStatut])

  const filteredNotes = useMemo(() => {
    const q = searchNote.toLowerCase()
    return notes.filter(n =>
      !q || (n.etudiant?.nomComplet ?? '').toLowerCase().includes(q) ||
             (n.etudiant?.matricule ?? '').toLowerCase().includes(q)
    )
  }, [notes, searchNote])

  const selected = matieres.find(m => m.id === selectedId)

  const moyenneNotes = useMemo(() => {
    const valides = notes.filter(n => n.noteFinale !== null)
    if (!valides.length) return null
    return (valides.reduce((s, n) => s + parseFloat(n.noteFinale!), 0) / valides.length).toFixed(2)
  }, [notes])

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Enseignant › Historique</div>
        <h1 style={{ fontSize: '22px', fontWeight: 500 }}>Historique des notes</h1>
      </div>

      {error && <div style={S.errBox}>⚠ {error}</div>}

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total matières', value: matieres.length,                                   color: '#111827' },
          { label: 'Actives',        value: matieres.filter(m => m.isActive).length,            color: ENI.light },
          { label: 'Inactives',      value: matieres.filter(m => !m.isActive).length,           color: '#6b7280' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '0.5px solid #e5e7eb', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── CORRECTION key prop ────────────────────────────────────────────────
          Les <option> dans les deux <select> de filtre n'avaient pas de `key`.
          On utilise `s` (nom du semestre) comme clé — les valeurs sont uniques
          car produites par un Set. ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <select
          style={S.select}
          value={filterSem}
          onChange={e => { setFilterSem(e.target.value); setSelectedId(null) }}
        >
          <option value="">Tous les semestres</option>
          {semestres.map(s => (
            <option key={s} value={s}>{s}</option>  
          ))}
        </select>

        <select
          style={S.select}
          value={filterStatut}
          onChange={e => { setFilterStatut(e.target.value); setSelectedId(null) }}
        >
          <option value="">Tous les statuts</option>
          <option key="active"   value="active">Active</option>    {/* ← key ajouté */}
          <option key="inactive" value="inactive">Inactive</option>{/* ← key ajouté */}
        </select>

        <span style={{ fontSize: '13px', color: '#6b7280', alignSelf: 'center', marginLeft: 'auto' }}>
          {filteredMatieres.length} matière{filteredMatieres.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedId ? '320px 1fr' : '1fr', gap: '16px', alignItems: 'start' }}>

        {/* Liste matières */}
        <div>
          {loading ? (
            <div style={S.spinner}>⏳ Chargement…</div>
          ) : filteredMatieres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
              <p>Aucune matière trouvée.</p>
            </div>
          ) : (
            filteredMatieres.map(m => (
              <div
                key={m.id}
                style={selectedId === m.id ? S.cardSel : S.card}
                onClick={() => handleSelect(selectedId === m.id ? null : m.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                    {m.code}
                  </span>
                  <span style={S.badge(m.isActive ? '#d1fae5' : '#f3f4f6', m.isActive ? '#065f46' : '#6b7280')}>
                    {m.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>{m.nom}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>{m.semestre.nom}</div>
              </div>
            ))
          )}
        </div>

        {/* Détail notes */}
        {selectedId && selected && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                Notes — {selected.nom}
              </h2>
              <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                {notes.length} étudiant{notes.length !== 1 ? 's' : ''} ·
                Moyenne :
                <span style={{ fontWeight: 600, color: moyenneNotes ? noteColor(parseFloat(moyenneNotes)) : '#9ca3af', marginLeft: '4px' }}>
                  {moyenneNotes ? `${moyenneNotes}/20` : '—'}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <input
                style={S.input}
                placeholder="Rechercher un étudiant…"
                value={searchNote}
                onChange={e => setSearchNote(e.target.value)}
              />
            </div>

            {loadingNotes ? (
              <div style={S.spinner}>⏳ Chargement des notes…</div>
            ) : (
              <div style={S.cardNp}>
                {filteredNotes.length === 0 ? (
                  <div style={S.spinner}>Aucune note pour cette matière.</div>
                ) : (
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {['Matricule', 'Nom & Prénom', 'CC', 'Examen', 'Finale', 'Mention', 'Validée'].map(h => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNotes.map(n => (
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
                              <span style={{ fontWeight: 700, color: noteColor(parseFloat(n.noteFinale)) }}>
                                {parseFloat(n.noteFinale).toFixed(2)}
                              </span>
                            ) : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={S.td}>
                            {n.mention ? (
                              <span style={S.badge(
                                ['Très Bien','Bien'].includes(n.mention) ? '#d1fae5' :
                                ['Assez Bien','Passable'].includes(n.mention) ? '#fef9c3' : '#fee2e2',
                                ['Très Bien','Bien'].includes(n.mention) ? '#065f46' :
                                ['Assez Bien','Passable'].includes(n.mention) ? '#854d0e' : '#991b1b',
                              )}>{n.mention}</span>
                            ) : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={S.td}>
                            <span style={S.badge(n.isValidee ? '#d1fae5' : '#f3f4f6', n.isValidee ? '#065f46' : '#9ca3af')}>
                              {n.isValidee ? '✓ Oui' : '○ Non'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}