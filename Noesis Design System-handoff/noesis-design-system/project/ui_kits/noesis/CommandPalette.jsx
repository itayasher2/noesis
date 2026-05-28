// ── CommandPalette ────────────────────────────────────────────────────
//   ⌘K modal — overlay, hairline border, mono list with cyan glow on
//   the selected row. Esc closes, ↑↓ navigate, Enter selects.

const TICKER_INDEX = [
  { sym: 'AAPL', name: 'Apple Inc.',          sector: 'Consumer Tech',     mocked: true  },
  { sym: 'NVDA', name: 'NVIDIA Corporation',  sector: 'Semiconductors',    mocked: true  },
  { sym: 'MSFT', name: 'Microsoft Corp.',     sector: 'Software',          mocked: false },
  { sym: 'GOOG', name: 'Alphabet Inc. · C',   sector: 'Internet',          mocked: false },
  { sym: 'META', name: 'Meta Platforms',      sector: 'Internet',          mocked: false },
  { sym: 'AMZN', name: 'Amazon.com',          sector: 'E-Commerce',        mocked: false },
  { sym: 'TSLA', name: 'Tesla Inc.',          sector: 'Auto',              mocked: false },
  { sym: 'AMD',  name: 'Advanced Micro Devices', sector: 'Semiconductors', mocked: false },
  { sym: 'BRK.B',name: 'Berkshire Hathaway',  sector: 'Conglomerate',      mocked: false },
  { sym: 'JPM',  name: 'JPMorgan Chase',      sector: 'Banking',           mocked: false },
  { sym: 'V',    name: 'Visa Inc.',           sector: 'Payments',          mocked: false },
  { sym: 'NFLX', name: 'Netflix Inc.',        sector: 'Streaming',         mocked: false },
];

function CommandPalette({ open, onClose, onPick }) {
  const [query, setQuery] = React.useState('');
  const [cursor, setCursor] = React.useState(0);
  const inputRef = React.useRef(null);

  // Focus input when opened; reset state when closed.
  React.useEffect(() => {
    if (open) {
      setQuery(''); setCursor(0);
      setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
    }
  }, [open]);

  // Esc anywhere closes.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.trim().toUpperCase();
  const filtered = !q
    ? TICKER_INDEX
    : TICKER_INDEX.filter(t =>
        t.sym.includes(q) ||
        t.name.toUpperCase().includes(q) ||
        t.sector.toUpperCase().includes(q));

  const pick = (t) => {
    if (!t) return;
    onPick(t.sym);
    onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(filtered.length - 1, c + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(0, c - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(filtered[cursor]); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0, 4, 12, 0.7)',
      backdropFilter: 'blur(2px)',
      WebkitBackdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '15vh',
    }} onClick={onClose}>
      <div className="card glow" style={{
        width: 'min(640px, 92vw)',
        padding: 0,
        overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ color: 'var(--accent)', fontSize: 16 }}>▶</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={onKeyDown}
            placeholder="Search ticker · symbol, name, or sector…"
            style={{
              flex: 1, height: 32,
              padding: 0,
              border: 'none', background: 'transparent',
              outline: 'none', boxShadow: 'none',
              color: 'var(--text-primary)',
              fontSize: 14, fontFamily: 'var(--font-sans)',
            }}
          />
          <kbd style={{
            padding: '2px 7px', fontSize: 10,
            fontFamily: 'var(--font-mono)',
            background: 'var(--bg-subtle)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            borderRadius: 3, letterSpacing: '0.04em',
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div className="t-eyebrow">No matches</div>
            </div>
          ) : (
            filtered.map((t, i) => (
              <CommandRow key={t.sym} ticker={t} selected={cursor === i}
                onPick={() => pick(t)} onHover={() => setCursor(i)} />
            ))
          )}
        </div>

        {/* Footer hints */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '8px 14px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-muted)',
          letterSpacing: '0.06em',
        }}>
          <Hint k="↑↓" label="navigate" />
          <Hint k="↵" label="select" />
          <Hint k="ESC" label="close" />
          <span style={{ marginLeft: 'auto' }}>
            {filtered.length} / {TICKER_INDEX.length} results
          </span>
        </div>
      </div>
    </div>
  );
}

function CommandRow({ ticker, selected, onPick, onHover }) {
  return (
    <button onClick={onPick} onMouseEnter={onHover}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 18px',
        background: selected ? 'var(--bg-subtle)' : 'transparent',
        border: 'none', cursor: 'pointer',
        borderLeft: `2px solid ${selected ? 'var(--accent)' : 'transparent'}`,
        boxShadow: selected ? 'inset 0 0 0 1px rgba(0,212,255,0.08)' : 'none',
        textAlign: 'left',
      }}>
      <div style={{
        fontFamily: 'var(--font-wordmark)', fontWeight: 900,
        fontSize: 13, letterSpacing: 1.5,
        color: selected ? 'var(--accent)' : 'var(--text-primary)',
        minWidth: 60,
      }}>{ticker.sym}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, color: 'var(--text-primary)', fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{ticker.name}</div>
        <div className="t-meta" style={{ marginTop: 2 }}>{ticker.sector}</div>
      </div>
      {ticker.mocked && <div className="badge up" style={{ fontSize: 8, padding: '3px 7px' }}>Live</div>}
      {selected && <span style={{ color: 'var(--accent)', fontSize: 14 }}>↵</span>}
    </button>
  );
}

function Hint({ k, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <kbd style={{
        padding: '1px 5px', fontSize: 9,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 3, color: 'var(--text-primary)',
      }}>{k}</kbd>
      <span style={{ textTransform: 'uppercase' }}>{label}</span>
    </span>
  );
}

Object.assign(window, { CommandPalette, TICKER_INDEX });
