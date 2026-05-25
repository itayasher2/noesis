export default function SensitivityTable({ fcf, shares, totalDebt, cash, baseWacc, baseTgr }) {
  if (!fcf || !shares) return null;

  const waccs = [0.07, 0.08, 0.09, 0.10, 0.11, 0.12, 0.13];
  const growths = [0.04, 0.06, 0.08, 0.10, 0.12, 0.14];

  function calcFV(g1, wacc, tgr) {
    let f = fcf; let pv = 0;
    for (let y = 1; y <= 10; y++) {
      f *= (1 + (y <= 5 ? g1 : g1 * 0.6));
      pv += f / Math.pow(1 + wacc, y);
    }
    const tv = f * (1 + tgr) / (wacc - tgr);
    const pvTV = tv / Math.pow(1 + wacc, 10);
    const nd = (totalDebt || 0) - (cash || 0);
    return (pv + pvTV - nd) / shares;
  }

  function getColor(fv, base) {
    const diff = (fv / base - 1) * 100;
    if (diff >= 30) return { bg: '#dcfce7', color: '#166534' };
    if (diff >= 10) return { bg: '#d1fae5', color: '#065f46' };
    if (diff >= -10) return { bg: '#fef9c3', color: '#854d0e' };
    if (diff >= -30) return { bg: '#fee2e2', color: '#991b1b' };
    return { bg: '#fecaca', color: '#7f1d1d' };
  }

  const baseFV = calcFV(0.10, baseWacc || 0.10, baseTgr || 0.03);

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' }}>
        DCF Sensitivity Table — WACC × Growth Rate
      </div>
      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '12px' }}>
        Each cell = fair value per share ($) — green = undervalued, red = overvalued
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: '12px', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ padding: '6px 10px', textAlign: 'right', color: '#6b7280', fontWeight: 500 }}>WACC \ Growth</th>
              {growths.map(g => (
                <th key={g} style={{ padding: '6px 10px', textAlign: 'center', color: '#6b7280', fontWeight: 500 }}>
                  {(g * 100).toFixed(0)}%
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {waccs.map(w => (
              <tr key={w}>
                <td style={{ padding: '6px 10px', fontWeight: 500, color: '#374151' }}>
                  {(w * 100).toFixed(0)}%
                </td>
                {growths.map(g => {
                  const fv = calcFV(g, w, baseTgr || 0.03);
                  const { bg, color } = getColor(fv, baseFV);
                  return (
                    <td key={g} style={{
                      padding: '6px 10px',
                      textAlign: 'center',
                      background: bg,
                      color: color,
                      fontWeight: 500,
                      borderRadius: '4px',
                    }}>
                      ${Math.round(fv)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}