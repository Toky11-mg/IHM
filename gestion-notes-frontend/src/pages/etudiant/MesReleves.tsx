// src/pages/etudiant/MesReleves.tsx
import { useState, useEffect, useCallback } from 'react'
import { etudiantService, type Etudiant } from '../../api/services/etudiantService'
import { storage } from '../../services/storage'

interface Releve {
  id: number
  libelle: string
  annee: string
  semestre: string
  dateGeneration: string
  statut: 'disponible' | 'en_cours' | 'archivé'
  taille: string
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
  btnSm:     (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: bg, color } as React.CSSProperties),
  overlay:   { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal:     { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', width: '100%', maxWidth: '440px', padding: '1.5rem', margin: '1rem' },
  formInput: { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff', color: '#111827', outline: 'none', boxSizing: 'border-box' as const },
  success:   { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#d1fae5', color: '#065f46', fontSize: '13px' },
  errBox:    { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px' },
  spinner:   { textAlign: 'center' as const, padding: '3rem', color: '#9ca3af', fontSize: '13px' },
  select:    { padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', outline: 'none' } as React.CSSProperties,
}

const STATUT_CFG = {
  disponible: { label: 'Disponible', bg: '#d1fae5', color: '#065f46' },
  en_cours:   { label: 'En cours',   bg: '#dbeafe', color: '#1e40af' },
  archivé:    { label: 'Archivé',    bg: '#f3f4f6', color: '#6b7280' },
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

// ─── Page principale ──────────────────────────────────────────────────────────

export default function MesReleves() {
  const [profile, setProfile]         = useState<Etudiant | null>(null)
  const [releves, setReleves]         = useState<Releve[]>([])
  const [showDemande, setShowDemande] = useState(false)
  const [semestre, setSemestre]       = useState('S1')
  const [annee, setAnnee]             = useState('2024-2025')
  const [loading, setLoading]         = useState(true)
  const [flash, setFlash]             = useState('')
  const [error, setError]             = useState('')
  const [filterAnnee, setFilterAnnee] = useState('')

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 4000) }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await etudiantService.me()
      if (res.success) {
        setProfile(res.data)
        // TODO : quand l'endpoint /api/releves/me sera dispo, remplacer par :
        // const releves = await api.get('/api/releves/me').then(r => r.data)
        // setReleves(releves)
        // En attendant : mock basé sur le profil
        setReleves([
          { id: 1, libelle: `Relevé S1 2024-2025`, annee: '2024-2025', semestre: 'S1', dateGeneration: '2025-01-20', statut: 'disponible', taille: '124 Ko' },
          { id: 2, libelle: `Relevé Annuel 2023-2024`, annee: '2023-2024', semestre: 'Annuel', dateGeneration: '2024-07-15', statut: 'disponible', taille: '210 Ko' },
        ])
      }
    } catch {
      setError('Impossible de charger votre profil.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDemande = () => {
    // TODO : await api.post('/api/releves', { semestre, annee })
    const id  = Math.max(0, ...releves.map(r => r.id)) + 1
    const now = new Date().toISOString().split('T')[0]
    setReleves(prev => [
      { id, libelle: `Relevé ${semestre} ${annee} (en cours)`, annee, semestre, dateGeneration: now, statut: 'en_cours', taille: '—' },
      ...prev,
    ])
    setShowDemande(false)
    showFlash('Demande envoyée. Votre relevé sera disponible sous 24h.')
  }

const handleDownload = async () => {
  const token = storage.getToken();
  console.log(token);
  const response = await fetch(
    "http://localhost:8000/api/notes/me/pdf",
    {
      headers: {
        Authorization: `Bearer ${token}`, 
      },
    }
  );

  if (!response.ok) {
    alert("Erreur lors du téléchargement");
    return;
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "releve_notes.pdf";
  a.click();

  window.URL.revokeObjectURL(url);
};

  const annees   = [...new Set(releves.map(r => r.annee))].sort().reverse()
  const filtered = releves.filter(r => !filterAnnee || r.annee === filterAnnee)

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Étudiant › Mes relevés</div>
          <h1 style={{ fontSize: '22px', fontWeight: 500 }}>Mes relevés de notes</h1>
        </div>
        <button style={S.btnPrimary} onClick={() => setShowDemande(true)}>+ Demander un relevé</button>
      </div>

      {/* Carte identité */}
      {profile && (
        <div style={{ ...S.card, display: 'flex', gap: '16px', alignItems: 'center', borderLeft: `4px solid ${ENI.light}` }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: ENI.light, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
            {profile.prenom[0]}{profile.nom[0]}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px' }}>{profile.prenom} {profile.nom}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
              <span style={{ fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '1px 6px', borderRadius: '4px', marginRight: '8px' }}>{profile.matricule}</span>
              {profile.filiere.nom} · {profile.niveau.nom}
            </div>
          </div>
        </div>
      )}

      {flash && <div style={S.success}>✓ {flash}</div>}
      {error && <div style={S.errBox}>⚠ {error}</div>}

      {/* Filtre */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select style={S.select} value={filterAnnee} onChange={e => setFilterAnnee(e.target.value)}>
          <option value="">Toutes les années</option>
          {annees.map(a => <option key={a}>{a}</option>)}
        </select>
        <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: 'auto' }}>
          {filtered.length} relevé{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tableau */}
      <div style={S.cardNp}>
        {loading ? (
          <div style={S.spinner}>⏳ Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
            <p>Aucun relevé disponible.</p>
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                {['Relevé', 'Année', 'Période', 'Date', 'Taille', 'Statut', 'Action'].map(h => (
                  <th key={h} style={{ ...S.th, ...(h === 'Action' ? { textAlign: 'right' as const } : {}) }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const st = STATUT_CFG[r.statut]
                return (
                  <tr key={r.id}>
                    <td style={{ ...S.td, fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📄</span>{r.libelle}
                      </div>
                    </td>
                    <td style={{ ...S.td, color: '#6b7280' }}>{r.annee}</td>
                    <td style={S.td}>
                      <span style={S.badge(
                        r.semestre === 'S1' ? '#d1fae5' : r.semestre === 'S2' ? '#dbeafe' : '#ede9fe',
                        r.semestre === 'S1' ? '#065f46' : r.semestre === 'S2' ? '#1e40af' : '#4c1d95',
                      )}>{r.semestre}</span>
                    </td>
                    <td style={{ ...S.td, color: '#6b7280', fontSize: '12px' }}>{fmtDate(r.dateGeneration)}</td>
                    <td style={{ ...S.td, color: '#9ca3af', fontSize: '12px' }}>{r.taille}</td>
                    <td style={S.td}><span style={S.badge(st.bg, st.color)}>{st.label}</span></td>
                    <td style={{ ...S.td, textAlign: 'right' }}>
                      {r.statut !== 'en_cours' ? (
                        <button style={S.btnSm(ENI.light, '#fff')} onClick={() => handleDownload()}>
                          ⬇ Télécharger
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>En préparation…</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal demande */}
      {showDemande && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setShowDemande(false)}>
          <div style={S.modal} role="dialog" aria-modal="true">
            <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '1.25rem' }}>Demander un relevé de notes</h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '5px' }}>Année universitaire</label>
              <select style={S.formInput} value={annee} onChange={e => setAnnee(e.target.value)}>
                {['2024-2025', '2023-2024', '2022-2023'].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '5px' }}>Période</label>
              <select style={S.formInput} value={semestre} onChange={e => setSemestre(e.target.value)}>
                <option value="S1">Semestre 1</option>
                <option value="S2">Semestre 2</option>
                <option value="Annuel">Annuel</option>
              </select>
            </div>

            <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '0.5px solid #bbf7d0', fontSize: '13px', color: ENI.mid, marginBottom: '1.25rem' }}>
              ℹ️ Le relevé sera généré au format PDF et disponible sous 24h.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '0.5px solid #e5e7eb', paddingTop: '1.25rem' }}>
              <button style={S.btnGhost} onClick={() => setShowDemande(false)}>Annuler</button>
              <button style={S.btnPrimary} onClick={handleDemande}>📄 Demander</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}