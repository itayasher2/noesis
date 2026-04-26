import { fmt, fmtB, fmtPrice } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

export default function ForwardView({ estimates, history, price, shares, netDebt }) {
  if (!estimates || estimates.length === 0) return (
    <div className="text-sm text-center py-8" style={{color:'var(--text-muted)'}}>No analyst estimates available</div>
  );

  const lastHist = history?.[history.length - 1];
  const lastYear = lastHist?.year || new Date().getFullYear() - 1;

  const revenueData = [
    ...( history?.slice(-3).map(h => ({
      year: h.year, value: h.revenue ? h.revenue/1e9 : null, type: 'actual'
    })) || []),
    ...estimates.slice(0,3).map(e => ({
      year: new Date(e.date).getFullYear(),
      value: e.revenueAvg ? e.revenueAvg/1e9 : null,
      low: e.revenueLow ? e.revenueLow/1e9 : null,
      high: e.revenueHigh ? e.revenueHigh/1e9 : null,
      type: 'estimate'
    }))
  ];

  const epsData = [
    ...( history?.slice(-3).map(h => ({
      year: h.year, value: h.eps, type: 'actual'
    })) || []),
    ...estimates.slice(0,3).map(e => ({
      year: new Date(e.date).getFullYear(),
      value: e.epsAvg,
      low: e.epsLow,
      high: e.epsHigh,
      type: 'estimate'
    }))
  ];

  const fwdRevCAGR = estimates.length >= 1 && estimates[0]?.revenueAvg && lastHist?.revenue
    ? ((estimates[0].revenueAvg / lastHist.revenue) - 1) * 100 : null;

  const fwdPE = estimates[0]?.epsAvg && price ? price / estimates[0].epsAvg : null;

  const fwdEVEbitda = estimates[0]?.ebitdaAvg && price && shares && netDebt != null
    ? (price * shares + netDebt) / estimates[0].ebitdaAvg : null;

  const C = {
    p: { color:'var(--text-primary)' },
    s: { color:'var(--text-secondary)' },
    m: { color:'var(--text-muted)' },
    green: { color:'var(--green)' },
    accent: { color:'var(--accent)' },
    bdr: { borderBottom:'1px solid var(--border)' },
    card: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', boxShadow:'var(--shadow)' },
    sub: { background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)' },
  };

  return (
    <div className="fade-in">

      {/* Headline */}
      <div className="rounded-xl p-4 mb-5 border-l-4" style={{background:'var(--accent-subtle)',borderLeftColor:'var(--accent)'}}>
        <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>Forward Consensus</div>
        <div className="text-sm font-semibold" style={C.p}>
          Analysts project <span style={C.accent}>{fwdRevCAGR !== null ? fmt(fwdRevCAGR,1)+'% revenue growth' : 'moderate growth'}</span> over the next year
          {fwdPE && <span style={C.s}> — stock trades at <span style={{color: fwdPE > 30 ? 'var(--red)' : fwdPE > 20 ? 'var(--amber)' : 'var(--green)', fontWeight:600}}>{fmt(fwdPE,1)}x forward P/E</span></span>}
        </div>
      </div>

      {/* Forward Multiples */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label:'Fwd P/E', value: fwdPE ? fmt(fwdPE,1)+'x' : '—', color: fwdPE ? (fwdPE>30?'var(--red)':fwdPE>20?'var(--amber)':'var(--green)') : 'var(--text-muted)', sub:'Based on est. EPS' },
          { label:'Fwd EV/EBITDA', value: fwdEVEbitda ? fmt(fwdEVEbitda,1)+'x' : '—', color: fwdEVEbitda ? (fwdEVEbitda>15?'var(--red)':fwdEVEbitda>10?'var(--amber)':'var(--green)') : 'var(--text-muted)', sub:'Based on est. EBITDA' },
          { label:'Est. EPS (NTM)', value: estimates[0]?.epsAvg ? fmtPrice(estimates[0].epsAvg) : '—', color:'var(--accent)', sub: estimates[0]?.epsLow && estimates[0]?.epsHigh ? `${fmtPrice(estimates[0].epsLow)} – ${fmtPrice(estimates[0].epsHigh)}` : 'Range N/A' },
          { label:'Est. Revenue (NTM)', value: estimates[0]?.revenueAvg ? fmtB(estimates[0].revenueAvg) : '—', color:'var(--accent)', sub: estimates[0]?.revenueLow && estimates[0]?.revenueHigh ? `${fmtB(estimates[0].revenueLow)} – ${fmtB(estimates[0].revenueHigh)}` : 'Range N/A' },
        ].map(item => (
          <div key={item.label} style={C.sub} className="p-3">
            <div className="text-xs mb-1" style={C.m}>{item.label}</div>
            <div className="text-xl font-black num" style={{color:item.color}}>{item.value}</div>
            <div className="text-xs mt-1" style={C.m}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div style={C.card} className="p-4 mb-4">
        <div className="text-xs font-bold uppercase tracking-widest mb-4" style={C.m}>Revenue — Actual vs Forecast ($B)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={revenueData} barSize={28}>
            <XAxis dataKey="year" tick={{fontSize:11,fill:'var(--text-muted)'}}/>
            <YAxis tick={{fontSize:11,fill:'var(--text-muted)'}} unit="B"/>
            <Tooltip
              formatter={(v) => ['$'+fmt(v,1)+'B']}
              contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)'}}
            />
            <ReferenceLine x={lastYear} stroke="var(--border-strong)" strokeDasharray="4 2"/>
            <Bar dataKey="value" radius={[4,4,0,0]}>
              {revenueData.map((entry, i) => (
                <Cell key={i} fill={entry.type==='actual' ? 'var(--accent)' : 'var(--accent-2)'} opacity={entry.type==='actual'?1:0.6}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs" style={C.m}>
          <span>■ <span style={C.accent}>Actual</span></span>
          <span>■ <span style={{color:'var(--accent-2)',opacity:0.8}}>Estimate</span></span>
          <span style={{marginLeft:'auto'}}>Dashed line = last reported year</span>
        </div>
      </div>

      {/* EPS Chart */}
      <div style={C.card} className="p-4 mb-4">
        <div className="text-xs font-bold uppercase tracking-widest mb-4" style={C.m}>EPS — Actual vs Forecast ($)</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={epsData} barSize={28}>
            <XAxis dataKey="year" tick={{fontSize:11,fill:'var(--text-muted)'}}/>
            <YAxis tick={{fontSize:11,fill:'var(--text-muted)'}} unit="$"/>
            <Tooltip
              formatter={(v) => ['$'+fmt(v,2)]}
              contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)'}}
            />
            <ReferenceLine x={lastYear} stroke="var(--border-strong)" strokeDasharray="4 2"/>
            <Bar dataKey="value" radius={[4,4,0,0]}>
              {epsData.map((entry, i) => (
                <Cell key={i} fill={entry.type==='actual' ? 'var(--green)' : 'rgba(52,211,153,0.5)'}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Estimates Table */}
      <div style={C.card} className="p-4">
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>Analyst Estimates — Detail</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs" style={{...C.m,...C.bdr}}>
                <th className="pb-2 text-left">Year</th>
                <th className="pb-2 text-right">Revenue (avg)</th>
                <th className="pb-2 text-right">Revenue range</th>
                <th className="pb-2 text-right">EBITDA</th>
                <th className="pb-2 text-right">Net Income</th>
                <th className="pb-2 text-right">EPS</th>
              </tr>
            </thead>
            <tbody>
              {estimates.slice(0,4).map((e,i) => {
                const yr = new Date(e.date).getFullYear();
                const isFirst = i === 0;
                return (
                  <tr key={yr} style={{...C.bdr, background: isFirst ? 'var(--accent-subtle)' : 'transparent'}}>
                    <td className="py-2 font-bold num" style={{color: isFirst ? 'var(--accent)' : 'var(--text-primary)'}}>
                      {yr} {isFirst && <span className="text-xs font-normal ml-1" style={C.m}>(NTM)</span>}
                    </td>
                    <td className="py-2 text-right num" style={C.p}>{e.revenueAvg ? fmtB(e.revenueAvg) : '—'}</td>
                    <td className="py-2 text-right num text-xs" style={C.m}>{e.revenueLow && e.revenueHigh ? `${fmtB(e.revenueLow)} – ${fmtB(e.revenueHigh)}` : '—'}</td>
                    <td className="py-2 text-right num" style={C.p}>{e.ebitdaAvg ? fmtB(e.ebitdaAvg) : '—'}</td>
                    <td className="py-2 text-right num" style={C.p}>{e.netIncomeAvg ? fmtB(e.netIncomeAvg) : '—'}</td>
                    <td className="py-2 text-right num font-bold" style={{color:'var(--accent)'}}>{e.epsAvg ? fmtPrice(e.epsAvg) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}