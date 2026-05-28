import { fmt, fmtPrice } from '../utils/format';

function calcDecision({ scoreData, dcf, price, data, dcfParams }) {
  const upside = dcf?.fv && price ? (dcf.fv / price - 1) * 100 : null;
  const composite = scoreData?.composite || 50;
  const fcfBase = data.financials.fcf;
  const shares = data.profile.shares;
  const netDebt = data.financials.netDebt;
  const wacc = (dcfParams?.wacc || 10) / 100;
  const tgr = (dcfParams?.tgr || 3) / 100;

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
  const impliedGrowth = mid * 100;

  const history = data.history || [];
  const fcfArr = history.filter(r => r.fcf && r.fcf > 0);
  const histFCFCAGR = fcfArr.length >= 2
    ? ((fcfArr[fcfArr.length-1].fcf / fcfArr[0].fcf) ** (1/(fcfArr.length-1)) - 1) * 100 : null;
  const fcfGap = impliedGrowth - (histFCFCAGR || 0);

  let action, conviction, primaryColor, bgColor, borderColor, reasons, actionSteps;

  if (composite >= 70 && upside > 20) {
    action = 'BUY'; conviction = upside > 40 ? 'High' : 'Medium';
    primaryColor = '#065f46'; bgColor = '#f8fdfb'; borderColor = '#a7f3d0';
    reasons = [
      upside ? `Undervalued ~${fmt(Math.abs(upside),0)}% vs intrinsic value` : 'Trading below fair value',
      fcfGap < 3 ? 'Market pricing reasonable growth' : 'Growth expectations manageable',
      scoreData?.qualityScore > 60 ? 'High-quality business fundamentals' : 'Solid fundamentals',
    ];
    actionSteps = [
      'Consider initiating or adding position',
      `Entry: ${fmtPrice(dcf?.fv * 0.85)}–${fmtPrice(dcf?.fv * 0.95)}`,
      `Target: ${fmtPrice(dcf?.fv)}`,
    ];
  } else if (composite >= 45 && upside > -10) {
    action = 'HOLD'; conviction = 'Medium';
    primaryColor = '#78350f'; bgColor = '#fdfaf5'; borderColor = '#e5d5b0';
    reasons = [
      upside ? `Near fair value (${upside >= 0 ? '+' : ''}${fmt(upside,0)}% vs DCF)` : 'Near fair value',
      fcfGap > 5 ? 'Market pricing above-average growth' : 'Growth expectations reasonable',
      'Monitor execution vs expectations',
    ];
    actionSteps = [
      'Hold existing position',
      `Better entry: ${dcf?.fv ? fmtPrice(dcf.fv * 0.85) : 'N/A'}`,
      'Watch next earnings',
    ];
  } else if (composite >= 25) {
    action = 'REDUCE'; conviction = 'Medium';
    primaryColor = '#92400e'; bgColor = '#fffbf5'; borderColor = '#e5d0b0';
    reasons = [
      upside ? `Overvalued ~${fmt(Math.abs(upside),0)}% vs intrinsic value` : 'Trading above fair value',
      fcfGap > 8 ? 'Market pricing unrealistic growth' : 'Execution risk elevated',
      'Limited margin of safety at current levels',
    ];
    actionSteps = [
      'Consider trimming position',
      `Fair value: ${dcf?.fv ? fmtPrice(dcf.fv) : 'N/A'}`,
      `Better entry: ${dcf?.fv ? fmtPrice(dcf.fv * 0.80) : 'N/A'}`,
    ];
  } else {
    action = 'AVOID'; conviction = 'High';
    primaryColor = '#991b1b'; bgColor = '#fff8f8'; borderColor = '#e5b0b0';
    reasons = [
      upside ? `Significantly overvalued ~${fmt(Math.abs(upside),0)}%` : 'Trading well above fair value',
      fcfGap > 10 ? 'Aggressive growth priced in — high risk' : 'Valuation risk extreme',
      'Risk/reward highly unfavorable',
    ];
    actionSteps = [
      'Avoid initiating position',
      'Wait for meaningful correction',
      `Potential entry: ${dcf?.fv ? fmtPrice(dcf.fv * 0.75) : 'N/A'}`,
    ];
  }

  const fairValue = dcf?.fv || price;
  const buyZoneLow  = fairValue * 0.75;
  const overvalued  = fairValue * 1.20;
  const extreme     = fairValue * 1.50;
  const pricePct = Math.min(96, Math.max(2, (price - buyZoneLow) / (extreme - buyZoneLow) * 100));

  return { action, conviction, primaryColor, bgColor, borderColor, reasons, actionSteps, upside, impliedGrowth, histFCFCAGR, fcfGap, fairValue, buyZoneLow, overvalued, extreme, pricePct };
}

export default function DecisionBox({ scoreData, dcf, price, data, dcfParams }) {
  if (!data || !price) return null;
  const d = calcDecision({ scoreData, dcf, price, data, dcfParams });
  const isDark = document.documentElement.classList.contains('dark');

  const C = {
    p: { color:'var(--text-primary)' },
    s: { color:'var(--text-secondary)' },
    m: { color:'var(--text-muted)' },
  };

  return (
    <div className="mb-4 fade-in" style={{
      background: isDark ? 'var(--bg-card)' : d.bgColor,
      border: isDark ? `1.5px solid ${d.primaryColor}30` : `1.5px solid ${d.borderColor}`,
      borderRadius: 'var(--radius)',
      padding: '16px',
      boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
    }}>

      {/* ── Hero row ── */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:d.primaryColor,opacity:0.7}}>
            Investment View
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div style={{fontSize:24,fontWeight:600,color:d.primaryColor,letterSpacing:2,lineHeight:1}}>
              {d.action}
            </div>
            <div className="px-2 py-1 rounded-lg text-xs font-bold" style={{background:d.primaryColor+'18',color:d.primaryColor,border:`1px solid ${d.primaryColor}30`}}>
              {d.conviction} Conviction
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs font-bold mb-1" style={{color:d.primaryColor,opacity:0.7}}>vs Fair Value</div>
          <div className="text-2xl font-black num" style={{color:d.upside>=0?'#059669':d.upside>-20?'#92400e':'#991b1b'}}>
            {d.upside!==null?(d.upside>=0?'+':'')+fmt(d.upside,1)+'%':'N/A'}
          </div>
          <div className="text-xs mt-0.5" style={C.m}>{fmtPrice(d.fairValue)} fair value</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{height:1,background:d.primaryColor+'15',marginBottom:14}}/>

      {/* ── Why + Action — stack on mobile ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:d.primaryColor,opacity:0.6}}>Why:</div>
          <div className="flex flex-col gap-1.5">
            {d.reasons.map((r,i)=>(
              <div key={i} className="flex items-start gap-2 text-xs" style={C.s}>
                <span style={{color:d.primaryColor,marginTop:3,flexShrink:0,fontSize:7}}>●</span>
                {r}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:d.primaryColor,opacity:0.6}}>Action:</div>
          <div className="flex flex-col gap-1.5">
            {d.actionSteps.map((a,i)=>(
              <div key={i} className="flex items-start gap-2 text-xs" style={C.s}>
                <span style={{color:d.primaryColor,marginTop:2,flexShrink:0}}>→</span>
                {a}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Price Level Bar ── */}
      <div style={{background:isDark?'var(--bg-subtle)':'rgba(255,255,255,0.5)',borderRadius:10,padding:'12px 14px',marginBottom:14,border:`1px solid ${d.primaryColor}20`}}>
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:d.primaryColor,opacity:0.6}}>Price Levels</div>
        <div className="relative h-7 rounded-lg overflow-hidden" style={{background:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)'}}>
          <div className="absolute inset-y-0 left-0" style={{width:'30%',background:'rgba(5,150,105,0.08)'}}/>
          <div className="absolute inset-y-0" style={{left:'30%',width:'25%',background:'rgba(180,140,60,0.08)'}}/>
          <div className="absolute inset-y-0" style={{left:'55%',width:'25%',background:'rgba(180,100,40,0.08)'}}/>
          <div className="absolute inset-y-0 right-0" style={{left:'80%',background:'rgba(150,30,30,0.08)'}}/>
          <div className="absolute inset-0 flex items-center">
            <span className="text-xs font-medium px-1" style={{color:'#065f46',opacity:0.8,width:'30%',fontSize:10}}>Buy</span>
            <span className="text-xs font-medium px-1" style={{color:'#78350f',opacity:0.8,width:'25%',fontSize:10}}>Fair</span>
            <span className="text-xs font-medium px-1" style={{color:'#92400e',opacity:0.8,width:'25%',fontSize:10}}>Pricey</span>
            <span className="text-xs font-medium px-1" style={{color:'#991b1b',opacity:0.8,fontSize:10}}>Ext.</span>
          </div>
          <div className="absolute top-1 bottom-1 w-0.5 rounded" style={{left:d.pricePct+'%',background:d.primaryColor,opacity:0.8}}/>
          <div className="absolute text-xs font-bold num" style={{
            left:Math.min(85,Math.max(2,d.pricePct))+'%',
            top:'50%',transform:'translateY(-50%)',
            color:d.primaryColor,
            background:isDark?'var(--bg-card)':'white',
            padding:'1px 4px',borderRadius:3,fontSize:9,
            boxShadow:'0 1px 3px rgba(0,0,0,0.08)',
          }}>
            {fmtPrice(price)}
          </div>
        </div>
        <div className="flex justify-between text-xs mt-1.5" style={C.m}>
          <span className="num" style={{fontSize:9}}>{fmtPrice(d.buyZoneLow)}</span>
          <span className="num font-semibold" style={{color:d.primaryColor,fontSize:9}}>{fmtPrice(d.fairValue)}</span>
          <span className="num" style={{fontSize:9}}>{fmtPrice(d.overvalued)}</span>
          <span className="num" style={{fontSize:9}}>{fmtPrice(d.extreme)}</span>
        </div>
      </div>

      {/* ── Confidence strip — wrap on mobile ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{color:d.primaryColor,opacity:0.7}}>
        <span className="font-bold uppercase tracking-widest">Confidence:</span>
        {[['Data',scoreData?.dataQuality],['Models',scoreData?.modelConsistency],['Stability',scoreData?.assumptionStability]].map(([l,v])=>(
          <span key={l} style={{opacity:1}}>
            {l}: <strong style={{color:v==='high'?'#065f46':v==='medium'?'#78350f':'#991b1b'}}>{v||'N/A'}</strong>
          </span>
        ))}
        <span className="w-full sm:w-auto sm:ml-auto text-xs" style={{opacity:1}}>
          Implied: <strong>{fmt(d.impliedGrowth,1)}%</strong> vs <strong>{d.histFCFCAGR!==null?fmt(d.histFCFCAGR,1)+'% hist.':'N/A'}</strong>
        </span>
      </div>

    </div>
  );
}
