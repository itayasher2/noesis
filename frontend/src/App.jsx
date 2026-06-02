// test comment v2
import { useState, useEffect } from 'react';
import axios from 'axios';
import { fmt, fmtB, fmtPct, fmtPrice } from './utils/format';
import * as XLSX from 'xlsx';
import { useLanguage } from './i18n.jsx';
import FinancialsChart from './components/FinancialsChart';
import SensitivityTable from './components/SensitivityTable';
import Scenarios from './components/Scenarios';
import PeerComparison from './components/PeerComparison';
import PriceChart from './components/PriceChart';
import AIAnalysis from './components/AIAnalysis';
import ForwardView from './components/ForwardView';
import BusinessDrivers from './components/BusinessDrivers';
import MarketExpectations from './components/MarketExpectations';
import DecisionBox from './components/DecisionBox';
import ThesisTriggers from './components/ThesisTriggers';
import HeroSection from './components/HeroSection';
import ThesisTab from './components/ThesisTab';
import DCFTab from './components/DCFTab';
import CommandPalette from './components/CommandPalette';
import Login from './components/Login';

const API = 'https://web-production-bdb26.up.railway.app/api';

const TICKER_ITEMS = [
  { sym:'AAPL',  price:'$189.30', chg:'+0.84%', up:true },
  { sym:'NVDA',  price:'$875.40', chg:'+2.31%', up:true },
  { sym:'MSFT',  price:'$415.20', chg:'+0.47%', up:true },
  { sym:'TSLA',  price:'$177.90', chg:'-1.23%', up:false },
  { sym:'AMZN',  price:'$182.50', chg:'+1.09%', up:true },
  { sym:'META',  price:'$502.60', chg:'+0.73%', up:true },
  { sym:'GOOGL', price:'$162.40', chg:'-0.35%', up:false },
  { sym:'JPM',   price:'$198.70', chg:'+0.62%', up:true },
  { sym:'BRK.B', price:'$389.10', chg:'+0.18%', up:true },
  { sym:'V',     price:'$271.30', chg:'+0.55%', up:true },
];

function TickerTape() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="ticker mb-4">
      <div className="ticker-track">
        {items.map((item, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-sym">{item.sym}</span>
            <span className="num" style={{color:'var(--text-secondary)',fontSize:11}}>{item.price}</span>
            <span className={item.up ? 'ticker-up' : 'ticker-down'} style={{fontSize:11}}>{item.chg}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function MenuRow({ label, sub, danger, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', padding: '9px 14px',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
        background: hover ? (danger ? 'var(--red-bg)' : 'var(--bg-subtle)') : 'transparent',
        border: 'none', cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        textAlign: 'left',
      }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: danger ? 'var(--red)' : 'var(--text-primary)' }}>{label}</div>
      <div className="t-meta">{sub}</div>
    </button>
  );
}

function LangToggle() {
  const { lang, toggle } = useLanguage();
  return (
    <button
      onClick={toggle}
      title={lang === 'en' ? 'Switch to Hebrew' : 'Switch to English'}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 10px',
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 'var(--radius-pill)',
        cursor: 'pointer',
        fontSize: 14,
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <span style={{ opacity: lang === 'he' ? 1 : 0.4, transition: 'opacity 0.15s' }}>🇮🇱</span>
      <span style={{ fontSize: 9, color: 'var(--text-muted)', opacity: 0.4 }}>|</span>
      <span style={{ opacity: lang === 'en' ? 1 : 0.4, transition: 'opacity 0.15s' }}>🇺🇸</span>
    </button>
  );
}

function UserMenu({ user, onLogout, darkMode, toggleTheme }) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  if (!user) return null;
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px',
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 'var(--radius-pill)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11, fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700 }}>
          {user.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:inline">{user}</span>
        <span style={{ fontSize: 9, opacity: 0.5 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 250, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{user.charAt(0).toUpperCase()}</div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'var(--text-primary)' }}>{user}</div>
              <div className="t-meta">{t('proPlan')}</div>
            </div>
          </div>
          {[
            { label: t('account'),       sub: t('accountSub') },
            { label: t('subscription'),  sub: t('subscriptionSub') },
            { label: t('notifications'), sub: t('notificationsSub') },
            { label: t('settings'),      sub: t('settingsSub') },
            { label: t('usage'),         sub: t('usageSub') },
            { label: t('help'),          sub: t('helpSub') },
          ].map(it => <MenuRow key={it.label} label={it.label} sub={it.sub} onClick={() => setOpen(false)} />)}
          <MenuRow
            label={darkMode ? t('lightMode') : t('darkMode')}
            sub={t('switchAppearance')}
            onClick={() => { toggleTheme(); setOpen(false); }}
          />
          <MenuRow
            label={t('signOut')} sub={t('signOutSub')}
            danger
            onClick={() => { onLogout(); setOpen(false); }}
          />
        </div>
      </>}
    </div>
  );
}

function calcDCF({ fcf, shares, totalDebt, cash, g1, g2, wacc, tgr }) {
  if (!fcf || !shares || fcf <= 0) return null;
  if (wacc <= tgr) return null;
  let f = fcf; let pv = 0; const rows = [];
  for (let y = 1; y <= 10; y++) {
    f *= (1 + (y <= 5 ? g1 : g2));
    const disc = f / Math.pow(1 + wacc, y);
    pv += disc;
    rows.push({ y, fcf: f, pv: disc });
  }
  const tv = f * (1 + tgr) / (wacc - tgr);
  const pvTV = tv / Math.pow(1 + wacc, 10);
  const nd = (totalDebt || 0) - (cash || 0);
  const fv = (pv + pvTV - nd) / shares;
  return { fv, ev: pv + pvTV, pvTV, tv, rows, pvExplicit: pv };
}

function calcGordon({ dps, r, g }) {
  if (!dps || dps === 0 || r <= g) return null;
  return dps * (1 + g) / (r - g);
}

function calcRI({ bvps, roe, ke, g }) {
  if (!bvps || roe == null || ke <= g) return null;
  return bvps + bvps * (roe - ke) / (ke - g);
}

function calcCompositeScore({ dcf, gordonFV, riFV, grahamFV, price, data, dcfP }) {
  const models2 = [dcf?.fv, gordonFV, riFV, grahamFV].filter(v => v && v > 0);
  const avgModel = models2.length ? models2.reduce((s,v) => s+v, 0) / models2.length : null;
  const upsideAvg = avgModel && price ? (avgModel/price-1)*100 : null;
  const hist = data.history || [];
  const revArr = hist.filter(r => r.revenue && r.revenue > 0);
  const revCAGR = revArr.length >= 2 ? ((revArr[revArr.length-1].revenue / revArr[0].revenue) ** (1/(revArr.length-1)) - 1) * 100 : null;
  const netMargin = data.financials.netMargin || 0;
  const ps = data.multiples.ps || 0;
  let companyStyle = 'Blend';
  if (revCAGR !== null && revCAGR > 15 && ps > 8) companyStyle = 'Growth';
  else if (revCAGR !== null && revCAGR < 7 && netMargin > 15) companyStyle = 'Mature';
  else if (revCAGR !== null && revCAGR > 10) companyStyle = 'Growth-Blend';
  else companyStyle = 'Value-Blend';
  const weights = companyStyle === 'Growth' ? { val:0.25,growth:0.35,quality:0.25,risk:0.15 }
    : companyStyle === 'Growth-Blend' ? { val:0.30,growth:0.30,quality:0.25,risk:0.15 }
    : companyStyle === 'Mature' ? { val:0.40,growth:0.15,quality:0.25,risk:0.20 }
    : { val:0.35,growth:0.20,quality:0.25,risk:0.20 };
  const wacc=dcfP.wacc/100,tgr=dcfP.tgr/100,fcfBase=data.financials.fcf;
  const sh=data.profile.shares,nd=data.financials.netDebt,targetEV=price*sh+nd;
  let impliedGrowth=0;
  if(fcfBase>0&&wacc>tgr&&sh>0){let lo=-0.1,hi=0.5,mid=0;for(let i=0;i<50;i++){mid=(lo+hi)/2;let f=fcfBase,pv=0;for(let y=1;y<=10;y++){f*=(1+mid);pv+=f/Math.pow(1+wacc,y);}const tv=f*(1+tgr)/(wacc-tgr);const ev=pv+tv/Math.pow(1+wacc,10);if(ev>targetEV)hi=mid;else lo=mid;}impliedGrowth=mid*100;}
  const growthGap=impliedGrowth-(revCAGR||0);
  let valuationScore;
  if(upsideAvg===null)valuationScore=50;
  else if(companyStyle==='Growth'||companyStyle==='Growth-Blend'){const gAdj=upsideAvg+(revCAGR||0)*0.5;valuationScore=gAdj>30?85:gAdj>10?70:gAdj>-10?55:gAdj>-30?35:20;}
  else{valuationScore=upsideAvg>30?85:upsideAvg>10?70:upsideAvg>-10?50:upsideAvg>-30?30:15;}
  const growthScore=growthGap>15?15:growthGap>8?30:growthGap>3?50:growthGap>-3?70:85;
  const roic=data.financials.roic||0,fcfMargin=data.financials.fcfMargin||0;
  const qualityRaw=((netMargin>20?3:netMargin>10?2:netMargin>0?1:0)+(roic>20?3:roic>10?2:roic>0?1:0)+(fcfMargin>15?3:fcfMargin>5?2:fcfMargin>0?1:0));
  const qualityScore=Math.round(qualityRaw/9*100);
  const tvPct=dcf?dcf.pvTV/dcf.ev:0.6;
  const modelSpread=models2.length>1&&Math.min(...models2)>0?Math.max(...models2)/Math.min(...models2)-1:0.5;
  const beta=data.profile.beta||1;
  const riskScore=Math.min(100,(beta>1.5?0:beta>1.2?10:beta>0.8?20:30)+(tvPct>0.75?0:tvPct>0.6?15:30)+(modelSpread>0.5?0:modelSpread>0.3?10:20)+(Math.abs(growthGap)>15?0:Math.abs(growthGap)>8?10:20));
  const composite=Math.round(valuationScore*weights.val+growthScore*weights.growth+qualityScore*weights.quality+riskScore*weights.risk);
  const ratingColor=composite>=65?'var(--green)':composite>=45?'var(--amber)':'var(--red)';
  const dataQuality=models2.length>=3?'high':models2.length>=2?'medium':'low';
  const modelConsistency=modelSpread<0.3?'high':modelSpread<0.6?'medium':'low';
  const assumptionStability=tvPct<0.6?'high':tvPct<0.75?'medium':'low';
  const confTotal=[dataQuality,modelConsistency,assumptionStability].map(s=>s==='high'?2:s==='medium'?1:0).reduce((a,b)=>a+b,0);
  const confidence=confTotal>=5?'High':confTotal>=3?'Medium':'Low';
  const confColor=confidence==='High'?'var(--green)':confidence==='Medium'?'var(--amber)':'var(--red)';
  const cappedGrowthAdj=Math.min(100,Math.max(0,Math.round(composite+(revCAGR||0)*0.3)));
  return{composite,ratingColor,confidence,confColor,companyStyle,valuationScore,growthScore,qualityScore,riskScore,expectationsGap:growthGap,impliedGrowth,revCAGR,upsideAvg,cappedGrowthAdj,tvPct,modelSpread,beta,dataQuality,modelConsistency,assumptionStability};
}

export default function App() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('overview');
  const [dcfP, setDcfP] = useState({ g1:10, g2:6, wacc:10, tgr:3 });
  const [gordonP, setGordonP] = useState({ r:10, g:4 });
  const [riP, setRiP] = useState({ ke:10, g:4 });
  const [period, setPeriod] = useState('annual');
  const [quarterlyHistory, setQuarterlyHistory] = useState(null);
  const [quarterlyLoading, setQuarterlyLoading] = useState(false);
  const [dcfMode, setDcfMode] = useState('fcf');
  const [peFairValue, setPeFairValue] = useState(null);
  const [activeModel, setActiveModel] = useState('dcf');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [user, setUser] = useState(() => localStorage.getItem('noesis-auth') || null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('vp-theme') !== 'light');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    document.documentElement.className = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.className = next ? 'dark' : 'light';
    localStorage.setItem('vp-theme', next ? 'dark' : 'light');
  };

  const analyze = async (sym) => {
    const tickerSym = (sym || ticker).trim();
    if (!tickerSym) return;
    setLoading(true); setError(''); setData(null);
    setPeriod('annual'); setQuarterlyHistory(null);
    try {
      const res = await axios.get(`${API}/valuation/${tickerSym.toUpperCase()}`);
      setData(res.data); setTab('overview');
    } catch(e) {
      setError(t('noDataFound'));
    } finally { setLoading(false); }
  };

  const loadQuarterly = async () => {
    if (quarterlyHistory) { setPeriod('quarterly'); return; }
    setQuarterlyLoading(true);
    try {
      const res = await axios.get(`${API}/valuation/quarterly/${data.profile.ticker}`);
      setQuarterlyHistory(res.data.history);
      setPeriod('quarterly');
    } catch(e) {}
    setQuarterlyLoading(false);
  };

  const getDCF = () => {
    if (!data) return null;
    const fcf = dcfMode === 'ebitda' ? data.financials.ebitda : data.financials.fcf;
    if (!fcf || fcf <= 0) return null;
    return calcDCF({ fcf, shares:data.profile.shares, totalDebt:data.financials.totalDebt, cash:data.financials.cash, g1:dcfP.g1/100, g2:dcfP.g2/100, wacc:dcfP.wacc/100, tgr:dcfP.tgr/100 });
  };

  const getGordon = () => calcGordon({ dps:data?.multiples?.dps, r:gordonP.r/100, g:gordonP.g/100 });
  const getRI = () => calcRI({ bvps:data?.multiples?.bvps, roe:(data?.financials?.roe||0)/100, ke:riP.ke/100, g:riP.g/100 });

  const exportExcel = () => {
    if (!data) return;
    const dcf = getDCF();
    const wb = XLSX.utils.book_new();
    const sum = [['Noesis — '+data.profile.name,''],['Date',new Date().toLocaleDateString('en-US')],['Market Price',fmtPrice(data.profile.price)],['Market Cap',fmtB(data.profile.marketCap)],['DCF',dcf?fmtPrice(dcf.fv):'N/A'],['Revenue',fmtB(data.financials.revenue)],['EBITDA',fmtB(data.financials.ebitda)],['FCF',fmtB(data.financials.fcf)],['Net Income',fmtB(data.financials.netIncome)]];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sum), 'Summary');
    if (data.history?.length) {
      const hs = [['Year','Revenue','EBITDA','Net Income','FCF'],...data.history.map(r=>[r.year,r.revenue,r.ebitda,r.netIncome,r.fcf])];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hs), 'History');
    }
    XLSX.writeFile(wb, `Noesis_${data.profile.ticker}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const dcf = getDCF();
  const gordonFV = getGordon();
  const riFV = getRI();
  const price = data?.profile?.price;
  const scoreData = data && price ? calcCompositeScore({ dcf, gordonFV, riFV, grahamFV:data?.valuation?.grahamNumber, price, data, dcfP }) : null;

  const C = {
    card: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', boxShadow:'var(--shadow)' },
    sub:  { background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)' },
    p:    { color:'var(--text-primary)' },
    s:    { color:'var(--text-secondary)' },
    m:    { color:'var(--text-muted)' },
    bdr:  { borderBottom:'1px solid var(--border)' },
    green:{ color:'var(--green)' },
    red:  { color:'var(--red)' },
    amber:{ color:'var(--amber)' },
    accent:{ color:'var(--accent)' },
  };

  // ── Main tabs (simple) ──
  const mainTabs = [
    { id:'overview',  label: t('tabOverview') },
    { id:'valuation', label: t('tabValuation') },
    { id:'financials',label: t('tabFinancials') },
    { id:'analysis',  label: t('tabAnalysis') },
    { id:'docs',      label: t('tabDocs') },
  ];

  // ── Advanced tabs ──
  const advancedTabs = [
    { id:'gordon',  label: t('tabGordon') },
    { id:'ri',      label: t('tabRI') },
    { id:'capital', label: t('tabCapital') },
    { id:'forward', label: t('tabForward') },
    { id:'market',  label: t('tabMarket') },
    { id:'peers',   label: t('tabPeers') },
  ];

  const allTabs = [...mainTabs, ...advancedTabs];

  if (!user) return <Login onLogin={u => setUser(u)} />;

  return (
    <div style={{minHeight:'100vh',background:'var(--bg-base)'}}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo-dot" />
            <div>
              <div className="wordmark" style={{ fontSize: 15 }}>NOESIS</div>
              <div className="wordmark-tag" style={{ fontSize: 7 }}>Understand Value. Act Smarter.</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LangToggle />
            <UserMenu user={user} onLogout={() => { localStorage.removeItem('noesis-auth'); setUser(null); }} darkMode={darkMode} toggleTheme={toggleTheme}/>
          </div>
        </div>

        {/* Ticker Tape */}
        <TickerTape />

        {/* Search */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center' }}>
          <div style={{
            flex: 1, height: 44,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '0 14px 0 18px',
            background: darkMode ? 'rgba(255,255,255,0.06)' : '#ffffff',
            backdropFilter: darkMode ? 'blur(20px)' : 'none',
            WebkitBackdropFilter: darkMode ? 'blur(20px)' : 'none',
            border: darkMode ? '1px solid rgba(255,255,255,0.14)' : '1.5px solid rgba(0,0,0,0.18)',
            borderRadius: 'var(--radius-pill)',
            boxShadow: darkMode ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}>
            <input
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && analyze()}
              placeholder={t('searchPlaceholder')}
              style={{
                flex: 1, height: '100%', border: 'none', outline: 'none',
                background: 'transparent', color: 'var(--text-primary)',
                fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: ticker ? 600 : 400,
                letterSpacing: ticker ? '0.05em' : 0,
              }}
            />
            <kbd
              onClick={() => setPaletteOpen(true)}
              title="Open search palette"
              style={{
                padding: '2px 8px', fontSize: 10,
                fontFamily: 'var(--font-mono)',
                background: darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,102,255,0.08)',
                color: darkMode ? 'rgba(240,240,250,0.8)' : 'var(--accent)',
                border: darkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,102,255,0.20)',
                borderRadius: 4, letterSpacing: '0.04em', flexShrink: 0, cursor: 'pointer',
              }}>⌘K</kbd>
          </div>
          <button onClick={() => analyze()} disabled={loading} className="btn-brand" style={{ height: 42, padding: '0 24px', flexShrink: 0 }}>
            {loading ? '⟳' : t('analyzeCta')}
          </button>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 16, background: 'var(--red-bg)', border: '1px solid var(--red-border)', color: 'var(--red)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em' }}>
            <span>✕</span>{error}
          </div>
        )}

        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          onPick={(sym) => { setTicker(sym); analyze(sym); }}
        />

        {data && (<>

          {/* Hero + Decision */}
          <HeroSection data={data} scoreData={scoreData} dcf={dcf} dcfParams={dcfP}/>
          <DecisionBox scoreData={scoreData} dcf={activeModel==='pe'&&peFairValue?{fv:peFairValue}:dcf} price={price} data={data} dcfParams={dcfP}/>

          {/* Investment Profile — 4-up KPI grid */}
          {scoreData && (
            <>
              <div className="mb-4 fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  {
                    label: t('fairValue'),
                    value: dcf ? fmtPrice(dcf.fv) : 'N/A',
                    sub: t('dcfBaseCase'),
                    subColor: 'var(--text-muted)',
                    spark: true,
                  },
                  {
                    label: t('impliedDelta'),
                    value: dcf?.fv ? ((dcf.fv / price - 1) >= 0 ? '+' : '') + fmt((dcf.fv / price - 1) * 100, 1) + '%' : 'N/A',
                    sub: dcf?.fv && dcf.fv >= price ? t('upside') : t('downside'),
                    subColor: dcf?.fv && dcf.fv >= price ? 'var(--green)' : 'var(--red)',
                  },
                  {
                    label: t('fcfTTM'),
                    value: fmtB(data.financials.fcf),
                    sub: `${fmt(data.financials.fcfMargin, 1)}% ${t('margin')}`,
                    subColor: 'var(--text-muted)',
                  },
                  {
                    label: t('confidence'),
                    value: (scoreData.confidence || 'MEDIUM').toUpperCase(),
                    sub: `${scoreData.dataQuality === 'high' ? 3 : 2} / 3 ${t('models')}`,
                    subColor: scoreData.confidence === 'High' ? 'var(--green)' : 'var(--amber)',
                  },
                ].map(c => (
                  <div key={c.label} className="card" style={{ padding: '12px 14px' }}>
                    <div className="t-eyebrow" style={{ marginBottom: 8 }}>{c.label}</div>
                    <div className="t-num-lg">{c.value}</div>
                    {c.spark && (
                      <svg className="spark up" width="100%" height="20" viewBox="0 0 100 20" preserveAspectRatio="none" style={{ marginTop: 8, display: 'block' }}>
                        <path d="M0 16 L15 12 L30 14 L45 8 L60 10 L75 4 L100 2" />
                      </svg>
                    )}
                    <div className="t-meta" style={{ marginTop: 4, color: c.subColor }}>{c.sub}</div>
                  </div>
                ))}
              </div>
              {Math.abs(scoreData.expectationsGap) > 8 && (
                <div className="mb-4 fade-in" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', color: 'var(--amber)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em' }}>
                  <span>⚠</span>
                  {t('marketImplies')} <b style={{ margin: '0 4px' }}>{fmt(scoreData.impliedGrowth, 1)}%</b>{t('fcfGrowthVs')} <b>{fmt(scoreData.revCAGR || 0, 1)}%</b>{t('historical')}
                </div>
              )}
            </>
          )}

          {/* Tabs */}
          <div style={C.card} className="mb-4">
            <div className="tab-bar" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
              {mainTabs.map(t => (
                <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`}
                  onClick={() => setTab(t.id)}>{t.label}</button>
              ))}
              <button
                className={`tab ${showAdvanced ? 'active' : ''}`}
                onClick={() => { setShowAdvanced(v => !v); if (!showAdvanced) setTab('gordon'); }}
                style={{ marginLeft: 'auto', borderLeft: '1px solid var(--border)' }}>
                {showAdvanced ? t('less') : t('advanced')}
              </button>
            </div>

            {/* Advanced tabs row */}
            {showAdvanced && (
              <div className="tab-bar" style={{ background: 'var(--bg-subtle)', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {advancedTabs.map(t => (
                  <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`}
                    onClick={() => setTab(t.id)}
                    style={{ fontSize: '11px', padding: '8px 16px' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 sm:p-5">

              {/* ── OVERVIEW ── */}
              {tab==='overview' && (
                <div>
                  <PriceChart ticker={data.profile.ticker} darkMode={darkMode}/>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    {[
                      {title:t('profitability'),rows:[[t('revenue'),fmtB(data.financials.revenue)],[t('ebitda'),fmtB(data.financials.ebitda)],[t('netIncome'),fmtB(data.financials.netIncome)],[t('fcf'),fmtB(data.financials.fcf)],[t('grossMargin'),fmtPct(data.financials.grossMargin)],[t('ebitdaMargin'),fmtPct(data.financials.ebitdaMargin)],[t('netMargin'),fmtPct(data.financials.netMargin)],[t('fcfMargin'),fmtPct(data.financials.fcfMargin)]]},
                      {title:t('balanceSheet'),rows:[[t('totalAssets'),fmtB(data.financials.totalAssets)],[t('equity'),fmtB(data.financials.equity)],[t('totalDebt'),fmtB(data.financials.totalDebt)],[t('cash'),fmtB(data.financials.cash)],[t('netDebt'),fmtB(data.financials.netDebt)],[t('roe'),fmtPct(data.financials.roe)],[t('roic'),fmtPct(data.financials.roic)],[t('deRatio'),data.financials.debtToEquity?fmt(data.financials.debtToEquity,2)+'x':'N/A']]},
                    ].map(section=>(
                      <div key={section.title}>
                        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>{section.title}</div>
                        <table className="w-full text-sm">
                          <tbody>{section.rows.map(([k,v])=>(<tr key={k} style={C.bdr}><td className="py-1.5" style={C.s}>{k}</td><td className="py-1.5 text-right font-medium num" style={C.p}>{v}</td></tr>))}</tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── VALUATION ── */}
              {tab==='valuation' && (
                <div>
                  <DCFTab data={data} dcfP={dcfP} setDcfP={setDcfP} dcfMode={dcfMode} setDcfMode={setDcfMode} onPEValue={setPeFairValue} activeModel={activeModel} setActiveModel={setActiveModel}/>
                  
                  {/* Multiples — compact */}
                  <div style={C.card} className="p-4 mt-4">
                    <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>{t('keyMultiples')}</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm" style={{minWidth:300}}>
                        <thead><tr className="text-xs" style={{...C.m,...C.bdr}}><th className="pb-2 text-left">{t('multiple')}</th><th className="pb-2 text-right">{t('current')}</th><th className="pb-2 text-right">{t('fairValue')}</th><th className="pb-2 text-right">{t('vsMarket')}</th></tr></thead>
                        <tbody>{[
                          {name:'P/E',val:data.multiples.pe,base:data.multiples.eps,target:20},
                          {name:'P/E Fwd',val:data.multiples.forwardPE,base:data.multiples.eps,target:18},
                          {name:'EV/EBITDA',val:data.multiples.evEbitda,base:data.financials.ebitda&&data.profile.shares?data.financials.ebitda/data.profile.shares:null,target:12},
                          {name:'P/FCF ★',val:data.multiples.evFcf,base:data.financials.fcf&&data.profile.shares?data.financials.fcf/data.profile.shares:null,target:20,primary:true},
                        ].map(m=>{const fv=m.target&&m.base?m.target*m.base:null;const up=fv&&price?(fv/price-1)*100:null;return(
                          <tr key={m.name} style={{...C.bdr,background:m.primary?'var(--green-bg)':'transparent'}}>
                            <td className="py-2 font-medium" style={{color:m.primary?'var(--green)':'var(--text-primary)'}}>{m.name}</td>
                            <td className="py-2 text-right num" style={C.p}>{m.val?fmt(m.val,1)+'x':'—'}</td>
                            <td className="py-2 text-right num" style={C.p}>{fv?fmtPrice(fv):'—'}</td>
                            <td className="py-2 text-right num">{up!=null&&<span style={{color:up>=0?'var(--green)':'var(--red)',fontWeight:600}}>{up>=0?'+':''}{fmt(up,1)}%</span>}</td>
                          </tr>
                        );})}</tbody>
                      </table>
                    </div>
                    {data.multiples.targetPrice && (
                      <div className="mt-3 pt-3 flex items-center gap-4 text-xs" style={{borderTop:'1px solid var(--border)'}}>
                        <span style={C.m}>{t('analystTarget')}</span>
                        <span className="font-bold num" style={C.accent}>{fmtPrice(data.multiples.targetPrice)}</span>
                        <span style={{color:data.multiples.targetPrice>price?'var(--green)':'var(--red)',fontWeight:600}}>
                          {data.multiples.targetPrice>price?'+':''}{fmt((data.multiples.targetPrice/price-1)*100,1)}%
                        </span>
                        <span style={C.m}>{data.multiples.analystRating} · {data.multiples.numberOfAnalysts} {t('analysts')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── FINANCIALS ── */}
              {tab==='financials' && (
                <div>
                  {(()=>{
                    const hist=(period==='quarterly'?quarterlyHistory:data.history)||[];
                    const revArr=hist.filter(r=>r.revenue&&r.revenue>0);
                    const revCAGR=revArr.length>=2?((revArr[revArr.length-1].revenue/revArr[0].revenue)**(1/(revArr.length-1))-1)*100:null;
                    const tw=revCAGR!==null?revCAGR>10?t('highGrowth',fmt(revCAGR,1)):revCAGR>5?t('moderateGrowth',fmt(revCAGR,1)):t('matureGrowth',fmt(revCAGR,1)):t('stableBusiness');
                    return(
                      <div>
                        <div className="rounded-xl p-3 mb-4 border-l-4" style={{background:'var(--green-bg)',borderLeftColor:'var(--green)'}}>
                          <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>{t('takeaway')}</div>
                          <div className="text-sm font-semibold" style={C.p}>{tw}</div>
                        </div>
                        <div className="flex gap-2 mb-4">
                          <button onClick={()=>setPeriod('annual')} className="px-4 py-1.5 text-xs font-semibold rounded-lg" style={{background:period==='annual'?'var(--accent)':'var(--bg-subtle)',color:period==='annual'?'white':'var(--text-muted)',border:'1px solid var(--border)'}}>{t('annual')}</button>
                          <button onClick={loadQuarterly} disabled={quarterlyLoading} className="px-4 py-1.5 text-xs font-semibold rounded-lg" style={{background:period==='quarterly'?'var(--accent)':'var(--bg-subtle)',color:period==='quarterly'?'white':'var(--text-muted)',border:'1px solid var(--border)'}}>{quarterlyLoading?t('loadingQuarterly'):t('quarterly')}</button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm mb-4" style={{minWidth:320}}>
                            <thead><tr className="text-xs" style={{...C.m,...C.bdr}}><th className="pb-2 text-left">{t('metric')}</th>{hist.map(r=><th key={r.year} className="pb-2 text-right num">{r.year}</th>)}</tr></thead>
                            <tbody>{[{label:t('revenue'),key:'revenue'},{label:t('ebitda'),key:'ebitda'},{label:t('netIncome'),key:'netIncome'},{label:t('fcf'),key:'fcf'},{label:t('grossMargin'),key:'grossMargin',pct:true},{label:t('netMargin'),key:'netMargin',pct:true}].map(row=>(
                              <tr key={row.label} style={C.bdr}><td className="py-1.5 font-medium" style={C.s}>{row.label}</td>{hist.map(r=><td key={r.year} className="py-1.5 text-right num" style={C.p}>{row.pct?fmtPct(r[row.key]):fmtB(r[row.key])}</td>)}</tr>
                            ))}</tbody>
                          </table>
                        </div>
                        <FinancialsChart history={data.history}/>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ── ANALYSIS ── */}
              {tab==='analysis' && (
                <div>
                  <ThesisTab data={data} scoreData={scoreData} dcf={dcf} dcfParams={dcfP}/>
                  <div className="mt-4">
                    <BusinessDrivers data={data}/>
                  </div>
                  <div className="mt-4">
                    <AIAnalysis data={data} dcfParams={dcfP}/>
                  </div>
                </div>
              )}

              {/* ── DOCUMENTS ── */}
              {tab==='docs' && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>{t('officialDocs')}</div>
                  <div className="flex flex-col gap-2">
                    {data.links?.map((l,i)=>(
                      <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl transition-all"
                        style={{border:'1px solid var(--border)',background:'var(--bg-card)'}}>
                        <span className="text-sm font-medium" style={C.p}>{l.label}</span>
                        <span className="text-xs font-semibold" style={C.accent}>↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* ── ADVANCED TABS ── */}
              {tab==='gordon' && (()=>{
                const spread=gordonP.r-gordonP.g,dps=data.multiples.dps||0;
                const upside=gordonFV&&price?(gordonFV/price-1)*100:null;
                const tw=!dps||dps===0?t('gordonNoDiv'):gordonFV&&price&&gordonFV<price?t('gordonSuggestsOver'):t('gordonSuggests');
                return(
                  <div>
                    <div className="rounded-xl p-4 mb-4 border-l-4" style={{background:!dps?'var(--amber-bg)':gordonFV&&price&&gordonFV<price?'var(--red-bg)':'var(--green-bg)',borderLeftColor:!dps?'var(--amber)':gordonFV&&price&&gordonFV<price?'var(--red)':'var(--green)'}}><div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>{t('gordonModel')}</div><div className="text-sm font-semibold" style={C.p}>{tw}</div></div>
                    <div className="grid grid-cols-2 gap-3 mb-4">{[{key:'r',label:t('requiredReturn')},{key:'g',label:t('dividendGrowth')}].map(p=>(<div key={p.key}><label className="text-xs block mb-1" style={C.m}>{p.label}</label><input type="number" step="0.5" value={gordonP[p.key]} onChange={e=>setGordonP(prev=>({...prev,[p.key]:parseFloat(e.target.value)||0}))} className="w-full h-9 px-3 text-sm text-right num" style={{background:'var(--bg-input)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)'}}/></div>))}</div>
                    <div className="rounded-xl p-4" style={C.sub}>{gordonFV?(<><div className="text-sm mb-1" style={C.m}>{t('fairValue')}</div><div className="text-3xl font-black num" style={C.green}>{fmtPrice(gordonFV)}</div>{upside!=null&&<div className="text-sm font-bold mt-2 num" style={{color:upside>=0?'var(--green)':'var(--red)'}}>{upside>=0?'+':''}{fmt(upside,1)}% {t('vsMarketLc')}</div>}</>):<div className="text-sm" style={C.amber}>{t('gordonNoApply')}</div>}</div>
                  </div>
                );
              })()}

              {tab==='ri' && (
                <div>
                  <div className="grid grid-cols-2 gap-3 mb-5">{[{key:'ke',label:t('costOfEquity')},{key:'g',label:t('growthRate')}].map(p=>(<div key={p.key}><label className="text-xs block mb-1" style={C.m}>{p.label}</label><input type="number" step="0.5" value={riP[p.key]} onChange={e=>setRiP(prev=>({...prev,[p.key]:parseFloat(e.target.value)||0}))} className="w-full h-9 px-3 text-sm text-right num" style={{background:'var(--bg-input)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)'}}/></div>))}</div>
                  <div className="rounded-xl p-4" style={C.sub}>
                    <div className="grid grid-cols-3 gap-3 mb-4">{[[t('bvShare'),fmtPrice(data.multiples.bvps)],[t('roe'),fmtPct(data.financials.roe)],[t('costOfEq'),riP.ke+'%']].map(([l,v])=>(<div key={l}><div className="text-xs mb-1" style={C.m}>{l}</div><div className="font-bold text-base num" style={C.p}>{v}</div></div>))}</div>
                    {riFV?(<><div className="text-sm mb-1" style={C.m}>{t('riFairValue')}</div><div className="text-3xl font-black num" style={C.green}>{fmtPrice(riFV)}</div></>):<div className="text-sm" style={C.amber}>{t('insufficientData')}</div>}
                  </div>
                  {data?.valuation?.grahamNumber&&(<div className="rounded-xl p-4 mt-4" style={{background:'var(--accent-subtle)',border:'1px solid var(--accent)'}}><div className="text-sm font-bold mb-1" style={C.accent}>{t('grahamNumber')}</div><div className="text-2xl font-black num" style={C.accent}>{fmtPrice(data.valuation.grahamNumber)}</div>{price&&<div className="text-sm font-bold mt-1 num" style={{color:data.valuation.grahamNumber>price?'var(--green)':'var(--red)'}}>{data.valuation.grahamNumber>price?'+':''}{fmt((data.valuation.grahamNumber/price-1)*100,1)}% {t('vsMarketLc')}</div>}</div>)}
                </div>
              )}

              {tab==='capital' && (()=>{
                const ca=data.capitalAllocation||{};
                const dy=(ca.dividendYield||0)*100,by=(ca.buybackYield||0)*100,tr=dy+by;
                const dp=ca.dividendsPaid||0,bb=ca.shareRepurchase||0;
                return(
                  <div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">{[{label:t('dividendYield'),value:dy.toFixed(2)+'%',color:'var(--green)'},{label:t('buybackYield'),value:by.toFixed(2)+'%',color:'var(--accent)'},{label:t('totalYield'),value:tr.toFixed(2)+'%',color:'var(--amber)',hi:true},{label:t('payoutRatio'),value:ca.payoutRatio?(ca.payoutRatio*100).toFixed(1)+'%':'—',color:'var(--text-primary)'}].map(item=>(<div key={item.label} className="rounded-xl p-3" style={{background:item.hi?'var(--amber-bg)':'var(--bg-subtle)',border:`1px solid ${item.hi?'var(--amber)':'var(--border)'}`}}><div className="text-xs mb-1" style={C.m}>{item.label}</div><div className="text-xl font-black num" style={{color:item.color}}>{item.value}</div></div>))}</div>
                    <div className="rounded-xl p-4" style={{background:'var(--accent-subtle)',border:'1px solid var(--accent)'}}><div className="text-xs font-bold uppercase tracking-widest mb-2" style={C.accent}>{t('insight')}</div><div className="text-sm" style={C.s}>{tr>5?t('capitalStrongReturn',data.profile.ticker,tr.toFixed(1)):tr>2?t('capitalModerate',tr.toFixed(1)):t('capitalReinvest',data.profile.ticker)}</div></div>
                  </div>
                );
              })()}

              {tab==='forward' && <ForwardView estimates={data.estimates} history={data.history} price={data.profile.price} shares={data.profile.shares} netDebt={data.financials.netDebt}/>}

              {tab==='market' && (<div><MarketExpectations data={data} dcfParams={dcfP}/><div className="mt-4"><ThesisTriggers data={data} dcfParams={dcfP} scoreData={scoreData}/></div></div>)}

              {tab==='peers' && <PeerComparison ticker={data.profile.ticker} sector={data.profile.sector} currentPE={data.multiples.pe} currentEVEbitda={data.multiples.evEbitda} currentPS={data.multiples.ps} currentPB={data.multiples.pb} currentLogo={data.profile.logo} currentName={data.profile.name} currentNetMargin={data.financials.netMargin} currentRevGrowth={(()=>{const h=data.history?.filter(r=>r.revenue&&r.revenue>0);if(!h||h.length<2)return null;return((h[h.length-1].revenue/h[0].revenue)**(1/(h.length-1))-1)*100;})()}/>}

            </div>
          </div>

          <div className="flex gap-3 pb-6">
            <button onClick={exportExcel} className="btn-brand h-10 px-4 sm:px-6 text-sm">{t('exportExcel')}</button>
          </div>
        </>)}
      </div>
    </div>
  );
}
