const express = require('express');
const router = express.Router();
const fmp = require('../services/fmp');
const yf = require('yahoo-finance2');
const yahoo = new yf.default({ suppressNotices: ['yahooSurvey'] });

router.get('/profile/:ticker', async (req, res) => {
  try {
    const data = await fmp.getProfile(req.params.ticker);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/financials/:ticker', async (req, res) => {
  try {
    const [income, cashflow, balance, metrics] = await Promise.all([
      fmp.getIncome(req.params.ticker),
      fmp.getCashflow(req.params.ticker),
      fmp.getBalance(req.params.ticker),
      fmp.getMetrics(req.params.ticker)
    ]);
    res.json({ income, cashflow, balance, metrics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/search/:query', async (req, res) => {
  try {
    const data = await fmp.search(req.params.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const days = parseInt(req.query.days) || 365;
    const endDate = new Date();
    const startDate = new Date();
    if (days >= 9000) {
      startDate.setFullYear(startDate.getFullYear() - 30);
    } else {
      startDate.setDate(startDate.getDate() - days);
    }
    const result = await yahoo.chart(ticker, {
      period1: startDate.toISOString().split('T')[0],
      period2: endDate.toISOString().split('T')[0],
      interval: days <= 7 ? '1h' : '1d',
    });
    const quotes = result?.quotes || [];
    const data = quotes
      .filter(q => q && q.close != null)
      .map(q => ({
        date: new Date(q.date).toISOString().split('T')[0],
        open:   q.open   ? +q.open.toFixed(2)   : null,
        high:   q.high   ? +q.high.toFixed(2)   : null,
        low:    q.low    ? +q.low.toFixed(2)    : null,
        close:  q.close  ? +q.close.toFixed(2)  : null,
        volume: q.volume || 0,
      }));
    res.json(data);
  } catch (err) {
    console.error('History error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/yahoo/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const result = await yahoo.quoteSummary(ticker, {
      modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData', 'price']
    });
    res.json({
      pe:      result.summaryDetail?.trailingPE,
      forwardPE: result.defaultKeyStatistics?.forwardPE,
      evEbitda: result.defaultKeyStatistics?.enterpriseToEbitda,
      ps:      result.summaryDetail?.priceToSalesTrailing12Months,
      pb:      result.defaultKeyStatistics?.priceToBook,
      evRevenue: result.defaultKeyStatistics?.enterpriseToRevenue,
      shortRatio: result.defaultKeyStatistics?.shortRatio,
      beta:    result.summaryDetail?.beta,
      targetPrice: result.financialData?.targetMeanPrice,
      analystRating: result.financialData?.recommendationKey,
      numberOfAnalysts: result.financialData?.numberOfAnalystOpinions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;