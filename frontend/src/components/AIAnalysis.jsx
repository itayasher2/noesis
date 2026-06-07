import { useState } from 'react';
import axios from 'axios';
import { fmt, fmtPrice, fmtB, fmtPct } from '../utils/format';
import { useLanguage } from '../i18n.jsx';

const API = 'https://web-production-bdb26.up.railway.app/api';

const REC = {
  Buy:    { color: 'var(--green)',  bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.30)' },
  Hold:   { color: 'var(--amber)', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.30)' },
  Reduce: { color: 'var(--orange)', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.30)' },
  Sell:   { color: 'var(--red)',   bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.30)' },
};

const SEV = {
  High:   { color: 'var(--red)',   bg: 'rgba(239,68,68,0.10)' },
  Medium: { color: 'var(--amber)', bg: 'rgba(245,158,11,0.10)' },
  Low:    { color: 'var(--green)', bg: 'rgba(16,185,129,0.10)' },
};

const IMPACT = {
  High:   { color: 'var(--red)',          bg: 'rgba(239,68,68,0.10)' },
  Medium: { color: 'var(--amber)',        bg: 'rgba(245,158,11,0.10)' },
  Low:    { color: 'var(--text-muted)',   bg: 'rgba(107,114,128,0.10)' },
};

function Divider({ label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--text-muted)', whiteSpace: 'nowrap',
      }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

function Tag({ label, color, bg }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '3px 7px', borderRadius: 4,
      color: color || 'var(--text-muted)',
      background: bg || 'var(--bg-subtle)',
      flexShrink: 0,
    }}>{label}</span>
  );
}

export default function AIAnalysis({ data, dcfParams, dcf, scoreData }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t, lang } = useLanguage();
  const isHe = lang === 'he';

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/valuation/analyst-report`, {
        profile:    data.profile,
        financials: data.financials,
        multiples:  data.multiples,
        history:    data.history,
        estimates:  data.estimates || [],
        dcf,
        dcfParams,
        scoreData,
        lang,
      });
      setReport(res.data);
    } catch (e) {
      setError(t('failedAnalysis'));
    } finally {
      setLoading(false);
    }
  };

  /* ── GENERATE PROMPT ── */
  if (!report && !loading && !error) {
    return (
      <div style={{ textAlign: 'center', padding: '52px 24px' }}>
        <div style={{
          width: 64, height: 64, margin: '0 auto 20px',
          background: 'var(--gradient-brand)', borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
        }}>📋</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
          {t('analystReportTitle')}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28, maxWidth: 420, margin: '0 auto 28px', lineHeight: 1.6 }}>
          {t('analystReportDesc', data.profile.name)}
        </div>
        <button onClick={generate} className="btn-brand" style={{ padding: '13px 40px', fontSize: 15, fontWeight: 600, letterSpacing: '0.02em' }}>
          {t('generateReportCta')}
        </button>
      </div>
    );
  }

  /* ── LOADING ── */
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px' }}>
        <div style={{
          width: 44, height: 44, border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
          borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 20px',
        }} />
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
          {t('generatingReport', data.profile.ticker)}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('analysisNote')}</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── ERROR ── */
  if (error) {
    return (
      <div style={{ padding: 16, background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 12, color: 'var(--red)', fontSize: 13 }}>
        {error}
        <button onClick={generate} style={{ marginLeft: 12, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)' }}>
          {t('tryAgain')}
        </button>
      </div>
    );
  }

  /* ── REPORT ── */
  const rec   = REC[report.recommendation] || REC.Hold;
  const bulls = (report.keyPoints || []).filter(p => p.type === 'bull');
  const bears = (report.keyPoints || []).filter(p => p.type === 'bear');
  const retColor = report.impliedReturn >= 15 ? 'var(--green)' : report.impliedReturn >= 0 ? 'var(--amber)' : 'var(--red)';

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }} dir={isHe ? 'rtl' : 'ltr'}>

      {/* ══ HEADER BAND ══ */}
      <div style={{
        background: `linear-gradient(135deg, ${rec.bg} 0%, var(--bg-card) 100%)`,
        border: `1px solid ${rec.border}`,
        borderLeft: `4px solid ${rec.color}`,
        borderRadius: 'var(--radius)', padding: '18px 20px', marginBottom: 14,
      }}>
        {/* Row 1: identity + rating */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
            {data.profile.logo && (
              <img src={data.profile.logo}
                style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'contain', background: 'white', padding: 4, border: '1px solid var(--border)', flexShrink: 0 }}
                alt="" onError={e => { e.target.style.display = 'none'; }} />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                {data.profile.ticker}
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: 14, marginLeft: 8 }}>
                  {data.profile.name}
                </span>
              </div>
              <div className="t-meta" style={{ marginTop: 3 }}>
                {data.profile.exchange} · {data.profile.sector}
                {data.profile.country ? ` · ${data.profile.country}` : ''}
              </div>
              <div className="t-meta" style={{ marginTop: 2, opacity: 0.7 }}>
                {new Date().toLocaleDateString(isHe ? 'he-IL' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                {' · '}{t('analystReportLabel')}
              </div>
            </div>
          </div>

          {/* Recommendation + targets */}
          <div style={{ flexShrink: 0, textAlign: isHe ? 'left' : 'right' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: rec.border.replace('0.30', '0.15'), border: `1.5px solid ${rec.color}`,
              borderRadius: 8, padding: '7px 18px', marginBottom: 10,
            }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: rec.color, letterSpacing: '0.06em' }}>
                {report.recommendation.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 18, justifyContent: isHe ? 'flex-start' : 'flex-end', flexWrap: 'wrap' }}>
              {[
                { label: t('priceTargetLabel'), value: fmtPrice(report.priceTarget), color: rec.color },
                { label: t('impliedReturnLabel'), value: (report.impliedReturn >= 0 ? '+' : '') + fmt(report.impliedReturn, 1) + '%', color: retColor },
                { label: t('riskLabel'), value: report.riskRating, color: (SEV[report.riskRating] || SEV.Medium).color },
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: m.color, fontFamily: 'var(--font-mono)' }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Headline quote */}
        <div style={{
          padding: '10px 14px',
          background: 'rgba(0,0,0,0.05)',
          borderRadius: 6,
          borderLeft: `2px solid ${rec.color}`,
          fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.5,
        }}>
          {report.headline}
        </div>
      </div>

      {/* ══ EXECUTIVE SUMMARY ══ */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px', marginBottom: 12 }}>
        <Divider label={t('executiveSummary')} />
        <p style={{ lineHeight: 1.8, color: 'var(--text-primary)', margin: 0, fontSize: 14 }}>{report.summary}</p>
      </div>

      {/* ══ BUSINESS + FINANCIALS 2-col ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12, marginBottom: 12 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px' }}>
          <Divider label={t('businessOverview')} />
          <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0, fontSize: 13 }}>{report.businessDescription}</p>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px' }}>
          <Divider label={t('financialOutlookLabel')} />
          <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)', margin: '0 0 12px', fontSize: 13 }}>{report.financialOutlook}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: t('revenue'), value: fmtB(data.financials.revenue) },
              { label: t('netMargin'), value: fmtPct(data.financials.netMargin) },
              { label: t('fcf'), value: fmtB(data.financials.fcf) },
            ].map(m => (
              <div key={m.label} style={{ background: 'var(--bg-subtle)', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ VALUATION RATIONALE ══ */}
      <div style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', padding: '16px 18px', marginBottom: 12 }}>
        <Divider label={t('valuationRationaleLabel')} />
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)', margin: '0 0 12px', fontSize: 13 }}>{report.valuationRationale}</p>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            dcf?.fv    && { label: 'DCF',            value: fmtPrice(dcf.fv) },
            report.priceTarget && { label: t('priceTargetLabel'), value: fmtPrice(report.priceTarget), bold: true, color: rec.color },
            data.multiples.pe  && { label: 'P/E',            value: fmt(data.multiples.pe, 1) + 'x' },
            data.multiples.evEbitda && { label: 'EV/EBITDA', value: fmt(data.multiples.evEbitda, 1) + 'x' },
            data.multiples.targetPrice && { label: t('analystTarget').replace(':', ''), value: fmtPrice(data.multiples.targetPrice) },
          ].filter(Boolean).map(m => (
            <div key={m.label}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.label}: </span>
              <span style={{ fontSize: 13, fontWeight: m.bold ? 700 : 600, color: m.color || 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ KEY INVESTMENT POINTS ══ */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px', marginBottom: 12 }}>
        <Divider label={t('keyInvestmentPoints')} />
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10 }}>
          {/* Bull */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>▲</span> {t('bullPointsLabel')}
            </div>
            {bulls.map((p, i) => (
              <div key={i} style={{
                padding: '10px 12px', marginBottom: 7,
                borderLeft: '3px solid var(--green)',
                background: 'rgba(16,185,129,0.04)',
                borderRadius: '0 8px 8px 0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.3 }}>{p.title}</span>
                  <Tag label={p.impact} color={(IMPACT[p.impact]||IMPACT.Low).color} bg={(IMPACT[p.impact]||IMPACT.Low).bg} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p.detail}</div>
              </div>
            ))}
          </div>
          {/* Bear */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>▼</span> {t('bearPointsLabel')}
            </div>
            {bears.map((p, i) => (
              <div key={i} style={{
                padding: '10px 12px', marginBottom: 7,
                borderLeft: '3px solid var(--red)',
                background: 'rgba(239,68,68,0.04)',
                borderRadius: '0 8px 8px 0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.3 }}>{p.title}</span>
                  <Tag label={p.impact} color={(IMPACT[p.impact]||IMPACT.Low).color} bg={(IMPACT[p.impact]||IMPACT.Low).bg} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ SCENARIOS ══ */}
      {report.scenarios && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px', marginBottom: 12 }}>
          <Divider label={t('scenariosLabel')} />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 340 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 500, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', width: '22%' }} />
                  {[
                    { k: 'bull', label: t('bullCase'),  color: 'var(--green)' },
                    { k: 'base', label: t('baseCase'),  color: 'var(--amber)' },
                    { k: 'bear', label: t('bearCase'),  color: 'var(--red)' },
                  ].map(s => (
                    <th key={s.k} style={{ textAlign: 'center', padding: '8px 10px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    rowLabel: t('priceTargetLabel'),
                    cells: ['bull','base','bear'].map(k => ({
                      v: fmtPrice(report.scenarios[k]?.target),
                      color: k === 'bull' ? 'var(--green)' : k === 'base' ? 'var(--amber)' : 'var(--red)',
                      bold: true,
                    })),
                  },
                  {
                    rowLabel: t('probabilityLabel'),
                    cells: ['bull','base','bear'].map(k => ({ v: (report.scenarios[k]?.probability ?? '—') + '%', color: 'var(--text-secondary)' })),
                  },
                  {
                    rowLabel: t('keyDriverLabel'),
                    cells: ['bull','base','bear'].map(k => ({ v: report.scenarios[k]?.trigger, color: 'var(--text-secondary)', small: true })),
                  },
                ].map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 10px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {row.rowLabel}
                    </td>
                    {row.cells.map((c, ci) => (
                      <td key={ci} style={{
                        textAlign: 'center', padding: '10px 10px',
                        fontWeight: c.bold ? 700 : 400,
                        fontFamily: c.bold ? 'var(--font-mono)' : 'inherit',
                        color: c.color,
                        fontSize: c.small ? 12 : 13,
                        lineHeight: c.small ? 1.4 : 1.2,
                      }}>{c.v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ RISKS + CATALYSTS ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12, marginBottom: 12 }}>
        {/* Risks */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px' }}>
          <Divider label={'⚠ ' + t('keyRisksLabel')} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(report.risks || []).map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Tag label={r.severity} color={(SEV[r.severity]||SEV.Medium).color} bg={(SEV[r.severity]||SEV.Medium).bg} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, marginBottom: 2 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Catalysts */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px' }}>
          <Divider label={'⚡ ' + t('catalystsLabel')} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(report.catalysts || []).map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Tag label={c.timeline} color='var(--accent)' bg='rgba(125,211,252,0.10)' />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, marginBottom: 2 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ CONCLUSION ══ */}
      <div style={{
        background: `linear-gradient(135deg, ${rec.bg} 0%, var(--bg-card) 100%)`,
        border: `1px solid ${rec.border}`,
        borderLeft: `3px solid ${rec.color}`,
        borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 16,
      }}>
        <Divider label={t('conclusionLabel')} />
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.75, margin: 0 }}>
          "{report.conclusion}"
        </p>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <button onClick={generate} disabled={loading}
          style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 24px', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
          ↺ {t('regenerate')}
        </button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
        {t('aiDisclaimer')}
      </div>
    </div>
  );
}
