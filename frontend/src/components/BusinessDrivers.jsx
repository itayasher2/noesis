import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../i18n.jsx';

const API = 'https://web-production-bdb26.up.railway.app/api';

const IMPACT_COLOR = {
  positive: 'var(--green)',
  negative: 'var(--red)',
  neutral:  'var(--amber)',
};
const IMPACT_BG = {
  positive: 'rgba(16,185,129,0.08)',
  negative: 'rgba(239,68,68,0.08)',
  neutral:  'rgba(245,158,11,0.08)',
};
const IMPACT_BORDER = {
  positive: 'rgba(16,185,129,0.22)',
  negative: 'rgba(239,68,68,0.22)',
  neutral:  'rgba(245,158,11,0.22)',
};
const MAGNITUDE_BARS = { high: 3, medium: 2, low: 1 };
const TREND_ICON  = { growing: '↑', stable: '→', declining: '↓' };
const TREND_COLOR = { growing: 'var(--green)', stable: 'var(--text-muted)', declining: 'var(--red)' };

const VALUATION_LABEL = {
  'Primary value driver — core to DCF thesis':        { label: 'Primary Driver',   color: 'var(--green)',  bg: 'rgba(16,185,129,0.10)' },
  'Secondary value driver — meaningful multiple support': { label: 'Secondary Driver', color: 'var(--accent)', bg: 'rgba(125,211,252,0.10)' },
  'Supporting driver — margin or risk factor':         { label: 'Support / Margin', color: 'var(--amber)',  bg: 'rgba(245,158,11,0.10)' },
  'Risk factor — potential value headwind':            { label: 'Risk Factor',      color: 'var(--red)',    bg: 'rgba(239,68,68,0.10)' },
};

function Skeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {[0,1,2,3,4,5].map(i => (
        <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ height: 14, width: '55%', background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 10, animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: 10, width: '90%', background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 6, animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: 10, width: '70%', background: 'var(--bg-elevated)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
        </div>
      ))}
    </div>
  );
}

export default function BusinessDrivers({ data }) {
  const [drivers, setDrivers]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { t, lang } = useLanguage();

  const fetchDrivers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/valuation/business-drivers`, {
        profile:    data.profile,
        financials: data.financials,
        history:    data.history,
        multiples:  data.multiples,
        lang,
      });
      setDrivers(res.data.drivers);
    } catch (e) {
      setError(e.response?.data?.error || t('failedLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data) fetchDrivers();
  }, [data.profile.ticker, lang]);

  const primary   = drivers?.filter(d => d.impact === 'positive') || [];
  const risks     = drivers?.filter(d => d.impact !== 'positive') || [];

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 4 }}>{t('businessDrivers')}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {t('keyValueDriversFor')} <strong style={{ color: 'var(--text-primary)' }}>{data.profile.name}</strong>
          </div>
        </div>
        <button onClick={fetchDrivers} disabled={loading} className="btn-brand" style={{ height: 34, padding: '0 14px', fontSize: 12 }}>
          {loading ? '⟳' : t('refresh')}
        </button>
      </div>

      {/* Error */}
      {error && !loading && (
        <div style={{ padding: '12px 16px', background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 10, color: 'var(--red)', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>⚠ {error}</span>
          <button onClick={fetchDrivers} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>{t('retry')}</button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !drivers && <Skeleton />}

      {/* Driver cards */}
      {drivers && !loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12, marginBottom: 16 }}>
            {drivers.map((d, i) => {
              const valLabel = VALUATION_LABEL[d.valuationImpact];
              return (
                <div key={i} style={{
                  background: 'var(--bg-card)',
                  border: `1px solid var(--border)`,
                  borderLeft: `3px solid ${IMPACT_COLOR[d.impact] || 'var(--border)'}`,
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}>
                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.3 }}>{d.driver}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: TREND_COLOR[d.trend] || 'var(--text-muted)' }}>
                        {TREND_ICON[d.trend] || '→'}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                        background: IMPACT_BG[d.impact] || 'var(--bg-subtle)',
                        color: IMPACT_COLOR[d.impact] || 'var(--text-muted)',
                        border: `1px solid ${IMPACT_BORDER[d.impact] || 'var(--border)'}`,
                        textTransform: 'capitalize',
                      }}>
                        {d.impact}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{d.description}</div>

                  {/* Financial link */}
                  {d.financialLink && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
                      <span style={{ color: 'var(--accent)', fontSize: 12 }}>$</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>{d.metric}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.financialLink}</div>
                      </div>
                    </div>
                  )}

                  {/* Valuation impact tag */}
                  {valLabel && (
                    <div style={{
                      fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                      background: valLabel.bg, color: valLabel.color,
                      alignSelf: 'flex-start',
                    }}>
                      {valLabel.label}
                    </div>
                  )}

                  {/* Magnitude bars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('magnitude')}</span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[1,2,3].map(bar => (
                        <div key={bar} style={{
                          width: 18, height: 5, borderRadius: 2,
                          background: bar <= (MAGNITUDE_BARS[d.magnitude] || 1)
                            ? (IMPACT_COLOR[d.impact] || 'var(--accent)')
                            : 'var(--border)',
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: IMPACT_COLOR[d.impact], textTransform: 'capitalize' }}>{d.magnitude}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary strip */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
            padding: '12px 14px',
            background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 10,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{primary.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('growthDrivers')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--red)' }}>{risks.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('risksHeadwinds')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
                {drivers.filter(d => d.magnitude === 'high').length}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('highMagnitude')}</div>
            </div>
          </div>

          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
            {t('aiPoweredBased')} {data.history?.length || 0}{t('financialDataYears')}
          </div>
        </>
      )}
    </div>
  );
}
