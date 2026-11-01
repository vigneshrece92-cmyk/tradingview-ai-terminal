'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CandleData } from '@/types/trading';
import { calculateEMA } from '@/lib/indicators';
import { Eye, EyeOff, Maximize2, RefreshCw } from 'lucide-react';

interface TradingChartProps {
  symbol: string;
  timeframe: string;
  candles: CandleData[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function TradingChart({
  symbol,
  timeframe,
  candles,
  isLoading,
  onRefresh,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const ema20SeriesRef = useRef<any>(null);
  const ema50SeriesRef = useRef<any>(null);
  const ema200SeriesRef = useRef<any>(null);

  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showEMA200, setShowEMA200] = useState(false);
  const [hoverData, setHoverData] = useState<{
    time?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    change?: number;
  } | null>(null);

  // Initialize and update chart
  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    let chart: any = null;
    let isMounted = true;

    async function initChart() {
      const { createChart, ColorType, CrosshairMode } = await import('lightweight-charts');

      if (!containerRef.current || !isMounted) return;

      // Clear any existing canvas
      containerRef.current.innerHTML = '';

      const chartOptions = {
        layout: {
          background: { type: ColorType.Solid, color: '#0d111a' },
          textColor: '#94a3b8',
          fontSize: 12,
        },
        grid: {
          vertLines: { color: '#161e2e' },
          horzLines: { color: '#161e2e' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: '#334155', width: 1, style: 2 },
          horzLine: { color: '#334155', width: 1, style: 2 },
        },
        timeScale: {
          borderColor: '#1e293b',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: '#1e293b',
          scaleMargins: {
            top: 0.1,
            bottom: 0.25,
          },
        },
      };

      chart = createChart(containerRef.current, chartOptions as any);
      chartInstanceRef.current = chart;

      // Candlestick Series
      const candleSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });
      candleSeriesRef.current = candleSeries;

      // Volume Series (histogram at bottom)
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
      volumeSeriesRef.current = volumeSeries;

      // Moving Averages
      const ema20Series = chart.addLineSeries({
        color: '#facc15',
        lineWidth: 1.5,
        title: 'EMA 20',
      });
      ema20SeriesRef.current = ema20Series;

      const ema50Series = chart.addLineSeries({
        color: '#38bdf8',
        lineWidth: 1.5,
        title: 'EMA 50',
      });
      ema50SeriesRef.current = ema50Series;

      const ema200Series = chart.addLineSeries({
        color: '#c084fc',
        lineWidth: 2,
        title: 'EMA 200',
      });
      ema200SeriesRef.current = ema200Series;

      // Format data for lightweight-charts (must be strictly ascending in time)
      const sortedCandles = [...candles].sort((a, b) => Number(a.time) - Number(b.time));
      
      // Ensure strictly unique timestamps
      const uniqueCandles: CandleData[] = [];
      const seenTimes = new Set();
      for (const c of sortedCandles) {
        if (!seenTimes.has(c.time)) {
          seenTimes.add(c.time);
          uniqueCandles.push(c);
        }
      }

      candleSeries.setData(
        uniqueCandles.map((c) => ({
          time: Number(c.time) as any,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        })) as any
      );

      volumeSeries.setData(
        uniqueCandles.map((c) => ({
          time: Number(c.time) as any,
          value: c.volume || 0,
          color: c.close >= c.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
        })) as any
      );

      const closes = uniqueCandles.map((c) => c.close);
      const ema20Values = calculateEMA(closes, 20);
      const ema50Values = calculateEMA(closes, 50);
      const ema200Values = calculateEMA(closes, 200);

      const ema20Data = ema20Values.map((val, idx) => ({
        time: Number(uniqueCandles[idx + (20 - 1)]?.time || uniqueCandles[idx].time) as any,
        value: val,
      }));
      const ema50Data = ema50Values.map((val, idx) => ({
        time: Number(uniqueCandles[idx + (50 - 1)]?.time || uniqueCandles[idx].time) as any,
        value: val,
      }));
      const ema200Data = ema200Values.map((val, idx) => ({
        time: Number(uniqueCandles[idx + (200 - 1)]?.time || uniqueCandles[idx].time) as any,
        value: val,
      }));

      ema20Series.setData(ema20Data as any);
      ema50Series.setData(ema50Data as any);
      ema200Series.setData(ema200Data as any);

      ema20Series.applyOptions({ visible: showEMA20 });
      ema50Series.applyOptions({ visible: showEMA50 });
      ema200Series.applyOptions({ visible: showEMA200 });

      // Crosshair move handler
      chart.subscribeCrosshairMove((param: any) => {
        if (!param || !param.time || !param.seriesData) {
          const last = uniqueCandles[uniqueCandles.length - 1];
          if (last) {
            setHoverData({
              open: last.open,
              high: last.high,
              low: last.low,
              close: last.close,
              volume: last.volume,
              change: Number((((last.close - last.open) / last.open) * 100).toFixed(2)),
            });
          }
          return;
        }

        const candleData = param.seriesData.get(candleSeries);
        const volData = param.seriesData.get(volumeSeries);
        if (candleData) {
          const change = Number((((candleData.close - candleData.open) / candleData.open) * 100).toFixed(2));
          setHoverData({
            open: candleData.open,
            high: candleData.high,
            low: candleData.low,
            close: candleData.close,
            volume: volData ? volData.value : undefined,
            change,
          });
        }
      });

      // Fit content
      chart.timeScale().fitContent();

      // Resize observer
      const handleResize = () => {
        if (containerRef.current && chart) {
          chart.applyOptions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      };

      window.addEventListener('resize', handleResize);
      handleResize();

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chart) chart.remove();
      };
    }

    initChart();

    return () => {
      isMounted = false;
      if (chart) chart.remove();
    };
  }, [candles, symbol, timeframe]);

  // Toggle EMA visibility
  useEffect(() => {
    if (ema20SeriesRef.current) ema20SeriesRef.current.applyOptions({ visible: showEMA20 });
  }, [showEMA20]);

  useEffect(() => {
    if (ema50SeriesRef.current) ema50SeriesRef.current.applyOptions({ visible: showEMA50 });
  }, [showEMA50]);

  useEffect(() => {
    if (ema200SeriesRef.current) ema200SeriesRef.current.applyOptions({ visible: showEMA200 });
  }, [showEMA200]);

  const latestCandle = candles[candles.length - 1] || null;
  const displayData = hoverData || (latestCandle ? {
    open: latestCandle.open,
    high: latestCandle.high,
    low: latestCandle.low,
    close: latestCandle.close,
    volume: latestCandle.volume,
    change: Number((((latestCandle.close - latestCandle.open) / latestCandle.open) * 100).toFixed(2)),
  } : null);

  return (
    <div className="relative flex flex-col h-full w-full bg-[#0d111a] rounded-xl border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* Top Chart Header / Controls */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#111723] border-b border-slate-800 text-xs">
        {/* Left: Active Symbol & OHLCV values */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white tracking-wide">{symbol}</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-[11px] font-semibold border border-blue-500/30">
              {timeframe}
            </span>
          </div>

          {displayData && (
            <div className="hidden sm:flex items-center gap-3 font-mono text-slate-300">
              <span>O: <b className="text-white">${displayData.open?.toFixed(2)}</b></span>
              <span>H: <b className="text-emerald-400">${displayData.high?.toFixed(2)}</b></span>
              <span>L: <b className="text-rose-400">${displayData.low?.toFixed(2)}</b></span>
              <span>C: <b className={displayData.change && displayData.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>${displayData.close?.toFixed(2)}</b></span>
              <span className={`px-1.5 py-0.2 rounded text-[11px] font-semibold ${displayData.change && displayData.change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {displayData.change && displayData.change >= 0 ? '+' : ''}{displayData.change}%
              </span>
            </div>
          )}
        </div>

        {/* Right: Indicator Toggles */}
        <div className="flex items-center gap-2 mt-1 sm:mt-0">
          <button
            onClick={() => setShowEMA20(!showEMA20)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
              showEMA20 ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40' : 'bg-slate-800/50 text-slate-500'
            }`}
          >
            {showEMA20 ? <Eye size={12} /> : <EyeOff size={12} />} EMA 20
          </button>

          <button
            onClick={() => setShowEMA50(!showEMA50)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
              showEMA50 ? 'bg-sky-400/20 text-sky-300 border border-sky-400/40' : 'bg-slate-800/50 text-slate-500'
            }`}
          >
            {showEMA50 ? <Eye size={12} /> : <EyeOff size={12} />} EMA 50
          </button>

          <button
            onClick={() => setShowEMA200(!showEMA200)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
              showEMA200 ? 'bg-purple-400/20 text-purple-300 border border-purple-400/40' : 'bg-slate-800/50 text-slate-500'
            }`}
          >
            {showEMA200 ? <Eye size={12} /> : <EyeOff size={12} />} EMA 200
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Reload Candlestick Feed"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-blue-400' : ''} />
          </button>
        </div>
      </div>

      {/* Main Chart Canvas Area */}
      <div className="relative flex-1 w-full min-h-[420px]" ref={containerRef}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d111a]/80 backdrop-blur-xs z-10">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw size={26} className="animate-spin text-blue-500" />
              <span className="text-xs text-slate-400 font-mono">Fetching live candles...</span>
            </div>
          </div>
        )}

        {/* Chart Watermark */}
        <div className="absolute top-4 left-4 pointer-events-none select-none opacity-10">
          <span className="text-5xl font-black tracking-widest text-white">{symbol}</span>
        </div>
      </div>
    </div>
  );
}
