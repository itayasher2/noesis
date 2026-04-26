import { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import axios from 'axios';

const API = 'http://localhost:3001/api';

const PERIODS = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: 'YTD', days: 0 },
  { label: '1Y', days: 365 },
  { label: '5Y', days: 1825 },
  { label: 'MAX', days: 9999 },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', pointerEvents: 'none' }}>
      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>${Number(payload[0].value).toFixed(2)}</div>
      {d?.open && (
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
          <span>Open: ${Number(d.open).toFixed(2)}</span>
          <span>High: ${Number(d.high).toFixed(2)}</span>
          <span>Close: ${Number(d.close).toFixed(2)}</span>
          <span>Low: ${Number(d.low).toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

function CandlestickChart({ data, height }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  if (!data || !data.length) return null;

  const paddingLeft = 52;
  const paddingRight = 12;
  const paddingTop = 10;
  const paddingBottom = 30;
  const W = 800;
  const H = height || 240;
  const chartW = W - paddingLeft - paddingRight;
  const chartH = H - paddingTop - paddingBottom;

  const highs = data.map(d => d.high || d.close);
  const lows = data.map(d => d.low || d.close);
  const minVal = Math.min(...lows) * 0.998;
  const maxVal = Math.max(...highs) * 1.002;
  const range = maxVal - minVal || 1;

  const toY = v => paddingTop + chartH - ((v - minVal) / range) * chartH;
  const toX = i => paddingLeft + (i + 0.5) * (chartW / data.length);
  const candleW = Math.max(2, (chartW / data.length) * 0.65);

  const yTicks = 5;
  const yTickVals = Array.from({ length: yTicks }, (_, i) => minVal + (range * i) / (yTicks - 1));
  const xTickCount = Math.min(6, data.length);
  const xTickIndices = Array.from({ length: xTickCount }, (_, i) =>
    Math.floor(i * (data.length - 1) / Math.max(xTickCount - 1, 1))
  );

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round((mouseX - paddingLeft) / (chartW / data.length) - 0.5);
    if (idx >= 0 && idx < data.length) {
      setHover({ idx, d: data[idx] });
    }
  };

  const handleMouseLeave = () => setHover(null);

  const hoverX = hover ? toX(hover.idx) : null;
  const hoverY = hover ? toY(hover.d.close) : null;

  return (
    <div style={{ position: 'relative' }}>
      {hover && (
        <div style={{
          position: 'absolute', top: 8, left: paddingLeft + 8, background: '#fff',
          border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: '11px', color: '#6b7280',
          pointerEvents: 'none', zIndex: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px'
        }}>
          <span style={{ gridColumn: '1/-1', color: '#9ca3af', marginBottom: '2px' }}>
            {new Date(hover.d.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
          <span style={{ fontWeight: 600, color: '#111827', gridColumn: '1/-1', fontSize: '14px' }}>
            ${Number(hover.d.close).toFixed(2)}
          </span>
          <span>Open: ${Number(hover.d.open || hover.d.close).toFixed(2)}</span>
          <span>High: ${Number(hover.d.high || hover.d.close).toFixed(2)}</span>
          <span>Close: ${Number(hover.d.close).toFixed(2)}</span>
          <span>Low: ${Number(hover.d.low || hover.d.close).toFixed(2)}</span>
        </div>
      )}
      <svg ref={svgRef} width="100%" height={H} viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none" style={{ cursor: 'crosshair' }}
        onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>

        {yTickVals.map((v, i) => (
          <g key={i}>
            <line x1={paddingLeft} y1={toY(v)} x2={W - paddingRight} y2={toY(v)} stroke="#f3f4f6" strokeWidth={1} />
            <text x={paddingLeft - 4} y={toY(v) + 4} textAnchor="end" fontSize={9} fill="#9ca3af">${v.toFixed(0)}</text>
          </g>
        ))}

        {xTickIndices.map(i => (
          <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="#9ca3af">
            {new Date(data[i].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>
        ))}

        {data.map((d, i) => {
          const isUp = d.close >= (d.open || d.close);
          const color = isUp ? '#10b981' : '#ef4444';
          const x = toX(i);
          const bodyTop = toY(Math.max(d.open || d.close, d.close));
          const bodyBot = toY(Math.min(d.open || d.close, d.close));
          const bodyH = Math.max(1, bodyBot - bodyTop);
          return (
            <g key={i}>
              <line x1={x} y1={toY(d.high || d.close)} x2={x} y2={toY(d.low || d.close)} stroke={color} strokeWidth={1} />
              <rect x={x - candleW / 2} y={bodyTop} width={candleW} height={bodyH}
                fill={isUp ? color : color} stroke={color} strokeWidth={0.5} />
            </g>
          );
        })}

        {hover && hoverX && hoverY && (
          <g>
            <line x1={hoverX} y1={paddingTop} x2={hoverX} y2={H - paddingBottom} stroke="#6b7280" strokeWidth={1} strokeDasharray="4 3" />
            <line x1={paddingLeft} y1={hoverY} x2={W - paddingRight} y2={hoverY} stroke="#6b7280" strokeWidth={1} strokeDasharray="4 3" />
            <circle cx={hoverX} cy={hoverY} r={4} fill="#fff" stroke="#374151" strokeWidth={2} />
            <rect x={W - paddingRight - 2} y={hoverY - 9} width={paddingRight + paddingLeft - 2} height={18} fill="#374151" rx={3} />
            <text x={W - paddingRight + (paddingLeft / 2) - 2} y={hoverY + 4} textAnchor="middle" fontSize={8} fill="#fff">
              ${Number(hover.d.close).toFixed(1)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export default function PriceChart({ ticker }) {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState('1Y');
  const [loading, setLoading] = useState(false);
  const [change, setChange] = useState(null);
  const [chartType, setChartType] = useState('line');
  const [fullscreen, setFullscreen] = useState(false);

  const fetchData = useCallback(() => {
    if (!ticker) return;
    setLoading(true);
    const p = PERIODS.find(x => x.label === period);
    let days = p?.days || 365;
    if (period === 'YTD') {
      const now = new Date();
      days = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / 86400000);
    }
    axios.get(`${API}/stock/history/${ticker}?days=${days}`)
      .then(res => {
        const d = res.data;
        if (d && d.length) {
          setData(d);
          const first = d[0]?.close;
          const last = d[d.length - 1]?.close;
          setChange(first && last ? ((last - first) / first * 100) : null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ticker, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isPositive = change >= 0;
  const lineColor = isPositive ? '#10b981' : '#ef4444';

  const formatDate = (v) => {
    if (!v) return '';
    const d = new Date(v);
    if (period === '5Y' || period === 'MAX') return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const chartContent = (height = 240) => (
    <>
      {loading && <div style={{ fontSize: '13px', color: '#9ca3af', padding: '40px', textAlign: 'center' }}>Loading chart...</div>}
      {!loading && data.length > 0 && chartType === 'line' && (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false}
              tickFormatter={formatDate} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
              domain={['auto', 'auto']} tickFormatter={v => '$' + v.toFixed(0)} width={45} />
            <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
            <Line type="monotone" dataKey="close" stroke={lineColor} strokeWidth={2} dot={false}
              activeDot={{ r: 5, fill: lineColor, stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
      {!loading && data.length > 0 && chartType === 'candle' && (
        <CandlestickChart data={data.slice(-Math.min(data.length, 150))} height={height} />
      )}
      {!loading && data.length === 0 && (
        <div style={{ fontSize: '13px', color: '#9ca3af', padding: '40px', textAlign: 'center' }}>No price data available</div>
      )}
    </>
  );

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 500 }}>Stock Price</div>
        {change != null && (
          <div style={{ fontSize: '13px', fontWeight: 600, color: isPositive ? '#10b981' : '#ef4444' }}>
            {isPositive ? '+' : ''}{change.toFixed(2)}%
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          {PERIODS.map(p => (
            <button key={p.label} onClick={() => setPeriod(p.label)}
              style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', border: period === p.label ? 'none' : '1px solid #e5e7eb', background: period === p.label ? '#10b981' : 'transparent', color: period === p.label ? '#fff' : '#6b7280' }}>
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '2px', borderLeft: '1px solid #e5e7eb', paddingLeft: '6px' }}>
          <button onClick={() => setChartType('line')}
            style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer', border: chartType === 'line' ? 'none' : '1px solid #e5e7eb', background: chartType === 'line' ? '#6366f1' : 'transparent', color: chartType === 'line' ? '#fff' : '#6b7280' }}>
            Line
          </button>
          <button onClick={() => setChartType('candle')}
            style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer', border: chartType === 'candle' ? 'none' : '1px solid #e5e7eb', background: chartType === 'candle' ? '#6366f1' : 'transparent', color: chartType === 'candle' ? '#fff' : '#6b7280' }}>
            Candles
          </button>
        </div>
        <button onClick={() => setFullscreen(!fullscreen)}
          style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer', border: '1px solid #e5e7eb', background: 'transparent', color: '#6b7280' }}>
          {fullscreen ? '✕ Close' : '⛶ Expand'}
        </button>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#fff', zIndex: 1000, padding: '24px', display: 'flex', flexDirection: 'column' }}>
        {header}
        <div style={{ flex: 1 }}>
          {chartContent(window.innerHeight - 120)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '16px' }}>
      {header}
      {chartContent(240)}
    </div>
  );
}