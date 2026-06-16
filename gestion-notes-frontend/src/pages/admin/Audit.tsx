// src/pages/admin/Audit.tsx
import { useState, useMemo, useEffect, useCallback } from 'react'
import { auditService, type AuditLog } from '../../api/services/auditService'

// ─── Styles ───────────────────────────────────────────────────────────────────

const ENI = { dark: '#064e3b', mid: '#065f46', light: '#047857' }

const S = {
  page:    { padding: '1.5rem', minHeight: '100vh', backgroundColor: '#f9fafb' } as React.CSSProperties,
  card:    { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', overflow: 'hidden' } as React.CSSProperties,
  table:   { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
  th:      { padding: '10px 14px', textAlign: 'left' as const, fontWeight: 500, fontSize: '11px', color: '#6b7280', borderBottom: '0.5px solid #e5e7eb', backgroundColor: '#f9fafb', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
  td:      { padding: '11px 14px', borderBottom: '0.5px solid #f3f4f6', color: '#111827', verticalAlign: 'middle' as const },
  filters: { display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' as const, alignItems: 'center' },
  select:  { padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', outline: 'none' } as React.CSSProperties,
  input:   { padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', color: '#111827', outline: 'none', flex: 1, minWidth: '200px' } as React.CSSProperties,
  badge:   (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, backgroundColor: bg, color } as React.CSSProperties),
  btnSm:   (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', backgroundColor: bg, color } as React.CSSProperties),
  overlay: { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal:   { backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', width: '100%', maxWidth: '520px', padding: '1.5rem', margin: '1rem' },
  errBox:  { marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px' },
  spinner: { textAlign: 'center' as const, padding: '3rem', color: '#9ca3af', fontSize: '13px' },
  row:     { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #f3f4f6', fontSize: '13px' } as React.CSSProperties,
}

const ACTION_CFG: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  CONNEXION:    { label: 'Connexion',    bg: '#d1fae5', color: '#065f46', icon: '🔓' },
  DECONNEXION:  { label: 'Déconnexion', bg: '#f3f4f6', color: '#6b7280', icon: '🔒' },
  CREATION:     { label: 'Création',    bg: '#dbeafe', color: '#1e40af', icon: '➕' },
  MODIFICATION: { label: 'Modification',bg: '#fef9c3', color: '#854d0e', icon: '✎'  },
  SUPPRESSION:  { label: 'Suppression', bg: '#fee2e2', color: '#991b1b', icon: '✕'  },
  VALIDATION:   { label: 'Validation',  bg: '#d1fae5', color: '#065f46', icon: '✓'  },
  EXPORT:       { label: 'Export',      bg: '#e0f2fe', color: '#0369a1', icon: '📤' },
}

const ROLE_CFG: Record<string, { bg: string; color: string }> = {
  Admin:       { bg: '#fee2e2', color: '#991b1b' },
  Enseignant:  { bg: '#dbeafe', color: '#1e40af' },
  Étudiant:    { bg: '#d1fae5', color: '#065f46' },
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const fmtDateTime = (d: string) => `${fmtDate(d)} ${fmtTime(d)}`

const PAGE_SIZE = 10

// ─── Modal détail ─────────────────────────────────────────────────────────────

function LogModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  const action = ACTION_CFG[log.action] ?? { label: log.action, bg: '#f3f4f6', color: '#374151', icon: '•' }
  const role   = ROLE_CFG[log.role]    ?? { bg: '#f3f4f6', color: '#374151' }

  return (
    <div style={S.overlay} onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div style={S.modal} role="dialog" aria-modal="true">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 500 }}>Log #{log.id}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af' }}>✕</button>
        </div>

        {[
          { label: 'Utilisateur', value: log.utilisateur },
          { label: 'Rôle',        value: <span style={S.badge(role.bg, role.color)}>{log.role}</span> },
          { label: 'Action',      value: <span style={S.badge(action.bg, action.color)}>{action.icon} {action.label}</span> },
          { label: 'Ressource',   value: log.ressource },
          { label: 'Détail',      value: log.detail },
          { label: 'IP',          value: <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{log.ip}</span> },
          { label: 'Date',        value: fmtDateTime(log.date) },
        ].map(({ label, value }) => (
          <div key={label} style={S.row}>
            <span style={{ color: '#6b7280', minWidth: '100px' }}>{label}</span>
            <span style={{ textAlign: 'right' as const }}>{value}</span>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: '8px', border: '0.5px solid #d1d5db', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Audit() {
  const [logs, setLogs]               = useState<AuditLog[]>([])
  const [search, setSearch]           = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterRole, setFilterRole]   = useState('')
  const [filterDate, setFilterDate]   = useState('')
  const [page, setPage]               = useState(1)
  const [viewLog, setViewLog]         = useState<AuditLog | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError]     = useState('')

  const load = useCallback(async () => {
    setPageLoading(true); setPageError('')
    try {
      const params: Record<string, string> = {}
      if (filterAction) params.action   = filterAction
      if (filterRole)   params.role     = filterRole
      if (filterDate)   params.date     = filterDate
      setLogs(await auditService.list(params))
    } catch {
      setPageError('Erreur de chargement des logs.')
    } finally {
      setPageLoading(false)
    }
  }, [filterAction, filterRole, filterDate])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return [...logs]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter(l =>
        !q || l.utilisateur.toLowerCase().includes(q) ||
               l.detail.toLowerCase().includes(q) ||
               l.ressource.toLowerCase().includes(q)
      )
  }, [logs, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetPage = () => setPage(1)

  const actions = [...new Set(logs.map(l => l.action))]
  const roles   = [...new Set(logs.map(l => l.role))]

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Administration › Audit</div>
          <h1 style={{ fontSize: '22px', fontWeight: 500 }}>Journal d'audit</h1>
        </div>
        <button style={S.btnSm('#fee2e2', '#991b1b')} onClick={() => alert('Export PDF — à connecter à l\'API.')}>
          📄 Export PDF
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total logs',    value: logs.length,                                              color: '#111827' },
          { label: 'Créations',     value: logs.filter(l => l.action === 'CREATION').length,        color: '#1e40af' },
          { label: 'Modifications', value: logs.filter(l => l.action === 'MODIFICATION').length,    color: '#854d0e' },
          { label: 'Suppressions',  value: logs.filter(l => l.action === 'SUPPRESSION').length,     color: '#991b1b' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '0.5px solid #e5e7eb', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      {pageError && <div style={S.errBox}>⚠ {pageError} <button onClick={load} style={{ marginLeft: '8px', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontSize: '13px' }}>Réessayer</button></div>}

      {/* Filtres */}
      <div style={S.filters}>
        <input
          style={S.input}
          placeholder="Rechercher utilisateur, ressource, détail…"
          value={search}
          onChange={e => { setSearch(e.target.value); resetPage() }}
        />
        <select style={S.select} value={filterAction} onChange={e => { setFilterAction(e.target.value); resetPage() }}>
          <option value="">Toutes les actions</option>
          {actions.map(a => {
            const cfg = ACTION_CFG[a]
            return <option key={a} value={a}>{cfg ? `${cfg.icon} ${cfg.label}` : a}</option>
          })}
        </select>
        <select style={S.select} value={filterRole} onChange={e => { setFilterRole(e.target.value); resetPage() }}>
          <option value="">Tous les rôles</option>
          {roles.map(r => <option key={r}>{r}</option>)}
        </select>
        <input
          style={{ ...S.select, minWidth: '140px' }}
          type="date"
          value={filterDate}
          onChange={e => { setFilterDate(e.target.value); resetPage() }}
        />
        <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: 'auto' }}>
          {filtered.length} entrée{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tableau */}
      <div style={S.card}>
        {pageLoading ? (
          <div style={S.spinner}>⏳ Chargement…</div>
        ) : paginated.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
            <p>Aucun log trouvé.</p>
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                {['Date / Heure', 'Utilisateur', 'Rôle', 'Action', 'Ressource', 'Détail', 'IP', ''].map(h => (
                  <th key={h} style={{ ...S.th, ...(h === '' ? { width: '60px' } : {}) }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(log => {
                const action = ACTION_CFG[log.action] ?? { label: log.action, bg: '#f3f4f6', color: '#374151', icon: '•' }
                const role   = ROLE_CFG[log.role]    ?? { bg: '#f3f4f6', color: '#374151' }
                return (
                  <tr key={log.id}>
                    <td style={S.td}>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>{fmtDate(log.date)}</div>
                      <div style={{ color: '#9ca3af', fontSize: '11px' }}>{fmtTime(log.date)}</div>
                    </td>
                    <td style={{ ...S.td, fontSize: '12px' }}>{log.utilisateur}</td>
                    <td style={S.td}><span style={S.badge(role.bg, role.color)}>{log.role}</span></td>
                    <td style={S.td}>
                      <span style={S.badge(action.bg, action.color)}>
                        {action.icon} {action.label}
                      </span>
                    </td>
                    <td style={{ ...S.td, color: '#6b7280' }}>{log.ressource}</td>
                    <td style={{ ...S.td, maxWidth: '200px', fontSize: '12px' }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.detail}>
                        {log.detail}
                      </span>
                    </td>
                    <td style={{ ...S.td, fontFamily: 'monospace', fontSize: '11px', color: '#9ca3af' }}>{log.ip}</td>
                    <td style={S.td}>
                      <button style={S.btnSm('#f3f4f6', '#374151')} onClick={() => setViewLog(log)}>👁</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '0.5px solid #f3f4f6' }}>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Page {page} / {totalPages}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                style={S.btnSm(page === 1 ? '#f3f4f6' : '#fff', page === 1 ? '#d1d5db' : '#374151')}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Préc.
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | '...')[]>((acc, n, i, arr) => {
                  if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(n); return acc
                }, [])
                .map((n, i) =>
                  n === '...' ? (
                    <span key={`e-${i}`} style={{ padding: '6px 4px', fontSize: '12px', color: '#9ca3af' }}>…</span>
                  ) : (
                    <button
                      key={n}
                      style={{ ...S.btnSm(page === n ? ENI.light : '#fff', page === n ? '#fff' : '#374151'), border: `0.5px solid ${page === n ? ENI.light : '#e5e7eb'}`, minWidth: '32px' }}
                      onClick={() => setPage(n as number)}
                    >
                      {n}
                    </button>
                  )
                )}
              <button
                style={S.btnSm(page === totalPages ? '#f3f4f6' : '#fff', page === totalPages ? '#d1d5db' : '#374151')}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Suiv. →
              </button>
            </div>
          </div>
        )}
      </div>

      {viewLog && <LogModal log={viewLog} onClose={() => setViewLog(null)} />}
    </div>
  )
}