// src/pages/enseignant/SaisieNotes.tsx
import { useState, useMemo, useEffect, useCallback } from 'react'
import { enseignantService, type Enseignant } from '../../api/services/enseignantService'
import { noteService, type Note, type NotePayload } from '../../api/services/noteService'

type Matiere = NonNullable<Enseignant['matieres']>[number]

// ─── Types ────────────────────────────────────────────────────────────────────

interface LigneNote {
  etudiantId:   number
  matricule:    string
  nom:          string
  prenom:       string
  noteId:       number | null
  noteCc:       string
  noteExamen:   string
  noteFinale:   string
  modifie:      boolean
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ENI = { dark: '#064e3b', mid: '#065f46', light: '#047857' }

const S = {
  page:      { padding: '1.5rem', minHeight: '100vh', backgroundColor: '#f9fafb' } as React.CSSProperties,
  card:      { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', padding: '1.25rem', marginBottom: '1rem' } as React.CSSProperties,
  cardNp:    { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', overflow: 'hidden' } as React.CSSProperties,
  table:     { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
  th:        { padding: '10px 14px', textAlign: 'left' as const, fontWeight: 500, fontSize: '11px', color: '#6b7280', borderBottom: '0.5px solid #e5e7eb', backgroundColor: '#f9fafb', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
  td:        { padding: '8px 14px', borderBottom: '0.5px solid #f3f4f6', color: '#111827', verticalAlign: 'middle' as const },
  select:    { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff', color: '#111827', outline: 'none' } as React.CSSProperties,
  noteInput: { width: '80px', padding: '6px 10px', borderRadius: '7px', border: '0.5px solid #d1d5db', fontSize: '14px', fontWeight: 600, textAlign: 'center' as const, outline: 'none', backgroundColor: '#fff' } as React.CSSProperties,
  badge:     (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, backgroundColor: bg, color } as React.CSSProperties),
  btnPrimary:{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: ENI.light, color: '#fff' } as React.CSSProperties,
  btnGhost:  { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '0.5px solid #d1d5db', backgroundColor: 'transparent', color: '#374151' } as React.CSSProperties,
  success:   { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#d1fae5', color: '#065f46', fontSize: '13px' },
  errBox:    { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px' },
  warn:      { padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fef9c3', color: '#854d0e', fontSize: '13px', marginBottom: '1rem' },
  overlay:   { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal:     { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', width: '100%', maxWidth: '420px', padding: '1.5rem', margin: '1rem' },
  spinner:   { textAlign: 'center' as const, padding: '3rem', color: '#9ca3af', fontSize: '13px' },
}

const noteColor = (n: number) =>
  n >= 12 ? ENI.light : n >= 10 ? '#d97706' : '#dc2626'

const isValid = (v: string) => { const n = parseFloat(v); return !isNaN(n) && n >= 0 && n <= 20 }

// ─── Page principale ──────────────────────────────────────────────────────────

export default function SaisieNotes() {
  const [matieres, setMatieres]       = useState<Matiere[]>([])
  const [matiereId, setMatiereId]     = useState<number | ''>('')
  const [lignes, setLignes]           = useState<LigneNote[]>([])
  const [search, setSearch]           = useState('')
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [flash, setFlash]             = useState('')
  const [error, setError]             = useState('')
  const [formError, setFormError]     = useState('')

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 4000) }

  // Chargement matières enseignant
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

  // ── CORRECTION 403 ──────────────────────────────────────────────────────────
  // On ne fait plus etudiantService.list() (route interdite aux enseignants).
  // À la place on charge uniquement les notes de la matière — le backend y
  // embarque déjà les infos étudiant (etudiant.id / matricule / nom / prenom).
  // Si des étudiants n'ont pas encore de note, ils n'apparaîtront pas ici ;
  // c'est le comportement attendu côté enseignant (création à la première saisie).
  const handleSelectMatiere = useCallback(async (id: number | '') => {
    setMatiereId(id)
    setLignes([])
    setFormError('')
    if (!id) return

    setLoading(true)
    try {
      const notes: Note[] = await noteService.list({ matiereId: id as number })

      const lignesInit: LigneNote[] = notes.map(note => ({
        etudiantId:  note.etudiant?.id      ?? 0,
        matricule:   note.etudiant?.matricule ?? '—',
        nom:         note.etudiant?.nomComplet?.split(' ')[0] ?? '—',
        prenom:      note.etudiant?.nomComplet?.split(' ').slice(1).join(' ') ?? '',
        noteId:      note.id,
        noteCc:      note.noteCc     != null ? String(note.noteCc)     : '',
        noteExamen:  note.noteExamen != null ? String(note.noteExamen) : '',
        noteFinale:  note.noteFinale != null ? String(note.noteFinale) : '',
        modifie:     false,
      }))
      setLignes(lignesInit)
    } catch {
      setError('Erreur lors du chargement des notes.')
    } finally {
      setLoading(false)
    }
  }, [])

  const matiere = matieres.find(m => m.id === matiereId)

  // Mise à jour note
  const handleChange = (etudiantId: number, field: 'noteCc' | 'noteExamen', val: string) => {
    setLignes(prev => prev.map(l =>
      l.etudiantId === etudiantId
        ? { ...l, [field]: val, modifie: true }
        : l
    ))
  }

  const nbModifies  = lignes.filter(l => l.modifie).length
  const nbSaisies   = lignes.filter(l => l.noteCc !== '' || l.noteExamen !== '').length
  const moyenneLive = useMemo(() => {
    const valides = lignes.filter(l => l.noteFinale !== '' && isValid(l.noteFinale))
    if (!valides.length) return null
    return (valides.reduce((s, l) => s + parseFloat(l.noteFinale), 0) / valides.length).toFixed(2)
  }, [lignes])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return lignes.filter(l =>
      !q ||
      l.nom.toLowerCase().includes(q) ||
      l.prenom.toLowerCase().includes(q) ||
      l.matricule.toLowerCase().includes(q)
    )
  }, [lignes, search])

  // Validation
  const handleValider = () => {
    const invalides = lignes.filter(l =>
      (l.noteCc !== '' && !isValid(l.noteCc)) ||
      (l.noteExamen !== '' && !isValid(l.noteExamen))
    )
    if (invalides.length) {
      setFormError(`Notes invalides (0–20) : ${invalides.map(l => l.matricule).join(', ')}`)
      return
    }
    setFormError('')
    setShowConfirm(true)
  }

  // Enregistrement API
  const handleConfirm = async () => {
    if (!matiereId) return
    setSaving(true)
    setShowConfirm(false)
    try {
      const promises = lignes
        .filter(l => l.modifie)
        .map(l => {
          const payload: NotePayload = {
            etudiantId: l.etudiantId,
            matiereId:  matiereId as number,
            semestreId: matiere?.semestre.id ?? 0,
            noteCc:     l.noteCc     !== '' ? parseFloat(l.noteCc)     : undefined,
            noteExamen: l.noteExamen !== '' ? parseFloat(l.noteExamen) : undefined,
          }
          return l.noteId
            ? noteService.update(l.noteId, payload)
            : noteService.create(payload)
        })

      await Promise.all(promises)
      showFlash(`${promises.length} note(s) enregistrée(s) avec succès.`)
      await handleSelectMatiere(matiereId)
    } catch {
      setError('Erreur lors de l\'enregistrement des notes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Enseignant › Saisie des notes</div>
        <h1 style={{ fontSize: '22px', fontWeight: 500 }}>Saisie des notes</h1>
      </div>

      {flash     && <div style={S.success}>✓ {flash}</div>}
      {error     && <div style={S.errBox}>⚠ {error}</div>}
      {formError && <div style={S.errBox}>⚠ {formError}</div>}

      {/* Sélection matière */}
      <div style={S.card}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>
          1 — Sélectionner la matière
        </div>
        {loading && !matiereId ? (
          <div style={{ color: '#9ca3af', fontSize: '13px' }}>⏳ Chargement…</div>
        ) : (
          <select
            style={S.select}
            value={matiereId}
            onChange={e => handleSelectMatiere(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">— Choisir une matière —</option>
            {matieres.map(m => (
              <option key={m.id} value={m.id}>
                {m.code} — {m.nom} ({m.semestre.nom})
              </option>
            ))}
          </select>
        )}

        {matiere && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>📚 {matiere.nom}</span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>📅 {matiere.semestre.nom}</span>
            <span style={{ fontSize: '12px', color: matiere.isActive ? ENI.light : '#9ca3af', fontWeight: 500 }}>
              {matiere.isActive ? '● Active' : '○ Inactive'}
            </span>
          </div>
        )}
      </div>

      {/* Tableau saisie */}
      {matiereId && (
        <>
          {/* Stats live */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '1rem' }}>
            {[
              { label: 'Étudiants',  value: lignes.length,                                    color: '#111827' },
              { label: 'Saisies',    value: nbSaisies,                                         color: ENI.light },
              { label: 'Modifiées',  value: nbModifies,                                        color: nbModifies ? '#d97706' : '#9ca3af' },
              { label: 'Moyenne',    value: moyenneLive ? `${moyenneLive}/20` : '—',           color: '#1e40af' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '0.5px solid #e5e7eb', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Barre actions */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              style={{ padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', outline: 'none', flex: 1, minWidth: '180px' }}
              placeholder="Rechercher un étudiant…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button
              style={{ ...S.btnPrimary, opacity: nbModifies === 0 || saving ? 0.6 : 1 }}
              onClick={handleValider}
              disabled={nbModifies === 0 || saving}
            >
              {saving ? '⏳ Enregistrement…' : '✓ Valider la saisie'}
            </button>
          </div>

          {/* Tableau */}
          {loading ? (
            <div style={S.spinner}>⏳ Chargement des étudiants…</div>
          ) : lignes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
              <p>Aucune note enregistrée pour cette matière.</p>
            </div>
          ) : (
            <div style={S.cardNp}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {['#', 'Matricule', 'Nom & Prénom', 'Note CC /20', 'Note Examen /20', 'Note Finale', 'Modifié'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l, i) => {
                    const finale = parseFloat(l.noteFinale)
                    const valide = l.noteFinale !== '' && isValid(l.noteFinale)
                    return (
                      <tr key={l.etudiantId} style={{ backgroundColor: l.modifie ? '#fffbeb' : 'transparent' }}>
                        <td style={{ ...S.td, color: '#9ca3af', width: '40px' }}>{i + 1}</td>
                        <td style={S.td}>
                          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                            {l.matricule}
                          </span>
                        </td>
                        <td style={{ ...S.td, fontWeight: 500 }}>{l.nom} {l.prenom}</td>
                        <td style={S.td}>
                          <input
                            style={{ ...S.noteInput, borderColor: l.noteCc !== '' && !isValid(l.noteCc) ? '#dc2626' : l.modifie ? '#d97706' : '#d1d5db' }}
                            type="number" min="0" max="20" step="0.25"
                            value={l.noteCc}
                            onChange={e => handleChange(l.etudiantId, 'noteCc', e.target.value)}
                            placeholder="—"
                          />
                        </td>
                        <td style={S.td}>
                          <input
                            style={{ ...S.noteInput, borderColor: l.noteExamen !== '' && !isValid(l.noteExamen) ? '#dc2626' : l.modifie ? '#d97706' : '#d1d5db' }}
                            type="number" min="0" max="20" step="0.25"
                            value={l.noteExamen}
                            onChange={e => handleChange(l.etudiantId, 'noteExamen', e.target.value)}
                            placeholder="—"
                          />
                        </td>
                        <td style={S.td}>
                          {valide ? (
                            <span style={{ fontWeight: 700, fontSize: '15px', color: noteColor(finale) }}>
                              {finale.toFixed(2)}
                            </span>
                          ) : (
                            <span style={{ color: '#d1d5db', fontSize: '12px' }}>—</span>
                          )}
                        </td>
                        <td style={S.td}>
                          {l.modifie && <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>● modifié</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!matiereId && !loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
          <p>Sélectionnez une matière pour commencer la saisie.</p>
        </div>
      )}

      {/* Modal confirmation */}
      {showConfirm && (
        <div style={S.overlay}>
          <div style={S.modal} role="dialog" aria-modal="true">
            <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '0.75rem' }}>Valider la saisie ?</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '1rem' }}>
              Vous allez enregistrer <strong>{nbModifies} modification(s)</strong> sur le serveur.
            </p>
            <div style={S.warn}>⚠️ Vérifiez bien toutes les notes avant de valider.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '0.5px solid #e5e7eb', paddingTop: '1.25rem' }}>
              <button style={S.btnGhost} onClick={() => setShowConfirm(false)}>Annuler</button>
              <button style={S.btnPrimary} onClick={handleConfirm}>✓ Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}