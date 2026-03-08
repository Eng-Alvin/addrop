import { useState, useEffect } from 'react'
import Head from 'next/head'

const STATUS_CONFIG = {
  new: { label: 'New', color: '#FF4D1C', bg: 'rgba(255,77,28,0.08)', border: 'rgba(255,77,28,0.2)' },
  in_progress: { label: 'In Progress', color: '#FFB800', bg: 'rgba(255,184,0,0.08)', border: 'rgba(255,184,0,0.2)' },
  delivered: { label: 'Delivered', color: '#22C55E', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
  on_hold: { label: 'On Hold', color: '#9A9589', bg: 'rgba(154,149,137,0.08)', border: 'rgba(154,149,137,0.2)' },
}

const PLAN_COLORS = {
  normal: '#9A9589',
  pro: '#FF4D1C',
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [token, setToken] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/submissions', {
        headers: { 'x-admin-token': pw },
      })
      if (res.ok) {
        const data = await res.json()
        setToken(pw)
        setSubmissions(data)
        setAuthed(true)
      } else {
        setPwError('Incorrect password. Try again.')
      }
    } catch {
      setPwError('Connection error. Try again.')
    }
    setLoading(false)
  }

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/submissions', {
        headers: { 'x-admin-token': token },
      })
      if (res.ok) setSubmissions(await res.json())
    } catch { }
    setLoading(false)
  }

  const updateStatus = async (id, status) => {
    await fetch('/api/submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ id, status }),
    })
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
  }

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter)

  const stats = {
    total: submissions.length,
    new: submissions.filter(s => s.status === 'new').length,
    inProgress: submissions.filter(s => s.status === 'in_progress').length,
    delivered: submissions.filter(s => s.status === 'delivered').length,
    mrr: submissions.reduce((acc, s) => {
      const p = { normal: 1100, pro: 2300 }
      return acc + (p[s.plan] || 0)
    }, 0),
  }

  if (!authed) {
    return (
      <>
        <Head><title>AdDrop™ Admin</title></Head>
        <div style={s.loginRoot}>
          <div style={s.loginBox}>
            <div style={s.loginLogo}>Ad<span style={{ color: '#FF4D1C' }}>Drop</span>™</div>
            <div style={s.loginTitle}>Admin Access</div>
            <p style={s.loginSub}>Enter your admin password to continue.</p>
            <form onSubmit={handleLogin} style={s.loginForm}>
              <input
                type="password"
                placeholder="••••••••••••"
                value={pw}
                onChange={e => { setPw(e.target.value); setPwError('') }}
                style={s.loginInput}
                autoFocus
              />
              {pwError && <div style={s.loginError}>{pwError}</div>}
              <button type="submit" style={s.loginBtn} disabled={loading}>
                {loading ? 'Checking...' : 'Enter Dashboard →'}
              </button>
            </form>
            <div style={s.loginHint}>
              Password set via <code style={{ color: '#FF4D1C' }}>ADMIN_PASSWORD</code> env variable
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head><title>AdDrop™ — Dashboard</title></Head>
      <div style={s.root}>

        {/* SIDEBAR */}
        <aside style={s.sidebar}>
          <div style={s.sidebarLogo}>Ad<span style={{ color: '#FF4D1C' }}>Drop</span>™</div>
          <div style={s.sidebarLabel}>Dashboard</div>

          <nav style={s.sidebarNav}>
            {[
              { id: 'all', label: 'All Clients', count: stats.total },
              { id: 'new', label: 'New', count: stats.new },
              { id: 'in_progress', label: 'In Progress', count: stats.inProgress },
              { id: 'delivered', label: 'Delivered', count: stats.delivered },
              { id: 'on_hold', label: 'On Hold', count: submissions.filter(x => x.status === 'on_hold').length },
            ].map(item => (
              <button
                key={item.id}
                style={{ ...s.navItem, ...(filter === item.id ? s.navItemActive : {}) }}
                onClick={() => { setFilter(item.id); setSelected(null) }}
              >
                <span>{item.label}</span>
                <span style={s.navCount}>{item.count}</span>
              </button>
            ))}
          </nav>

          <div style={s.sidebarDivider} />

          {/* MRR */}
          <div style={s.mrrBox}>
            <div style={s.mrrLabel}>Monthly Recurring</div>
            <div style={s.mrrAmount}>${stats.mrr.toLocaleString()}</div>
            <div style={s.mrrSub}>{stats.total} active clients</div>
          </div>

          <button style={s.refreshBtn} onClick={refresh} disabled={loading}>
            {loading ? '...' : '↺ Refresh'}
          </button>
        </aside>

        {/* MAIN */}
        <main style={s.main}>

          {/* HEADER */}
          <div style={s.header}>
            <div>
              <h1 style={s.headerTitle}>
                {filter === 'all' ? 'All Clients' : STATUS_CONFIG[filter]?.label || filter}
              </h1>
              <div style={s.headerSub}>{filtered.length} submission{filtered.length !== 1 ? 's' : ''}</div>
            </div>
            {stats.new > 0 && (
              <div style={s.newBadge}>🔴 {stats.new} new</div>
            )}
          </div>

          {/* STATS ROW */}
          <div style={s.statsRow}>
            {[
              { label: 'Total MRR', value: `$${stats.mrr.toLocaleString()}`, accent: true },
              { label: 'New', value: stats.new },
              { label: 'In Progress', value: stats.inProgress },
              { label: 'Delivered', value: stats.delivered },
              { label: 'Normal', value: submissions.filter(x => x.plan === 'normal').length },
              { label: 'Pro', value: submissions.filter(x => x.plan === 'pro').length },
            ].map(stat => (
              <div key={stat.label} style={{ ...s.statCard, ...(stat.accent ? s.statCardAccent : {}) }}>
                <div style={{ ...s.statVal, ...(stat.accent ? { color: '#FF4D1C' } : {}) }}>{stat.value}</div>
                <div style={s.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CONTENT AREA */}
          <div style={s.contentArea}>

            {/* LIST */}
            <div style={s.list}>
              {filtered.length === 0 && (
                <div style={s.emptyState}>No submissions yet. Share your onboarding link to get started.</div>
              )}
              {filtered.map(sub => (
                <div
                  key={sub.id}
                  style={{ ...s.listItem, ...(selected?.id === sub.id ? s.listItemActive : {}) }}
                  onClick={() => setSelected(sub)}
                >
                  <div style={s.listTop}>
                    <div style={s.listName}>{sub.businessName || sub.fullName || 'Unknown'}</div>
                    <div style={{
                      ...s.statusPill,
                      color: STATUS_CONFIG[sub.status]?.color || '#9A9589',
                      background: STATUS_CONFIG[sub.status]?.bg || 'transparent',
                      border: `1px solid ${STATUS_CONFIG[sub.status]?.border || '#E4E0D8'}`,
                    }}>
                      {STATUS_CONFIG[sub.status]?.label || sub.status}
                    </div>
                  </div>
                  <div style={s.listMeta}>
                    <span style={s.listService}>{sub.serviceType}</span>
                    <span style={{ ...s.planBadge, color: PLAN_COLORS[sub.plan] || '#9A9589' }}>
                      {sub.plan}
                    </span>
                  </div>
                  <div style={s.listDate}>{sub.submittedAt ? formatDate(sub.submittedAt) : '—'}</div>
                </div>
              ))}
            </div>

            {/* DETAIL PANEL */}
            {selected ? (
              <div style={s.detail}>
                <div style={s.detailHeader}>
                  <div>
                    <div style={s.detailName}>{selected.businessName}</div>
                    <div style={s.detailSub}>{selected.fullName} · {selected.email}</div>
                  </div>
                  <button style={s.closeBtn} onClick={() => setSelected(null)}>✕</button>
                </div>

                {/* Status control */}
                <div style={s.statusControl}>
                  <div style={s.controlLabel}>Status</div>
                  <div style={s.statusBtns}>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <button
                        key={key}
                        style={{
                          ...s.statusBtn,
                          ...(selected.status === key ? {
                            background: cfg.color,
                            color: '#fff',
                            border: `1px solid ${cfg.color}`,
                          } : {})
                        }}
                        onClick={() => updateStatus(selected.id, key)}
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={s.detailGrid}>
                  {[
                    { label: 'Phone Number', value: selected.phone || '—' },
                    { label: 'Service', value: Array.isArray(selected.serviceType) ? selected.serviceType.join(', ') : selected.serviceType },
                    { label: 'Plan', value: selected.plan },
                    { label: 'City / Area', value: selected.cityRadius },
                    { label: 'Ad Budget', value: selected.adBudget },
                    { label: 'Main Goal', value: selected.mainGoal?.replace(/_/g, ' ') },
                    { label: 'Current Offer', value: selected.currentOffer || '—' },
                    { label: 'Facebook/IG', value: selected.facebookPage || '—' },
                    { label: 'Submitted', value: selected.submittedAt ? formatDate(selected.submittedAt) : '—' },
                  ].map(row => (
                    <div key={row.label} style={s.detailRow}>
                      <div style={s.detailLabel}>{row.label}</div>
                      <div style={s.detailValue}>{row.value}</div>
                    </div>
                  ))}
                </div>

                {selected.extras && (
                  <div style={s.extrasBox}>
                    <div style={s.controlLabel}>Extra Notes</div>
                    <div style={s.extrasText}>{selected.extras}</div>
                  </div>
                )}

                <a href={`mailto:${selected.email}?subject=Your AdDrop™ is ready&body=Hi ${selected.fullName},%0A%0AYour first AdDrop is ready!`} style={s.emailBtn}>
                  ✉️ Email {selected.fullName?.split(' ')[0]}
                </a>
              </div>
            ) : (
              <div style={s.detailEmpty}>
                <div style={s.detailEmptyIcon}>←</div>
                <div style={s.detailEmptyText}>Select a client to view details</div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}

const s = {
  // LOGIN
  loginRoot: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#0E0E0B', padding: '24px',
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    backgroundBlendMode: 'overlay',
    backgroundColor: '#0E0E0B'
  },
  loginBox: {
    background: 'var(--glass-bg, rgba(255, 255, 255, 0.03))',
    border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.05))',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '16px',
    padding: '48px 40px', maxWidth: '380px', width: '100%',
    boxShadow: 'var(--shadow-elevated, 0 8px 32px rgba(0, 0, 0, 0.4))'
  },
  loginLogo: {
    fontFamily: "'Syne', sans-serif", fontSize: '22px', fontWeight: 800,
    color: '#F0F0EA', marginBottom: '24px', letterSpacing: '-0.5px',
  },
  loginTitle: {
    fontFamily: "'Syne', sans-serif", fontSize: '24px', fontWeight: 800,
    color: '#F0F0EA', letterSpacing: '-0.5px', marginBottom: '8px',
  },
  loginSub: { fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '28px', lineHeight: 1.6 },
  loginForm: { display: 'flex', flexDirection: 'column', gap: '12px' },
  loginInput: {
    padding: '14px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
    fontFamily: "'Syne', sans-serif", fontSize: '16px', color: '#F0F0EA',
    outline: 'none', letterSpacing: '4px', borderRadius: '8px',
    transition: 'border 0.2s ease',
  },
  loginError: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
    color: '#FF4D1C', letterSpacing: '0.5px',
  },
  loginBtn: {
    background: '#FF4D1C', color: '#fff', border: 'none',
    fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700,
    padding: '14px', cursor: 'pointer', borderRadius: '8px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  loginHint: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
    color: 'rgba(255,255,255,0.3)', marginTop: '20px', lineHeight: 1.6,
  },

  // DASHBOARD ROOT
  root: {
    display: 'flex', minHeight: '100vh',
    backgroundColor: 'var(--bg-primary, #FDFDFB)',
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    backgroundBlendMode: 'multiply',
  },

  // SIDEBAR
  sidebar: {
    width: '260px', flexShrink: 0,
    background: 'var(--glass-bg, rgba(255, 255, 255, 0.7))',
    display: 'flex', flexDirection: 'column',
    padding: '28px 24px', borderRight: '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))',
    position: 'sticky', top: 0, height: '100vh', overflow: 'auto',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
  },
  sidebarLogo: {
    fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 800,
    color: 'var(--text-primary, #1A1A18)', marginBottom: '32px', letterSpacing: '-0.5px',
  },
  sidebarLabel: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
    letterSpacing: '2px', color: 'var(--text-tertiary, #A39E93)', textTransform: 'uppercase',
    marginBottom: '12px', fontWeight: 600,
  },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: '4px' },
  navItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 14px', background: 'none', border: 'none',
    fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 600,
    color: 'var(--text-secondary, #6B685C)', cursor: 'pointer', textAlign: 'left',
    borderRadius: '10px', transition: 'all 0.2s ease',
  },
  navItemActive: { background: 'rgba(255,77,28,0.1)', color: '#FF4D1C' },
  navCount: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
    background: 'var(--glass-border, rgba(0, 0, 0, 0.05))', color: 'var(--text-secondary, #6B685C)',
    padding: '3px 8px', borderRadius: '4px', fontWeight: 600
  },
  sidebarDivider: { height: '1px', background: 'var(--glass-border, rgba(0, 0, 0, 0.05))', margin: '24px 0' },
  mrrBox: {
    padding: '20px',
    background: 'var(--glass-bg, rgba(255, 255, 255, 0.9))',
    border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))',
    marginBottom: '16px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  },
  mrrLabel: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
    letterSpacing: '2px', color: 'var(--text-tertiary, #A39E93)', textTransform: 'uppercase', marginBottom: '8px',
    fontWeight: 600
  },
  mrrAmount: {
    fontFamily: "'Syne', sans-serif", fontSize: '32px', fontWeight: 800,
    color: '#22C55E', letterSpacing: '-1px', lineHeight: 1,
  },
  mrrSub: { fontSize: '12px', color: 'var(--text-secondary, #6B685C)', marginTop: '6px', fontWeight: 500 },
  refreshBtn: {
    background: 'var(--glass-bg, rgba(255, 255, 255, 0.9))',
    border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))',
    color: 'var(--text-secondary, #6B685C)',
    fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 600,
    letterSpacing: '1px', padding: '12px', cursor: 'pointer',
    marginTop: 'auto', transition: 'all 0.2s ease', borderRadius: '8px',
  },

  // MAIN
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '32px 40px', borderBottom: '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))',
    background: 'var(--glass-bg, rgba(255, 255, 255, 0.4))',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
  },
  headerTitle: {
    fontFamily: "'Syne', sans-serif", fontSize: '26px', fontWeight: 800,
    letterSpacing: '-0.5px', color: 'var(--text-primary, #1A1A18)',
  },
  headerSub: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '12px',
    color: 'var(--text-tertiary, #A39E93)', marginTop: '6px', letterSpacing: '0.5px', fontWeight: 500
  },
  newBadge: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 600,
    color: '#FF4D1C', letterSpacing: '1px',
    background: 'rgba(255,77,28,0.1)', border: '1px solid rgba(255,77,28,0.2)',
    padding: '8px 16px', borderRadius: '24px',
  },

  // STATS
  statsRow: {
    display: 'flex', gap: '16px', padding: '24px 40px', borderBottom: '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))',
    overflowX: 'auto',
  },
  statCard: {
    flex: '1', minWidth: '100px',
    background: 'var(--glass-bg, rgba(255, 255, 255, 0.8))',
    border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    padding: '20px', textAlign: 'center', borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
  },
  statCardAccent: { background: 'var(--text-primary, #1A1A18)', color: '#fff' },
  statVal: {
    fontFamily: "'Syne', sans-serif", fontSize: '24px', fontWeight: 800,
    color: 'var(--text-primary, #1A1A18)', letterSpacing: '-0.5px',
  },
  statLabel: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 600,
    color: 'var(--text-tertiary, #A39E93)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '6px',
  },

  // CONTENT AREA
  contentArea: {
    display: 'flex', flex: 1, overflow: 'hidden',
  },

  // LIST
  list: {
    width: '360px', flexShrink: 0, borderRight: '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))',
    overflowY: 'auto', background: 'var(--glass-bg, rgba(255, 255, 255, 0.4))',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    padding: '16px'
  },
  listItem: {
    padding: '20px 24px', marginBottom: '12px',
    background: 'var(--glass-bg, rgba(255, 255, 255, 0.9))',
    border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))',
    borderRadius: '12px',
    cursor: 'pointer', transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  },
  listItemActive: {
    background: 'rgba(255,77,28,0.04)',
    border: '1px solid rgba(255,77,28,0.2)',
    boxShadow: '0 4px 12px rgba(255,77,28,0.08)'
  },
  listTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: '8px', marginBottom: '8px',
  },
  listName: {
    fontFamily: "'Syne', sans-serif", fontSize: '15px', fontWeight: 800,
    color: 'var(--text-primary, #1A1A18)', letterSpacing: '-0.2px',
  },
  statusPill: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 600,
    letterSpacing: '1px', padding: '4px 10px', textTransform: 'uppercase',
    whiteSpace: 'nowrap', borderRadius: '24px'
  },
  listMeta: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '6px',
  },
  listService: { fontSize: '13px', color: 'var(--text-secondary, #6B685C)', fontWeight: 500 },
  planBadge: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
    fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
  },
  listDate: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px', color: 'var(--text-tertiary, #A39E93)', letterSpacing: '0.3px', fontWeight: 500
  },
  emptyState: {
    padding: '40px 20px', textAlign: 'center',
    fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--text-tertiary, #A39E93)',
    lineHeight: 1.6, fontWeight: 500
  },

  // DETAIL
  detail: {
    flex: 1, overflowY: 'auto', padding: '40px',
  },
  detailEmpty: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '16px',
  },
  detailEmptyIcon: { fontSize: '40px', color: 'var(--glass-border, rgba(0, 0, 0, 0.05))' },
  detailEmptyText: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 600,
    color: 'var(--text-tertiary, #A39E93)', letterSpacing: '1px',
  },
  detailHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: '32px',
    paddingBottom: '32px', borderBottom: '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))',
  },
  detailName: {
    fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800,
    color: 'var(--text-primary, #1A1A18)', letterSpacing: '-0.5px', marginBottom: '8px',
  },
  detailSub: { fontSize: '14px', color: 'var(--text-secondary, #6B685C)', fontWeight: 500 },
  closeBtn: {
    background: 'var(--glass-bg, rgba(255, 255, 255, 0.9))',
    border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))',
    color: 'var(--text-secondary, #6B685C)',
    width: '40px', height: '40px', cursor: 'pointer', fontSize: '16px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  },
  statusControl: { marginBottom: '32px' },
  controlLabel: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 600,
    letterSpacing: '2px', color: 'var(--text-tertiary, #A39E93)', textTransform: 'uppercase',
    marginBottom: '12px',
  },
  statusBtns: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  statusBtn: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 600,
    letterSpacing: '1px', padding: '10px 16px',
    background: 'var(--glass-bg, rgba(255, 255, 255, 0.9))',
    border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))',
    color: 'var(--text-secondary, #6B685C)', cursor: 'pointer', textTransform: 'uppercase',
    transition: 'all 0.2s ease', borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  },
  detailGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
    marginBottom: '24px',
  },
  detailRow: {
    background: 'var(--glass-bg, rgba(255, 255, 255, 0.9))',
    border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))',
    padding: '20px', borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  },
  detailLabel: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 600,
    letterSpacing: '2px', color: 'var(--text-tertiary, #A39E93)', textTransform: 'uppercase',
    marginBottom: '8px',
  },
  detailValue: { fontSize: '15px', fontWeight: 700, color: 'var(--text-primary, #1A1A18)', lineHeight: 1.4 },
  extrasBox: {
    background: 'var(--glass-bg, rgba(255, 255, 255, 0.9))',
    border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))',
    padding: '24px', marginBottom: '32px', borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  },
  extrasText: { fontSize: '15px', color: 'var(--text-secondary, #6B685C)', lineHeight: 1.7, marginTop: '12px', fontWeight: 500 },
  emailBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '10px',
    background: 'var(--text-primary, #1A1A18)', color: '#fff', textDecoration: 'none',
    fontFamily: "'Syne', sans-serif", fontSize: '15px', fontWeight: 800,
    padding: '16px 32px', borderRadius: '12px',
    boxShadow: '4px 4px 0 #FF4D1C', transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
}
