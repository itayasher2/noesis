import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function FinancialsChart({ history }) {
  if (!history || history.length === 0) return null;
  const data = history.map(r => ({
    name: r.year,
    Revenue: Math.round((r.revenue || 0) / 1e9 * 10) / 10,
    NetIncome: Math.round((r.netIncome || 0) / 1e9 * 10) / 10,
    FCF: Math.round((r.fcf || 0) / 1e9 * 10) / 10,
  }));
  return (
    <div style={{marginTop:'24px'}}>
      <div style={{fontSize:'11px',color:'var(--text-muted)',marginBottom:'8px'}}>Revenue & Earnings ($B)</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{fontSize:12,fill:'var(--text-muted)'}} />
          <YAxis tick={{fontSize:12,fill:'var(--text-muted)'}} unit="B" />
          <Tooltip
            formatter={(v) => '$' + v + 'B'}
            contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)'}}
          />
          <Legend />
          <Bar dataKey="Revenue" name="Revenue" fill="#10b981" radius={[4,4,0,0]} />
          <Bar dataKey="NetIncome" name="Net Income" fill="#3b82f6" radius={[4,4,0,0]} />
          <Bar dataKey="FCF" name="FCF" fill="#f59e0b" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}