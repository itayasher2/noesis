// ── DecisionBox ───────────────────────────────────────────────────────
//   The "what to do" card. Big mono action word + conviction badge.
//   Why / Action columns. Mono price-levels meter.

const ACTION_CLASS = { BUY: 'buy', HOLD: 'hold', REDUCE: 'reduce', AVOID: 'avoid' };
const ACTION_COLOR = {
  BUY:    'var(--green)',
  HOLD:   'var(--amber)',
  REDUCE: 'var(--orange)',
  AVOID:  'var(--red)',
};

function decideAction({ scoreData, dcf, price }) {
  const upside = dcf?.fv && price ? (dcf.fv / price - 1) * 100 : 0;
  const composite = scoreData?.composite || 50;
  if (composite >= 70 && upside > 20) return {
    action: 'BUY', conviction: upside > 40 ? 'HIGH' : 'MEDIUM',
    reasons: [
      `Undervalued ~${Math.abs(upside).toFixed(0)}% vs intrinsic value`,
      'Market pricing reasonable growth',
      'High-quality fundamentals',
    ],
    steps: dcf ? [
      'Consider initiating or adding position',
      `Entry: $${(dcf.fv * 0.85).toFixed(2)} – $${(dcf.fv * 0.95).toFixed(2)}`,
      `Target: $${dcf.fv.toFixed(2)}`,
    ] : ['Consider initiating'],
  };
  if (composite >= 45 && upside > -10) return {
    action: 'HOLD', conviction: 'MEDIUM',
    reasons: [
      `Near fair value (${upside >= 0 ? '+' : ''}${upside.toFixed(0)}% vs DCF)`,
      'Growth expectations reasonable',
      'Monitor execution vs guidance',
    ],
    steps: dcf ? [
      'Hold existing position',
      `Better entry: $${(dcf.fv * 0.85).toFixed(2)}`,
      'Watch next earnings',
    ] : ['Hold'],
  };
  if (composite >= 25) return {
    action: 'REDUCE', conviction: 'MEDIUM',
    reasons: [
      `Overvalued ~${Math.abs(upside).toFixed(0)}% vs intrinsic value`,
      'Above-average growth priced in',
      'Limited margin of safety',
    ],
    steps: dcf ? [
      'Consider trimming position',
      `Fair value: $${dcf.fv.toFixed(2)}`,
      `Better entry: $${(dcf.fv * 0.80).toFixed(2)}`,
    ] : ['Trim'],
  };
  return {
    action: 'AVOID', conviction: 'HIGH',
    reasons: [
      `Significantly overvalued ~${Math.abs(upside).toFixed(0)}%`,
      'Aggressive growth priced in',
      'Risk/reward highly unfavorable',
    ],
    steps: dcf ? [
      'Avoid initiating position',
      'Wait for meaningful correction',
      `Potential entry: $${(dcf.fv * 0.75).toFixed(2)}`,
    ] : ['Avoid'],
  };
}

function DecisionBox({ scoreData, dcf, price }) {
  const { fmt, fmtPrice } = window.NoesisFormat;
  const d = decideAction({ scoreData, dcf, price });
  const upside = dcf?.fv && price ? (dcf.fv / price - 1) * 100 : null;
  const fairValue  = dcf?.fv || price;
  const buyZoneLow = fairValue * 0.75;
  const extreme    = fairValue * 1.50;
  const overvalued = fairValue * 1.20;
  const pricePct = Math.min(96, Math.max(2, (price - buyZoneLow) / (extreme - buyZoneLow) * 100));
  const color = ACTION_COLOR[d.action];

  return (
    <div className={`verdict-card ${ACTION_CLASS[d.action]}`} style={{ marginBottom: 16 }}>
      {/* hero row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 8 }}>Investment view</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              fontFamily: 'var(--font-wordmark)',
              fontSize: 30, fontWeight: 900,
              letterSpacing: 3, color,
              lineHeight: 1,
            }}>{d.action}</div>
            <div className={`badge ${ACTION_CLASS[d.action]}`}>{d.conviction} CONVICTION</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="t-eyebrow" style={{ marginBottom: 4 }}>vs Fair Value</div>
          <div className="t-num-hero" style={{
            fontSize: 32,
            color: upside >= 0 ? 'var(--green)' : upside > -20 ? 'var(--amber)' : 'var(--red)',
          }}>{upside !== null ? (upside >= 0 ? '+' : '') + fmt(upside, 1) + '%' : 'N/A'}</div>
          <div className="t-meta" style={{ marginTop: 4 }}>FV {fmtPrice(fairValue)}</div>
        </div>
      </div>

      {/* Why / Action columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 10 }}>Why · {d.action.toLowerCase()}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.reasons.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <span style={{ color, marginTop: 5, flexShrink: 0, fontSize: 7 }}>●</span>{r}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 10 }}>Action</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.steps.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <span style={{ color, marginTop: 1, flexShrink: 0 }}>→</span>{a}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Price levels meter */}
      <div>
        <div className="t-eyebrow" style={{ marginBottom: 8 }}>Price levels</div>
        <div style={{
          position: 'relative', height: 28,
          borderRadius: 6, overflow: 'hidden',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0,     width: '30%', background: 'rgba(61,220,132,0.10)' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '30%', width: '25%', background: 'rgba(255,181,71,0.10)' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '55%', width: '25%', background: 'rgba(255,149,64,0.10)' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '80%', right: 0,     background: 'rgba(255,84,112,0.10)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            <span style={{ width: '30%', paddingLeft: 8, color: 'var(--green)' }}>Buy</span>
            <span style={{ width: '25%', paddingLeft: 8, color: 'var(--amber)' }}>Fair</span>
            <span style={{ width: '25%', paddingLeft: 8, color: 'var(--orange)' }}>Pricey</span>
            <span style={{ paddingLeft: 8, color: 'var(--red)' }}>Extreme</span>
          </div>
          <div style={{ position: 'absolute', top: 3, bottom: 3, left: pricePct + '%', width: 2, background: color, boxShadow: `0 0 8px ${color}` }} />
          <div className="num" style={{
            position: 'absolute', left: Math.min(85, Math.max(2, pricePct)) + '%',
            top: '50%', transform: 'translateY(-50%)',
            color, background: 'var(--bg-base)',
            padding: '2px 6px', borderRadius: 3,
            fontSize: 10, fontWeight: 500,
            border: `1px solid ${color}`,
          }}>{fmtPrice(price)}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          <span>{fmtPrice(buyZoneLow)}</span>
          <span style={{ color }}>{fmtPrice(fairValue)}</span>
          <span>{fmtPrice(overvalued)}</span>
          <span>{fmtPrice(extreme)}</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DecisionBox, decideAction });
