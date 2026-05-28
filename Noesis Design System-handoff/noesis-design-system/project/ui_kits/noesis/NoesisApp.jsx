// ── Noesis app shell ──────────────────────────────────────────────────
//   Header (with TickerTape) + SearchBar → Verdict + Decision + Profile →
//   TabBar + tab content. Dark-first; theme toggle in UserMenu.

function calcScore(data, price, dcfFv) {
  const hist = data.history || [];
  const revArr = hist.filter(r => r.revenue);
  const revCAGR = revArr.length >= 2
    ? ((revArr[revArr.length-1].revenue / revArr[0].revenue) ** (1/(revArr.length-1)) - 1) * 100
    : null;
  const upside = dcfFv && price ? (dcfFv / price - 1) * 100 : 0;
  const composite = Math.round(50 + Math.max(-30, Math.min(30, upside / 1.5)));
  const conf = composite >= 65 ? 'High' : composite >= 45 ? 'Medium' : 'Low';
  const confColor = conf === 'High' ? 'var(--green)' : conf === 'Medium' ? 'var(--amber)' : 'var(--red)';
  const ratingColor = composite >= 65 ? 'var(--green)' : composite >= 45 ? 'var(--amber)' : 'var(--red)';
  const impliedGrowth = (revCAGR || 8) + (upside < 0 ? Math.min(20, -upside * 0.6) : Math.max(-10, -upside * 0.3));
  return {
    composite, ratingColor, confidence: conf, confColor,
    companyStyle: revCAGR > 15 ? 'Growth' : revCAGR > 8 ? 'Growth-Blend' : 'Mature',
    valuationScore: Math.max(0, Math.min(100, 50 + upside)),
    growthScore: 60,
    qualityScore: Math.min(100, 50 + data.financials.netMargin),
    riskScore: data.profile.beta < 1.2 ? 70 : data.profile.beta < 1.6 ? 50 : 30,
    expectationsGap: impliedGrowth - (revCAGR || 0),
    impliedGrowth, revCAGR,
    dataQuality: 'high', modelConsistency: 'high', assumptionStability: composite >= 50 ? 'medium' : 'low',
  };
}

function calcDCF(data, dcfP) {
  const fcf = data.financials.fcf, shares = data.profile.shares;
  if (!fcf || !shares || fcf <= 0) return null;
  const g1 = dcfP.g1/100, g2 = dcfP.g2/100, wacc = dcfP.wacc/100, tgr = dcfP.tgr/100;
  let f = fcf, pv = 0;
  for (let y = 1; y <= 10; y++) { f *= (1 + (y <= 5 ? g1 : g2)); pv += f / Math.pow(1 + wacc, y); }
  const tv = f * (1 + tgr) / (wacc - tgr);
  const pvTV = tv / Math.pow(1 + wacc, 10);
  const nd = (data.financials.totalDebt || 0) - (data.financials.cash || 0);
  return { fv: (pv + pvTV - nd) / shares };
}

function NoesisApp() {
  const [user, setUser] = React.useState(localStorage.getItem('noesis-demo-user') || null);
  const [darkMode, setDarkMode] = React.useState(() => localStorage.getItem('noesis-demo-theme') !== 'light');
  const [ticker, setTicker] = React.useState('AAPL');
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [tab, setTab] = React.useState('overview');
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [dcfP, setDcfP] = React.useState({ g1: 10, g2: 6, wacc: 10, tgr: 3 });
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.className = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  // ⌘K opens the command palette anywhere in the app.
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('noesis-demo-theme', next ? 'dark' : 'light');
  };

  const onLogin = (u) => {
    setUser(u); localStorage.setItem('noesis-demo-user', u);
    setTimeout(() => analyze('AAPL'), 250);
  };
  const onLogout = () => {
    setUser(null); setData(null); setTicker('');
    localStorage.removeItem('noesis-demo-user');
  };

  const analyze = (forceTicker) => {
    const t = (forceTicker || ticker || '').trim().toUpperCase();
    if (!t) return;
    setLoading(true); setError(''); setData(null); setTab('overview');
    setTimeout(() => {
      const mock = window.NOESIS_MOCK[t];
      if (mock) { setData(mock); setTicker(t); }
      else setError('No data found. Please check the ticker.');
      setLoading(false);
    }, 500);
  };

  if (!user) return <Login onLogin={onLogin} />;

  const dcf = data && calcDCF(data, dcfP);
  const scoreData = data && calcScore(data, data.profile.price, dcf?.fv);

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 48px' }}>
        <Header user={user} onLogout={onLogout} darkMode={darkMode} toggleTheme={toggleTheme} />
        <div style={{ marginBottom: 16 }}>
          <TickerTape />
        </div>
        <SearchBar value={ticker} onChange={setTicker} onAnalyze={() => analyze()} loading={loading} error={error} onOpenPalette={() => setPaletteOpen(true)} />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onPick={(sym) => { setTicker(sym); analyze(sym); }} />

        {!data && !loading && !error && (
          <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div className="t-eyebrow" style={{ marginBottom: 8 }}>Try the demo</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Type a ticker and hit Analyze. <span className="num" style={{ fontWeight: 500, color: 'var(--accent)' }}>AAPL</span> and <span className="num" style={{ fontWeight: 500, color: 'var(--accent)' }}>NVDA</span> have full mocked data.
            </div>
            <div className="t-meta" style={{ marginTop: 10 }}>Or press <span style={{ color: 'var(--accent)' }}>⌘K</span> to open the command palette</div>
          </div>
        )}

        {loading && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div className="t-eyebrow" style={{ color: 'var(--accent)' }}>⟳ Loading {ticker}…</div>
          </div>
        )}

        {data && (
          <>
            <HeroVerdict data={data} scoreData={scoreData} dcf={dcf} insight={null} />
            <DecisionBox scoreData={scoreData} dcf={dcf} price={data.profile.price} />
            <InvestmentProfile data={data} scoreData={scoreData} dcf={dcf} />

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <TabBar tab={tab} setTab={setTab} showAdvanced={showAdvanced} setShowAdvanced={setShowAdvanced} />
              <div style={{ padding: 20 }}>
                {tab === 'overview'   && <OverviewTab data={data} />}
                {tab === 'valuation'  && <ValuationTab data={data} dcfP={dcfP} setDcfP={setDcfP} />}
                {tab === 'financials' && <FinancialsTab data={data} />}
                {tab === 'analysis'   && <AnalysisTab data={data} />}
                {tab === 'docs'       && <DocumentsTab data={data} />}
                {!['overview','valuation','financials','analysis','docs'].includes(tab) && (
                  <div style={{ padding: 24, textAlign: 'center' }}>
                    <div className="t-eyebrow" style={{ marginBottom: 6 }}>Advanced module</div>
                    <div className="t-body-sm">/{tab} · not stubbed in this demo. See the production app.</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { NoesisApp });
