// src/pages/admin/Deliberations.tsx
import { useState, useMemo, useEffect, useCallback } from 'react'
import { deliberationService, type Deliberation } from '../../api/services/deliberationService'
import { filiereService, type Filiere } from '../../api/services/filiereService'
import { niveauService, type Niveau } from '../../api/services/niveauService'
import { semestreService, type Semestre } from '../../api/services/semestreService'
import { anneeService, type Annee } from '../../api/services/anneeService'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LancerForm {
  filiereId: string
  niveauId: string
  semestreId: string
  anneeId: string
}

const FORM_INIT: LancerForm = { filiereId: '', niveauId: '', semestreId: '', anneeId: '' }

// ─── Styles ───────────────────────────────────────────────────────────────────

const ENI = { dark: '#064e3b', mid: '#065f46', light: '#047857' }

const S = {
  page:      { padding: '1.5rem', minHeight: '100vh', backgroundColor: '#f9fafb' } as React.CSSProperties,
  card:      { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', overflow: 'hidden' } as React.CSSProperties,
  table:     { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
  th:        { padding: '10px 14px', textAlign: 'left' as const, fontWeight: 500, fontSize: '11px', color: '#6b7280', borderBottom: '0.5px solid #e5e7eb', backgroundColor: '#f9fafb', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
  td:        { padding: '11px 14px', borderBottom: '0.5px solid #f3f4f6', color: '#111827', verticalAlign: 'middle' as const },
  overlay:   { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal:     { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', width: '100%', maxWidth: '480px', padding: '1.5rem', margin: '1rem' },
  modalLg:   { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', width: '100%', maxWidth: '700px', padding: '1.5rem', margin: '1rem', maxHeight: '90vh', overflowY: 'auto' as const },
  formGroup: { marginBottom: '1rem' },
  label:     { display: 'block', fontSize: '13px', color: '#374151', marginBottom: '5px', fontWeight: 500 } as React.CSSProperties,
  formInput: { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff', color: '#111827', outline: 'none', boxSizing: 'border-box' as const },
  formRow:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  footer:    { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.5rem', borderTop: '0.5px solid #e5e7eb', paddingTop: '1.25rem' },
  btnPrimary:{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: ENI.light, color: '#fff' } as React.CSSProperties,
  btnGhost:  { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '0.5px solid #d1d5db', backgroundColor: 'transparent', color: '#374151' } as React.CSSProperties,
  btnSm:     (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: bg, color } as React.CSSProperties),
  badge:     (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, backgroundColor: bg, color } as React.CSSProperties),
  filters:   { display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' as const, alignItems: 'center' },
  select:    { padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', outline: 'none' } as React.CSSProperties,
  success:   { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#d1fae5', color: '#065f46', fontSize: '13px' },
  errBox:    { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px' },
  warn:      { padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fef9c3', color: '#854d0e', fontSize: '13px', marginBottom: '1rem' },
  spinner:   { textAlign: 'center' as const, padding: '3rem', color: '#9ca3af', fontSize: '13px' },
}

const STATUT_CFG: Record<string, { label: string; bg: string; color: string }> = {
  en_attente: { label: 'En attente', bg: '#fef9c3', color: '#854d0e' },
  en_cours:   { label: 'En cours',   bg: '#dbeafe', color: '#1e40af' },
  validee:    { label: 'Validée',    bg: '#d1fae5', color: '#065f46' },
  cloturee:   { label: 'Clôturée',  bg: '#f3f4f6', color: '#6b7280' },
}

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

// ─── Modal lancer délibération ────────────────────────────────────────────────

function LancerModal({ form, error, loading, filieres, niveaux, semestres, annees, onChange, onSave, onClose }: {
  form: LancerForm; error: string; loading: boolean
  filieres: Filiere[]; niveaux: Niveau[]; semestres: Semestre[]; annees: Annee[]
  onChange: (f: LancerForm) => void; onSave: () => void; onClose: () => void
}) {
  const set = (k: keyof LancerForm) =>
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      onChange({ ...form, [k]: e.target.value })

  return (
    <div style={S.overlay} onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div style={S.modal} role="dialog" aria-modal="true">
        <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '1.25rem' }}>
          Lancer une délibération
        </h2>
        {error && <div style={S.errBox}>{error}</div>}

        <div style={S.formRow}>
          <div style={S.formGroup}>
            <label style={S.label}>Filière *</label>
            <select style={S.formInput} value={form.filiereId} onChange={set('filiereId')}>
              <option value="">— Choisir —</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.code} — {f.nom}</option>)}
            </select>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Niveau *</label>
            <select style={S.formInput} value={form.niveauId} onChange={set('niveauId')}>
              <option value="">— Choisir —</option>
              {niveaux.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
            </select>
          </div>
        </div>

        <div style={S.formRow}>
          <div style={S.formGroup}>
            <label style={S.label}>Semestre *</label>
            <select style={S.formInput} value={form.semestreId} onChange={set('semestreId')}>
              <option value="">— Choisir —</option>
              {semestres.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Année universitaire *</label>
            <select style={S.formInput} value={form.anneeId} onChange={set('anneeId')}>
              <option value="">— Choisir —</option>
              {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}</option>)}
            </select>
          </div>
        </div>

        <div style={S.warn}>
          ⚠️ Vérifiez que toutes les notes sont saisies avant de lancer la délibération.
        </div>

        <div style={S.footer}>
          <button style={S.btnGhost} onClick={onClose} disabled={loading}>Annuler</button>
          <button style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }} onClick={onSave} disabled={loading}>
            {loading ? '⏳ Calcul en cours…' : '▶ Lancer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal détail délibération ────────────────────────────────────────────────

function DetailModal({ delib, loading, onPublier, onClose }: {
  delib: Deliberation; loading: boolean
  onPublier: () => void; onClose: () => void
}) {
  const st = STATUT_CFG[delib.isPublie ? 'validee' : 'en_cours'] ?? STATUT_CFG['en_cours']

  return (
    <div style={S.overlay} onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div style={S.modalLg} role="dialog" aria-modal="true">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 500 }}>
              Délibération — {delib.semestre}
            </h2>
            <div style={{ marginTop: '6px' }}>
              <span style={S.badge(st.bg, st.color)}>{st.label}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af' }}>✕</button>
        </div>

        {/* Résumé */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '1.25rem' }}>
          {[
            { label: 'Moyenne générale', value: `${parseFloat(delib.moyenneGenerale).toFixed(2)}/20`, color: ENI.light },
            { label: 'Décision',         value: delib.decision,                                        color: delib.decision === 'Admis' ? ENI.light : '#dc2626' },
            { label: 'Mention',          value: delib.mentionGlobale,                                  color: '#1e40af' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={S.footer}>
          {!delib.isPublie && (
            <button
              style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }}
              onClick={onPublier}
              disabled={loading}
            >
              {loading ? '⏳…' : '✓ Publier les résultats'}
            </button>
          )}
          {delib.isPublie && (
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>🔒 Résultats publiés — lecture seule</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Deliberations() {
  const [delibs, setDelibs]           = useState<Deliberation[]>([])
  const [filieres, setFilieres]       = useState<Filiere[]>([])
  const [niveaux, setNiveaux]         = useState<Niveau[]>([])
  const [semestres, setSemestres]     = useState<Semestre[]>([])
  const [annees, setAnnees]           = useState<Annee[]>([])

  const [filterStatut, setFilterStatut] = useState('')
  const [showLancer, setShowLancer]   = useState(false)
  const [viewDelib, setViewDelib]     = useState<Deliberation | null>(null)
  const [form, setForm]               = useState<LancerForm>(FORM_INIT)

  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving]           = useState(false)
  const [publishing, setPublishing]   = useState(false)
  const [flash, setFlash]             = useState('')
  const [pageError, setPageError]     = useState('')
  const [formError, setFormError]     = useState('')

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3000) }

  const load = useCallback(async () => {
    setPageLoading(true); setPageError('')
    try {
      const [d, f, n, s, a] = await Promise.all([
        deliberationService.list(),
        filiereService.list(),
        niveauService.list(),
        semestreService.list(),
        anneeService.list(),
      ])
      setDelibs(d); setFilieres(f); setNiveaux(n); setSemestres(s); setAnnees(a)
    } catch {
      setPageError('Erreur de chargement.')
    } finally {
      setPageLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() =>
    delibs.filter(d => !filterStatut || (filterStatut === 'publie' ? d.isPublie : !d.isPublie)),
    [delibs, filterStatut]
  )

  const handleLancer = async () => {
    if (!form.filiereId || !form.niveauId || !form.semestreId) {
      setFormError('Filière, niveau et semestre sont obligatoires.'); return
    }
    setSaving(true); setFormError('')
    try {
      await deliberationService.calculerSemestre({
        filiereId:  Number(form.filiereId),
        niveauId:   Number(form.niveauId),
        semestreId: Number(form.semestreId),
        anneeId:    form.anneeId ? Number(form.anneeId) : undefined,
      })
      setShowLancer(false)
      showFlash('Délibération lancée et calculée.')
      await load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setFormError(e.response?.data?.message ?? 'Erreur lors du calcul.')
    } finally {
      setSaving(false)
    }
  }

  const handlePublier = async () => {
    if (!viewDelib) return
    setPublishing(true)
    try {
      await deliberationService.publier(viewDelib.id)
      showFlash('Résultats publiés.')
      setViewDelib(null)
      await load()
    } catch {
      setPageError('Erreur lors de la publication.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Administration › Délibérations</div>
          <h1 style={{ fontSize: '22px', fontWeight: 500 }}>Délibérations</h1>
        </div>
        <button style={S.btnPrimary} onClick={() => { setForm(FORM_INIT); setFormError(''); setShowLancer(true) }}>
          ▶ Lancer une délibération
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total',     value: delibs.length,                          color: '#111827' },
          { label: 'Publiées',  value: delibs.filter(d => d.isPublie).length,  color: ENI.light },
          { label: 'En cours',  value: delibs.filter(d => !d.isPublie).length, color: '#1e40af' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '0.5px solid #e5e7eb', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      {flash    && <div style={S.success}>✓ {flash}</div>}
      {pageError && <div style={S.errBox}>⚠ {pageError} <button onClick={load} style={{ marginLeft: '8px', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontSize: '13px' }}>Réessayer</button></div>}

      {/* Filtres */}
      <div style={S.filters}>
        <select style={S.select} value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          <option value="">Toutes</option>
          <option value="publie">Publiées</option>
          <option value="non_publie">Non publiées</option>
        </select>
        <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: 'auto' }}>
          {filtered.length} délibération{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tableau */}
      <div style={S.card}>
        {pageLoading ? (
          <div style={S.spinner}>⏳ Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
            <p>Aucune délibération trouvée.</p>
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                {['Semestre', 'Filière', 'Niveau', 'Moyenne', 'Décision', 'Mention', 'Statut', 'Action'].map(h => (
                  <th key={h} style={{ ...S.th, ...(h === 'Action' ? { textAlign: 'right' as const } : {}) }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const publie = d.isPublie
                return (
                  <tr key={d.id}>
                    <td style={{ ...S.td, fontWeight: 500 }}>{d.semestre}</td>
                    <td style={S.td}>
                      {d.filiere
                        ? <span style={S.badge('#ede9fe', '#4c1d95')}>{d.filiere}</span>
                        : <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td style={{ ...S.td, color: '#6b7280' }}>{d.niveau ?? '—'}</td>
                    <td style={S.td}>
                      <span style={{ fontWeight: 700, color: ENI.light }}>
                        {parseFloat(d.moyenneGenerale).toFixed(2)}/20
                      </span>
                    </td>
                    <td style={S.td}>
                      <span style={S.badge(
                        d.decision === 'Admis' ? '#d1fae5' : '#fee2e2',
                        d.decision === 'Admis' ? '#065f46' : '#991b1b',
                      )}>{d.decision}</span>
                    </td>
                    <td style={{ ...S.td, color: '#6b7280', fontSize: '12px' }}>{d.mentionGlobale}</td>
                    <td style={S.td}>
                      <span style={S.badge(publie ? '#d1fae5' : '#dbeafe', publie ? '#065f46' : '#1e40af')}>
                        {publie ? '✓ Publiée' : '○ En cours'}
                      </span>
                    </td>
                    <td style={{ ...S.td, textAlign: 'right' }}>
                      <button style={S.btnSm('#f3f4f6', '#374151')} onClick={() => setViewDelib(d)}>
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

      {showLancer && (
        <LancerModal
          form={form} error={formError} loading={saving}
          filieres={filieres} niveaux={niveaux} semestres={semestres} annees={annees}
          onChange={setForm} onSave={handleLancer} onClose={() => setShowLancer(false)}
        />
      )}

      {viewDelib && (
        <DetailModal
          delib={viewDelib} loading={publishing}
          onPublier={handlePublier} onClose={() => setViewDelib(null)}
        />
      )}
    </div>
  )
}