// src/pages/admin/Filieres.tsx
import { useState, useMemo, useEffect, useCallback } from 'react'
import { filiereService, type Filiere } from '../../api/services/filiereService'
import { niveauService, type Niveau } from '../../api/services/niveauService'

interface FiliereForm { code: string; nom: string; description: string }
const FORM_INIT: FiliereForm = { code: '', nom: '', description: '' }

const ENI = { dark: '#064e3b', mid: '#065f46', light: '#047857' }

const S = {
  page:      { padding: '1.5rem', minHeight: '100vh', backgroundColor: '#f9fafb' } as React.CSSProperties,
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' } as React.CSSProperties,
  card:      { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', padding: '1.25rem' } as React.CSSProperties,
  overlay:   { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal:     { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', width: '100%', maxWidth: '460px', padding: '1.5rem', margin: '1rem' },
  formGroup: { marginBottom: '1rem' },
  label:     { display: 'block', fontSize: '13px', color: '#374151', marginBottom: '5px', fontWeight: 500 } as React.CSSProperties,
  formInput: { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff', color: '#111827', outline: 'none', boxSizing: 'border-box' as const },
  footer:    { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.5rem', borderTop: '0.5px solid #e5e7eb', paddingTop: '1.25rem' },
  btnPrimary:{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: ENI.light, color: '#fff' } as React.CSSProperties,
  btnGhost:  { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '0.5px solid #d1d5db', backgroundColor: 'transparent', color: '#374151' } as React.CSSProperties,
  btnSm:     (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: bg, color } as React.CSSProperties),
  badge:     (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, backgroundColor: bg, color } as React.CSSProperties),
  success:   { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#d1fae5', color: '#065f46', fontSize: '13px' },
  errBox:    { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px' },
  spinner:   { textAlign: 'center' as const, padding: '3rem', color: '#9ca3af', fontSize: '13px' },
  input:     { padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', outline: 'none', flex: 1, minWidth: '200px' } as React.CSSProperties,
}

const COLORS = ['#1e40af', '#065f46', '#4c1d95', '#991b1b', '#854d0e', '#0369a1']

export default function Filieres() {
  const [filieres, setFilieres]       = useState<Filiere[]>([])
  const [niveaux, setNiveaux]         = useState<Niveau[]>([])
  const [search, setSearch]           = useState('')
  const [showModal, setShowModal]     = useState(false)
  const [editId, setEditId]           = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Filiere | null>(null)
  const [form, setForm]               = useState<FiliereForm>(FORM_INIT)
  const [formError, setFormError]     = useState('')
  const [flash, setFlash]             = useState('')
  const [pageError, setPageError]     = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving]           = useState(false)

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3000) }

  const load = useCallback(async () => {
    setPageLoading(true)
    try {
      const [f, n] = await Promise.all([filiereService.list(), niveauService.list()])
      setFilieres(f); setNiveaux(n)
    } catch {
      setPageError('Erreur de chargement.')
    } finally {
      setPageLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return filieres.filter(f =>
      !q || f.nom.toLowerCase().includes(q) || f.code.toLowerCase().includes(q)
    )
  }, [filieres, search])

  const openCreate = () => { setForm(FORM_INIT); setEditId(null); setFormError(''); setShowModal(true) }
  const openEdit   = (f: Filiere) => {
    setForm({ code: f.code, nom: f.nom, description: f.description ?? '' })
    setEditId(f.id); setFormError(''); setShowModal(true)
  }

  const set = (k: keyof FiliereForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.code.trim() || !form.nom.trim()) {
      setFormError('Code et nom sont obligatoires.'); return
    }
    setSaving(true); setFormError('')
    try {
      if (editId) {
        await filiereService.update(editId, form)
        showFlash('Filière modifiée.')
      } else {
        await filiereService.create(form)
        showFlash('Filière créée.')
      }
      setShowModal(false); await load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setFormError(e.response?.data?.message ?? 'Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await filiereService.delete(deleteTarget.id)
      setDeleteTarget(null); showFlash('Filière supprimée.'); await load()
    } catch {
      setPageError('Erreur lors de la suppression.'); setDeleteTarget(null)
    }
  }

  const getNiveaux = (f: Filiere) =>
    niveaux.filter(n => n.filiere?.id === f.id)

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Administration › Filières</div>
          <h1 style={{ fontSize: '22px', fontWeight: 500 }}>Filières</h1>
        </div>
        <button style={S.btnPrimary} onClick={openCreate}>+ Nouvelle filière</button>
      </div>

      {flash    && <div style={S.success}>✓ {flash}</div>}
      {pageError && <div style={S.errBox}>⚠ {pageError}</div>}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
        <input style={S.input} placeholder="Rechercher une filière…" value={search} onChange={e => setSearch(e.target.value)} />
        <span style={{ fontSize: '13px', color: '#6b7280', alignSelf: 'center' }}>
          {filtered.length} filière{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {pageLoading ? (
        <div style={S.spinner}>⏳ Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
          <p>Aucune filière trouvée.</p>
          <button style={{ ...S.btnPrimary, marginTop: '1rem' }} onClick={openCreate}>Créer une filière</button>
        </div>
      ) : (
        <div style={S.grid}>
          {filtered.map((f, i) => {
            const color  = COLORS[i % COLORS.length]
            const niv    = getNiveaux(f)
            return (
              <div key={f.id} style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color }}>
                    {f.code}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={S.btnSm('#f3f4f6', '#374151')} onClick={() => openEdit(f)}>✎</button>
                    <button style={S.btnSm('#fee2e2', '#991b1b')} onClick={() => setDeleteTarget(f)}>✕</button>
                  </div>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>{f.nom}</h3>
                {f.description && (
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px', lineHeight: 1.5 }}>{f.description}</p>
                )}

                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Niveaux ({niv.length})
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {niv.length > 0
                      ? niv.map(n => <span key={n.id} style={S.badge(`${color}18`, color)}>{n.nom}</span>)
                      : <span style={{ fontSize: '12px', color: '#d1d5db' }}>Aucun niveau</span>
                    }
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={S.modal} role="dialog">
            <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '1.25rem' }}>
              {editId ? 'Modifier la filière' : 'Nouvelle filière'}
            </h2>
            {formError && <div style={S.errBox}>{formError}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div style={S.formGroup}>
                <label style={S.label}>Code *</label>
                <input style={S.formInput} value={form.code} onChange={set('code')} placeholder="GL" />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Nom *</label>
                <input style={S.formInput} value={form.nom} onChange={set('nom')} placeholder="Génie Logiciel" />
              </div>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Description</label>
              <textarea
                style={{ ...S.formInput, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
                value={form.description}
                onChange={set('description')}
                placeholder="Description de la filière…"
              />
            </div>
            <div style={S.footer}>
              <button style={S.btnGhost} onClick={() => setShowModal(false)} disabled={saving}>Annuler</button>
              <button style={{ ...S.btnPrimary, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
                {saving ? '⏳…' : '✓ Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, maxWidth: '380px' }} role="dialog">
            <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '0.75rem' }}>
              Supprimer {deleteTarget.nom} ?
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '1.5rem' }}>
              Cette action supprimera aussi les niveaux associés.
            </p>
            <div style={S.footer}>
              <button style={S.btnGhost} onClick={() => setDeleteTarget(null)}>Annuler</button>
              <button style={{ ...S.btnPrimary, backgroundColor: '#dc2626' }} onClick={handleDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}