import { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'https://web-production-bdb26.up.railway.app/api';

function fmt(n, d=1) { return n==null||isNaN(n)?'N/A':Number(n).toFixed(d); }

const PEERS = {
  Technology: ['MSFT','GOOGL','META','AMZN','NVDA'],
  'Consumer Electronics': ['MSFT','GOOGL','SONY','DELL','HPQ'],
  Semiconductors: ['NVDA','AMD','INTC','QCOM','AVGO'],
  Software: ['MSFT','ORCL','SAP','CRM','ADBE'],
  Healthcare: ['JNJ','PFE','MRK','ABT','TMO'],
  Financials: ['JPM','BAC','WFC','GS','MS'],
  Energy: ['XOM','CVX','COP','SLB','EOG'],
  default: ['MSFT','GOOGL','AMZN','META','NVDA'],
};

const LOGOS = {
  AAPL:'https://images.financialmodelingprep.com/symbol/AAPL.png',
  MSFT:'https://images.financialmodelingprep.com/symbol/MSFT.png',
  GOOGL:'https://images.financialmodelingprep.com/symbol/GOOGL.png',
  META:'https://images.financialmodelingprep.com/symbol/META.png',
  AMZN:'https://images.financialmodelingprep.com/symbol/AMZN.png',
  NVDA:'https://images.financialmodelingprep.com/symbol/NVDA.png',
  TSLA:'https://images.financialmodelingprep.com/symbol/TSLA.png',
  SONY:'https://images.financialmodelingprep.com/symbol/SONY.png',
  DELL:'https://images.financialmodelingprep.com/symbol/DELL.png',
  HPQ:'https://images.financialmodelingprep.com/symbol/HPQ.png',
  AMD:'https://images.financialmodelingprep.com/symbol/AMD.png',
  INTC:'https://images.financialmodelingprep.com/symbol/INTC.png',
  QCOM:'https://images.financialmodelingprep.com/symbol/QCOM.png',
  AVGO:'https://images.financialmodelingprep.com/symbol/AVGO.png',
  ORCL:'https://images.financialmodelingprep.com/symbol/ORCL.png',
  CRM:'https://images.financialmodelingprep.com/symbol/CRM.png',
  ADBE:'https://images.financialmodelingprep.com/symbol/ADBE.png',
  JNJ:'https://images.financialmodelingprep.com/symbol/JNJ.png',
  PFE:'https://images.financialmodelingprep.com/symbol/PFE.png',
  MRK:'https://images.financialmodelingprep.com/symbol/MRK.png',
  ABT:'https://images.financialmodelingprep.com/symbol/ABT.png',
  TMO:'https://images.financialmodelingprep.com/symbol/TMO.png',
  JPM:'https://images.financialmodelingprep.com/symbol/JPM.png',
  BAC:'https://images.financialmodelingprep.com/symbol/BAC.png',
  WFC:'https://images.financialmodelingprep.com/symbol/WFC.png',
  GS:'https://images.financialmodelingprep.com/symbol/GS.png',
  MS:'https://images.financialmodelingprep.com/symbol/MS.png',
  XOM:'https://images.financialmodelingprep.com/symbol/XOM.png',
  CVX:'https://images.financialmodelingprep.com/symbol/CVX.png',
  COP:'https://images.financialmodelingprep.com/symbol/COP.png',
  SAP:'https://images.financialmodelingprep.com/symbol/SAP.png',
};

const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;
const median = arr => {
  if (!arr.length) return null;
  const s = [...arr].sort((a,b)=>a-b);
  const m = Math.floor(s.length/2);
  return s.length%2 ? s[m] : (s[m-1]+s[m])/2;
};

export default function PeerComparison({ ticker, sector, currentPE, currentEVEbitda, currentPS, currentPB, currentLogo, currentName, currentNetMargin, currentRevGrowth }) {
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(false);

  const peerTickers = (PEERS[sector] || PEERS.default).filter(t => t !== ticker).slice(0, 4);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setPeers([]);
    Promise.all(peerTickers.map(t =>
      axios.get(`${API}/valuation/${t}`).then(r => ({
        ticker: t,
        name: r.data.profile.name,
        logo: r.data.profile.logo || LOGOS[t],
        pe: r.data.multiples.pe,
        evEbitda: r.data.multiples.evEbitda,
        ps: r.data.multiples.ps,
        pb: r.data.multiples.pb,
        netMargin: r.data.financials.netMargin,
        roe: r.data.financials.roe,
        revGrowth: r.data.history?.length >= 2 ? (() => {
          const h = r.data.history.filter(x => x.revenue && x.revenue > 0);
          if (h.length < 2) return null;
          return ((h[h.length-1].revenue / h[0].revenue) ** (1/(h.length-1)) - 1) * 100;
        })() : null,
      })).catch(() => null)
    )).then(results => {
      setPeers(results.filter(Boolean));
      setLoading(false);
    });
  }, [ticker]);

  const peerPEs = peers.map(p=>p.pe).filter(v=>v&&v>0);
  const peerEVs = peers.map(p=>p.evEbitda).filter(v=>v&&v>0);
  const peerPSs = peers.map(p=>p.ps).filter(v=>v&&v>0);
  const peerPBs = peers.map(p=>p.pb).filter(v=>v&&v>0);
  const peerMargins = peers.map(p=>p.netMargin).filter(v=>v!=null);
  const peerGrowths = peers.map(p=>p.revGrowth).filter(v=>v!=null);

  const avgPE = avg(peerPEs);
  const avgEV = avg(peerEVs);
  const avgPS = avg(peerPSs);
  const avgPB = avg(peerPBs);
  const medPE = median(peerPEs);
  const medEV = median(peerEVs);
  const avgMargin = avg(peerMargins);
  const avgGrowth = avg(peerGrowths);

  const pePremium = avgPE && currentPE ? ((currentPE/avgPE)-1)*100 : null;
  const evPremium = avgEV && currentEVEbitda ? ((currentEVEbitda/avgEV)-1)*100 : null;
  const peUpside = avgPE && currentPE ? ((avgPE/currentPE)-1)*100 : null;
  const evUpside = avgEV && currentEVEbitda ? ((avgEV/currentEVEbitda)-1)*100 : null;
  const avgImplied = peUpside !== null && evUpside !== null ? (peUpside+evUpside)/2 : (peUpside ?? evUpside);

  const total = peerTickers.length + 1;
  const peRank = currentPE && peerPEs.length ? [...peerPEs, currentPE].filter(Boolean).sort((a,b)=>b-a).indexOf(currentPE)+1 : null;
  const evRank = currentEVEbitda && peerEVs.length ? [...peerEVs, currentEVEbitda].filter(Boolean).sort((a,b)=>b-a).indexOf(currentEVEbitda)+1 : null;

  const currentPEG = currentPE && avgGrowth && avgGrowth > 0 ? currentPE/avgGrowth : null;
  const aboveAvgMargin = currentNetMargin && avgMargin && currentNetMargin > avgMargin;
  const belowAvgGrowth = currentRevGrowth !== null && avgGrowth !== null && currentRevGrowth < avgGrowth;

  // Smart Takeaway
  const buildTakeaway = () => {
    if (pePremium === null) return `${ticker} peer comparison data loading`;
    const premiumStr = pePremium > 0 ? `+${fmt(pePremium,0)}% premium` : `${fmt(pePremium,0)}% discount`;
    const evStr = evPremium !== null ? ` and EV/EBITDA (${evPremium > 0 ? '+' : ''}${fmt(evPremium,0)}%)` : '';
    if (pePremium > 15) {
      if (aboveAvgMargin && belowAvgGrowth) return `${ticker} trades at a ${premiumStr} vs peers on P/E${evStr} — premium partially justified by above-average margins, but not supported by relative growth`;
      if (aboveAvgMargin) return `${ticker} trades at a ${premiumStr} vs peers on P/E${evStr} — premium supported by superior margins and quality`;
      return `${ticker} trades at a ${premiumStr} vs peers on P/E${evStr} — premium not supported by growth or margin advantage`;
    }
    if (pePremium < -10) return `${ticker} trades at a ${premiumStr} vs peers on P/E${evStr} — potential value opportunity relative to sector`;
    return `${ticker} trades broadly in line with peers on P/E${evStr} — ${aboveAvgMargin ? 'supported by above-average margins' : 'no significant premium or discount'}`;
  };

  const takeaway = buildTakeaway();
  const isPremium = pePremium !== null && pePremium > 10;
  const isDiscount = pePremium !== null && pePremium < -10;

  const getCellStyle = (val, peerAvg, higherIsBad=true) => {
    if (!val || !peerAvg) return { text: 'text-gray-600', bg: '' };
    const diff = (val - peerAvg) / peerAvg;
    if (higherIsBad) {
      if (diff > 0.12) return { text: 'text-red-600 font-semibold', bg: 'bg-red-50' };
      if (diff < -0.12) return { text: 'text-emerald-600 font-semibold', bg: 'bg-emerald-50' };
    } else {
      if (diff > 0.12) return { text: 'text-emerald-600 font-semibold', bg: 'bg-emerald-50' };
      if (diff < -0.12) return { text: 'text-red-600 font-semibold', bg: 'bg-red-50' };
    }
    return { text: 'text-gray-600', bg: '' };
  };

  const allRows = [
    { ticker, name: currentName||ticker, logo: currentLogo||LOGOS[ticker], pe: currentPE, evEbitda: currentEVEbitda, ps: currentPS, pb: currentPB, netMargin: currentNetMargin, revGrowth: currentRevGrowth, isCurrent: true },
    ...peers,
  ];

  const metrics = [
    { key: 'pe', label: 'P/E', peerAvg: avgPE, peerMed: medPE, higherIsBad: true, primary: false },
    { key: 'evEbitda', label: 'EV/EBITDA', peerAvg: avgEV, peerMed: medEV, higherIsBad: true, primary: true, star: true, tooltip: 'Primary metric for mature, cash-generative companies' },
    { key: 'ps', label: 'P/S', peerAvg: avgPS, peerMed: null, higherIsBad: true, primary: false },
    { key: 'pb', label: 'P/B', peerAvg: avgPB, peerMed: null, higherIsBad: true, primary: false },
    { key: 'netMargin', label: 'Net Margin', peerAvg: avgMargin, peerMed: null, higherIsBad: false, primary: false, suffix: '%' },
    { key: 'revGrowth', label: 'Rev Growth', peerAvg: avgGrowth, peerMed: null, higherIsBad: false, primary: false, suffix: '%' },
  ];

  return (
    <div>
      <div className="text-xs font-medium text-gray-400 uppercase mb-4">Peer Comparison — {sector}</div>

      {/* Takeaway */}
      <div className={`rounded-xl p-4 mb-4 border-l-4 ${isPremium ? 'bg-red-50 border-red-400' : isDiscount ? 'bg-emerald-50 border-emerald-400' : 'bg-gray-50 border-gray-300'}`}>
        <div className="text-xs font-medium text-gray-400 uppercase mb-1">Peer Takeaway</div>
        <div className="text-sm font-medium text-gray-800">{takeaway}</div>
        {isPremium && belowAvgGrowth && (
          <div className="text-xs text-red-600 mt-1.5 font-medium">
            ⚠ Premium valuation not supported by relative growth vs peers
          </div>
        )}
        {isPremium && aboveAvgMargin && (
          <div className="text-xs text-amber-600 mt-1">
            ✓ Premium partially justified by above-average margins ({fmt(currentNetMargin,1)}% vs peer avg {fmt(avgMargin,1)}%)
          </div>
        )}
      </div>

      {/* Cards */}
      {pePremium !== null && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="text-xs text-gray-400 mb-1">P/E vs Peer Avg</div>
            <div className={`text-lg font-bold ${pePremium > 10 ? 'text-red-500' : pePremium < -10 ? 'text-emerald-600' : 'text-gray-700'}`}>
              {pePremium > 0 ? '+' : ''}{fmt(pePremium,0)}%
            </div>
            <div className="text-xs text-gray-400">{pePremium > 0 ? 'Premium' : 'Discount'} to peers</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="text-xs text-gray-400 mb-1">EV/EBITDA vs Avg</div>
            <div className={`text-lg font-bold ${evPremium > 10 ? 'text-red-500' : evPremium < -10 ? 'text-emerald-600' : 'text-gray-700'}`}>
              {evPremium !== null ? (evPremium > 0 ? '+' : '')+fmt(evPremium,0)+'%' : 'N/A'}
            </div>
            <div className="text-xs text-gray-400">{evPremium > 0 ? 'Premium' : 'Discount'} to peers</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="text-xs text-gray-400 mb-1">P/E Rank in Group</div>
            <div className="text-lg font-bold text-gray-700">{peRank !== null ? `${peRank}/${total}` : 'N/A'}</div>
            <div className="text-xs text-gray-400">
              {peRank === 1 ? 'Most expensive in group' : peRank === total ? 'Cheapest in group' : `Higher than most peers`}
            </div>
          </div>
          <div className={`rounded-xl p-3 border ${avgImplied !== null && avgImplied > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <div className="text-xs text-gray-400 mb-1">If valued at peer avg</div>
            <div className={`text-lg font-bold ${avgImplied > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {avgImplied !== null ? (avgImplied > 0 ? '+' : '')+fmt(avgImplied,0)+'%' : 'N/A'}
            </div>
            <div className="text-xs text-gray-400">{avgImplied > 0 ? 'implied upside' : 'implied downside'}</div>
          </div>
        </div>
      )}

      {loading && <div className="text-sm text-gray-400 py-4 text-center">Loading peer data...</div>}

      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b">
                <th className="text-left pb-2 pr-4">Company</th>
                {metrics.map(m => (
                  <th key={m.key} className={`text-right pb-2 px-2 ${m.primary ? 'text-emerald-600 font-semibold' : ''}`}>
                    {m.star ? '★ ' : ''}{m.label}
                    {m.tooltip && <span className="ml-1 text-gray-300 cursor-help" title={m.tooltip}>ⓘ</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allRows.map(c => (
                <tr key={c.ticker} className={`border-b border-gray-50 ${c.isCurrent ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      {(c.logo || LOGOS[c.ticker]) && (
                        <img src={c.logo || LOGOS[c.ticker]} className="w-6 h-6 rounded object-contain bg-white border border-gray-100" alt="" onError={e => e.target.style.display='none'} />
                      )}
                      <div>
                        <div className={`font-medium ${c.isCurrent ? 'text-emerald-700' : 'text-gray-700'}`}>{c.ticker}</div>
                        <div className="text-xs text-gray-400">{c.name?.slice(0,18)}</div>
                      </div>
                    </div>
                  </td>
                  {metrics.map(m => {
                    const val = c[m.key];
                    const { text, bg } = c.isCurrent ? getCellStyle(val, m.peerAvg, m.higherIsBad) : { text: 'text-gray-600', bg: '' };
                    return (
                      <td key={m.key} className={`py-2 px-2 text-right ${bg} ${c.isCurrent ? text : 'text-gray-600'} ${m.primary && c.isCurrent ? 'font-semibold' : ''}`}>
                        {val != null ? fmt(val)+(m.suffix||'x') : 'N/A'}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Peer Avg Row — highlighted */}
              <tr className="border-t-2 border-gray-200 bg-blue-50">
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-xs text-blue-500 font-bold">≈</div>
                    <div className="text-xs font-bold text-blue-600">Peer Avg</div>
                  </div>
                </td>
                {metrics.map(m => (
                  <td key={m.key} className="py-2 px-2 text-right text-xs font-bold text-blue-600">
                    {m.peerAvg != null ? fmt(m.peerAvg)+(m.suffix||'x') : '—'}
                  </td>
                ))}
              </tr>

              {/* Peer Median Row */}
              <tr className="bg-gray-50">
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-500">M</div>
                    <div className="text-xs text-gray-500">Peer Median</div>
                  </div>
                </td>
                {metrics.map(m => (
                  <td key={m.key} className="py-2 px-2 text-right text-xs text-gray-500">
                    {m.peerMed != null ? fmt(m.peerMed)+(m.suffix||'x') : '—'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* PEG + Quality */}
      {!loading && peers.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {currentPEG !== null && (
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <div className="text-xs font-medium text-blue-600 uppercase mb-1">Growth-Adjusted Valuation (PEG)</div>
              <div className={`text-xl font-bold ${currentPEG > 3 ? 'text-red-500' : currentPEG > 1.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {fmt(currentPEG,2)}x
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {currentPEG > 3
                  ? `Elevated vs typical PEG (<1.5x) — valuation exceeds growth profile`
                  : currentPEG > 1.5
                  ? `Above typical range — moderate growth justification`
                  : `Below 1.5x — growth supports current valuation`}
              </div>
            </div>
          )}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="text-xs font-medium text-gray-500 uppercase mb-2">Quality vs Peers</div>
            <div className="flex flex-col gap-1.5 text-xs text-gray-600">
              {avgMargin !== null && currentNetMargin !== null && (
                <div className="flex justify-between">
                  <span>Net Margin</span>
                  <span className={currentNetMargin > avgMargin ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
                    {fmt(currentNetMargin,1)}% vs {fmt(avgMargin,1)}% avg {currentNetMargin > avgMargin ? '↑' : '↓'}
                  </span>
                </div>
              )}
              {avgGrowth !== null && currentRevGrowth !== null && (
                <div className="flex justify-between">
                  <span>Rev Growth</span>
                  <span className={currentRevGrowth > avgGrowth ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
                    {fmt(currentRevGrowth,1)}% vs {fmt(avgGrowth,1)}% avg {currentRevGrowth > avgGrowth ? '↑' : '↓'}
                  </span>
                </div>
              )}
              <div className="mt-1 pt-1 border-t border-gray-200 text-xs font-medium text-gray-600">
                {aboveAvgMargin && belowAvgGrowth
                  ? '✓ Margin premium / ⚠ Growth below peers — mixed picture'
                  : aboveAvgMargin
                  ? '✓ Premium justified by above-average margins'
                  : belowAvgGrowth
                  ? '⚠ Premium not supported by growth or margins'
                  : '~ In line with peer fundamentals'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
