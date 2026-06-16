// src/pages/admin/Enseignants.tsx
import { useState, useMemo, useEffect, useCallback } from 'react'
import { enseignantService, type Enseignant, type EnseignantPayload } from '../../api/services/enseignantService'
import { Modal, ConfirmModal, BtnPrimary, BtnGhost, FormField, Input, Select, Alert } from '../../components/ui/Modal'
interface EnseignantForm {
  nom: string; prenom: string; email: string; matricule: string
  grade: string; specialite: string; statut: string; dateEmbauche: string; password: string
}

const FORM_INIT: EnseignantForm = {
  nom: '', prenom: '', email: '', matricule: '',
  grade: 'Docteur', specialite: '', statut: 'actif',
  dateEmbauche: '', password: '',
}

const GRADES = ['Professeur', 'Maître de Conférences', 'Docteur', 'Assistant', 'Vacataire']

const ENI = { dark: '#064e3b', mid: '#065f46', light: '#047857' }

const S = {
  page:      { padding: '1.5rem', minHeight: '100vh', backgroundColor: '#f9fafb' } as React.CSSProperties,
  card:      { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', overflow: 'hidden' } as React.CSSProperties,
  table:     { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
  th:        { padding: '10px 14px', textAlign: 'left' as const, fontWeight: 500, fontSize: '11px', color: '#6b7280', borderBottom: '0.5px solid #e5e7eb', backgroundColor: '#f9fafb', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
  td:        { padding: '11px 14px', borderBottom: '0.5px solid #f3f4f6', color: '#111827', verticalAlign: 'middle' as const },
 //overlay:   { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  //modal:     { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', width: '100%', maxWidth: '520px', padding: '1.5rem', margin: '1rem', maxHeight: '90vh', overflowY: 'auto' as const },
  //formGroup: { marginBottom: '1rem' },
  //label:     { display: 'block', fontSize: '13px', color: '#374151', marginBottom: '5px', fontWeight: 500 } as React.CSSProperties,
  //formInput: { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff', color: '#111827', outline: 'none', boxSizing: 'border-box' as const },
  //formRow:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  //footer:    { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.5rem', borderTop: '0.5px solid #e5e7eb', paddingTop: '1.25rem' },
  //btnPrimary:{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: ENI.light, color: '#fff' } as React.CSSProperties,
  //btnGhost:  { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '0.5px solid #d1d5db', backgroundColor: 'transparent', color: '#374151' } as React.CSSProperties,
  btnEdit:   { display: 'inline-flex', padding: '5px 8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', border: '0.5px solid #d1d5db', backgroundColor: 'transparent', color: '#374151' } as React.CSSProperties,
  btnDel:    { display: 'inline-flex', padding: '5px 8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', border: 'none', backgroundColor: '#fee2e2', color: '#991b1b' } as React.CSSProperties,
  badge:     (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, backgroundColor: bg, color } as React.CSSProperties),
  filters:   { display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' as const, alignItems: 'center' },
  searchInput:{ padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', flex: 1, minWidth: '200px', outline: 'none' } as React.CSSProperties,
  select:    { padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', outline: 'none' } as React.CSSProperties,
  //success:   { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#d1fae5', color: '#065f46', fontSize: '13px' },
  //errBox:    { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px' },
  spinner:   { textAlign: 'center' as const, padding: '3rem', color: '#9ca3af', fontSize: '13px' },
}

function EnseignantModal({ form, editId, error, loading, onChange, onSave, onClose, grades }: {
  form: EnseignantForm; editId: number | null; error: string; loading: boolean
  grades: string[]
  onChange: (k: keyof EnseignantForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onSave: () => void; onClose: () => void
}) {
  return (
    <Modal
      title={editId ? "Modifier l'enseignant" : 'Nouvel enseignant'}
      icon="👨‍🏫"
      iconBg="#dbeafe"
      iconColor="#1e40af"
      size="lg"
      onClose={onClose}
      loading={loading}
      footer={
        <>
          <BtnGhost onClick={onClose} disabled={loading}>Annuler</BtnGhost>
          <BtnPrimary onClick={onSave} disabled={loading}>
            {loading ? '⏳ Enregistrement…' : '✓ Enregistrer'}
          </BtnPrimary>
        </>
      }
    >
      {error && <Alert type="error">{error}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <FormField label="Prénom" required>
          <Input value={form.prenom} onChange={onChange('prenom')} placeholder="Jean" />
        </FormField>
        <FormField label="Nom" required>
          <Input value={form.nom} onChange={onChange('nom')} placeholder="Rakoto" />
        </FormField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <FormField label="Email" required>
          <Input type="email" value={form.email} onChange={onChange('email')} placeholder="rakoto@eni.mg" />
        </FormField>
        <FormField label="Matricule" required hint="Format : ENS-YYYY-XXXXX">
          <Input value={form.matricule} onChange={onChange('matricule')} placeholder="ENS-2024-00001" />
        </FormField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <FormField label="Grade">
          <Select value={form.grade} onChange={onChange('grade')}>
            {grades.map(g => <option key={g}>{g}</option>)}
          </Select>
        </FormField>
        <FormField label="Spécialité">
          <Input value={form.specialite} onChange={onChange('specialite')} placeholder="Algorithmique" />
        </FormField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <FormField label="Date d'embauche">
          <Input type="date" value={form.dateEmbauche} onChange={onChange('dateEmbauche')} />
        </FormField>
        <FormField label="Statut">
          <Select value={form.statut} onChange={onChange('statut')}>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </Select>
        </FormField>
      </div>

      <FormField
        label={editId ? 'Nouveau mot de passe' : 'Mot de passe'}
        required={!editId}
        hint={editId ? 'Laisser vide pour ne pas modifier' : 'Min. 8 caractères, 1 majuscule, 1 chiffre, 1 spécial'}
      >
        <Input type="password" value={form.password} onChange={onChange('password')} placeholder="••••••••" />
      </FormField>
    </Modal>
  )
}

export default function Enseignants() {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([])
  const [search, setSearch]           = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [showModal, setShowModal]     = useState(false)
  const [editId, setEditId]           = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Enseignant | null>(null)
  const [form, setForm]               = useState<EnseignantForm>(FORM_INIT)
  const [formError, setFormError]     = useState('')
  const [flash, setFlash]             = useState('')
  const [pageError, setPageError]     = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving]           = useState(false)

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3000) }

  const load = useCallback(async () => {
    setPageLoading(true); setPageError('')
    try {
      setEnseignants(await enseignantService.list())
    } catch {
      setPageError('Erreur de chargement.')
    } finally {
      setPageLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => enseignants.filter(e => {
    const q = search.toLowerCase()
    const matchQ = !q || e.nom.toLowerCase().includes(q) || e.prenom.toLowerCase().includes(q) || e.matricule.toLowerCase().includes(q)
    const matchG = !filterGrade  || e.grade   === filterGrade
    const matchS = !filterStatut || e.statut  === filterStatut
    return matchQ && matchG && matchS
  }), [enseignants, search, filterGrade, filterStatut])

  const set = (k: keyof EnseignantForm) =>
    (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: ev.target.value }))

  const openCreate = () => { setForm(FORM_INIT); setEditId(null); setFormError(''); setShowModal(true) }
  const openEdit   = (e: Enseignant) => {
    setForm({
      nom: e.nom, prenom: e.prenom, email: e.email, matricule: e.matricule,
      grade: e.grade ?? 'Docteur', specialite: e.specialite ?? '',
      statut: e.statut ?? 'actif', dateEmbauche: e.dateEmbauche?.split('T')[0] ?? '',
      password: '',
    })
    setEditId(e.id); setFormError(''); setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.nom.trim() || !form.prenom.trim() || !form.email.trim() || !form.matricule.trim()) {
      setFormError('Nom, prénom, email et matricule sont obligatoires.'); return
    }
    if (!editId && !form.password.trim()) {
      setFormError('Le mot de passe est obligatoire pour un nouvel enseignant.'); return
    }
    setSaving(true); setFormError('')
    try {
      const payload: EnseignantPayload = {
        nom: form.nom, prenom: form.prenom, email: form.email, matricule: form.matricule,
        grade: form.grade, specialite: form.specialite, statut: form.statut,
        dateEmbauche: form.dateEmbauche || undefined,
        password: form.password || undefined,
      }
      if (editId) {
        await enseignantService.update(editId, payload)
        showFlash('Enseignant modifié.')
      } else {
        await enseignantService.create(payload)
        showFlash('Enseignant créé.')
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
      await enseignantService.delete(deleteTarget.id)
      setDeleteTarget(null); showFlash('Enseignant supprimé.'); await load()
    } catch {
      setPageError('Erreur lors de la suppression.'); setDeleteTarget(null)
    }
  }

  const grades = [...new Set(enseignants.map(e => e.grade).filter(Boolean))]

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Administration › Enseignants</div>
          <h1 style={{ fontSize: '22px', fontWeight: 500 }}>Enseignants</h1>
        </div>
        <BtnPrimary onClick={openCreate}>+ Nouvel enseignant</BtnPrimary>
      </div>

      {flash     && <Alert type="success" onDismiss={() => setFlash('')}>{flash}</Alert>}
      {pageError && <Alert type="error" onDismiss={() => setPageError('')}>{pageError}</Alert>}
      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total',        value: enseignants.length,                                    color: '#111827' },
          { label: 'Actifs',       value: enseignants.filter(e => e.statut === 'actif').length,  color: ENI.light },
          { label: 'Vacataires',   value: enseignants.filter(e => e.grade === 'Vacataire').length, color: '#854d0e' },
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
        <select style={S.select} value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
          <option value="">Tous les grades</option>
          {grades.map(g => <option key={g}>{g}</option>)}
        </select>
        <select style={S.select} value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
        </select>
        <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: 'auto' }}>
          {filtered.length} enseignant{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tableau */}
      <div style={S.card}>
        {pageLoading ? (
          <div style={S.spinner}>⏳ Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👨‍🏫</div>
            <p>Aucun enseignant trouvé.</p>
            <BtnPrimary onClick={openCreate}>Créer un enseignant</BtnPrimary>
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                {['Matricule', 'Nom & Prénom', 'Email', 'Grade', 'Spécialité', 'Embauche', 'Statut', ''].map(h => (
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
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                        {e.prenom[0]}{e.nom[0]}
                      </div>
                      {e.prenom} {e.nom}
                    </div>
                  </td>
                  <td style={{ ...S.td, color: '#6b7280', fontSize: '12px' }}>{e.email}</td>
                  <td style={S.td}>
                    <span style={S.badge('#dbeafe', '#1e40af')}>{e.grade ?? '—'}</span>
                  </td>
                  <td style={{ ...S.td, color: '#6b7280', fontSize: '12px' }}>{e.specialite ?? '—'}</td>
                  <td style={{ ...S.td, color: '#6b7280', fontSize: '12px' }}>
                    {e.dateEmbauche ? new Date(e.dateEmbauche).getFullYear() : '—'}
                  </td>
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
  <EnseignantModal
    form={form}
    editId={editId}
    error={formError}
    loading={saving}
    grades={GRADES}
    onChange={set}
    onSave={handleSave}
    onClose={() => setShowModal(false)}
  />
)}

      {deleteTarget && (
  <ConfirmModal
    title={`Supprimer ${deleteTarget.prenom} ${deleteTarget.nom} ?`}
    message="Cet enseignant sera retiré de toutes ses matières assignées."
    detail="Cette action est irréversible."
    variant="danger"
    confirmLabel="Supprimer"
    onConfirm={handleDelete}
    onCancel={() => setDeleteTarget(null)}
  />
)}
    </div>
  )
}