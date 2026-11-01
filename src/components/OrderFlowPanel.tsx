'use client';

import React, { useMemo, useState } from 'react';
import { CandleData } from '@/types/trading';
import { calculateOrderFlowDelta, calculateVolumeProfile, generateWhalePrints } from '@/lib/orderflow';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Flame,
  Layers,
  Radio,
  ShieldCheck,
  TrendingUp,
  Waves,
  Zap,
} from 'lucide-react';

interface OrderFlowPanelProps {
  symbol: string;
  timeframe: string;
  candles: CandleData[];
  onPlotPriceLines?: (poc: number, vah: number, val: number) => void;
}

export default function OrderFlowPanel({
  symbol,
  timeframe,
  candles,
  onPlotPriceLines,
}: OrderFlowPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'cvd' | 'tape'>('profile');

  // Compute Volume Profile & Order Flow
  const vpData = useMemo(() => calculateVolumeProfile(candles, 24, 0.70), [candles]);
  const ofBars = useMemo(() => calculateOrderFlowDelta(candles), [candles]);

  const currentPrice = candles[candles.length - 1]?.close || vpData.poc || 68000;
  const whalePrints = useMemo(() => generateWhalePrints(currentPrice, 10), [currentPrice]);

  const latestBar = ofBars[ofBars.length - 1] || { delta: 0, cvd: 0, buyVolume: 50, sellVolume: 50 };
  const totalVol = latestBar.buyVolume + latestBar.sellVolume || 1;
  const buyerAggression = Math.round((latestBar.buyVolume / totalVol) * 100);
  const sellerAggression = 100 - buyerAggression;

  // Find max volume bucket for percentage width calculation
  const maxBucketVol = Math.max(...vpData.buckets.map((b) => b.volume), 1);

  // Price position relative to Value Area
  let vaStatus = 'INSIDE VALUE AREA';
  let vaColor = 'text-slate-300';
  if (currentPrice > vpData.vah) {
    vaStatus = 'TRADING ABOVE VAH (BULLISH EXPANSION)';
    vaColor = 'text-emerald-400';
  } else if (currentPrice < vpData.val) {
    vaStatus = 'TRADING BELOW VAL (BEARISH DISCOUNT)';
    vaColor = 'text-rose-400';
  }

  return (
    <div className="flex flex-col h-full bg-[#111723] rounded-xl border border-slate-800 shadow-2xl overflow-hidden text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between p-3.5 bg-[#131b29] border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Waves size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white tracking-wide">
                Institutional Order Flow & Volume Profile
              </h3>
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/30">
                CME / TPO SPEC
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              POC • VAH • VAL • Cumulative Volume Delta (CVD) • Whale Tape
            </p>
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center bg-[#090d14] p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold transition-all ${
              activeSubTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 size={13} />
            <span>Volume Profile (VRVP)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('cvd')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold transition-all ${
              activeSubTab === 'cvd' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity size={13} />
            <span>Delta & CVD</span>
          </button>
          <button
            onClick={() => setActiveSubTab('tape')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold transition-all ${
              activeSubTab === 'tape' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio size={13} />
            <span>Whale Tape</span>
          </button>
        </div>
      </div>

      {/* Institutional Value Area Key Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-[#0d111a] border-b border-slate-800 text-xs font-mono">
        {/* Point of Control (POC) */}
        <div className="p-2.5 bg-[#090d14] rounded-lg border border-amber-500/30 flex flex-col">
          <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold uppercase">
            <span>POC (Point of Control)</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <span className="text-base font-black text-white mt-1">${vpData.poc.toLocaleString()}</span>
          <span className="text-[10px] text-slate-500">Highest Volume Traded</span>
        </div>

        {/* Value Area High (VAH) */}
        <div className="p-2.5 bg-[#090d14] rounded-lg border border-sky-500/30 flex flex-col">
          <span className="text-[10px] text-sky-400 font-bold uppercase">VAH (Value Area High)</span>
          <span className="text-base font-black text-sky-300 mt-1">${vpData.vah.toLocaleString()}</span>
          <span className="text-[10px] text-slate-500">70% Value Boundary</span>
        </div>

        {/* Value Area Low (VAL) */}
        <div className="p-2.5 bg-[#090d14] rounded-lg border border-cyan-500/30 flex flex-col">
          <span className="text-[10px] text-cyan-400 font-bold uppercase">VAL (Value Area Low)</span>
          <span className="text-base font-black text-cyan-300 mt-1">${vpData.val.toLocaleString()}</span>
          <span className="text-[10px] text-slate-500">70% Value Support</span>
        </div>

        {/* Net Delta & Market Position */}
        <div className="p-2.5 bg-[#090d14] rounded-lg border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Current Value State</span>
          <span className={`text-[11px] font-bold tracking-tight truncate ${vaColor}`}>
            {vaStatus}
          </span>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>VA Vol: <b>{Math.round((vpData.valueAreaVolume / (vpData.totalVolume || 1)) * 100)}%</b></span>
            <span>Net CVD: <b className={latestBar.cvd >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{latestBar.cvd > 0 ? '+' : ''}{latestBar.cvd.toLocaleString()}</b></span>
          </div>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* VIEW 1: Volume Profile Horizontal Bars */}
        {activeSubTab === 'profile' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-300 text-xs">
              <span className="font-semibold text-slate-200">
                Visible Range Volume Profile ({vpData.buckets.length} Price Nodes)
              </span>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-emerald-400"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Buyer Vol</span>
                <span className="flex items-center gap-1 text-rose-400"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Seller Vol</span>
                <span className="flex items-center gap-1 text-amber-400 font-bold"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> POC Node</span>
              </div>
            </div>

            {/* Horizontal Bar Stack */}
            <div className="space-y-1 bg-[#090d14] p-3 rounded-xl border border-slate-800">
              {vpData.buckets.slice().reverse().map((b) => {
                const barWidth = Math.round((b.volume / maxBucketVol) * 100);
                const buyPct = Math.round((b.buyVolume / (b.volume || 1)) * 100);
                const isCurrent = Math.abs(currentPrice - b.price) < ((vpData.vah - vpData.val) / 24);

                return (
                  <div key={b.price} className="flex items-center gap-3 text-[11px] font-mono py-0.5 group hover:bg-slate-800/40 px-1 rounded transition-colors">
                    {/* Price Label & Badges */}
                    <div className="w-28 flex items-center justify-between shrink-0">
                      <span className={`font-semibold ${b.isPOC ? 'text-amber-400 font-black' : b.isVAH ? 'text-sky-400' : b.isVAL ? 'text-cyan-400' : 'text-slate-400'}`}>
                        ${b.price.toLocaleString()}
                      </span>
                      {b.isPOC && (
                        <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/40">
                          POC
                        </span>
                      )}
                      {b.isVAH && (
                        <span className="px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[9px] font-bold border border-sky-500/40">
                          VAH
                        </span>
                      )}
                      {b.isVAL && (
                        <span className="px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold border border-cyan-500/40">
                          VAL
                        </span>
                      )}
                      {isCurrent && (
                        <span className="px-1 py-0.2 rounded bg-white text-black font-black text-[9px]">
                          LIVE
                        </span>
                      )}
                    </div>

                    {/* Horizontal Volume Bar */}
                    <div className="flex-1 h-3.5 bg-slate-900 rounded-sm overflow-hidden flex relative">
                      {/* Buy fraction */}
                      <div
                        style={{ width: `${(barWidth * buyPct) / 100}%` }}
                        className={`h-full ${b.isPOC ? 'bg-amber-500' : 'bg-emerald-500/70'}`}
                      />
                      {/* Sell fraction */}
                      <div
                        style={{ width: `${(barWidth * (100 - buyPct)) / 100}%` }}
                        className={`h-full ${b.isPOC ? 'bg-amber-600' : 'bg-rose-500/70'}`}
                      />
                    </div>

                    {/* Volume & Delta text */}
                    <div className="w-24 text-right text-[10px] text-slate-400 shrink-0">
                      <span>{b.volume.toLocaleString()}</span>
                      <span className={`ml-1.5 font-bold ${b.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {b.delta > 0 ? '+' : ''}{b.delta}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: Order Flow Delta & CVD */}
        {activeSubTab === 'cvd' && (
          <div className="space-y-4">
            {/* Aggression Meter */}
            <div className="p-4 bg-[#0d111a] rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-200 uppercase">Live Buyer vs Seller Aggression</span>
                <span className="font-mono text-emerald-400">{buyerAggression}% Buyers / {sellerAggression}% Sellers</span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div style={{ width: `${buyerAggression}%` }} className="bg-emerald-500 h-full transition-all" />
                <div style={{ width: `${sellerAggression}%` }} className="bg-rose-500 h-full transition-all" />
              </div>

              {/* Absorption Alert Banner */}
              <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2">
                <Zap size={16} className="text-indigo-400 shrink-0" />
                <span>
                  <b>Order Flow Absorption Analysis:</b> Cumulative Delta is <b>{latestBar.cvd > 0 ? 'Positive (+ Accumulation)' : 'Negative (- Distribution)'}</b>. Institutional limit orders are absorbing aggressive market flow near POC.
                </span>
              </div>
            </div>

            {/* Delta Bar History Table */}
            <div className="bg-[#0d111a] rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-3 bg-[#131b29] border-b border-slate-800 font-bold text-xs text-white">
                Recent Order Flow Candles (Delta & Imbalances)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#090d14] text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Time</th>
                      <th className="py-2 px-3">Price</th>
                      <th className="py-2 px-3">Buy Vol</th>
                      <th className="py-2 px-3">Sell Vol</th>
                      <th className="py-2 px-3">Bar Delta</th>
                      <th className="py-2 px-3">Cumulative Delta (CVD)</th>
                      <th className="py-2 px-3">Footprint Signal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-[11px]">
                    {ofBars.slice(-15).reverse().map((bar, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-400">{new Date(bar.time * 1000).toLocaleTimeString()}</td>
                        <td className="py-2 px-3 font-semibold text-slate-100">${bar.price}</td>
                        <td className="py-2 px-3 text-emerald-400">{bar.buyVolume.toLocaleString()}</td>
                        <td className="py-2 px-3 text-rose-400">{bar.sellVolume.toLocaleString()}</td>
                        <td className={`py-2 px-3 font-bold ${bar.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {bar.delta > 0 ? '+' : ''}{bar.delta.toLocaleString()}
                        </td>
                        <td className={`py-2 px-3 font-bold ${bar.cvd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {bar.cvd > 0 ? '+' : ''}{bar.cvd.toLocaleString()}
                        </td>
                        <td className="py-2 px-3">
                          {bar.imbalance === 'BUY_IMBALANCE' ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                              Stacked Buy Imbalance
                            </span>
                          ) : bar.imbalance === 'SELL_IMBALANCE' ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                              Stacked Sell Imbalance
                            </span>
                          ) : (
                            <span className="text-slate-500">Normal</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: Whale Tape (Large Institutional Block Trades) */}
        {activeSubTab === 'tape' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">
                Institutional Block Execution Feed ($150,000+ Prints)
              </span>
              <span className="text-[11px] font-mono text-purple-400">Filtering Out Retail Noise</span>
            </div>

            <div className="bg-[#090d14] rounded-xl border border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-800/60 font-mono text-xs">
                {whalePrints.map((p) => {
                  const isBuy = p.side === 'BUY';
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2.5 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px]">{p.time}</span>
                        <span
                          className={`px-2 py-0.5 rounded font-black text-[10px] ${
                            isBuy
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {p.side}
                        </span>
                        {p.isAggressive && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30 flex items-center gap-1">
                            <Flame size={10} /> AGGRESSIVE SWEEP
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-slate-100 font-semibold">${p.price.toLocaleString()}</span>
                        <span className="text-slate-300">{p.size} Units</span>
                        <span className={`font-black min-w-[90px] text-right ${isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ${(p.valueUsd / 1000).toFixed(0)}K
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Rule */}
      <div className="p-3 bg-[#0d111a] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span><b>Order Flow Law:</b> When price trades inside Value Area (VAH to VAL), it rotates between boundaries. Breakouts require high Volume Delta confirmation.</span>
      </div>
    </div>
  );
}
