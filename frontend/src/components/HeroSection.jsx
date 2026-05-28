import { useEffect, useState } from 'react';
import axios from 'axios';
import { fmt, fmtPrice } from '../utils/format';

const API = 'https://web-production-bdb26.up.railway.app/api';

function fmtMktCap(val) {
  if (!val || val <= 0) return null;
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9)  return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6)  return `$${(val / 1e6).toFixed(0)}M`;
  return `$${val.toLocaleString()}`;
}

const VERDICT_CLASS = {
  'Strong Opportunity': 'buy',
  'Attractive':         'buy',
  'Fairly Valued':      'hold',
  'High Expectations':  'reduce',
  'Caution':            'reduce',
  'Speculative':        'avoid',
};

const VERDICT_ACTION = {
  'Strong Opportunity': 'BUY',
  'Attractive':         'BUY',
  'Fairly Valued':      'HOLD',
  'High Expectations':  'REDUCE',
  'Caution':            'REDUCE',
  'Speculative':        'AVOID',
};

export default function HeroSection({ data, scoreData, dcf }) {
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
  const mktCap = fmtMktCap(data.profile.marketCap);
  const verdict =
    scoreData.composite >= 80 ? 'Strong Opportunity' :
    scoreData.composite >= 65 ? 'Attractive' :
    scoreData.composite >= 50 ? 'Fairly Valued' :
    scoreData.composite >= 35 ? 'High Expectations' :
    'Caution';
  const klass  = VERDICT_CLASS[verdict] || 'hold';
  const action = VERDICT_ACTION[verdict] || 'HOLD';
  const upside = dcf?.fv ? (dcf.fv / price - 1) * 100 : null;

  return (
    <div className={`verdict-card ${klass} mb-4 fade-in`}>

      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          {data.profile.logo && (
            <img
              src={data.profile.logo}
              style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'contain', background: 'white', padding: 4, border: '1px solid var(--border)', flexShrink: 0 }}
              alt=""
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}
          <div style={{ minWidth: 0 }}>
            <div className="t-eyebrow" style={{ marginBottom: 4 }}>{data.profile.ticker} · {data.profile.sector}</div>
            <div className="wordmark" style={{ fontSize: 15, letterSpacing: '1.5px' }}>
              {data.profile.name.toUpperCase()}
            </div>
            <div className="t-meta" style={{ marginTop: 4 }}>
              {data.profile.exchange}
              {data.profile.employees ? ` · ${(data.profile.employees / 1000).toFixed(0)}K employees` : ''}
              {data.profile.country ? ` · ${data.profile.country}` : ''}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="t-eyebrow" style={{ marginBottom: 4 }}>Last · live</div>
          <div className="t-num-hero" style={{ fontSize: 38 }}>{fmtPrice(price)}</div>
          <div className="t-meta" style={{ marginTop: 4, color: data.profile.changePct >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {data.profile.changePct >= 0 ? '+' : ''}{fmt(data.profile.changePct, 2)}% TODAY
            {mktCap && <span style={{ color: 'var(--text-muted)', marginLeft: 10 }}>· MKT CAP {mktCap}</span>}
          </div>
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <div className={`badge ${klass}`}>{verdict} · {action}</div>
        <div className="badge ghost">Confidence · {scoreData.confidence || 'Medium'}</div>
        {upside !== null && (
          <div className={`badge ${upside >= 0 ? 'up' : 'down'}`}>
            {upside >= 0 ? '+' : ''}{fmt(upside, 1)}% vs Fair Value
          </div>
        )}
        <div className="badge ghost">Style · {scoreData.companyStyle || 'Blend'}</div>
      </div>

      {/* AI Insight strip */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
      }}>
        <div style={{ width: 3, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', flexShrink: 0 }} />
        <div style={{ padding: '10px 14px', flex: 1 }}>
          <div className="t-eyebrow" style={{ color: 'var(--accent)', marginBottom: 4 }}>Key insight · AI</div>
          <div className="t-body-sm" style={{ fontStyle: 'italic' }}>
            {loading
              ? `Analyzing ${data.profile.ticker}…`
              : `"${insight?.keyInsight || `Trades at ${upside !== null && upside > 0 ? 'a discount' : 'a premium'} to fair value with ${Math.abs(scoreData.expectationsGap || 0) < 6 ? 'reasonable' : 'aggressive'} growth assumptions.`}"`
            }
          </div>
        </div>
      </div>
    </div>
  );
}
