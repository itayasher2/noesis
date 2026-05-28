// ── TabBar ────────────────────────────────────────────────────────────
//   Mono tabs with cyan underline + glow on active.

const MAIN_TABS = [
  { id: 'overview',   label: 'Overview' },
  { id: 'valuation',  label: 'Valuation' },
  { id: 'financials', label: 'Financials' },
  { id: 'analysis',   label: 'Analysis' },
  { id: 'docs',       label: 'Documents' },
];

const ADVANCED_TABS = [
  { id: 'gordon',  label: 'Gordon Model' },
  { id: 'ri',      label: 'Value Models' },
  { id: 'capital', label: 'Capital Alloc.' },
  { id: 'forward', label: 'Forward View' },
  { id: 'market',  label: 'Market Exp.' },
  { id: 'peers',   label: 'Peers' },
];

function TabBar({ tab, setTab, showAdvanced, setShowAdvanced }) {
  return (
    <>
      <div className="tab-bar">
        {MAIN_TABS.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
        <button className={`tab ${showAdvanced ? 'active' : ''}`}
          onClick={() => { setShowAdvanced(v => !v); if (!showAdvanced) setTab('gordon'); }}
          style={{ marginLeft: 'auto', borderLeft: '1px solid var(--border)' }}>
          {showAdvanced ? '▲ Less' : '⚙ Advanced'}
        </button>
      </div>
      {showAdvanced && (
        <div className="tab-bar" style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
          {ADVANCED_TABS.map(t => (
            <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
              style={{ fontSize: 9.5, padding: '8px 14px' }}>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

Object.assign(window, { TabBar, MAIN_TABS, ADVANCED_TABS });
