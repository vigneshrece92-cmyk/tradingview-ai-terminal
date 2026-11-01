'use client';

import React, { useEffect, useRef, memo } from 'react';
import { Timeframe } from '@/types/trading';
import { Radio, ExternalLink, Layers } from 'lucide-react';

interface TradingViewLiveChartProps {
  symbol: string;
  timeframe: Timeframe;
  onSwitchToOrderFlow?: () => void;
}

// Map app symbols to official TradingView ticker identifiers
const TRADINGVIEW_SYMBOL_MAP: Record<string, string> = {
  XAUUSD: 'OANDA:XAUUSD',
  GOLD: 'OANDA:XAUUSD',
  BTC: 'BINANCE:BTCUSDT',
  BTCUSDT: 'BINANCE:BTCUSDT',
  ETH: 'BINANCE:ETHUSDT',
  ETHUSDT: 'BINANCE:ETHUSDT',
  SOL: 'BINANCE:SOLUSDT',
  SOLUSDT: 'BINANCE:SOLUSDT',
  NVDA: 'NASDAQ:NVDA',
  AAPL: 'NASDAQ:AAPL',
  TSLA: 'NASDAQ:TSLA',
  SPY: 'AMEX:SPY',
};

// Map timeframes to TradingView interval formats
const TRADINGVIEW_INTERVAL_MAP: Record<Timeframe, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '1D': 'D',
};

function TradingViewLiveChartComponent({
  symbol,
  timeframe,
  onSwitchToOrderFlow,
}: TradingViewLiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const tvSymbol = TRADINGVIEW_SYMBOL_MAP[symbol.toUpperCase()] || `OANDA:${symbol.toUpperCase()}`;
  const tvInterval = TRADINGVIEW_INTERVAL_MAP[timeframe] || '60';

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Clean previous content safely in unmanaged leaf node
    el.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    el.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: tvInterval,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      withdateranges: true,
      hide_side_toolbar: false,
      details: true,
      hotlist: true,
      studies: [
        'STD;EMA',
        'STD;Bollinger_Bands',
        'Volume@tv-basicstudies',
      ],
      container_id: undefined,
    });

    el.appendChild(script);

    return () => {
      if (el) {
        el.innerHTML = '';
      }
    };
  }, [tvSymbol, tvInterval]);

  return (
    <div className="flex flex-col h-full w-full bg-[#0d111a] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Chart Top Control & Status Ribbon */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0a0e17] border-b border-slate-800 flex-wrap gap-2">
        {/* Left: Real-Time Stream Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
            <Radio size={12} className="animate-pulse text-emerald-400" />
            <span className="font-bold">LIVE WEBSOCKET STREAM</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-slate-300">
            <span className="text-slate-500">Source:</span>
            <span className="text-blue-400 font-bold">{tvSymbol}</span>
          </div>
        </div>

        {/* Right: Switcher to Quant Order Flow & Direct TradingView Link */}
        <div className="flex items-center gap-2">
          {onSwitchToOrderFlow && (
            <button
              onClick={onSwitchToOrderFlow}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Switch to Quant Order Flow with Candle Delta & Trade Hold Signals"
            >
              <Layers size={13} />
              <span>Switch to Order Flow Terminal</span>
            </button>
          )}

          <a
            href={`https://www.tradingview.com/symbols/${tvSymbol.replace(':', '-')}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            title="Open in full TradingView portal"
          >
            <ExternalLink size={12} />
            <span className="hidden md:inline">TradingView Portal</span>
          </a>
        </div>
      </div>

      {/* Pure unmanaged leaf node for TradingView DOM injection with zero React children */}
      <div className="relative flex-1 w-full min-h-[520px] bg-[#0d111a]">
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ width: '100%', height: '100%', minHeight: '520px' }}
        />
      </div>
    </div>
  );
}

export default memo(TradingViewLiveChartComponent);
