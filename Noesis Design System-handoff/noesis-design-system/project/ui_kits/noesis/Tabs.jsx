// ── Tab content panels ────────────────────────────────────────────────
//   Compact recreations of Overview / Valuation / Financials / Analysis / Documents.
//   Now using the Quant Terminal aesthetic — mono labels, hairline tables,
//   sparkline-tinted accents.

function PlaceholderChart({ label, height = 170 }) {
  return (
    <div style={{
      height, borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-subtle)',
      border: '1px dashed var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 8,
      color: 'var(--text-muted)',
      backgroundImage: `
        radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,212,255,0.04) 0%, transparent 70%),
        linear-gradient(180deg, transparent 60%, rgba(0,212,255,0.04) 100%)
      `,
    }}>
      <svg width="180" height="40" viewBox="0 0 180 40" style={{ opacity: 0.7 }}>
        <path d="M0 30 L20 26 L40 28 L60 18 L80 22 L100 12 L120 16 L140 8 L160 14 L180 6"
              fill="none" stroke="var(--accent)" strokeWidth="1.5" />
      </svg>
      <div className="t-meta">{label} · CHART PLACEHOLDER</div>
    </div>
  );
}

function OverviewTab({ data }) {
  const { fmtB, fmtPct, fmt } = window.NoesisFormat;
  const sections = [
    {
      title: 'Profitability', rows: [
        ['Revenue',       fmtB(data.financials.revenue)],
        ['EBITDA',        fmtB(data.financials.ebitda)],
        ['Net Income',    fmtB(data.financials.netIncome)],
        ['FCF',           fmtB(data.financials.fcf)],
        ['Gross Margin',  fmtPct(data.financials.grossMargin)],
        ['EBITDA Margin', fmtPct(data.financials.ebitdaMargin)],
        ['Net Margin',    fmtPct(data.financials.netMargin)],
        ['FCF Margin',    fmtPct(data.financials.fcfMargin)],
      ],
    },
    {
      title: 'Balance Sheet', rows: [
        ['Total Assets', fmtB(data.financials.totalAssets)],
        ['Equity',       fmtB(data.financials.equity)],
        ['Total Debt',   fmtB(data.financials.totalDebt)],
        ['Cash',         fmtB(data.financials.cash)],
        ['Net Debt',     fmtB(data.financials.netDebt)],
        ['ROE',          fmtPct(data.financials.roe)],
        ['ROIC',         fmtPct(data.financials.roic)],
        ['D/E',          data.financials.debtToEquity ? fmt(data.financials.debtToEquity, 2) + 'x' : 'N/A'],
      ],
    },
  ];
  return (
    <div>
      <PriceChart ticker={data.profile.ticker} basePrice={data.profile.price} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28, marginTop: 24 }}>
        {sections.map(s => (
          <div key={s.title}>
            <div className="t-eyebrow" style={{ marginBottom: 12 }}>{s.title}</div>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <tbody>
                {s.rows.map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 0', color: 'var(--text-secondary)' }}>{k}</td>
                    <td className="num" style={{ padding: '7px 0', textAlign: 'right', color: 'var(--text-primary)' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

function ValuationTab({ data, dcfP, setDcfP }) {
  const { fmt, fmtPrice } = window.NoesisFormat;
  const calcDCF = ({ fcf, shares, totalDebt, cash, g1, g2, wacc, tgr }) => {
    if (!fcf || !shares || fcf <= 0) return null;
    let f = fcf, pv = 0;
    for (let y = 1; y <= 10; y++) { f *= (1 + (y <= 5 ? g1 : g2)); pv += f / Math.pow(1 + wacc, y); }
    const tv = f * (1 + tgr) / (wacc - tgr);
    const pvTV = tv / Math.pow(1 + wacc, 10);
    const nd = (totalDebt || 0) - (cash || 0);
    return { fv: (pv + pvTV - nd) / shares };
  };
  const dcf = calcDCF({
    fcf: data.financials.fcf, shares: data.profile.shares,
    totalDebt: data.financials.totalDebt, cash: data.financials.cash,
    g1: dcfP.g1/100, g2: dcfP.g2/100, wacc: dcfP.wacc/100, tgr: dcfP.tgr/100,
  });
  const price = data.profile.price;
  const upside = dcf && price ? (dcf.fv / price - 1) * 100 : null;

  const params = [
    { key: 'g1',   label: 'Growth Y1–5 (%)' },
    { key: 'g2',   label: 'Growth Y6–10 (%)' },
    { key: 'wacc', label: 'WACC (%)' },
    { key: 'tgr',  label: 'Terminal (%)' },
  ];

  return (
    <div>
      <div className="t-eyebrow" style={{ marginBottom: 12 }}>DCF · Inputs</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
        {params.map(p => (
          <div key={p.key}>
            <label className="t-meta" style={{ display: 'block', marginBottom: 6 }}>{p.label}</label>
            <input type="number" step="0.5" value={dcfP[p.key]}
              onChange={e => setDcfP(prev => ({ ...prev, [p.key]: parseFloat(e.target.value) || 0 }))}
              style={{
                width: '100%', height: 36, padding: '0 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: 13, textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
                boxSizing: 'border-box',
              }} />
          </div>
        ))}
      </div>

      <div className="card glow" style={{
        padding: 18, marginBottom: 18,
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, alignItems: 'center',
      }}>
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 6 }}>Fair Value</div>
          <div className="t-num-hero" style={{ fontSize: 32, color: 'var(--accent)' }}>{dcf ? fmtPrice(dcf.fv) : 'N/A'}</div>
        </div>
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 6 }}>Market Price</div>
          <div className="t-num-hero" style={{ fontSize: 26 }}>{fmtPrice(price)}</div>
        </div>
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 6 }}>vs Market</div>
          <div className="t-num-hero" style={{
            fontSize: 26,
            color: upside == null ? 'var(--text-muted)' : upside >= 0 ? 'var(--green)' : 'var(--red)',
          }}>{upside == null ? '—' : (upside >= 0 ? '+' : '') + fmt(upside, 1) + '%'}</div>
        </div>
      </div>

      <KeyMultiples data={data} price={price} />
    </div>
  );
}

function KeyMultiples({ data, price }) {
  const { fmt, fmtPrice } = window.NoesisFormat;
  const rows = [
    { name: 'P/E',        val: data.multiples.pe,        base: data.multiples.eps, target: 20 },
    { name: 'P/E · Fwd',  val: data.multiples.forwardPE, base: data.multiples.eps, target: 18 },
    { name: 'EV/EBITDA',  val: data.multiples.evEbitda,  base: data.financials.ebitda && data.profile.shares ? data.financials.ebitda / data.profile.shares : null, target: 12 },
    { name: 'P/FCF ★',    val: data.multiples.evFcf,     base: data.financials.fcf    && data.profile.shares ? data.financials.fcf    / data.profile.shares : null, target: 20, primary: true },
  ];
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="t-eyebrow" style={{ marginBottom: 12 }}>Key Multiples</div>
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left',  paddingBottom: 8 }}><span className="t-meta">MULTIPLE</span></th>
            <th style={{ textAlign: 'right', paddingBottom: 8 }}><span className="t-meta">CURRENT</span></th>
            <th style={{ textAlign: 'right', paddingBottom: 8 }}><span className="t-meta">FAIR VALUE</span></th>
            <th style={{ textAlign: 'right', paddingBottom: 8 }}><span className="t-meta">VS MARKET</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(m => {
            const fv = m.target && m.base ? m.target * m.base : null;
            const up = fv && price ? (fv / price - 1) * 100 : null;
            return (
              <tr key={m.name} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 0', fontWeight: 500, color: m.primary ? 'var(--green)' : 'var(--text-primary)' }}>{m.name}</td>
                <td className="num" style={{ padding: '8px 0', textAlign: 'right', color: 'var(--text-primary)' }}>{m.val ? fmt(m.val, 1) + 'x' : '—'}</td>
                <td className="num" style={{ padding: '8px 0', textAlign: 'right', color: 'var(--text-primary)' }}>{fv ? fmtPrice(fv) : '—'}</td>
                <td className="num" style={{ padding: '8px 0', textAlign: 'right' }}>
                  {up != null && <span style={{ color: up >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{up >= 0 ? '+' : ''}{fmt(up, 1)}%</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FinancialsTab({ data }) {
  const { fmtB, fmtPct, fmt } = window.NoesisFormat;
  const hist = data.history || [];
  const revArr = hist.filter(r => r.revenue);
  const revCAGR = revArr.length >= 2
    ? ((revArr[revArr.length-1].revenue / revArr[0].revenue) ** (1/(revArr.length-1)) - 1) * 100
    : null;

  return (
    <div>
      <div style={{
        background: 'var(--green-bg)',
        border: '1px solid var(--green-border)',
        borderLeft: '2px solid var(--green)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 14px', marginBottom: 18,
      }}>
        <div className="t-eyebrow" style={{ marginBottom: 4, color: 'var(--green)' }}>Takeaway</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
          {revCAGR > 10 ? `High-growth · ${fmt(revCAGR, 1)}% revenue CAGR`
           : revCAGR > 5 ? `Moderate · ${fmt(revCAGR, 1)}% CAGR`
           : `Mature · ${fmt(revCAGR, 1)}% CAGR`}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn-brand" style={{ height: 32, padding: '0 14px' }}>Annual</button>
        <button className="btn-ghost" style={{ height: 32, padding: '0 14px' }}>Quarterly</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 480 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', paddingBottom: 8 }}><span className="t-meta">METRIC</span></th>
              {hist.map(r => (
                <th key={r.year} className="num" style={{ textAlign: 'right', paddingBottom: 8 }}>
                  <span className="t-meta">{r.year}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Revenue',      'revenue',     false],
              ['EBITDA',       'ebitda',      false],
              ['Net Income',   'netIncome',   false],
              ['FCF',          'fcf',         false],
              ['Gross Margin', 'grossMargin', true],
              ['Net Margin',   'netMargin',   true],
            ].map(([lbl, k, pct]) => (
              <tr key={lbl} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '7px 0', color: 'var(--text-secondary)' }}>{lbl}</td>
                {hist.map(r => (
                  <td key={r.year} className="num" style={{ padding: '7px 0', textAlign: 'right', color: 'var(--text-primary)' }}>
                    {pct ? fmtPct(r[k]) : fmtB(r[k])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalysisTab({ data }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: 18 }}>
        <div className="t-eyebrow" style={{ marginBottom: 10 }}>Investment thesis</div>
        <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)' }}>
          {data.profile.name} trades at a premium reflecting its dominant position in {data.profile.sector.toLowerCase()}.
          Strong FCF generation and disciplined capital allocation support the current valuation,
          though growth expectations leave limited margin of safety at today's price.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          ['Profitability', 'HIGH',   'var(--green)'],
          ['Growth',        'MEDIUM', 'var(--amber)'],
          ['Risk',          'LOW',    'var(--green)'],
          ['Quality',       '9 / 10', 'var(--green)'],
        ].map(([lbl, val, col]) => (
          <div key={lbl} className="card" style={{ padding: '12px 14px' }}>
            <div className="t-eyebrow" style={{ marginBottom: 8 }}>{lbl}</div>
            <div className="t-num-lg" style={{ color: col }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--red-bg)',
        border: '1px solid var(--red-border)',
        borderLeft: '2px solid var(--red)',
        borderRadius: 'var(--radius-sm)',
        padding: 16,
      }}>
        <div className="t-eyebrow" style={{ marginBottom: 10, color: 'var(--red)' }}>⚠ Red flags · risks</div>
        {[
          'Concentration in mature flagship product cycles',
          'Regulatory exposure across major markets',
          'Multiple compression risk if growth slows',
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
            <span style={{ color: 'var(--red)' }}>•</span>{r}
          </div>
        ))}
      </div>

      <div className="card glow" style={{ padding: 18 }}>
        <div className="t-eyebrow" style={{ marginBottom: 8, color: 'var(--accent)' }}>💡 Smart insight · AI</div>
        <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          "The market is pricing in continued multiple expansion that historical reinvestment yields
          don't fully support. Watch capital allocation discipline as the leading indicator of forward returns."
        </div>
      </div>
    </div>
  );
}

function DocumentsTab({ data }) {
  return (
    <div>
      <div className="t-eyebrow" style={{ marginBottom: 12 }}>Official reports · documents</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(data.links || []).map((l, i) => (
          <a key={i} href={l.url} onClick={e => e.preventDefault()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              textDecoration: 'none',
              transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{l.label}</span>
            <span style={{ fontSize: 14, color: 'var(--accent)' }}>↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { OverviewTab, ValuationTab, KeyMultiples, FinancialsTab, AnalysisTab, DocumentsTab, PlaceholderChart });
