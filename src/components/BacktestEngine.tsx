'use client';

import React, { useState } from 'react';
import { BacktestResult, CandleData, ChartMarker } from '@/types/trading';
import { BacktestConfig, runBacktest } from '@/lib/backtester';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  Play,
  RotateCcw,
  ShieldAlert,
  Sliders,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface BacktestEngineProps {
  symbol: string;
  timeframe: string;
  candles: CandleData[];
  onApplyMarkersToChart: (markers: ChartMarker[]) => void;
}

export default function BacktestEngine({
  symbol,
  timeframe,
  candles,
  onApplyMarkersToChart,
}: BacktestEngineProps) {
  const [strategy, setStrategy] = useState<BacktestConfig['strategy']>('supertrend');
  const [initialCapital, setInitialCapital] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(2);
  const [tpRatio, setTpRatio] = useState(2.0);
  const [slRatio, setSlRatio] = useState(1.0);
  const [allowShorts, setAllowShorts] = useState(true);

  const [result, setResult] = useState<BacktestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [markersCount, setMarkersCount] = useState(0);

  const handleRun = () => {
    if (candles.length < 30) return;
    setIsRunning(true);

    setTimeout(() => {
      const { result: backtestRes, markers } = runBacktest(candles, {
        strategy,
        initialCapital,
        riskPercent,
        tpRatio,
        slRatio,
        allowShorts,
      });

      setResult(backtestRes);
      setMarkersCount(markers.length);
      onApplyMarkersToChart(markers);
      setIsRunning(false);
    }, 250);
  };

  return (
    <div className="flex flex-col h-full bg-[#111723] rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between p-3.5 bg-[#131b29] border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Zap size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-wide">Quant Strategy Backtester</h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Simulating over {candles.length} historical candles for {symbol} ({timeframe})
            </p>
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning || candles.length < 30}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Play size={13} fill="currentColor" />
          <span>{isRunning ? 'Simulating...' : 'Run Strategy Backtest'}</span>
        </button>
      </div>

      {/* Control Panel Parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3 bg-[#0d111a] border-b border-slate-800/80 text-xs">
        {/* Strategy Selector */}
        <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
          <label className="text-[11px] text-slate-400 font-medium">Strategy</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as any)}
            className="px-2.5 py-1.5 bg-[#090d14] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="volume_profile_delta">⭐ Volume Profile + Delta (Recommended)</option>
            <option value="supertrend">SuperTrend Momentum</option>
            <option value="bollinger">Bollinger Squeeze Breakout</option>
            <option value="ema_cross">EMA 20/50 Golden Cross</option>
            <option value="rsi_mean_reversion">RSI Mean Reversion (30/70)</option>
          </select>
        </div>

        {/* Initial Capital */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-400 font-medium">Initial Capital</label>
          <select
            value={initialCapital}
            onChange={(e) => setInitialCapital(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-[#090d14] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value={1000}>$1,000</option>
            <option value={5000}>$5,000</option>
            <option value={10000}>$10,000</option>
            <option value={50000}>$50,000</option>
            <option value={100000}>$100,000</option>
          </select>
        </div>

        {/* Risk Per Trade */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-400 font-medium">Risk / Trade</label>
          <select
            value={riskPercent}
            onChange={(e) => setRiskPercent(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-[#090d14] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value={1}>1.0%</option>
            <option value={2}>2.0%</option>
            <option value={3}>3.0%</option>
            <option value={5}>5.0%</option>
          </select>
        </div>

        {/* Take Profit Multiple */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-400 font-medium">Target (TP R:R)</label>
          <select
            value={tpRatio}
            onChange={(e) => setTpRatio(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-[#090d14] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value={1.5}>1 : 1.5</option>
            <option value={2.0}>1 : 2.0</option>
            <option value={2.5}>1 : 2.5</option>
            <option value={3.0}>1 : 3.0</option>
          </select>
        </div>

        {/* Trade Direction */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-400 font-medium">Direction</label>
          <button
            onClick={() => setAllowShorts(!allowShorts)}
            className={`px-2.5 py-1.5 rounded-lg font-semibold border transition-all text-center ${
              allowShorts
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {allowShorts ? 'Longs & Shorts' : 'Longs Only'}
          </button>
        </div>

        {/* Plot on Chart Action */}
        <div className="flex flex-col gap-1 justify-end">
          <button
            onClick={handleRun}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition-colors"
          >
            ⚡ Re-Calculate
          </button>
        </div>
      </div>

      {/* Results View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {result ? (
          <>
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Net Profit */}
              <div className="p-3 bg-[#0d111a] rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Net Profit</span>
                <div className={`text-lg font-black font-mono mt-0.5 ${result.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.netProfit >= 0 ? '+' : ''}${result.netProfit.toLocaleString()}
                </div>
                <span className={`text-[11px] font-mono font-semibold ${result.netProfitPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.netProfitPercent >= 0 ? '+' : ''}{result.netProfitPercent}%
                </span>
              </div>

              {/* Win Rate */}
              <div className="p-3 bg-[#0d111a] rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Win Rate</span>
                <div className="text-lg font-black font-mono mt-0.5 text-white">
                  {result.winRate}%
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {result.winCount}W / {result.lossCount}L
                </span>
              </div>

              {/* Profit Factor */}
              <div className="p-3 bg-[#0d111a] rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Profit Factor</span>
                <div className="text-lg font-black font-mono mt-0.5 text-teal-400">
                  {result.profitFactor}
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {result.profitFactor > 1.5 ? 'Profitable Edge' : 'Challenging Edge'}
                </span>
              </div>

              {/* Max Drawdown */}
              <div className="p-3 bg-[#0d111a] rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Max Drawdown</span>
                <div className="text-lg font-black font-mono mt-0.5 text-rose-400">
                  -{result.maxDrawdownPercent}%
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  -${result.maxDrawdown.toLocaleString()}
                </span>
              </div>

              {/* Total Trades */}
              <div className="p-3 bg-[#0d111a] rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Executed Trades</span>
                <div className="text-lg font-black font-mono mt-0.5 text-purple-400">
                  {result.totalTrades}
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {markersCount} chart markers
                </span>
              </div>

              {/* Final Capital */}
              <div className="p-3 bg-[#0d111a] rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Ending Balance</span>
                <div className="text-lg font-black font-mono mt-0.5 text-amber-300">
                  ${result.finalCapital.toLocaleString()}
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  From ${result.initialCapital.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Trade Log Table */}
            <div className="bg-[#0d111a] rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-3 bg-[#131b29] border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={15} className="text-emerald-400" />
                  <h4 className="font-semibold text-xs text-white uppercase tracking-wider">
                    Recent Trade Execution Log
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Showing last {result.trades.length} trades
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#090d14] text-[11px] text-slate-400 uppercase font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Trade #</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Entry Price</th>
                      <th className="py-2.5 px-3">Exit Price</th>
                      <th className="py-2.5 px-3">PnL ($)</th>
                      <th className="py-2.5 px-3">PnL (%)</th>
                      <th className="py-2.5 px-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {result.trades.map((t) => {
                      const isWin = t.pnl > 0;
                      return (
                        <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2 px-3 font-bold text-slate-400">{t.id}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                t.type === 'LONG'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {t.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-100">${t.entryPrice}</td>
                          <td className="py-2 px-3 font-semibold text-slate-100">${t.exitPrice}</td>
                          <td className={`py-2 px-3 font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isWin ? '+' : ''}${t.pnl}
                          </td>
                          <td className={`py-2 px-3 font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isWin ? '+' : ''}{t.pnlPercent}%
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                t.exitReason === 'TAKE_PROFIT'
                                  ? 'bg-teal-500/10 text-teal-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}
                            >
                              {t.exitReason.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 gap-3">
            <Sliders size={32} className="text-slate-600" />
            <h4 className="text-sm font-semibold text-slate-300">Ready to Backtest Algorithmic Strategies</h4>
            <p className="text-xs max-w-md text-slate-400">
              Configure your strategy parameters above and click <b>"Run Strategy Backtest"</b> to simulate fills, calculate profit metrics, and visualize entry/exit points on the chart.
            </p>
            <button
              onClick={handleRun}
              className="mt-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-colors"
            >
              Run First Backtest Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
