import { useState, useMemo } from 'react';
import { fmt, fmtB, fmtPct, fmtPrice } from '../utils/format';
import SensitivityTable from './SensitivityTable';
import Scenarios from './Scenarios';

function calcDCFAdvanced({ fcf, shares, totalDebt, cash, g1, decayRate, wacc, tgr }) {
  if (!fcf || !shares || fcf <= 0) return null;
  let rate = g1;
  let f = fcf;
  let pv = 0;
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

function calcCAGR({ fcf, shares, dps, divGrowth, shareChangeRate, g1, decayRate, wacc, tgr, years, currentPrice }) {
  if (!fcf || !shares || fcf <= 0 || currentPrice <= 0) return null;

  let rate = g1;
  let f = fcf;
  for (let y = 1; y <= years; y++) {
    if (y > 1) rate = rate * (1 - decayRate);
    f = f * (1 + rate);
  }

  const futureShares = shares * Math.pow(1 + shareChangeRate, years);
  const terminalFCFPerShare = f / futureShares;
  const impliedMultiple = 1 / (wacc - tgr);
  const futurePriceFromFCF = terminalFCFPerShare * impliedMultiple;

  let totalDivs = 0;
  let d = dps || 0;
  for (let y = 1; y <= years; y++) {
    d = d * (1 + divGrowth);
    totalDivs += d;
  }

  const totalValue = futurePriceFromFCF + totalDivs;
  const cagr = Math.pow(totalValue / currentPrice, 1 / years) - 1;

  return { futurePrice: futurePriceFromFCF, totalDivs, totalValue, cagr: cagr * 100 };
}

function calcRequiredPrice({ totalValue, targetReturn, years }) {
  if (!totalValue || !targetReturn || !years) return null;
  return totalValue / Math.pow(1 + targetReturn, years);
}

export default function DCFTab({ data, dcfP, setDcfP, dcfMode, setDcfMode }) {
  const [decayRate, setDecayRate] = useState(0);
  const [divGrowth, setDivGrowth] = useState(4);
  const [shareChange, setShareChange] = useState(-2);
  const [targetReturn, setTargetReturn] = useState(10);
  const [projYears, setProjYears] = useState(5);

  const C = {
    card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' },
    sub: { background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' },
    p: { color: 'var(--text-primary)' },
    s: { color: 'var(--text-secondary)' },
    m: { color: 'var(--text-muted)' },
    bdr: { borderBottom: '1px solid var(--border)' },
    green: { color: 'var(--green)' },
    red: { color: 'var(--red)' },
    amber: { color: 'var(--amber)' },
    accent: { color: 'var(--accent)' },
  };

  const baseFCF = dcfMode === 'ebitda' ? data.financials.ebitda : data.financials.fcf;
  const price = data.profile.price;

  const hist5y = (data.history || []).filter(r => r.fcf && r.fcf > 0);
  const historicalFCFCAGR = hist5y.length >= 2
    ? ((hist5y[hist5y.length - 1].fcf / hist5y[0].fcf) ** (1 / (hist5y.length - 1)) - 1) * 100
    : null;

  const dcf = useMemo(() => calcDCFAdvanced({
    fcf: baseFCF,
    shares: data.profile.shares,
    totalDebt: data.financials.totalDebt,
    cash: data.financials.cash,
    g1: dcfP.g1 / 100,
    decayRate: decayRate / 100,
    wacc: dcfP.wacc / 100,
    tgr: dcfP.tgr / 100,
  }), [baseFCF, data, dcfP, decayRate]);

  const cagrResult = useMemo(() => calcCAGR({
    fcf: baseFCF,
    shares: data.profile.shares,
    dps: data.multiples.dps || 0,
    divGrowth: divGrowth / 100,
    shareChangeRate: shareChange / 100,
    g1: dcfP.g1 / 100,
    decayRate: decayRate / 100,
    wacc: dcfP.wacc / 100,
    tgr: dcfP.tgr / 100,
    years: projYears,
    currentPrice: price,
  }), [baseFCF, data, dcfP, decayRate, divGrowth, shareChange, projYears, price]);

  const requiredBuyPrice = cagrResult
    ? calcRequiredPrice({ totalValue: cagrResult.totalValue, targetReturn: targetReturn / 100, years: projYears })
    : null;

  const isOvervalued = dcf && price ? dcf.fv < price : false;
  const upside = dcf && price ? (dcf.fv / price - 1) * 100 : null;

  return (
    <div className="fade-in">

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-5">
        {['fcf', 'ebitda'].map(m => (
          <button key={m} onClick={() => setDcfMode(m)}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg"
            style={{ background: dcfMode === m ? 'var(--accent)' : 'var(--bg-subtle)', color: dcfMode === m ? 'white' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
            {m === 'fcf' ? 'FCF-based' : 'EBITDA-based'}
          </button>
        ))}
      </div>

      {/* Parameters */}
      <div style={C.card} className="p-5 mb-5">
        <div className="text-xs font-bold uppercase tracking-widest mb-4" style={C.m}>DCF Parameters</div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { key: 'g1', label: 'FCF Growth Rate (%)', hint: historicalFCFCAGR ? `5Y hist: ${fmt(historicalFCFCAGR, 1)}%` : null },
            { key: 'wacc', label: 'Discount Rate / WACC (%)' },
            { key: 'tgr', label: 'Terminal Growth Rate (%)' },
          ].map(p => (
            <div key={p.key}>
              <label className="text-xs block mb-1" style={C.m}>{p.label}</label>
              <input type="number" step="0.5" value={dcfP[p.key]}
                onChange={e => setDcfP(prev => ({ ...prev, [p.key]: parseFloat(e.target.value) || 0 }))}
                className="w-full h-9 px-3 text-sm text-right num"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              {p.hint && <div className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>{p.hint}</div>}
            </div>
          ))}
        </div>

        {/* Decay Rate */}
        <div className="rounded-xl p-4" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent)' }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-xs font-bold" style={C.accent}>Growth Decay Rate (%/year)</div>
              <div className="text-xs mt-0.5" style={C.m}>Growth slows by this % each year — more realistic than a sudden drop</div>
            </div>
            <input type="number" step="1" min="0" max="50" value={decayRate}
              onChange={e => setDecayRate(parseFloat(e.target.value) || 0)}
              className="w-20 h-9 px-3 text-sm text-right num"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
          </div>
          {decayRate > 0 ? (
            <div className="text-xs" style={C.s}>
              Example: {fmt(dcfP.g1, 1)}% → {fmt(dcfP.g1 * (1 - decayRate / 100), 1)}% → {fmt(dcfP.g1 * Math.pow(1 - decayRate / 100, 2), 1)}% → ...
            </div>
          ) : (
            <div className="text-xs" style={C.m}>Set to 0 for no decay (constant growth)</div>
          )}
        </div>
      </div>

      {/* DCF Output */}
      {dcf ? (
        <div>

          {/* Summary Banner */}
          <div className="rounded-xl p-4 mb-4 flex items-center justify-between"
            style={{ background: isOvervalued ? 'var(--red-bg)' : 'var(--green-bg)', border: `1px solid ${isOvervalued ? 'var(--red)' : 'var(--green)'}` }}>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>DCF Fair Value</div>
              <div className="text-3xl font-black num" style={{ color: isOvervalued ? 'var(--red)' : 'var(--green)' }}>{fmtPrice(dcf.fv)}</div>
              <div className="text-sm font-semibold mt-1" style={{ color: isOvervalued ? 'var(--red)' : 'var(--green)' }}>
                {upside >= 0 ? '+' : ''}{fmt(upside, 1)}% vs market ({fmtPrice(price)})
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>Verdict</div>
              <div className="text-xl font-black" style={{ color: isOvervalued ? 'var(--red)' : 'var(--green)' }}>
                {upside < -30 ? 'Significantly Overvalued' : upside < -10 ? 'Overvalued' : upside < 10 ? 'Fairly Valued' : upside < 30 ? 'Undervalued' : 'Significantly Undervalued'}
              </div>
            </div>
          </div>

          {/* FCF Projection Table */}
          <div style={C.card} className="p-4 mb-5">
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>
              {dcfMode === 'ebitda' ? 'EBITDA' : 'FCF'} Projections
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs" style={{ ...C.m, ...C.bdr }}>
                  <th className="pb-2 text-left">Year</th>
                  <th className="pb-2 text-right">Growth</th>
                  <th className="pb-2 text-right">{dcfMode === 'ebitda' ? 'EBITDA' : 'FCF'} ($M)</th>
                  <th className="pb-2 text-right">PV ($M)</th>
                  <th className="pb-2 text-right">Cum. PV ($M)</th>
                </tr>
              </thead>
              <tbody>
                {dcf.rows.map(r => (
                  <tr key={r.y} style={C.bdr}>
                    <td className="py-1.5" style={C.s}>Yr {r.y}</td>
                    <td className="py-1.5 text-right num text-xs" style={{ color: r.growthRate > 0.08 ? 'var(--green)' : r.growthRate > 0.03 ? 'var(--amber)' : 'var(--red)' }}>
                      {fmt(r.growthRate * 100, 1)}%
                    </td>
                    <td className="py-1.5 text-right num" style={C.p}>{fmt(r.fcf / 1e6, 0)}</td>
                    <td className="py-1.5 text-right num" style={C.p}>{fmt(r.pv / 1e6, 0)}</td>
                    <td className="py-1.5 text-right num font-medium" style={C.accent}>{fmt(r.cumPV / 1e6, 0)}</td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--bg-subtle)' }}>
                  <td className="py-2 font-medium" style={C.p} colSpan={2}>Terminal Value</td>
                  <td className="py-2 text-right num" style={C.p}>{fmtB(dcf.tv)}</td>
                  <td className="py-2 text-right num" style={C.p}>{fmtB(dcf.pvTV)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Valuation Bridge */}
          <div className="rounded-xl p-4 mb-5" style={C.sub}>
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>Valuation Bridge</div>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Enterprise Value', fmtB(dcf.ev), C.p],
                  ['Less: Net Debt', `(${fmtB(data.financials.netDebt)})`, C.red],
                  ['Equity Value', fmtB(dcf.ev - data.financials.netDebt), C.p],
                  ['Shares', (data.profile.shares / 1e9).toFixed(2) + 'B', C.s],
                ].map(([k, v, s]) => (
                  <tr key={k} style={C.bdr}>
                    <td className="py-1.5" style={C.s}>{k}</td>
                    <td className="py-1.5 text-right font-medium num" style={s}>{v}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 font-bold" style={C.green}>Fair Value / Share</td>
                  <td className="py-2 text-right text-lg font-black num" style={C.green}>{fmtPrice(dcf.fv)}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-3 pt-3 text-xs" style={{ borderTop: '1px solid var(--border)', color: dcf.pvTV / dcf.ev > 0.6 ? 'var(--amber)' : 'var(--text-secondary)' }}>
              {dcf.pvTV / dcf.ev > 0.6 ? '⚠' : 'ℹ'} {fmt(dcf.pvTV / dcf.ev * 100, 1)}% from Terminal Value — {dcf.pvTV / dcf.ev > 0.7 ? 'high dependency' : 'acceptable'}
            </div>
          </div>

          {/* CAGR Calculator */}
          <div style={C.card} className="p-5 mb-5">
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>CAGR & Return Calculator</div>
            <div className="text-xs mb-4" style={C.s}>What return will you get if you buy today? What price do you need to achieve your target?</div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={C.m}>Projection Years</label>
                  <input type="number" step="1" min="1" max="20" value={projYears}
                    onChange={e => setProjYears(parseInt(e.target.value) || 5)}
                    className="w-full h-9 px-3 text-sm text-right num"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={C.m}>Target Return (%)</label>
                  <input type="number" step="0.5" value={targetReturn}
                    onChange={e => setTargetReturn(parseFloat(e.target.value) || 10)}
                    className="w-full h-9 px-3 text-sm text-right num"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={C.m}>Dividend Growth (%/yr)</label>
                  <input type="number" step="0.5" value={divGrowth}
                    onChange={e => setDivGrowth(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 px-3 text-sm text-right num"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={C.m}>Annual Share Change (%)</label>
                  <input type="number" step="0.5" value={shareChange}
                    onChange={e => setShareChange(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 px-3 text-sm text-right num"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                  <div className="text-xs mt-0.5" style={C.m}>Negative = buybacks</div>
                </div>
              </div>

              {/* Results */}
              <div className="rounded-xl p-4" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                {cagrResult ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="text-xs mb-1" style={C.m}>Today's Price</div>
                      <div className="text-xl font-black num" style={C.p}>{fmtPrice(price)}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={C.m}>Future Stock Price (Yr {projYears})</div>
                      <div className="text-xl font-black num" style={{ color: cagrResult.futurePrice > price ? 'var(--green)' : 'var(--red)' }}>
                        {fmtPrice(cagrResult.futurePrice)}
                        <span className="text-sm font-normal ml-1" style={C.m}>
                          {cagrResult.futurePrice > price ? '+' : ''}{fmt((cagrResult.futurePrice / price - 1) * 100, 1)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={C.m}>Total Dividends Received</div>
                      <div className="text-base font-bold num" style={C.green}>{fmtPrice(cagrResult.totalDivs)}</div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <div className="text-xs mb-1 font-bold" style={C.m}>Projected CAGR</div>
                      <div className="text-2xl font-black num" style={{ color: cagrResult.cagr >= targetReturn ? 'var(--green)' : cagrResult.cagr >= targetReturn * 0.7 ? 'var(--amber)' : 'var(--red)' }}>
                        {fmt(cagrResult.cagr, 2)}%
                      </div>
                      <div className="text-xs mt-0.5" style={C.m}>
                        {cagrResult.cagr >= targetReturn ? `✅ Exceeds your ${targetReturn}% target` : `⚠ Below your ${targetReturn}% target`}
                      </div>
                    </div>
                  </div>
                ) : <div className="text-sm" style={C.m}>Insufficient data</div>}
              </div>
            </div>

            {/* Required Buy Price */}
            {requiredBuyPrice && (
              <div className="rounded-xl p-4" style={{
                background: requiredBuyPrice < price ? 'var(--red-bg)' : 'var(--green-bg)',
                border: `1px solid ${requiredBuyPrice < price ? 'var(--red)' : 'var(--green)'}`,
              }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>
                      Required Buy Price for {targetReturn}% CAGR
                    </div>
                    <div className="text-2xl font-black num" style={{ color: requiredBuyPrice < price ? 'var(--red)' : 'var(--green)' }}>
                      {fmtPrice(requiredBuyPrice)}
                    </div>
                    <div className="text-sm font-semibold mt-1" style={{ color: requiredBuyPrice < price ? 'var(--red)' : 'var(--green)' }}>
                      {requiredBuyPrice < price
                        ? `Stock is ${fmt((1 - requiredBuyPrice / price) * 100, 1)}% above your entry target`
                        : `You can buy now — stock is ${fmt((requiredBuyPrice / price - 1) * 100, 1)}% below required price`}
                    </div>
                  </div>
                  <div className="text-4xl">{requiredBuyPrice < price ? '⚠️' : '✅'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Sensitivity & Scenarios */}
          <SensitivityTable
            fcf={baseFCF}
            shares={data.profile.shares}
            totalDebt={data.financials.totalDebt}
            cash={data.financials.cash}
            baseWacc={dcfP.wacc / 100}
            baseTgr={dcfP.tgr / 100}
          />
          <Scenarios
            fcf={baseFCF}
            shares={data.profile.shares}
            totalDebt={data.financials.totalDebt}
            cash={data.financials.cash}
            price={price}
          />
        </div>
      ) : (
        <div className="rounded-xl p-6 text-center" style={C.sub}>
          <div className="text-sm" style={C.m}>Insufficient data for DCF calculation</div>
        </div>
      )}
    </div>
  );
}
