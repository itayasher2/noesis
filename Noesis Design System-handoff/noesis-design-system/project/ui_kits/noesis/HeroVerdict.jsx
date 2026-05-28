// ── HeroVerdict ───────────────────────────────────────────────────────
//   The main verdict card. Uses .verdict-card with a colour-coded rail
//   (buy / hold / reduce / avoid). Hero number + delta + glow-dot badges.

const VERDICT_TO_CLASS = {
  'Strong Opportunity': 'buy',
  'Attractive':         'buy',
  'Fairly Valued':      'hold',
  'High Expectations':  'reduce',
  'Caution':            'reduce',
  'Speculative':        'avoid',
};
const VERDICT_TO_ACTION = {
  'Strong Opportunity': 'BUY',
  'Attractive':         'BUY',
  'Fairly Valued':      'HOLD',
  'High Expectations':  'REDUCE',
  'Caution':            'REDUCE',
  'Speculative':        'AVOID',
};

function HeroVerdict({ data, scoreData, dcf, insight }) {
  const { fmt, fmtPrice, fmtMktCap } = window.NoesisFormat;
  const price = data.profile.price;
  const verdict =
    scoreData.composite >= 80 ? 'Strong Opportunity' :
    scoreData.composite >= 65 ? 'Attractive' :
    scoreData.composite >= 50 ? 'Fairly Valued' :
    scoreData.composite >= 35 ? 'High Expectations' :
    'Caution';
  const klass  = VERDICT_TO_CLASS[verdict] || 'hold';
  const action = VERDICT_TO_ACTION[verdict] || 'HOLD';
  const upside = dcf?.fv ? (dcf.fv / price - 1) * 100 : null;
  const mktCap = fmtMktCap(data.profile.marketCap);

  return (
    <div className={`verdict-card ${klass}`} style={{ marginBottom: 16 }}>
      {/* top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {data.profile.logo && (
            <img src={data.profile.logo}
              style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'contain', background: 'white', padding: 4, border: '1px solid var(--border)', flexShrink: 0 }}
              alt="" onError={e => e.target.style.display = 'none'} />
          )}
          <div>
            <div className="t-eyebrow" style={{ marginBottom: 4 }}>{data.profile.ticker} · {data.profile.sector}</div>
            <div className="wordmark" style={{ fontSize: 16, letterSpacing: 1.5 }}>{data.profile.name.toUpperCase()}</div>
            <div className="t-meta" style={{ marginTop: 4 }}>
              {data.profile.exchange} · {(data.profile.employees / 1000).toFixed(0)}K employees · {data.profile.country}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="t-eyebrow" style={{ marginBottom: 4 }}>Last · live</div>
          <div className="t-num-hero" style={{ fontSize: 44 }}>{fmtPrice(price)}</div>
          <div className="t-meta" style={{
            color: data.profile.changePct >= 0 ? 'var(--green)' : 'var(--red)',
            marginTop: 4,
          }}>
            {data.profile.changePct >= 0 ? '+' : ''}{fmt(data.profile.changePct, 2)}% TODAY
            {mktCap && <span style={{ color: 'var(--text-muted)', marginLeft: 10 }}>· MKT CAP {mktCap}</span>}
          </div>
        </div>
      </div>

      {/* badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <div className={`badge ${klass}`}>{verdict} · {action}</div>
        <div className="badge ghost">Confidence · {scoreData.confidence || 'Medium'}</div>
        {upside !== null && (
          <div className={`badge ${upside >= 0 ? 'up' : 'down'}`}>
            {upside >= 0 ? '+' : ''}{fmt(upside, 1)}% vs Fair Value
          </div>
        )}
        <div className="badge ghost">Style · {scoreData.companyStyle || 'Blend'}</div>
      </div>

      {/* AI insight strip */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
      }}>
        <div style={{ width: 3, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
        <div style={{ padding: '10px 14px', flex: 1 }}>
          <div className="t-eyebrow" style={{ color: 'var(--accent)', marginBottom: 4 }}>Key insight · AI</div>
          <div className="t-body-sm" style={{ fontStyle: 'italic' }}>
            "{insight?.keyInsight || `Trades at ${upside > 0 ? 'a discount' : 'a premium'} to fair value with ${Math.abs(scoreData.expectationsGap || 0) < 6 ? 'reasonable' : 'aggressive'} growth assumptions.`}"
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HeroVerdict, VERDICT_TO_CLASS, VERDICT_TO_ACTION });
