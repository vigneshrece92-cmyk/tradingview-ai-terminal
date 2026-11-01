'use client';

import React from 'react';
import { Recommendation, TechnicalAnalysis } from '@/types/trading';
import { Activity, Gauge, TrendingDown, TrendingUp, Zap } from 'lucide-react';

interface TechnicalAnalysisGaugeProps {
  analysis: TechnicalAnalysis | null;
}

const BADGE_STYLES: Record<Recommendation, { text: string; bg: string; border: string; color: string }> = {
  STRONG_BUY: { text: 'STRONG BUY', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', color: 'text-emerald-400' },
  BUY: { text: 'BUY', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', color: 'text-emerald-400' },
  NEUTRAL: { text: 'NEUTRAL', bg: 'bg-slate-500/10', border: 'border-slate-500/30', color: 'text-slate-300' },
  SELL: { text: 'SELL', bg: 'bg-rose-500/10', border: 'border-rose-500/20', color: 'text-rose-400' },
  STRONG_SELL: { text: 'STRONG SELL', bg: 'bg-rose-500/20', border: 'border-rose-500/40', color: 'text-rose-400' },
};

export default function TechnicalAnalysisGauge({ analysis }: TechnicalAnalysisGaugeProps) {
  if (!analysis) {
    return (
      <div className="flex items-center justify-center p-6 bg-[#111723] rounded-xl border border-slate-800 text-slate-500 text-xs">
        Loading technical analysis...
      </div>
    );
  }

  const { recommendation, buyCount, neutralCount, sellCount, oscillatorsRating, movingAveragesRating, indicators } = analysis;
  const badge = BADGE_STYLES[recommendation] || BADGE_STYLES.NEUTRAL;
  const totalSignals = buyCount + neutralCount + sellCount || 26;
  const buyPct = Math.round((buyCount / totalSignals) * 100);
  const sellPct = Math.round((sellCount / totalSignals) * 100);

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#111723] rounded-xl border border-slate-800 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge size={16} className="text-blue-400" />
          <h3 className="font-semibold text-xs text-white uppercase tracking-wider">TradingView TA Rating</h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">26 Technical Indicators</span>
      </div>

      {/* Main Consensus Badge */}
      <div className="flex flex-col items-center justify-center py-3 bg-[#0d111a] rounded-lg border border-slate-800/80">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Summary Consensus</span>
        <div className={`px-4 py-1.5 rounded-full font-black text-sm tracking-wider border ${badge.bg} ${badge.border} ${badge.color} shadow-lg shadow-black/40`}>
          {badge.text}
        </div>

        {/* Breakdown bar */}
        <div className="w-full max-w-[260px] mt-3 px-2">
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span className="text-emerald-400 font-semibold">{buyCount} Buy</span>
            <span className="text-slate-400">{neutralCount} Neutral</span>
            <span className="text-rose-400 font-semibold">{sellCount} Sell</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div style={{ width: `${buyPct}%` }} className="bg-emerald-500 h-full transition-all duration-500" />
            <div style={{ width: `${100 - buyPct - sellPct}%` }} className="bg-slate-600 h-full transition-all duration-500" />
            <div style={{ width: `${sellPct}%` }} className="bg-rose-500 h-full transition-all duration-500" />
          </div>
        </div>
      </div>

      {/* Oscillators & Moving Averages Sub-Gauges */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Oscillators */}
        <div className="p-2.5 bg-[#0d111a] rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-[11px]">Oscillators</span>
            <span className={`text-[11px] font-bold ${BADGE_STYLES[oscillatorsRating].color}`}>
              {BADGE_STYLES[oscillatorsRating].text}
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">RSI(14):</span>
              <span className={indicators.rsi > 70 ? 'text-rose-400 font-bold' : indicators.rsi < 30 ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                {indicators.rsi}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">MACD:</span>
              <span className={indicators.macd.hist > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {indicators.macd.hist > 0 ? '+' : ''}{indicators.macd.hist}
              </span>
            </div>
          </div>
        </div>

        {/* Moving Averages */}
        <div className="p-2.5 bg-[#0d111a] rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-[11px]">Moving Avg</span>
            <span className={`text-[11px] font-bold ${BADGE_STYLES[movingAveragesRating].color}`}>
              {BADGE_STYLES[movingAveragesRating].text}
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">EMA 20:</span>
              <span>${indicators.ema20}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">EMA 200:</span>
              <span>${indicators.ema200}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Volatility & Trend Strength */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0d111a] rounded-lg border border-slate-800 font-mono text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Activity size={13} className="text-purple-400" />
          <span>ATR (14):</span>
          <b className="text-white">${indicators.atr}</b>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Zap size={13} className="text-amber-400" />
          <span>ADX:</span>
          <b className="text-emerald-400">28.5 (Strong)</b>
        </div>
      </div>
    </div>
  );
}
