// src/pages/admin/Annees.tsx
import { useState, useMemo, useEffect, useCallback } from 'react'
import { anneeService, type Annee } from '../../api/services/anneeService'
// Après les imports existants, ajouter :
import { Modal, ConfirmModal, BtnPrimary, BtnGhost, FormField, Input, Select, Alert } from '../../components/ui/Modal'
interface AnneeForm {
  libelle: string
  dateDebut: string
  dateFin: string
  statut: 'active' | 'archivee' | 'en_preparation'
}

const FORM_INIT: AnneeForm = { libelle: '', dateDebut: '', dateFin: '', statut: 'en_preparation' }

const ENI = { dark: '#064e3b', mid: '#065f46', light: '#047857' }

const S = {
  page:      { padding: '1.5rem', minHeight: '100vh', backgroundColor: '#f9fafb' } as React.CSSProperties,
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '2rem' } as React.CSSProperties,
  card:      { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', padding: '1.25rem' } as React.CSSProperties,
  cardActive:{ backgroundColor: '#fff', borderRadius: '12px', border: `2px solid ${ENI.light}`, padding: '1.25rem' } as React.CSSProperties,
  //overlay:   { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  //modal:     { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', width: '100%', maxWidth: '440px', padding: '1.5rem', margin: '1rem' },
  //formGroup: { marginBottom: '1rem' },
  //label:     { display: 'block', fontSize: '13px', color: '#374151', marginBottom: '5px', fontWeight: 500 } as React.CSSProperties,
  //formInput: { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff', color: '#111827', outline: 'none', boxSizing: 'border-box' as const },
  //footer:    { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.5rem', borderTop: '0.5px solid #e5e7eb', paddingTop: '1.25rem' },
  //btnPrimary:{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: ENI.light, color: '#fff' } as React.CSSProperties,
  //btnGhost:  { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '0.5px solid #d1d5db', backgroundColor: 'transparent', color: '#374151' } as React.CSSProperties,
  btnSm:     (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: bg, color } as React.CSSProperties),
  //success:   { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#d1fae5', color: '#065f46', fontSize: '13px' },
  //errBox:    { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px' },
  //warn:      { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fef9c3', color: '#854d0e', fontSize: '13px' },
  spinner:   { textAlign: 'center' as const, padding: '3rem', color: '#9ca3af', fontSize: '13px' },
  badge:     (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, backgroundColor: bg, color } as React.CSSProperties),
}

const STATUT_MAP = {
  active:         { label: 'Active',         bg: '#d1fae5', color: '#065f46' },
  archivee:       { label: 'Archivée',       bg: '#f3f4f6', color: '#6b7280' },
  en_preparation: { label: 'En préparation', bg: '#fef9c3', color: '#854d0e' },
}

const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

// ─── Modal ────────────────────────────────────────────────────────────────────

function AnneeModal({ form, editId, error, loading, onChange, onSave, onClose }: {
  form: AnneeForm; editId: number | null; error: string; loading: boolean
  onChange: (f: AnneeForm) => void; onSave: () => void; onClose: () => void
}) {
  const set = (k: keyof AnneeForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...form, [k]: e.target.value })

  return (
    <Modal
      title={editId ? "Modifier l'année" : 'Nouvelle année universitaire'}
      icon="📅"
      iconBg="#dbeafe"
      iconColor="#1e40af"
      onClose={onClose}
      loading={loading}
      size="md"
      footer={
        <>
          <BtnGhost onClick={onClose} disabled={loading}>Annuler</BtnGhost>
          <BtnPrimary onClick={onSave} disabled={loading}>
            {loading ? '⏳ Enregistrement…' : '✓ Enregistrer'}
          </BtnPrimary>
        </>
      }
    >
      {error && <Alert type="error" onDismiss={() => {}}>{error}</Alert>}

      <FormField label="Libellé" required hint="Format attendu : 2025-2026">
        <Input value={form.libelle} onChange={set('libelle')} placeholder="2025-2026" />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <FormField label="Date de début" required>
          <Input type="date" value={form.dateDebut} onChange={set('dateDebut')} />
        </FormField>
        <FormField label="Date de fin" required>
          <Input type="date" value={form.dateFin} onChange={set('dateFin')} />
        </FormField>
      </div>

      <FormField label="Statut" hint="Une seule année peut être active à la fois">
        <Select value={form.statut} onChange={set('statut')}>
          <option value="en_preparation">En préparation</option>
          <option value="active">Active</option>
          <option value="archivee">Archivée</option>
        </Select>
      </FormField>
    </Modal>
  )
}

// ─── Carte année ──────────────────────────────────────────────────────────────

function AnneeCard({ a, onEdit, onDelete, onActivate, onArchive, loadingId }: {
  a: Annee; onEdit: () => void; onDelete: () => void
  onActivate: () => void; onArchive: () => void; loadingId: number | null
}) {
  const st = STATUT_MAP[a.statut]
  const isActive  = a.statut === 'active'
  const isArchive = a.statut === 'archivee'
  const busy      = loadingId === a.id

  return (
    <div style={isActive ? S.cardActive : S.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{a.libelle}</h2>
          <span style={S.badge(st.bg, st.color)}>
            {isActive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a', marginRight: '5px', display: 'inline-block' }} />}
            {st.label}
          </span>
        </div>
        {isActive && <span style={{ fontSize: '20px' }}>⭐</span>}
      </div>

      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span>📅 Début : {fmt(a.dateDebut)}</span>
        <span>🏁 Fin : {fmt(a.dateFin)}</span>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {!isActive && !isArchive && (
          <button style={S.btnSm(ENI.light, '#fff')} onClick={onActivate} disabled={busy}>
            {busy ? '⏳' : '✓ Activer'}
          </button>
        )}
        {!isArchive && (
          <button style={S.btnSm('#f3f4f6', '#374151')} onClick={onEdit} disabled={busy}>✎ Modifier</button>
        )}
        {!isActive && !isArchive && (
          <button style={S.btnSm('#e5e7eb', '#6b7280')} onClick={onArchive} disabled={busy}>📦 Archiver</button>
        )}
        {isArchive && <span style={{ fontSize: '12px', color: '#9ca3af', padding: '5px 0' }}>Lecture seule</span>}
        {!isActive && (
          <button style={S.btnSm('#fee2e2', '#991b1b')} onClick={onDelete} disabled={busy}>✕</button>
        )}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Annees() {
  const [annees, setAnnees]         = useState<Annee[]>([])
  const [showModal, setShowModal]   = useState(false)
  const [editId, setEditId]         = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Annee | null>(null)
  const [form, setForm]             = useState<AnneeForm>(FORM_INIT)
  const [formError, setFormError]   = useState('')
  const [flash, setFlash]           = useState('')
  const [pageError, setPageError]   = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving]         = useState(false)
  const [loadingId, setLoadingId]   = useState<number | null>(null)
  const [warnActivate, setWarnActivate] = useState<number | null>(null)

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3000) }

  const load = useCallback(async () => {
    setPageLoading(true)
    setPageError('')
    try {
      setAnnees(await anneeService.list())
    } catch {
      setPageError('Erreur de chargement des années.')
    } finally {
      setPageLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const sorted = useMemo(() => [...annees].sort((a, b) => {
    const order = { active: 0, en_preparation: 1, archivee: 2 }
    return order[a.statut] - order[b.statut]
  }), [annees])

  const openCreate = () => { setForm(FORM_INIT); setEditId(null); setFormError(''); setShowModal(true) }
  const openEdit   = (a: Annee) => {
    setForm({ libelle: a.libelle, dateDebut: a.dateDebut, dateFin: a.dateFin, statut: a.statut })
    setEditId(a.id); setFormError(''); setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.libelle.trim() || !form.dateDebut || !form.dateFin) {
      setFormError('Libellé, date de début et date de fin sont obligatoires.'); return
    }
    if (new Date(form.dateFin) <= new Date(form.dateDebut)) {
      setFormError('La date de fin doit être après la date de début.'); return
    }
    setSaving(true); setFormError('')
    try {
      if (editId) {
        await anneeService.update(editId, form)
        showFlash('Année modifiée.')
      } else {
        await anneeService.create(form)
        showFlash('Année créée.')
      }
      setShowModal(false)
      await load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setFormError(e.response?.data?.message ?? 'Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = (id: number) => {
    const hasActive = annees.some(a => a.statut === 'active' && a.id !== id)
    if (hasActive) { setWarnActivate(id); return }
    doActivate(id)
  }

  const doActivate = async (id: number) => {
    setLoadingId(id); setWarnActivate(null)
    try {
      await anneeService.activer(id)
      showFlash('Année activée.')
      await load()
    } catch {
      setPageError('Erreur lors de l\'activation.')
    } finally {
      setLoadingId(null)
    }
  }

  const handleArchive = async (id: number) => {
    setLoadingId(id)
    try {
      await anneeService.update(id, { statut: 'archivee' })
      showFlash('Année archivée.')
      await load()
    } catch {
      setPageError('Erreur lors de l\'archivage.')
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setLoadingId(deleteTarget.id)
    try {
      await anneeService.delete(deleteTarget.id)
      setDeleteTarget(null)
      showFlash('Année supprimée.')
      await load()
    } catch {
      setPageError('Erreur lors de la suppression.')
      setDeleteTarget(null)
    } finally {
      setLoadingId(null)
    }
  }

  const activeAnnee = annees.find(a => a.statut === 'active')

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Administration › Années universitaires</div>
          <h1 style={{ fontSize: '22px', fontWeight: 500 }}>Années universitaires</h1>
        </div>
        <BtnPrimary onClick={openCreate}>+ Nouvelle année</BtnPrimary>
      </div>

      {activeAnnee && (
        <div style={{ marginBottom: '1.5rem', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#ecfdf5', border: '0.5px solid #6ee7b7', fontSize: '14px', color: ENI.mid, display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⭐ Année universitaire en cours : <strong>{activeAnnee.libelle}</strong>
        </div>
      )}

      {flash     && <Alert type="success" onDismiss={() => setFlash('')}>{flash}</Alert>}
{pageError && <Alert type="error" onDismiss={() => setPageError('')}>{pageError} <button onClick={load} style={{ marginLeft: '8px', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '13px' }}>Réessayer</button></Alert>}
      {warnActivate !== null && (
  <ConfirmModal
    title="Changer l'année active ?"
    message="Une année universitaire est déjà active. Activer celle-ci la désactivera automatiquement."
    variant="warning"
    confirmLabel="Confirmer l'activation"
    onConfirm={() => doActivate(warnActivate)}
    onCancel={() => setWarnActivate(null)}
  />
)}

      {/* Stats rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total',      value: annees.length,                                        color: '#111827' },
          { label: 'Active',     value: annees.filter(a => a.statut === 'active').length,     color: ENI.light },
          { label: 'Archivées',  value: annees.filter(a => a.statut === 'archivee').length,   color: '#6b7280' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '0.5px solid #e5e7eb', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 600, color }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      {pageLoading ? (
        <div style={S.spinner}>⏳ Chargement…</div>
      ) : (
        <div style={S.grid}>
          {sorted.map(a => (
            <AnneeCard
              key={a.id} a={a} loadingId={loadingId}
              onEdit={() => openEdit(a)}
              onDelete={() => setDeleteTarget(a)}
              onActivate={() => handleActivate(a.id)}
              onArchive={() => handleArchive(a.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
  <AnneeModal form={form} editId={editId} error={formError} loading={saving}
    onChange={setForm} onSave={handleSave} onClose={() => setShowModal(false)} />
)}

      {deleteTarget && (
  <ConfirmModal
    title={`Supprimer ${deleteTarget.libelle} ?`}
    message="Cette action est irréversible. Toutes les données liées à cette année seront perdues."
    variant="danger"
    confirmLabel="Supprimer définitivement"
    loading={loadingId === deleteTarget.id}
    onConfirm={handleDelete}
    onCancel={() => setDeleteTarget(null)}
  />
)}
    </div>
  )
}