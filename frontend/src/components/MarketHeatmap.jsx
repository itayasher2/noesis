import { useEffect, useState, useCallback } from 'react';

const SECTOR_MAP = {
  AAPL:'tech',MSFT:'tech',NVDA:'tech',AMZN:'tech',GOOGL:'tech',META:'tech',TSLA:'tech',
  AVGO:'tech',AMD:'tech',INTC:'tech',QCOM:'tech',ADBE:'tech',CRM:'tech',ORCL:'tech',
  PLTR:'tech',SNOW:'tech',NOW:'tech',TXN:'tech',AMAT:'tech',LRCX:'tech',MRVL:'tech',
  PANW:'tech',CRWD:'tech',NET:'tech',DDOG:'tech',ZS:'tech',TEAM:'tech',WDAY:'tech',
  JPM:'finance',BAC:'finance',WFC:'finance',GS:'finance',MS:'finance',V:'finance',
  MA:'finance',AXP:'finance',BLK:'finance',SCHW:'finance',C:'finance',USB:'finance',
  PNC:'finance',COF:'finance',ICE:'finance',CME:'finance',SPGI:'finance',MCO:'finance',
  CB:'finance',PGR:'finance',TRV:'finance',MET:'finance',ALL:'finance',
  LLY:'health',JNJ:'health',UNH:'health',PFE:'health',ABBV:'health',MRK:'health',
  TMO:'health',ABT:'health',AMGN:'health',GILD:'health',CVS:'health',MDT:'health',
  BMY:'health',ISRG:'health',SYK:'health',BSX:'health',IDXX:'health',
  WMT:'consumer',COST:'consumer',HD:'consumer',MCD:'consumer',NKE:'consumer',
  SBUX:'consumer',DIS:'consumer',NFLX:'consumer',CMCSA:'consumer',PG:'consumer',
  KO:'consumer',PEP:'consumer',PM:'consumer',TGT:'consumer',LOW:'consumer',
  ROST:'consumer',TJX:'consumer',DG:'consumer',DLTR:'consumer',
  XOM:'energy',CVX:'energy',COP:'energy',SLB:'energy',OXY:'energy',
  MPC:'energy',PSX:'energy',EOG:'energy',KMI:'energy',HAL:'energy',DVN:'energy',
  CAT:'industrial',DE:'industrial',HON:'industrial',GE:'industrial',RTX:'industrial',
  LMT:'industrial',NOC:'industrial',GD:'industrial',BA:'industrial',UPS:'industrial',
  FDX:'industrial',UNP:'industrial',NSC:'industrial',EMR:'industrial',ETN:'industrial',
  COIN:'crypto',MSTR:'crypto',MARA:'crypto',RIOT:'crypto',HUT:'crypto',
};

const NAMES = {
  AAPL:'Apple',MSFT:'Microsoft',NVDA:'NVIDIA',AMZN:'Amazon',GOOGL:'Alphabet',META:'Meta',
  TSLA:'Tesla',AVBO:'Broadcom',AMD:'AMD',INTC:'Intel',QCOM:'Qualcomm',ADBE:'Adobe',
  CRM:'Salesforce',ORCL:'Oracle',PLTR:'Palantir',SNOW:'Snowflake',NOW:'ServiceNow',
  TXN:'Texas Instr.',AMAT:'Applied Materials',LRCX:'Lam Research',MRVL:'Marvell',
  PANW:'Palo Alto',CRWD:'CrowdStrike',NET:'Cloudflare',DDOG:'Datadog',ZS:'Zscaler',
  TEAM:'Atlassian',WDAY:'Workday',JPM:'JPMorgan',BAC:'Bank of America',WFC:'Wells Fargo',
  GS:'Goldman Sachs',MS:'Morgan Stanley',V:'Visa',MA:'Mastercard',AXP:'Amex',
  BLK:'BlackRock',SCHW:'Schwab',C:'Citigroup',USB:'U.S. Bancorp',PNC:'PNC',
  COF:'Capital One',ICE:'ICE',CME:'CME Group',SPGI:'S&P Global',MCO:"Moody's",
  CB:'Chubb',PGR:'Progressive',TRV:'Travelers',MET:'MetLife',ALL:'Allstate',
  LLY:'Eli Lilly',JNJ:'J&J',UNH:'UnitedHealth',PFE:'Pfizer',ABBV:'AbbVie',
  MRK:'Merck',TMO:'Thermo Fisher',ABT:'Abbott',AMGN:'Amgen',GILD:'Gilead',
  CVS:'CVS',MDT:'Medtronic',BMY:'Bristol-Myers',ISRG:'Intuitive Surgical',
  SYK:'Stryker',BSX:'Boston Scientific',IDXX:'IDEXX',WMT:'Walmart',COST:'Costco',
  HD:'Home Depot',MCD:"McDonald's",NKE:'Nike',SBUX:'Starbucks',DIS:'Disney',
  NFLX:'Netflix',CMCSA:'Comcast',PG:'P&G',KO:'Coca-Cola',PEP:'PepsiCo',
  PM:'Philip Morris',TGT:'Target',LOW:"Lowe's",ROST:'Ross',TJX:'TJX',
  DG:'Dollar General',DLTR:'Dollar Tree',XOM:'ExxonMobil',CVX:'Chevron',
  COP:'ConocoPhillips',SLB:'SLB',OXY:'Occidental',MPC:'Marathon Petro',
  PSX:'Phillips 66',EOG:'EOG Resources',KMI:'Kinder Morgan',HAL:'Halliburton',
  DVN:'Devon Energy',CAT:'Caterpillar',DE:'Deere',HON:'Honeywell',GE:'GE',
  RTX:'RTX',LMT:'Lockheed Martin',NOC:'Northrop Grumman',GD:'General Dynamics',
  BA:'Boeing',UPS:'UPS',FDX:'FedEx',UNP:'Union Pacific',NSC:'Norfolk Southern',
  EMR:'Emerson',ETN:'Eaton',COIN:'Coinbase',MSTR:'MicroStrategy',
  MARA:'Marathon Digital',RIOT:'Riot Platforms',HUT:'Hut 8',
};

const SECTORS = [
  { label: 'All',        key: 'all'        },
  { label: 'Technology', key: 'tech'       },
  { label: 'Finance',    key: 'finance'    },
  { label: 'Healthcare', key: 'health'     },
  { label: 'Consumer',   key: 'consumer'   },
  { label: 'Energy',     key: 'energy'     },
  { label: 'Industrial', key: 'industrial' },
  { label: 'Crypto',     key: 'crypto'     },
];

function chgColor(v) {
  if (v === null || v === undefined || isNaN(v)) return '#5a5a5a';
  if (v >= 5)   return '#0d4a2e';
  if (v >= 3)   return '#155f3e';
  if (v >= 1.5) return '#1a7a5e';
  if (v >= 0.3) return '#2a9e72';
  if (v >= 0)   return '#3ab882';
  if (v > -0.3) return '#c88080';
  if (v > -1.5) return '#c45050';
  if (v > -3)   return '#a83030';
  return '#7b2020';
}

function logoUrl(sym) {
  return `https://cdn.jsdelivr.net/gh/nvstly/icons/ticker/${sym.replace('.', '').toUpperCase()}.png`;
}

function fmtNum(v) {
  if (!v) return '–';
  if (v > 1e12) return (v / 1e12).toFixed(2) + 'T';
  if (v > 1e9)  return (v / 1e9).toFixed(1) + 'B';
  if (v > 1e6)  return (v / 1e6).toFixed(1) + 'M';
  if (v > 1e3)  return (v / 1e3).toFixed(0) + 'K';
  return String(v);
}

export default function MarketHeatmap({ onSelectTicker }) {
  const [stocks, setStocks]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [sector, setSector]         = useState('all');
  const [selected, setSelected]     = useState(null);
  const [updatedAt, setUpdatedAt]   = useState(null);
  const [logoErrors, setLogoErrors] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/market/heatmap');
      if (!res.ok) throw new Error('Failed to load market data');
      const json = await res.json();
      setStocks(json.data || []);
      setUpdatedAt(new Date(json.updatedAt).toLocaleTimeString('en-US'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const visible = stocks
    .filter(s => sector === 'all' || SECTOR_MAP[s.symbol] === sector)
    .sort((a, b) => (b.change || 0) - (a.change || 0));

  const handleSelect = (stock) => {
    const next = selected?.symbol === stock.symbol ? null : stock;
    setSelected(next);
    if (next && onSelectTicker) onSelectTicker(stock.symbol);
  };

  return (
    <div style={{ fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 10px' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Market Heatmap</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
            S&P 500 + NASDAQ · {visible.length} stocks
            {updatedAt && <span style={{ marginLeft: 8 }}>· Updated {updatedAt}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 10, color: '#888', marginRight: 4 }}>-5%</span>
          {['#7b2020','#b03030','#d45050','#999','#3ab882','#2a9e72','#1a7a5e'].map((c, i) => (
            <div key={i} style={{ width: i === 3 ? 9 : 12, height: 8, borderRadius: 2, background: c }} />
          ))}
          <span style={{ fontSize: 10, color: '#888', marginLeft: 4 }}>+5%</span>
        </div>
      </div>

      {/* Sector filters */}
      <div style={{ display: 'flex', gap: 5, padding: '0 20px 12px', flexWrap: 'wrap' }}>
        {SECTORS.map(s => (
          <button
            key={s.key}
            onClick={() => { setSector(s.key); setSelected(null); }}
            style={{
              padding: '3px 11px', borderRadius: 14, fontSize: 11, fontWeight: 500,
              cursor: 'pointer', border: '0.5px solid #ddd', transition: 'all .12s',
              background: sector === s.key ? '#1a7a5e' : 'white',
              color: sector === s.key ? '#fff' : '#666',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Selected stock panel */}
      {selected && (() => {
        const d = selected;
        const isPos = (d.change || 0) >= 0;
        return (
          <div style={{ margin: '0 20px 14px', padding: '14px 18px', borderRadius: 10, border: '0.5px solid #e5e5e5', background: 'white', display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ width: 40, height: 40, borderRadius: 9, border: '0.5px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {!logoErrors[d.symbol] ? (
                <img src={logoUrl(d.symbol)} alt={d.symbol} onError={() => setLogoErrors(p => ({ ...p, [d.symbol]: true }))} style={{ width: 32, height: 32, objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: '#888' }}>{d.symbol.slice(0, 2)}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {NAMES[d.symbol] || d.symbol}
                <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>{d.symbol}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 500 }}>${d.price?.toFixed(2) || '–'}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: isPos ? '#1a7a5e' : '#d44' }}>
                  {isPos ? '+' : ''}{d.change?.toFixed(2)}% ({isPos ? '+' : ''}{d.changeAbs?.toFixed(2)})
                </span>
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
                {[
                  ['Open',    '$' + (d.open?.toFixed(2)   || '–')],
                  ['High',    '$' + (d.high?.toFixed(2)   || '–')],
                  ['Low',     '$' + (d.low?.toFixed(2)    || '–')],
                  ['Volume',  fmtNum(d.volume)],
                  ['Mkt Cap', fmtNum(d.marketCap)],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#aaa' }}>✕</button>
          </div>
        );
      })()}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, gap: 10, color: '#888', fontSize: 13 }}>
          <div style={{ width: 16, height: 16, border: '2px solid #eee', borderTopColor: '#1a7a5e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Loading market data...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '0 20px 20px', color: '#c44', fontSize: 13 }}>
          Error: {error}
        </div>
      )}

      {/* Heatmap grid */}
      {!loading && !error && (
        <div style={{ display: 'grid', gap: 3, padding: '0 20px 20px', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
          {visible.map(stock => {
            const { symbol, price, change } = stock;
            const bg = chgColor(change);
            const chgStr = change !== null ? (change >= 0 ? '+' : '') + change.toFixed(2) + '%' : '–';

            return (
              <div
                key={symbol}
                onClick={() => handleSelect(stock)}
                style={{
                  background: bg, height: 92, borderRadius: 8, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '8px 4px',
                  outline: selected?.symbol === symbol ? '2px solid rgba(255,255,255,0.8)' : 'none',
                  transition: 'transform .12s, filter .12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.filter = 'brightness(1.15)'; e.currentTarget.style.zIndex = '5'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'none'; e.currentTarget.style.zIndex = '1'; }}
              >
                {!logoErrors[symbol] ? (
                  <img
                    src={logoUrl(symbol)}
                    alt={symbol}
                    onError={() => setLogoErrors(p => ({ ...p, [symbol]: true }))}
                    style={{ width: 24, height: 24, borderRadius: 5, objectFit: 'contain', background: 'rgba(255,255,255,.18)', padding: 2, marginBottom: 4 }}
                  />
                ) : (
                  <div style={{ width: 24, height: 24, borderRadius: 5, background: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.9)', marginBottom: 4 }}>
                    {symbol.slice(0, 2)}
                  </div>
                )}
                <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,.3)', letterSpacing: '.02em' }}>{symbol}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.85)', marginTop: 2 }}>{chgStr}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,.65)', marginTop: 1 }}>{price ? '$' + price.toFixed(2) : ''}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
