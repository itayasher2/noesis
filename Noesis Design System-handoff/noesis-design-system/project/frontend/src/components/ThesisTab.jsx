import { useState } from 'react';
import axios from 'axios';
import { fmt, fmtPrice } from '../utils/format';

const API = 'https://web-production-bdb26.up.railway.app/api';

function RecBadge({ rec }) {
  const colors = {
    'Strong Buy': { bg: '#f0fdf4', color: '#065f46', border: '#a7f3d0' },
    'Buy': { bg: '#f0fdf4', color: '#065f46', border: '#a7f3d0' },
    'Hold': { bg: '#fdfaf5', color: '#78350f', border: '#e5d5b0' },
    'Reduce': { bg: '#fff8f0', color: '#92400e', border: '#e5d0b0' },
    'Sell': { bg: '#fff8f8', color: '#991b1b', border: '#e5b0b0' },
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
      });
      setThesis(res.data);
      setGenerated(true);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const C = {
    card: { background: '#fff', border: '1px solid #ebe9e3', borderRadius: 10, padding: '14px 18px', marginBottom: 12 },
    label: { fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #ebe9e3' },
    text: { fontSize: 14, color: '#222', lineHeight: 1.7 },
    point: { fontSize: 13.5, color: '#222', lineHeight: 1.6, padding: '6px 0', borderBottom: '1px solid #f0ede8' },
  };

  if (!generated) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Investment Memo
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
          Generate a professional investment memo for {data.profile.name} — thesis, bull & bear case, valuation assessment, and key risks.
        </div>
        <button onClick={generate} disabled={loading}
          style={{
            background: 'var(--gradient-brand)', color: 'white',
            border: 'none', borderRadius: 10, padding: '12px 32px',
            fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}>
          {loading ? '⟳ Generating...' : '⚡ Generate Investment Memo'}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>⟳ Analyzing {data.profile.ticker}...</div>
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
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{data.profile.name} · Investment Memo</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · Price: {fmtPrice(data.profile.price)} · Market Cap: ${(data.profile.marketCap/1e9).toFixed(1)}B · {data.profile.sector}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <RecBadge rec={thesis.recommendation} />
          {thesis.targetPrice && (
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Target: <strong>{fmtPrice(thesis.targetPrice)}</strong>
              <span style={{ marginLeft: 6, color: thesis.targetPrice > data.profile.price ? '#065f46' : '#991b1b', fontWeight: 600 }}>
                ({thesis.targetPrice > data.profile.price ? '+' : ''}{fmt((thesis.targetPrice/data.profile.price-1)*100, 1)}%)
              </span>
            </span>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Score: {scoreData?.composite}/100</span>
        </div>
      </div>

      {/* Thesis */}
      <div style={C.card}>
        <div style={C.label}>Investment Thesis</div>
        <p style={C.text}>{thesis.thesis}</p>
      </div>

      {/* Business Quality */}
      <div style={C.card}>
        <div style={C.label}>Business Quality</div>
        <p style={C.text}>{thesis.businessQuality}</p>
      </div>

      {/* Bull & Bear */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ ...C.card, marginBottom: 0, borderLeft: '3px solid #065f46' }}>
          <div style={{ ...C.label, color: '#065f46' }}>🟢 Bull Case</div>
          {thesis.bullPoints?.map((p, i) => (
            <div key={i} style={{ ...C.point, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: '#065f46', fontWeight: 700, flexShrink: 0 }}>↑</span>
              <span>{p}</span>
            </div>
          ))}
        </div>
        <div style={{ ...C.card, marginBottom: 0, borderLeft: '3px solid #991b1b' }}>
          <div style={{ ...C.label, color: '#991b1b' }}>🔴 Bear Case</div>
          {thesis.bearPoints?.map((p, i) => (
            <div key={i} style={{ ...C.point, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: '#991b1b', fontWeight: 700, flexShrink: 0 }}>↓</span>
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Valuation */}
      <div style={C.card}>
        <div style={C.label}>Valuation Assessment</div>
        <p style={C.text}>{thesis.valuationAssessment}</p>
      </div>

      {/* Risks & Catalysts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ ...C.card, marginBottom: 0 }}>
          <div style={C.label}>⚠ Key Risks</div>
          {thesis.keyRisks?.map((r, i) => (
            <div key={i} style={{ ...C.point, display: 'flex', gap: 8 }}>
              <span style={{ color: '#991b1b', flexShrink: 0 }}>•</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
        <div style={{ ...C.card, marginBottom: 0 }}>
          <div style={C.label}>⚡ Catalysts</div>
          {thesis.catalysts?.map((c, i) => (
            <div key={i} style={{ ...C.point, display: 'flex', gap: 8 }}>
              <span style={{ color: '#065f46', flexShrink: 0 }}>•</span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* What Changes View */}
      <div style={{ ...C.card, background: '#fdfaf5', border: '1px solid #e5d5b0' }}>
        <div style={{ ...C.label, color: '#78350f' }}>🔄 What Changes Our View</div>
        <p style={C.text}>{thesis.whatChangesView}</p>
      </div>

      {/* Bottom Line */}
      <div style={{ ...C.card, background: 'var(--bg-subtle)', borderLeft: '3px solid var(--accent)' }}>
        <div style={C.label}>Bottom Line</div>
        <p style={{ ...C.text, fontWeight: 600, fontStyle: 'italic' }}>{thesis.bottomLine}</p>
      </div>

      {/* Regenerate */}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button onClick={generate} disabled={loading}
          style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 20px', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
          ↺ Regenerate
        </button>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
        AI-generated analysis based on financial data. Not investment advice.
      </div>
    </div>
  );
}
