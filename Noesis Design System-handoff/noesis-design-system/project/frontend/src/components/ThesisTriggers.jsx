import { fmt } from '../utils/format';

export default function ThesisTriggers({ data, dcfParams, scoreData }) {
  const history = data.history || [];
  const revArr = history.filter(r => r.revenue && r.revenue > 0);
  const histRevCAGR = revArr.length >= 2
    ? ((revArr[revArr.length-1].revenue / revArr[0].revenue) ** (1/(revArr.length-1)) - 1) * 100 : null;

  const fcfArr = history.filter(r => r.fcf && r.fcf > 0);
  const histFCFCAGR = fcfArr.length >= 2
    ? ((fcfArr[fcfArr.length-1].fcf / fcfArr[0].fcf) ** (1/(fcfArr.length-1)) - 1) * 100 : null;

  const currentNetMargin = data.financials.netMargin || 0;
  const currentFCFMargin = data.financials.fcfMargin || 0;
  const pe = data.multiples.pe || 0;

  // Dynamic thresholds based on company data
  const bullRevThreshold  = Math.max(10, (histRevCAGR || 5) * 1.5);
  const bearRevThreshold  = Math.max(3,  (histRevCAGR || 5) * 0.5);
  const bullMarginThresh  = currentNetMargin * 1.15;
  const bearMarginThresh  = currentNetMargin * 0.85;
  const bullFCFThresh     = Math.max(10, (histFCFCAGR || 5) * 1.3);

  const C = {
    p: { color:'var(--text-primary)' },
    s: { color:'var(--text-secondary)' },
    m: { color:'var(--text-muted)' },
    card: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', boxShadow:'var(--shadow)' },
    bdr: { borderBottom:'1px solid var(--border)' },
  };

  const bullish = [
    {
      trigger: `Revenue growth exceeds ${fmt(bullRevThreshold,0)}%`,
      impact: 'Re-rate multiple higher — supports premium valuation',
      metric: 'Revenue Growth',
    },
    {
      trigger: `Net margin expands above ${fmt(bullMarginThresh,1)}%`,
      impact: 'FCF growth accelerates — DCF value increases materially',
      metric: 'Net Margin',
    },
    {
      trigger: `FCF growth sustained above ${fmt(bullFCFThresh,0)}%`,
      impact: 'Closes gap between market expectations and delivery',
      metric: 'FCF Growth',
    },
    {
      trigger: 'Competitive moat strengthens or new market opens',
      impact: 'Justifies higher terminal growth assumption',
      metric: 'Terminal Value',
    },
  ];

  const bearish = [
    {
      trigger: `Revenue growth slows below ${fmt(bearRevThreshold,0)}%`,
      impact: 'Multiple compression likely — market re-prices growth premium',
      metric: 'Revenue Growth',
    },
    {
      trigger: `Net margin compresses below ${fmt(bearMarginThresh,1)}%`,
      impact: 'FCF deteriorates — DCF value drops significantly',
      metric: 'Net Margin',
    },
    {
      trigger: 'Competition intensifies or market share loss',
      impact: 'Growth narrative breaks — high execution risk materializes',
      metric: 'Market Share',
    },
    {
      trigger: pe > 25 ? `P/E multiple compresses from ${fmt(pe,0)}x toward market avg` : 'Valuation multiple contracts',
      impact: 'Price decline even if fundamentals hold — de-rating risk',
      metric: 'Valuation Multiple',
    },
  ];

  return (
    <div style={C.card} className="p-5 fade-in">
      <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>
        🔄 What Would Change This View?
      </div>
      <div className="text-sm mb-4" style={C.s}>
        Thesis change triggers — monitor these signals to reassess the investment case
      </div>

      <div className="grid grid-cols-2 gap-5">

        {/* Bullish triggers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{background:'var(--green)'}}></div>
            <div className="text-xs font-bold uppercase tracking-widest" style={{color:'var(--green)'}}>
              Bullish Triggers — Would upgrade view
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {bullish.map((item, i) => (
              <div key={i} className="rounded-lg p-3" style={{
                background:'var(--green-bg)',
                border:'1px solid var(--green)',
                opacity: 0.85,
              }}>
                <div className="flex items-start gap-2 mb-1">
                  <span style={{color:'var(--green)', fontSize:12, marginTop:1, flexShrink:0}}>✓</span>
                  <div className="text-xs font-semibold" style={{color:'var(--green)'}}>{item.trigger}</div>
                </div>
                <div className="text-xs leading-relaxed pl-4" style={C.s}>→ {item.impact}</div>
                <div className="text-xs mt-1 pl-4" style={C.m}>Metric: {item.metric}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bearish triggers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{background:'var(--red)'}}></div>
            <div className="text-xs font-bold uppercase tracking-widest" style={{color:'var(--red)'}}>
              Bearish Triggers — Would downgrade view
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {bearish.map((item, i) => (
              <div key={i} className="rounded-lg p-3" style={{
                background:'var(--red-bg)',
                border:'1px solid var(--red)',
                opacity: 0.85,
              }}>
                <div className="flex items-start gap-2 mb-1">
                  <span style={{color:'var(--red)', fontSize:12, marginTop:1, flexShrink:0}}>✗</span>
                  <div className="text-xs font-semibold" style={{color:'var(--red)'}}>{item.trigger}</div>
                </div>
                <div className="text-xs leading-relaxed pl-4" style={C.s}>→ {item.impact}</div>
                <div className="text-xs mt-1 pl-4" style={C.m}>Metric: {item.metric}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom note */}
      <div className="mt-4 pt-3 text-xs" style={{borderTop:'1px solid var(--border)', color:'var(--text-muted)'}}>
        💡 Thresholds based on {history.length}Y historical data —
        Revenue CAGR: <strong style={C.s}>{histRevCAGR !== null ? fmt(histRevCAGR,1)+'%' : 'N/A'}</strong> ·
        FCF CAGR: <strong style={C.s}>{histFCFCAGR !== null ? fmt(histFCFCAGR,1)+'%' : 'N/A'}</strong> ·
        Current Net Margin: <strong style={C.s}>{fmt(currentNetMargin,1)}%</strong>
      </div>
    </div>
  );
}