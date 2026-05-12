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
    }).then(res => {
      setInsight(res.data);
    }).catch(() => {
      setInsight(null);
    }).finally(() => setLoading(false));
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
    <div className="mb-5 fade-in" style={{
      background: style.bg,
      border: `1.5px solid ${style.border}`,
      borderRadius: 'var(--radius)',
      padding: '28px 32px',
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    }}>

      {/* ── Top row ── */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          {data.profile.logo && (
            <img src={data.profile.logo} className="w-10 h-10 rounded-xl object-contain"
              style={{border:'1px solid var(--border)'}} alt="" />
          )}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-1"
              style={{color: style.color, opacity: 0.7}}>
              {data.profile.ticker} · {data.profile.sector}
              {insight?.companyType && (
                <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold"
                  style={{background: style.color + '15', color: style.color}}>
                  {insight.companyType}
                </span>
              )}
            </div>
            <div style={{fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2}}>
              {data.profile.name}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{color: style.color, opacity: 0.7}}>Investment Verdict</div>
          <div style={{fontSize: 18, fontWeight: 600, color: style.color, letterSpacing: 1}}>
            {verdict}
          </div>
          <div className="text-xs mt-1" style={{color: 'var(--text-muted)'}}>
            Score: {scoreData.composite} · Confidence: {scoreData.confidence}
          </div>
          <div className="text-2xl font-bold num mt-1" style={{color: 'var(--text-primary)'}}>
            {fmtPrice(price)}
            <span className="text-sm font-semibold ml-2" style={{color: data.profile.changePct >= 0 ? '#065f46' : '#991b1b'}}>
              {data.profile.changePct >= 0 ? '+' : ''}{fmt(data.profile.changePct, 2)}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{height: 1, background: style.color + '15', marginBottom: 20}}/>

      {/* ── Key Insight ── */}
      <div className="mb-5 px-4 py-3 rounded-xl" style={{
        background: style.color + '08',
        borderLeft: `3px solid ${style.color}`,
      }}>
        <div className="text-xs font-bold uppercase tracking-widest mb-1"
          style={{color: style.color, opacity: 0.7}}>Key Insight</div>
        {loading ? (
          <div className="text-sm" style={{color: 'var(--text-muted)', fontStyle: 'italic'}}>
            Analyzing {data.profile.ticker}...
          </div>
        ) : (
          <div className="text-sm leading-relaxed" style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>
            "{insight?.keyInsight || 'Generating insight...'}"
          </div>
        )}
      </div>

      {/* ── 3 columns ── */}
      <div className="grid grid-cols-3 gap-4 mb-5">

        {/* Market vs Reality */}
        <div className="rounded-xl p-3" style={{background: 'rgba(255,255,255,0.5)', border: '1px solid var(--border)'}}>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color: 'var(--text-muted)'}}>
            Market vs Reality
          </div>
          {loading ? (
            <div className="text-xs" style={{color: 'var(--text-muted)'}}>Loading...</div>
          ) : (
            <div className="text-xs leading-relaxed" style={{color: 'var(--text-secondary)'}}>
              {insight?.whyMarket || '—'}
            </div>
          )}
          {fcfGap !== null && (
            <div className="mt-2 pt-2 flex justify-between text-xs" style={{borderTop: '1px solid var(--border)'}}>
              <span style={{color: 'var(--text-muted)'}}>Implied vs 5Y Historical</span>
              <span className="font-bold num" style={{color: fcfGap > 8 ? '#991b1b' : '#92400e'}}>
                {fmt(implied, 1)}% vs {fmt(historical, 1)}%
              </span>
            </div>
          )}
        </div>

        {/* Fair Value */}
        <div className="rounded-xl p-3" style={{background: 'rgba(255,255,255,0.5)', border: '1px solid var(--border)'}}>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color: 'var(--text-muted)'}}>
            Fair Value Range
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span style={{color: 'var(--text-muted)'}}>DCF range</span>
              <span className="font-bold num" style={{color: 'var(--text-primary)'}}>
                {fairLow && fairHigh ? `${fmtPrice(fairLow)} – ${fmtPrice(fairHigh)}` : '—'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{color: 'var(--text-muted)'}}>Current price</span>
              <span className="font-bold num" style={{color: 'var(--text-primary)'}}>{fmtPrice(price)}</span>
            </div>
            {upside !== null && (
              <div className="flex justify-between text-xs pt-1" style={{borderTop: '1px solid var(--border)'}}>
                <span style={{color: 'var(--text-muted)'}}>vs Fair Value</span>
                <span className="font-bold num" style={{color: upside >= 0 ? '#065f46' : '#991b1b'}}>
                  {upside >= 0 ? '+' : ''}{fmt(upside, 1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Risk & Opportunity */}
        <div className="rounded-xl p-3" style={{background: 'rgba(255,255,255,0.5)', border: '1px solid var(--border)'}}>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color: 'var(--text-muted)'}}>
            Risk & Opportunity
          </div>
          {loading ? (
            <div className="text-xs" style={{color: 'var(--text-muted)'}}>Loading...</div>
          ) : (
            <div className="flex flex-col gap-2">
              <div>
                <div className="text-xs font-semibold mb-0.5" style={{color: '#991b1b'}}>⚠ Risk</div>
                <div className="text-xs leading-relaxed" style={{color: 'var(--text-secondary)'}}>
                  {insight?.mainRisk || '—'}
                </div>
              </div>
              <div style={{borderTop: '1px solid var(--border)', paddingTop: 8}}>
                <div className="text-xs font-semibold mb-0.5" style={{color: '#065f46'}}>↑ Opportunity</div>
                <div className="text-xs leading-relaxed" style={{color: 'var(--text-secondary)'}}>
                  {insight?.opportunity || '—'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── What Must Happen ── */}
      {insight?.whatMustHappen && (
        <div className="mt-4 px-4 py-3 rounded-xl" style={{
          background: 'rgba(255,255,255,0.4)',
          border: '1px solid var(--border)',
        }}>
          <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{color: 'var(--text-muted)'}}>
            What Must Happen to Justify Valuation
          </div>
          <div className="text-xs leading-relaxed" style={{color: 'var(--text-secondary)'}}>
            {insight.whatMustHappen}
          </div>
        </div>
      )}

      {insight?.narrativeLabel && (
        <div className="mt-3 text-xs" style={{color: 'var(--text-muted)'}}>
          <span className="font-bold uppercase tracking-widest">Narrative: </span>
          <span style={{fontStyle: 'italic'}}>{insight.narrativeLabel}</span>
        </div>
      )}

      {/* ── Company Info + Description ── */}
      <div className="mt-3 pt-3" style={{borderTop: '1px solid var(--border)'}}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs font-bold" style={{color: 'var(--text-muted)'}}>{data.profile.ticker}</span>
          <span className="text-xs" style={{color: 'var(--text-muted)'}}>·</span>
          <span className="text-xs" style={{color: 'var(--text-muted)'}}>{data.profile.exchange}</span>
          {data.profile.employees && <>
            <span className="text-xs" style={{color: 'var(--text-muted)'}}>·</span>
            <span className="text-xs" style={{color: 'var(--text-muted)'}}>{data.profile.employees.toLocaleString()} employees</span>
          </>}
          {data.profile.country && <>
            <span className="text-xs" style={{color: 'var(--text-muted)'}}>·</span>
            <span className="text-xs" style={{color: 'var(--text-muted)'}}>{data.profile.country}</span>
          </>}
        </div>
        <div className="text-xs leading-relaxed" style={{color: 'var(--text-muted)'}}>
          {data.profile.description?.slice(0, 500)}...
        </div>
      </div>

    </div>
  );
}
