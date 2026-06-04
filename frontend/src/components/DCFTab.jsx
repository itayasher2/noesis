import { useState, useMemo, useEffect } from 'react';
import { fmt, fmtB, fmtPct, fmtPrice } from '../utils/format';
import { useLanguage } from '../i18n.jsx';
import SensitivityTable from './SensitivityTable';
import Scenarios from './Scenarios';

function calcDCFAdvanced({ fcf, shares, totalDebt, cash, g1, decayRate, wacc, tgr }) {
  if (!fcf || !shares || fcf <= 0) return null;
  if (wacc <= tgr) return null;
  let rate = g1, f = fcf, pv = 0;
  const rows = [];
  for (let y = 1; y <= 10; y++) {
    if (y > 1) rate = rate * (1 - decayRate);
    f = f * (1 + rate);
    const disc = f / Math.pow(1 + wacc, y);
    pv += disc;
    rows.push({ y, fcf: f, pv: disc, cumPV: pv, growthRate: rate });
  }
  const tv = f * (1 + tgr) / (wacc - tgr);
  const pvTV = tv / Math.pow(1 + wacc, 10);
  const nd = (totalDebt || 0) - (cash || 0);
  const fv = (pv + pvTV - nd) / shares;
  return { fv, ev: pv + pvTV, pvTV, tv, rows, pvExplicit: pv };
}

function calcPEValuation({ eps, niGrowth, decayRate, peMultiple, divGrowth, dps, years }) {
  if (!eps || eps <= 0 || !peMultiple || peMultiple <= 0) return null;
  let rate = niGrowth, e = eps;
  for (let y = 1; y <= years; y++) {
    if (y > 1) rate = rate * (1 - decayRate);
    e = e * (1 + rate);
  }
  const futureEPS = e;
  const futurePrice = futureEPS * peMultiple;
  let totalDivs = 0, d = dps || 0;
  for (let y = 1; y <= years; y++) { d = d * (1 + divGrowth); totalDivs += d; }
  const totalValue = futurePrice + totalDivs;
  return { futurePrice, futureEPS, totalDivs, totalValue };
}

function calcCAGR({ fcf, shares, dps, divGrowth, shareChangeRate, g1, decayRate, wacc, tgr, years, currentPrice }) {
  if (!fcf || !shares || fcf <= 0 || currentPrice <= 0) return null;
  if (wacc <= tgr) return null;
  let rate = g1, f = fcf;
  for (let y = 1; y <= years; y++) {
    if (y > 1) rate = rate * (1 - decayRate);
    f = f * (1 + rate);
  }
  const futureShares = shares * Math.pow(1 + shareChangeRate, years);
  const futurePriceFromFCF = (f / futureShares) * (1 / (wacc - tgr));
  let totalDivs = 0, d = dps || 0;
  for (let y = 1; y <= years; y++) { d = d * (1 + divGrowth); totalDivs += d; }
  const totalValue = futurePriceFromFCF + totalDivs;
  const cagr = Math.pow(totalValue / currentPrice, 1 / years) - 1;
  return { futurePrice: futurePriceFromFCF, totalDivs, totalValue, cagr: cagr * 100 };
}

function calcRequiredPrice({ totalValue, targetReturn, years }) {
  if (!totalValue || !targetReturn || !years) return null;
  return totalValue / Math.pow(1 + targetReturn, years);
}

export default function DCFTab({ data, dcfP, setDcfP, dcfMode, setDcfMode, onPEValue, activeModel, setActiveModel }) {
  const { t } = useLanguage();
  const [decayRate, setDecayRate] = useState(0);
  const [divGrowth, setDivGrowth] = useState(4);
  const [shareChange, setShareChange] = useState(-2);
  const [targetReturn, setTargetReturn] = useState(10);
  const [projYears, setProjYears] = useState(5);
  const [manualEPS, setManualEPS] = useState(0);
  const [showEPSHelp, setShowEPSHelp] = useState(false);

  const [peMultiple, setPeMultiple] = useState(() => {
    const histPE = data.multiples?.pe;
    return histPE && histPE > 0 && histPE < 100 ? Math.round(histPE) : 20;
  });
  const [niGrowth, setNiGrowth] = useState(() => {
    const hist = (data.history || []).filter(r => r.netIncome && r.netIncome > 0);
    if (hist.length >= 2) {
      const cagr = ((hist[hist.length-1].netIncome / hist[0].netIncome) ** (1/(hist.length-1)) - 1) * 100;
      return Math.round(Math.min(Math.max(cagr, 0), 50));
    }
    return 15;
  });

  const C = {
    card: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', boxShadow:'var(--shadow)' },
    sub:  { background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)' },
    p:    { color:'var(--text-primary)' },
    s:    { color:'var(--text-secondary)' },
    m:    { color:'var(--text-muted)' },
    bdr:  { borderBottom:'1px solid var(--border)' },
    green:{ color:'var(--green)' },
    red:  { color:'var(--red)' },
    amber:{ color:'var(--amber)' },
    accent:{ color:'var(--accent)' },
  };

  const baseFCF = dcfMode === 'ebitda' ? data.financials.ebitda : data.financials.fcf;
  const price = data.profile.price;
  const ticker = data.profile.ticker;

  const apiEPS = data.multiples?.eps;
  const autoEPS = apiEPS && apiEPS > 0 && apiEPS < 200
    ? apiEPS
    : (data.financials.netIncome && data.profile.shares ? data.financials.netIncome / data.profile.shares : 0);
  const eps = manualEPS > 0 ? manualEPS : autoEPS;
  const epsLooksSuspicious = autoEPS > 50 || autoEPS <= 0;

  // Historical EPS from data
  const historicalEPS = (data.history || [])
    .filter(r => r.eps && r.eps > 0 && r.eps < 500)
    .map(r => ({ year: r.year, eps: r.eps }))
    .slice(-5);

  const hist5yFCF = (data.history || []).filter(r => r.fcf && r.fcf > 0);
  const historicalFCFCAGR = hist5yFCF.length >= 2
    ? ((hist5yFCF[hist5yFCF.length-1].fcf / hist5yFCF[0].fcf) ** (1/(hist5yFCF.length-1)) - 1) * 100 : null;

  const hist5yNI = (data.history || []).filter(r => r.netIncome && r.netIncome > 0);
  const historicalNICAGR = hist5yNI.length >= 2
    ? ((hist5yNI[hist5yNI.length-1].netIncome / hist5yNI[0].netIncome) ** (1/(hist5yNI.length-1)) - 1) * 100 : null;

  const dcf = useMemo(() => calcDCFAdvanced({
    fcf: baseFCF, shares: data.profile.shares,
    totalDebt: data.financials.totalDebt, cash: data.financials.cash,
    g1: dcfP.g1/100, decayRate: decayRate/100, wacc: dcfP.wacc/100, tgr: dcfP.tgr/100,
  }), [baseFCF, data, dcfP, decayRate]);

  const peResult = useMemo(() => calcPEValuation({
    eps, niGrowth: niGrowth/100, decayRate: decayRate/100,
    peMultiple, divGrowth: divGrowth/100,
    dps: data.multiples?.dps || 0, years: projYears,
  }), [eps, niGrowth, decayRate, peMultiple, divGrowth, data, projYears]);

  const cagrResult = useMemo(() => calcCAGR({
    fcf: baseFCF, shares: data.profile.shares, dps: data.multiples.dps || 0,
    divGrowth: divGrowth/100, shareChangeRate: shareChange/100,
    g1: dcfP.g1/100, decayRate: decayRate/100, wacc: dcfP.wacc/100, tgr: dcfP.tgr/100,
    years: projYears, currentPrice: price,
  }), [baseFCF, data, dcfP, decayRate, divGrowth, shareChange, projYears, price]);

  const requiredBuyPrice = cagrResult
    ? calcRequiredPrice({ totalValue: cagrResult.totalValue, targetReturn: targetReturn/100, years: projYears }) : null;

  const peFV = peResult ? peResult.totalValue / Math.pow(1 + dcfP.wacc/100, projYears) : null;
  const peRequiredBuyPrice = peResult
    ? calcRequiredPrice({ totalValue: peResult.totalValue, targetReturn: targetReturn/100, years: projYears }) : null;

  const isOvervalued = dcf && price ? dcf.fv < price : false;
  const upside = dcf && price ? (dcf.fv / price - 1) * 100 : null;
  const peIsOvervalued = peFV && price ? peFV < price : false;
  const peUpside = peFV && price ? (peFV / price - 1) * 100 : null;

  useEffect(() => {
    if (onPEValue) onPEValue(activeModel === 'pe' ? peFV : null);
  }, [activeModel, peFV, onPEValue]);

  return (
    <div className="fade-in">

      {/* Model Toggle */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setActiveModel('dcf')}
          className="px-4 py-1.5 text-xs font-semibold rounded-lg"
          style={{ background: activeModel==='dcf'?'var(--accent)':'var(--bg-subtle)', color: activeModel==='dcf'?'white':'var(--text-muted)', border:'1px solid var(--border)' }}>
          {t('dcfModelBtn')}
        </button>
        <button onClick={() => setActiveModel('pe')}
          className="px-4 py-1.5 text-xs font-semibold rounded-lg"
          style={{ background: activeModel==='pe'?'var(--accent)':'var(--bg-subtle)', color: activeModel==='pe'?'white':'var(--text-muted)', border:'1px solid var(--border)' }}>
          {t('peModelBtn')}
        </button>
        {activeModel === 'dcf' && ['fcf','ebitda'].map(m => (
          <button key={m} onClick={() => setDcfMode(m)}
            className="px-3 py-1.5 text-xs rounded-lg"
            style={{ background: dcfMode===m?'var(--bg-subtle)':'transparent', color: dcfMode===m?'var(--text-primary)':'var(--text-muted)', border:'1px solid var(--border)' }}>
            {m === 'fcf' ? 'FCF' : 'EBITDA'}
          </button>
        ))}
      </div>

      {/* Warnings */}
      {activeModel === 'pe' && (
        <div className="rounded-xl p-3 mb-4 text-xs" style={{ background:'var(--accent-subtle)', border:'1px solid var(--accent)', color:'var(--text-secondary)' }}>
          {t('peValuationDesc')}
        </div>
      )}
      {activeModel === 'dcf' && data.financials.fcf > 0 && data.financials.netIncome > 0 && data.financials.fcf < data.financials.netIncome * 0.3 && (
        <div className="rounded-xl p-3 mb-4 text-xs" style={{ background:'var(--amber-bg)', border:'1px solid var(--amber)', color:'var(--amber)' }}>
          {t('fcfLowWarning')}
          <button onClick={() => setActiveModel('pe')} className="ml-1 underline font-bold">{t('peModelBtn')}</button>
        </div>
      )}

      {/* Parameters */}
      <div style={C.card} className="p-4 mb-4">
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>
          {activeModel === 'dcf' ? t('dcfParameters') : t('peParameters')}
        </div>

        {activeModel === 'dcf' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {[
              { key:'g1', label:t('fcfGrowthRateLabel'), hint: historicalFCFCAGR ? t('fiveYHist', fmt(historicalFCFCAGR,1)) : null },
              { key:'wacc', label:t('waccPct') },
              { key:'tgr', label:t('terminalGrowthPct') },
            ].map(p => (
              <div key={p.key}>
                <label className="text-xs block mb-1" style={C.m}>{p.label}</label>
                <input type="number" step="0.5" value={dcfP[p.key]}
                  onChange={e => setDcfP(prev => ({...prev, [p.key]: parseFloat(e.target.value)||0}))}
                  className="w-full h-9 px-3 text-sm text-right num"
                  style={{ background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text-primary)' }} />
                {p.hint && <div className="text-xs mt-0.5" style={{color:'var(--accent)'}}>{p.hint}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">

            {/* ── EPS Field with Help ── */}
            <div style={{gridColumn:'1/-1'}}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs" style={C.m}>
                  {t('epsField')} <span style={{color: epsLooksSuspicious ? 'var(--red)' : 'var(--text-muted)'}}>
                    {epsLooksSuspicious ? t('epsIncorrect') : t('epsEditIfIncorrect')}
                  </span>
                </label>
                <button
                  onClick={() => setShowEPSHelp(!showEPSHelp)}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{background:'var(--accent-subtle)',color:'var(--accent)',border:'1px solid var(--accent)'}}>
                  {showEPSHelp ? t('hideHelp') : t('howToFindEPS')}
                </button>
              </div>

              {/* EPS Help Panel */}
              {showEPSHelp && (
                <div className="rounded-xl p-4 mb-3" style={{background:'var(--bg-subtle)',border:'1px solid var(--border)'}}>
                  <div className="text-xs font-bold mb-2" style={C.p}>{t('epsHelpTitle')}</div>

                  {/* Step by step */}
                  <div className="flex flex-col gap-1.5 mb-3">
                    {[
                      t('epsStep1'),
                      t('epsStep2', ticker),
                      t('epsStep3'),
                      t('epsStep4'),
                      t('epsStep5'),
                    ].map((step, i) => (
                      <div key={i} className="text-xs" style={C.s}>{step}</div>
                    ))}
                  </div>

                  {/* Yahoo Finance Link */}
                  <a
                    href={`https://finance.yahoo.com/quote/${ticker}/key-statistics`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold mb-3"
                    style={{background:'var(--accent)',color:'white',textDecoration:'none',display:'inline-flex'}}>
                    {t('openYahooFinance', ticker)}
                  </a>

                  {/* Historical EPS from data */}
                  {historicalEPS.length > 0 && (
                    <div>
                      <div className="text-xs font-bold mb-2" style={C.m}>{t('historicalEPSData')}</div>
                      <div className="text-xs mb-1" style={{color:'var(--amber)'}}>
                        {t('epsRefOnly')}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {historicalEPS.map(r => (
                          <div key={r.year} className="px-2 py-1 rounded text-xs" style={{background:'var(--bg-card)',border:'1px solid var(--border)'}}>
                            <span style={C.m}>{r.year}: </span>
                            <span className="font-bold num" style={C.p}>{fmt(r.eps,2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <input type="number" step="0.1" value={manualEPS > 0 ? manualEPS : ''}
                placeholder={epsLooksSuspicious ? t('epsManualPlaceholder') : fmt(autoEPS, 2)}
                onChange={e => setManualEPS(parseFloat(e.target.value) || 0)}
                className="w-full h-9 px-3 text-sm text-right num"
                style={{ background:'var(--bg-input)', border:`1px solid ${epsLooksSuspicious?'var(--red)':'var(--border)'}`, borderRadius:'var(--radius-sm)', color:'var(--text-primary)' }} />
              {epsLooksSuspicious ? (
                <div className="text-xs mt-0.5" style={{color:'var(--red)'}}>
                  {t('autoEPSWarning', fmt(autoEPS,2))}
                </div>
              ) : (
                <div className="text-xs mt-0.5" style={{color:'var(--accent)'}}>
                  {t('autoEPSHint', fmt(autoEPS,2))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs block mb-1" style={C.m}>{t('netIncomeGrowthPct')}</label>
              <input type="number" step="0.5" value={niGrowth}
                onChange={e => setNiGrowth(parseFloat(e.target.value)||0)}
                className="w-full h-9 px-3 text-sm text-right num"
                style={{ background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text-primary)' }} />
              {historicalNICAGR && <div className="text-xs mt-0.5" style={{color:'var(--accent)'}}>5Y hist: {fmt(historicalNICAGR,1)}%</div>}
            </div>
            <div>
              <label className="text-xs block mb-1" style={C.m}>{t('peMultipleExit')}</label>
              <input type="number" step="0.5" value={peMultiple}
                onChange={e => setPeMultiple(parseFloat(e.target.value)||0)}
                className="w-full h-9 px-3 text-sm text-right num"
                style={{ background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text-primary)' }} />
              {data.multiples?.pe && <div className="text-xs mt-0.5" style={{color:'var(--accent)'}}>{t('currentPELabel', fmt(data.multiples.pe,1))}</div>}
            </div>
            <div>
              <label className="text-xs block mb-1" style={C.m}>{t('projectionYears')}</label>
              <input type="number" step="1" min="1" max="20" value={projYears}
                onChange={e => setProjYears(parseInt(e.target.value)||5)}
                className="w-full h-9 px-3 text-sm text-right num"
                style={{ background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text-primary)' }} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={C.m}>{t('targetReturnPct')}</label>
              <input type="number" step="0.5" value={targetReturn}
                onChange={e => setTargetReturn(parseFloat(e.target.value)||10)}
                className="w-full h-9 px-3 text-sm text-right num"
                style={{ background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text-primary)' }} />
            </div>
          </div>
        )}

        {/* Decay Rate */}
        <div className="rounded-xl p-3" style={{ background:'var(--accent-subtle)', border:'1px solid var(--accent)' }}>
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-xs font-bold" style={C.accent}>{t('growthDecayRate')}</div>
              <div className="text-xs mt-0.5" style={C.m}>{t('growthSlows')}</div>
            </div>
            <input type="number" step="1" min="0" max="50" value={decayRate}
              onChange={e => setDecayRate(parseFloat(e.target.value)||0)}
              className="w-20 h-9 px-3 text-sm text-right num"
              style={{ background:'var(--bg-input)', border:'1px solid var(--accent)', borderRadius:'var(--radius-sm)', color:'var(--text-primary)' }} />
          </div>
          {decayRate > 0 && (
            <div className="text-xs" style={C.s}>
              {activeModel === 'dcf'
                ? `${fmt(dcfP.g1,1)}% → ${fmt(dcfP.g1*(1-decayRate/100),1)}% → ${fmt(dcfP.g1*Math.pow(1-decayRate/100,2),1)}%...`
                : `${fmt(niGrowth,1)}% → ${fmt(niGrowth*(1-decayRate/100),1)}% → ${fmt(niGrowth*Math.pow(1-decayRate/100,2),1)}%...`}
            </div>
          )}
        </div>
      </div>

      {/* DCF OUTPUT */}
      {activeModel === 'dcf' && (
        dcf ? (
          <div>
            <div className="rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              style={{ background: isOvervalued?'var(--red-bg)':'var(--green-bg)', border:`1px solid ${isOvervalued?'var(--red)':'var(--green)'}` }}>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>{t('dcfFairValue')}</div>
                <div className="text-3xl font-black num" style={{color: isOvervalued?'var(--red)':'var(--green)'}}>{fmtPrice(dcf.fv)}</div>
                <div className="text-sm font-semibold mt-1" style={{color: isOvervalued?'var(--red)':'var(--green)'}}>
                  {upside>=0?'+':''}{fmt(upside,1)}% vs market ({fmtPrice(price)})
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>{t('verdictLabel')}</div>
                <div className="text-lg font-black" style={{color: isOvervalued?'var(--red)':'var(--green)'}}>
                  {upside<-30?t('sigOvervalued'):upside<-10?t('overvaluedLabel'):upside<10?t('fairlyValued'):upside<30?t('undervaluedLabel'):t('sigUndervalued')}
                </div>
              </div>
            </div>

            <div style={C.card} className="p-4 mb-4">
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>
                {t('projectionsLabel', dcfMode==='ebitda'?'EBITDA':'FCF')}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{minWidth:320}}>
                  <thead>
                    <tr className="text-xs" style={{...C.m,...C.bdr}}>
                      <th className="pb-2 text-left">{t('yearCol')}</th>
                      <th className="pb-2 text-right">{t('growthCol')}</th>
                      <th className="pb-2 text-right">{t('fcfColM', dcfMode==='ebitda'?'EBITDA':'FCF')}</th>
                      <th className="pb-2 text-right">{t('pvColM')}</th>
                      <th className="pb-2 text-right">{t('cumPVCol')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dcf.rows.map(r => (
                      <tr key={r.y} style={C.bdr}>
                        <td className="py-1.5" style={C.s}>{t('yrN', r.y)}</td>
                        <td className="py-1.5 text-right num text-xs" style={{color: r.growthRate>0.08?'var(--green)':r.growthRate>0.03?'var(--amber)':'var(--red)'}}>
                          {fmt(r.growthRate*100,1)}%
                        </td>
                        <td className="py-1.5 text-right num" style={C.p}>{fmt(r.fcf/1e6,0)}</td>
                        <td className="py-1.5 text-right num" style={C.p}>{fmt(r.pv/1e6,0)}</td>
                        <td className="py-1.5 text-right num font-medium" style={C.accent}>{fmt(r.cumPV/1e6,0)}</td>
                      </tr>
                    ))}
                    <tr style={{background:'var(--bg-subtle)'}}>
                      <td className="py-2 font-medium" style={C.p} colSpan={2}>{t('terminalValue')}</td>
                      <td className="py-2 text-right num" style={C.p}>{fmtB(dcf.tv)}</td>
                      <td className="py-2 text-right num" style={C.p}>{fmtB(dcf.pvTV)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl p-4 mb-4" style={C.sub}>
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>{t('valuationBridge')}</div>
              <table className="w-full text-sm">
                <tbody>
                  {[[t('enterpriseValue'),fmtB(dcf.ev),C.p],[t('lessNetDebt'),`(${fmtB(data.financials.netDebt)})`,C.red],[t('equityValue'),fmtB(dcf.ev-data.financials.netDebt),C.p],[t('sharesCol'),(data.profile.shares/1e9).toFixed(2)+'B',C.s]].map(([k,v,s])=>(
                    <tr key={k} style={C.bdr}><td className="py-1.5" style={C.s}>{k}</td><td className="py-1.5 text-right font-medium num" style={s}>{v}</td></tr>
                  ))}
                  <tr><td className="py-2 font-bold" style={C.green}>{t('fairValueShare')}</td><td className="py-2 text-right text-lg font-black num" style={C.green}>{fmtPrice(dcf.fv)}</td></tr>
                </tbody>
              </table>
              <div className="mt-3 pt-3 text-xs" style={{borderTop:'1px solid var(--border)',color:dcf.pvTV/dcf.ev>0.6?'var(--amber)':'var(--text-secondary)'}}>
                {dcf.pvTV/dcf.ev>0.6?'⚠':'ℹ'} {t('fromTerminalValue', fmt(dcf.pvTV/dcf.ev*100,1))}
              </div>
            </div>

            <div style={C.card} className="p-4 mb-4">
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>{t('cagrCalculator')}</div>
              <div className="text-xs mb-4" style={C.s}>{t('cagrDesc')}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {label:t('projectionYears'),value:projYears,setter:v=>setProjYears(parseInt(v)||5),step:1},
                    {label:t('targetReturnPct'),value:targetReturn,setter:v=>setTargetReturn(parseFloat(v)||10),step:0.5},
                    {label:t('dividendGrowthPct'),value:divGrowth,setter:v=>setDivGrowth(parseFloat(v)||0),step:0.5},
                    {label:t('shareChangePct'),value:shareChange,setter:v=>setShareChange(parseFloat(v)||0),step:0.5},
                  ].map(p=>(
                    <div key={p.label}>
                      <label className="text-xs block mb-1" style={C.m}>{p.label}</label>
                      <input type="number" step={p.step} value={p.value} onChange={e=>p.setter(e.target.value)}
                        className="w-full h-9 px-3 text-sm text-right num"
                        style={{background:'var(--bg-input)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)'}} />
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-4" style={{background:'var(--bg-subtle)',border:'1px solid var(--border)'}}>
                  {cagrResult ? (
                    <div className="flex flex-col gap-3">
                      <div><div className="text-xs mb-1" style={C.m}>{t('todaysPrice')}</div><div className="text-xl font-black num" style={C.p}>{fmtPrice(price)}</div></div>
                      <div><div className="text-xs mb-1" style={C.m}>{t('futurePriceYr', projYears)}</div>
                        <div className="text-xl font-black num" style={{color:cagrResult.futurePrice>price?'var(--green)':'var(--red)'}}>
                          {fmtPrice(cagrResult.futurePrice)}<span className="text-sm font-normal ml-1" style={C.m}>{cagrResult.futurePrice>price?'+':''}{fmt((cagrResult.futurePrice/price-1)*100,1)}%</span>
                        </div>
                      </div>
                      <div><div className="text-xs mb-1" style={C.m}>{t('totalDividendsLabel')}</div><div className="text-base font-bold num" style={C.green}>{fmtPrice(cagrResult.totalDivs)}</div></div>
                      <div style={{borderTop:'1px solid var(--border)',paddingTop:10}}>
                        <div className="text-xs mb-1 font-bold" style={C.m}>{t('projectedCAGRLabel')}</div>
                        <div className="text-2xl font-black num" style={{color:cagrResult.cagr>=targetReturn?'var(--green)':cagrResult.cagr>=targetReturn*0.7?'var(--amber)':'var(--red)'}}>
                          {fmt(cagrResult.cagr,2)}%
                        </div>
                        <div className="text-xs mt-0.5" style={C.m}>{cagrResult.cagr>=targetReturn?t('exceedsTarget',targetReturn):t('belowTargetLabel',targetReturn)}</div>
                      </div>
                    </div>
                  ) : <div className="text-sm" style={C.m}>Insufficient data</div>}
                </div>
              </div>
              {requiredBuyPrice && (
                <div className="rounded-xl p-4" style={{background:requiredBuyPrice<price?'var(--red-bg)':'var(--green-bg)',border:`1px solid ${requiredBuyPrice<price?'var(--red)':'var(--green)'}`}}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>{t('requiredBuyPriceFor', targetReturn)}</div>
                      <div className="text-2xl font-black num" style={{color:requiredBuyPrice<price?'var(--red)':'var(--green)'}}>{fmtPrice(requiredBuyPrice)}</div>
                      <div className="text-sm font-semibold mt-1" style={{color:requiredBuyPrice<price?'var(--red)':'var(--green)'}}>
                        {requiredBuyPrice<price?t('aboveEntryTarget',fmt((1-requiredBuyPrice/price)*100,1)):t('belowCanBuy',fmt((requiredBuyPrice/price-1)*100,1))}
                      </div>
                    </div>
                    <div className="text-3xl">{requiredBuyPrice<price?'⚠️':'✅'}</div>
                  </div>
                </div>
              )}
            </div>

            <SensitivityTable fcf={baseFCF} shares={data.profile.shares} totalDebt={data.financials.totalDebt} cash={data.financials.cash} baseWacc={dcfP.wacc/100} baseTgr={dcfP.tgr/100}/>
            <Scenarios fcf={baseFCF} shares={data.profile.shares} totalDebt={data.financials.totalDebt} cash={data.financials.cash} price={price}/>
          </div>
        ) : (
          <div className="rounded-xl p-6 text-center" style={C.sub}>
            <div className="text-sm" style={C.m}>{t('insufficientFCF')}</div>
          </div>
        )
      )}

      {/* P/E OUTPUT */}
      {activeModel === 'pe' && (
        <div>
          {(eps > 0 && !epsLooksSuspicious) || manualEPS > 0 ? (
            <>
              <div className="rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                style={{background:peIsOvervalued?'var(--red-bg)':'var(--green-bg)',border:`1px solid ${peIsOvervalued?'var(--red)':'var(--green)'}`}}>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>{t('peFairValueLabel')}</div>
                  <div className="text-3xl font-black num" style={{color:peIsOvervalued?'var(--red)':'var(--green)'}}>{peFV?fmtPrice(peFV):'N/A'}</div>
                  <div className="text-sm font-semibold mt-1" style={{color:peIsOvervalued?'var(--red)':'var(--green)'}}>
                    {peUpside!==null?`${peUpside>=0?'+':''}${fmt(peUpside,1)}% vs market (${fmtPrice(price)})`:''}
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>{t('verdictLabel')}</div>
                  <div className="text-lg font-black" style={{color:peIsOvervalued?'var(--red)':'var(--green)'}}>
                    {peUpside!==null?(peUpside<-30?t('sigOvervalued'):peUpside<-10?t('overvaluedLabel'):peUpside<10?t('fairlyValued'):peUpside<30?t('undervaluedLabel'):t('sigUndervalued')):'—'}
                  </div>
                </div>
              </div>

              <div style={C.card} className="p-4 mb-4">
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>{t('peProjection', projYears)}</div>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      [t('currentEPSLabel'),fmtPrice(eps),C.p],
                      [t('projectedEPS', projYears),peResult?fmtPrice(peResult.futureEPS):'—',C.accent],
                      [t('exitPEMultiple'),`${peMultiple}x`,C.s],
                      [t('futureStockPrice'),peResult?fmtPrice(peResult.futurePrice):'—',C.green],
                      [t('plusTotalDivs'),peResult?fmtPrice(peResult.totalDivs):'—',C.green],
                      [t('totalValueLabel'),peResult?fmtPrice(peResult.totalValue):'—',{...C.green,fontWeight:700}],
                    ].map(([k,v,s])=>(
                      <tr key={k} style={C.bdr}><td className="py-1.5" style={C.s}>{k}</td><td className="py-1.5 text-right font-medium num" style={s}>{v}</td></tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 pt-3 text-xs" style={{borderTop:'1px solid var(--border)',...C.m}}>
                  {t('pvDiscounted', dcfP.wacc, projYears)}
                </div>
              </div>

              {peRequiredBuyPrice && (
                <div className="rounded-xl p-4 mb-4" style={{background:peRequiredBuyPrice<price?'var(--red-bg)':'var(--green-bg)',border:`1px solid ${peRequiredBuyPrice<price?'var(--red)':'var(--green)'}`}}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>{t('requiredBuyPriceFor', targetReturn)}</div>
                      <div className="text-2xl font-black num" style={{color:peRequiredBuyPrice<price?'var(--red)':'var(--green)'}}>{fmtPrice(peRequiredBuyPrice)}</div>
                      <div className="text-sm font-semibold mt-1" style={{color:peRequiredBuyPrice<price?'var(--red)':'var(--green)'}}>
                        {peRequiredBuyPrice<price?t('aboveEntryTarget',fmt((1-peRequiredBuyPrice/price)*100,1)):t('belowCanBuy',fmt((peRequiredBuyPrice/price-1)*100,1))}
                      </div>
                    </div>
                    <div className="text-4xl">{peRequiredBuyPrice<price?'⚠️':'✅'}</div>
                  </div>
                </div>
              )}

              <div style={C.card} className="p-4">
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>{t('returnSettings')}</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    {label:t('dividendGrowthPct'),value:divGrowth,setter:v=>setDivGrowth(parseFloat(v)||0)},
                    {label:t('shareChangePct'),value:shareChange,setter:v=>setShareChange(parseFloat(v)||0)},
                    {label:t('discountRate'),value:dcfP.wacc,setter:v=>setDcfP(prev=>({...prev,wacc:parseFloat(v)||0}))},
                  ].map(p=>(
                    <div key={p.label}>
                      <label className="text-xs block mb-1" style={C.m}>{p.label}</label>
                      <input type="number" step="0.5" value={p.value} onChange={e=>p.setter(e.target.value)}
                        className="w-full h-9 px-3 text-sm text-right num"
                        style={{background:'var(--bg-input)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)'}}/>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl p-6 text-center" style={{...C.sub,border:'1px solid var(--red)'}}>
              <div className="text-sm font-bold mb-2" style={C.red}>{t('epsUnavailable')}</div>
              <div className="text-xs mb-3" style={C.s}>{t('enterEPSManually')}</div>
              <a href={`https://finance.yahoo.com/quote/${ticker}/key-statistics`} target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{background:'var(--accent)',color:'white',textDecoration:'none',display:'inline-block'}}>
                {t('findEPSYahoo')}
              </a>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
