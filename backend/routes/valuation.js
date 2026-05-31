const express = require('express');
const router = express.Router();
const fmp = require('../services/fmp');
const yf = require('yahoo-finance2');
const yahoo = new yf.default({ suppressNotices: ['yahooSurvey'] });
const axios = require('axios');

function safe(arr) { return Array.isArray(arr) ? arr : (arr ? [arr] : []); }
function n(v) { return (v != null && !isNaN(v)) ? Number(v) : null; }

// ✅ POST routes MUST come before GET /:ticker (wildcard)

router.post('/business-drivers', async (req, res) => {
  try {
    const { profile, financials, history, multiples, lang } = req.body;
    const isHe = lang === 'he';

    const revCAGR = history && history.length >= 2
      ? (((history[history.length-1].revenue / history[0].revenue) ** (1/(history.length-1))) - 1) * 100
      : null;

    const prompt = `You are a senior equity analyst. Based on the following data, identify the 5-6 most important business drivers for ${profile.name} (${profile.ticker}).

Company: ${profile.name} (${profile.ticker})
Sector: ${profile.sector} | Industry: ${profile.industry}

Key Financials:
- Revenue: $${(financials.revenue/1e9).toFixed(1)}B | Revenue CAGR (5Y): ${revCAGR != null ? revCAGR.toFixed(1)+'%' : 'N/A'}
- Gross Margin: ${financials.grossMargin?.toFixed(1)}% | EBITDA Margin: ${financials.ebitdaMargin?.toFixed(1)}%
- Net Margin: ${financials.netMargin?.toFixed(1)}% | FCF Margin: ${financials.fcfMargin?.toFixed(1)}%
- ROIC: ${financials.roic?.toFixed(1)}% | Net Debt/EBITDA: ${financials.netDebtEbitda?.toFixed(1)}x
- P/E: ${multiples.pe?.toFixed(1)}x | EV/EBITDA: ${multiples.evEbitda?.toFixed(1)}x

Return ONLY a valid JSON array — no markdown, no backticks, no explanation. Start with [ and end with ].

Each item must have exactly these 8 fields:
[
  {
    "driver": "Short name, max 5 words",
    "description": "One precise sentence on why this matters for ${profile.ticker} specifically",
    "impact": "positive",
    "magnitude": "high",
    "trend": "growing",
    "metric": "Primary metric this affects e.g. Revenue Growth, Gross Margin, FCF Margin",
    "financialLink": "Quantitative link e.g. ~40% of revenue or +150bps margin or $2B annual FCF contribution",
    "valuationImpact": "Primary value driver — core to DCF thesis"
  }
]

Rules:
- impact: exactly one of positive | negative | neutral
- magnitude: exactly one of high | medium | low
- trend: exactly one of growing | stable | declining
- valuationImpact: exactly one of:
    "Primary value driver — core to DCF thesis"
    "Secondary value driver — meaningful multiple support"
    "Supporting driver — margin or risk factor"
    "Risk factor — potential value headwind"
- financialLink must include a number or percentage
- Be specific to ${profile.ticker}, not generic sector commentary${isHe ? `

IMPORTANT: Write the text fields "driver", "description", "metric", "financialLink" in natural, professional Hebrew (עברית) using correct Israeli financial terminology. Keep these exact English enum values unchanged — do NOT translate them: impact (positive/negative/neutral), magnitude (high/medium/low), trend (growing/stable/declining), valuationImpact (use exact strings from the Rules section above).` : ''}`;

    const response = await axios({
      method: 'post',
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      data: {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }
    });

    const text = response.data.content[0].text;
    // Strip any markdown fences and find the JSON array
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array found in response');
    const drivers = JSON.parse(match[0]);
    res.json({ drivers });
  } catch (err) {
    console.error('Business drivers error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/hero-insight', async (req, res) => {
  try {
    const { profile, financials, multiples, scoreData, history, lang } = req.body;
    const isHe = lang === 'he';

    const revCAGR = history && history.length >= 2
      ? (((history[history.length-1].revenue / history[0].revenue) ** (1/(history.length-1))) - 1) * 100
      : null;

    const prompt = `You are a senior equity analyst. Analyze this company and return ONLY a JSON object, no markdown, no backticks.

Company: ${profile.name} (${profile.ticker})
Sector: ${profile.sector}
Industry: ${profile.industry}
Price: $${profile.price}
Market Cap: $${(profile.marketCap/1e9).toFixed(1)}B
Beta: ${profile.beta}

Financials:
- Revenue: $${(financials.revenue/1e9).toFixed(1)}B
- Net Margin: ${financials.netMargin?.toFixed(1)}%
- FCF Margin: ${financials.fcfMargin?.toFixed(1)}%
- ROIC: ${financials.roic?.toFixed(1)}%
- Revenue CAGR: ${revCAGR?.toFixed(1)}%

Valuation:
- P/E: ${multiples.pe?.toFixed(1)}x
- EV/EBITDA: ${multiples.evEbitda?.toFixed(1)}x
- Forward P/E: ${multiples.forwardPE?.toFixed(1)}x
- Implied FCF Growth: ${scoreData?.impliedGrowth?.toFixed(1)}%
- Historical CAGR: ${revCAGR?.toFixed(1)}%
- Investment Score: ${scoreData?.composite}/100
- Verdict: ${scoreData?.rating}

Return this exact JSON structure:
{
  "companyType": "one of: Growth | Mature | Cyclical | Bank | REIT | SaaS | Turnaround | Commodity",
  "keyInsight": "One powerful sentence explaining the core investment thesis or concern. Be specific, use numbers.",
  "whyMarket": "One sentence explaining WHY the market is pricing it this way. What narrative drives the premium or discount?",
  "mainRisk": "The single most important risk to the investment thesis. Be specific.",
  "opportunity": "The single most important potential upside catalyst. Be specific.",
  "verdict": "one of: Strong Opportunity | Attractive | Fairly Valued | High Expectations | Caution | Speculative"
}${isHe ? `

IMPORTANT: Write the text fields "keyInsight", "whyMarket", "mainRisk", "opportunity" in natural, professional Hebrew (עברית) using correct Israeli financial terminology. Keep "companyType" and "verdict" as exact English enum values.` : ''}`;

    const response = await axios({
      method: 'post',
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      data: {
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }
    });

    const text = response.data.content[0].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const insight = JSON.parse(clean);
    res.json(insight);
  } catch (err) {
    console.error('Hero insight error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/thesis', async (req, res) => {
  try {
    const { profile, financials, multiples, scoreData, history, dcf, lang } = req.body;
    const isHe = lang === 'he';

    const revCAGR = history && history.length >= 2
      ? (((history[history.length-1].revenue / history[0].revenue) ** (1/(history.length-1))) - 1) * 100
      : null;

    const prompt = `You are a Managing Director at Goldman Sachs equity research. Write a professional investment memo for ${profile.name} (${profile.ticker}).

Company Data:
- Sector: ${profile.sector} | Industry: ${profile.industry}
- Price: $${profile.price} | Market Cap: $${(profile.marketCap/1e9).toFixed(1)}B
- Revenue: $${(financials.revenue/1e9).toFixed(1)}B | Net Margin: ${financials.netMargin?.toFixed(1)}%
- FCF Margin: ${financials.fcfMargin?.toFixed(1)}% | ROIC: ${financials.roic?.toFixed(1)}%
- Revenue CAGR (5Y): ${revCAGR?.toFixed(1)}% | P/E: ${multiples.pe?.toFixed(1)}x
- EV/EBITDA: ${multiples.evEbitda?.toFixed(1)}x | Forward P/E: ${multiples.forwardPE?.toFixed(1)}x
- EPS: $${multiples.eps?.toFixed(2)} | Dividend Yield: ${((multiples.dividendYield||0)*100).toFixed(2)}%
- Beta: ${profile.beta?.toFixed(2)} | DCF Fair Value: $${dcf?.fv?.toFixed(0) || 'N/A'}
- Implied FCF Growth: ${scoreData?.impliedGrowth?.toFixed(1)}% | Historical CAGR: ${revCAGR?.toFixed(1)}%
- Investment Score: ${scoreData?.composite}/100 | Analyst Target: $${multiples.targetPrice?.toFixed(0) || 'N/A'}
- Analyst Rating: ${multiples.analystRating || 'N/A'} | Analysts: ${multiples.numberOfAnalysts || 'N/A'}

Return ONLY a JSON object, no markdown, no backticks:
{
  "recommendation": "one of: Strong Buy | Buy | Hold | Reduce | Sell",
  "targetPrice": 123,
  "thesis": "3-4 sentences with specific numbers.",
  "businessQuality": "2-3 sentences on moat and capital returns.",
  "bullPoints": ["point 1 with numbers", "point 2", "point 3"],
  "bearPoints": ["point 1", "point 2", "point 3"],
  "valuationAssessment": "2-3 sentences on valuation.",
  "keyRisks": ["risk 1", "risk 2", "risk 3"],
  "catalysts": ["catalyst 1 with timeframe", "catalyst 2"],
  "whatChangesView": "Specific metrics that would change the recommendation.",
  "bottomLine": "One powerful concluding sentence."
}${isHe ? `

IMPORTANT: Write ALL text fields (thesis, businessQuality, bullPoints items, bearPoints items, valuationAssessment, keyRisks items, catalysts items, whatChangesView, bottomLine) in natural, professional Hebrew (עברית) using correct Israeli financial terminology. Keep "recommendation" as one of the exact English values (Strong Buy/Buy/Hold/Reduce/Sell). "targetPrice" stays as a number.` : ''}`;

    const response = await axios({
      method: 'post',
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      data: {
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }
    });

    const text = response.data.content[0].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const thesis = JSON.parse(clean);
    res.json(thesis);
  } catch (err) {
    console.error('Thesis error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai-analysis', async (req, res) => {
  try {
    const { prompt } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const response = await axios({
      method: 'post',
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      data: {
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }
    });
    res.json(response.data);
  } catch (err) {
    console.error('AI error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// ✅ GET routes with wildcards come LAST
router.get('/quarterly/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const [income, cashflow, balance] = await Promise.all([
      fmp.getIncomeQ(ticker),
      fmp.getCashflowQ(ticker),
      fmp.getBalanceQ(ticker),
    ]);
    const histIncome   = safe(income).slice(0,8).reverse();
    const histCashflow = safe(cashflow).slice(0,8).reverse();
    const histBalance  = safe(balance).slice(0,8).reverse();
    const history = histIncome.map((yr, idx) => ({
      year: yr.date ? yr.date.slice(0,7) : null,
      revenue:      n(yr.revenue) || n(yr.totalRevenue),
      grossProfit:  n(yr.grossProfit),
      ebitda:       n(yr.ebitda),
      netIncome:    n(yr.netIncome),
      fcf:          n(histCashflow[idx]?.freeCashFlow),
      capex:        n(histCashflow[idx]?.capitalExpenditure),
      dividends:    Math.abs(n(histCashflow[idx]?.dividendsPaid)||0),
      buybacks:     Math.abs(n(histCashflow[idx]?.commonStockRepurchased)||0),
      grossMargin:  yr.revenue ? (n(yr.grossProfit)||0)/yr.revenue*100 : null,
      ebitdaMargin: yr.revenue ? (n(yr.ebitda)||0)/yr.revenue*100 : null,
      netMargin:    yr.revenue ? (n(yr.netIncome)||0)/yr.revenue*100 : null,
      roe:          histBalance[idx]?.totalStockholdersEquity > 0
                      ? (n(yr.netIncome)||0)/histBalance[idx].totalStockholdersEquity*100 : null,
    }));
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const [profile, income, cashflow, balance, metrics, ratios, yahooData, estimates] =
      await Promise.all([
        fmp.getProfile(ticker),
        fmp.getIncome(ticker),
        fmp.getCashflow(ticker),
        fmp.getBalance(ticker),
        fmp.getMetrics(ticker),
        fmp.getRatios(ticker),
        yahoo.quoteSummary(ticker, {
          modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData', 'price']
        }).catch(() => null),
        axios.get(`https://financialmodelingprep.com/stable/analyst-estimates?symbol=${ticker}&period=annual&apikey=${process.env.FMP_API_KEY}`)
          .then(r => r.data).catch(() => []),
      ]);

    const p  = safe(profile)[0]  || {};
    const i0 = safe(income)[0]   || {};
    const c0 = safe(cashflow)[0] || {};
    const b0 = safe(balance)[0]  || {};
    const m  = safe(metrics)[0]  || {};
    const r0 = safe(ratios)[0]   || {};
    const yd = yahooData || {};

    const price    = n(p.price) || 0;
    const mktCap   = n(p.mktCap) || n(p.marketCap) || 0;
    const shares   = price > 0 && mktCap > 0 ? mktCap / price : n(p.sharesOutstanding) || 1;

    const revenue     = n(i0.revenue) || n(i0.totalRevenue) || 0;
    const ebitda      = n(i0.ebitda) || 0;
    const ebit        = n(i0.operatingIncome) || 0;
    const netIncome   = n(i0.netIncome) || 0;
    const grossProfit = n(i0.grossProfit) || 0;
    const fcf         = n(c0.freeCashFlow) || 0;
    const capex       = n(c0.capitalExpenditure) || 0;
    const ocf         = n(c0.operatingCashFlow) || 0;
    const dividendsPaid = Math.abs(n(c0.dividendsPaid) || n(c0.commonDividendsPaid) || n(c0.netDividendsPaid) || 0);
    const shareRepurchase = Math.abs(n(c0.commonStockRepurchased) || 0);
    const totalDebt   = n(b0.totalDebt) || (n(b0.shortTermDebt)||0) + (n(b0.longTermDebt)||0);
    const cash        = n(b0.cashAndCashEquivalents) || 0;
    const equity      = n(b0.totalStockholdersEquity) || n(b0.totalEquity) || 0;
    const totalAssets = n(b0.totalAssets) || 0;
    const netDebt     = totalDebt - cash;

    const pe         = n(yd.summaryDetail?.trailingPE) || n(m.peRatio);
    const forwardPE  = n(yd.defaultKeyStatistics?.forwardPE);
    const pegRatio   = n(yd.defaultKeyStatistics?.pegRatio);
    const pb         = n(yd.defaultKeyStatistics?.priceToBook) || n(m.pbRatio);
    const ps         = n(yd.summaryDetail?.priceToSalesTrailing12Months) || n(m.priceToSalesRatio);
    const evEbitda   = n(yd.defaultKeyStatistics?.enterpriseToEbitda) || n(m.enterpriseValueOverEBITDA);
    const evRevenue  = n(yd.defaultKeyStatistics?.enterpriseToRevenue);
    const evFcf      = n(m.evToFreeCashFlow);
    const eps        = n(m.netIncomePerShare) || (shares > 0 ? netIncome/shares : null);
    const bvps       = n(m.bookValuePerShare) || (shares > 0 ? equity/shares : null);
    const dps        = n(yd.summaryDetail?.dividendRate) || n(m.dividendPerShare) || 0;
    const dividendYield = n(yd.summaryDetail?.dividendYield) || 0;
    const payoutRatio = n(yd.summaryDetail?.payoutRatio) || (dividendsPaid > 0 && netIncome > 0 ? dividendsPaid/netIncome : null);
    const roe        = equity > 0 ? netIncome/equity : null;
    const roa        = n(m.roa);
    const roic       = n(m.roic);
    const debtEq     = equity > 0 ? totalDebt/equity : null;
    const grahamNumber = (eps && bvps && eps > 0 && bvps > 0) ? Math.sqrt(22.5 * eps * bvps) : null;
    const targetPrice = n(yd.financialData?.targetMeanPrice);
    const analystRating = yd.financialData?.recommendationKey || null;
    const numberOfAnalysts = n(yd.financialData?.numberOfAnalystOpinions);
    const beta = n(yd.summaryDetail?.beta) || n(p.beta);
    const sharesOutstanding = n(yd.defaultKeyStatistics?.sharesOutstanding) || shares;
    const buybackYield = shareRepurchase > 0 && mktCap > 0 ? shareRepurchase / mktCap : null;

    const histIncome   = safe(income).slice(0,5).reverse();
    const histCashflow = safe(cashflow).slice(0,5).reverse();
    const histBalance  = safe(balance).slice(0,5).reverse();

    const history = histIncome.map((yr, idx) => ({
      year:         yr.date ? new Date(yr.date).getFullYear() : null,
      revenue:      n(yr.revenue) || n(yr.totalRevenue),
      grossProfit:  n(yr.grossProfit),
      ebitda:       n(yr.ebitda),
      ebit:         n(yr.operatingIncome),
      netIncome:    n(yr.netIncome),
      eps:          n(yr.eps),
      fcf:          n(histCashflow[idx]?.freeCashFlow),
      ocf:          n(histCashflow[idx]?.operatingCashFlow),
      capex:        n(histCashflow[idx]?.capitalExpenditure),
      dividends:    Math.abs(n(histCashflow[idx]?.dividendsPaid) || n(histCashflow[idx]?.commonDividendsPaid) || n(histCashflow[idx]?.netDividendsPaid) || 0),
      buybacks:     Math.abs(n(histCashflow[idx]?.commonStockRepurchased)||0),
      totalDebt:    n(histBalance[idx]?.totalDebt),
      cash:         n(histBalance[idx]?.cashAndCashEquivalents),
      equity:       n(histBalance[idx]?.totalStockholdersEquity),
      totalAssets:  n(histBalance[idx]?.totalAssets),
      grossMargin:  yr.revenue ? (n(yr.grossProfit)||0)/yr.revenue*100 : null,
      ebitdaMargin: yr.revenue ? (n(yr.ebitda)||0)/yr.revenue*100 : null,
      netMargin:    yr.revenue ? (n(yr.netIncome)||0)/yr.revenue*100 : null,
      roe:          histBalance[idx]?.totalStockholdersEquity > 0
                      ? (n(yr.netIncome)||0)/histBalance[idx].totalStockholdersEquity*100 : null,
    }));

    const links = [
      { label: '10-K Annual Report (SEC)', url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker}&type=10-K&dateb=&owner=include&count=5` },
      { label: '10-Q Quarterly Report (SEC)', url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker}&type=10-Q&dateb=&owner=include&count=8` },
      { label: 'SEC EDGAR', url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker}&type=&dateb=&owner=include&count=20` },
      { label: 'Earnings Calls — Seeking Alpha', url: `https://seekingalpha.com/symbol/${ticker}/earnings` },
      { label: 'Earnings Transcripts — Motley Fool', url: `https://www.fool.com/earnings-call-transcripts/?search=${ticker}` },
      { label: 'IR Website', url: p.website || `https://www.google.com/search?q=${ticker}+investor+relations` },
    ];

    res.json({
      profile: {
        name: p.companyName || p.name,
        ticker: p.symbol || ticker,
        exchange: p.exchangeShortName || p.exchange,
        sector: p.sector,
        industry: p.industry,
        currency: p.currency || 'USD',
        country: p.country,
        employees: n(p.fullTimeEmployees),
        description: p.description,
        website: p.website,
        logo: p.image,
        price, change: n(p.changes)||n(p.change),
        changePct: n(p.changesPercentage)||n(p.changePercentage),
        marketCap: mktCap, shares: sharesOutstanding, beta,
      },
      multiples: {
        pe, forwardPE, pegRatio, pb, ps, evEbitda, evRevenue, evFcf,
        eps, bvps, dps, dividendYield, roe, roa, roic,
        debtEq, payoutRatio, targetPrice, analystRating, numberOfAnalysts,
      },
      capitalAllocation: {
        dividendYield,
        dividendRate: dps,
        dividendsPaid,
        shareRepurchase,
        buybackYield,
        payoutRatio,
        totalReturn: (dividendsPaid + shareRepurchase) > 0 && mktCap > 0
          ? (dividendsPaid + shareRepurchase) / mktCap : null,
      },
      financials: {
        revenue, ebitda, ebit, netIncome, grossProfit,
        fcf, capex, ocf, dividends: dividendsPaid, shareRepurchase,
        totalDebt, cash, netDebt, equity, totalAssets,
        grossMargin:  revenue > 0 ? grossProfit/revenue*100 : null,
        ebitdaMargin: revenue > 0 ? ebitda/revenue*100 : null,
        ebitMargin:   revenue > 0 ? ebit/revenue*100 : null,
        netMargin:    revenue > 0 ? netIncome/revenue*100 : null,
        fcfMargin:    revenue > 0 ? fcf/revenue*100 : null,
        roe: roe ? roe*100 : null,
        roa: roa ? roa*100 : null,
        roic: roic ? roic*100 : null,
        debtToEquity: debtEq,
        netDebtEbitda: ebitda > 0 ? netDebt/ebitda : null,
        currentRatio: n(r0.currentRatio),
        quickRatio: n(r0.quickRatio),
        interestCoverage: n(r0.interestCoverage),
      },
      valuation: { grahamNumber, pe, pb, ps, evEbitda, evFcf, ev: mktCap + netDebt },
      history,
      estimates: safe(estimates).slice(0,4).map(e => ({
        date: e.date,
        revenueAvg: n(e.revenueAvg),
        revenueLow: n(e.revenueLow),
        revenueHigh: n(e.revenueHigh),
        ebitdaAvg: n(e.ebitdaAvg),
        netIncomeAvg: n(e.netIncomeAvg),
        netIncomeLow: n(e.netIncomeLow),
        netIncomeHigh: n(e.netIncomeHigh),
        epsAvg: n(e.epsAvg),
        epsLow: n(e.epsLow),
        epsHigh: n(e.epsHigh),
      })),
      earnings: [],
      links,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
