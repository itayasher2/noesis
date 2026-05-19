import { useEffect, useState } from 'react';
import axios from 'axios';
import { fmt, fmtPrice } from '../utils/format';

const API = 'https://web-production-bdb26.up.railway.app/api';

function getVerdictStyle(verdict) {
  if (!verdict) return { color: '#065f46', bg: '#f0fdf4', border: '#a7f3d0' };
  if (verdict === 'Strong Opportunity' || verdict === 'Attractive') return { color: '#065f46', bg: '#f0fdf4', border: '#a7f3d0' };
  if (verdict === 'Fairly Valued') return { color: '#78350f', bg: '#fdfaf5', border: '#e5d5b0' };
  if (verdict === 'High Expectations' || verdict === 'Caution') return { color: '#92400e', bg: '#fffbf5', border: '#e5d0b0' };
  return { color: '#991b1b', bg: '#fff8f8', border: '#e5b0b0' };
}

export default function HeroSection({ data, scoreData, dcf, dcfParams }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!data || !scoreData) return;
    setInsight(null);
    setLoading(true);
    axios.post(`${API}/valuation/hero-insight`, {
      profile: data.profile,
      financials: data.financials,
      multiples: data.multiples,
      scoreData,
      history: data.history,
    }).then(res => setInsight(res.data))
      .catch(() => setInsight(null))
      .finally(() => setLoading(false));
  }, [data?.profile?.ticker]);

  if (!data || !scoreData) return null;

  const price = data.profile.price;
  const verdict = insight?.verdict || (scoreData.composite >= 65 ? 'Attractive' : scoreData.composite >= 50 ? 'Fairly Valued' : scoreData.composite >= 35 ? 'High Expectations' : 'Caution');
  const style = getVerdictStyle(verdict);

  const fairLow = dcf?.fv ? dcf.fv * 0.85 : null;
  const fairHigh = dcf?.fv ? dcf.fv * 1.05 : null;
  const upside = dcf?.fv ? (dcf.fv / price - 1) * 100 : null;
  const implied = scoreData.impliedGrowth;
  const historical = scoreData.revCAGR;
  const fcfGap = implied && historical ? implied - historical : null;

  return (
    <div className="mb-4 fade-in" style={{
      background: style.bg,
      border: `1.5px solid ${style.border}`,
      borderRadius: 'var(--radius)',
      padding: '16px',
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    }}>

      {/* ── Top row ── */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {data.profile.logo && (
            <img src={data.profile.logo} className="w-8 h-8 rounded-lg object-contain flex-shrink-0"
              style={{border:'1px solid var(--border)'}} alt="" />
          )}
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-widest mb-0.5 truncate"
              style={{color: style.color, opacity: 0.7}}>
              {data.profile.ticker} · {data.profile.sector}
            </div>
            <div className="font-bold truncate" style={{fontSize:16,color:'var(--text-primary)',lineHeight:1.2}}>
              {data.profile.name}
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-xs font-bold mb-0.5" style={{color: style.color, opacity: 0.7}}>Verdict</div>
          <div style={{fontSize:13,fontWeight:600,color:style.color}}>{verdict}</div>
          <div className="text-lg font-bold num mt-0.5" style={{color:'var(--text-primary)'}}>
            {fmtPrice(price)}
            <span className="text-xs font-semibold ml-1" style={{color: data.profile.changePct >= 0 ? '#065f46' : '#991b1b'}}>
              {data.profile.changePct >= 0 ? '+' : ''}{fmt(data.profile.changePct, 2)}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Key Insight ── */}
      <div className="mb-4 px-3 py-2 rounded-xl" style={{
        background: style.color + '08',
        borderLeft: `3px solid ${style.color}`,
      }}>
        <div className="text-xs font-bold uppercase tracking-widest mb-1"
          style={{color: style.color, opacity: 0.7}}>Key Insight</div>
        {loading ? (
          <div className="text-xs" style={{color:'var(--text-muted)',fontStyle:'italic'}}>Analyzing {data.profile.ticker}...</div>
        ) : (
          <div className="text-xs leading-relaxed" style={{color:'var(--text-secondary)',fontStyle:'italic'}}>
            "{insight?.keyInsight || 'Generating insight...'}"
          </div>
        )}
      </div>

      {/* ── 3 sections — stacked on mobile, grid on desktop ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">

        {/* Market vs Reality */}
        <div className="rounded-xl p-3" style={{background:'rgba(255,255,255,0.5)',border:'1px solid var(--border)'}}>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:'var(--text-muted)'}}>
            Market vs Reality
          </div>
          <div className="text-xs leading-relaxed" style={{color:'var(--text-secondary)'}}>
            {loading ? 'Loading...' : (insight?.whyMarket || '—')}
          </div>
          {fcfGap !== null && (
            <div className="mt-2 pt-2 flex justify-between text-xs" style={{borderTop:'1px solid var(--border)'}}>
              <span style={{color:'var(--text-muted)'}}>Implied vs Hist.</span>
              <span className="font-bold num" style={{color:fcfGap>8?'#991b1b':'#92400e'}}>
                {fmt(implied,1)}% vs {fmt(historical,1)}%
              </span>
            </div>
          )}
        </div>

        {/* Fair Value */}
        <div className="rounded-xl p-3" style={{background:'rgba(255,255,255,0.5)',border:'1px solid var(--border)'}}>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:'var(--text-muted)'}}>
            Fair Value Range
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span style={{color:'var(--text-muted)'}}>DCF range</span>
              <span className="font-bold num" style={{color:'var(--text-primary)'}}>
                {fairLow && fairHigh ? `${fmtPrice(fairLow)}–${fmtPrice(fairHigh)}` : '—'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{color:'var(--text-muted)'}}>Price</span>
              <span className="font-bold num" style={{color:'var(--text-primary)'}}>{fmtPrice(price)}</span>
            </div>
            {upside !== null && (
              <div className="flex justify-between text-xs pt-1" style={{borderTop:'1px solid var(--border)'}}>
                <span style={{color:'var(--text-muted)'}}>vs Fair Value</span>
                <span className="font-bold num" style={{color:upside>=0?'#065f46':'#991b1b'}}>
                  {upside>=0?'+':''}{fmt(upside,1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Risk & Opportunity */}
        <div className="rounded-xl p-3" style={{background:'rgba(255,255,255,0.5)',border:'1px solid var(--border)'}}>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:'var(--text-muted)'}}>
            Risk & Opportunity
          </div>
          {loading ? (
            <div className="text-xs" style={{color:'var(--text-muted)'}}>Loading...</div>
          ) : (
            <div className="flex flex-col gap-2">
              <div>
                <div className="text-xs font-semibold mb-0.5" style={{color:'#991b1b'}}>⚠ Risk</div>
                <div className="text-xs leading-relaxed" style={{color:'var(--text-secondary)'}}>{insight?.mainRisk||'—'}</div>
              </div>
              <div style={{borderTop:'1px solid var(--border)',paddingTop:6}}>
                <div className="text-xs font-semibold mb-0.5" style={{color:'#065f46'}}>↑ Opportunity</div>
                <div className="text-xs leading-relaxed" style={{color:'var(--text-secondary)'}}>{insight?.opportunity||'—'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom info ── */}
      <div className="flex items-center gap-2 flex-wrap text-xs" style={{color:'var(--text-muted)'}}>
        <span className="font-bold">{data.profile.ticker}</span>
        <span>·</span>
        <span>{data.profile.exchange}</span>
        {data.profile.employees && <><span>·</span><span>{(data.profile.employees/1000).toFixed(0)}K employees</span></>}
        {data.profile.country && <><span>·</span><span>{data.profile.country}</span></>}
      </div>
    </div>
  );
}
