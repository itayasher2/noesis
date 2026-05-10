import { fmt, fmtPrice, fmtB } from '../utils/format';

function getVerdict(composite) {
  if (composite >= 80) return { label: 'Strong Opportunity', color: '#065f46', bg: '#f0fdf4', border: '#a7f3d0' };
  if (composite >= 65) return { label: 'Attractive', color: '#065f46', bg: '#f0fdf4', border: '#a7f3d0' };
  if (composite >= 50) return { label: 'Fairly Valued', color: '#78350f', bg: '#fdfaf5', border: '#e5d5b0' };
  if (composite >= 35) return { label: 'High Expectations', color: '#92400e', bg: '#fffbf5', border: '#e5d0b0' };
  if (composite >= 20) return { label: 'Caution', color: '#92400e', bg: '#fffbf5', border: '#e5d0b0' };
  return { label: 'Speculative', color: '#991b1b', bg: '#fff8f8', border: '#e5b0b0' };
}

function getKeyInsight({ scoreData, data, dcf }) {
  const ticker = data.profile.ticker;
  const name = data.profile.name;
  const upside = dcf?.fv && data.profile.price ? (dcf.fv / data.profile.price - 1) * 100 : null;
  const implied = scoreData?.impliedGrowth;
  const historical = scoreData?.revCAGR;
  const composite = scoreData?.composite || 50;

  if (composite >= 65) {
    return `${name} appears undervalued relative to its fundamentals — the market may be underpricing long-term earnings power.`;
  } else if (composite >= 50) {
    return `${name} is trading near fair value. Current price reflects a balanced risk/reward with limited near-term catalyst.`;
  } else if (implied && historical && implied > historical * 1.5) {
    return `${name} is a high-quality business, but current valuation implies growth expectations significantly above historical trends.`;
  } else if (composite < 35) {
    return `${name} appears richly valued. The market is pricing in an optimistic scenario that leaves limited margin of safety.`;
  }
  return `${name} requires careful monitoring — execution against market expectations is critical to justify current valuation.`;
}

export default function HeroSection({ data, scoreData, dcf, dcfParams }) {
  if (!data || !scoreData) return null;

  const price = data.profile.price;
  const verdict = getVerdict(scoreData.composite);
  const insight = getKeyInsight({ scoreData, data, dcf });

  const implied = scoreData.impliedGrowth;
  const historical = scoreData.revCAGR;
  const fcfGap = implied && historical ? implied - historical : null;

  const fairLow = dcf?.fv ? dcf.fv * 0.85 : null;
  const fairHigh = dcf?.fv ? dcf.fv * 1.05 : null;
  const upside = dcf?.fv ? (dcf.fv / price - 1) * 100 : null;

  const mainRisk = fcfGap > 10
    ? 'Valuation compression if growth disappoints'
    : fcfGap > 4
    ? 'Execution risk — above-average growth required'
    : upside < -15
    ? 'Limited upside at current price'
    : 'Monitor earnings delivery vs expectations';

  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="mb-5 fade-in" style={{
      background: isDark ? 'var(--bg-card)' : verdict.bg,
      border: `1.5px solid ${isDark ? verdict.color + '30' : verdict.border}`,
      borderRadius: 'var(--radius)',
      padding: '28px 32px',
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    }}>

      {/* ── Top: Company + Verdict ── */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          {data.profile.logo && (
            <img src={data.profile.logo} className="w-10 h-10 rounded-xl object-contain"
              style={{border:'1px solid var(--border)'}} alt="" />
          )}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-1"
              style={{color: verdict.color, opacity: 0.7}}>
              {data.profile.ticker} · {data.profile.sector}
            </div>
            <div style={{fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2}}>
              {data.profile.name}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{color: verdict.color, opacity: 0.7}}>Investment Verdict</div>
          <div style={{
            fontSize: 18, fontWeight: 600, color: verdict.color,
            letterSpacing: 1, fontFamily: 'Arial, sans-serif',
          }}>
            {verdict.label}
          </div>
          <div className="text-xs mt-1" style={{color: 'var(--text-muted)'}}>
            Confidence: {scoreData.confidence}
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{height: 1, background: verdict.color + '15', marginBottom: 20}}/>

      {/* ── Key Insight ── */}
      <div className="mb-5 px-4 py-3 rounded-xl" style={{
        background: isDark ? 'var(--bg-subtle)' : verdict.color + '08',
        borderLeft: `3px solid ${verdict.color}`,
      }}>
        <div className="text-xs font-bold uppercase tracking-widest mb-1"
          style={{color: verdict.color, opacity: 0.7}}>Key Insight</div>
        <div className="text-sm leading-relaxed" style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>
          "{insight}"
        </div>
      </div>

      {/* ── 3 columns ── */}
      <div className="grid grid-cols-3 gap-4 mb-5">

        {/* Market vs Reality */}
        <div className="rounded-xl p-3" style={{background: isDark ? 'var(--bg-subtle)' : 'rgba(255,255,255,0.5)', border: '1px solid var(--border)'}}>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color: 'var(--text-muted)'}}>
            Market vs Reality
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span style={{color: 'var(--text-muted)'}}>Market pricing</span>
              <span className="font-bold num" style={{color: fcfGap > 8 ? '#991b1b' : '#92400e'}}>
                {implied !== null ? fmt(implied, 1) + '% FCF' : '—'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{color: 'var(--text-muted)'}}>Historical CAGR</span>
              <span className="font-bold num" style={{color: 'var(--text-secondary)'}}>
                {historical !== null ? fmt(historical, 1) + '%' : '—'}
              </span>
            </div>
            {fcfGap !== null && (
              <div className="flex justify-between text-xs pt-1" style={{borderTop: '1px solid var(--border)'}}>
                <span style={{color: 'var(--text-muted)'}}>Gap</span>
                <span className="font-bold num" style={{color: fcfGap > 8 ? '#991b1b' : '#92400e'}}>
                  +{fmt(fcfGap, 1)}pp
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Fair Value */}
        <div className="rounded-xl p-3" style={{background: isDark ? 'var(--bg-subtle)' : 'rgba(255,255,255,0.5)', border: '1px solid var(--border)'}}>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color: 'var(--text-muted)'}}>
            Fair Value Range
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span style={{color: 'var(--text-muted)'}}>DCF range</span>
              <span className="font-bold num" style={{color: 'var(--text-primary)'}}>
                {fairLow && fairHigh ? `${fmtPrice(fairLow)} – ${fmtPrice(fairHigh)}` : '—'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{color: 'var(--text-muted)'}}>Current price</span>
              <span className="font-bold num" style={{color: 'var(--text-primary)'}}>
                {fmtPrice(price)}
              </span>
            </div>
            {upside !== null && (
              <div className="flex justify-between text-xs pt-1" style={{borderTop: '1px solid var(--border)'}}>
                <span style={{color: 'var(--text-muted)'}}>vs Fair Value</span>
                <span className="font-bold num" style={{color: upside >= 0 ? '#065f46' : '#991b1b'}}>
                  {upside >= 0 ? '+' : ''}{fmt(upside, 1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Risk */}
        <div className="rounded-xl p-3" style={{background: isDark ? 'var(--bg-subtle)' : 'rgba(255,255,255,0.5)', border: '1px solid var(--border)'}}>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color: 'var(--text-muted)'}}>
            Main Risk
          </div>
          <div className="text-xs leading-relaxed" style={{color: 'var(--text-secondary)'}}>
            {mainRisk}
          </div>
          <div className="mt-2 pt-2" style={{borderTop: '1px solid var(--border)'}}>
            <div className="text-xs" style={{color: 'var(--text-muted)'}}>
              β <span className="font-bold num" style={{color: 'var(--text-primary)'}}>
                {data.profile.beta ? fmt(data.profile.beta, 2) : '—'}
              </span>
              <span className="ml-2">
                {data.profile.changePct >= 0 ? '+' : ''}{fmt(data.profile.changePct, 2)}% today
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom: price + description ── */}
      <div className="flex items-center justify-between">
        <div className="text-xs leading-relaxed" style={{color: 'var(--text-muted)', maxWidth: '70%'}}>
          {data.profile.description?.slice(0, 160)}...
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold num" style={{color: 'var(--text-primary)'}}>
            {fmtPrice(price)}
          </div>
          <div className="text-xs" style={{color: 'var(--text-muted)'}}>
            {data.profile.exchange} · {data.profile.country}
          </div>
        </div>
      </div>

    </div>
  );
}
