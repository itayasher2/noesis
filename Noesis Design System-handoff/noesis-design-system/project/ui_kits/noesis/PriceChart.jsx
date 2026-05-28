// ── PriceChart ────────────────────────────────────────────────────────
//   A real (mocked) 1-year price chart — SVG area + line + axis ticks.
//   No external deps. Generates a deterministic walk seeded from the ticker
//   so each company looks distinct but stable.

function PriceChart({ ticker, height = 200, points = 60, basePrice = 100 }) {
  // Deterministic pseudo-random walk based on ticker symbol.
  const seed = Array.from(ticker || 'AAPL').reduce((s, c) => s + c.charCodeAt(0), 0);
  const rng = mulberry32(seed);
  const series = [];
  let v = basePrice * (0.7 + rng() * 0.4);  // start somewhere reasonable
  for (let i = 0; i < points; i++) {
    const drift = (rng() - 0.45) * 0.04;     // slight upward bias
    v = Math.max(1, v * (1 + drift));
    series.push(v);
  }
  // Make the last value equal to basePrice (i.e. "current price")
  const scale = basePrice / series[series.length - 1];
  const norm = series.map(p => p * scale);

  const min = Math.min(...norm);
  const max = Math.max(...norm);
  const range = max - min || 1;
  const W = 100, H = 100;
  const xs = norm.map((_, i) => (i / (points - 1)) * W);
  const ys = norm.map(p => H - ((p - min) / range) * H * 0.85 - H * 0.08);
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${ys[i].toFixed(2)}`).join(' ');
  const area = `${path} L ${W} ${H} L 0 ${H} Z`;

  const change = ((norm[norm.length - 1] - norm[0]) / norm[0]) * 100;
  const up = change >= 0;
  const stroke = up ? '#3ddc84' : '#ff5470';
  const fillStop = up ? 'rgba(61,220,132,0.18)' : 'rgba(255,84,112,0.18)';
  const gid = `g-${ticker}-${Math.round(seed)}`;

  // Y-axis ticks: 4 levels
  const ticks = [0, 0.33, 0.66, 1].map(t => {
    const price = min + t * range;
    const y = H - (t * H * 0.85 + H * 0.08);
    return { y, label: '$' + price.toFixed(1) };
  });

  // X-axis labels: months
  const months = ['Jun', 'Aug', 'Oct', 'Dec', 'Feb', 'Apr'];

  return (
    <div className="card" style={{ padding: 16, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 4 }}>{ticker} · 12M</div>
          <div className="t-num-lg">${norm[norm.length - 1].toFixed(2)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="t-eyebrow" style={{ marginBottom: 4 }}>Change</div>
          <div className="t-num-lg" style={{ color: stroke }}>{up ? '+' : ''}{change.toFixed(1)}%</div>
        </div>
      </div>
      <div style={{ position: 'relative', height }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
             style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor={fillStop}/>
              <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
            </linearGradient>
          </defs>
          {/* horizontal grid lines */}
          {ticks.map((t, i) => (
            <line key={i} x1="0" x2={W} y1={t.y} y2={t.y}
                  stroke="rgba(140,180,255,0.06)" strokeWidth="0.25" />
          ))}
          {/* area */}
          <path d={area} fill={`url(#${gid})`} />
          {/* line */}
          <path d={path} fill="none" stroke={stroke} strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round"/>
          {/* last point dot */}
          <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="1.2" fill={stroke} />
          <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="3" fill={stroke} opacity="0.25" />
        </svg>
        {/* Y-axis labels overlay (HTML on top of SVG) */}
        <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 56, pointerEvents: 'none' }}>
          {ticks.map((t, i) => (
            <div key={i} style={{
              position: 'absolute', right: 4, top: `${t.y}%`,
              transform: 'translateY(-50%)',
              fontFamily: 'var(--font-mono)', fontSize: 9,
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
              background: 'var(--bg-card)', padding: '0 4px',
            }}>{t.label}</div>
          ))}
        </div>
      </div>
      {/* X-axis labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {months.map(m => <span key={m}>{m}</span>)}
      </div>
    </div>
  );
}

// Tiny seedable RNG so charts are deterministic per ticker
function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

Object.assign(window, { PriceChart });
