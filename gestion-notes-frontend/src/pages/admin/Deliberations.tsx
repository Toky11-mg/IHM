// src/pages/admin/Deliberations.tsx
import { useState, useMemo, useEffect, useCallback, type ChangeEvent, type CSSProperties } from 'react'
import { deliberationService, type Deliberation } from '../../api/services/deliberationService'
import { filiereService, type Filiere } from '../../api/services/filiereService'
import { niveauService, type Niveau } from '../../api/services/niveauService'
import { semestreService, type Semestre } from '../../api/services/semestreService'
import { anneeService, type Annee } from '../../api/services/anneeService'
import { card, btn, table, filters, feedback, modal } from '../../design-system/styles'
import { Flash, Spinner, EmptyState, PageHeader } from '../../design-system/components'
import { colors, radius, typography, spacing, shadows } from '../../design-system/tokens'

const C = colors

// ─── Types ────────────────────────────────────────────────────────────────────

interface LancerForm {
  filiereId: string
  niveauId: string
  semestreId: string
  anneeId: string
}

const FORM_INIT: LancerForm = { filiereId: '', niveauId: '', semestreId: '', anneeId: '' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const badgeStyle = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 10px',
  borderRadius: radius.full,
  fontSize: typography.size.xs,
  fontWeight: typography.weight.medium,
  backgroundColor: bg,
  color,
  whiteSpace: 'nowrap',
})

const STATUT = {
  publie:     { label: '✓ Publiée',  bg: C.sage[50],   color: C.sage[600]  },
  non_publie: { label: '○ En cours', bg: C.blue[50],   color: C.blue[700]  },
}

const DECISION = {
  Admis:    { bg: C.sage[50],  color: C.sage[600]  },
  default:  { bg: C.rose[50],  color: C.rose[700]  },
}

// ─── Modal lancer ─────────────────────────────────────────────────────────────

function LancerModal({ form, error, loading, filieres, niveaux, semestres, annees, onChange, onSave, onClose }: {
  form: LancerForm; error: string; loading: boolean
  filieres: Filiere[]; niveaux: Niveau[]; semestres: Semestre[]; annees: Annee[]
  onChange: (f: LancerForm) => void; onSave: () => void; onClose: () => void
}) {
  const set = (k: keyof LancerForm) =>
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      onChange({ ...form, [k]: e.target.value })

  return (
    <div style={modal.overlay} onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div style={modal.container} role="dialog" aria-modal="true">
        <h2 style={modal.title}>Lancer une délibération</h2>

        {error && <Flash message={error} type="error" />}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4] }}>
          <div style={{ marginBottom: spacing[4] }}>
            <label style={{ display: 'block', fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: C.stone[600], marginBottom: spacing[1] }}>
              Filière *
            </label>
            <select
              style={{ width: '100%', padding: `${spacing[2]} ${spacing[4]}`, borderRadius: radius.md, border: `1px solid ${C.stone[200]}`, fontSize: typography.size.md, backgroundColor: C.white, color: C.stone[800], outline: 'none', boxSizing: 'border-box' as const }}
              value={form.filiereId} onChange={set('filiereId')}
            >
              <option value="">— Choisir —</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.code} — {f.nom}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: spacing[4] }}>
            <label style={{ display: 'block', fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: C.stone[600], marginBottom: spacing[1] }}>
              Niveau *
            </label>
            <select
              style={{ width: '100%', padding: `${spacing[2]} ${spacing[4]}`, borderRadius: radius.md, border: `1px solid ${C.stone[200]}`, fontSize: typography.size.md, backgroundColor: C.white, color: C.stone[800], outline: 'none', boxSizing: 'border-box' as const }}
              value={form.niveauId} onChange={set('niveauId')}
            >
              <option value="">— Choisir —</option>
              {niveaux.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4] }}>
          <div style={{ marginBottom: spacing[4] }}>
            <label style={{ display: 'block', fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: C.stone[600], marginBottom: spacing[1] }}>
              Semestre *
            </label>
            <select
              style={{ width: '100%', padding: `${spacing[2]} ${spacing[4]}`, borderRadius: radius.md, border: `1px solid ${C.stone[200]}`, fontSize: typography.size.md, backgroundColor: C.white, color: C.stone[800], outline: 'none', boxSizing: 'border-box' as const }}
              value={form.semestreId} onChange={set('semestreId')}
            >
              <option value="">— Choisir —</option>
              {semestres.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: spacing[4] }}>
            <label style={{ display: 'block', fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: C.stone[600], marginBottom: spacing[1] }}>
              Année universitaire
            </label>
            <select
              style={{ width: '100%', padding: `${spacing[2]} ${spacing[4]}`, borderRadius: radius.md, border: `1px solid ${C.stone[200]}`, fontSize: typography.size.md, backgroundColor: C.white, color: C.stone[800], outline: 'none', boxSizing: 'border-box' as const }}
              value={form.anneeId} onChange={set('anneeId')}
            >
              <option value="">— Choisir —</option>
              {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}</option>)}
            </select>
          </div>
        </div>

        <Flash
          message="Vérifiez que toutes les notes sont saisies avant de lancer la délibération."
          type="warning"
        />

        <div style={modal.footer ?? { display: 'flex', justifyContent: 'flex-end', gap: spacing[2], marginTop: spacing[6], borderTop: `1px solid ${C.stone[100]}`, paddingTop: spacing[5] }}>
          <button style={btn.ghost} onClick={onClose} disabled={loading}>Annuler</button>
          <button
            style={{ ...btn.primary, opacity: loading ? 0.7 : 1 }}
            onClick={onSave}
            disabled={loading}
          >
            {loading
              ? <><i className="ti ti-loader-2" style={{ fontSize: '14px', animation: 'spin 1s linear infinite' }} aria-hidden="true" /> Calcul en cours…</>
              : <><i className="ti ti-player-play" aria-hidden="true" /> Lancer</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal détail ─────────────────────────────────────────────────────────────

function DetailModal({ delib, loading, onPublier, onClose }: {
  delib: Deliberation; loading: boolean
  onPublier: () => void; onClose: () => void
}) {
  const publie = delib.isPublie

  return (
    <div style={modal.overlay} onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div style={modal.containerLg} role="dialog" aria-modal="true">

        {/* Header modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[6] }}>
          <div>
            <h2 style={{ ...modal.title, marginBottom: spacing[2] }}>
              Délibération — {delib.semestre}
            </h2>
            <span style={badgeStyle(publie ? C.sage[50] : C.blue[50], publie ? C.sage[600] : C.blue[700])}>
              {publie ? '✓ Publiée' : '○ En cours'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.stone[400], padding: spacing[1], borderRadius: radius.md }}
            aria-label="Fermer"
          >
            <i className="ti ti-x" style={{ fontSize: '18px' }} aria-hidden="true" />
          </button>
        </div>

        {/* KPI résumé */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing[3], marginBottom: spacing[6] }}>
          {[
            { label: 'Moyenne générale', value: `${parseFloat(delib.moyenneGenerale).toFixed(2)}/20`, color: C.sage[600], bg: C.sage[50]  },
            { label: 'Décision',         value: delib.decision, color: delib.decision === 'Admis' ? C.sage[600] : C.rose[700], bg: delib.decision === 'Admis' ? C.sage[50] : C.rose[50] },
            { label: 'Mention',          value: delib.mentionGlobale, color: C.blue[700], bg: C.blue[50] },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ backgroundColor: bg, borderRadius: radius.md, padding: spacing[5], textAlign: 'center', border: `1px solid ${C.stone[100]}` }}>
              <div style={{ fontSize: typography.size['2xl'], fontWeight: typography.weight.medium, color, marginBottom: spacing[1] }}>{value}</div>
              <div style={{ fontSize: typography.size.xs, color: C.stone[400], fontWeight: typography.weight.medium }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filière / Niveau si disponible */}
        {(delib.filiere || delib.niveau) && (
          <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[5] }}>
            {delib.filiere && <span style={badgeStyle(C.violet[50], C.violet[700])}>{delib.filiere}</span>}
            {delib.niveau  && <span style={badgeStyle(C.stone[100], C.stone[600])}>{delib.niveau}</span>}
          </div>
        )}

        {/* Info lecture seule */}
        {publie && (
          <Flash message="Ces résultats sont publiés et en lecture seule." type="info" />
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing[2], marginTop: spacing[6], borderTop: `1px solid ${C.stone[100]}`, paddingTop: spacing[5] }}>
          <button style={btn.ghost} onClick={onClose}>Fermer</button>
          {!publie && (
            <button
              style={{ ...btn.primary, opacity: loading ? 0.7 : 1 }}
              onClick={onPublier}
              disabled={loading}
            >
              {loading
                ? <><i className="ti ti-loader-2" style={{ fontSize: '14px', animation: 'spin 1s linear infinite' }} aria-hidden="true" /> Publication…</>
                : <><i className="ti ti-send" aria-hidden="true" /> Publier les résultats</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Deliberations() {
  const [delibs, setDelibs]             = useState<Deliberation[]>([])
  const [filieres, setFilieres]         = useState<Filiere[]>([])
  const [niveaux, setNiveaux]           = useState<Niveau[]>([])
  const [semestres, setSemestres]       = useState<Semestre[]>([])
  const [annees, setAnnees]             = useState<Annee[]>([])
  const [filterStatut, setFilterStatut] = useState('')
  const [showLancer, setShowLancer]     = useState(false)
  const [viewDelib, setViewDelib]       = useState<Deliberation | null>(null)
  const [form, setForm]                 = useState<LancerForm>(FORM_INIT)
  const [pageLoading, setPageLoading]   = useState(true)
  const [saving, setSaving]             = useState(false)
  const [publishing, setPublishing]     = useState(false)
  const [flash, setFlash]               = useState('')
  const [pageError, setPageError]       = useState('')
  const [formError, setFormError]       = useState('')

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
      setPageError('Impossible de charger les délibérations. Vérifiez votre connexion.')
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
      showFlash('Délibération lancée et calculée avec succès.')
      await load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setFormError(e.response?.data?.message ?? 'Erreur lors du calcul de la délibération.')
    } finally {
      setSaving(false)
    }
  }

  const handlePublier = async () => {
    if (!viewDelib) return
    setPublishing(true)
    try {
      await deliberationService.publier(viewDelib.id)
      showFlash('Résultats publiés avec succès.')
      setViewDelib(null)
      await load()
    } catch {
      setPageError('Erreur lors de la publication des résultats.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div style={{ padding: spacing[8], minHeight: '100vh', backgroundColor: C.stone[50], fontFamily: typography.fontFamily }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <PageHeader
        crumbs={['Administration', 'Délibérations']}
        title="Délibérations"
        action={
          <button
            style={btn.primary}
            onClick={() => { setForm(FORM_INIT); setFormError(''); setShowLancer(true) }}
          >
            <i className="ti ti-player-play" aria-hidden="true" /> Lancer une délibération
          </button>
        }
      />

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing[4], marginBottom: spacing[7] }}>
        {[
          { label: 'Total',    value: delibs.length,                         icon: 'ti-clipboard-list', iconBg: C.stone[100],   iconColor: C.stone[600] },
          { label: 'Publiées', value: delibs.filter(d => d.isPublie).length,  icon: 'ti-circle-check',  iconBg: C.sage[50],    iconColor: C.sage[600]  },
          { label: 'En cours', value: delibs.filter(d => !d.isPublie).length, icon: 'ti-loader',        iconBg: C.blue[50],    iconColor: C.blue[700]  },
        ].map(({ label, value, icon, iconBg, iconColor }) => (
          <div key={label} style={{ ...card.base, padding: `${spacing[5]} ${spacing[6]}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
              <div style={{ width: '40px', height: '40px', borderRadius: radius.md, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`ti ${icon}`} style={{ fontSize: '18px', color: iconColor }} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize: typography.size['3xl'], fontWeight: typography.weight.medium, color: C.stone[800], lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: typography.size.xs, color: C.stone[400], marginTop: spacing[1], fontWeight: typography.weight.medium }}>{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Feedback */}
      {flash     && <Flash message={flash}     type="success" onDismiss={() => setFlash('')} />}
      {pageError && (
        <Flash
          message={`${pageError} `}
          type="error"
          onDismiss={() => setPageError('')}
        />
      )}
      {pageError && (
        <div style={{ marginBottom: spacing[4], marginTop: `-${spacing[4]}` }}>
          <button
            onClick={load}
            style={{ ...btn.ghost, fontSize: typography.size.sm }}
          >
            <i className="ti ti-refresh" aria-hidden="true" /> Réessayer
          </button>
        </div>
      )}

      {/* Filtres */}
      <div style={filters.bar}>
        <select
          style={filters.select}
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
        >
          <option value="">Toutes les délibérations</option>
          <option value="publie">Publiées</option>
          <option value="non_publie">Non publiées</option>
        </select>
        <span style={filters.count}>
          {filtered.length} délibération{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tableau */}
      <div style={card.overflow}>
        {pageLoading ? (
          <Spinner label="Chargement des délibérations…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="ti-clipboard-list"
            title="Aucune délibération trouvée"
            description="Lancez une délibération pour calculer les résultats d'un semestre."
            action={{ label: 'Lancer une délibération', onClick: () => { setForm(FORM_INIT); setShowLancer(true) } }}
          />
        ) : (
          <table style={table.root}>
            <thead>
              <tr>
                <th style={table.th}>Semestre</th>
                <th style={table.th}>Filière</th>
                <th style={table.th}>Niveau</th>
                <th style={table.th}>Moyenne</th>
                <th style={table.th}>Décision</th>
                <th style={table.th}>Mention</th>
                <th style={table.th}>Statut</th>
                <th style={{ ...table.th, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const publie    = d.isPublie
                const decCfg    = DECISION[d.decision as keyof typeof DECISION] ?? DECISION.default
                const statutCfg = publie ? STATUT.publie : STATUT.non_publie

                return (
                  <tr
                    key={d.id}
                    style={{ transition: 'background .1s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.stone[50])}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ ...table.td, fontWeight: typography.weight.medium }}>{d.semestre}</td>
                    <td style={table.td}>
                      {d.filiere
                        ? <span style={badgeStyle(C.violet[50], C.violet[700])}>{d.filiere}</span>
                        : <span style={{ color: C.stone[300] }}>—</span>}
                    </td>
                    <td style={table.tdMuted}>{d.niveau ?? '—'}</td>
                    <td style={table.td}>
                      <span style={{ fontWeight: typography.weight.medium, color: C.sage[600] }}>
                        {parseFloat(d.moyenneGenerale).toFixed(2)}
                      </span>
                      <span style={{ fontSize: typography.size.xs, color: C.stone[400] }}>/20</span>
                    </td>
                    <td style={table.td}>
                      <span style={badgeStyle(decCfg.bg, decCfg.color)}>{d.decision}</span>
                    </td>
                    <td style={table.tdMuted}>{d.mentionGlobale}</td>
                    <td style={table.td}>
                      <span style={badgeStyle(statutCfg.bg, statutCfg.color)}>{statutCfg.label}</span>
                    </td>
                    <td style={{ ...table.td, textAlign: 'right' }}>
                      <button
                        style={btn.sm(C.stone[100], C.stone[700])}
                        onClick={() => setViewDelib(d)}
                        aria-label={`Voir délibération ${d.semestre}`}
                      >
                        <i className="ti ti-eye" style={{ fontSize: '13px' }} aria-hidden="true" /> Voir
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
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