// ── Search bar ────────────────────────────────────────────────────────
//   Cmd+K affordance inside a hairline input + brand button.

function SearchBar({ value, onChange, onAnalyze, loading, error, onOpenPalette }) {
  return (
    <>
      <div style={{
        position: 'relative', display: 'flex', gap: 8, marginBottom: 18,
      }}>
        <button onClick={onOpenPalette}
          style={{
            flex: 1, height: 42,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
            fontSize: 13, fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
          <span>{value ? <b style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</b> : 'Search ticker…   AAPL · TSLA · MSFT · NVDA'}</span>
          <kbd style={{
            padding: '2px 7px', fontSize: 10,
            fontFamily: 'var(--font-mono)',
            background: 'rgba(0,212,255,0.1)',
            color: 'var(--accent)',
            border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 3, letterSpacing: '0.04em',
          }}>⌘K</kbd>
        </button>
        <button onClick={onAnalyze} disabled={loading}
          className="btn-brand"
          style={{ height: 42, padding: '0 22px' }}>
          {loading ? '⟳' : 'Analyze ▶'}
        </button>
      </div>
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          background: 'var(--red-bg)',
          border: '1px solid var(--red-border)',
          color: 'var(--red)',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11, letterSpacing: '0.04em',
          marginBottom: 16,
        }}><span>✕</span>{error}</div>
      )}
    </>
  );
}

Object.assign(window, { SearchBar });
