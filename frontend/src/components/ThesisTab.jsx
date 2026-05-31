import { useState } from 'react';
import axios from 'axios';
import { fmt, fmtPrice } from '../utils/format';
import { useLanguage } from '../i18n.jsx';

const API = 'https://web-production-bdb26.up.railway.app/api';

function RecBadge({ rec }) {
  const colors = {
    'Strong Buy': { bg: 'rgba(16,185,129,0.12)', color: 'var(--green)', border: 'rgba(16,185,129,0.30)' },
    'Buy':        { bg: 'rgba(16,185,129,0.12)', color: 'var(--green)', border: 'rgba(16,185,129,0.30)' },
    'Hold':       { bg: 'rgba(245,158,11,0.12)', color: 'var(--amber)', border: 'rgba(245,158,11,0.30)' },
    'Reduce':     { bg: 'rgba(249,115,22,0.12)', color: 'var(--orange)', border: 'rgba(249,115,22,0.30)' },
    'Sell':       { bg: 'rgba(239,68,68,0.12)',  color: 'var(--red)',   border: 'rgba(239,68,68,0.30)' },
  };
  const s = colors[rec] || colors['Hold'];
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '4px 14px', borderRadius: 6, fontSize: 13, fontWeight: 700,
    }}>
      {rec}
    </span>
  );
}

export default function ThesisTab({ data, scoreData, dcf, dcfParams }) {
  const [thesis, setThesis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const { t, lang } = useLanguage();

  const generate = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/valuation/thesis`, {
        profile: data.profile,
        financials: data.financials,
        multiples: data.multiples,
        scoreData,
        history: data.history,
        dcf,
        lang,
      });
      setThesis(res.data);
      setGenerated(true);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // Card style with backdrop-filter for proper dark/light glass effect
  const cardBase = {
    background: 'var(--bg-card)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '14px 18px',
    marginBottom: 12,
  };

  const C = {
    card:  cardBase,
    label: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border)' },
    text:  { fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7 },
    point: { fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.6, padding: '6px 0', borderBottom: '1px solid var(--border)' },
  };

  if (!generated) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          {t('investmentMemo')}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
          {t('generateMemoDesc', data.profile.name)}
        </div>
        <button onClick={generate} disabled={loading}
          style={{
            background: 'var(--gradient-brand)', color: 'white',
            border: 'none', borderRadius: 10, padding: '12px 32px',
            fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}>
          {loading ? t('generatingMemo') : t('generateMemoCta')}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{t('analyzingTicker', data.profile.ticker)}</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>

      {/* Header */}
      <div style={{ borderBottom: '2.5px solid var(--accent)', paddingBottom: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          {data.profile.logo && <img src={data.profile.logo} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain', border: '1px solid var(--border)' }} alt="" />}
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
              {data.profile.ticker}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{data.profile.name} · {t('investmentMemo')}</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · Price: {fmtPrice(data.profile.price)} · Market Cap: ${(data.profile.marketCap/1e9).toFixed(1)}B · {data.profile.sector}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <RecBadge rec={thesis.recommendation} />
          {thesis.targetPrice && (
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {t('target')} <strong>{fmtPrice(thesis.targetPrice)}</strong>
              <span style={{ marginLeft: 6, color: thesis.targetPrice > data.profile.price ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                ({thesis.targetPrice > data.profile.price ? '+' : ''}{fmt((thesis.targetPrice/data.profile.price-1)*100, 1)}%)
              </span>
            </span>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('score')} {scoreData?.composite}/100</span>
        </div>
      </div>

      {/* Thesis */}
      <div style={C.card}>
        <div style={C.label}>{t('investmentThesis')}</div>
        <p style={C.text}>{thesis.thesis}</p>
      </div>

      {/* Business Quality */}
      <div style={C.card}>
        <div style={C.label}>{t('businessQuality')}</div>
        <p style={C.text}>{thesis.businessQuality}</p>
      </div>

      {/* Bull & Bear */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ ...C.card, marginBottom: 0, borderLeft: '3px solid var(--green)' }}>
          <div style={{ ...C.label, color: 'var(--green)' }}>{t('bullCase')}</div>
          {thesis.bullPoints?.map((p, i) => (
            <div key={i} style={{ ...C.point, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--green)', fontWeight: 700, flexShrink: 0 }}>↑</span>
              <span>{p}</span>
            </div>
          ))}
        </div>
        <div style={{ ...C.card, marginBottom: 0, borderLeft: '3px solid var(--red)' }}>
          <div style={{ ...C.label, color: 'var(--red)' }}>{t('bearCase')}</div>
          {thesis.bearPoints?.map((p, i) => (
            <div key={i} style={{ ...C.point, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--red)', fontWeight: 700, flexShrink: 0 }}>↓</span>
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Valuation */}
      <div style={C.card}>
        <div style={C.label}>{t('valuationAssessment')}</div>
        <p style={C.text}>{thesis.valuationAssessment}</p>
      </div>

      {/* Risks & Catalysts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ ...C.card, marginBottom: 0 }}>
          <div style={C.label}>{t('keyRisks')}</div>
          {thesis.keyRisks?.map((r, i) => (
            <div key={i} style={{ ...C.point, display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--red)', flexShrink: 0 }}>•</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
        <div style={{ ...C.card, marginBottom: 0 }}>
          <div style={C.label}>{t('catalysts')}</div>
          {thesis.catalysts?.map((c, i) => (
            <div key={i} style={{ ...C.point, display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--green)', flexShrink: 0 }}>•</span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* What Changes View */}
      <div style={{ ...C.card, background: 'var(--amber-bg)', border: '1px solid var(--amber-border)' }}>
        <div style={{ ...C.label, color: 'var(--amber)' }}>{t('whatChangesView')}</div>
        <p style={C.text}>{thesis.whatChangesView}</p>
      </div>

      {/* Bottom Line */}
      <div style={{ ...C.card, background: 'var(--bg-subtle)', borderLeft: '3px solid var(--accent)' }}>
        <div style={C.label}>{t('bottomLine')}</div>
        <p style={{ ...C.text, fontWeight: 600, fontStyle: 'italic' }}>{thesis.bottomLine}</p>
      </div>

      {/* Regenerate */}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button onClick={generate} disabled={loading}
          style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 20px', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
          {t('regenerate')}
        </button>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
        {t('aiDisclaimer')}
      </div>
    </div>
  );
}
