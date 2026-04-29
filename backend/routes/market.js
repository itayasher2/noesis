const express = require('express');
const router = express.Router();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'tradingview-api1.p.rapidapi.com';

const STOCKS = [
  'AAPL','MSFT','NVDA','AMZN','GOOGL','META','TSLA','AVGO','AMD','INTC',
  'QCOM','ADBE','CRM','ORCL','TXN','NOW','PLTR','SNOW','AMAT','MRVL',
  'PANW','CRWD','NET','DDOG','ZS','TEAM','WDAY','JPM','BAC','WFC',
  'GS','MS','V','MA','AXP','BLK','SCHW','C','USB','PNC',
  'COF','ICE','CME','SPGI','MCO','CB','PGR','TRV','MET','ALL',
  'LLY','JNJ','UNH','PFE','ABBV','MRK','TMO','ABT','AMGN','GILD',
  'CVS','MDT','BMY','ISRG','SYK','BSX','IDXX','WMT','COST','HD',
  'MCD','NKE','SBUX','DIS','NFLX','CMCSA','PG','KO','PEP','PM',
  'TGT','LOW','ROST','TJX','DG','DLTR','XOM','CVX','COP','SLB',
  'OXY','MPC','PSX','EOG','KMI','HAL','DVN','CAT','DE','HON',
  'GE','RTX','LMT','NOC','GD','BA','UPS','FDX','UNP','NSC',
  'EMR','ETN','COIN','MSTR','MARA','RIOT','HUT',
];

router.get('/heatmap', async (req, res) => {
  try {
    const results = await Promise.allSettled(
      STOCKS.map(async (sym) => {
        const r = await fetch(
          `https://${RAPIDAPI_HOST}/api/market-data?symbol=NASDAQ:${sym}`,
          {
            headers: {
              'x-rapidapi-key': RAPIDAPI_KEY,
              'x-rapidapi-host': RAPIDAPI_HOST,
              'Content-Type': 'application/json',
            },
          }
        );
        const d = await r.json();
        return {
          symbol: sym,
          price: parseFloat(d['price_52_week_high'] || 0),
          change: parseFloat(d['Perf.W'] || 0),
          changeAbs: 0,
          open: 0,
          high: parseFloat(d['High.1M'] || 0),
          low: parseFloat(d['Low.1M'] || 0),
          volume: parseFloat(d['average_volume_10d_calc'] || 0),
          marketCap: 0,
        };
      })
    );

    const data = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    res.json({ data, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Market heatmap error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
