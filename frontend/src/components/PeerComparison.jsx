import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../i18n.jsx';

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
  const { t } = useLanguage();

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
  }, [ticker, sector]);

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

  const currentPEG = currentPE && avgGrowth && avgGrowth > 0 ? currentPE/avgGrowth : null;
  const aboveAvgMargin = currentNetMargin && avgMargin && currentNetMargin > avgMargin;
  const belowAvgGrowth = currentRevGrowth !== null && avgGrowth !== null && currentRevGrowth < avgGrowth;

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

  const getCellStyle = (val, peerAvg, higherIsBad = true) => {
    if (!val || !peerAvg) return { color: 'var(--text-secondary)' };
    const diff = (val - peerAvg) / peerAvg;
    if (higherIsBad) {
      if (diff > 0.12) return { color: 'var(--red)', fontWeight: 600, background: 'rgba(239,68,68,0.10)' };
      if (diff < -0.12) return { color: 'var(--green)', fontWeight: 600, background: 'rgba(16,185,129,0.10)' };
    } else {
      if (diff > 0.12) return { color: 'var(--green)', fontWeight: 600, background: 'rgba(16,185,129,0.10)' };
      if (diff < -0.12) return { color: 'var(--red)', fontWeight: 600, background: 'rgba(239,68,68,0.10)' };
    }
    return { color: 'var(--text-secondary)' };
  };

  const allRows = [
    { ticker, name: currentName||ticker, logo: currentLogo||LOGOS[ticker], pe: currentPE, evEbitda: currentEVEbitda, ps: currentPS, pb: currentPB, netMargin: currentNetMargin, revGrowth: currentRevGrowth, isCurrent: true },
    ...peers,
  ];

  const metrics = [
    { key: 'pe', label: t('pe'), peerAvg: avgPE, peerMed: medPE, higherIsBad: true, primary: false },
    { key: 'evEbitda', label: t('evEbitda'), peerAvg: avgEV, peerMed: medEV, higherIsBad: true, primary: true, star: true },
    { key: 'ps', label: t('ps'), peerAvg: avgPS, peerMed: null, higherIsBad: true, primary: false },
    { key: 'pb', label: t('pb'), peerAvg: avgPB, peerMed: null, higherIsBad: true, primary: false },
    { key: 'netMargin', label: t('netMarginCol'), peerAvg: avgMargin, peerMed: null, higherIsBad: false, primary: false, suffix: '%' },
    { key: 'revGrowth', label: t('revGrowth'), peerAvg: avgGrowth, peerMed: null, higherIsBad: false, primary: false, suffix: '%' },
  ];

  const card = {
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 12,
  };

  return (
    <div>
      <div className="t-eyebrow" style={{ marginBottom: 16 }}>{t('peerComparison')} — {sector}</div>

      {/* Takeaway */}
      <div style={{
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderLeft: `4px solid ${isPremium ? 'var(--red)' : isDiscount ? 'var(--green)' : 'var(--border-strong)'}`,
        background: isPremium ? 'rgba(239,68,68,0.08)' : isDiscount ? 'rgba(16,185,129,0.08)' : 'var(--bg-subtle)',
        border: `1px solid ${isPremium ? 'rgba(239,68,68,0.20)' : isDiscount ? 'rgba(16,185,129,0.20)' : 'var(--border)'}`,
        borderLeftWidth: 4,
      }}>
        <div className="t-eyebrow" style={{ marginBottom: 4 }}>{t('takeawayPeer')}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>{takeaway}</div>
        {isPremium && belowAvgGrowth && (
          <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 6, fontWeight: 500 }}>
            ⚠ Premium valuation not supported by relative growth vs peers
          </div>
        )}
        {isPremium && aboveAvgMargin && (
          <div style={{ fontSize: 12, color: 'var(--amber)', marginTop: 4 }}>
            ✓ Premium partially justified by above-average margins ({fmt(currentNetMargin,1)}% vs peer avg {fmt(avgMargin,1)}%)
          </div>
        )}
      </div>

      {/* Summary cards */}
      {pePremium !== null && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
          <div style={card}>
            <div className="t-eyebrow" style={{ marginBottom: 4 }}>P/E vs Peer Avg</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: pePremium > 10 ? 'var(--red)' : pePremium < -10 ? 'var(--green)' : 'var(--text-primary)' }}>
              {pePremium > 0 ? '+' : ''}{fmt(pePremium,0)}%
            </div>
            <div className="t-meta">{pePremium > 0 ? 'Premium' : 'Discount'} to peers</div>
          </div>
          <div style={card}>
            <div className="t-eyebrow" style={{ marginBottom: 4 }}>EV/EBITDA vs Avg</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: evPremium > 10 ? 'var(--red)' : evPremium < -10 ? 'var(--green)' : 'var(--text-primary)' }}>
              {evPremium !== null ? (evPremium > 0 ? '+' : '')+fmt(evPremium,0)+'%' : 'N/A'}
            </div>
            <div className="t-meta">{evPremium > 0 ? 'Premium' : 'Discount'} to peers</div>
          </div>
          <div style={card}>
            <div className="t-eyebrow" style={{ marginBottom: 4 }}>P/E Rank in Group</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {peRank !== null ? `${peRank}/${total}` : 'N/A'}
            </div>
            <div className="t-meta">
              {peRank === 1 ? 'Most expensive' : peRank === total ? 'Cheapest in group' : 'Higher than most'}
            </div>
          </div>
          <div style={{
            ...card,
            background: avgImplied !== null && avgImplied > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${avgImplied !== null && avgImplied > 0 ? 'rgba(16,185,129,0.20)' : 'rgba(239,68,68,0.20)'}`,
          }}>
            <div className="t-eyebrow" style={{ marginBottom: 4 }}>If valued at peer avg</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: avgImplied > 0 ? 'var(--green)' : 'var(--red)' }}>
              {avgImplied !== null ? (avgImplied > 0 ? '+' : '')+fmt(avgImplied,0)+'%' : 'N/A'}
            </div>
            <div className="t-meta">{avgImplied > 0 ? 'implied upside' : 'implied downside'}</div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 13, color: 'var(--text-muted)' }}>
          {t('loadingPeers')}
        </div>
      )}

      {!loading && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', paddingBottom: 8, paddingRight: 16, color: 'var(--text-muted)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Company</th>
                {metrics.map(m => (
                  <th key={m.key} style={{ textAlign: 'right', paddingBottom: 8, paddingLeft: 8, paddingRight: 8, fontSize: 11, fontWeight: m.primary ? 600 : 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: m.primary ? 'var(--green)' : 'var(--text-muted)' }}>
                    {m.star ? '★ ' : ''}{m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allRows.map(c => (
                <tr key={c.ticker} style={{
                  borderBottom: '1px solid var(--border)',
                  background: c.isCurrent ? 'rgba(16,185,129,0.06)' : 'transparent',
                }}>
                  <td style={{ padding: '8px 16px 8px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {(c.logo || LOGOS[c.ticker]) && (
                        <img
                          src={c.logo || LOGOS[c.ticker]}
                          style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'contain', background: 'white', border: '1px solid var(--border)' }}
                          alt=""
                          onError={e => e.target.style.display='none'}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13, color: c.isCurrent ? 'var(--green)' : 'var(--text-primary)' }}>{c.ticker}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.name?.slice(0,18)}</div>
                      </div>
                    </div>
                  </td>
                  {metrics.map(m => {
                    const val = c[m.key];
                    const cellStyle = c.isCurrent ? getCellStyle(val, m.peerAvg, m.higherIsBad) : { color: 'var(--text-secondary)' };
                    return (
                      <td key={m.key} style={{ padding: '8px', textAlign: 'right', ...cellStyle, fontWeight: m.primary && c.isCurrent ? 600 : cellStyle.fontWeight }}>
                        {val != null ? fmt(val)+(m.suffix||'x') : 'N/A'}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Peer Avg */}
              <tr style={{ borderTop: '2px solid var(--border-strong)', background: 'rgba(125,211,252,0.06)' }}>
                <td style={{ padding: '8px 16px 8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 4, background: 'rgba(125,211,252,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>≈</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{t('peerAvg')}</div>
                  </div>
                </td>
                {metrics.map(m => (
                  <td key={m.key} style={{ padding: '8px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                    {m.peerAvg != null ? fmt(m.peerAvg)+(m.suffix||'x') : '—'}
                  </td>
                ))}
              </tr>

              {/* Peer Median */}
              <tr style={{ background: 'var(--bg-subtle)' }}>
                <td style={{ padding: '8px 16px 8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text-muted)' }}>M</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Peer Median</div>
                  </div>
                </td>
                {metrics.map(m => (
                  <td key={m.key} style={{ padding: '8px', textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          {currentPEG !== null && (
            <div style={{ ...card, background: 'rgba(125,211,252,0.06)', border: '1px solid rgba(125,211,252,0.18)' }}>
              <div className="t-eyebrow" style={{ color: 'var(--accent)', marginBottom: 6 }}>Growth-Adjusted Valuation (PEG)</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: currentPEG > 3 ? 'var(--red)' : currentPEG > 1.5 ? 'var(--amber)' : 'var(--green)' }}>
                {fmt(currentPEG,2)}x
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                {currentPEG > 3
                  ? 'Elevated vs typical PEG (<1.5x) — valuation exceeds growth profile'
                  : currentPEG > 1.5
                  ? 'Above typical range — moderate growth justification'
                  : 'Below 1.5x — growth supports current valuation'}
              </div>
            </div>
          )}
          <div style={card}>
            <div className="t-eyebrow" style={{ marginBottom: 8 }}>Quality vs Peers</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              {avgMargin !== null && currentNetMargin !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Net Margin</span>
                  <span style={{ color: currentNetMargin > avgMargin ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                    {fmt(currentNetMargin,1)}% vs {fmt(avgMargin,1)}% avg {currentNetMargin > avgMargin ? '↑' : '↓'}
                  </span>
                </div>
              )}
              {avgGrowth !== null && currentRevGrowth !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Rev Growth</span>
                  <span style={{ color: currentRevGrowth > avgGrowth ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                    {fmt(currentRevGrowth,1)}% vs {fmt(avgGrowth,1)}% avg {currentRevGrowth > avgGrowth ? '↑' : '↓'}
                  </span>
                </div>
              )}
              <div style={{ marginTop: 4, paddingTop: 6, borderTop: '1px solid var(--border)', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
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
