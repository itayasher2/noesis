// ── Header components ─────────────────────────────────────────────────
//   BrandLockup, UserMenu, TickerTape, Header shell.
//   Quant Terminal aesthetic: mono chrome, hairline borders, glowing dot.

function BrandLockup({ size = 'sm' }) {
  const sizes = {
    sm: { word: 14, tag: 7,   dot: 9  },
    md: { word: 16, tag: 7.5, dot: 10 },
    lg: { word: 22, tag: 9,   dot: 14 },
  };
  const s = sizes[size];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div className="logo-dot" style={{ width: s.dot, height: s.dot }} />
      <div>
        <div className="wordmark" style={{ fontSize: s.word }}>NOESIS</div>
        <div className="wordmark-tag" style={{ fontSize: s.tag }}>Understand Value. Act Smarter.</div>
      </div>
    </div>
  );
}

function UserMenu({ user, onLogout, darkMode, toggleTheme }) {
  const [open, setOpen] = React.useState(false);
  const items = [
    { label: 'Account',       sub: 'Profile' },
    { label: 'Subscription',  sub: 'Pro · monthly' },
    { label: 'Notifications', sub: 'Alerts' },
    { label: 'Settings',      sub: 'Preferences' },
    { label: 'Usage',         sub: 'API · limits' },
    { label: 'Help',          sub: 'Docs · contact' },
  ];
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 11px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11, fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: 'var(--gradient-brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 10, fontWeight: 700,
        }}>{user.charAt(0).toUpperCase()}</div>
        <span>{user}</span>
        <span style={{ fontSize: 9, opacity: 0.5 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 250, zIndex: 50,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-subtle)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--gradient-brand)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>{user.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'var(--text-primary)' }}>{user}</div>
                <div className="t-meta">PRO PLAN</div>
              </div>
            </div>
            {items.map(it => <MenuRow key={it.label} {...it} onClick={() => setOpen(false)} />)}
            <MenuRow
              label={darkMode ? 'Light Mode' : 'Dark Mode'}
              sub="Switch appearance"
              onClick={() => { toggleTheme(); setOpen(false); }}
            />
            <MenuRow
              label="Sign out" sub="Log out of Noesis"
              danger
              onClick={() => { onLogout(); setOpen(false); }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function MenuRow({ label, sub, danger, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', padding: '9px 14px',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
        background: hover ? (danger ? 'var(--red-bg)' : 'var(--bg-subtle)') : 'transparent',
        border: 'none', cursor: 'pointer',
        borderBottom: danger ? 'none' : '1px solid var(--border)',
        textAlign: 'left',
      }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: danger ? 'var(--red)' : 'var(--text-primary)',
      }}>{label}</div>
      <div className="t-meta">{sub}</div>
    </button>
  );
}

// The ambient ticker tape — the system's signature motion.
// Static rows here; in production you'd subscribe to a feed.
function TickerTape({ items }) {
  const data = items || [
    { sym: 'AAPL', price: '184.32', delta: '+1.42%', up: true  },
    { sym: 'NVDA', price: '487.18', delta: '+2.84%', up: true  },
    { sym: 'MSFT', price: '412.05', delta: '+0.31%', up: true  },
    { sym: 'TSLA', price: '248.91', delta: '−3.12%', up: false },
    { sym: 'GOOG', price: '142.65', delta: '+0.84%', up: true  },
    { sym: 'META', price: '487.30', delta: '+1.21%', up: true  },
    { sym: 'AMZN', price: '178.24', delta: '+0.55%', up: true  },
    { sym: 'AMD',  price: '162.84', delta: '−1.04%', up: false },
  ];
  // Duplicate so the loop is seamless.
  const loop = [...data, ...data];
  return (
    <div className="ticker">
      <div className="ticker-track">
        {loop.map((it, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-sym">{it.sym}</span>
            {it.price}
            <span className={it.up ? 'ticker-up' : 'ticker-down'}>{it.delta}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Header({ user, onLogout, darkMode, toggleTheme }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, marginBottom: 16,
    }}>
      <BrandLockup />
      {user && <UserMenu user={user} onLogout={onLogout} darkMode={darkMode} toggleTheme={toggleTheme} />}
    </div>
  );
}

Object.assign(window, { BrandLockup, UserMenu, MenuRow, TickerTape, Header });
