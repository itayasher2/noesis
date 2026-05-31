import { createContext, useContext, useState } from 'react';

/* ── Translations ── */
const en = {
  // Branding
  tagline: 'Understand Value. Act Smarter.',

  // Search / Header
  searchPlaceholder: 'Search ticker…   AAPL · TSLA · MSFT · NVDA',
  analyzeCta: 'Analyze ▶',
  analyzing: '⟳',
  noDataError: 'No data found. Please check the ticker.',
  exportExcel: '⬇ Export Excel',
  advanced: '⚙ Advanced',
  less: '▲ Less',

  // User menu
  account: 'Account',
  accountSub: 'Profile',
  subscription: 'Subscription',
  subscriptionSub: 'Pro · monthly',
  notifications: 'Notifications',
  notificationsSub: 'Alerts',
  settings: 'Settings',
  settingsSub: 'Preferences',
  usage: 'Usage',
  usageSub: 'API · limits',
  help: 'Help',
  helpSub: 'Docs · contact',
  lightMode: 'Light Mode',
  darkMode: 'Dark Mode',
  switchAppearance: 'Switch appearance',
  proPlan: 'PRO PLAN',
  signOut: 'Sign out',
  signOutSub: 'Log out of Noesis',

  // Main tabs
  tabOverview: 'Overview',
  tabValuation: 'Valuation',
  tabFinancials: 'Financials',
  tabAnalysis: 'Analysis',
  tabDocs: 'Documents',

  // Advanced tabs
  tabGordon: 'Gordon Model',
  tabRI: 'Value Models',
  tabCapital: 'Capital Alloc.',
  tabForward: 'Forward View',
  tabMarket: 'Market Exp.',
  tabPeers: 'Peers',

  // KPI strip
  fairValue: 'Fair Value',
  impliedDelta: 'Implied Δ',
  dcfBaseCase: 'DCF · BASE CASE',
  upside: 'UPSIDE',
  downside: 'DOWNSIDE',
  fcfTTM: 'FCF · TTM',
  confidence: 'Confidence',
  margin: 'MARGIN',
  models: 'MODELS',

  // Market warning
  marketImplies: 'Market implies',
  fcfGrowthVs: '% FCF growth vs',
  historical: '% historical — significant gap',

  // Overview tab
  profitability: 'Profitability',
  balanceSheet: 'Balance Sheet',
  revenue: 'Revenue',
  ebitda: 'EBITDA',
  netIncome: 'Net Income',
  fcf: 'FCF',
  grossMargin: 'Gross Margin',
  ebitdaMargin: 'EBITDA Margin',
  netMargin: 'Net Margin',
  fcfMargin: 'FCF Margin',
  totalAssets: 'Total Assets',
  equity: 'Equity',
  totalDebt: 'Total Debt',
  cash: 'Cash',
  netDebt: 'Net Debt',
  roe: 'ROE',
  roic: 'ROIC',
  deRatio: 'D/E',
  takeaway: 'Takeaway',
  annual: 'Annual',
  quarterly: 'Quarterly',
  loadingQuarterly: '⟳ Loading...',
  metric: 'Metric',

  // Financials takeaway
  highGrowth: 'High-growth: {0}% revenue CAGR',
  moderateGrowth: 'Moderate: {0}% CAGR',
  matureGrowth: 'Mature: {0}% CAGR',
  stableBusiness: 'Stable business',

  // Valuation tab
  keyMultiples: 'Key Multiples',
  multiple: 'Multiple',
  current: 'Current',
  vsMarket: 'vs Market',
  analystTarget: 'Analyst Target:',
  analysts: 'analysts',

  // Gordon tab
  gordonModel: 'Gordon Model',
  gordonNoDiv: 'No dividend — Gordon model not applicable',
  gordonSuggestsOver: 'Model suggests overvaluation',
  gordonSuggests: 'Model suggests fair or undervaluation',
  requiredReturn: 'Required Return (%)',
  dividendGrowth: 'Dividend Growth (%)',
  vsMarketLc: 'vs market',
  gordonNoApply: 'No dividend — model not applicable.',

  // RI tab
  costOfEquity: 'Cost of Equity (%)',
  growthRate: 'Growth Rate (%)',
  bvShare: 'BV/Share',
  costOfEq: 'Cost of Eq',
  riFairValue: 'Residual Income Fair Value',
  insufficientData: 'Insufficient data',
  grahamNumber: 'Graham Number',

  // Capital tab
  dividendYield: 'Dividend Yield',
  buybackYield: 'Buyback Yield',
  totalYield: 'Total Yield',
  payoutRatio: 'Payout Ratio',
  insight: '💡 Insight',
  capitalStrongReturn: '{0} returns {1}% annually — strong capital return story',
  capitalModerate: 'Moderate {0}% total yield',
  capitalReinvest: '{0} prioritizes reinvestment',

  // Documents tab
  officialDocs: 'Official Reports & Documents',

  // Login
  signIn: 'Sign in',
  signInCta: 'Sign in →',
  signingIn: '⟳ Signing in…',
  enterCredentials: 'Enter credentials to access Noesis',
  username: 'Username',
  password: 'Password',
  invalidCredentials: 'Invalid username or password',
  equityPlatform: 'NOESIS · EQUITY VALUATION PLATFORM',

  // HeroSection
  live: 'LIVE',
  prevClose: 'PREV CLOSE',
  today: 'TODAY',
  mktCap: 'MKT CAP',
  marketClosed: 'Market Closed',
  confidenceBadge: 'Confidence',
  vsFairValue: 'vs Fair Value',
  style: 'Style',
  keyInsightAI: 'Key insight · AI',
  employees: 'K employees',

  // ThesisTab
  investmentMemo: 'Investment Memo',
  generateMemoDesc: 'Generate a professional investment memo for {0} — thesis, bull & bear case, valuation assessment, and key risks.',
  generateMemoCta: '⚡ Generate Investment Memo',
  generatingMemo: '⟳ Generating...',
  analyzingTicker: '⟳ Analyzing {0}...',
  investmentThesis: 'Investment Thesis',
  businessQuality: 'Business Quality',
  bullCase: '🟢 Bull Case',
  bearCase: '🔴 Bear Case',
  valuationAssessment: 'Valuation Assessment',
  keyRisks: '⚠ Key Risks',
  catalysts: '⚡ Catalysts',
  whatChangesView: '🔄 What Changes Our View',
  bottomLine: 'Bottom Line',
  regenerate: '↺ Regenerate',
  aiDisclaimer: 'AI-generated analysis based on financial data. Not investment advice.',
  target: 'Target:',
  score: 'Score:',

  // AIAnalysis
  aiEquityAnalysis: 'AI Equity Analysis',
  aiAnalysisDesc: 'Generate a professional analyst report including Investment Thesis, Quality Score, Red Flags, and Smart Insights.',
  generateAnalysis: 'Generate Analysis ▶',
  regenerateAnalysis: 'Regenerate Analysis ↺',
  analyzingCompany: 'Analyzing {0}…',
  failedAnalysis: 'Failed to generate analysis. Please try again.',
  tryAgain: 'Try again',
  valueDrivers: 'Value Drivers',
  growthStage: 'Growth Stage',
  qualityScore: 'Quality Score',
  growth: 'Growth',
  risk: 'Risk',
  redFlagsRisks: '⚠ Red Flags & Risks',
  capitalAllocation: 'Capital Allocation',
  fcfConsistency: 'FCF Consistency',
  fcfStability: 'Free Cash Flow Stability',
  sectorContext: 'Sector Context',
  smartInsight: '💡 Smart Insight',

  // BusinessDrivers
  businessDrivers: 'Business Drivers',
  keyValueDriversFor: 'Key value drivers for',
  refresh: '↺ Refresh',
  growthDrivers: 'Growth Drivers',
  risksHeadwinds: 'Risks / Headwinds',
  highMagnitude: 'High Magnitude',
  magnitude: 'Magnitude:',
  aiPoweredBased: '⚡ AI-powered · based on',
  financialDataYears: 'Y financial data',
  failedLoad: 'Failed to load. Please try again.',
  retry: 'Retry',

  // PeerComparison
  peerComparison: 'Peer Comparison',
  loadingPeers: 'Loading peer data...',
  peerAvg: 'Peer Avg',
  pe: 'P/E',
  evEbitda: 'EV/EBITDA',
  ps: 'P/S',
  pb: 'P/B',
  netMarginCol: 'Net Margin',
  revGrowth: 'Rev Growth',
  takeawayPeer: 'Peer Takeaway',
  cheapVsPeers: 'trades cheaper than peers on most multiples',
  expensiveVsPeers: 'trades at a premium vs peers',
  inLinePeers: 'is in line with peer group valuations',
};

const he = {
  // Branding
  tagline: 'הבן ערך. פעל חכם יותר.',

  // Search / Header
  searchPlaceholder: 'חפש מניה...   AAPL · TSLA · MSFT · NVDA',
  analyzeCta: 'נתח ▶',
  analyzing: '⟳',
  noDataError: 'לא נמצאו נתונים. בדוק את הסימול.',
  exportExcel: '⬇ ייצוא Excel',
  advanced: '⚙ מתקדם',
  less: '▲ פחות',

  // User menu
  account: 'חשבון',
  accountSub: 'פרופיל',
  subscription: 'מנוי',
  subscriptionSub: 'פרו · חודשי',
  notifications: 'התראות',
  notificationsSub: 'עדכונים',
  settings: 'הגדרות',
  settingsSub: 'העדפות',
  usage: 'שימוש',
  usageSub: 'API · מגבלות',
  help: 'עזרה',
  helpSub: 'תיעוד · יצירת קשר',
  lightMode: 'מצב בהיר',
  darkMode: 'מצב כהה',
  switchAppearance: 'שנה מראה',
  proPlan: 'תוכנית פרו',
  signOut: 'יציאה',
  signOutSub: 'התנתק מ-Noesis',

  // Main tabs
  tabOverview: 'סקירה',
  tabValuation: 'שווי',
  tabFinancials: 'פיננסים',
  tabAnalysis: 'ניתוח',
  tabDocs: 'מסמכים',

  // Advanced tabs
  tabGordon: 'מודל גורדון',
  tabRI: 'מודלי ערך',
  tabCapital: 'הקצאת הון',
  tabForward: 'מבט קדימה',
  tabMarket: 'ציפיות שוק',
  tabPeers: 'חברות דומות',

  // KPI strip
  fairValue: 'שווי הוגן',
  impliedDelta: 'שינוי משתמע',
  dcfBaseCase: 'DCF · בסיס',
  upside: 'פוטנציאל',
  downside: 'חשיפה שלילית',
  fcfTTM: 'FCF · שנה אחרונה',
  confidence: 'ביטחון',
  margin: 'שולי רווח',
  models: 'מודלים',

  // Market warning
  marketImplies: 'השוק מניח',
  fcfGrowthVs: '% צמיחת FCF מול',
  historical: '% היסטורי — פער משמעותי',

  // Overview tab
  profitability: 'רווחיות',
  balanceSheet: 'מאזן',
  revenue: 'הכנסות',
  ebitda: 'EBITDA',
  netIncome: 'רווח נקי',
  fcf: 'FCF',
  grossMargin: 'שולי רווח גולמי',
  ebitdaMargin: 'שולי EBITDA',
  netMargin: 'שולי רווח נקי',
  fcfMargin: 'שולי FCF',
  totalAssets: 'סה"כ נכסים',
  equity: 'הון עצמי',
  totalDebt: 'חוב כולל',
  cash: 'מזומן',
  netDebt: 'חוב נטו',
  roe: 'ROE',
  roic: 'ROIC',
  deRatio: 'D/E',
  takeaway: 'עיקרי הדברים',
  annual: 'שנתי',
  quarterly: 'רבעוני',
  loadingQuarterly: '⟳ טוען...',
  metric: 'מדד',

  // Financials takeaway
  highGrowth: 'צמיחה גבוהה: {0}% CAGR הכנסות',
  moderateGrowth: 'מתון: {0}% CAGR',
  matureGrowth: 'בוגר: {0}% CAGR',
  stableBusiness: 'עסק יציב',

  // Valuation tab
  keyMultiples: 'מכפילים עיקריים',
  multiple: 'מכפיל',
  current: 'נוכחי',
  vsMarket: 'מול שוק',
  analystTarget: 'יעד אנליסטים:',
  analysts: 'אנליסטים',

  // Gordon tab
  gordonModel: 'מודל גורדון',
  gordonNoDiv: 'אין דיבידנד — מודל גורדון לא רלוונטי',
  gordonSuggestsOver: 'המודל מצביע על הערכת יתר',
  gordonSuggests: 'המודל מצביע על הערכה הוגנת או נמוכה',
  requiredReturn: 'תשואה נדרשת (%)',
  dividendGrowth: 'צמיחת דיבידנד (%)',
  vsMarketLc: 'מול שוק',
  gordonNoApply: 'אין דיבידנד — המודל לא רלוונטי.',

  // RI tab
  costOfEquity: 'עלות הון עצמי (%)',
  growthRate: 'קצב צמיחה (%)',
  bvShare: 'ספרים למניה',
  costOfEq: 'עלות הון',
  riFairValue: 'שווי הוגן — רווח שיורי',
  insufficientData: 'נתונים לא מספיקים',
  grahamNumber: 'מספר גרהאם',

  // Capital tab
  dividendYield: 'תשואת דיבידנד',
  buybackYield: 'תשואת רכישה עצמית',
  totalYield: 'תשואה כוללת',
  payoutRatio: 'יחס חלוקה',
  insight: '💡 תובנה',
  capitalStrongReturn: '{0} מחזירה {1}% שנתית — סיפור חזק של החזר הון',
  capitalModerate: 'תשואה כוללת מתונה של {0}%',
  capitalReinvest: '{0} מעדיפה השקעה מחדש',

  // Documents tab
  officialDocs: 'דוחות ומסמכים רשמיים',

  // Login
  signIn: 'כניסה',
  signInCta: 'כניסה ←',
  signingIn: '⟳ מתחבר…',
  enterCredentials: 'הזן פרטי גישה ל-Noesis',
  username: 'שם משתמש',
  password: 'סיסמה',
  invalidCredentials: 'שם משתמש או סיסמה שגויים',
  equityPlatform: 'NOESIS · פלטפורמת הערכת שווי',

  // HeroSection
  live: 'חי',
  prevClose: 'סגירה קודמת',
  today: 'היום',
  mktCap: 'שווי שוק',
  marketClosed: 'שוק סגור',
  confidenceBadge: 'ביטחון',
  vsFairValue: 'מול שווי הוגן',
  style: 'סגנון',
  keyInsightAI: 'תובנה עיקרית · AI',
  employees: 'K עובדים',

  // ThesisTab
  investmentMemo: 'מזכר השקעה',
  generateMemoDesc: 'צור מזכר השקעה מקצועי עבור {0} — תזה, תרחיש אופטימי ופסימי, הערכת שווי וסיכונים.',
  generateMemoCta: '⚡ צור מזכר השקעה',
  generatingMemo: '⟳ מייצר...',
  analyzingTicker: '⟳ מנתח {0}...',
  investmentThesis: 'תזת השקעה',
  businessQuality: 'איכות עסקית',
  bullCase: '🟢 תרחיש אופטימי',
  bearCase: '🔴 תרחיש פסימי',
  valuationAssessment: 'הערכת שווי',
  keyRisks: '⚠ סיכונים עיקריים',
  catalysts: '⚡ קטליזטורים',
  whatChangesView: '🔄 מה ישנה את ההשקפה',
  bottomLine: 'סיכום',
  regenerate: '↺ יצירה מחדש',
  aiDisclaimer: 'ניתוח שנוצר ע"י AI על בסיס נתונים פיננסיים. לא המלצת השקעה.',
  target: 'יעד:',
  score: 'ציון:',

  // AIAnalysis
  aiEquityAnalysis: 'ניתוח מניות AI',
  aiAnalysisDesc: 'צור דוח אנליסט מקצועי הכולל תזת השקעה, ציון איכות, דגלים אדומים ותובנות חכמות.',
  generateAnalysis: 'צור ניתוח ▶',
  regenerateAnalysis: 'צור ניתוח מחדש ↺',
  analyzingCompany: 'מנתח את {0}…',
  failedAnalysis: 'הניתוח נכשל. נסה שוב.',
  tryAgain: 'נסה שוב',
  valueDrivers: 'מניעי ערך',
  growthStage: 'שלב צמיחה',
  qualityScore: 'ציון איכות',
  growth: 'צמיחה',
  risk: 'סיכון',
  redFlagsRisks: '⚠ דגלים אדומים וסיכונים',
  capitalAllocation: 'הקצאת הון',
  fcfConsistency: 'עקביות FCF',
  fcfStability: 'יציבות תזרים מזומנים חופשי',
  sectorContext: 'הקשר ענפי',
  smartInsight: '💡 תובנה חכמה',

  // BusinessDrivers
  businessDrivers: 'מנועי עסקיים',
  keyValueDriversFor: 'מנועי ערך עיקריים עבור',
  refresh: '↺ רענן',
  growthDrivers: 'מנועי צמיחה',
  risksHeadwinds: 'סיכונים / חסמים',
  highMagnitude: 'עוצמה גבוהה',
  magnitude: 'עוצמה:',
  aiPoweredBased: '⚡ מבוסס AI · על בסיס',
  financialDataYears: 'שנות נתונים פיננסיים',
  failedLoad: 'הטעינה נכשלה. נסה שוב.',
  retry: 'נסה שוב',

  // PeerComparison
  peerComparison: 'השוואת עמיתים',
  loadingPeers: 'טוען נתוני עמיתים...',
  peerAvg: 'ממוצע עמיתים',
  pe: 'P/E',
  evEbitda: 'EV/EBITDA',
  ps: 'P/S',
  pb: 'P/B',
  netMarginCol: 'שולי נקי',
  revGrowth: 'צמיחת הכנסות',
  takeawayPeer: 'מסקנת ההשוואה',
  cheapVsPeers: 'נסחרת בזול יחסית לעמיתים ברוב המכפילים',
  expensiveVsPeers: 'נסחרת בפרמיה מול עמיתים',
  inLinePeers: 'נסחרת בקנה אחד עם הערכות קבוצת העמיתים',
};

/* ── Context ── */
const LangCtx = createContext({ lang: 'en', t: k => k, toggle: () => {}, isHe: false });

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('noesis-lang') || 'en');
  const isHe = lang === 'he';
  const t = (key, ...args) => {
    const str = (isHe ? he[key] : en[key]) ?? key;
    return args.reduce((s, arg, i) => s.replace(`{${i}}`, arg), str);
  };
  const toggle = () => {
    const next = isHe ? 'en' : 'he';
    setLang(next);
    localStorage.setItem('noesis-lang', next);
  };
  return <LangCtx.Provider value={{ lang, t, toggle, isHe }}>{children}</LangCtx.Provider>;
}

export const useLanguage = () => useContext(LangCtx);
