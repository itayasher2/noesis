import { useState } from 'react';

export default function AIAnalysis({ data, dcfParams }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
}`;

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
      setError('Failed to generate analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verdictColors = {
    green: { bg: '#dcfce7', border: '#86efac', text: '#166534' },
    amber: { bg: '#fef9c3', border: '#fde047', text: '#854d0e' },
    red:   { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
  };
  const levelColors = { HIGH: '#10b981', MEDIUM: '#f59e0b', LOW: '#ef4444' };
  const riskColors  = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444' };
  const qualityColor = (s) => s >= 8 ? '#10b981' : s >= 6 ? '#f59e0b' : '#ef4444';

  return (
    <div>
      {!analysis && !loading && (
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤖</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>AI Equity Analysis</div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
            Generate a professional analyst report including Investment Thesis, Quality Score, Red Flags, and Smart Insights.
          </div>
          <button onClick={generateAnalysis}
            style={{ padding: '12px 32px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            Generate Analysis ▶
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }}></div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>Analyzing {data.profile.name}...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {error && (
        <div style={{ padding: '16px', background: '#fee2e2', borderRadius: '12px', color: '#991b1b', fontSize: '13px', marginBottom: '12px' }}>
          {error}
          <button onClick={generateAnalysis} style={{ marginLeft: '12px', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}>Try again</button>
        </div>
      )}

      {analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div style={{ background: verdictColors[analysis.verdictColor]?.bg || '#f9fafb', border: `1px solid ${verdictColors[analysis.verdictColor]?.border || '#e5e7eb'}`, borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Investment Thesis</div>
              <span style={{ padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: verdictColors[analysis.verdictColor]?.text || '#374151', color: '#fff' }}>
                {analysis.verdict}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#1f2937', lineHeight: 1.7, margin: 0 }}>{analysis.investmentThesis}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Value Drivers</div>
              <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, margin: 0 }}>{analysis.valueDrivers}</p>
            </div>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Growth Stage</div>
                <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#e0f2fe', color: '#0369a1' }}>{analysis.growthClassification}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, margin: 0 }}>{analysis.growthNote}</p>
            </div>
          </div>

          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '12px' }}>Business Quality</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: qualityColor(analysis.qualityScore) }}>{analysis.qualityScore}/10</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Quality Score</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: levelColors[analysis.profitability] }}>{analysis.profitability}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Profitability</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: levelColors[analysis.growthProfile] }}>{analysis.growthProfile}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Growth</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: riskColors[analysis.riskLevel] }}>{analysis.riskLevel}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Risk</div>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#9a3412', textTransform: 'uppercase', marginBottom: '10px' }}>⚠ Red Flags & Risks</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {analysis.redFlags?.map((flag, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#374151' }}>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>•</span>{flag}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Capital Allocation</div>
              <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, margin: 0 }}>{analysis.capitalAllocationNote}</p>
            </div>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>FCF Consistency</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: levelColors[analysis.fcfConsistency], marginBottom: '4px' }}>{analysis.fcfConsistency}</div>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Free Cash Flow Stability</p>
            </div>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Sector Context</div>
              <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, margin: 0 }}>{analysis.sectorContext}</p>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase', marginBottom: '8px' }}>💡 Smart Insight</div>
            <p style={{ fontSize: '14px', color: '#e0e7ff', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{analysis.smartInsight}</p>
          </div>

          <button onClick={generateAnalysis}
            style={{ padding: '10px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '12px', color: '#6b7280', cursor: 'pointer' }}>
            Regenerate Analysis ↺
          </button>
        </div>
      )}
    </div>
  );
}