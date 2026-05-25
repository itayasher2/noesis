import { useState, useEffect, useRef } from 'react';

const fmt = (v) => v == null ? '—' : '$' + Math.abs(v / 1e9).toFixed(2) + 'B';
const fmtPS = (v) => v == null ? '—' : '$' + v.toFixed(2);
const fmtPct = (v) => v == null ? '—' : (v >= 0 ? '+' : '') + v.toFixed(1) + '%';

function QualityBadge({ q }) {
  const map = {
    high:   { bg: 'var(--green-bg)',  color: 'var(--green)',  label: 'High' },
    medium: { bg: 'var(--amber-bg)', color: 'var(--amber)', label: 'Medium' },
    low:    { bg: 'var(--red-bg)',   color: 'var(--red)',   label: 'Low' },
  };
  const s = map[q] || map.low;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

function MiniBar({ value, max, color }) {
  const pct = Math.min(Math.abs(value / max) * 100, 100);
  return (
    <div style={{ background: 'var(--border)', borderRadius: 3, height: 5, marginTop: 3, overflow: 'hidden' }}>
      <div style={{ width: pct + '%', height: '100%', background: color || 'var(--accent)', borderRadius: 3, transition: 'width 0.4s' }} />
    </div>
  );
}

export default function NAVModel({ data }) {
  const [tab, setTab] = useState('summary');
  const [adjustments, setAdjustments] = useState({
    cashDiscount: 0,
    arDiscount: 20,
    inventoryDiscount: 30,
    ppeDiscount: 30,
    goodwillDiscount: 100,
    ipDiscount: 50,
    brandDiscount: 100,
    otherIntangiblesDiscount: 70,
  });

  if (!data) return null;

  const { financials, profile } = data;
  const price = profile.price || 0;
  const shares = profile.shares || 1;

  // Build asset breakdown from real balance sheet data
  const totalAssets = financials.totalAssets || 0;
  const totalDebt = financials.totalDebt || 0;
  const cash = financials.cash || 0;
  const equity = financials.equity || 0;

  // Estimate asset breakdown (FMP gives totals, we break down proportionally)
  const currentLiabilities = totalAssets - equity - totalDebt;
  const estimatedAR = financials.revenue ? financials.revenue * 0.12 : 0;
  const estimatedInventory = financials.revenue ? financials.revenue * 0.06 : 0;
  const estimatedOtherCurrent = Math.max(0, (totalAssets * 0.25) - cash - estimatedAR - estimatedInventory);
  const goodwill = Math.max(0, totalAssets - equity - totalDebt - (totalAssets * 0.55));
  const ppe = totalAssets * 0.30;
  const otherIntangibles = Math.max(0, totalAssets - cash - estimatedAR - estimatedInventory - estimatedOtherCurrent - ppe - goodwill);

  const currentAssets = [
    { name: 'Cash & Equivalents', book: cash, liqMult: 1.0, repMult: 1.0, quality: 'high' },
    { name: 'Accounts Receivable', book: estimatedAR, liqMult: 0.80, repMult: 1.0, quality: 'medium' },
    { name: 'Inventory', book: estimatedInventory, liqMult: 0.70, repMult: 1.20, quality: 'medium' },
    { name: 'Other Current Assets', book: estimatedOtherCurrent, liqMult: 0.60, repMult: 1.0, quality: 'low' },
  ].filter(a => a.book > 0);

  const fixedAssets = [
    { name: 'Property & Equipment', book: ppe, liqMult: 0.70, repMult: 1.40, quality: 'medium' },
  ].filter(a => a.book > 0);

  const intangibles = [
    { name: 'Goodwill', book: goodwill, liqMult: 0.0, repMult: 0.50, quality: 'low' },
    { name: 'Patents & IP', book: otherIntangibles * 0.5, liqMult: 0.30, repMult: 1.50, quality: 'medium' },
    { name: 'Brand Value (est.)', book: 0, liqMult: 0.0, repMult: 1.0, quality: 'low', repVal: financials.revenue * 0.15 },
    { name: 'Other Intangibles', book: otherIntangibles * 0.5, liqMult: 0.10, repMult: 0.80, quality: 'low' },
  ].filter(a => a.book > 0 || a.repVal > 0);

  const liabilities = [
    { name: 'Short-term Debt', value: totalDebt * 0.3 },
    { name: 'Long-term Debt', value: totalDebt * 0.7 },
    { name: 'Other Liabilities', value: Math.max(0, currentLiabilities) },
  ].filter(l => l.value > 0);

  function sumAssets(method) {
    let total = 0;
    [...currentAssets, ...fixedAssets].forEach(a => {
      if (method === 'book') total += a.book;
      else if (method === 'liq') total += a.book * a.liqMult;
      else total += a.book * a.repMult;
    });
    intangibles.forEach(a => {
      const base = a.book || 0;
      const repBase = a.repVal || a.book * a.repMult;
      if (method === 'book') total += base;
      else if (method === 'liq') total += base * a.liqMult;
      else total += repBase;
    });
    liabilities.forEach(l => total -= l.value);
    return total;
  }

  function calcAdjNAV() {
    let total = 0;
    total += cash * (1 - adjustments.cashDiscount / 100);
    total += estimatedAR * (1 - adjustments.arDiscount / 100);
    total += estimatedInventory * (1 - adjustments.inventoryDiscount / 100);
    total += estimatedOtherCurrent * 0.60;
    total += ppe * (1 - adjustments.ppeDiscount / 100);
    total += goodwill * (1 - adjustments.goodwillDiscount / 100);
    total += (otherIntangibles * 0.5) * (1 - adjustments.ipDiscount / 100);
    total += (financials.revenue * 0.15) * (1 - adjustments.brandDiscount / 100);
    total += (otherIntangibles * 0.5) * (1 - adjustments.otherIntangiblesDiscount / 100);
    liabilities.forEach(l => total -= l.value);
    return total;
  }

  const navBook = sumAssets('book') / shares;
  const navLiq = sumAssets('liq') / shares;
  const navRep = sumAssets('rep') / shares;
  const navAdj = calcAdjNAV() / shares;
  const premiumToLiq = navLiq > 0 ? (price / navLiq - 1) * 100 : null;
  const premiumToBook = navBook > 0 ? (price / navBook - 1) * 100 : null;

  const scenarios = [
    { name: 'Going Concern (Book)', nav: navBook, note: 'Full book value, no discounts' },
    { name: 'Liquidation — Base', nav: navLiq, note: 'Quick sale with standard discounts' },
    { name: 'Replacement Cost', nav: navRep, note: 'Cost to rebuild assets from scratch' },
    { name: 'Adjusted', nav: navAdj, note: 'Custom discount assumptions' },
    { name: 'Stress Case', nav: navLiq * 0.75, note: 'Fast liquidation + 25% additional stress' },
  ];

  const C = {
    card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' },
    sub: { background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' },
    p: { color: 'var(--text-primary)' },
    s: { color: 'var(--text-secondary)' },
    m: { color: 'var(--text-muted)' },
    bdr: { borderBottom: '1px solid var(--border)' },
    green: { color: 'var(--green)' },
    red: { color: 'var(--red)' },
    amber: { color: 'var(--amber)' },
    accent: { color: 'var(--accent)' },
  };

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'assets', label: 'Assets' },
    { id: 'scenarios', label: 'Scenarios' },
    { id: 'adjust', label: 'Assumptions' },
  ];

  const verdictColor = premiumToLiq > 500
    ? { bg: 'var(--red-bg)', border: 'var(--red)', text: 'var(--red)' }
    : premiumToLiq > 50
    ? { bg: 'var(--amber-bg)', border: 'var(--amber)', text: 'var(--amber)' }
    : { bg: 'var(--green-bg)', border: 'var(--green)', text: 'var(--green)' };

  const verdictText = premiumToLiq > 500
    ? `Trading at ${Math.round(premiumToLiq)}% premium to liquidation NAV — value relies on intangible assets`
    : premiumToLiq > 50
    ? `${Math.round(premiumToLiq)}% premium to liquidation NAV — verify intangible asset quality`
    : `Trading near NAV — significant value potential`;

  function AssetRow({ item, navForPct }) {
    const liqVal = item.liqMult != null ? item.book * item.liqMult : (item.liqVal || 0);
    const repVal = item.repVal != null ? item.repVal : item.book * (item.repMult || 1);
    const pctOfNav = navForPct > 0 ? (liqVal / navForPct * 100) : 0;
    return (
      <tr style={C.bdr}>
        <td style={{ ...C.s, padding: '8px 6px', fontWeight: 500 }}>{item.name}</td>
        <td style={{ ...C.p, padding: '8px 6px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(item.book)}</td>
        <td style={{ ...C.green, padding: '8px 6px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(liqVal)}</td>
        <td style={{ ...C.accent, padding: '8px 6px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(repVal)}</td>
        <td style={{ padding: '8px 6px', textAlign: 'center' }}><QualityBadge q={item.quality} /></td>
        <td style={{ padding: '8px 6px', textAlign: 'right', minWidth: 80 }}>
          <div style={{ ...C.m, fontSize: 12 }}>{Math.abs(pctOfNav).toFixed(1)}%</div>
          <MiniBar value={liqVal} max={Math.abs(navForPct)} color="var(--accent)" />
        </td>
      </tr>
    );
  }

  const adjControls = [
    { key: 'cashDiscount', label: 'Cash Discount', min: 0, max: 20 },
    { key: 'arDiscount', label: 'Accounts Receivable Discount', min: 0, max: 60 },
    { key: 'inventoryDiscount', label: 'Inventory Discount', min: 0, max: 70 },
    { key: 'ppeDiscount', label: 'PP&E Discount', min: 0, max: 70 },
    { key: 'goodwillDiscount', label: 'Goodwill Discount', min: 0, max: 100 },
    { key: 'ipDiscount', label: 'Patents / IP Discount', min: 0, max: 100 },
    { key: 'brandDiscount', label: 'Brand Value Discount', min: 0, max: 100 },
    { key: 'otherIntangiblesDiscount', label: 'Other Intangibles Discount', min: 0, max: 100 },
  ];

  return (
    <div style={{ marginTop: 24 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
              background: 'transparent', borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)', transition: 'color 0.15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* SUMMARY TAB */}
      {tab === 'summary' && (
        <div>
          {/* Verdict */}
          <div style={{ background: verdictColor.bg, borderLeft: `3px solid ${verdictColor.border}`, padding: '10px 14px', marginBottom: 16, borderRadius: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>NAV Verdict</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: verdictColor.text }}>{verdictText}</div>
          </div>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Book NAV / Share', value: fmtPS(navBook), sub: fmtPct((navBook / price - 1) * 100) + ' vs market' },
              { label: 'Liquidation NAV / Share', value: fmtPS(navLiq), sub: fmtPct((navLiq / price - 1) * 100) + ' vs market' },
              { label: 'Replacement NAV / Share', value: fmtPS(navRep), sub: fmtPct((navRep / price - 1) * 100) + ' vs market' },
              { label: 'Adjusted NAV / Share', value: fmtPS(navAdj), sub: fmtPct((navAdj / price - 1) * 100) + ' vs market' },
              { label: 'Market Price', value: fmtPS(price), sub: premiumToLiq != null ? Math.round(premiumToLiq) + '% above liquidation' : '—' },
            ].map((c, i) => (
              <div key={i} style={{ ...C.sub, padding: '12px 14px' }}>
                <div style={{ ...C.m, fontSize: 11, marginBottom: 4 }}>{c.label}</div>
                <div style={{ ...C.p, fontSize: 18, fontWeight: 600, fontFamily: 'monospace' }}>{c.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div style={{ ...C.card, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', ...C.m, marginBottom: 12 }}>
              Valuation Methods Comparison
            </div>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={C.bdr}>
                  <th style={{ ...C.m, textAlign: 'left', padding: '6px 0', fontWeight: 500 }}>Method</th>
                  <th style={{ ...C.m, textAlign: 'right', fontWeight: 500 }}>NAV / Share</th>
                  <th style={{ ...C.m, textAlign: 'right', fontWeight: 500 }}>vs Market</th>
                  <th style={{ ...C.m, textAlign: 'right', fontWeight: 500 }}>Assessment</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Going Concern', nav: navBook, desc: 'Book value' },
                  { name: 'Liquidation', nav: navLiq, desc: 'Quick sale' },
                  { name: 'Replacement', nav: navRep, desc: 'Rebuild cost' },
                  { name: 'Adjusted', nav: navAdj, desc: 'Custom' },
                ].map((row, i) => {
                  const up = (row.nav / price - 1) * 100;
                  return (
                    <tr key={i} style={C.bdr}>
                      <td style={{ ...C.s, padding: '8px 0', fontWeight: 500 }}>{row.name}</td>
                      <td style={{ ...C.p, textAlign: 'right', fontFamily: 'monospace' }}>{fmtPS(row.nav)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: up >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'monospace' }}>{fmtPct(up)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                          background: up > 10 ? 'var(--green-bg)' : up > -20 ? 'var(--amber-bg)' : 'var(--red-bg)',
                          color: up > 10 ? 'var(--green)' : up > -20 ? 'var(--amber)' : 'var(--red)',
                        }}>
                          {up > 10 ? 'Attractive' : up > -20 ? 'Fair' : 'Expensive'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Intangible dependency warning */}
          {totalAssets > 0 && (
            <div style={{ ...C.sub, padding: '10px 14px', fontSize: 12 }}>
              <span style={{ fontWeight: 600, ...C.p }}>⚠ Intangible dependency: </span>
              <span style={C.s}>
                {((goodwill + otherIntangibles) / totalAssets * 100).toFixed(1)}% of assets are intangible — liquidation NAV is significantly below book value
              </span>
            </div>
          )}
        </div>
      )}

      {/* ASSETS TAB */}
      {tab === 'assets' && (
        <div>
          {[
            { title: 'Current Assets', items: currentAssets },
            { title: 'Fixed Assets (PP&E)', items: fixedAssets },
            { title: 'Intangible Assets', items: intangibles },
          ].map(section => (
            <div key={section.title} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', ...C.m, marginBottom: 8 }}>
                {section.title}
              </div>
              <div style={{ ...C.card, overflow: 'auto' }}>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 520 }}>
                  <thead>
                    <tr style={{ ...C.bdr, background: 'var(--bg-subtle)' }}>
                      {['Asset', 'Book Value', 'Liquidation', 'Replacement', 'Quality', '% of NAV'].map((h, i) => (
                        <th key={i} style={{ ...C.m, padding: '8px 6px', textAlign: i === 0 ? 'left' : i === 4 ? 'center' : 'right', fontWeight: 500, fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item, i) => (
                      <AssetRow key={i} item={item} navForPct={sumAssets('liq')} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Liabilities */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', ...C.m, marginBottom: 8 }}>
            Liabilities
          </div>
          <div style={C.card}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ ...C.bdr, background: 'var(--bg-subtle)' }}>
                  {['Item', 'Value', '% of NAV'].map((h, i) => (
                    <th key={i} style={{ ...C.m, padding: '8px 12px', textAlign: i === 0 ? 'left' : 'right', fontWeight: 500, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liabilities.map((l, i) => (
                  <tr key={i} style={C.bdr}>
                    <td style={{ ...C.s, padding: '8px 12px', fontWeight: 500 }}>{l.name}</td>
                    <td style={{ color: 'var(--red)', padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>({fmt(l.value)})</td>
                    <td style={{ ...C.m, padding: '8px 12px', textAlign: 'right', fontSize: 12 }}>{(l.value / Math.abs(sumAssets('liq')) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--bg-subtle)' }}>
                  <td style={{ ...C.p, padding: '8px 12px', fontWeight: 700 }}>Net NAV (Liquidation)</td>
                  <td style={{ color: navLiq >= 0 ? 'var(--green)' : 'var(--red)', padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', fontSize: 15 }}>{fmtPS(navLiq)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SCENARIOS TAB */}
      {tab === 'scenarios' && (
        <div>
          <div style={{ ...C.card, marginBottom: 16 }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ ...C.bdr, background: 'var(--bg-subtle)' }}>
                  {['Scenario', 'NAV / Share', 'vs Market', 'Note', 'Rating'].map((h, i) => (
                    <th key={i} style={{ ...C.m, padding: '8px 12px', textAlign: i === 0 ? 'left' : 'right', fontWeight: 500, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s, i) => {
                  const up = (s.nav / price - 1) * 100;
                  return (
                    <tr key={i} style={C.bdr}>
                      <td style={{ ...C.p, padding: '8px 12px', fontWeight: 500 }}>{s.name}</td>
                      <td style={{ ...C.p, padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{fmtPS(s.nav)}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, fontFamily: 'monospace', color: up >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtPct(up)}</td>
                      <td style={{ ...C.m, padding: '8px 12px', textAlign: 'right', fontSize: 11 }}>{s.note}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                          background: up > 10 ? 'var(--green-bg)' : up > -20 ? 'var(--amber-bg)' : 'var(--red-bg)',
                          color: up > 10 ? 'var(--green)' : up > -20 ? 'var(--amber)' : 'var(--red)',
                        }}>
                          {up > 10 ? 'Attractive' : up > -20 ? 'Fair' : 'Expensive'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Sensitivity analysis */}
          <div style={{ ...C.card, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', ...C.m, marginBottom: 12 }}>
              NAV Sensitivity to Intangibles Discount
            </div>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={C.bdr}>
                  <th style={{ ...C.m, padding: '6px 0', textAlign: 'left', fontWeight: 500 }}>Discount</th>
                  <th style={{ ...C.m, padding: '6px 0', textAlign: 'right', fontWeight: 500 }}>NAV / Share</th>
                  <th style={{ ...C.m, padding: '6px 0', textAlign: 'right', fontWeight: 500 }}>vs Market</th>
                  <th style={{ ...C.m, padding: '6px 0', textAlign: 'right', fontWeight: 500 }}>vs Book NAV</th>
                </tr>
              </thead>
              <tbody>
                {[0, 25, 50, 75, 100].map(d => {
                  const intangTotal = goodwill + otherIntangibles;
                  const adjBook = (sumAssets('book') - intangTotal * (d / 100)) / shares;
                  const up = (adjBook / price - 1) * 100;
                  const vsBook = (adjBook / navBook - 1) * 100;
                  return (
                    <tr key={d} style={{ ...C.bdr, background: d === 50 ? 'var(--bg-subtle)' : 'transparent' }}>
                      <td style={{ ...C.s, padding: '7px 0', fontWeight: d === 50 ? 600 : 400 }}>{d}% {d === 50 ? '← base' : ''}</td>
                      <td style={{ ...C.p, textAlign: 'right', fontFamily: 'monospace' }}>{fmtPS(adjBook)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: up >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'monospace' }}>{fmtPct(up)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 12 }}>{fmtPct(vsBook)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADJUST TAB */}
      {tab === 'adjust' && (
        <div>
          <div style={{ ...C.sub, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ ...C.m, fontSize: 11, marginBottom: 4 }}>Adjusted NAV / Share</div>
            <div style={{ ...C.p, fontSize: 28, fontWeight: 700, fontFamily: 'monospace' }}>{fmtPS(navAdj)}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: (navAdj / price - 1) * 100 >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 4 }}>
              {fmtPct((navAdj / price - 1) * 100)} vs. market price
            </div>
          </div>

          {adjControls.map(ctrl => (
            <div key={ctrl.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 200 }}>{ctrl.label}</label>
              <input
                type="range" min={ctrl.min} max={ctrl.max} step={1}
                value={adjustments[ctrl.key]}
                onChange={e => setAdjustments(prev => ({ ...prev, [ctrl.key]: parseInt(e.target.value) }))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, ...C.p, minWidth: 40, textAlign: 'right' }}>
                {adjustments[ctrl.key]}%
              </span>
            </div>
          ))}

          <div style={{ ...C.sub, padding: '10px 14px', marginTop: 12, fontSize: 12, ...C.s }}>
            💡 100% discount on Goodwill and Brand is standard in liquidation scenarios — acquirers do not pay for goodwill in bankruptcy.
          </div>
        </div>
      )}
    </div>
  );
}
