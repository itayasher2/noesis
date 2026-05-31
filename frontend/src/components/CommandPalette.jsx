import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n.jsx';

const API = 'https://web-production-bdb26.up.railway.app/api';

const TICKER_INDEX = [
  { sym: 'AAPL',  name: 'Apple Inc.',            sector: 'Consumer Tech'   },
  { sym: 'NVDA',  name: 'NVIDIA Corporation',    sector: 'Semiconductors'  },
  { sym: 'MSFT',  name: 'Microsoft Corp.',       sector: 'Software'        },
  { sym: 'GOOG',  name: 'Alphabet Inc.',         sector: 'Internet'        },
  { sym: 'META',  name: 'Meta Platforms',        sector: 'Internet'        },
  { sym: 'AMZN',  name: 'Amazon.com',            sector: 'E-Commerce'      },
  { sym: 'TSLA',  name: 'Tesla Inc.',            sector: 'Auto'            },
  { sym: 'AMD',   name: 'Advanced Micro Devices',sector: 'Semiconductors'  },
  { sym: 'BRK.B', name: 'Berkshire Hathaway',   sector: 'Conglomerate'    },
  { sym: 'JPM',   name: 'JPMorgan Chase',        sector: 'Banking'         },
  { sym: 'V',     name: 'Visa Inc.',             sector: 'Payments'        },
  { sym: 'NFLX',  name: 'Netflix Inc.',          sector: 'Streaming'       },
  { sym: 'COST',  name: 'Costco Wholesale',      sector: 'Retail'          },
  { sym: 'ORCL',  name: 'Oracle Corporation',    sector: 'Software'        },
  { sym: 'INTC',  name: 'Intel Corporation',     sector: 'Semiconductors'  },
  { sym: 'UBER',  name: 'Uber Technologies',     sector: 'Tech'            },
  { sym: 'SPOT',  name: 'Spotify Technology',    sector: 'Streaming'       },
  { sym: 'PLTR',  name: 'Palantir Technologies', sector: 'AI/Data'         },
  { sym: 'SNOW',  name: 'Snowflake Inc.',        sector: 'Cloud'           },
  { sym: 'COIN',  name: 'Coinbase Global',       sector: 'Crypto'          },
];

const US_EXCHANGES = new Set(['NASDAQ', 'NYSE', 'NYSE ARCA', 'NYSE MKT', 'AMEX', 'NYSEArca']);

function Hint({ k, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <kbd style={{ padding: '1px 5px', fontSize: 9, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{k}</kbd>
      <span style={{ textTransform: 'uppercase' }}>{label}</span>
    </span>
  );
}

export default function CommandPalette({ open, onClose, onPick }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [fmpResults, setFmpResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery(''); setCursor(0); setFmpResults([]);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Debounced FMP search
  useEffect(() => {
    const q = query.trim();
    if (!q || q.length < 1) { setFmpResults([]); setSearching(false); return; }
    setSearching(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/stock/search/${encodeURIComponent(q.toUpperCase())}`);
        const data = await res.json();
        const filtered = (Array.isArray(data) ? data : [])
          .filter(r => US_EXCHANGES.has(r.exchangeShortName))
          .slice(0, 8);
        setFmpResults(filtered);
      } catch {
        setFmpResults([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  if (!open) return null;

  const q = query.trim().toUpperCase();

  // Local predefined matches
  const localMatched = !q
    ? TICKER_INDEX
    : TICKER_INDEX.filter(item =>
        item.sym.includes(q) || item.name.toUpperCase().includes(q) || item.sector.toUpperCase().includes(q));

  // FMP results not already in local
  const localSymSet = new Set(localMatched.map(i => i.sym));
  const fmpUnique = fmpResults
    .filter(r => !localSymSet.has(r.symbol))
    .map(r => ({ sym: r.symbol, name: r.name, sector: r.exchangeShortName }));

  const merged = [...localMatched, ...fmpUnique];

  // Direct "Analyze [TICKER]" option at top when query is non-empty and not an exact local match
  const hasExactLocal = localMatched.some(i => i.sym === q);
  const directItem = q && !hasExactLocal ? { sym: q, name: t('analyzeDirectly', q), sector: t('anyUSTicker'), isDirect: true } : null;

  const displayList = directItem ? [directItem, ...merged] : merged;

  const pick = (item) => { if (!item) return; onPick(item.sym); onClose(); };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown')    { e.preventDefault(); setCursor(c => Math.min(displayList.length - 1, c + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(0, c - 1)); }
    else if (e.key === 'Enter')   { e.preventDefault(); pick(displayList[cursor]); }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,4,12,0.7)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}
      onClick={onClose}
    >
      <div className="card glow" style={{ width: 'min(640px, 92vw)', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--accent)', fontSize: 16 }}>▶</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={onKeyDown}
            placeholder={t('searchTickerPlaceholder')}
            style={{ flex: 1, height: 32, padding: 0, border: 'none', background: 'transparent', outline: 'none', boxShadow: 'none', color: 'var(--text-primary)', fontSize: 14 }}
          />
          {searching && <span style={{ color: 'var(--text-muted)', fontSize: 12, animation: 'pulse 1s infinite' }}>⟳</span>}
          <kbd style={{ padding: '2px 7px', fontSize: 10, fontFamily: 'var(--font-mono)', background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 3, letterSpacing: '0.04em' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
          {displayList.length === 0 && !searching ? (
            <div style={{ padding: 24, textAlign: 'center' }}><div className="t-eyebrow">{t('noMatches')}</div></div>
          ) : (
            displayList.map((item, i) => (
              <button key={item.sym + i} onClick={() => pick(item)} onMouseEnter={() => setCursor(i)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                  padding: '10px 18px',
                  background: cursor === i ? 'var(--bg-subtle)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  borderLeft: `2px solid ${cursor === i ? (item.isDirect ? 'var(--green)' : 'var(--accent)') : 'transparent'}`,
                  textAlign: 'left',
                }}>
                {item.isDirect ? (
                  <>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>🔍</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: 1.5, color: cursor === i ? 'var(--green)' : 'var(--text-primary)' }}>{item.sym}</div>
                      <div className="t-meta" style={{ marginTop: 2 }}>{item.sector}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: 1.5, color: cursor === i ? 'var(--accent)' : 'var(--text-primary)', minWidth: 60 }}>{item.sym}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      <div className="t-meta" style={{ marginTop: 2 }}>{item.sector}</div>
                    </div>
                  </>
                )}
                {cursor === i && <span style={{ color: item.isDirect ? 'var(--green)' : 'var(--accent)', fontSize: 14, flexShrink: 0 }}>↵</span>}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
          <Hint k="↑↓" label={t('navigate')} />
          <Hint k="↵" label={t('selectCmd')} />
          <Hint k="ESC" label={t('closeCmd')} />
          <span style={{ marginLeft: 'auto' }}>{t('cmdResults', displayList.length, TICKER_INDEX.length)}</span>
        </div>
      </div>
    </div>
  );
}
