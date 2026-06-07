import { useLanguage } from '../i18n.jsx';

export default function Scenarios({ fcf, shares, totalDebt, cash, price }) {
  const { t } = useLanguage();
  if (!fcf || !shares) return null;

  function calcFV(g1, g2, wacc, tgr) {
    let f = fcf; let pv = 0;
    for (let y = 1; y <= 10; y++) {
      f *= (1 + (y <= 5 ? g1 : g2));
      pv += f / Math.pow(1 + wacc, y);
    }
    const tv = f * (1 + tgr) / (wacc - tgr);
    const pvTV = tv / Math.pow(1 + wacc, 10);
    const nd = (totalDebt || 0) - (cash || 0);
    return (pv + pvTV - nd) / shares;
  }

  const scenarios = [
    {
      name: t('bullCase'), emoji: '🟢',
      narrative: t('bullNarrative'),
      g1: 0.18, g2: 0.12, wacc: 0.08, tgr: 0.04,
      color: '#dcfce7', textColor: '#166534', borderColor: '#86efac'
    },
    {
      name: t('baseCase'), emoji: '🟡',
      narrative: t('baseNarrative'),
      g1: 0.10, g2: 0.06, wacc: 0.10, tgr: 0.03,
      color: '#fef9c3', textColor: '#854d0e', borderColor: '#fde047'
    },
    {
      name: t('bearCase'), emoji: '🔴',
      narrative: t('bearNarrative'),
      g1: 0.04, g2: 0.02, wacc: 0.12, tgr: 0.02,
      color: '#fee2e2', textColor: '#991b1b', borderColor: '#fca5a5'
    },
  ];

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '12px' }}>
        {t('scenariosTitle')}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: '12px' }}>
        {scenarios.map(s => {
          const fv = calcFV(s.g1, s.g2, s.wacc, s.tgr);
          const up = price ? (fv / price - 1) * 100 : null;
          return (
            <div key={s.name} style={{ background: s.color, border: `1px solid ${s.borderColor}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: s.textColor, marginBottom: '2px' }}>{s.name}</div>
              <div style={{ fontSize: '11px', color: s.textColor, opacity: 0.85, marginBottom: '10px', fontStyle: 'italic' }}>{s.narrative}</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: s.textColor, marginBottom: '4px' }}>
                ${Math.round(fv)}
              </div>
              {up != null && (
                <div style={{ fontSize: '13px', fontWeight: 600, color: s.textColor }}>
                  {up >= 0 ? '+' : ''}{up.toFixed(1)}% {t('vsMarketLc')}
                </div>
              )}
              <div style={{ marginTop: '10px', borderTop: `1px solid ${s.borderColor}`, paddingTop: '8px', fontSize: '11px', color: s.textColor, opacity: 0.8 }}>
                <div>{t('growthYears15')}: {(s.g1*100).toFixed(0)}% | {t('growthYears610')}: {(s.g2*100).toFixed(0)}%</div>
                <div>WACC: {(s.wacc*100).toFixed(0)}% | {t('terminalGrowthPct').split(' ')[0]}: {(s.tgr*100).toFixed(0)}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
