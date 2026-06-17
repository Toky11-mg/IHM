// src/pages/admin/Matieres.tsx
import { useState, useMemo, useEffect, useCallback } from 'react'
import { matiereService, type Matiere } from '../../api/services/matiereService'
import { filiereService, type Filiere } from '../../api/services/filiereService'
import { niveauService, type Niveau } from '../../api/services/niveauService'
import { semestreService, type Semestre } from '../../api/services/semestreService'
import { enseignantService, type Enseignant } from '../../api/services/enseignantService'

// ─── Types form ───────────────────────────────────────────────────────────────
// NOTE IMPORTANTE : Matiere n'est liée qu'au SEMESTRE en base de données.
// niveau/filiere sont DÉRIVÉS du semestre (semestre → niveau → filière).
// Le formulaire ne doit donc envoyer que semestreId, pas filiereId/niveauId.

interface MatiereForm {
  code: string
  nom: string
  credit: string
  type: string
  coefficient: string
  semestreId: string
  enseignantId: string
}

const FORM_INIT: MatiereForm = {
  code: '', nom: '', credit: '3', type: 'cours', coefficient: '1',
  semestreId: '', enseignantId: '',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ENI = { dark: '#064e3b', mid: '#065f46', light: '#047857' }

const S = {
  page:      { padding: '1.5rem', minHeight: '100vh', backgroundColor: '#f9fafb' } as React.CSSProperties,
  card:      { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', overflow: 'hidden' } as React.CSSProperties,
  filters:   { display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' as const, alignItems: 'center' },
  input:     { padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', outline: 'none', minWidth: '160px' } as React.CSSProperties,
  searchInput: { padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', flex: 1, minWidth: '200px', outline: 'none' } as React.CSSProperties,
  table:     { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
  th:        { padding: '10px 14px', textAlign: 'left' as const, fontWeight: 500, fontSize: '11px', color: '#6b7280', borderBottom: '0.5px solid #e5e7eb', backgroundColor: '#f9fafb', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
  td:        { padding: '11px 14px', borderBottom: '0.5px solid #f3f4f6', color: '#111827', verticalAlign: 'middle' as const },
  code:      { fontFamily: 'monospace', fontSize: '12px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' },
  coef:      { fontWeight: 600, color: ENI.light, fontSize: '14px' },
  count:     { fontSize: '13px', color: '#6b7280', marginLeft: 'auto' },
  overlay:   { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal:     { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', width: '100%', maxWidth: '500px', padding: '1.5rem', margin: '1rem' },
  formGroup: { marginBottom: '1rem' },
  label:     { display: 'block', fontSize: '13px', color: '#374151', marginBottom: '5px', fontWeight: 500 } as React.CSSProperties,
  formInput: { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff', color: '#111827', outline: 'none', boxSizing: 'border-box' as const },
  formRow:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  footer:    { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.5rem', borderTop: '0.5px solid #e5e7eb', paddingTop: '1.25rem' },
  btnPrimary:{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: ENI.light, color: '#fff' } as React.CSSProperties,
  btnGhost:  { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '0.5px solid #d1d5db', backgroundColor: 'transparent', color: '#374151' } as React.CSSProperties,
  btnEdit:   { display: 'inline-flex', alignItems: 'center', padding: '5px 8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', border: '0.5px solid #d1d5db', backgroundColor: 'transparent', color: '#374151' } as React.CSSProperties,
  btnDel:    { display: 'inline-flex', alignItems: 'center', padding: '5px 8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', border: 'none', backgroundColor: '#fee2e2', color: '#991b1b' } as React.CSSProperties,
  actions:   { display: 'flex', gap: '6px', justifyContent: 'flex-end' },
  badge:     (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, backgroundColor: bg, color } as React.CSSProperties),
  success:   { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#d1fae5', color: '#065f46', fontSize: '13px' },
  errBox:    { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px' },
  spinner:   { textAlign: 'center' as const, padding: '3rem', color: '#9ca3af', fontSize: '13px' },
  empty:     { textAlign: 'center' as const, padding: '3rem 1rem', color: '#9ca3af' },
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  form: MatiereForm
  editId: number | null
  error: string
  loading: boolean
  semestres: Semestre[]
  enseignants: Enseignant[]
  onChange: (f: MatiereForm) => void
  onSave: () => void
  onClose: () => void
}

function Modal({ form, editId, error, loading, semestres, enseignants, onChange, onSave, onClose }: ModalProps) {
  const set = (k: keyof MatiereForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...form, [k]: e.target.value })

  return (
    <div style={S.overlay} onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div style={S.modal} role="dialog" aria-modal="true">
        <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '1.25rem' }}>
          {editId ? 'Modifier la matière' : 'Nouvelle matière'}
        </h2>

        {error && <div style={S.errBox}>{error}</div>}

        <div style={S.formRow}>
          <div style={S.formGroup}>
            <label style={S.label}>Code *</label>
            <input style={S.formInput} value={form.code} onChange={set('code')} placeholder="ex: ALGO01" />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Coefficient *</label>
            <input style={S.formInput} type="number" value={form.coefficient} onChange={set('coefficient')} min="0.5" max="10" step="0.5" />
          </div>
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>Nom de la matière *</label>
          <input style={S.formInput} value={form.nom} onChange={set('nom')} placeholder="ex: Algorithmique" />
        </div>

        <div style={S.formRow}>
          <div style={S.formGroup}>
            <label style={S.label}>Crédit *</label>
            <input style={S.formInput} type="number" value={form.credit} onChange={set('credit')} min="1" max="20" />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Type *</label>
            <select style={S.formInput} value={form.type} onChange={set('type')}>
              <option value="cours">Cours</option>
              <option value="td">TD</option>
              <option value="tp">TP</option>
            </select>
          </div>
        </div>

        {/* Semestre — c'est LA SEULE source de niveau/filière en base de données.
            Le libellé inclut niveau + filière pour aider l'utilisateur à choisir. */}
        <div style={S.formGroup}>
          <label style={S.label}>Semestre *</label>
          <select style={S.formInput} value={form.semestreId} onChange={set('semestreId')}>
            <option value="">— Choisir —</option>
            {semestres.map(s => (
              <option key={s.id} value={s.id}>
                {s.nom}
                {s.niveau ? ` — ${s.niveau.nom}` : ''}
                {s.niveau?.filiere ? ` (${s.niveau.filiere.code})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>Enseignant responsable</label>
          <select style={S.formInput} value={form.enseignantId} onChange={set('enseignantId')}>
            <option value="">— Choisir —</option>
            {enseignants.map(e => <option key={e.id} value={e.id}>{e.nomComplet}</option>)}
          </select>
        </div>

        <div style={S.footer}>
          <button style={S.btnGhost} onClick={onClose} disabled={loading}>Annuler</button>
          <button style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }} onClick={onSave} disabled={loading}>
            {loading ? '⏳ Enregistrement…' : '✓ Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Confirm delete ───────────────────────────────────────────────────────────

function ConfirmDelete({ nom, loading, onConfirm, onCancel }: { nom: string; loading: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth: '380px' }} role="dialog" aria-modal="true">
        <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '0.75rem' }}>Supprimer cette matière ?</h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '1.5rem' }}>
          <strong>{nom}</strong> sera supprimée définitivement. Les notes associées pourraient être affectées.
        </p>
        <div style={S.footer}>
          <button style={S.btnGhost} onClick={onCancel} disabled={loading}>Annuler</button>
          <button style={{ ...S.btnPrimary, backgroundColor: '#dc2626', opacity: loading ? 0.7 : 1 }} onClick={onConfirm} disabled={loading}>
            {loading ? '⏳…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Matieres() {
  const [matieres, setMatieres]         = useState<Matiere[]>([])
  const [filieres, setFilieres]         = useState<Filiere[]>([])
  const [niveaux, setNiveaux]           = useState<Niveau[]>([])
  const [semestres, setSemestres]       = useState<Semestre[]>([])
  const [enseignants, setEnseignants]   = useState<Enseignant[]>([])

  const [search, setSearch]             = useState('')
  const [filterFil, setFilterFil]       = useState('')
  const [filterSem, setFilterSem]       = useState('')

  const [showModal, setShowModal]       = useState(false)
  const [editId, setEditId]             = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Matiere | null>(null)
  const [form, setForm]                 = useState<MatiereForm>(FORM_INIT)

  const [pageLoading, setPageLoading]   = useState(true)
  const [saving, setSaving]             = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [formError, setFormError]       = useState('')
  const [flash, setFlash]               = useState('')
  const [pageError, setPageError]       = useState('')

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3000) }

  // ─── Chargement initial ──────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setPageLoading(true)
    setPageError('')
    try {
      const [m, f, n, s, e] = await Promise.all([
        matiereService.list(),
        filiereService.list(),
        niveauService.list(),
        semestreService.list(),
        enseignantService.list(),
      ])
      setMatieres(m)
      setFilieres(f)
      setNiveaux(n)
      setSemestres(s)
      setEnseignants(e)
    } catch {
      setPageError('Erreur de chargement. Vérifiez votre connexion au serveur.')
    } finally {
      setPageLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ─── Filtrage ────────────────────────────────────────────────────────────────
  // IMPORTANT : m.semestre.id est un NOMBRE (vient du backend en JSON),
  // alors que filterSem (état du <select>) est une STRING.
  // On compare donc avec String(...) des deux côtés pour éviter
  // un filtre silencieusement cassé (3 !== "3").

  const filtered = useMemo(() => matieres.filter(m => {
    const q = search.toLowerCase()
    const matchQ   = !q || m.nom.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
    const matchFil = !filterFil || String(m.filiere?.id) === filterFil
    const matchSem = !filterSem || String(m.semestre?.id) === filterSem
    return matchQ && matchFil && matchSem
  }), [matieres, search, filterFil, filterSem])

  // ─── Modal ───────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(FORM_INIT); setEditId(null); setFormError(''); setShowModal(true)
  }

  const openEdit = (m: Matiere) => {
    setForm({
      code:         m.code,
      nom:          m.nom,
      credit:       String(m.credit ?? 3),
      type:         m.type ?? 'cours',
      coefficient:  String(m.coefficient),
      semestreId:   String(m.semestre?.id ?? ''),
      enseignantId: String(m.enseignant?.id ?? ''),
    })
    setEditId(m.id); setFormError(''); setShowModal(true)
  }

  // ─── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.code.trim() || !form.nom.trim()) {
      setFormError('Code et nom sont obligatoires.'); return
    }
    if (!form.semestreId) {
      setFormError('Le semestre est obligatoire.'); return
    }
    const coef = parseFloat(form.coefficient)
    if (isNaN(coef) || coef <= 0) {
      setFormError('Coefficient invalide.'); return
    }
    const credit = parseInt(form.credit, 10)
    if (isNaN(credit) || credit <= 0) {
      setFormError('Crédit invalide.'); return
    }

    setSaving(true)
    setFormError('')
    try {
      const payload = {
        code:         form.code.trim().toUpperCase(),
        nom:          form.nom.trim(),
        credit,
        type:         form.type,
        coefficient:  coef,
        semestreId:   Number(form.semestreId),
        enseignantId: form.enseignantId ? Number(form.enseignantId) : undefined,
      }

      if (editId) {
        await matiereService.update(editId, payload)
        showFlash('Matière modifiée avec succès.')
      } else {
        await matiereService.create(payload)
        showFlash('Matière créée avec succès.')
      }
      setShowModal(false)
      await loadAll()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string> } } }
      const errors = e.response?.data?.errors
      const msg = errors
        ? Object.values(errors).join(' ')
        : (e.response?.data?.message ?? 'Erreur lors de l\'enregistrement.')
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await matiereService.delete(deleteTarget.id)
      setDeleteTarget(null)
      showFlash('Matière supprimée.')
      await loadAll()
    } catch {
      setPageError('Erreur lors de la suppression.')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Administration › Matières</div>
          <h1 style={{ fontSize: '22px', fontWeight: 500 }}>Matières</h1>
        </div>
        <button style={S.btnPrimary} onClick={openCreate}>+ Nouvelle matière</button>
      </div>

      {flash    && <div style={S.success}>✓ {flash}</div>}
      {pageError && <div style={S.errBox}>⚠ {pageError} <button onClick={loadAll} style={{ marginLeft: '8px', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontSize: '13px' }}>Réessayer</button></div>}

      {/* Filtres */}
      <div style={S.filters}>
        <input style={S.searchInput} placeholder="Rechercher par nom ou code…" value={search} onChange={e => setSearch(e.target.value)} />
        <select style={S.input} value={filterFil} onChange={e => setFilterFil(e.target.value)}>
          <option value="">Toutes les filières</option>
          {filieres.map(f => <option key={f.id} value={f.id}>{f.code}</option>)}
        </select>
        <select style={S.input} value={filterSem} onChange={e => setFilterSem(e.target.value)}>
          <option value="">Tous les semestres</option>
          {semestres.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
        </select>
        <span style={S.count}>{filtered.length} matière{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Tableau */}
      <div style={S.card}>
        {pageLoading ? (
          <div style={S.spinner}>⏳ Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
            <p>Aucune matière trouvée.</p>
            <button style={{ ...S.btnPrimary, marginTop: '1rem' }} onClick={openCreate}>Créer une matière</button>
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                {['Code', 'Nom', 'Filière / Niveau', 'Semestre', 'Coef.', 'Enseignant', ''].map(h => (
                  <th key={h} style={{ ...S.th, ...(h === '' ? { textAlign: 'right' as const } : {}) }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td style={S.td}><span style={S.code}>{m.code}</span></td>
                  <td style={{ ...S.td, fontWeight: 500 }}>{m.nom}</td>
                  <td style={S.td}>
                    {m.filiere && m.niveau
                      ? <span style={S.badge('#ede9fe', '#4c1d95')}>{m.filiere.code} — {m.niveau.nom}</span>
                      : <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={S.td}>
                    {m.semestre
                      ? <span style={S.badge('#d1fae5', '#065f46')}>{m.semestre.nom}</span>
                      : <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={S.td}><span style={S.coef}>{m.coefficient}</span></td>
                  <td style={{ ...S.td, color: '#6b7280' }}>{m.enseignant?.nomComplet ?? '—'}</td>
                  <td style={{ ...S.td, textAlign: 'right' }}>
                    <div style={S.actions}>
                      <button style={S.btnEdit} onClick={() => openEdit(m)} aria-label={`Modifier ${m.nom}`}>✎</button>
                      <button style={S.btnDel}  onClick={() => setDeleteTarget(m)} aria-label={`Supprimer ${m.nom}`}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal
          form={form} editId={editId} error={formError} loading={saving}
          semestres={semestres} enseignants={enseignants}
          onChange={setForm} onSave={handleSave} onClose={() => setShowModal(false)}
        />
      )}

      {deleteTarget && (
        <ConfirmDelete
          nom={deleteTarget.nom} loading={deleting}
          onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}