// Small formatting helpers, copied verbatim from frontend/src/utils/format.js
// so the UI kit prints numbers the same way the production app does.
const fmt = (n, d = 2) => {
  if (n == null || isNaN(n)) return 'N/A';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
};
const fmtB = (n) => {
  if (!n || isNaN(n)) return 'N/A';
  const abs = Math.abs(n), s = n < 0 ? '-' : '';
  if (abs >= 1e12) return s + '$' + fmt(abs / 1e12, 1) + 'T';
  if (abs >= 1e9)  return s + '$' + fmt(abs / 1e9, 1) + 'B';
  return s + '$' + fmt(abs / 1e6, 0) + 'M';
};
const fmtPct   = (n) => n == null || isNaN(n) ? 'N/A' : fmt(n, 1) + '%';
const fmtPrice = (n) => n == null || isNaN(n) ? 'N/A' : '$' + fmt(n, 2);
const fmtMktCap = (val) => {
  if (!val || val <= 0) return null;
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9)  return `$${(val / 1e9).toFixed(1)}B`;
  return `$${val.toLocaleString()}`;
};

window.NoesisFormat = { fmt, fmtB, fmtPct, fmtPrice, fmtMktCap };
