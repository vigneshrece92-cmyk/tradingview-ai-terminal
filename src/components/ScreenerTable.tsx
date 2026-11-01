'use client';

import React, { useState } from 'react';
import { Recommendation, ScreenerItem } from '@/types/trading';
import { ArrowDownRight, ArrowUpRight, Filter, Flame, Layers, Search } from 'lucide-react';

interface ScreenerTableProps {
  items: ScreenerItem[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

const BADGE_COLORS: Record<Recommendation, string> = {
  STRONG_BUY: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  BUY: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  NEUTRAL: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  SELL: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  STRONG_SELL: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

export default function ScreenerTable({
  items,
  selectedSymbol,
  onSelectSymbol,
}: ScreenerTableProps) {
  const [search, setSearch] = useState('');
  const [marketFilter, setMarketFilter] = useState<'all' | 'crypto' | 'stocks'>('all');
  const [ratingFilter, setRatingFilter] = useState<'all' | 'buy' | 'sell' | 'squeeze'>('all');

  const filteredItems = items.filter((item) => {
    // Search match
    const matchSearch =
      item.symbol.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;

    // Market match
    if (marketFilter !== 'all' && item.market !== marketFilter) return false;

    // Rating match
    if (ratingFilter === 'buy' && !item.recommendation.includes('BUY')) return false;
    if (ratingFilter === 'sell' && !item.recommendation.includes('SELL')) return false;
    if (ratingFilter === 'squeeze' && !item.squeeze) return false;

    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#111723] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Screener Controls */}
      <div className="p-3 bg-[#131b29] border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-blue-400" />
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider">AI Market Screener</h3>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono text-[11px] border border-blue-500/20">
            {filteredItems.length} Matches
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search crypto or stocks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#0b0e14] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-1 text-[11px] overflow-x-auto pb-1">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMarketFilter('all')}
              className={`px-2 py-0.5 rounded transition-colors ${
                marketFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setMarketFilter('crypto')}
              className={`px-2 py-0.5 rounded transition-colors ${
                marketFilter === 'crypto' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Crypto
            </button>
            <button
              onClick={() => setMarketFilter('stocks')}
              className={`px-2 py-0.5 rounded transition-colors ${
                marketFilter === 'stocks' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Stocks
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setRatingFilter('buy')}
              className={`px-2 py-0.5 rounded transition-colors ${
                ratingFilter === 'buy' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Buys
            </button>
            <button
              onClick={() => setRatingFilter('squeeze')}
              className={`flex items-center gap-0.5 px-2 py-0.5 rounded transition-colors ${
                ratingFilter === 'squeeze' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Flame size={11} /> Squeeze
            </button>
            {(marketFilter !== 'all' || ratingFilter !== 'all') && (
              <button
                onClick={() => {
                  setMarketFilter('all');
                  setRatingFilter('all');
                }}
                className="text-slate-500 hover:text-slate-300 underline text-[10px] ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {filteredItems.map((item) => {
          const isSelected = item.symbol === selectedSymbol;
          const isPositive = item.change24h >= 0;

          return (
            <div
              key={item.symbol}
              onClick={() => onSelectSymbol(item.symbol)}
              className={`flex items-center justify-between p-2.5 text-xs cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-600/15 border-l-2 border-blue-500' : 'hover:bg-slate-800/40'
              }`}
            >
              {/* Symbol & Name */}
              <div className="flex flex-col min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-100">{item.symbol}</span>
                  {item.squeeze && (
                    <span className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/30">
                      SQZ
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 truncate">{item.name}</span>
              </div>

              {/* Price & Change */}
              <div className="flex flex-col items-end min-w-[70px]">
                <span className="font-mono font-semibold text-slate-100">
                  ${item.price < 1 ? item.price.toFixed(4) : item.price.toLocaleString()}
                </span>
                <div className={`flex items-center text-[11px] font-mono font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  <span>{isPositive ? '+' : ''}{item.change24h}%</span>
                </div>
              </div>

              {/* Recommendation Badge */}
              <div className="min-w-[85px] text-right">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                    BADGE_COLORS[item.recommendation] || BADGE_COLORS.NEUTRAL
                  }`}
                >
                  {item.recommendation.replace('_', ' ')}
                </span>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            No assets match current filters.
          </div>
        )}
      </div>
    </div>
  );
}
