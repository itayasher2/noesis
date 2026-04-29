const express = require('express');
const router = express.Router();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'tradingview-api1.p.rapidapi.com';

// All S&P 500 + NASDAQ major stocks
const STOCKS = [
  // Technology
  'AAPL','MSFT','NVDA','AMZN','GOOGL','GOOG','META','TSLA','AVGO','AMD',
  'INTC','QCOM','ADBE','CRM','ORCL','TXN','NOW','PLTR','SNOW','MU',
  'AMAT','LRCX','KLAC','MRVL','PANW','CRWD','FTNT','DDOG','ZS','NET',
  'TEAM','WDAY','VEEV','ANSS','CDNS','SNPS','ROP','MPWR','ENPH','FSLR',
  // Finance
  'JPM','BAC','WFC','GS','MS','V','MA','AXP','BLK','SCHW',
  'C','USB','PNC','COF','TFC','BK','STT','ICE','CME','SPGI',
  'MCO','AON','MMC','AJG','WTW','CB','PGR','ALL','TRV','MET',
  // Healthcare
  'LLY','JNJ','UNH','PFE','ABBV','MRK','TMO','ABT','AMGN','GILD',
  'CVS','MDT','BMY','ISRG','SYK','BSX','EW','ZBH','BAX','BDX',
  'IQV','CRL','IQVIA','IDXX','ALGN','HOLX','DGX','LH','MTD','WAT',
  // Consumer
  'WMT','COST','HD','MCD','NKE','SBUX','DIS','NFLX','CMCSA','PG',
  'KO','PEP','PM','MO','CL','EL','KMB','GIS','CPB','SJM',
  'TGT','LOW','ROST','TJX','BURL','DG','DLTR','EBAY','ETSY','W',
  // Energy
  'XOM','CVX','COP','SLB','OXY','PXD','MPC','PSX','EOG','KMI',
  'WMB','ET','EPD','MPLX','HAL','BKR','DVN','FANG','APA','MRO',
  // Industrials
  'CAT','DE','HON','MMM','GE','RTX','LMT','NOC','GD','BA',
  'UPS','FDX','CSX','UNP','NSC','WM','RSG','GWW','EMR','ETN',
  // Crypto-related
  'COIN','MSTR','MARA','RIOT','HUT','CLSK','BTBT',
];

// Fetch quotes in batches of 10
async function fetchBatch(symbols) {
  const formatted = symbols.map(s => `NASDAQ:${s}`).join(',');
  const res = await fetch(`https://${RAPIDAPI_HOST}/api/quote?symbols=${formatted}`, {
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': RAPIDAPI_HOST,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`TradingView API error: ${res.status}`);
  return res.json();
}

// GET /api/market/heatmap
router.get('/heatmap', async (req, res) => {
  try {
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < STOCKS.length; i += batchSize) {
      batches.push(STOCKS.slice(i, i + batchSize));
    }

    const results = await Promise.allSettled(batches.map(fetchBatch));

    const data = [];
    results.forEach(result => {
      if (result.status !== 'fulfilled') return;
      const arr = Array.isArray(result.value)
        ? result.value
        : result.value?.data || result.value?.quotes || Object.values(result.value);

      arr.forEach(q => {
        const sym = (q.symbol || q.name || '').split(':').pop();
        if (!sym) return;
        data.push({
          symbol: sym,
          price: parseFloat(q.price || q.close || q.last_price || 0),
          change: parseFloat(q.change_percent || q.changesPercentage || 0),
          changeAbs: parseFloat(q.change || q.change_abs || 0),
          open: parseFloat(q.open || 0),
          high: parseFloat(q.high || 0),
          low: parseFloat(q.low || 0),
          volume: parseFloat(q.volume || 0),
          marketCap: parseFloat(q.market_cap || q.marketCap || 0),
        });
      });
    });

    res.json({ data, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Market heatmap error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/quote/:ticker  — single stock
router.get('/quote/:ticker', async (req, res) => {
  try {
    const symbol = req.params.ticker.toUpperCase();
    const result = await fetchBatch([symbol]);
    const arr = Array.isArray(result) ? result : (result?.data || Object.values(result));
    const q = arr[0];
    if (!q) return res.status(404).json({ error: 'Symbol not found' });

    res.json({
      symbol,
      price: parseFloat(q.price || q.close || 0),
      change: parseFloat(q.change_percent || q.changesPercentage || 0),
      changeAbs: parseFloat(q.change || 0),
      open: parseFloat(q.open || 0),
      high: parseFloat(q.high || 0),
      low: parseFloat(q.low || 0),
      volume: parseFloat(q.volume || 0),
      marketCap: parseFloat(q.market_cap || q.marketCap || 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
