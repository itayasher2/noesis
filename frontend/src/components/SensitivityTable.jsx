import { useLanguage } from '../i18n.jsx';

export default function SensitivityTable({ fcf, shares, totalDebt, cash, baseWacc, baseTgr }) {
  const { t } = useLanguage();
  if (!fcf || !shares) return null;

  const waccs = [0.07, 0.08, 0.09, 0.10, 0.11, 0.12, 0.13];
  const growths = [0.04, 0.06, 0.08, 0.10, 0.12, 0.14];

  function calcFV(g1, wacc, tgr) {
    if (wacc <= tgr) return null;
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
    if (!base || base <= 0) return { bg: 'var(--bg-subtle)', color: 'var(--text-muted)' };
    const diff = (fv / base - 1) * 100;
    if (diff >= 30) return { bg: 'var(--green-bg)', color: 'var(--green)' };
    if (diff >= 10) return { bg: 'rgba(16,185,129,0.08)', color: 'var(--green)' };
    if (diff >= -10) return { bg: 'var(--amber-bg)', color: 'var(--amber)' };
    if (diff >= -30) return { bg: 'rgba(239,68,68,0.08)', color: 'var(--red)' };
    return { bg: 'var(--red-bg)', color: 'var(--red)' };
  }

  const baseFV = calcFV(0.10, baseWacc || 0.10, baseTgr || 0.03);

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
        {t('sensitivityTitle')}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
        {t('sensitivityDesc')}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: '12px', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>{t('waccGrowthHeader')}</th>
              {growths.map(g => (
                <th key={g} style={{ padding: '6px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {(g * 100).toFixed(0)}%
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {waccs.map(w => (
              <tr key={w}>
                <td style={{ padding: '6px 10px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {(w * 100).toFixed(0)}%
                </td>
                {growths.map(g => {
                  const fv = calcFV(g, w, baseTgr || 0.03);
                  const { bg, color } = fv != null ? getColor(fv, baseFV) : { bg: 'var(--bg-subtle)', color: 'var(--text-muted)' };
                  return (
                    <td key={g} style={{
                      padding: '6px 10px',
                      textAlign: 'center',
                      background: bg,
                      color: color,
                      fontWeight: 500,
                      borderRadius: '4px',
                    }}>
                      {fv != null ? '$' + Math.round(fv) : '—'}
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
