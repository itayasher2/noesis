// ── InvestmentProfile ─────────────────────────────────────────────────
//   Strip below DecisionBox: 4-up KPI grid with sparklines.

function InvestmentProfile({ data, scoreData, dcf }) {
  if (!scoreData) return null;
  const { fmt, fmtPrice, fmtB } = window.NoesisFormat;
  const upside = dcf?.fv ? (dcf.fv / data.profile.price - 1) * 100 : null;

  const cells = [
    {
      label: 'Fair Value', value: dcf ? fmtPrice(dcf.fv) : 'N/A',
      sub: 'DCF · BASE CASE', subColor: 'var(--text-muted)',
      spark: 'up',
    },
    {
      label: 'Implied Δ',
      value: upside !== null ? (upside >= 0 ? '+' : '') + fmt(upside, 1) + '%' : 'N/A',
      sub: upside >= 0 ? 'UPSIDE' : 'DOWNSIDE',
      subColor: upside >= 0 ? 'var(--green)' : 'var(--red)',
    },
    {
      label: 'FCF · TTM', value: fmtB(data.financials.fcf),
      sub: `${fmt(data.financials.fcfMargin, 1)}% MARGIN`,
      subColor: 'var(--text-muted)',
    },
    {
      label: 'Confidence', value: (scoreData.confidence || 'MEDIUM').toUpperCase(),
      sub: `${scoreData.dataQuality === 'high' ? 3 : 2} / 3 MODELS`,
      subColor: scoreData.confidence === 'High' ? 'var(--green)' : 'var(--amber)',
    },
  ];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {cells.map(c => (
          <div key={c.label} className="card" style={{ padding: '12px 14px' }}>
            <div className="t-eyebrow" style={{ marginBottom: 8 }}>{c.label}</div>
            <div className="t-num-lg">{c.value}</div>
            {c.spark === 'up' && (
              <svg className="spark up" width="100%" height="20" viewBox="0 0 100 20" preserveAspectRatio="none" style={{ marginTop: 8, display: 'block' }}>
                <path d="M0 16 L15 12 L30 14 L45 8 L60 10 L75 4 L100 2"/>
              </svg>
            )}
            <div className="t-meta" style={{ marginTop: 4, color: c.subColor }}>{c.sub}</div>
          </div>
        ))}
      </div>
      {scoreData.expectationsGap && Math.abs(scoreData.expectationsGap) > 8 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', marginBottom: 16,
          background: 'var(--amber-bg)',
          border: '1px solid var(--amber-border)',
          color: 'var(--amber)',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11, letterSpacing: '0.04em',
        }}>
          <span>⚠</span>
          Market implies <b>{fmt(scoreData.impliedGrowth, 1)}%</b> FCF growth vs <b>{fmt(scoreData.revCAGR || 0, 1)}%</b> historical — significant gap
        </div>
      )}
    </>
  );
}

Object.assign(window, { InvestmentProfile });
