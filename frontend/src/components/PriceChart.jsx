import { useEffect, useRef } from 'react';

export default function PriceChart({ ticker, darkMode }) {
  const container = useRef(null);

  useEffect(() => {
    if (!ticker || !container.current) return;
    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    const isMobile = window.innerWidth < 640;
    const chartHeight = isMobile ? 260 : 400;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: ticker,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: darkMode ? 'dark' : 'light',
      style: '1',
      locale: 'en',
      allow_symbol_change: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      height: chartHeight,
    });

    const div = document.createElement('div');
    div.className = 'tradingview-widget-container__widget';
    div.style.height = chartHeight + 'px';
    div.style.width = '100%';

    container.current.appendChild(div);
    container.current.appendChild(script);

    return () => {
      if (container.current) container.current.innerHTML = '';
    };
  }, [ticker, darkMode]);

  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{ height: window.innerWidth < 640 ? 260 : 400, width: '100%', borderRadius: 'var(--radius)', overflow: 'hidden' }}
    />
  );
}
