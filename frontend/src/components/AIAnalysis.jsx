import { useState } from 'react';
import { useLanguage } from '../i18n.jsx';

export default function AIAnalysis({ data, dcfParams }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t, lang } = useLanguage();
  const isHe = lang === 'he';

  const generateAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const prompt = `You are a professional equity research analyst. Analyze the following company data and provide a structured analysis in JSON format.

Company: ${data.profile.name} (${data.profile.ticker})
Sector: ${data.profile.sector}
Industry: ${data.profile.industry}

VALUATION:
- Current Price: $${data.profile.price}
- Market Cap: $${(data.profile.marketCap/1e9).toFixed(1)}B
- P/E: ${data.multiples.pe?.toFixed(1)}x
- Forward P/E: ${data.multiples.forwardPE?.toFixed(1)}x
- EV/EBITDA: ${data.multiples.evEbitda?.toFixed(1)}x
- P/S: ${data.multiples.ps?.toFixed(1)}x
- Analyst Target: $${data.multiples.targetPrice?.toFixed(2)} (${data.multiples.analystRating})

FINANCIALS:
- Revenue: $${(data.financials.revenue/1e9).toFixed(1)}B
- EBITDA Margin: ${data.financials.ebitdaMargin?.toFixed(1)}%
- Net Margin: ${data.financials.netMargin?.toFixed(1)}%
- FCF: $${(data.financials.fcf/1e9).toFixed(1)}B
- ROE: ${data.financials.roe?.toFixed(1)}%
- ROIC: ${data.financials.roic?.toFixed(1)}%
- Net Debt/EBITDA: ${data.financials.netDebtEbitda?.toFixed(2)}x

DCF ASSUMPTIONS:
- Growth Rate Y1-5: ${dcfParams?.g1 || 10}%
- Growth Rate Y6-10: ${dcfParams?.g2 || 6}%
- WACC: ${dcfParams?.wacc || 10}%
- Terminal Growth: ${dcfParams?.tgr || 3}%

Respond ONLY with a valid JSON object (no markdown, no backticks):
{
  "investmentThesis": "2-3 sentence summary of buy/hold/sell thesis with key reasoning",
  "verdict": "BUY or HOLD or SELL or UNDERWEIGHT",
  "verdictColor": "green or amber or red",
  "valueDrivers": "One sentence explaining what drives the valuation number",
  "growthClassification": "GROWTH or GROWTH-TO-VALUE or VALUE or MATURE",
  "growthNote": "One sentence on growth vs maturity stage",
  "qualityScore": 7,
  "profitability": "HIGH or MEDIUM or LOW",
  "growthProfile": "HIGH or MEDIUM or LOW",
  "riskLevel": "LOW or MEDIUM or HIGH",
  "redFlags": ["risk 1", "risk 2", "risk 3"],
  "capitalAllocationNote": "One sentence on buybacks/dividends strategy",
  "fcfConsistency": "HIGH or MEDIUM or LOW",
  "smartInsight": "One genuinely insightful sentence about this company",
  "sectorContext": "Is the valuation cheap/fair/expensive vs sector peers?"
}${isHe ? `

IMPORTANT: Write ALL text fields (investmentThesis, valueDrivers, growthNote, redFlags items, capitalAllocationNote, sectorContext, smartInsight) in natural, professional Hebrew (עברית) using correct Israeli financial terminology. Keep "verdict" as one of BUY/HOLD/SELL/UNDERWEIGHT, "verdictColor" as green/amber/red, "growthClassification" as GROWTH/GROWTH-TO-VALUE/VALUE/MATURE, "profitability"/"growthProfile"/"fcfConsistency" as HIGH/MEDIUM/LOW, "riskLevel" as LOW/MEDIUM/HIGH, and "qualityScore" as a number. Do NOT translate these enum values.` : ''}`;

      const response = await fetch('https://web-production-bdb26.up.railway.app/api/valuation/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const result = await response.json();
      const text = result.content?.[0]?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setAnalysis(parsed);
    } catch (e) {
      setError(t('failedAnalysis'));
    } finally {
      setLoading(false);
    }
  };

  const verdictBg    = { green: 'rgba(16,185,129,0.08)', amber: 'rgba(245,158,11,0.08)', red: 'rgba(239,68,68,0.08)' };
  const verdictBdr   = { green: 'rgba(16,185,129,0.25)', amber: 'rgba(245,158,11,0.25)', red: 'rgba(239,68,68,0.25)' };
  const verdictColor = { green: 'var(--green)', amber: 'var(--amber)', red: 'var(--red)' };
  const levelColor   = { HIGH: 'var(--green)', MEDIUM: 'var(--amber)', LOW: 'var(--red)' };
  const riskColor    = { LOW: 'var(--green)', MEDIUM: 'var(--amber)', HIGH: 'var(--red)' };
  const qualityColor = (s) => s >= 8 ? 'var(--green)' : s >= 6 ? 'var(--amber)' : 'var(--red)';

  const card = {
    background: 'var(--bg-card)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 16,
  };
  const sub = {
    background: 'var(--bg-subtle)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 16,
  };

  return (
    <div>
      {!analysis && !loading && (
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{t('aiEquityAnalysis')}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            {t('aiAnalysisDesc')}
          </div>
          <button onClick={generateAnalysis}
            style={{ padding: '12px 32px', background: 'var(--gradient-brand)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {t('generateAnalysis')}
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('analyzingCompany', data.profile.name)}</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {error && (
        <div style={{ padding: 16, background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 12, color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>
          {error}
          <button onClick={generateAnalysis} style={{ marginLeft: 12, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)' }}>{t('tryAgain')}</button>
        </div>
      )}

      {analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Verdict + Thesis */}
          <div style={{ ...card, background: verdictBg[analysis.verdictColor] || 'var(--bg-subtle)', border: `1px solid ${verdictBdr[analysis.verdictColor] || 'var(--border)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div className="t-eyebrow">{t('investmentThesis')}</div>
              <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: verdictColor[analysis.verdictColor] || 'var(--accent)', color: '#fff' }}>
                {analysis.verdict}
              </span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>{analysis.investmentThesis}</p>
          </div>

          {/* Value Drivers + Growth Stage */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={sub}>
              <div className="t-eyebrow" style={{ marginBottom: 8 }}>{t('valueDrivers')}</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{analysis.valueDrivers}</p>
            </div>
            <div style={sub}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div className="t-eyebrow">{t('growthStage')}</div>
                <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(125,211,252,0.12)', color: 'var(--accent)', border: '1px solid rgba(125,211,252,0.25)' }}>
                  {analysis.growthClassification}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{analysis.growthNote}</p>
            </div>
          </div>

          {/* Business Quality */}
          <div style={sub}>
            <div className="t-eyebrow" style={{ marginBottom: 12 }}>{t('businessQuality')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: qualityColor(analysis.qualityScore) }}>{analysis.qualityScore}/10</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('qualityScore')}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: levelColor[analysis.profitability] }}>{analysis.profitability}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('profitability')}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: levelColor[analysis.growthProfile] }}>{analysis.growthProfile}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('growth')}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: riskColor[analysis.riskLevel] }}>{analysis.riskLevel}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('risk')}</div>
              </div>
            </div>
          </div>

          {/* Red Flags */}
          <div style={{ ...sub, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)' }}>
            <div className="t-eyebrow" style={{ color: 'var(--red)', marginBottom: 10 }}>{t('redFlagsRisks')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {analysis.redFlags?.map((flag, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--red)', fontWeight: 600 }}>•</span>{flag}
                </div>
              ))}
            </div>
          </div>

          {/* Capital Allocation + FCF + Sector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div style={sub}>
              <div className="t-eyebrow" style={{ marginBottom: 8 }}>{t('capitalAllocation')}</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{analysis.capitalAllocationNote}</p>
            </div>
            <div style={sub}>
              <div className="t-eyebrow" style={{ marginBottom: 8 }}>{t('fcfConsistency')}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: levelColor[analysis.fcfConsistency], marginBottom: 4 }}>{analysis.fcfConsistency}</div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{t('fcfStability')}</p>
            </div>
            <div style={sub}>
              <div className="t-eyebrow" style={{ marginBottom: 8 }}>{t('sectorContext')}</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{analysis.sectorContext}</p>
            </div>
          </div>

          {/* Smart Insight */}
          <div style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.15) 0%, rgba(125,211,252,0.15) 100%)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 12, padding: 20 }}>
            <div className="t-eyebrow" style={{ color: 'var(--accent-2)', marginBottom: 8 }}>{t('smartInsight')}</div>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{analysis.smartInsight}</p>
          </div>

          <button onClick={generateAnalysis}
            style={{ padding: 10, background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>
            {t('regenerateAnalysis')}
          </button>
        </div>
      )}
    </div>
  );
}
