'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CandleData, ChartMarker } from '@/types/trading';
import { calculateEMA } from '@/lib/indicators';
import { calculateVolumeProfile } from '@/lib/orderflow';
import {
  Activity,
  BarChart3,
  Eye,
  EyeOff,
  Flame,
  Maximize2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Waves,
  Zap,
} from 'lucide-react';

interface TradingChartProps {
  symbol: string;
  timeframe: string;
  candles: CandleData[];
  markers?: ChartMarker[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function TradingChart({
  symbol,
  timeframe,
  candles,
  markers = [],
  isLoading,
  onRefresh,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const deltaSeriesRef = useRef<any>(null);
  const ema20SeriesRef = useRef<any>(null);
  const ema50SeriesRef = useRef<any>(null);
  const ema200SeriesRef = useRef<any>(null);
  const bbUpperSeriesRef = useRef<any>(null);
  const bbLowerSeriesRef = useRef<any>(null);
  const supertrendSeriesRef = useRef<any>(null);

  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showEMA200, setShowEMA200] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showSupertrend, setShowSupertrend] = useState(true);
  const [showVolumeProfile, setShowVolumeProfile] = useState(true);
  const [showDeltaBars, setShowDeltaBars] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);

  const [hoverData, setHoverData] = useState<{
    time?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    change?: number;
    buyVolume?: number;
    sellVolume?: number;
    delta?: number;
    holdStatus?: string;
  } | null>(null);

  // Helper to compute order flow metrics for a candle
  const getCandleOrderFlow = (c: { open: number; close: number; high: number; low: number; volume?: number }) => {
    const vol = c.volume || 1000;
    const body = c.close - c.open;
    const range = (c.high - c.low) || 1;
    const buyFraction = Math.max(0.05, Math.min(0.95, 0.5 + 0.45 * (body / range)));
    const buyVol = Math.round(vol * buyFraction);
    const sellVol = vol - buyVol;
    const delta = buyVol - sellVol;
    const change = Number((((c.close - c.open) / c.open) * 100).toFixed(2));

    let holdStatus = '🟢 STRONG HOLD (Buyers Dominating)';
    if (delta > 0 && change >= 0) holdStatus = '🟢 STRONG HOLD LONG (Buyers Expanding)';
    else if (delta > 0 && change < 0) holdStatus = '🟢 BULL ACCUMULATION (Dip Being Bought)';
    else if (delta < 0 && change > 0) holdStatus = '⚠️ EXHAUSTION DIVERGENCE (Tighten Stop / TP)';
    else if (delta < 0 && change <= 0) holdStatus = '🔴 SELL PRESSURE (Protect Capital / Exit)';

    return { buyVol, sellVol, delta, change, holdStatus };
  };

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    let chart: any = null;
    let isMounted = true;

    async function initChart() {
      const { createChart, ColorType, CrosshairMode } = await import('lightweight-charts');

      if (!containerRef.current || !isMounted) return;

      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.remove();
        } catch (e) {}
        chartInstanceRef.current = null;
      }

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
            top: 0.08,
            bottom: 0.28,
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
          top: 0.85,
          bottom: 0,
        },
      });
      volumeSeriesRef.current = volumeSeries;

      // Order Flow Delta Bars (Candle-by-Candle Buy vs Sell Delta)
      const deltaSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'delta_scale',
      });
      deltaSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.72,
          bottom: 0.16,
        },
      });
      deltaSeriesRef.current = deltaSeries;

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

      // Bollinger Bands Series
      const bbUpperSeries = chart.addLineSeries({
        color: 'rgba(56, 189, 248, 0.4)',
        lineWidth: 1,
        lineStyle: 2,
        title: 'BB Upper',
      });
      bbUpperSeriesRef.current = bbUpperSeries;

      const bbLowerSeries = chart.addLineSeries({
        color: 'rgba(56, 189, 248, 0.4)',
        lineWidth: 1,
        lineStyle: 2,
        title: 'BB Lower',
      });
      bbLowerSeriesRef.current = bbLowerSeries;

      // SuperTrend Series
      const supertrendSeries = chart.addLineSeries({
        color: '#10b981',
        lineWidth: 2,
        title: 'SuperTrend',
      });
      supertrendSeriesRef.current = supertrendSeries;

      // Prepare data
      const sortedCandles = [...candles].sort((a, b) => Number(a.time) - Number(b.time));
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
          color: c.close >= c.open ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
        })) as any
      );

      // Populate Candle Order Flow Delta Bars
      const deltaData = uniqueCandles.map((c) => {
        const { delta } = getCandleOrderFlow(c);
        return {
          time: Number(c.time) as any,
          value: delta,
          color: delta >= 0 ? '#10b981' : '#ef4444',
        };
      });
      deltaSeries.setData(deltaData as any);

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

      // Bollinger Bands calculation
      const bbUpperData: any[] = [];
      const bbLowerData: any[] = [];
      for (let i = 19; i < closes.length; i++) {
        const slice = closes.slice(i - 19, i + 1);
        const mean = slice.reduce((a, b) => a + b, 0) / 20;
        const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 20;
        const stdev = Math.sqrt(variance);
        bbUpperData.push({ time: Number(uniqueCandles[i].time), value: mean + stdev * 2 });
        bbLowerData.push({ time: Number(uniqueCandles[i].time), value: mean - stdev * 2 });
      }

      // SuperTrend calculation
      const supertrendData: any[] = [];
      let stTrend = 1;
      for (let i = 10; i < uniqueCandles.length; i++) {
        const c = uniqueCandles[i];
        const approxAtr = (c.high - c.low) * 1.5;
        const basicUpper = (c.high + c.low) / 2 + approxAtr * 3;
        const basicLower = (c.high + c.low) / 2 - approxAtr * 3;
        if (c.close > basicUpper) stTrend = 1;
        else if (c.close < basicLower) stTrend = -1;
        supertrendData.push({
          time: Number(c.time),
          value: stTrend === 1 ? basicLower : basicUpper,
        });
      }

      ema20Series.setData(ema20Data as any);
      ema50Series.setData(ema50Data as any);
      ema200Series.setData(ema200Data as any);
      bbUpperSeries.setData(bbUpperData as any);
      bbLowerSeries.setData(bbLowerData as any);
      supertrendSeries.setData(supertrendData as any);

      ema20Series.applyOptions({ visible: showEMA20 });
      ema50Series.applyOptions({ visible: showEMA50 });
      ema200Series.applyOptions({ visible: showEMA200 });
      bbUpperSeries.applyOptions({ visible: showBollinger });
      bbLowerSeries.applyOptions({ visible: showBollinger });
      supertrendSeries.applyOptions({ visible: showSupertrend });
      deltaSeries.applyOptions({ visible: showDeltaBars });

      // Volume Profile Price Lines (POC, VAH, VAL)
      if (showVolumeProfile) {
        const vp = calculateVolumeProfile(uniqueCandles, 24, 0.70);
        if (vp.poc > 0) {
          candleSeries.createPriceLine({
            price: vp.poc,
            color: '#f59e0b',
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: 'POC',
          });
          candleSeries.createPriceLine({
            price: vp.vah,
            color: '#38bdf8',
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: 'VAH',
          });
          candleSeries.createPriceLine({
            price: vp.val,
            color: '#06b6d4',
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: 'VAL',
          });
        }
      }

      // Apply markers if provided
      if (markers && markers.length > 0 && showMarkers) {
        try {
          // Strictly sort ascending by time and deduplicate timestamps for Lightweight Charts v4
          const sorted = [...markers]
            .filter((m) => m && !isNaN(Number(m.time)) && seenTimes.has(Number(m.time)))
            .sort((a, b) => Number(a.time) - Number(b.time));

          const deduped: any[] = [];
          const seenMarkerTimes = new Set();
          for (const m of sorted) {
            const t = Number(m.time);
            if (!seenMarkerTimes.has(t)) {
              seenMarkerTimes.add(t);
              deduped.push({
                time: t,
                position: m.position || 'belowBar',
                color: m.color || '#10b981',
                shape: m.shape || 'arrowUp',
                text: m.text || '',
              });
            }
          }
          if (deduped.length > 0) {
            candleSeries.setMarkers(deduped);
          }
        } catch (mErr) {
          console.warn('Marker render safely caught:', mErr);
        }
      }

      // Crosshair move handler
      chart.subscribeCrosshairMove((param: any) => {
        if (!param || !param.time || !param.seriesData) {
          const last = uniqueCandles[uniqueCandles.length - 1];
          if (last) {
            const { buyVol, sellVol, delta, change, holdStatus } = getCandleOrderFlow(last);
            setHoverData({
              open: last.open,
              high: last.high,
              low: last.low,
              close: last.close,
              volume: last.volume,
              change,
              buyVolume: buyVol,
              sellVolume: sellVol,
              delta,
              holdStatus,
            });
          }
          return;
        }

        const candleData = param.seriesData.get(candleSeries);
        const volData = param.seriesData.get(volumeSeries);
        if (candleData) {
          const { buyVol, sellVol, delta, change, holdStatus } = getCandleOrderFlow({
            open: candleData.open,
            close: candleData.close,
            high: candleData.high,
            low: candleData.low,
            volume: volData ? volData.value : 1000,
          });

          setHoverData({
            open: candleData.open,
            high: candleData.high,
            low: candleData.low,
            close: candleData.close,
            volume: volData ? volData.value : undefined,
            change,
            buyVolume: buyVol,
            sellVolume: sellVol,
            delta,
            holdStatus,
          });
        }
      });

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (containerRef.current && chartInstanceRef.current) {
          try {
            chartInstanceRef.current.applyOptions({
              width: containerRef.current.clientWidth,
              height: containerRef.current.clientHeight,
            });
          } catch (e) {}
        }
      };

      window.addEventListener('resize', handleResize);
      handleResize();

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }

    initChart();

    return () => {
      isMounted = false;
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.remove();
        } catch (e) {}
        chartInstanceRef.current = null;
      }
    };
  }, [candles, symbol, timeframe, markers, showMarkers]);

  // Handle toggles
  useEffect(() => {
    if (ema20SeriesRef.current) ema20SeriesRef.current.applyOptions({ visible: showEMA20 });
  }, [showEMA20]);

  useEffect(() => {
    if (ema50SeriesRef.current) ema50SeriesRef.current.applyOptions({ visible: showEMA50 });
  }, [showEMA50]);

  useEffect(() => {
    if (ema200SeriesRef.current) ema200SeriesRef.current.applyOptions({ visible: showEMA200 });
  }, [showEMA200]);

  useEffect(() => {
    if (bbUpperSeriesRef.current) bbUpperSeriesRef.current.applyOptions({ visible: showBollinger });
    if (bbLowerSeriesRef.current) bbLowerSeriesRef.current.applyOptions({ visible: showBollinger });
  }, [showBollinger]);

  useEffect(() => {
    if (supertrendSeriesRef.current) supertrendSeriesRef.current.applyOptions({ visible: showSupertrend });
  }, [showSupertrend]);

  useEffect(() => {
    if (deltaSeriesRef.current) deltaSeriesRef.current.applyOptions({ visible: showDeltaBars });
  }, [showDeltaBars]);

  const latestCandle = candles[candles.length - 1] || null;
  const initialFlow = latestCandle ? getCandleOrderFlow(latestCandle) : null;
  const displayData = hoverData || (latestCandle && initialFlow ? {
    open: latestCandle.open,
    high: latestCandle.high,
    low: latestCandle.low,
    close: latestCandle.close,
    volume: latestCandle.volume,
    change: initialFlow.change,
    buyVolume: initialFlow.buyVol,
    sellVolume: initialFlow.sellVol,
    delta: initialFlow.delta,
    holdStatus: initialFlow.holdStatus,
  } : null);

  return (
    <div className="relative flex flex-col h-full w-full bg-[#0d111a] rounded-xl border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* Top Chart Header / Controls */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-[#111723] border-b border-slate-800 text-xs gap-2">
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
              <span>O: <b className="text-white">${Number(displayData.open || 0).toFixed(2)}</b></span>
              <span>H: <b className="text-emerald-400">${Number(displayData.high || 0).toFixed(2)}</b></span>
              <span>L: <b className="text-rose-400">${Number(displayData.low || 0).toFixed(2)}</b></span>
              <span>C: <b className={(displayData.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>${Number(displayData.close || 0).toFixed(2)}</b></span>
              <span className={`px-1.5 py-0.2 rounded text-[11px] font-semibold ${(displayData.change || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {(displayData.change || 0) >= 0 ? '+' : ''}{Number(displayData.change || 0).toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* Right: Indicator & Order Flow Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowDeltaBars(!showDeltaBars)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black transition-all ${
              showDeltaBars ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800/50 text-slate-500'
            }`}
          >
            <BarChart3 size={11} /> Candle Delta
          </button>

          <button
            onClick={() => setShowVolumeProfile(!showVolumeProfile)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
              showVolumeProfile ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800/50 text-slate-500'
            }`}
          >
            <Waves size={11} /> POC / VAH / VAL
          </button>

          <button
            onClick={() => setShowSupertrend(!showSupertrend)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
              showSupertrend ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800/50 text-slate-500'
            }`}
          >
            <TrendingUp size={11} /> SuperTrend
          </button>

          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
              showBollinger ? 'bg-sky-400/20 text-sky-300 border border-sky-400/40' : 'bg-slate-800/50 text-slate-500'
            }`}
          >
            BB (20,2)
          </button>

          <button
            onClick={() => setShowEMA20(!showEMA20)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              showEMA20 ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40' : 'bg-slate-800/50 text-slate-500'
            }`}
          >
            EMA 20
          </button>

          <button
            onClick={() => setShowEMA50(!showEMA50)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              showEMA50 ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40' : 'bg-slate-800/50 text-slate-500'
            }`}
          >
            EMA 50
          </button>

          <button
            onClick={() => setShowEMA200(!showEMA200)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              showEMA200 ? 'bg-purple-400/20 text-purple-300 border border-purple-400/40' : 'bg-slate-800/50 text-slate-500'
            }`}
          >
            EMA 200
          </button>

          {markers.length > 0 && (
            <button
              onClick={() => setShowMarkers(!showMarkers)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                showMarkers ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800/50 text-slate-500'
              }`}
            >
              <Zap size={11} /> {markers.length} Signals
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Reload Candlestick Feed"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ml-1"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-blue-400' : ''} />
          </button>
        </div>
      </div>

      {/* Real-Time Candle Order Flow & Trade Holding Ribbon */}
      {displayData && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-[#080b11] border-b border-slate-800 text-[11px] font-mono flex-wrap gap-2">
          {/* Candle Buy/Sell & Delta Breakdown */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Candle Order Flow:</span>
            <span className="text-emerald-400 font-bold">🟢 Buy: {displayData.buyVolume?.toLocaleString()}</span>
            <span className="text-rose-400 font-bold">🔴 Sell: {displayData.sellVolume?.toLocaleString()}</span>
            <span
              className={`px-1.5 py-0.2 rounded font-black ${
                (displayData.delta || 0) >= 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              Delta: {(displayData.delta || 0) > 0 ? '+' : ''}{displayData.delta?.toLocaleString()}
            </span>
          </div>

          {/* Trade Holding & Exit Assistant */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold text-[10px] uppercase font-sans">Trade Hold Signal:</span>
            <span
              className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                displayData.holdStatus?.includes('HOLD') || displayData.holdStatus?.includes('ACCUMULATION')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : displayData.holdStatus?.includes('EXHAUSTION')
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {displayData.holdStatus}
            </span>
          </div>
        </div>
      )}

      {/* Main Chart Canvas Area */}
      <div className="relative flex-1 w-full min-h-[460px]" style={{ minHeight: '460px', height: '480px' }}>
        {/* Dedicated Unmanaged Leaf Node for Lightweight Charts Canvas */}
        <div ref={containerRef} className="w-full h-full" style={{ width: '100%', height: '100%' }} />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d111a]/80 backdrop-blur-xs z-10 pointer-events-none">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw size={26} className="animate-spin text-blue-500" />
              <span className="text-xs text-slate-400 font-mono">Fetching live candles...</span>
            </div>
          </div>
        )}

        {/* Chart Watermark */}
        <div className="absolute top-4 left-4 pointer-events-none select-none opacity-10 z-0">
          <span className="text-5xl font-black tracking-widest text-white">{symbol}</span>
        </div>
      </div>
    </div>
  );
}
