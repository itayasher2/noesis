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

  const scenarioGrowth = Math.min(impliedFCFGrowth * 0.5, 10);
  let scenPV = 0, scenF = fcfBase;
  for (let y = 1; y <= 10; y++) { scenF *= (1 + scenarioGrowth/100); scenPV += scenF / Math.pow(1 + wacc, y); }
  const scenTV = scenF * (1 + tgr) / (wacc - tgr);
  const scenEV = scenPV + scenTV / Math.pow(1 + wacc, 10);
  const scenFV = (scenEV - netDebt) / shares;
  const scenDownside = price > 0 ? (scenFV / price - 1) * 100 : null;

  const revArr = history.filter(r => r.revenue && r.revenue > 0);
  const fcfArr = history.filter(r => r.fcf && r.fcf > 0);
  const niArr  = history.filter(r => r.netIncome && r.netIncome > 0);

  const histRevCAGR = revArr.length >= 2 ? ((revArr[revArr.length-1].revenue / revArr[0].revenue) ** (1/(revArr.length-1)) - 1) * 100 : null;
  const histFCFCAGR = fcfArr.length >= 2 ? ((fcfArr[fcfArr.length-1].fcf / fcfArr[0].fcf) ** (1/(fcfArr.length-1)) - 1) * 100 : null;
  const histNICAGR  = niArr.length >= 2  ? ((niArr[niArr.length-1].netIncome / niArr[0].netIncome) ** (1/(niArr.length-1)) - 1) * 100 : null;

  const analystRevGrowth = estimates[0]?.revenueAvg && data.financials.revenue ? ((estimates[0].revenueAvg / data.financials.revenue) - 1) * 100 : null;
  const analystNIGrowth  = estimates[0]?.netIncomeAvg && data.financials.netIncome ? ((estimates[0].netIncomeAvg / data.financials.netIncome) - 1) * 100 : null;
  const analystEPSGrowth = estimates[0]?.epsAvg && data.multiples.eps ? ((estimates[0].epsAvg / data.multiples.eps) - 1) * 100 : null;

  const safeAnalystRev = analystRevGrowth && Math.abs(analystRevGrowth) < 50 ? analystRevGrowth : null;
  const safeAnalystNI  = analystNIGrowth  && Math.abs(analystNIGrowth)  < 50 ? analystNIGrowth  : null;
  const safeAnalystEPS = analystEPSGrowth && Math.abs(analystEPSGrowth) < 50 ? analystEPSGrowth : null;

  const impliedRevGrowth = impliedFCFGrowth * 0.7;
  const currentFCFMargin = data.financials.fcfMargin || 0;
  const impliedFCFMargin = currentFCFMargin * (1 + impliedFCFGrowth / 100);
  const impliedMarginExp = impliedFCFMargin - currentFCFMargin;

  const fcfGap = impliedFCFGrowth - (histFCFCAGR || 0);
  const revGap = impliedRevGrowth - (histRevCAGR || 0);

  const growthRisk   = fcfGap > 10 ? 'high' : fcfGap > 4 ? 'medium' : 'low';
  const marginRisk   = impliedMarginExp > 5 ? 'high' : impliedMarginExp > 2 ? 'medium' : 'low';
  const multipleRisk = data.multiples.pe && data.multiples.pe > 30 ? 'high' : data.multiples.pe > 20 ? 'medium' : 'low';

  const riskColor = (r) => r === 'high' ? 'var(--red)' : r === 'medium' ? 'var(--amber)' : 'var(--green)';
  const riskBg    = (r) => r === 'high' ? 'var(--red-bg)' : r === 'medium' ? 'var(--amber-bg)' : 'var(--green-bg)';
  const riskBdr   = (r) => r === 'high' ? 'var(--red)' : r === 'medium' ? 'var(--amber)' : 'var(--green)';

  const overallRisk = [growthRisk, marginRisk, multipleRisk].filter(r => r === 'high').length >= 2 ? 'high'
    : [growthRisk, marginRisk, multipleRisk].filter(r => r === 'medium').length >= 2 ? 'medium' : 'low';

  const headline = overallRisk === 'high'
    ? 'Market requires aggressive growth far above history — execution risk elevated'
    : overallRisk === 'medium'
    ? 'Market pricing moderate growth acceleration — achievable but requires execution'
    : 'Market expectations broadly aligned with fundamentals';

  const gapColor = (gap) => gap === null ? 'var(--text-muted)' : gap > 8 ? 'var(--red)' : gap > 3 ? 'var(--amber)' : 'var(--green)';

  const C = {
    p: { color:'var(--text-primary)' },
    s: { color:'var(--text-secondary)' },
    m: { color:'var(--text-muted)' },
    card: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', boxShadow:'var(--shadow)' },
    sub: { background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)' },
    bdr: { borderBottom:'1px solid var(--border)' },
  };

  return (
    <div className="fade-in">

      {/* Headline */}
      <div className="rounded-xl p-4 mb-4 border-l-4" style={{background:riskBg(overallRisk),borderLeftColor:riskColor(overallRisk)}}>
        <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>Market Implied Expectations</div>
        <div className="text-sm font-semibold" style={{color:riskColor(overallRisk)}}>
          {overallRisk==='high'?'⚠️':overallRisk==='medium'?'⚡':'✅'} {headline}
        </div>
        <div className="text-xs mt-1" style={C.s}>
          WACC {dcfParams?.wacc}% · TGR {dcfParams?.tgr}%
        </div>
      </div>

      {/* Key metrics — 2x2 on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          {label:'Implied FCF Growth', value:fmt(impliedFCFGrowth,1)+'%', color:impliedFCFGrowth>15?'var(--red)':impliedFCFGrowth>8?'var(--amber)':'var(--green)'},
          {label:'Implied Rev Growth', value:fmt(impliedRevGrowth,1)+'%', color:'var(--accent)'},
          {label:'Terminal Growth', value:fmt(tgr*100,1)+'%', color:'var(--text-secondary)'},
          {label:'FCF Gap vs History', value:(fcfGap>=0?'+':'')+fmt(fcfGap,1)+'pp', color:gapColor(fcfGap)},
        ].map(item=>(
          <div key={item.label} style={C.sub} className="p-3">
            <div className="text-xs mb-1" style={C.m}>{item.label}</div>
            <div className="text-lg font-black num" style={{color:item.color}}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div style={C.card} className="p-4 mb-4">
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>
          Growth Expectations — Market vs Reality
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{minWidth:320}}>
            <thead>
              <tr className="text-xs" style={{...C.m,...C.bdr}}>
                <th className="pb-2 text-left">Metric</th>
                <th className="pb-2 text-right">Market</th>
                <th className="pb-2 text-right">Historical</th>
                <th className="pb-2 text-right">Gap</th>
              </tr>
            </thead>
            <tbody>
              {[
                {metric:'FCF Growth', market:impliedFCFGrowth, historical:histFCFCAGR, isKey:true},
                {metric:'Revenue Growth', market:impliedRevGrowth, historical:histRevCAGR, isKey:false},
                {metric:'Net Income', market:null, historical:histNICAGR, isKey:false},
              ].map((r,i)=>{
                const gap = r.market!==null&&r.historical!==null ? r.market-r.historical : null;
                return(
                  <tr key={i} style={{...C.bdr,background:r.isKey?'var(--accent-subtle)':'transparent'}}>
                    <td className="py-2 font-medium text-xs" style={{color:r.isKey?'var(--accent)':'var(--text-primary)'}}>{r.metric}{r.isKey&&' ★'}</td>
                    <td className="py-2 text-right num text-xs font-bold" style={{color:r.market!==null?gapColor(r.market-(r.historical||0)):'var(--text-muted)'}}>
                      {r.market!==null?fmt(r.market,1)+'%':'—'}
                    </td>
                    <td className="py-2 text-right num text-xs" style={C.s}>{r.historical!==null?fmt(r.historical,1)+'%':'—'}</td>
                    <td className="py-2 text-right num text-xs font-bold">
                      {gap!==null?<span style={{color:gapColor(gap)}}>{gap>=0?'+':''}{fmt(gap,1)}pp</span>:<span style={C.m}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk breakdown — 1 col mobile, 3 col desktop */}
      <div style={C.card} className="p-4 mb-4">
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>Execution Risk Breakdown</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {label:'Growth Gap Risk', risk:growthRisk, detail:`Implies ${fmt(impliedFCFGrowth,1)}% FCF vs ${histFCFCAGR!==null?fmt(histFCFCAGR,1)+'% hist.':'N/A'}`},
            {label:'Margin Expansion Risk', risk:marginRisk, detail:`+${fmt(impliedMarginExp,1)}pp FCF margin needed from ${fmt(currentFCFMargin,1)}% current`},
            {label:'Multiple Risk', risk:multipleRisk, detail:`${data.multiples.pe?fmt(data.multiples.pe,1)+'x P/E':' N/A'} — ${multipleRisk==='high'?'elevated valuation':multipleRisk==='medium'?'moderate premium':'reasonable multiple'}`},
          ].map((item,i)=>(
            <div key={i} className="rounded-xl p-3" style={{background:riskBg(item.risk),border:`1px solid ${riskBdr(item.risk)}`}}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-bold" style={C.m}>{item.label}</div>
                <span className="text-xs px-2 py-0.5 rounded font-bold capitalize" style={{background:riskColor(item.risk)+'20',color:riskColor(item.risk)}}>{item.risk}</span>
              </div>
              <div className="text-xs leading-relaxed" style={C.s}>{item.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scenario — 1 col mobile, 2 col desktop */}
      <div style={C.card} className="p-4 mb-4">
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>What If Growth Disappoints?</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="rounded-xl p-3" style={{background:'var(--accent-subtle)',border:'1px solid var(--accent)'}}>
            <div className="text-xs mb-1" style={C.m}>Market Scenario</div>
            <div className="text-xl font-black num" style={{color:'var(--accent)'}}>{fmt(impliedFCFGrowth,1)}% FCF growth</div>
            <div className="text-xs mt-1" style={C.s}>Justifies {fmtPrice(price)}</div>
          </div>
          <div className="rounded-xl p-3" style={{background:scenDownside&&scenDownside<-15?'var(--red-bg)':'var(--amber-bg)',border:`1px solid ${scenDownside&&scenDownside<-15?'var(--red)':'var(--amber)'}`}}>
            <div className="text-xs mb-1" style={C.m}>Realistic Scenario ({fmt(scenarioGrowth,1)}%)</div>
            <div className="text-xl font-black num" style={{color:scenDownside&&scenDownside<-15?'var(--red)':'var(--amber)'}}>
              {scenFV>0?fmtPrice(scenFV):'N/A'}
            </div>
            <div className="text-xs mt-1" style={{color:scenDownside&&scenDownside<0?'var(--red)':'var(--green)'}}>
              {scenDownside!==null?`${scenDownside>=0?'+':''}${fmt(scenDownside,1)}% vs price`:''}
            </div>
          </div>
        </div>
      </div>

      {/* What needs to happen — 2 col always */}
      <div style={C.card} className="p-4">
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>What Needs To Happen To Justify Today's Price</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            {label:'FCF Growth Required', value:fmt(impliedFCFGrowth,1)+'%/yr', context:`${history.length}Y sustained`, risk:growthRisk},
            {label:'Revenue Growth', value:fmt(impliedRevGrowth,1)+'%/yr', context:`vs ${histRevCAGR!==null?fmt(histRevCAGR,1)+'% hist.':'N/A'}`, risk:revGap>8?'high':revGap>3?'medium':'low'},
            {label:'FCF Margin Required', value:fmt(impliedFCFMargin,1)+'%', context:`+${fmt(impliedMarginExp,1)}pp expansion`, risk:marginRisk},
            {label:'Terminal Growth', value:fmt(tgr*100,1)+'%', context:'After year 10', risk:tgr*100>3.5?'medium':'low'},
          ].map((item,i)=>(
            <div key={i} className="rounded-lg p-3" style={{background:riskBg(item.risk),border:`1px solid ${riskBdr(item.risk)}`}}>
              <div className="text-xs mb-1 font-medium" style={C.m}>{item.label}</div>
              <div className="text-base font-black num" style={{color:riskColor(item.risk)}}>{item.value}</div>
              <div className="text-xs mt-1" style={C.s}>{item.context}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
