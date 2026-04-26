export const fmt = (n, d = 2) => {
  if (n == null || isNaN(n)) return 'N/A';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
};

export const fmtB = (n) => {
  if (!n || isNaN(n)) return 'N/A';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e12) return sign + '$' + fmt(abs / 1e12, 1) + 'T';
  if (abs >= 1e9) return sign + '$' + fmt(abs / 1e9, 1) + 'B';
  return sign + '$' + fmt(abs / 1e6, 0) + 'M';
};

export const fmtPct = (n) => n == null || isNaN(n) ? 'N/A' : fmt(n, 1) + '%';

export const fmtPrice = (n) => n == null || isNaN(n) ? 'N/A' : '$' + fmt(n, 2);

export const getBadge = (upside) => {
  if (upside == null || isNaN(upside)) return { label: 'N/A', color: 'gray' };
  if (upside >= 20) return { label: 'בחסר', color: 'green' };
  if (upside <= -20) return { label: 'בעודף', color: 'red' };
  return { label: 'הוגן', color: 'amber' };
};
