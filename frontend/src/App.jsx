import { useState } from 'react';
import axios from 'axios';
import { fmt, fmtB, fmtPct, fmtPrice, getBadge } from './utils/format';
import * as XLSX from 'xlsx';
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
import Login from './components/Login';
import HeroSection from './components/HeroSection';
import ThesisTab from './components/ThesisTab';
import DCFTab from './components/DCFTab';

const API = 'https://web-production-bdb26.up.railway.app/api';

function Badge({ upside }) {
  const color = upside >= 20 ? {bg:'var(--green-bg)',text:'var(--green)'} : upside >= 0 ? {bg:'var(--amber-bg)',text:'var(--amber)'} : {bg:'var(--red-bg)',text:'var(--red)'};
  const label = upside >= 20 ? 'Undervalued' : upside >= 0 ? 'Fair' : 'Overvalued';
  return <span className="text-xs px-2 py-0.5 rounded font-medium" style={{background:color.bg,color:color.text}}>{label}</span>;
}

function UserMenu({ user, onLogout, darkMode, toggleTheme }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{position:'relative'}}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{background:'var(--bg-subtle)',color:'var(--text-secondary)',border:'1px solid var(--border-strong)'}}>
        <div style={{width:22,height:22,borderRadius:'50%',background:'var(--gradient-brand)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:10,fontWeight:700}}>
          {user.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:inline">{user}</span>
        <span style={{fontSize:9,opacity:0.5}}>{open?'▲':'▼'}</span>
      </button>

      {open && <>
        <div style={{position:'fixed',inset:0,zIndex:40}} onClick={() => setOpen(false)}/>
        <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,width:220,zIndex:50,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',boxShadow:'var(--shadow-md)',overflow:'hidden'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',background:'var(--bg-subtle)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'var(--gradient-brand)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:13,fontWeight:700,flexShrink:0}}>
                {user.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{user}</div>
                <div style={{fontSize:11,color:'var(--text-muted)'}}>Pro Plan</div>
              </div>
            </div>
          </div>
          {[
            {icon:'👤', label:'Account', sub:'Manage your profile'},
            {icon:'💳', label:'Subscription', sub:'Pro · Renews monthly'},
            {icon:'🔔', label:'Notifications', sub:'Alerts & updates'},
            {icon:'⚙️', label:'Settings', sub:'Preferences'},
            {icon:'📊', label:'Usage', sub:'API calls & limits'},
            {icon:'❓', label:'Help & Support', sub:'Docs & contact'},
          ].map(item => (
            <button key={item.label} onClick={() => setOpen(false)}
              style={{width:'100%',padding:'10px 16px',display:'flex',alignItems:'center',gap:12,background:'transparent',border:'none',cursor:'pointer',borderBottom:'1px solid var(--border)',transition:'background 0.1s'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg-subtle)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <span style={{fontSize:15}}>{item.icon}</span>
              <div style={{textAlign:'left'}}>
                <div style={{fontSize:12,fontWeight:500,color:'var(--text-primary)'}}>{item.label}</div>
                <div style={{fontSize:10,color:'var(--text-muted)'}}>{item.sub}</div>
              </div>
            </button>
          ))}
          <button onClick={() => { toggleTheme(); setOpen(false); }}
            style={{width:'100%',padding:'10px 16px',display:'flex',alignItems:'center',gap:12,background:'transparent',border:'none',cursor:'pointer',borderBottom:'1px solid var(--border)',transition:'background 0.1s'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--bg-subtle)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <span style={{fontSize:15}}>{darkMode ? '☀️' : '🌙'}</span>
            <div style={{textAlign:'left'}}>
              <div style={{fontSize:12,fontWeight:500,color:'var(--text-primary)'}}>{darkMode ? 'Light Mode' : 'Dark Mode'}</div>
              <div style={{fontSize:10,color:'var(--text-muted)'}}>Switch appearance</div>
            </div>
          </button>
          <button onClick={() => { onLogout(); setOpen(false); }}
            style={{width:'100%',padding:'10px 16px',display:'flex',alignItems:'center',gap:12,background:'transparent',border:'none',cursor:'pointer',transition:'background 0.1s'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--red-bg)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <span style={{fontSize:15}}>🚪</span>
            <div style={{textAlign:'left'}}>
              <div style={{fontSize:12,fontWeight:500,color:'var(--red)'}}>Sign Out</div>
              <div style={{fontSize:10,color:'var(--text-muted)'}}>Log out of Noesis</div>
            </div>
          </button>
        </div>
      </>}
    </div>
  );
}

function calcDCF({ fcf, shares, totalDebt, cash, g1, g2, wacc, tgr }) {
  if (!fcf || !shares || fcf <= 0) return null;
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
  if (!bvps || !roe || ke <= g) return null;
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
  const weights = companyStyle === 'Growth' ? { val: 0.25, growth: 0.35, quality: 0.25, risk: 0.15 }
    : companyStyle === 'Growth-Blend' ? { val: 0.30, growth: 0.30, quality: 0.25, risk: 0.15 }
    : companyStyle === 'Mature' ? { val: 0.40, growth: 0.15, quality: 0.25, risk: 0.20 }
    : { val: 0.35, growth: 0.20, quality: 0.25, risk: 0.20 };
  const wacc = dcfP.wacc/100, tgr = dcfP.tgr/100, fcfBase = data.financials.fcf;
  const sh = data.profile.shares, nd = data.financials.netDebt, targetEV = price * sh + nd;
  let lo = -0.1, hi = 0.5, mid = 0;
  for (let i = 0; i < 50; i++) {
    mid = (lo+hi)/2; let f=fcfBase,pv=0;
    for(let y=1;y<=10;y++){f*=(1+mid);pv+=f/Math.pow(1+wacc,y);}
    const tv=f*(1+tgr)/(wacc-tgr); const ev=pv+tv/Math.pow(1+wacc,10);
    if(ev>targetEV)hi=mid;else lo=mid;
  }
  const impliedGrowth = mid * 100;
  const growthGap = impliedGrowth - (revCAGR || 0);
  let valuationScore;
  if (upsideAvg === null) valuationScore = 50;
  else if (companyStyle === 'Growth' || companyStyle === 'Growth-Blend') {
    const gAdj = upsideAvg + (revCAGR || 0) * 0.5;
    valuationScore = gAdj > 30 ? 85 : gAdj > 10 ? 70 : gAdj > -10 ? 55 : gAdj > -30 ? 35 : 20;
  } else {
    valuationScore = upsideAvg > 30 ? 85 : upsideAvg > 10 ? 70 : upsideAvg > -10 ? 50 : upsideAvg > -30 ? 30 : 15;
  }
  const growthScore = growthGap > 15 ? 15 : growthGap > 8 ? 30 : growthGap > 3 ? 50 : growthGap > -3 ? 70 : 85;
  const roic = data.financials.roic || 0, fcfMargin = data.financials.fcfMargin || 0;
  const qualityRaw = ((netMargin>20?3:netMargin>10?2:netMargin>0?1:0)+(roic>20?3:roic>10?2:roic>0?1:0)+(fcfMargin>15?3:fcfMargin>5?2:fcfMargin>0?1:0));
  const qualityScore = Math.round(qualityRaw/9*100);
  const tvPct = dcf ? dcf.pvTV/dcf.ev : 0.6;
  const modelSpread = models2.length > 1 ? Math.max(...models2)/Math.min(...models2) - 1 : 0.5;
  const beta = data.profile.beta || 1;
  const riskScore = Math.min(100,
    (beta>1.5?0:beta>1.2?10:beta>0.8?20:30)+
    (tvPct>0.75?0:tvPct>0.6?15:30)+
    (modelSpread>0.5?0:modelSpread>0.3?10:20)+
    (Math.abs(growthGap)>15?0:Math.abs(growthGap)>8?10:20)
  );
  const composite = Math.round(valuationScore*weights.val+growthScore*weights.growth+qualityScore*weights.quality+riskScore*weights.risk);
  const rating = composite>=80?'Strong Buy':composite>=65?'Buy':composite>=45?'Hold':composite>=25?'Sell':'Strong Sell';
  const ratingColor = composite>=65?'var(--green)':composite>=45?'var(--amber)':'var(--red)';
  const dataQuality = models2.length>=3?'high':models2.length>=2?'medium':'low';
  const modelConsistency = modelSpread<0.3?'high':modelSpread<0.6?'medium':'low';
  const assumptionStability = tvPct<0.6?'high':tvPct<0.75?'medium':'low';
  const confTotal = [dataQuality,modelConsistency,assumptionStability].map(s=>s==='high'?2:s==='medium'?1:0).reduce((a,b)=>a+b,0);
  const confidence = confTotal>=5?'High':confTotal>=3?'Medium':'Low';
  const confColor = confidence==='High'?'var(--green)':confidence==='Medium'?'var(--amber)':'var(--red)';
  const explanations = [];
  if (upsideAvg!==null&&upsideAvg<-20) explanations.push(`Overvalued ~${Math.abs(Math.round(upsideAvg))}% vs intrinsic value`);
  else if (upsideAvg!==null&&upsideAvg>20) explanations.push(`Undervalued ~${Math.round(upsideAvg)}% — potential upside`);
  else explanations.push('Trading near intrinsic value');
  if (growthGap>8) explanations.push('Market pricing aggressive growth not supported by history');
  else if (growthGap<-3) explanations.push('Growth expectations conservative — upside catalyst possible');
  else explanations.push('Growth expectations appear reasonable');
  if (qualityScore>70) explanations.push('High-quality business with strong margins and returns');
  else if (qualityScore>40) explanations.push('Solid business fundamentals');
  else explanations.push('Business quality warrants caution');
  if (riskScore<30) explanations.push('High model risk — terminal value dependency');
  else if (riskScore>60) explanations.push('Model confidence supported by consistent signals');
  else explanations.push('Moderate risk — sensitive to key assumptions');
  const cappedGrowthAdj = Math.min(100,Math.max(0,Math.round(composite+(revCAGR||0)*0.3)));
  return { composite, rating, ratingColor, confidence, confColor, companyStyle, weights, valuationScore, growthScore, qualityScore, riskScore, expectationsGap: growthGap, impliedGrowth, revCAGR, upsideAvg, explanations, cappedGrowthAdj, tvPct, modelSpread, beta, dataQuality, modelConsistency, assumptionStability };
}

export default function App() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('overview');
  const [dcfP, setDcfP] = useState({ g1: 10, g2: 6, wacc: 10, tgr: 3 });
  const [gordonP, setGordonP] = useState({ r: 10, g: 4 });
  const [riP, setRiP] = useState({ ke: 10, g: 4 });
  const [period, setPeriod] = useState('annual');
  const [quarterlyHistory, setQuarterlyHistory] = useState(null);
  const [quarterlyLoading, setQuarterlyLoading] = useState(false);
  const [dcfMode, setDcfMode] = useState('fcf');
  const [user, setUser] = useState('ADMIN');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('vp-theme') === 'dark');

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.className = next ? 'dark' : 'light';
    localStorage.setItem('vp-theme', next ? 'dark' : 'light');
  };

  const analyze = async () => {
    if (!ticker.trim()) return;
    setLoading(true); setError(''); setData(null);
    setPeriod('annual'); setQuarterlyHistory(null);
    try {
      const res = await axios.get(`${API}/valuation/${ticker.trim().toUpperCase()}`);
      setData(res.data); setTab('overview');
    } catch (e) {
      setError('No data found. Please check the ticker.');
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
    return calcDCF({ fcf, shares: data.profile.shares, totalDebt: data.financials.totalDebt, cash: data.financials.cash, g1: dcfP.g1/100, g2: dcfP.g2/100, wacc: dcfP.wacc/100, tgr: dcfP.tgr/100 });
  };

  const getGordon = () => calcGordon({ dps: data?.multiples?.dps, r: gordonP.r/100, g: gordonP.g/100 });
  const getRI = () => calcRI({ bvps: data?.multiples?.bvps, roe: (data?.financials?.roe||0)/100, ke: riP.ke/100, g: riP.g/100 });

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
  const grahamFV = data?.valuation?.grahamNumber;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'dcf', label: 'DCF' },
    { id: 'multiples', label: 'Multiples' },
    { id: 'gordon', label: 'Gordon' },
    { id: 'ri', label: 'Value Models' },
    { id: 'financials', label: 'Financials' },
    { id: 'capital', label: 'Capital Alloc.' },
    { id: 'forward', label: 'Forward' },
    { id: 'market', label: 'Market Exp.' },
    { id: 'drivers', label: 'Drivers' },
    { id: 'peers', label: 'Peers' },
    { id: 'thesis', label: 'Thesis' },
    { id: 'ai', label: 'AI' },
    { id: 'links', label: 'Docs' },
  ];

  const scoreData = data && price ? calcCompositeScore({ dcf, gordonFV, riFV, grahamFV: data?.valuation?.grahamNumber, price, data, dcfP }) : null;

  const C = {
    card: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', boxShadow:'var(--shadow)' },
    sub: { background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)' },
    p: { color:'var(--text-primary)' },
    s: { color:'var(--text-secondary)' },
    m: { color:'var(--text-muted)' },
    bdr: { borderBottom:'1px solid var(--border)' },
    green: { color:'var(--green)' },
    red: { color:'var(--red)' },
    amber: { color:'var(--amber)' },
    accent: { color:'var(--accent)' },
  };

  return (
    <div style={{minHeight:'100vh',background:'var(--bg-base)'}} dir="ltr">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <div className="flex items-center gap-2">
            <div className="logo-dot"></div>
            <div>
              <div style={{fontSize:15,fontWeight:700,letterSpacing:2,color:'var(--text-primary)',fontFamily:'"Arial Black",sans-serif',lineHeight:1.2}}>NOESIS</div>
              <div style={{fontSize:7,letterSpacing:1.5,color:'var(--text-muted)',fontFamily:'Arial,sans-serif',fontStyle:'italic',marginTop:2}}>Understand Value. Act Smarter.</div>
            </div>
          </div>
          <UserMenu user={user} onLogout={() => { localStorage.removeItem('noesis-auth'); setUser(null); }} darkMode={darkMode} toggleTheme={toggleTheme}/>
        </div>

        {/* ── Search ── */}
        <div className="flex gap-2 mb-4 sm:mb-6">
          <input className="flex-1 h-11 px-3 sm:px-4 text-sm rounded-xl"
            style={{background:'var(--bg-input)',border:'1px solid var(--border)',color:'var(--text-primary)',minWidth:0}}
            placeholder="Enter ticker: AAPL · TSLA · MSFT..."
            value={ticker} onChange={e=>setTicker(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&analyze()} />
          <button onClick={analyze} disabled={loading} className="btn-brand h-11 px-4 sm:px-7 text-sm whitespace-nowrap">
            {loading ? '⟳' : 'Analyze ▶'}
          </button>
        </div>

        {error && <div className="px-4 py-3 rounded-xl text-sm mb-4" style={{background:'var(--red-bg)',color:'var(--red)',border:'1px solid var(--red)'}}>{error}</div>}

        {data && (<>
          <HeroSection data={data} scoreData={scoreData} dcf={dcf} dcfParams={dcfP}/>
          <DecisionBox scoreData={scoreData} dcf={dcf} price={price} data={data} dcfParams={dcfP}/>

          {scoreData && (
            <div style={{...C.card, padding:'16px 18px'}} className="mb-4 fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest mb-2" style={C.m}>Investment Profile</div>
                  <div style={{fontSize:18,fontWeight:700,color:scoreData.ratingColor,marginBottom:4}}>
                    {scoreData.composite >= 80 ? 'Strong Opportunity' :
                     scoreData.composite >= 65 ? 'Attractive Compounder' :
                     scoreData.composite >= 50 ? 'Fairly Valued' :
                     scoreData.composite >= 35 ? 'High Expectations' :
                     scoreData.composite >= 20 ? 'Caution' : 'Speculative'}
                  </div>
                  <div className="flex items-center gap-2 text-xs flex-wrap" style={C.m}>
                    <span>● Confidence: <strong style={{color:scoreData.confColor}}>{scoreData.confidence}</strong></span>
                    <span>·</span>
                    <span>Style: <strong style={C.s}>{scoreData.companyStyle}</strong></span>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-4">
                  {[
                    {label:'Risk',value:scoreData.riskScore>=65?'Low':scoreData.riskScore>=40?'Mod':'High',color:scoreData.riskScore>=65?'var(--green)':scoreData.riskScore>=40?'var(--amber)':'var(--red)'},
                    {label:'Quality',value:scoreData.qualityScore>=65?'High':scoreData.qualityScore>=40?'Solid':'Weak',color:scoreData.qualityScore>=65?'var(--green)':scoreData.qualityScore>=40?'var(--amber)':'var(--red)'},
                    {label:'Valuation',value:scoreData.valuationScore>=65?'Cheap':scoreData.valuationScore>=40?'Fair':'Exp.',color:scoreData.valuationScore>=65?'var(--green)':scoreData.valuationScore>=40?'var(--amber)':'var(--red)'},
                  ].map(item=>(
                    <div key={item.label} className="text-center px-2 py-1.5 rounded-xl flex-1 sm:flex-none sm:px-3 sm:py-2" style={{background:'var(--bg-subtle)',border:'1px solid var(--border)'}}>
                      <div className="text-xs mb-0.5" style={C.m}>{item.label}</div>
                      <div className="text-xs sm:text-sm font-bold" style={{color:item.color}}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              {scoreData.expectationsGap !== 0 && (
                <div className="mt-3 px-3 py-2 rounded-xl text-xs" style={Math.abs(scoreData.expectationsGap)>8?{background:'var(--amber-bg)',border:'1px solid var(--amber)',color:'var(--amber)'}:{background:'var(--bg-subtle)',color:'var(--text-secondary)'}}>
                  <span className="font-bold">Expectations Gap: </span>
                  Market implies <strong>{fmt(scoreData.impliedGrowth,1)}%</strong> FCF growth vs <strong>{fmt(scoreData.revCAGR||0,1)}%</strong> historical
                  {Math.abs(scoreData.expectationsGap)>8?' — significant gap, warrants caution':' — broadly aligned'}
                </div>
              )}
            </div>
          )}

          {/* ── Tabs ── */}
          <div style={C.card} className="mb-4">
            <div className="flex overflow-x-auto" style={{...C.bdr, scrollbarWidth:'none'}}>
              {tabs.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)}
                  className="px-3 py-3 text-xs font-medium whitespace-nowrap relative transition-colors flex-shrink-0"
                  style={tab===t.id?{color:'var(--accent)'}:{color:'var(--text-muted)'}}>
                  {t.label}
                  {tab===t.id&&<div style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:'var(--gradient-brand)',borderRadius:'2px 2px 0 0'}}></div>}
                </button>
              ))}
            </div>

            <div className="p-3 sm:p-5">

              {tab==='overview'&&(
                <div>
                  <PriceChart ticker={data.profile.ticker}/>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6">
                    {[{title:'Profitability',rows:[['Revenue',fmtB(data.financials.revenue)],['Gross Profit',fmtB(data.financials.grossProfit)],['EBITDA',fmtB(data.financials.ebitda)],['EBIT',fmtB(data.financials.ebit)],['Net Income',fmtB(data.financials.netIncome)],['FCF',fmtB(data.financials.fcf)],['Gross Margin',fmtPct(data.financials.grossMargin)],['EBITDA Margin',fmtPct(data.financials.ebitdaMargin)],['Net Margin',fmtPct(data.financials.netMargin)],['FCF Margin',fmtPct(data.financials.fcfMargin)]]},{title:'Balance Sheet',rows:[['Total Assets',fmtB(data.financials.totalAssets)],['Equity',fmtB(data.financials.equity)],['Total Debt',fmtB(data.financials.totalDebt)],['Cash',fmtB(data.financials.cash)],['Net Debt',fmtB(data.financials.netDebt)],['ROE',fmtPct(data.financials.roe)],['ROA',fmtPct(data.financials.roa)],['ROIC',fmtPct(data.financials.roic)],['D/E',data.financials.debtToEquity?fmt(data.financials.debtToEquity,2)+'x':'N/A'],['Current Ratio',data.financials.currentRatio?fmt(data.financials.currentRatio,2):'N/A']]}].map(section=>(
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

              {tab==='dcf'&&(<DCFTab data={data} dcfP={dcfP} setDcfP={setDcfP} dcfMode={dcfMode} setDcfMode={setDcfMode}/>)}

              {tab==='multiples'&&(
                <div>
                  {(()=>{
                    const rg=data.history&&data.history.length>=2?(()=>{const h=data.history.filter(r=>r.revenue&&r.revenue>0);if(h.length<2)return null;return((h[h.length-1].revenue/h[0].revenue)**(1/(h.length-1))-1)*100;})():null;
                    const peg=data.multiples.pe&&rg?data.multiples.pe/rg:null;
                    const dcfUp=dcf?(dcf.fv/price-1)*100:null;
                    const stUp=data.multiples.targetPrice?(data.multiples.targetPrice/price-1)*100:null;
                    const div=dcfUp!==null&&stUp!==null?Math.abs(dcfUp-stUp):null;
                    const npe=data.multiples.pe&&data.capitalAllocation?.buybackYield?data.multiples.pe*(1-data.capitalAllocation.buybackYield):null;
                    const above=[data.multiples.pe>25,data.multiples.pb>5,data.multiples.ps>6,data.multiples.evEbitda>15].filter(Boolean).length;
                    const tw=above>=3?'Premium across all multiples — significant overvaluation vs sector':above>=2?'Moderate premium — selectively expensive vs peers':'Broadly in line or discounted vs sector';
                    return(<>
                      <div className="rounded-xl p-4 mb-4" style={{background:'var(--amber-bg)',border:'1px solid var(--amber)'}}>
                        <div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.amber}>📊 Multiples Takeaway</div>
                        <div className="text-sm font-semibold" style={C.p}>{tw}</div>
                        {peg&&<div className="text-xs mt-2" style={C.s}>PEG: <strong style={{color:peg>2?'var(--red)':peg>1?'var(--amber)':'var(--green)'}}>{fmt(peg,2)}x</strong></div>}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm mb-4" style={{minWidth:400}}>
                          <thead><tr className="text-xs" style={{...C.m,...C.bdr}}><th className="pb-2 text-left">Multiple</th><th className="pb-2 text-right">Current</th><th className="pb-2 text-right">Fair Value</th><th className="pb-2 text-right">vs Market</th></tr></thead>
                          <tbody>{[{name:'P/E (Trail)',val:data.multiples.pe,base:data.multiples.eps,target:20},{name:'P/E (Fwd)',val:data.multiples.forwardPE,base:data.multiples.eps,target:18},{name:'P/B',val:data.multiples.pb,base:data.multiples.bvps,target:3},{name:'P/S',val:data.multiples.ps,base:data.financials.revenue&&data.profile.shares?data.financials.revenue/data.profile.shares:null,target:5},{name:'EV/EBITDA',val:data.multiples.evEbitda,base:data.financials.ebitda&&data.profile.shares?data.financials.ebitda/data.profile.shares:null,target:12},{name:'P/FCF ★',val:data.multiples.evFcf,base:data.financials.fcf&&data.profile.shares?data.financials.fcf/data.profile.shares:null,target:20,primary:true}].map(m=>{const fv=m.target&&m.base?m.target*m.base:null;const up=fv&&price?(fv/price-1)*100:null;return(<tr key={m.name} style={{...C.bdr,background:m.primary?'var(--green-bg)':'transparent'}}><td className="py-2 font-medium" style={{color:m.primary?'var(--green)':'var(--text-primary)'}}>{m.name}</td><td className="py-2 text-right num" style={C.p}>{m.val?fmt(m.val,1)+'x':'—'}</td><td className="py-2 text-right num" style={C.p}>{fv?fmtPrice(fv):'—'}</td><td className="py-2 text-right num">{up!=null&&<span style={{color:up>=0?'var(--green)':'var(--red)',fontWeight:600}}>{up>=0?'+':''}{fmt(up,1)}%</span>}</td></tr>);})}</tbody>
                        </table>
                      </div>
                      {data.multiples.targetPrice&&(
                        <div className="rounded-xl p-4" style={{background:'var(--accent-subtle)',border:'1px solid var(--accent)'}}>
                          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={C.accent}>Analyst Consensus</div>
                          <div className="grid grid-cols-3 gap-3">
                            <div><div className="text-xs mb-1" style={C.m}>Target</div><div className="text-lg font-black num" style={C.accent}>{fmtPrice(data.multiples.targetPrice)}</div><div className="text-sm font-semibold num" style={{color:stUp>=0?'var(--green)':'var(--red)'}}>{stUp>=0?'+':''}{fmt(stUp,1)}%</div></div>
                            <div><div className="text-xs mb-1" style={C.m}>Rating</div><div className="text-lg font-bold capitalize" style={C.accent}>{data.multiples.analystRating||'—'}</div></div>
                            <div><div className="text-xs mb-1" style={C.m}>Analysts</div><div className="text-lg font-black num" style={C.accent}>{data.multiples.numberOfAnalysts||'—'}</div></div>
                          </div>
                        </div>
                      )}
                    </>);
                  })()}
                </div>
              )}

              {tab==='gordon'&&(
                <div>
                  {(()=>{
                    const spread=gordonP.r-gordonP.g,dps=data.multiples.dps||0,divYield=data.multiples.dividendYield||0,payoutRatio=data.multiples.payoutRatio||0;
                    const upside=gordonFV&&price?(gordonFV/price-1)*100:null;
                    const tw=!dps||dps===0?'No dividend — Gordon model not applicable':gordonFV&&price&&gordonFV<price*0.5?'Significant overvaluation — low yield limits applicability':gordonFV&&price&&gordonFV>price?'Model suggests undervaluation — yield supports price':'Moderate overvaluation per dividend model';
                    return(<div>
                      <div className="rounded-xl p-4 mb-4 border-l-4" style={{background:!dps?'var(--amber-bg)':gordonFV&&price&&gordonFV<price?'var(--red-bg)':'var(--green-bg)',borderLeftColor:!dps?'var(--amber)':gordonFV&&price&&gordonFV<price?'var(--red)':'var(--green)'}}><div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>Gordon Model Takeaway</div><div className="text-sm font-semibold" style={C.p}>{tw}</div></div>
                      <div className="grid grid-cols-2 gap-3 mb-4">{[{key:'r',label:'Required Return (%)'},{key:'g',label:'Dividend Growth (%)'}].map(p=>(<div key={p.key}><label className="text-xs block mb-1" style={C.m}>{p.label}</label><input type="number" step="0.5" value={gordonP[p.key]} onChange={e=>setGordonP(prev=>({...prev,[p.key]:parseFloat(e.target.value)||0}))} className="w-full h-9 px-3 text-sm text-right num" style={{background:'var(--bg-input)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)'}}/></div>))}</div>
                      <div className="rounded-xl p-4 mb-4" style={C.sub}><div className="text-sm mb-1" style={C.m}>Gordon Growth Fair Value</div>{gordonFV?(<><div className="text-3xl font-black num" style={C.green}>{fmtPrice(gordonFV)}</div>{upside!=null&&<div className="text-sm font-bold mt-2 num" style={{color:upside>=0?'var(--green)':'var(--red)'}}>{upside>=0?'+':''}{fmt(upside,1)}% vs market</div>}</>):<div className="text-sm" style={C.amber}>No dividend — model not applicable.</div>}</div>
                    </div>);
                  })()}
                </div>
              )}

              {tab==='ri'&&(
                <div>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[{key:'ke',label:'Cost of Equity (%)'},{key:'g',label:'Growth Rate (%)'}].map(p=>(<div key={p.key}><label className="text-xs block mb-1" style={C.m}>{p.label}</label><input type="number" step="0.5" value={riP[p.key]} onChange={e=>setRiP(prev=>({...prev,[p.key]:parseFloat(e.target.value)||0}))} className="w-full h-9 px-3 text-sm text-right num" style={{background:'var(--bg-input)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)'}}/></div>))}
                  </div>
                  <div className="rounded-xl p-4" style={C.sub}>
                    <div className="grid grid-cols-3 gap-3 mb-4">{[['BV/Share',fmtPrice(data.multiples.bvps)],['ROE',fmtPct(data.financials.roe)],['Cost of Eq',riP.ke+'%']].map(([l,v])=>(<div key={l}><div className="text-xs mb-1" style={C.m}>{l}</div><div className="font-bold text-base num" style={C.p}>{v}</div></div>))}</div>
                    {riFV?(<><div className="text-sm mb-1" style={C.m}>Residual Income Fair Value</div><div className="text-3xl font-black num" style={C.green}>{fmtPrice(riFV)}</div></>):<div className="text-sm" style={C.amber}>Insufficient data</div>}
                  </div>
                  {data?.valuation?.grahamNumber&&(<div className="rounded-xl p-4 mt-4" style={{background:'var(--accent-subtle)',border:'1px solid var(--accent)'}}><div className="text-sm font-bold mb-1" style={C.accent}>Graham Number</div><div className="text-2xl font-black num" style={C.accent}>{fmtPrice(data.valuation.grahamNumber)}</div>{price&&<div className="text-sm font-bold mt-1 num" style={{color:data.valuation.grahamNumber>price?'var(--green)':'var(--red)'}}>{data.valuation.grahamNumber>price?'+':''}{fmt((data.valuation.grahamNumber/price-1)*100,1)}% vs market</div>}</div>)}
                </div>
              )}

              {tab==='financials'&&(
                <div>
                  {(()=>{
                    const hist=(period==='quarterly'?quarterlyHistory:data.history)||[];
                    const revArr=hist.filter(r=>r.revenue&&r.revenue>0);
                    const revCAGR=revArr.length>=2?((revArr[revArr.length-1].revenue/revArr[0].revenue)**(1/(revArr.length-1))-1)*100:null;
                    const tw=revCAGR!==null?revCAGR>10?`High-growth: ${fmt(revCAGR,1)}% revenue CAGR`:revCAGR>5?`Moderate growth: ${fmt(revCAGR,1)}% CAGR`:`Mature: ${fmt(revCAGR,1)}% CAGR`:'Stable business';
                    return(<div>
                      <div className="rounded-xl p-4 mb-4 border-l-4" style={{background:'var(--green-bg)',borderLeftColor:'var(--green)'}}><div className="text-xs font-bold uppercase tracking-widest mb-1" style={C.m}>Financials Takeaway</div><div className="text-sm font-semibold" style={C.p}>{tw}</div></div>
                      <div className="flex gap-2 mb-4">
                        <button onClick={()=>setPeriod('annual')} className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all" style={{background:period==='annual'?'var(--accent)':'var(--bg-subtle)',color:period==='annual'?'white':'var(--text-muted)',border:'1px solid var(--border)'}}>Annual</button>
                        <button onClick={loadQuarterly} disabled={quarterlyLoading} className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all" style={{background:period==='quarterly'?'var(--accent)':'var(--bg-subtle)',color:period==='quarterly'?'white':'var(--text-muted)',border:'1px solid var(--border)'}}>{quarterlyLoading?'⟳ Loading...':'Quarterly'}</button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm mb-4" style={{minWidth:320}}>
                          <thead><tr className="text-xs" style={{...C.m,...C.bdr}}><th className="pb-2 text-left">Metric</th>{hist.map(r=><th key={r.year} className="pb-2 text-right num">{r.year}</th>)}</tr></thead>
                          <tbody>{[{label:'Revenue',key:'revenue'},{label:'EBITDA',key:'ebitda'},{label:'Net Income',key:'netIncome'},{label:'FCF',key:'fcf'},{label:'Gross Margin',key:'grossMargin',pct:true},{label:'Net Margin',key:'netMargin',pct:true}].map(row=>{return(<tr key={row.label} style={C.bdr}><td className="py-1.5 font-medium" style={C.s}>{row.label}</td>{hist.map(r=><td key={r.year} className="py-1.5 text-right num" style={C.p}>{row.pct?fmtPct(r[row.key]):fmtB(r[row.key])}</td>)}</tr>);})}</tbody>
                        </table>
                      </div>
                      <FinancialsChart history={data.history}/>
                    </div>);
                  })()}
                </div>
              )}

              {tab==='capital'&&(
                <div>
                  {(()=>{
                    const ca=data.capitalAllocation||{},mktCap=data.profile.marketCap||1;
                    const dy=(ca.dividendYield||0)*100,by=(ca.buybackYield||0)*100,tr=dy+by;
                    const dp=ca.dividendsPaid||0,bb=ca.shareRepurchase||0,tot=dp+bb;
                    return(<div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {[{label:'Dividend Yield',value:dy.toFixed(2)+'%',color:'var(--green)'},{label:'Buyback Yield',value:by.toFixed(2)+'%',color:'var(--accent)'},{label:'Total Yield',value:tr.toFixed(2)+'%',color:'var(--amber)',hi:true},{label:'Payout Ratio',value:ca.payoutRatio?(ca.payoutRatio*100).toFixed(1)+'%':'—',color:'var(--text-primary)'}].map(item=>(
                          <div key={item.label} className="rounded-xl p-3" style={{background:item.hi?'var(--amber-bg)':'var(--bg-subtle)',border:`1px solid ${item.hi?'var(--amber)':'var(--border)'}`}}>
                            <div className="text-xs mb-1" style={C.m}>{item.label}</div>
                            <div className="text-xl font-black num" style={{color:item.color}}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl p-4" style={{background:'var(--accent-subtle)',border:'1px solid var(--accent)'}}>
                        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={C.accent}>💡 Insight</div>
                        <div className="text-sm" style={C.s}>{tr>5?`${data.profile.ticker} returns ${tr.toFixed(1)}% annually — strong capital return story`:tr>2?`${data.profile.ticker} maintains moderate ${tr.toFixed(1)}% total yield`:`${data.profile.ticker} prioritizes reinvestment`}</div>
                      </div>
                    </div>);
                  })()}
                </div>
              )}

              {tab==='forward'&&<ForwardView estimates={data.estimates} history={data.history} price={data.profile.price} shares={data.profile.shares} netDebt={data.financials.netDebt}/>}
              {tab==='market'&&(<div><MarketExpectations data={data} dcfParams={dcfP}/><div className="mt-4"><ThesisTriggers data={data} dcfParams={dcfP} scoreData={scoreData}/></div></div>)}
              {tab==='drivers'&&<BusinessDrivers data={data}/>}
              {tab==='peers'&&<PeerComparison ticker={data.profile.ticker} sector={data.profile.sector} currentPE={data.multiples.pe} currentEVEbitda={data.multiples.evEbitda} currentPS={data.multiples.ps} currentPB={data.multiples.pb} currentLogo={data.profile.logo} currentName={data.profile.name} currentNetMargin={data.financials.netMargin} currentRevGrowth={(()=>{const h=data.history?.filter(r=>r.revenue&&r.revenue>0);if(!h||h.length<2)return null;return((h[h.length-1].revenue/h[0].revenue)**(1/(h.length-1))-1)*100;})()}/>}
              {tab==='thesis'&&<ThesisTab data={data} scoreData={scoreData} dcf={dcf} dcfParams={dcfP}/>}
              {tab==='ai'&&<AIAnalysis data={data} dcfParams={dcfP}/>}
              {tab==='links'&&(
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest mb-3" style={C.m}>Official Reports & Documents</div>
                  <div className="flex flex-col gap-2">
                    {data.links?.map((l,i)=>(<a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl transition-all" style={{border:'1px solid var(--border)',background:'var(--bg-card)'}}><span className="text-sm font-medium" style={C.p}>{l.label}</span><span className="text-xs font-semibold" style={C.accent}>↗</span></a>))}
                  </div>
                </div>
              )}

            </div>
          </div>

          <div className="flex gap-3 pb-6">
            <button onClick={exportExcel} className="btn-brand h-10 px-4 sm:px-6 text-sm">⬇ Export Excel</button>
          </div>
        </>)}
      </div>
    </div>
  );
}
