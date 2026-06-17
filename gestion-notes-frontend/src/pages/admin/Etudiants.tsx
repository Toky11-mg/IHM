// src/pages/admin/Etudiants.tsx
import { useState, useMemo, useEffect, useCallback } from 'react'
import { etudiantService, type Etudiant, type EtudiantPayload } from '../../api/services/etudiantService'
import { filiereService, type Filiere } from '../../api/services/filiereService'
import { niveauService, type Niveau } from '../../api/services/niveauService'

interface EtudiantForm {
  nom: string; prenom: string; email: string
  niveauId: string; filiereId: string; anneeEntree: string
  dateNaissance: string; lieuNaissance: string; nationalite: string
  genre: string
  statut: string; password: string
}

const FORM_INIT: EtudiantForm = {
  nom: '', prenom: '', email: '',
  niveauId: '', filiereId: '', anneeEntree: String(new Date().getFullYear()),
  dateNaissance: '', lieuNaissance: '', nationalite: 'Malgache',
  genre: '',
  statut: 'actif', password: '',
}

const ENI = { dark: '#064e3b', mid: '#065f46', light: '#047857' }

const S = {
  page:      { padding: '1.5rem', minHeight: '100vh', backgroundColor: '#f9fafb' } as React.CSSProperties,
  card:      { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', overflow: 'hidden' } as React.CSSProperties,
  table:     { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
  th:        { padding: '10px 14px', textAlign: 'left' as const, fontWeight: 500, fontSize: '11px', color: '#6b7280', borderBottom: '0.5px solid #e5e7eb', backgroundColor: '#f9fafb', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
  td:        { padding: '11px 14px', borderBottom: '0.5px solid #f3f4f6', color: '#111827', verticalAlign: 'middle' as const },
  overlay:   { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal:     { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', width: '100%', maxWidth: '520px', padding: '1.5rem', margin: '1rem', maxHeight: '90vh', overflowY: 'auto' as const },
  formGroup: { marginBottom: '1rem' },
  label:     { display: 'block', fontSize: '13px', color: '#374151', marginBottom: '5px', fontWeight: 500 } as React.CSSProperties,
  formInput: { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff', color: '#111827', outline: 'none', boxSizing: 'border-box' as const },
  formRow:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  footer:    { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.5rem', borderTop: '0.5px solid #e5e7eb', paddingTop: '1.25rem' },
  btnPrimary:{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: ENI.light, color: '#fff' } as React.CSSProperties,
  btnGhost:  { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '0.5px solid #d1d5db', backgroundColor: 'transparent', color: '#374151' } as React.CSSProperties,
  btnEdit:   { display: 'inline-flex', padding: '5px 8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', border: '0.5px solid #d1d5db', backgroundColor: 'transparent', color: '#374151' } as React.CSSProperties,
  btnDel:    { display: 'inline-flex', padding: '5px 8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', border: 'none', backgroundColor: '#fee2e2', color: '#991b1b' } as React.CSSProperties,
  badge:     (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, backgroundColor: bg, color } as React.CSSProperties),
  filters:   { display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' as const, alignItems: 'center' },
  input:     { padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', outline: 'none' } as React.CSSProperties,
  searchInput:{ padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', flex: 1, minWidth: '200px', outline: 'none' } as React.CSSProperties,
  success:   { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#d1fae5', color: '#065f46', fontSize: '13px' },
  errBox:    { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px' },
  spinner:   { textAlign: 'center' as const, padding: '3rem', color: '#9ca3af', fontSize: '13px' },
}

export default function Etudiants() {
  const [etudiants, setEtudiants]     = useState<Etudiant[]>([])
  const [filieres, setFilieres]       = useState<Filiere[]>([])
  const [niveaux, setNiveaux]         = useState<Niveau[]>([])
  const [search, setSearch]           = useState('')
  const [filterFil, setFilterFil]     = useState('')
  const [filterNiv, setFilterNiv]     = useState('')
  const [showModal, setShowModal]     = useState(false)
  const [editId, setEditId]           = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Etudiant | null>(null)
  const [form, setForm]               = useState<EtudiantForm>(FORM_INIT)
  const [formError, setFormError]     = useState('')
  const [flash, setFlash]             = useState('')
  const [pageError, setPageError]     = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving]           = useState(false)

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3000) }

  const load = useCallback(async () => {
    setPageLoading(true)
    setPageError('')
    try {
      const [e, f, n] = await Promise.all([
        etudiantService.list(),
        filiereService.list(),
        niveauService.list(),
      ])
      setEtudiants(e); setFilieres(f); setNiveaux(n)
    } catch {
      setPageError('Erreur de chargement.')
    } finally {
      setPageLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => etudiants.filter(e => {
    const q = search.toLowerCase()
    const matchQ = !q || e.nom.toLowerCase().includes(q) || e.prenom.toLowerCase().includes(q) || e.matricule.toLowerCase().includes(q)
    const matchF = !filterFil || String(e.filiere?.id) === filterFil
    const matchN = !filterNiv || String(e.niveau?.id) === filterNiv
    return matchQ && matchF && matchN
  }), [etudiants, search, filterFil, filterNiv])

  const set = (k: keyof EtudiantForm) =>
    (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: ev.target.value }))

  const openCreate = () => { setForm(FORM_INIT); setEditId(null); setFormError(''); setShowModal(true) }
  const openEdit = (e: Etudiant) => {
  setForm({
    nom: e.nom, prenom: e.prenom, email: e.email,
    niveauId: String(e.niveau?.id ?? ''), filiereId: String(e.filiere?.id ?? ''),
    anneeEntree: String(e.anneeEntree ?? ''),
    dateNaissance: e.dateNaissance ?? '', lieuNaissance: e.lieuNaissance ?? '',
    nationalite: e.nationalite ?? '',
    genre: e.genre ?? '',
    statut: e.statut ?? 'actif', password: '',
  })
  setEditId(e.id); setFormError(''); setShowModal(true)
}

 const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: 'Minimum 8 caractères' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Au moins une majuscule' },
  { test: (p: string) => /[0-9]/.test(p), label: 'Au moins un chiffre' },
  { test: (p: string) => /[\W_]/.test(p), label: 'Au moins un caractère spécial' },
]

const handleSave = async () => {
  if (!form.nom.trim() || !form.prenom.trim() || !form.email.trim()) {
    setFormError('Nom, prénom et email sont obligatoires.'); return
  }
  if (!form.dateNaissance.trim() || !form.lieuNaissance.trim() || !form.nationalite.trim()) {
    setFormError('Date de naissance, lieu de naissance et nationalité sont obligatoires.'); return
  }
  if (!form.genre.trim()) {
    setFormError('Le genre est obligatoire.'); return
  }
  if (!editId) {
    if (!form.niveauId || !form.filiereId) {
      setFormError('Niveau et filière sont obligatoires pour un nouvel étudiant.'); return
    }
    if (!form.password.trim()) {
      setFormError('Le mot de passe est obligatoire pour un nouvel étudiant.'); return
    }
    const failedRule = PASSWORD_RULES.find(r => !r.test(form.password))
    if (failedRule) {
      setFormError(`Mot de passe invalide : ${failedRule.label}.`); return
    }
  }

  setSaving(true); setFormError('')
  try {
    const payload: EtudiantPayload = {
      nom: form.nom, prenom: form.prenom, email: form.email,
      dateNaissance: form.dateNaissance,
      lieuNaissance: form.lieuNaissance,
      nationalite: form.nationalite,
      genre: form.genre,
      niveauId:    form.niveauId    ? Number(form.niveauId)    : undefined,
      filiereId:   form.filiereId   ? Number(form.filiereId)   : undefined,
      anneeEntree: form.anneeEntree ? Number(form.anneeEntree) : undefined,
      statut:      form.statut,
      password:    form.password || undefined,
    }
    if (editId) {
      await etudiantService.update(editId, payload)
      showFlash('Étudiant modifié.')
    } else {
      await etudiantService.create(payload)
      showFlash('Étudiant créé.')
    }
    setShowModal(false); await load()
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string; errors?: Record<string, string> } } }
    const data = e.response?.data
    const detail = data?.errors ? Object.values(data.errors).join(' ') : ''
    setFormError([data?.message, detail].filter(Boolean).join(' ') || 'Erreur lors de l\'enregistrement.')
  } finally {
    setSaving(false)
  }
}

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await etudiantService.delete(deleteTarget.id)
      setDeleteTarget(null); showFlash('Étudiant supprimé.'); await load()
    } catch {
      setPageError('Erreur lors de la suppression.'); setDeleteTarget(null)
    }
  }

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Administration › Étudiants</div>
          <h1 style={{ fontSize: '22px', fontWeight: 500 }}>Étudiants</h1>
        </div>
        <button style={S.btnPrimary} onClick={openCreate}>+ Nouvel étudiant</button>
      </div>

      {flash    && <div style={S.success}>✓ {flash}</div>}
      {pageError && <div style={S.errBox}>⚠ {pageError} <button onClick={load} style={{ marginLeft: '8px', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontSize: '13px' }}>Réessayer</button></div>}

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total',  value: etudiants.length,                                       color: '#111827' },
          { label: 'Actifs', value: etudiants.filter(e => e.statut === 'actif').length,     color: ENI.light },
          { label: 'Filières', value: filieres.length,                                      color: '#1e40af' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '0.5px solid #e5e7eb', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={S.filters}>
        <input style={S.searchInput} placeholder="Rechercher nom, prénom, matricule…" value={search} onChange={e => setSearch(e.target.value)} />
        <select style={S.input} value={filterFil} onChange={e => setFilterFil(e.target.value)}>
          <option value="">Toutes les filières</option>
          {filieres.map(f => <option key={f.id} value={f.id}>{f.code} — {f.nom}</option>)}
        </select>
        <select style={S.input} value={filterNiv} onChange={e => setFilterNiv(e.target.value)}>
          <option value="">Tous les niveaux</option>
          {niveaux.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
        </select>
        <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: 'auto' }}>
          {filtered.length} étudiant{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tableau */}
      <div style={S.card}>
        {pageLoading ? (
          <div style={S.spinner}>⏳ Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
            <p>Aucun étudiant trouvé.</p>
            <button style={{ ...S.btnPrimary, marginTop: '1rem' }} onClick={openCreate}>Créer un étudiant</button>
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                {['Matricule', 'Nom & Prénom', 'Email', 'Filière', 'Niveau', 'Promo', 'Statut', ''].map(h => (
                  <th key={h} style={{ ...S.th, ...(h === '' ? { textAlign: 'right' as const } : {}) }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td style={S.td}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                      {e.matricule}
                    </span>
                  </td>
                  <td style={{ ...S.td, fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: ENI.light, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                        {e.prenom[0]}{e.nom[0]}
                      </div>
                      {e.prenom} {e.nom}
                    </div>
                  </td>
                  <td style={{ ...S.td, color: '#6b7280', fontSize: '12px' }}>{e.email}</td>
                  <td style={S.td}>
                    {e.filiere ? <span style={S.badge('#ede9fe', '#4c1d95')}>{e.filiere.nom}</span> : '—'}
                  </td>
                  <td style={{ ...S.td, color: '#6b7280' }}>{e.niveau?.nom ?? '—'}</td>
                  <td style={{ ...S.td, color: '#6b7280' }}>{e.anneeEntree ?? '—'}</td>
                  <td style={S.td}>
                    <span style={S.badge(e.statut === 'actif' ? '#d1fae5' : '#f3f4f6', e.statut === 'actif' ? '#065f46' : '#9ca3af')}>
                      {e.statut === 'actif' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ ...S.td, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button style={S.btnEdit} onClick={() => openEdit(e)}>✎</button>
                      <button style={S.btnDel}  onClick={() => setDeleteTarget(e)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal création/édition */}
      {showModal && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={S.modal} role="dialog">
            <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '1.25rem' }}>
              {editId ? 'Modifier l\'étudiant' : 'Nouvel étudiant'}
            </h2>
            {formError && <div style={S.errBox}>{formError}</div>}

            <div style={S.formRow}>
              <div style={S.formGroup}>
                <label style={S.label}>Prénom *</label>
                <input style={S.formInput} value={form.prenom} onChange={set('prenom')} placeholder="Jean" />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Nom *</label>
                <input style={S.formInput} value={form.nom} onChange={set('nom')} placeholder="Rakoto" />
              </div>
            </div>
            <div style={S.formRow}>
              <div style={S.formGroup}>
                <label style={S.label}>Email *</label>
                <input style={S.formInput} type="email" value={form.email} onChange={set('email')} placeholder="jean@eni.mg" />
              </div>
              
            </div>
            <div style={S.formRow}>
              <div style={S.formGroup}>
                <label style={S.label}>Filière</label>
                <select style={S.formInput} value={form.filiereId} onChange={set('filiereId')}>
                  <option value="">— Choisir —</option>
                  {filieres.map(f => <option key={f.id} value={f.id}>{f.code} — {f.nom}</option>)}
                </select>
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Niveau</label>
                <select style={S.formInput} value={form.niveauId} onChange={set('niveauId')}>
                  <option value="">— Choisir —</option>
                  {niveaux.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
                </select>
              </div>
            </div>
            <div style={S.formRow}>
              <div style={S.formGroup}>
                <label style={S.label}>Année d'entrée</label>
                <input style={S.formInput} type="number" value={form.anneeEntree} onChange={set('anneeEntree')} placeholder="2024" />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Statut</label>
                <select style={S.formInput} value={form.statut} onChange={set('statut')}>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>
            </div>

            <div style={S.formRow}>
  <div style={S.formGroup}>
    <label style={S.label}>Lieu de naissance *</label>
    <input style={S.formInput} value={form.lieuNaissance} onChange={set('lieuNaissance')} placeholder="Antananarivo" />
  </div>
  <div style={S.formGroup}>
    <label style={S.label}>Nationalité *</label>
    <input style={S.formInput} value={form.nationalite} onChange={set('nationalite')} placeholder="Malgache" />
  </div>
</div>

<div style={S.formRow}>
  <div style={S.formGroup}>
    <label style={S.label}>Date de naissance *</label>
    <input style={S.formInput} type="date" value={form.dateNaissance} onChange={set('dateNaissance')} />
  </div>
  <div style={S.formGroup}>
    <label style={S.label}>Genre *</label>
    <select style={S.formInput} value={form.genre} onChange={set('genre')}>
      <option value="">— Choisir —</option>
      <option value="M">Masculin</option>
      <option value="F">Féminin</option>
    </select>
  </div>
</div>

<div style={S.formGroup}>
  <label style={S.label}>{editId ? 'Nouveau mot de passe (laisser vide = inchangé)' : 'Mot de passe *'}</label>
  <input style={S.formInput} type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
  {!editId && (
    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
      Min. 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial.
    </p>
  )}
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
              Supprimer {deleteTarget.prenom} {deleteTarget.nom} ?
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '1.5rem' }}>
              Toutes les notes et données liées à cet étudiant seront perdues.
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