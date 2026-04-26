import { fmt, fmtB, fmtPrice } from '../utils/format';

export default function MarketExpectations({ data, dcfParams }) {
  const price = data.profile.price;
  const shares = data.profile.shares;
  const netDebt = data.financials.netDebt;
  const fcfBase = data.financials.fcf;
  const history = data.history || [];
  const estimates = data.estimates || [];

  const wacc = (dcfParams?.wacc || 10) / 100;
  const tgr  = (dcfParams?.tgr  || 3)  / 100;
  const g1   = (dcfParams?.g1   || 10) / 100;

  // ── Reverse DCF — Implied FCF growth ──
  const targetEV = price * shares + netDebt;
  let lo = -0.1, hi = 0.8, mid = 0;
  for (let i = 0; i < 80; i++) {
    mid = (lo + hi) / 2;
    let f = fcfBase, pv = 0;
    for (let y = 1; y <= 10; y++) { f *= (1 + mid); pv += f / Math.pow(1 + wacc, y); }
    const tv = f * (1 + tgr) / (wacc - tgr);
    const ev = pv + tv / Math.pow(1 + wacc, 10);
    if (ev > targetEV) hi = mid; else lo = mid;
  }
  const impliedFCFGrowth = mid * 100;

  // ── Scenario: if growth = realistic ──
  const scenarioGrowth = Math.min(impliedFCFGrowth * 0.5, 10); // half of implied or max 10%
  let scenPV = 0, scenF = fcfBase;
  for (let y = 1; y <= 10; y++) { scenF *= (1 + scenarioGrowth/100); scenPV += scenF / Math.pow(1 + wacc, y); }
  const scenTV = scenF * (1 + tgr) / (wacc - tgr);
  const scenEV = scenPV + scenTV / Math.pow(1 + wacc, 10);
  const scenFV = (scenEV - netDebt) / shares;
  const scenDownside = price > 0 ? (scenFV / price - 1) * 100 : null;

  // ── Historical CAGRs ──
  const revArr = history.filter(r => r.revenue && r.revenue > 0);
  const fcfArr = history.filter(r => r.fcf && r.fcf > 0);
  const niArr  = history.filter(r => r.netIncome && r.netIncome > 0);

  const histRevCAGR = revArr.length >= 2
    ? ((revArr[revArr.length-1].revenue / revArr[0].revenue) ** (1/(revArr.length-1)) - 1) * 100 : null;
  const histFCFCAGR = fcfArr.length >= 2
    ? ((fcfArr[fcfArr.length-1].fcf / fcfArr[0].fcf) ** (1/(fcfArr.length-1)) - 1) * 100 : null;
  const histNICAGR = niArr.length >= 2
    ? ((niArr[niArr.length-1].netIncome / niArr[0].netIncome) ** (1/(niArr.length-1)) - 1) * 100 : null;

  // ── Analyst estimates — only use if reasonable (<50%) ──
  const analystRevGrowth = estimates[0]?.revenueAvg && data.financials.revenue
    ? ((estimates[0].revenueAvg / data.financials.revenue) - 1) * 100 : null;
  const analystNIGrowth = estimates[0]?.netIncomeAvg && data.financials.netIncome
    ? ((estimates[0].netIncomeAvg / data.financials.netIncome) - 1) * 100 : null;
  const analystEPSGrowth = estimates[0]?.epsAvg && data.multiples.eps
    ? ((estimates[0].epsAvg / data.multiples.eps) - 1) * 100 : null;

  const safeAnalystRev = analystRevGrowth && Math.abs(analystRevGrowth) < 50 ? analystRevGrowth : null;
  const safeAnalystNI  = analystNIGrowth  && Math.abs(analystNIGrowth)  < 50 ? analystNIGrowth  : null;
  const safeAnalystEPS = analystEPSGrowth && Math.abs(analystEPSGrowth) < 50 ? analystEPSGrowth : null;

  const impliedRevGrowth   = impliedFCFGrowth * 0.7;
  const currentFCFMargin   = data.financials.fcfMargin || 0;
  const impliedFCFMargin   = currentFCFMargin * (1 + impliedFCFGrowth / 100);
  const impliedMarginExp   = impliedFCFMargin - currentFCFMargin;

  const fcfGap    = impliedFCFGrowth - (histFCFCAGR || 0);
  const revGap    = impliedRevGrowth - (histRevCAGR || 0);
  const marginGap = impliedMarginExp;

  // ── Risk breakdown ──
  const growthRisk   = fcfGap > 10 ? 'high' : fcfGap > 4 ? 'medium' : 'low';
  const marginRisk   = impliedMarginExp > 5 ? 'high' : impliedMarginExp > 2 ? 'medium' : 'low';
  const multipleRisk = data.multiples.pe && data.multiples.pe > 30 ? 'high' : data.multiples.pe > 20 ? 'medium' : 'low';

  const riskColor = (r) => r === 'high' ? 'var(--red)' : r === 'medium' ? 'var(--amber)' : 'var(--green)';
  const riskBg    = (r) => r === 'high' ? 'var(--red-bg)' : r === 'medium' ? 'var(--amber-bg)' : 'var(--green-bg)';
  const riskBdr   = (r) => r === 'high' ? 'var(--red)' : r === 'medium' ? 'var(--amber)' : 'var(--green)';

  // ── Headline ──
  const overallRisk = [growthRisk, marginRisk, multipleRisk].filter(r => r === 'high').length >= 2
    ? 'high' : [growthRisk, marginRisk, multipleRisk].filter(r => r === 'medium').length >= 2
    ? 'medium' : 'low';

  const headline = overallRisk === 'high'
    ? `Market requires aggressive growth far above history — execution risk elevated`
    : overallRisk === 'medium'
    ? `Market pricing moderate growth acceleration — achievable but requires execution`
    : `Market expectations broadly aligned with fundamentals — limited execution risk`;

  const C = {
    p: { color:'var(--text-primary)' },
    s: { color:'var(--text-secondary)' },
    m: { color:'var(--text-muted)' },
    card: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', boxShadow:'var(--shadow)' },
    sub: { background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)' },
    bdr: { borderBottom:'1px solid var(--border)' },
  };

  const gapColor = (gap) => gap === null ? 'var(--text-muted)' : gap > 8 ? 'var(--red)' : gap > 3 ? 'var(--amber)' : 'var(--green)';

  return (
    <div className="fade-in">

      {/* ── Headline ── */}
      <div className="rounded-xl p-4 mb-5 border-l-4" style={{background: riskBg(overallRisk), borderLeftColor: riskColor(overallRisk)}}>
        <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>Market Implied Expectations</div>
        <div className="text-sm font-semibold" style={{color: riskColor(overallRisk)}}>
          {overallRisk === 'high' ? '⚠️' : overallRisk === 'medium' ? '⚡' : '✅'} {headline}
        </div>
        <div className="text-xs mt-1" style={C.s}>
          Based on current price of {fmtPrice(price)} and DCF assumptions (WACC {dcfParams?.wacc}%, TGR {dcfParams?.tgr}%)
        </div>
      </div>

      {/* ── What market is pricing ── */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          {
            label:'Implied FCF Growth',
            value: fmt(impliedFCFGrowth,1)+'%',
            sub:'For next 10Y (high-growth phase)',
            color: impliedFCFGrowth > 15 ? 'var(--red)' : impliedFCFGrowth > 8 ? 'var(--amber)' : 'var(--green)',
            border: true,
          },
          {
            label:'Implied Rev Growth',
            value: fmt(impliedRevGrowth,1)+'%',
            sub:'Approximate (FCF-derived)',
            color:'var(--accent)',
            border: false,
          },
          {
            label:'Terminal Growth',
            value: fmt(tgr*100,1)+'%',
            sub:'After year 10 (your assumption)',
            color:'var(--text-secondary)',
            border: false,
          },
          {
            label:'FCF Gap vs History',
            value: (fcfGap >= 0 ? '+' : '')+fmt(fcfGap,1)+'pp',
            sub:'Market vs historical CAGR',
            color: gapColor(fcfGap),
            border: false,
          },
        ].map(item => (
          <div key={item.label} style={{...C.sub, border: item.border ? `1px solid ${item.color}` : '1px solid var(--border)'}} className="p-3">
            <div className="text-xs mb-1" style={C.m}>{item.label}</div>
            <div className="text-xl font-black num" style={{color:item.color}}>{item.value}</div>
            <div className="text-xs mt-1" style={C.m}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Comparison table ── */}
      <div style={C.card} className="p-4 mb-4">
        <div className="text-xs font-bold uppercase tracking-widest mb-4" style={C.m}>
          Growth Expectations — Market vs Reality
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs" style={{...C.m,...C.bdr}}>
                <th className="pb-3 text-left">Metric</th>
                <th className="pb-3 text-right">Market Pricing</th>
                <th className="pb-3 text-right">Historical ({history.length}Y)</th>
                <th className="pb-3 text-right"> Analyst (NTM)</th>
                <th className="pb-3 text-right">Gap</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric:'FCF Growth', market: impliedFCFGrowth, historical: histFCFCAGR, analyst: null, isKey: true },
                { metric:'Revenue Growth', market: impliedRevGrowth, historical: histRevCAGR, analyst: safeAnalystRev, isKey: false },
                { metric:'Net Income Growth', market: null, historical: histNICAGR, analyst: safeAnalystNI, isKey: false },
                { metric:'EPS Growth', market: null, historical: null, analyst: safeAnalystEPS, isKey: false },
              ].map((r, i) => {
                const gap = r.market !== null && r.historical !== null ? r.market - r.historical : null;
                return (
                  <tr key={i} style={{...C.bdr, background: r.isKey ? 'var(--accent-subtle)' : 'transparent'}}>
                    <td className="py-2.5 font-medium" style={{color: r.isKey ? 'var(--accent)' : 'var(--text-primary)'}}>
                      {r.metric} {r.isKey && <span className="text-xs ml-1" style={C.m}>← key</span>}
                    </td>
                    <td className="py-2.5 text-right num font-bold" style={{color: r.market !== null ? gapColor(r.market - (r.historical||0)) : 'var(--text-muted)'}}>
                      {r.market !== null ? fmt(r.market,1)+'%' : '—'}
                    </td>
                    <td className="py-2.5 text-right num" style={C.s}>
                      {r.historical !== null ? fmt(r.historical,1)+'%' : '—'}
                    </td>
                    <td className="py-2.5 text-right num" style={C.s}>
                      {r.analyst !== null ? fmt(r.analyst,1)+'%' : <span style={C.m}>—</span>}
                    </td>
                    <td className="py-2.5 text-right num font-bold">
                      {gap !== null
                        ? <span style={{color: gapColor(gap)}}>{gap >= 0 ? '+' : ''}{fmt(gap,1)}pp</span>
                        : <span style={C.m}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Risk breakdown ── */}
      <div style={C.card} className="p-4 mb-4">
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>Execution Risk Breakdown</div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            {
              label:'Growth Gap Risk',
              risk: growthRisk,
              detail: `Market implies ${fmt(impliedFCFGrowth,1)}% FCF growth vs ${histFCFCAGR !== null ? fmt(histFCFCAGR,1)+'% historical' : 'N/A'}`,
            },
            {
              label:'Margin Expansion Risk',
              risk: marginRisk,
              detail: `Requires +${fmt(impliedMarginExp,1)}pp FCF margin expansion from ${fmt(currentFCFMargin,1)}% current`,
            },
            {
              label:'Multiple Compression Risk',
              risk: multipleRisk,
              detail: `Trading at ${data.multiples.pe ? fmt(data.multiples.pe,1)+'x P/E' : 'N/A'} — ${multipleRisk === 'high' ? 'elevated valuation leaves little margin of safety' : multipleRisk === 'medium' ? 'moderate premium requires growth delivery' : 'reasonable multiple provides some cushion'}`,
            },
          ].map((item, i) => (
            <div key={i} className="rounded-xl p-3" style={{background: riskBg(item.risk), border:`1px solid ${riskBdr(item.risk)}`}}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-bold" style={C.m}>{item.label}</div>
                <span className="text-xs px-2 py-0.5 rounded font-bold capitalize" style={{background: riskColor(item.risk)+'20', color: riskColor(item.risk)}}>
                  {item.risk}
                </span>
              </div>
              <div className="text-xs leading-relaxed" style={C.s}>{item.detail}</div>
            </div>
          ))}
        </div>
        <div className="text-xs px-3 py-2 rounded-lg" style={C.sub}>
          <span style={C.m}>Primary risk driver: </span>
          <span className="font-medium" style={{color: riskColor(growthRisk === 'high' ? 'high' : marginRisk === 'high' ? 'high' : 'medium')}}>
            {growthRisk === 'high' ? 'Unrealistic growth expectations dominate execution risk'
             : marginRisk === 'high' ? 'Significant margin expansion required — historically difficult'
             : 'Multiple compression if growth disappoints'}
          </span>
        </div>
      </div>

      {/* ── Valuation link — what if growth = realistic ── */}
      <div style={C.card} className="p-4 mb-4">
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>
          Valuation Sensitivity — What If Growth Disappoints?
        </div>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="rounded-xl p-4" style={{background:'var(--accent-subtle)', border:'1px solid var(--accent)'}}>
            <div className="text-xs mb-1" style={C.m}>Market Scenario (implied)</div>
            <div className="text-2xl font-black num" style={{color:'var(--accent)'}}>{fmt(impliedFCFGrowth,1)}% FCF growth</div>
            <div className="text-xs mt-1" style={C.s}>For 10 years → justifies {fmtPrice(price)}</div>
          </div>
          <div className="rounded-xl p-4" style={{background: scenDownside && scenDownside < -15 ? 'var(--red-bg)' : 'var(--amber-bg)', border:`1px solid ${scenDownside && scenDownside < -15 ? 'var(--red)' : 'var(--amber)'}`}}>
            <div className="text-xs mb-1" style={C.m}>Realistic Scenario ({fmt(scenarioGrowth,1)}% growth)</div>
            <div className="text-2xl font-black num" style={{color: scenDownside && scenDownside < -15 ? 'var(--red)' : 'var(--amber)'}}>
              {scenFV > 0 ? fmtPrice(scenFV) : 'N/A'}
            </div>
            <div className="text-xs mt-1" style={{color: scenDownside && scenDownside < 0 ? 'var(--red)' : 'var(--green)'}}>
              {scenDownside !== null ? `${scenDownside >= 0 ? '+' : ''}${fmt(scenDownside,1)}% vs current price` : ''}
            </div>
          </div>
        </div>
        <div className="text-xs px-3 py-2 rounded-lg" style={C.sub}>
          💡 If FCF growth comes in at <strong>{fmt(scenarioGrowth,1)}%</strong> (half of market implied) instead of <strong>{fmt(impliedFCFGrowth,1)}%</strong>,
          fair value drops to <strong>{scenFV > 0 ? fmtPrice(scenFV) : 'N/A'}</strong>
          {scenDownside !== null && ` — a ${fmt(Math.abs(scenDownside),1)}% ${scenDownside < 0 ? 'downside' : 'upside'} from current price`}
        </div>
      </div>

      {/* ── What needs to happen ── */}
      <div style={C.card} className="p-4">
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>
          What Needs To Happen For Today's Price To Be Justified
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label:'FCF Growth Required',
              value: fmt(impliedFCFGrowth,1)+'% annually',
              context:`For the next 10 years (high-growth phase), then ${fmt(tgr*100,1)}% terminal`,
              risk: growthRisk,
            },
            {
              label:'Revenue Growth Required',
              value: fmt(impliedRevGrowth,1)+'% annually',
              context:`vs ${histRevCAGR !== null ? fmt(histRevCAGR,1)+'% historical CAGR ('+history.length+'Y)' : 'N/A historical'}`,
              risk: revGap > 8 ? 'high' : revGap > 3 ? 'medium' : 'low',
            },
            {
              label:'FCF Margin Required',
              value: fmt(impliedFCFMargin,1)+'%',
              context:`vs ${fmt(currentFCFMargin,1)}% current — requires +${fmt(impliedMarginExp,1)}pp expansion`,
              risk: marginRisk,
            },
            {
              label:'Terminal Growth Assumed',
              value: fmt(tgr*100,1)+'%',
              context:'After year 10 — your DCF model assumption',
              risk: tgr*100 > 3.5 ? 'medium' : 'low',
            },
          ].map((item, i) => (
            <div key={i} className="rounded-lg p-3" style={{
              background: riskBg(item.risk),
              border:`1px solid ${riskBdr(item.risk)}`,
            }}>
              <div className="text-xs mb-1 font-medium" style={C.m}>{item.label}</div>
              <div className="text-lg font-black num" style={{color: riskColor(item.risk)}}>{item.value}</div>
              <div className="text-xs mt-1" style={C.s}>{item.context}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}