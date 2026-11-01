'use client';

import React, { useEffect, useState } from 'react';
import TradingChart from '@/components/TradingChart';
import TechnicalAnalysisGauge from '@/components/TechnicalAnalysisGauge';
import ScreenerTable from '@/components/ScreenerTable';
import AICopilot from '@/components/AICopilot';
import PineScriptStudio from '@/components/PineScriptStudio';
import { CandleData, ScreenerItem, TechnicalAnalysis, Timeframe } from '@/types/trading';
import { evaluateTechnicalAnalysis } from '@/lib/indicators';
import {
  Activity,
  BarChart2,
  Bot,
  Code2,
  ExternalLink,
  Flame,
  Github,
  Layers,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

const QUICK_SYMBOLS = [
  { symbol: 'BTCUSDT', label: 'BTC' },
  { symbol: 'ETHUSDT', label: 'ETH' },
  { symbol: 'SOLUSDT', label: 'SOL' },
  { symbol: 'NVDA', label: 'NVDA' },
  { symbol: 'AAPL', label: 'AAPL' },
  { symbol: 'TSLA', label: 'TSLA' },
  { symbol: 'SPY', label: 'SPY' },
];

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1D'];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'pinescript'>('terminal');
  const [sidebarTab, setSidebarTab] = useState<'copilot' | 'screener'>('copilot');
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1h');

  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoadingCandles, setIsLoadingCandles] = useState(true);
  const [technicalAnalysis, setTechnicalAnalysis] = useState<TechnicalAnalysis | null>(null);
  const [screenerItems, setScreenerItems] = useState<ScreenerItem[]>([]);

  // Fetch Candles
  const loadCandles = async (symbol: string, timeframe: Timeframe) => {
    setIsLoadingCandles(true);
    try {
      const res = await fetch(`/api/candles?symbol=${symbol}&timeframe=${timeframe}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.candles)) {
        setCandles(data.candles);
        // Calculate Technical Analysis
        const ta = evaluateTechnicalAnalysis(symbol, data.candles);
        setTechnicalAnalysis(ta);
      }
    } catch (err) {
      console.error('Failed to fetch candles:', err);
    } finally {
      setIsLoadingCandles(false);
    }
  };

  // Fetch Screener list
  const loadScreener = async () => {
    try {
      const res = await fetch('/api/screener');
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setScreenerItems(data.items);
      }
    } catch (err) {
      console.error('Failed to load screener:', err);
    }
  };

  useEffect(() => {
    loadCandles(selectedSymbol, selectedTimeframe);
  }, [selectedSymbol, selectedTimeframe]);

  useEffect(() => {
    loadScreener();
    const interval = setInterval(loadScreener, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#090d14] text-slate-100 font-sans">
      {/* Top Header Bar */}
      <header className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#0f1420] border-b border-slate-800/80 gap-3">
        {/* Left: Brand & Navigation Mode */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <TrendingUp size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-wider text-white">TRADINGVIEW AI</span>
                <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-mono text-[10px] font-bold border border-blue-500/30">
                  MCP HUB
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                TradingView TA • Lightweight Charts • Pine Studio
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-[#090d14] p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('terminal')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'terminal'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 size={13} />
              <span>Live Terminal</span>
            </button>
            <button
              onClick={() => setActiveTab('pinescript')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'pinescript'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 size={13} />
              <span>Pine Script Studio</span>
            </button>
          </div>
        </div>

        {/* Center: Quick Symbols & Timeframe */}
        {activeTab === 'terminal' && (
          <div className="flex items-center gap-3 flex-wrap">
            {/* Quick Symbols */}
            <div className="flex items-center gap-1 bg-[#090d14] p-1 rounded-lg border border-slate-800">
              {QUICK_SYMBOLS.map((s) => (
                <button
                  key={s.symbol}
                  onClick={() => setSelectedSymbol(s.symbol)}
                  className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                    selectedSymbol === s.symbol
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Timeframe Switcher */}
            <div className="flex items-center gap-1 bg-[#090d14] p-1 rounded-lg border border-slate-800">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-2 py-0.5 rounded text-xs font-mono font-medium transition-all ${
                    selectedTimeframe === tf
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Right: Status Pill & GitHub Links */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-mono border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Feed</span>
          </div>

          <a
            href="https://vercel.com/new"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center gap-1 px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-black text-xs font-bold transition-all shadow-md"
          >
            Deploy to Vercel
          </a>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 p-3 overflow-hidden flex flex-col">
        {activeTab === 'terminal' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-[700px]">
            {/* Left 8 Cols: Interactive Chart & Technical Indicators Gauge */}
            <div className="lg:col-span-8 flex flex-col gap-3">
              {/* Lightweight Chart */}
              <div className="flex-1 min-h-[460px]">
                <TradingChart
                  symbol={selectedSymbol}
                  timeframe={selectedTimeframe}
                  candles={candles}
                  isLoading={isLoadingCandles}
                  onRefresh={() => loadCandles(selectedSymbol, selectedTimeframe)}
                />
              </div>

              {/* Technical Analysis Gauge */}
              <TechnicalAnalysisGauge analysis={technicalAnalysis} />
            </div>

            {/* Right 4 Cols: AI Copilot & Screener Tabs */}
            <div className="lg:col-span-4 flex flex-col h-full min-h-[500px]">
              {/* Tab Selector between AI Copilot & Screener */}
              <div className="flex items-center gap-1 p-1 bg-[#111723] rounded-t-xl border-t border-x border-slate-800">
                <button
                  onClick={() => setSidebarTab('copilot')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    sidebarTab === 'copilot'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Bot size={14} />
                  <span>AI Copilot</span>
                </button>
                <button
                  onClick={() => setSidebarTab('screener')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    sidebarTab === 'screener'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers size={14} />
                  <span>Screener</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {sidebarTab === 'copilot' ? (
                  <AICopilot
                    symbol={selectedSymbol}
                    timeframe={selectedTimeframe}
                    technicalAnalysis={technicalAnalysis}
                  />
                ) : (
                  <ScreenerTable
                    items={screenerItems}
                    selectedSymbol={selectedSymbol}
                    onSelectSymbol={(sym) => {
                      setSelectedSymbol(sym);
                      setSidebarTab('copilot'); // Auto switch to copilot for instant audit
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Pine Script Studio Full View */
          <div className="flex-1 min-h-[650px]">
            <PineScriptStudio />
          </div>
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className="px-4 py-2 bg-[#0c101a] border-t border-slate-800 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <span>Active Asset: <b className="text-slate-300 font-mono">{selectedSymbol}</b></span>
          <span>Timeframe: <b className="text-slate-300 font-mono">{selectedTimeframe}</b></span>
          <span>Data: <b className="text-slate-300 font-mono">Binance API / TV TA Engine</b></span>
        </div>
        <div className="flex items-center gap-3">
          <span>Built for GitHub & Vercel deployment</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">Open-source TradingView MCP Stack</span>
        </div>
      </footer>
    </div>
  );
}
