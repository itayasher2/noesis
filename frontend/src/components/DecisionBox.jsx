import { fmt, fmtPrice } from '../utils/format';
import { useLanguage } from '../i18n.jsx';

function calcDecision({ scoreData, dcf, price, data, dcfParams, t }) {
  const upside = dcf?.fv && price ? (dcf.fv / price - 1) * 100 : null;
  const composite = scoreData?.composite || 50;
  const fcfBase = data.financials.fcf;
  const shares = data.profile.shares;
  const netDebt = data.financials.netDebt;
  const wacc = (dcfParams?.wacc || 10) / 100;
  const tgr = (dcfParams?.tgr || 3) / 100;

  const targetEV = price * shares + netDebt;
  let impliedGrowth = 0;
  if (fcfBase > 0 && wacc > tgr && shares > 0) {
    let lo = -0.1, hi = 0.8, mid = 0;
    for (let i = 0; i < 80; i++) {
      mid = (lo + hi) / 2;
      let f = fcfBase, pv = 0;
      for (let y = 1; y <= 10; y++) { f *= (1 + mid); pv += f / Math.pow(1 + wacc, y); }
      const tv = f * (1 + tgr) / (wacc - tgr);
      const ev = pv + tv / Math.pow(1 + wacc, 10);
      if (ev > targetEV) hi = mid; else lo = mid;
    }
    impliedGrowth = mid * 100;
  }

  const history = data.history || [];
  const fcfArr = history.filter(r => r.fcf && r.fcf > 0);
  const histFCFCAGR = fcfArr.length >= 2
    ? ((fcfArr[fcfArr.length-1].fcf / fcfArr[0].fcf) ** (1/(fcfArr.length-1)) - 1) * 100 : null;
  const fcfGap = impliedGrowth - (histFCFCAGR || 0);

  let action, conviction, primaryColor, bgColor, borderColor, reasons, actionSteps;

  if (composite >= 70 && upside > 20) {
    action = 'BUY'; conviction = upside > 40 ? 'High' : 'Medium';
    primaryColor = 'var(--green)'; bgColor = 'var(--green-bg)'; borderColor = 'var(--green-border)';
    reasons = [
      upside ? t('reasonUndervalued', fmt(Math.abs(upside),0)) : t('reasonBelowFairValue'),
      fcfGap < 3 ? t('reasonPricingReasonable') : t('reasonGrowthManageable'),
      scoreData?.qualityScore > 60 ? t('reasonHighQuality') : t('reasonSolidFundamentals'),
    ];
    actionSteps = [
      t('actionInitiate'),
      t('actionEntry', fmtPrice(dcf?.fv * 0.85), fmtPrice(dcf?.fv * 0.95)),
      t('actionTarget', fmtPrice(dcf?.fv)),
    ];
  } else if (composite >= 45 && upside > -10) {
    action = 'HOLD'; conviction = 'Medium';
    primaryColor = 'var(--amber)'; bgColor = 'var(--amber-bg)'; borderColor = 'var(--amber-border)';
    reasons = [
      upside ? t('reasonNearFairValue', (upside >= 0 ? '+' : '') + fmt(upside,0)) : t('reasonNearFairValue', '0'),
      fcfGap > 5 ? t('reasonAboveAvgGrowth') : t('reasonGrowthReasonable'),
      t('reasonMonitorExecution'),
    ];
    actionSteps = [
      t('actionHold'),
      t('actionBetterEntry', dcf?.fv ? fmtPrice(dcf.fv * 0.85) : 'N/A'),
      t('actionWatchEarnings'),
    ];
  } else if (composite >= 25) {
    action = 'REDUCE'; conviction = 'Medium';
    primaryColor = 'var(--orange)'; bgColor = 'var(--amber-bg)'; borderColor = 'var(--orange-border)';
    reasons = [
      upside ? t('reasonOvervalued', fmt(Math.abs(upside),0)) : t('reasonAboveFairValue'),
      fcfGap > 8 ? t('reasonUnrealisticGrowth') : t('reasonExecutionRisk'),
      t('reasonLimitedMargin'),
    ];
    actionSteps = [
      t('actionTrim'),
      t('actionFairValue', dcf?.fv ? fmtPrice(dcf.fv) : 'N/A'),
      t('actionBetterEntry', dcf?.fv ? fmtPrice(dcf.fv * 0.80) : 'N/A'),
    ];
  } else {
    action = 'AVOID'; conviction = 'High';
    primaryColor = 'var(--red)'; bgColor = 'var(--red-bg)'; borderColor = 'var(--red-border)';
    reasons = [
      upside ? t('reasonSigOvervalued', fmt(Math.abs(upside),0)) : t('reasonWellAboveFV'),
      fcfGap > 10 ? t('reasonAggressiveGrowth') : t('reasonValuationRisk'),
      t('reasonRiskReward'),
    ];
    actionSteps = [
      t('actionAvoid'),
      t('actionWaitCorrection'),
      t('actionPotentialEntry', dcf?.fv ? fmtPrice(dcf.fv * 0.75) : 'N/A'),
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
  const { t } = useLanguage();
  if (!data || !price) return null;
  const d = calcDecision({ scoreData, dcf, price, data, dcfParams, t });

  const C = {
    p: { color:'var(--text-primary)' },
    s: { color:'var(--text-secondary)' },
    m: { color:'var(--text-muted)' },
  };

  return (
    <div className="mb-4 fade-in verdict-card" style={{
      borderLeftColor: d.primaryColor,
      padding: '16px',
    }}>

      {/* ── Hero row ── */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:d.primaryColor,opacity:0.7}}>
            {t('investmentView')}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div style={{fontSize:24,fontWeight:600,color:d.primaryColor,letterSpacing:2,lineHeight:1}}>
              {d.action}
            </div>
            <div className="px-2 py-1 rounded-lg text-xs font-bold" style={{background:d.primaryColor+'18',color:d.primaryColor,border:`1px solid ${d.primaryColor}30`}}>
              {t('conviction', d.conviction)}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs font-bold mb-1" style={{color:d.primaryColor,opacity:0.7}}>{t('vsFairValue')}</div>
          <div className="text-2xl font-black num" style={{color:d.upside>=0?'var(--green)':d.upside>-20?'var(--amber)':'var(--red)'}}>
            {d.upside!==null?(d.upside>=0?'+':'')+fmt(d.upside,1)+'%':'N/A'}
          </div>
          <div className="text-xs mt-0.5" style={C.m}>{fmtPrice(d.fairValue)} {t('fairValueLc')}</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{height:1,background:d.primaryColor+'15',marginBottom:14}}/>

      {/* ── Why + Action ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:d.primaryColor,opacity:0.6}}>{t('whyLabel')}</div>
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
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:d.primaryColor,opacity:0.6}}>{t('actionLabel')}</div>
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
      <div style={{background:'var(--bg-subtle)',borderRadius:10,padding:'12px 14px',marginBottom:14,border:`1px solid ${d.primaryColor}20`}}>
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:d.primaryColor,opacity:0.6}}>{t('priceLevels')}</div>

        {/* Colored zones only — no text inside overflow:hidden */}
        <div className="relative h-6 rounded-lg overflow-hidden" style={{background:'rgba(255,255,255,0.03)'}}>
          <div className="absolute inset-y-0 left-0" style={{width:'30%',background:'rgba(61,220,132,0.08)'}}/>
          <div className="absolute inset-y-0" style={{left:'30%',width:'25%',background:'rgba(255,181,71,0.06)'}}/>
          <div className="absolute inset-y-0" style={{left:'55%',width:'25%',background:'rgba(255,149,64,0.06)'}}/>
          <div className="absolute inset-y-0 right-0" style={{left:'80%',background:'rgba(255,84,112,0.08)'}}/>
          <div className="absolute top-0.5 bottom-0.5 w-0.5 rounded" style={{left:d.pricePct+'%',background:d.primaryColor,opacity:0.9}}/>
        </div>

        {/* Zone label row */}
        <div className="flex mt-1" style={{fontSize:9}}>
          <span style={{width:'30%',color:'var(--green)',opacity:0.75}}>{t('buyZone')}</span>
          <span style={{width:'25%',color:'var(--amber)',opacity:0.75,textAlign:'center'}}>{t('fairZone')}</span>
          <span style={{width:'25%',color:'var(--orange)',opacity:0.75,textAlign:'center'}}>{t('priceyZone')}</span>
          <span style={{width:'20%',color:'var(--red)',opacity:0.75,textAlign:'right'}}>{t('extZone')}</span>
        </div>

        {/* Boundary prices + current price tag */}
        <div className="flex justify-between items-center mt-0.5">
          <span className="num" style={{fontSize:9,color:'var(--text-muted)'}}>{fmtPrice(d.buyZoneLow)}</span>
          <span className="num font-semibold" style={{color:d.primaryColor,fontSize:9}}>{fmtPrice(d.fairValue)}</span>
          <span className="num" style={{fontSize:9,color:'var(--text-muted)'}}>{fmtPrice(d.overvalued)}</span>
          <span className="num" style={{fontSize:9,color:'var(--text-muted)'}}>{fmtPrice(d.extreme)}</span>
        </div>

        {/* Current price label — positioned below bar, aligned to price % */}
        <div style={{position:'relative',height:16,marginTop:2}}>
          <span className="num font-bold" style={{
            position:'absolute',
            left:`clamp(0%, calc(${d.pricePct}% - 18px), calc(100% - 48px))`,
            fontSize:9,color:d.primaryColor,
            background:'var(--bg-card)',padding:'1px 4px',borderRadius:3,
            border:`1px solid ${d.primaryColor}30`,
            whiteSpace:'nowrap',
          }}>
            ▲ {fmtPrice(price)}
          </span>
        </div>
      </div>

      {/* ── Confidence strip ── */}
      <div style={{color:d.primaryColor,opacity:0.7,fontSize:11}}>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 items-center">
          <span className="font-bold uppercase tracking-widest" style={{fontSize:10}}>{t('confidenceLabel')}</span>
          {[[t('dataLabel'),scoreData?.dataQuality],[t('modelsLabel'),scoreData?.modelConsistency],[t('stabilityLabel'),scoreData?.assumptionStability]].map(([l,v])=>(
            <span key={l} style={{opacity:1,fontSize:10}}>
              {l}: <strong style={{color:v==='high'?'var(--green)':v==='medium'?'var(--amber)':'var(--red)'}}>{v||'N/A'}</strong>
            </span>
          ))}
        </div>
        <div style={{marginTop:3,fontSize:10,opacity:1}}>
          {t('impliedLabel')} <strong>{fmt(d.impliedGrowth,1)}%</strong> vs <strong>{d.histFCFCAGR!==null?fmt(d.histFCFCAGR,1)+'% '+t('histLabel'):'N/A'}</strong>
        </div>
      </div>

    </div>
  );
}
