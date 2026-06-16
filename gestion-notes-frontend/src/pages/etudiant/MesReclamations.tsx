// src/pages/etudiant/MesReclamations.tsx
import { useState, useMemo } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type StatutReclamation = 'en_attente' | 'en_cours' | 'traitee' | 'rejetee'

interface Reclamation {
  id: number
  matiere: string
  codeMatiere: string
  semestre: 'S1' | 'S2'
  annee: string
  noteContestee: number
  motif: string
  description: string
  dateCreation: string
  dateTraitement?: string
  statut: StatutReclamation
  reponse?: string
}

interface ReclamationForm {
  matiere: string
  codeMatiere: string
  semestre: 'S1' | 'S2'
  noteContestee: string
  motif: string
  description: string
}

// ─── Mock ─────────────────────────────────────────────────────────────────────

const MOCK: Reclamation[] = [
  {
    id: 1, matiere: 'Mathématiques discrètes', codeMatiere: 'MATH01',
    semestre: 'S1', annee: '2024-2025', noteContestee: 9,
    motif: 'Erreur de correction', description: "La question 3 de l'examen a été mal corrigée. J'avais fourni la bonne démonstration mais la note ne le reflète pas.",
    dateCreation: '2025-01-22', statut: 'en_attente',
  },
  {
    id: 2, matiere: "Systèmes d'exploitation", codeMatiere: 'SYS02',
    semestre: 'S1', annee: '2024-2025', noteContestee: 11,
    motif: 'Note manquante', description: "Mon TP noté du 15 janvier n'a pas été pris en compte dans la note finale.",
    dateCreation: '2025-01-18', dateTraitement: '2025-01-25', statut: 'traitee',
    reponse: "Après vérification, votre TP a bien été comptabilisé. La note de 11 est confirmée.",
  },
  {
    id: 3, matiere: 'Algorithmique et structures de données', codeMatiere: 'ALGO01',
    semestre: 'S1', annee: '2024-2025', noteContestee: 14,
    motif: 'Autre', description: "Je souhaite consulter ma copie corrigée.",
    dateCreation: '2025-01-10', dateTraitement: '2025-01-15', statut: 'rejetee',
    reponse: "La consultation de copie se fait en présentiel sur rendez-vous auprès du secrétariat.",
  },
]

const MATIERES_DISPONIBLES = [
  { code: 'ALGO01', nom: 'Algorithmique et structures de données' },
  { code: 'MATH01', nom: 'Mathématiques discrètes' },
  { code: 'SYS02',  nom: "Systèmes d'exploitation" },
  { code: 'ANG01',  nom: 'Anglais technique' },
  { code: 'BD02',   nom: 'Bases de données relationnelles' },
]

const MOTIFS = [
  'Erreur de correction',
  'Note manquante',
  'Absence justifiée non prise en compte',
  'Erreur de calcul de moyenne',
  'Autre',
]

const FORM_INIT: ReclamationForm = {
  matiere: '', codeMatiere: '', semestre: 'S1',
  noteContestee: '', motif: '', description: '',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ENI = { dark: '#064e3b', mid: '#065f46', light: '#047857' }

const S = {
  page:      { padding: '1.5rem', minHeight: '100vh', backgroundColor: '#f9fafb' } as React.CSSProperties,
  card:      { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', padding: '1.25rem', marginBottom: '1rem' } as React.CSSProperties,
  cardNp:    { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', overflow: 'hidden' } as React.CSSProperties,
  table:     { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
  th:        { padding: '10px 14px', textAlign: 'left' as const, fontWeight: 500, fontSize: '11px', color: '#6b7280', borderBottom: '0.5px solid #e5e7eb', backgroundColor: '#f9fafb', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
  td:        { padding: '12px 14px', borderBottom: '0.5px solid #f3f4f6', color: '#111827', verticalAlign: 'middle' as const },
  badge:     (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, backgroundColor: bg, color } as React.CSSProperties),
  btnPrimary:{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: ENI.light, color: '#fff' } as React.CSSProperties,
  btnGhost:  { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '0.5px solid #d1d5db', backgroundColor: 'transparent', color: '#374151' } as React.CSSProperties,
  btnSm:     (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: bg, color } as React.CSSProperties),
  overlay:   { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal:     { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', width: '100%', maxWidth: '520px', padding: '1.5rem', margin: '1rem', maxHeight: '90vh', overflowY: 'auto' as const },
  formGroup: { marginBottom: '1rem' } as React.CSSProperties,
  label:     { display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '5px' } as React.CSSProperties,
  formInput: { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff', color: '#111827', outline: 'none', boxSizing: 'border-box' as const },
  formRow:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  footer:    { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.5rem', borderTop: '0.5px solid #e5e7eb', paddingTop: '1.25rem' },
  select:    { padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', outline: 'none' } as React.CSSProperties,
  success:   { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#d1fae5', color: '#065f46', fontSize: '13px' },
  errBox:    { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUT_CFG: Record<StatutReclamation, { label: string; bg: string; color: string; icon: string }> = {
  en_attente: { label: 'En attente', bg: '#fef9c3', color: '#854d0e', icon: '⏳' },
  en_cours:   { label: 'En cours',   bg: '#dbeafe', color: '#1e40af', icon: '🔄' },
  traitee:    { label: 'Traitée',    bg: '#d1fae5', color: '#065f46', icon: '✓'  },
  rejetee:    { label: 'Rejetée',    bg: '#fee2e2', color: '#991b1b', icon: '✕'  },
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

// ─── Modal création réclamation ───────────────────────────────────────────────

interface CreateModalProps {
  form: ReclamationForm
  error: string
  onChange: (f: ReclamationForm) => void
  onSave: () => void
  onClose: () => void
}

function CreateModal({ form, error, onChange, onSave, onClose }: CreateModalProps) {
  const set = (k: keyof ReclamationForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      onChange({ ...form, [k]: e.target.value })

  const handleMatiereChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = MATIERES_DISPONIBLES.find(m => m.code === e.target.value)
    onChange({ ...form, codeMatiere: e.target.value, matiere: found?.nom ?? '' })
  }

  return (
    <div style={S.overlay} onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div style={S.modal} role="dialog" aria-modal="true">
        <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '1.25rem' }}>
          Nouvelle réclamation
        </h2>

        {error && <div style={S.errBox}>{error}</div>}

        <div style={S.formRow}>
          <div style={S.formGroup}>
            <label style={S.label}>Matière *</label>
            <select style={S.formInput} value={form.codeMatiere} onChange={handleMatiereChange}>
              <option value="">— Choisir —</option>
              {MATIERES_DISPONIBLES.map(m => (
                <option key={m.code} value={m.code}>{m.code} — {m.nom}</option>
              ))}
            </select>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Semestre *</label>
            <select style={S.formInput} value={form.semestre} onChange={set('semestre')}>
              <option value="S1">Semestre 1</option>
              <option value="S2">Semestre 2</option>
            </select>
          </div>
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>Note contestée *</label>
          <input
            style={S.formInput}
            type="number" min="0" max="20" step="0.25"
            value={form.noteContestee}
            onChange={set('noteContestee')}
            placeholder="ex: 9"
          />
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>Motif *</label>
          <select style={S.formInput} value={form.motif} onChange={set('motif')}>
            <option value="">— Choisir un motif —</option>
            {MOTIFS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>Description détaillée *</label>
          <textarea
            style={{ ...S.formInput, minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
            value={form.description}
            onChange={set('description')}
            placeholder="Décrivez précisément votre réclamation…"
          />
        </div>

        <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fef9c3', color: '#854d0e', fontSize: '13px', marginBottom: '1rem' }}>
          ⚠️ Toute réclamation abusive pourra entraîner des sanctions. Soyez précis et factuel.
        </div>

        <div style={S.footer}>
          <button style={S.btnGhost} onClick={onClose}>Annuler</button>
          <button style={S.btnPrimary} onClick={onSave}>📩 Soumettre</button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal détail réclamation ─────────────────────────────────────────────────

function DetailModal({ rec, onClose }: { rec: Reclamation; onClose: () => void }) {
  const st = STATUT_CFG[rec.statut]
  return (
    <div style={S.overlay} onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div style={{ ...S.modal, maxWidth: '500px' }} role="dialog" aria-modal="true">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 500 }}>Réclamation #{rec.id}</h2>
          <span style={S.badge(st.bg, st.color)}>{st.icon} {st.label}</span>
        </div>

        {[
          { label: 'Matière',         value: `${rec.codeMatiere} — ${rec.matiere}` },
          { label: 'Semestre',        value: rec.semestre },
          { label: 'Note contestée',  value: `${rec.noteContestee}/20` },
          { label: 'Motif',           value: rec.motif },
          { label: 'Date de dépôt',   value: fmtDate(rec.dateCreation) },
          { label: 'Date traitement', value: rec.dateTraitement ? fmtDate(rec.dateTraitement) : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #f3f4f6', fontSize: '13px' }}>
            <span style={{ color: '#6b7280', minWidth: '130px' }}>{label}</span>
            <span style={{ color: '#111827', textAlign: 'right' }}>{value}</span>
          </div>
        ))}

        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Description</div>
          <div style={{ fontSize: '13px', color: '#374151', backgroundColor: '#f9fafb', padding: '10px 12px', borderRadius: '8px', lineHeight: 1.6 }}>
            {rec.description}
          </div>
        </div>

        {rec.reponse && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              Réponse de l'administration
            </div>
            <div style={{ fontSize: '13px', color: '#374151', backgroundColor: rec.statut === 'traitee' ? '#f0fdf4' : '#fef2f2', padding: '10px 12px', borderRadius: '8px', lineHeight: 1.6, border: `0.5px solid ${rec.statut === 'traitee' ? '#bbf7d0' : '#fecaca'}` }}>
              {rec.reponse}
            </div>
          </div>
        )}

        <div style={S.footer}>
          <button style={S.btnGhost} onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function MesReclamations() {
  const [reclamations, setReclamations] = useState<Reclamation[]>(MOCK)
  const [showCreate, setShowCreate]     = useState(false)
  const [viewRec, setViewRec]           = useState<Reclamation | null>(null)
  const [form, setForm]                 = useState<ReclamationForm>(FORM_INIT)
  const [formError, setFormError]       = useState('')
  const [flash, setFlash]               = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 4000) }

  const filtered = useMemo(() =>
    reclamations.filter(r => !filterStatut || r.statut === filterStatut),
    [reclamations, filterStatut]
  )

  const handleSave = () => {
    if (!form.codeMatiere || !form.motif || !form.description.trim() || !form.noteContestee) {
      setFormError('Veuillez remplir tous les champs obligatoires.'); return
    }
    const note = parseFloat(form.noteContestee)
    if (isNaN(note) || note < 0 || note > 20) {
      setFormError('La note contestée doit être entre 0 et 20.'); return
    }

    const id  = Math.max(...reclamations.map(r => r.id)) + 1
    const now = new Date().toISOString().split('T')[0]
    setReclamations(prev => [{
      id,
      matiere:       form.matiere,
      codeMatiere:   form.codeMatiere,
      semestre:      form.semestre,
      annee:         '2024-2025',
      noteContestee: note,
      motif:         form.motif,
      description:   form.description,
      dateCreation:  now,
      statut:        'en_attente',
    }, ...prev])
    setForm(FORM_INIT)
    setFormError('')
    setShowCreate(false)
    showFlash('Réclamation soumise avec succès. Vous serez notifié du traitement.')
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Étudiant › Mes réclamations</div>
          <h1 style={{ fontSize: '22px', fontWeight: 500 }}>Mes réclamations</h1>
        </div>
        <button style={S.btnPrimary} onClick={() => { setForm(FORM_INIT); setFormError(''); setShowCreate(true) }}>
          + Nouvelle réclamation
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
        {(Object.keys(STATUT_CFG) as StatutReclamation[]).map(k => {
          const { label, bg, color, icon } = STATUT_CFG[k]
          const count = reclamations.filter(r => r.statut === k).length
          return (
            <div key={k} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '0.5px solid #e5e7eb', padding: '1rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => setFilterStatut(filterStatut === k ? '' : k)}>
              <div style={{ fontSize: '22px', fontWeight: 700, color }}>{count}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{icon} {label}</div>
            </div>
          )
        })}
      </div>

      {flash && <div style={S.success}>✓ {flash}</div>}

      {/* Filtre */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select style={S.select} value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          {(Object.keys(STATUT_CFG) as StatutReclamation[]).map(k => (
            <option key={k} value={k}>{STATUT_CFG[k].label}</option>
          ))}
        </select>
        <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: 'auto' }}>
          {filtered.length} réclamation{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tableau */}
      <div style={S.cardNp}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
            <p>Aucune réclamation trouvée.</p>
            <button style={{ ...S.btnPrimary, marginTop: '1rem' }} onClick={() => setShowCreate(true)}>
              Créer une réclamation
            </button>
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                {['Matière', 'Semestre', 'Note', 'Motif', 'Date dépôt', 'Statut', 'Action'].map(h => (
                  <th key={h} style={{ ...S.th, ...(h === 'Action' ? { textAlign: 'right' as const } : {}) }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const st = STATUT_CFG[r.statut]
                return (
                  <tr key={r.id}>
                    <td style={S.td}>
                      <div style={{ fontWeight: 500 }}>{r.matiere}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>{r.codeMatiere}</div>
                    </td>
                    <td style={S.td}>
                      <span style={S.badge(r.semestre === 'S1' ? '#d1fae5' : '#dbeafe', r.semestre === 'S1' ? '#065f46' : '#1e40af')}>
                        {r.semestre}
                      </span>
                    </td>
                    <td style={S.td}>
                      <span style={{ fontWeight: 700, color: r.noteContestee >= 10 ? ENI.light : '#dc2626' }}>
                        {r.noteContestee}/20
                      </span>
                    </td>
                    <td style={{ ...S.td, color: '#6b7280', fontSize: '12px', maxWidth: '160px' }}>
                      {r.motif}
                    </td>
                    <td style={{ ...S.td, color: '#6b7280', fontSize: '12px' }}>
                      {fmtDate(r.dateCreation)}
                    </td>
                    <td style={S.td}>
                      <span style={S.badge(st.bg, st.color)}>{st.icon} {st.label}</span>
                    </td>
                    <td style={{ ...S.td, textAlign: 'right' }}>
                      <button style={S.btnSm('#f3f4f6', '#374151')} onClick={() => setViewRec(r)}>
                        👁 Voir
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateModal
          form={form}
          error={formError}
          onChange={setForm}
          onSave={handleSave}
          onClose={() => setShowCreate(false)}
        />
      )}

      {viewRec && (
        <DetailModal rec={viewRec} onClose={() => setViewRec(null)} />
      )}
    </div>
  )
}