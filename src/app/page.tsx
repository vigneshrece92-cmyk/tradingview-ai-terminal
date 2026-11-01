'use client';

import React, { useEffect, useState } from 'react';
import TradingChart from '@/components/TradingChart';
import TechnicalAnalysisGauge from '@/components/TechnicalAnalysisGauge';
import ScreenerTable from '@/components/ScreenerTable';
import AICopilot from '@/components/AICopilot';
import PineScriptStudio from '@/components/PineScriptStudio';
import BacktestEngine from '@/components/BacktestEngine';
import TimeframeMatrix from '@/components/TimeframeMatrix';
import RiskCalculator from '@/components/RiskCalculator';
import OrderFlowPanel from '@/components/OrderFlowPanel';
import { CandleData, ChartMarker, ScreenerItem, TechnicalAnalysis, Timeframe } from '@/types/trading';
import { evaluateTechnicalAnalysis } from '@/lib/indicators';
import {
  Activity,
  BarChart2,
  Bot,
  Calculator,
  Code2,
  Flame,
  Layers,
  Play,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Waves,
  Zap,
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
  const [activeTab, setActiveTab] = useState<'terminal' | 'orderflow' | 'backtest' | 'matrix' | 'risk' | 'pinescript'>('terminal');
  const [sidebarTab, setSidebarTab] = useState<'copilot' | 'screener'>('copilot');
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1h');

  const [candles, setCandles] = useState<CandleData[]>([]);
  const [chartMarkers, setChartMarkers] = useState<ChartMarker[]>([]);
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
    const interval = setInterval(loadScreener, 30000);
    return () => clearInterval(interval);
  }, []);

  const latestPrice = technicalAnalysis?.price || (candles[candles.length - 1]?.close) || 68000;

  return (
    <div className="flex flex-col min-h-screen bg-[#090d14] text-slate-100 font-sans">
      {/* Top Header Bar */}
      <header className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#0f1420] border-b border-slate-800 gap-3">
        {/* Brand & Terminal Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-wider text-white">QUANT TERMINAL PRO</span>
              <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-black border border-purple-500/30">
                v2.0 PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Lightweight Charts • Backtesting Engine • Multi-Timeframe Matrix • AI Copilot
            </p>
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex items-center bg-[#090d14] p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'terminal' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 size={13} />
            <span>Chart Terminal</span>
          </button>

          <button
            onClick={() => setActiveTab('orderflow')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'orderflow' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Waves size={13} />
            <span>Order Flow & VRVP</span>
          </button>

          <button
            onClick={() => setActiveTab('backtest')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'backtest' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap size={13} />
            <span>Strategy Backtester</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={13} />
            <span>Confluence Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('risk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'risk' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator size={13} />
            <span>Position Sizer</span>
          </button>

          <button
            onClick={() => setActiveTab('pinescript')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'pinescript' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 size={13} />
            <span>Pine & Python Lab</span>
          </button>
        </div>

        {/* Quick Asset & Timeframe Selector */}
        <div className="flex items-center gap-2 flex-wrap">
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

          {/* Live Indicator Pulse */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-mono border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Binance API Connected</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 p-3 overflow-hidden flex flex-col">
        {activeTab === 'terminal' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-[700px]">
            {/* Left 8 Cols: Interactive Chart with Supertrend/Bollinger + Technical Indicators Gauge */}
            <div className="lg:col-span-8 flex flex-col gap-3">
              <div className="flex-1 min-h-[480px]">
                <TradingChart
                  symbol={selectedSymbol}
                  timeframe={selectedTimeframe}
                  candles={candles}
                  markers={chartMarkers}
                  isLoading={isLoadingCandles}
                  onRefresh={() => loadCandles(selectedSymbol, selectedTimeframe)}
                />
              </div>

              {/* Technical Analysis Gauge */}
              <TechnicalAnalysisGauge analysis={technicalAnalysis} />
            </div>

            {/* Right 4 Cols: AI Copilot & Screener Tabs */}
            <div className="lg:col-span-4 flex flex-col h-full min-h-[500px]">
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
                      setSidebarTab('copilot');
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Order Flow & Volume Profile Tab */}
        {activeTab === 'orderflow' && (
          <div className="flex-1 min-h-[650px]">
            <OrderFlowPanel
              symbol={selectedSymbol}
              timeframe={selectedTimeframe}
              candles={candles}
            />
          </div>
        )}

        {/* Backtest Engine Tab */}
        {activeTab === 'backtest' && (
          <div className="flex-1 min-h-[650px]">
            <BacktestEngine
              symbol={selectedSymbol}
              timeframe={selectedTimeframe}
              candles={candles}
              onApplyMarkersToChart={(markers) => {
                setChartMarkers(markers);
              }}
            />
          </div>
        )}

        {/* Multi-Timeframe Confluence Matrix Tab */}
        {activeTab === 'matrix' && (
          <div className="flex-1 min-h-[650px]">
            <TimeframeMatrix
              symbol={selectedSymbol}
              currentRecommendation={technicalAnalysis?.recommendation || 'NEUTRAL'}
            />
          </div>
        )}

        {/* Position Sizer & Risk Management Tab */}
        {activeTab === 'risk' && (
          <div className="flex-1 min-h-[650px]">
            <RiskCalculator currentPrice={latestPrice} />
          </div>
        )}

        {/* Pine Script & Python Algo Lab Tab */}
        {activeTab === 'pinescript' && (
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
          <span>Price: <b className="text-emerald-400 font-mono">${latestPrice.toLocaleString()}</b></span>
          <span>Signals Plotted: <b className="text-purple-400 font-mono">{chartMarkers.length}</b></span>
        </div>
        <div className="flex items-center gap-3">
          <span>Next.js 15 Pro Quant Terminal</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">Institutional Quant & MCP Stack</span>
        </div>
      </footer>
    </div>
  );
}
