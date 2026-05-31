import { useEffect, useState } from 'react';
import axios from 'axios';
import { fmt, fmtPrice } from '../utils/format';
import { useLanguage } from '../i18n.jsx';

const API = 'https://web-production-bdb26.up.railway.app/api';

function fmtMktCap(val) {
  if (!val || val <= 0) return null;
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9)  return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6)  return `$${(val / 1e6).toFixed(0)}M`;
  return `$${val.toLocaleString()}`;
}

function isMarketOpen() {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();
  const minutes = et.getHours() * 60 + et.getMinutes();
  return day >= 1 && day <= 5 && minutes >= 570 && minutes < 960;
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
  const [insightLoading, setInsightLoading] = useState(false);
  const [livePrice, setLivePrice]     = useState(null);
  const [livePct, setLivePct]         = useState(null);
  const [marketOpen, setMarketOpen]   = useState(isMarketOpen());
  const { t } = useLanguage();

  // AI insight
  useEffect(() => {
    if (!data || !scoreData) return;
    setInsight(null);
    setInsightLoading(true);
    axios.post(`${API}/valuation/hero-insight`, {
      profile: data.profile,
      financials: data.financials,
      multiples: data.multiples,
      scoreData,
      history: data.history,
    }).then(res => setInsight(res.data))
      .catch(() => setInsight(null))
      .finally(() => setInsightLoading(false));
  }, [data?.profile?.ticker]);

  // Live price polling
  useEffect(() => {
    if (!data?.profile?.ticker) return;
    setLivePrice(null);
    setLivePct(null);

    const poll = async () => {
      const open = isMarketOpen();
      setMarketOpen(open);
      if (!open) return;
      try {
        const res = await axios.get(`${API}/stock/price/${data.profile.ticker}`);
        if (res.data?.price) {
          setLivePrice(res.data.price);
          setLivePct(res.data.changePct);
          if (res.data.marketState) {
            setMarketOpen(res.data.marketState === 'REGULAR');
          }
        }
      } catch {}
    };

    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, [data?.profile?.ticker]);

  if (!data || !scoreData) return null;

  const price    = livePrice ?? data.profile.price;
  const changePct = livePct  ?? data.profile.changePct;
  const mktCap   = fmtMktCap(data.profile.marketCap);
  const verdict  =
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
              {data.profile.employees ? ` · ${(data.profile.employees / 1000).toFixed(0)}${t('employees')}` : ''}
              {data.profile.country ? ` · ${data.profile.country}` : ''}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {/* Price label */}
          <div className="t-eyebrow" style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            {marketOpen ? (
              <>
                <span style={{
                  display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--green)', boxShadow: '0 0 6px var(--green)',
                  animation: 'pulse 2s infinite',
                }} />
                {t('live')}
              </>
            ) : t('prevClose')}
          </div>

          {/* Price */}
          <div className="t-num-hero" style={{ fontSize: 38 }}>{fmtPrice(price)}</div>

          {/* Change + market closed */}
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            <span className="t-meta" style={{ color: changePct >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {changePct >= 0 ? '+' : ''}{fmt(changePct, 2)}% {t('today')}
            </span>
            {mktCap && (
              <span className="t-meta" style={{ color: 'var(--text-muted)' }}>· {t('mktCap')} {mktCap}</span>
            )}
            {!marketOpen && (
              <span className="t-meta" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>· {t('marketClosed')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <div className={`badge ${klass}`}>{verdict} · {action}</div>
        <div className="badge ghost">{t('confidenceBadge')} · {scoreData.confidence || 'Medium'}</div>
        {upside !== null && (
          <div className={`badge ${upside >= 0 ? 'up' : 'down'}`}>
            {upside >= 0 ? '+' : ''}{fmt(upside, 1)}% {t('vsFairValue')}
          </div>
        )}
        <div className="badge ghost">{t('style')} · {scoreData.companyStyle || 'Blend'}</div>
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
          <div className="t-eyebrow" style={{ color: 'var(--accent)', marginBottom: 4 }}>{t('keyInsightAI')}</div>
          <div className="t-body-sm" style={{ fontStyle: 'italic' }}>
            {insightLoading
              ? `${t('analyzeCta').replace(' ▶','')} ${data.profile.ticker}…`
              : `"${insight?.keyInsight || `Trades at ${upside !== null && upside > 0 ? 'a discount' : 'a premium'} to fair value with ${Math.abs(scoreData.expectationsGap || 0) < 6 ? 'reasonable' : 'aggressive'} growth assumptions.`}"`
            }
          </div>
        </div>
      </div>
    </div>
  );
}
