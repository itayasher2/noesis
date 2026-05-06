const express = require('express');
const router = express.Router();
const fmp = require('../services/fmp');
const yf = require('yahoo-finance2');
const yahoo = new yf.default({ suppressNotices: ['yahooSurvey'] });
const axios = require('axios');

function safe(arr) { return Array.isArray(arr) ? arr : (arr ? [arr] : []); }
function n(v) { return (v != null && !isNaN(v)) ? Number(v) : null; }

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

router.post('/business-drivers', async (req, res) => {
  try {
    const { profile, financials, history, multiples } = req.body;

    const prompt = `You are a senior equity analyst. Based on the following company data, identify the 4-6 key business drivers.

Company: ${profile.name} (${profile.ticker})
Sector: ${profile.sector}
Industry: ${profile.industry}

Financials:
- Revenue: $${(financials.revenue/1e9).toFixed(1)}B
- Net Margin: ${financials.netMargin?.toFixed(1)}%
- FCF Margin: ${financials.fcfMargin?.toFixed(1)}%
- ROIC: ${financials.roic?.toFixed(1)}%
- Revenue CAGR (5Y): ${history.length >= 2 ? (((history[history.length-1].revenue/history[0].revenue)**(1/(history.length-1))-1)*100).toFixed(1) : 'N/A'}%

Multiples: P/E ${multiples.pe?.toFixed(1)}x, EV/EBITDA ${multiples.evEbitda?.toFixed(1)}x

IMPORTANT: Return ONLY a raw JSON array. No markdown. No backticks. No explanation. Just the JSON array starting with [ and ending with ].

Each object MUST have ALL 8 of these fields:
[
  {
    "driver": "Short driver name (max 4 words)",
    "description": "One sentence explanation of why this matters for the company",
    "impact": "positive",
    "magnitude": "high",
    "trend": "growing",
    "metric": "The main financial metric affected e.g. Revenue Growth or Gross Margin or FCF",
    "financialLink": "Specific quantitative impact e.g. ~30% of total revenue or +2-3% margin contribution or 200bps headwind",
    "valuationImpact": "Primary value driver — core to DCF thesis"
  }
]

impact must be exactly one of: positive, negative, neutral
magnitude must be exactly one of: high, medium, low
trend must be exactly one of: growing, stable, declining
financialLink must include specific numbers or percentages.
valuationImpact must be EXACTLY one of these 4 options — do not change the wording:
  "Primary value driver — core to DCF thesis"
  "Secondary value driver — meaningful multiple support"
  "Supporting driver — margin or risk factor"
  "Risk factor — potential value headwind"
ALL 8 fields are REQUIRED. If any field is missing the response is invalid.`;

    const response = await axios({
      method: 'post',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }
    });

    const text = response.data.choices[0].message.content;
    const drivers = JSON.parse(text);
    res.json({ drivers });
  } catch (err) {
    console.error('Business drivers error:', err.response?.data || err.message);
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
module.exports = router;
