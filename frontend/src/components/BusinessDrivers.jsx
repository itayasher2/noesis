import { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:3001/api';

const IMPACT_COLOR = {
  positive: 'var(--green)',
  negative: 'var(--red)',
  neutral: 'var(--amber)',
};

const MAGNITUDE_BAR = {
  high: 3,
  medium: 2,
  low: 1,
};

const TREND_ICON = {
  growing: '↑',
  stable: '→',
  declining: '↓',
};

const TREND_COLOR = {
  growing: 'var(--green)',
  stable: 'var(--text-muted)',
  declining: 'var(--red)',
};

export default function BusinessDrivers({ data }) {
  const [drivers, setDrivers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const C = {
    p: { color:'var(--text-primary)' },
    s: { color:'var(--text-secondary)' },
    m: { color:'var(--text-muted)' },
    card: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', boxShadow:'var(--shadow)' },
    sub: { background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)' },
    bdr: { borderBottom:'1px solid var(--border)' },
  };

  const fetchDrivers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/valuation/business-drivers`, {
        profile: data.profile,
        financials: data.financials,
        history: data.history,
        multiples: data.multiples,
      });
      setDrivers(res.data.drivers);
    } catch (e) {
      setError('Failed to load business drivers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data) fetchDrivers();
  }, [data.profile.ticker]);

  return (
    <div className="fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>Business Drivers</div>
          <div className="text-sm" style={C.s}>
            Key value drivers for <strong style={C.p}>{data.profile.name}</strong> — AI-powered analysis
          </div>
        </div>
        <button
          onClick={fetchDrivers}
          disabled={loading}
          className="btn-brand px-4 h-9 text-xs"
        >
          {loading ? '⟳ Analyzing...' : '↺ Refresh'}
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm mb-4" style={{background:'var(--red-bg)',color:'var(--red)',border:'1px solid var(--red)'}}>
          {error}
        </div>
      )}

      {loading && !drivers && (
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} style={C.card} className="p-5">
              <div className="h-4 w-32 rounded mb-3" style={{background:'var(--bg-subtle)',animation:'pulse 1.5s infinite'}}></div>
              <div className="h-3 w-full rounded mb-2" style={{background:'var(--bg-subtle)',animation:'pulse 1.5s infinite'}}></div>
              <div className="h-3 w-3/4 rounded" style={{background:'var(--bg-subtle)',animation:'pulse 1.5s infinite'}}></div>
            </div>
          ))}
        </div>
      )}

      {drivers && (
        <>
          {/* Driver Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {drivers.map((d, i) => (
              <div key={i} style={{...C.card, borderLeft:`3px solid ${IMPACT_COLOR[d.impact]}`}} className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-bold text-sm" style={C.p}>{d.driver}</div>
                  <div className="flex items-center gap-2">
                    {/* Trend */}
                    <span className="text-lg font-bold" style={{color:TREND_COLOR[d.trend]}}>
                      {TREND_ICON[d.trend]}
                    </span>
                    {/* Impact badge */}
                    <span className="text-xs px-2 py-0.5 rounded font-semibold capitalize" style={{
                      background: IMPACT_COLOR[d.impact]+'18',
                      color: IMPACT_COLOR[d.impact]
                    }}>
                      {d.impact}
                    </span>
                  </div>
                </div>

                {/* Description */}
<p className="text-xs leading-relaxed mb-2" style={C.s}>{d.description}</p>

{d.financialLink && (
  <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg" style={{background:'var(--bg-subtle)'}}>
    <span className="text-xs font-bold" style={{color:'var(--accent)'}}>💰</span>
    <div>
      <div className="text-xs font-bold" style={{color:'var(--accent)'}}>{d.metric}</div>
      <div className="text-xs" style={C.s}>{d.financialLink}</div>
      {d.valuationImpact && (
  <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg" style={{background:'var(--green-bg)',border:'1px solid var(--green)'}}>
    <span className="text-xs font-bold" style={{color:'var(--green)'}}>📈</span>
    <div>
      <div className="text-xs font-bold" style={{color:'var(--green)'}}>Valuation Impact</div>
      <div className="text-xs" style={C.s}>{d.valuationImpact}</div>
    </div>
  </div>
)}
    </div>
  </div>
)}
                {/* Magnitude bars */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs" style={C.m}>Magnitude:</span>
                  <div className="flex gap-1">
                    {[1,2,3].map(bar => (
                      <div key={bar} style={{
                        width:16, height:6, borderRadius:2,
                        background: bar <= MAGNITUDE_BAR[d.magnitude]
                          ? IMPACT_COLOR[d.impact]
                          : 'var(--border)',
                        transition:'background 0.2s'
                      }}/>
                    ))}
                  </div>
                  <span className="text-xs capitalize" style={{color:IMPACT_COLOR[d.impact]}}>{d.magnitude}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Table */}
          <div style={C.card} className="p-4">
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>Driver Summary</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs" style={{...C.m,...C.bdr}}>
                  <th className="pb-2 text-left">Driver</th>
                  <th className="pb-2 text-center">Impact</th>
                  <th className="pb-2 text-center">Magnitude</th>
                  <th className="pb-2 text-center">Trend</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d, i) => (
                  <tr key={i} style={C.bdr}>
                    <td className="py-2 font-medium" style={C.p}>{d.driver}</td>
                    <td className="py-2 text-center">
                      <span className="text-xs px-2 py-0.5 rounded font-semibold capitalize" style={{
                        background: IMPACT_COLOR[d.impact]+'18',
                        color: IMPACT_COLOR[d.impact]
                      }}>{d.impact}</span>
                    </td>
                    <td className="py-2 text-center">
                      <div className="flex justify-center gap-1">
                        {[1,2,3].map(bar => (
                          <div key={bar} style={{
                            width:12, height:5, borderRadius:1,
                            background: bar <= MAGNITUDE_BAR[d.magnitude]
                              ? IMPACT_COLOR[d.impact]
                              : 'var(--border)',
                          }}/>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 text-center font-bold" style={{color:TREND_COLOR[d.trend]}}>
                      {TREND_ICON[d.trend]} <span className="text-xs capitalize font-normal" style={C.m}>{d.trend}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 pt-3 text-xs" style={{borderTop:'1px solid var(--border)',color:'var(--text-muted)'}}>
              ⚡ Powered by Claude AI — based on financial data and sector context
            </div>
          </div>
        </>
      )}
    </div>
  );
}