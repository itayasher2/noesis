import { fmt } from '../utils/format';
import { useLanguage } from '../i18n.jsx';

export default function ThesisTriggers({ data, dcfParams, scoreData }) {
  const { t } = useLanguage();
  const history = data.history || [];
  const revArr = history.filter(r => r.revenue && r.revenue > 0);
  const histRevCAGR = revArr.length >= 2
    ? ((revArr[revArr.length-1].revenue / revArr[0].revenue) ** (1/(revArr.length-1)) - 1) * 100 : null;

  const fcfArr = history.filter(r => r.fcf && r.fcf > 0);
  const histFCFCAGR = fcfArr.length >= 2
    ? ((fcfArr[fcfArr.length-1].fcf / fcfArr[0].fcf) ** (1/(fcfArr.length-1)) - 1) * 100 : null;

  const currentNetMargin = data.financials.netMargin || 0;
  const currentFCFMargin = data.financials.fcfMargin || 0;
  const pe = data.multiples.pe || 0;

  const bullRevThreshold  = Math.max(10, (histRevCAGR || 5) * 1.5);
  const bearRevThreshold  = Math.max(3,  (histRevCAGR || 5) * 0.5);
  const bullMarginThresh  = currentNetMargin * 1.15;
  const bearMarginThresh  = currentNetMargin * 0.85;
  const bullFCFThresh     = Math.max(10, (histFCFCAGR || 5) * 1.3);

  const C = {
    p: { color:'var(--text-primary)' },
    s: { color:'var(--text-secondary)' },
    m: { color:'var(--text-muted)' },
    card: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', boxShadow:'var(--shadow)' },
    bdr: { borderBottom:'1px solid var(--border)' },
  };

  const bullish = [
    { trigger: t('triggerRevExceeds', fmt(bullRevThreshold,0)), impact: t('impactReRateHigher'), metric: t('revenueGrowthMetric') },
    { trigger: t('triggerNetMarginExpands', fmt(bullMarginThresh,1)), impact: t('impactFCFAccelerates'), metric: t('netIncomeMetric') },
    { trigger: t('triggerFCFGrowthSustained', fmt(bullFCFThresh,0)), impact: t('impactClosesGap'), metric: 'FCF Growth' },
    { trigger: t('triggerMoatStrengthens'), impact: t('impactHigherTerminal'), metric: t('terminalValue') },
  ];

  const bearish = [
    { trigger: t('triggerRevSlows', fmt(bearRevThreshold,0)), impact: t('impactMultipleCompression'), metric: t('revenueGrowthMetric') },
    { trigger: t('triggerNetMarginCompresses', fmt(bearMarginThresh,1)), impact: t('impactFCFDeteriorates'), metric: t('netIncomeMetric') },
    { trigger: t('triggerCompetitionIntensifies'), impact: t('impactGrowthNarrativeBreaks'), metric: 'Market Share' },
    { trigger: pe > 25 ? t('triggerMultipleCompresses', fmt(pe,0)) : t('triggerValuationContracts'), impact: t('impactDerating'), metric: 'P/E' },
  ];

  return (
    <div style={C.card} className="p-5 fade-in">
      <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>
        {t('whatChangesThisView')}
      </div>
      <div className="text-sm mb-4" style={C.s}>
        {t('thesisTriggerDesc')}
      </div>

      <div className="grid grid-cols-2 gap-5">

        {/* Bullish triggers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{background:'var(--green)'}}></div>
            <div className="text-xs font-bold uppercase tracking-widest" style={{color:'var(--green)'}}>
              {t('bullishTriggers')}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {bullish.map((item, i) => (
              <div key={i} className="rounded-lg p-3" style={{background:'var(--green-bg)',border:'1px solid var(--green)',opacity:0.85}}>
                <div className="flex items-start gap-2 mb-1">
                  <span style={{color:'var(--green)', fontSize:12, marginTop:1, flexShrink:0}}>✓</span>
                  <div className="text-xs font-semibold" style={{color:'var(--green)'}}>{item.trigger}</div>
                </div>
                <div className="text-xs leading-relaxed pl-4" style={C.s}>→ {item.impact}</div>
                <div className="text-xs mt-1 pl-4" style={C.m}>{t('triggerMetricLabel', item.metric)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bearish triggers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{background:'var(--red)'}}></div>
            <div className="text-xs font-bold uppercase tracking-widest" style={{color:'var(--red)'}}>
              {t('bearishTriggers')}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {bearish.map((item, i) => (
              <div key={i} className="rounded-lg p-3" style={{background:'var(--red-bg)',border:'1px solid var(--red)',opacity:0.85}}>
                <div className="flex items-start gap-2 mb-1">
                  <span style={{color:'var(--red)', fontSize:12, marginTop:1, flexShrink:0}}>✗</span>
                  <div className="text-xs font-semibold" style={{color:'var(--red)'}}>{item.trigger}</div>
                </div>
                <div className="text-xs leading-relaxed pl-4" style={C.s}>→ {item.impact}</div>
                <div className="text-xs mt-1 pl-4" style={C.m}>{t('triggerMetricLabel', item.metric)}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom note */}
      <div className="mt-4 pt-3 text-xs" style={{borderTop:'1px solid var(--border)', color:'var(--text-muted)'}}>
        {t('thresholdsBasedOn', history.length)}
        {t('revCAGRLabel')} <strong style={C.s}>{histRevCAGR !== null ? fmt(histRevCAGR,1)+'%' : 'N/A'}</strong> ·
        {t('fcfCAGRLabel')} <strong style={C.s}>{histFCFCAGR !== null ? fmt(histFCFCAGR,1)+'%' : 'N/A'}</strong> ·
        {t('currentNetMarginLabel')} <strong style={C.s}>{fmt(currentNetMargin,1)}%</strong>
      </div>
    </div>
  );
}
