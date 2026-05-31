import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n.jsx';

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
];

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
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery(''); setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.trim().toUpperCase();
  const filtered = !q
    ? TICKER_INDEX
    : TICKER_INDEX.filter(t =>
        t.sym.includes(q) || t.name.toUpperCase().includes(q) || t.sector.toUpperCase().includes(q));

  const pick = (t) => { if (!t) return; onPick(t.sym); onClose(); };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown')      { e.preventDefault(); setCursor(c => Math.min(filtered.length - 1, c + 1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(0, c - 1)); }
    else if (e.key === 'Enter')     { e.preventDefault(); pick(filtered[cursor]); }
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
          <kbd style={{ padding: '2px 7px', fontSize: 10, fontFamily: 'var(--font-mono)', background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 3, letterSpacing: '0.04em' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center' }}><div className="t-eyebrow">{t('noMatches')}</div></div>
          ) : (
            filtered.map((t, i) => (
              <button key={t.sym} onClick={() => pick(t)} onMouseEnter={() => setCursor(i)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                  padding: '10px 18px',
                  background: cursor === i ? 'var(--bg-subtle)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  borderLeft: `2px solid ${cursor === i ? 'var(--accent)' : 'transparent'}`,
                  textAlign: 'left',
                }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: 1.5, color: cursor === i ? 'var(--accent)' : 'var(--text-primary)', minWidth: 60 }}>{t.sym}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                  <div className="t-meta" style={{ marginTop: 2 }}>{t.sector}</div>
                </div>
                {cursor === i && <span style={{ color: 'var(--accent)', fontSize: 14 }}>↵</span>}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
          <Hint k="↑↓" label={t('navigate')} />
          <Hint k="↵" label={t('selectCmd')} />
          <Hint k="ESC" label={t('closeCmd')} />
          <span style={{ marginLeft: 'auto' }}>{t('cmdResults', filtered.length, TICKER_INDEX.length)}</span>
        </div>
      </div>
    </div>
  );
}
