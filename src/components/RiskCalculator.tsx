'use client';

import React, { useState } from 'react';
import { Calculator, DollarSign, Percent, ShieldCheck, Target } from 'lucide-react';

interface RiskCalculatorProps {
  currentPrice: number;
}

export default function RiskCalculator({ currentPrice }: RiskCalculatorProps) {
  const [balance, setBalance] = useState(10000);
  const [riskPct, setRiskPct] = useState(1.5);
  const [entryPrice, setEntryPrice] = useState(currentPrice || 100);
  const [stopLoss, setStopLoss] = useState(Number(((currentPrice || 100) * 0.98).toFixed(2)));

  const isLong = entryPrice > stopLoss;
  const slDistance = Math.abs(entryPrice - stopLoss);
  const slPercent = entryPrice > 0 ? ((slDistance / entryPrice) * 100).toFixed(2) : '0';

  const dollarRisk = (balance * (riskPct / 100));
  const units = slDistance > 0 ? dollarRisk / slDistance : 0;
  const positionValue = units * entryPrice;
  const leverageReq = balance > 0 ? (positionValue / balance).toFixed(1) : '1.0';

  const target1 = isLong ? entryPrice + slDistance * 1.5 : entryPrice - slDistance * 1.5;
  const target2 = isLong ? entryPrice + slDistance * 2.0 : entryPrice - slDistance * 2.0;
  const target3 = isLong ? entryPrice + slDistance * 3.0 : entryPrice - slDistance * 3.0;

  const profit1 = dollarRisk * 1.5;
  const profit2 = dollarRisk * 2.0;
  const profit3 = dollarRisk * 3.0;

  return (
    <div className="flex flex-col h-full bg-[#111723] rounded-xl border border-slate-800 shadow-xl overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 bg-[#131b29] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Calculator size={16} className="text-amber-400" />
          <h3 className="font-semibold text-xs text-white uppercase tracking-wider">
            Institutional Risk & Position Sizer
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">Capital Protection Engine</span>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto">
        {/* Left Inputs */}
        <div className="space-y-3 bg-[#0d111a] p-3.5 rounded-xl border border-slate-800/80">
          <h4 className="font-bold text-slate-200 uppercase tracking-wide text-[11px] mb-2">Trade Parameters</h4>

          <div>
            <label className="text-[11px] text-slate-400 font-medium">Account Balance ($)</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(Number(e.target.value))}
              className="w-full mt-1 px-3 py-1.5 bg-[#090d14] border border-slate-700 rounded-lg text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 font-medium">Risk Tolerance (%)</label>
              <input
                type="number"
                step="0.1"
                value={riskPct}
                onChange={(e) => setRiskPct(Number(e.target.value))}
                className="w-full mt-1 px-3 py-1.5 bg-[#090d14] border border-slate-700 rounded-lg text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium">Max Risk ($)</label>
              <div className="mt-1 px-3 py-1.5 bg-[#090d14] border border-slate-800 rounded-lg text-rose-400 font-mono font-black">
                ${dollarRisk.toFixed(2)}
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between">
              <label className="text-[11px] text-slate-400 font-medium">Planned Entry Price ($)</label>
              <button
                onClick={() => setEntryPrice(currentPrice)}
                className="text-[10px] text-blue-400 hover:underline"
              >
                Use Live Price (${currentPrice})
              </button>
            </div>
            <input
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(Number(e.target.value))}
              className="w-full mt-1 px-3 py-1.5 bg-[#090d14] border border-slate-700 rounded-lg text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-medium">Stop-Loss Price ($)</label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(Number(e.target.value))}
              className="w-full mt-1 px-3 py-1.5 bg-[#090d14] border border-slate-700 rounded-lg text-rose-400 font-mono font-bold focus:outline-none focus:border-rose-500"
            />
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              Distance: ${slDistance.toFixed(2)} ({slPercent}%)
            </span>
          </div>
        </div>

        {/* Right Output Dashboard */}
        <div className="space-y-3 flex flex-col justify-between">
          {/* Output Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-[#0d111a] rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Position Size</span>
              <div className="text-base font-black font-mono text-emerald-400 mt-1">
                {units.toFixed(units < 1 ? 4 : 2)} Units
              </div>
              <span className="text-[10px] font-mono text-slate-500">${positionValue.toFixed(2)} Nominal</span>
            </div>

            <div className="p-3 bg-[#0d111a] rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Leverage Required</span>
              <div className="text-base font-black font-mono text-purple-400 mt-1">
                {leverageReq}x
              </div>
              <span className="text-[10px] font-mono text-slate-500">{Number(leverageReq) <= 1 ? 'Spot / No Leverage' : 'Futures / Margin'}</span>
            </div>
          </div>

          {/* Take Profit Target Zones */}
          <div className="bg-[#0d111a] p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold text-[11px]">
              <Target size={13} className="text-emerald-400" />
              <span>Recommended Exit Ladders (Take Profits)</span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Target 1 (1:1.5 R:R):</span>
                <span className="text-emerald-400 font-bold">${target1.toFixed(2)}</span>
                <span className="text-emerald-500 font-semibold">+${profit1.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Target 2 (1:2.0 R:R):</span>
                <span className="text-emerald-400 font-bold">${target2.toFixed(2)}</span>
                <span className="text-emerald-500 font-semibold">+${profit2.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Target 3 (1:3.0 R:R):</span>
                <span className="text-emerald-400 font-bold">${target3.toFixed(2)}</span>
                <span className="text-emerald-500 font-semibold">+${profit3.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            <span>If stop-loss hits, loss is capped at exactly <b>${dollarRisk.toFixed(2)}</b> ({riskPct}%).</span>
          </div>
        </div>
      </div>
    </div>
  );
}
