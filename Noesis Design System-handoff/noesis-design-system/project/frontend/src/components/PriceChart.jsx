import { useEffect, useRef } from 'react';

export default function PriceChart({ ticker }) {
  const container = useRef(null);

  useEffect(() => {
    if (!ticker || !container.current) return;
    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: ticker,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      style: '1',
      locale: 'en',
      allow_symbol_change: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      height: 400,
    });

    const div = document.createElement('div');
    div.className = 'tradingview-widget-container__widget';
    div.style.height = '400px';
    div.style.width = '100%';

    container.current.appendChild(div);
    container.current.appendChild(script);

    return () => {
      if (container.current) container.current.innerHTML = '';
    };
  }, [ticker]);

  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{ height: 400, width: '100%', borderRadius: 'var(--radius)', overflow: 'hidden' }}
    />
  );
}
