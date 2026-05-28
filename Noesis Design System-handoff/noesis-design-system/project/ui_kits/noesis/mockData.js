// Mock data shaped exactly like the Noesis API response.
// Used by index.html to demo the full app without a backend.

window.NOESIS_MOCK = {
  AAPL: {
    profile: {
      ticker: 'AAPL', name: 'Apple Inc.', sector: 'Consumer Tech',
      industry: 'Consumer Electronics', exchange: 'NASDAQ',
      country: 'USA', employees: 154000, shares: 15_204_000_000,
      price: 184.32, changePct: 1.42, marketCap: 2_800_000_000_000,
      beta: 1.21,
      logo: 'https://logo.clearbit.com/apple.com',
    },
    financials: {
      revenue: 383_285_000_000, ebitda: 130_109_000_000,
      netIncome: 99_803_000_000, fcf: 96_995_000_000,
      grossMargin: 44.1, ebitdaMargin: 34.0, netMargin: 26.0, fcfMargin: 25.3,
      totalAssets: 364_980_000_000, equity: 62_146_000_000,
      totalDebt: 109_280_000_000, cash: 61_555_000_000, netDebt: 47_725_000_000,
      roe: 160.6, roic: 56.8, debtToEquity: 1.76,
      netDebtEbitda: 0.37,
    },
    multiples: {
      pe: 28.1, forwardPE: 26.8, evEbitda: 21.9,
      ps: 7.3, pb: 45.1, evFcf: 28.9, dps: 0.96, bvps: 4.09,
      eps: 6.56, targetPrice: 215.50,
      analystRating: 'Buy', numberOfAnalysts: 42,
    },
    valuation: { grahamNumber: 24.6 },
    capitalAllocation: {
      dividendYield: 0.0052, buybackYield: 0.039,
      payoutRatio: 0.146, dividendsPaid: 15_000_000_000,
      shareRepurchase: 84_000_000_000,
    },
    history: [
      { year: 2019, revenue: 260_174e6, ebitda: 81_860e6, netIncome: 55_256e6, fcf: 58_896e6, grossMargin: 37.8, netMargin: 21.2 },
      { year: 2020, revenue: 274_515e6, ebitda: 81_220e6, netIncome: 57_411e6, fcf: 73_365e6, grossMargin: 38.2, netMargin: 20.9 },
      { year: 2021, revenue: 365_817e6, ebitda: 123_136e6, netIncome: 94_680e6, fcf: 92_953e6, grossMargin: 41.8, netMargin: 25.9 },
      { year: 2022, revenue: 394_328e6, ebitda: 130_541e6, netIncome: 99_803e6, fcf: 111_443e6, grossMargin: 43.3, netMargin: 25.3 },
      { year: 2023, revenue: 383_285e6, ebitda: 130_109e6, netIncome: 96_995e6, fcf: 99_584e6, grossMargin: 44.1, netMargin: 25.3 },
    ],
    links: [
      { label: '10-K Annual Report (2023)', url: '#' },
      { label: 'Q4 2023 Earnings Press Release', url: '#' },
      { label: 'Investor Relations', url: '#' },
      { label: 'SEC EDGAR Filings', url: '#' },
    ],
    estimates: { revGrowthY1: 4.8, fcfGrowthY1: 7.2 },
  },

  NVDA: {
    profile: {
      ticker: 'NVDA', name: 'NVIDIA Corporation', sector: 'Semiconductors',
      industry: 'AI Compute', exchange: 'NASDAQ',
      country: 'USA', employees: 29600, shares: 24_530_000_000,
      price: 487.18, changePct: 2.84, marketCap: 1_200_000_000_000,
      beta: 1.68, logo: 'https://logo.clearbit.com/nvidia.com',
    },
    financials: {
      revenue: 60_922_000_000, ebitda: 38_104_000_000,
      netIncome: 29_760_000_000, fcf: 27_022_000_000,
      grossMargin: 72.7, ebitdaMargin: 62.5, netMargin: 48.8, fcfMargin: 44.4,
      totalAssets: 65_728_000_000, equity: 42_978_000_000,
      totalDebt: 9_709_000_000, cash: 25_984_000_000, netDebt: -16_275_000_000,
      roe: 69.2, roic: 51.4, debtToEquity: 0.23, netDebtEbitda: -0.43,
    },
    multiples: {
      pe: 40.3, forwardPE: 28.1, evEbitda: 31.2,
      ps: 19.7, pb: 27.9, evFcf: 44.0, dps: 0.16, bvps: 17.50,
      eps: 12.10, targetPrice: 550.00,
      analystRating: 'Strong Buy', numberOfAnalysts: 51,
    },
    valuation: { grahamNumber: 87.0 },
    capitalAllocation: {
      dividendYield: 0.00033, buybackYield: 0.012,
      payoutRatio: 0.013, dividendsPaid: 395_000_000, shareRepurchase: 9_500_000_000,
    },
    history: [
      { year: 2019, revenue: 10_918e6, ebitda: 3_452e6, netIncome: 2_796e6, fcf: 3_135e6, grossMargin: 61.2, netMargin: 25.6 },
      { year: 2020, revenue: 16_675e6, ebitda: 5_954e6, netIncome: 4_332e6, fcf: 4_694e6, grossMargin: 62.3, netMargin: 26.0 },
      { year: 2021, revenue: 26_914e6, ebitda: 11_226e6, netIncome: 9_752e6, fcf: 8_132e6, grossMargin: 64.9, netMargin: 36.2 },
      { year: 2022, revenue: 26_974e6, ebitda: 7_437e6, netIncome: 4_368e6, fcf: 3_808e6, grossMargin: 56.9, netMargin: 16.2 },
      { year: 2023, revenue: 60_922e6, ebitda: 38_104e6, netIncome: 29_760e6, fcf: 27_022e6, grossMargin: 72.7, netMargin: 48.8 },
    ],
    links: [
      { label: '10-K Annual Report (2024)', url: '#' },
      { label: 'Q4 FY24 Earnings', url: '#' },
      { label: 'Investor Relations', url: '#' },
    ],
    estimates: { revGrowthY1: 41.0, fcfGrowthY1: 38.0 },
  },
};
