const axios = require('axios');
require('dotenv').config();
const BASE = 'https://financialmodelingprep.com/stable';
const KEY = process.env.FMP_API_KEY;
const get = async (endpoint) => {
  const sep = endpoint.includes('?') ? '&' : '?';
  const url = `${BASE}${endpoint}${sep}apikey=${KEY}`;
  const res = await axios.get(url);
  return res.data;
};
module.exports = {
  getProfile:    (t) => get(`/profile?symbol=${t}`),
  getIncome:     (t) => get(`/income-statement?symbol=${t}&limit=5`),
  getCashflow:   (t) => get(`/cash-flow-statement?symbol=${t}&limit=5`),
  getBalance:    (t) => get(`/balance-sheet-statement?symbol=${t}&limit=5`),
  getMetrics:    (t) => get(`/key-metrics?symbol=${t}&limit=1`),
  getMetricsTTM: (t) => get(`/key-metrics-ttm?symbol=${t}`),
  getRatios:     (t) => get(`/ratios?symbol=${t}&limit=1`),
  getEarnings:   (t) => get(`/earnings-surprises?symbol=${t}&limit=8`),
  search:        (q) => get(`/search?query=${q}&limit=10`),
  getPriceHistory: (t, days) => get(`/historical-price-eod/full?symbol=${t}&limit=${days}`),
  getIncomeQ:    (t) => get(`/income-statement?symbol=${t}&period=quarter&limit=8`),
  getCashflowQ:  (t) => get(`/cash-flow-statement?symbol=${t}&period=quarter&limit=8`),
  getBalanceQ:   (t) => get(`/balance-sheet-statement?symbol=${t}&period=quarter&limit=8`),
};
