import { BacktestResult, CandleData, ChartMarker, TradeLog } from '@/types/trading';
import { calculateEMA, calculateRSI } from './indicators';
import { calculateVolumeProfile } from './orderflow';

export interface BacktestConfig {
  strategy: 'volume_profile_delta' | 'supertrend' | 'bollinger' | 'ema_cross' | 'rsi_mean_reversion';
  initialCapital: number;
  riskPercent: number; // e.g. 2%
  tpRatio: number; // e.g. 2.0 (1:2 R:R)
  slRatio: number; // e.g. 1.0
  allowShorts: boolean;
}

export function runBacktest(candles: CandleData[], config: BacktestConfig): { result: BacktestResult; markers: ChartMarker[] } {
  const { initialCapital, riskPercent, tpRatio, slRatio, allowShorts, strategy } = config;
  const closes = candles.map((c) => c.close);
  const trades: TradeLog[] = [];
  const markers: ChartMarker[] = [];

  let capital = initialCapital;
  let peakCapital = initialCapital;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;

  // Pre-calculate indicators
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);

  // Position tracking
  let activeTrade: {
    type: 'LONG' | 'SHORT';
    entryIndex: number;
    entryPrice: number;
    entryTime: number;
    sl: number;
    tp: number;
    size: number;
  } | null = null;

  for (let i = 50; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];

    // Check exit condition on active trade
    if (activeTrade) {
      let isExit = false;
      let exitPrice = current.close;
      let exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'SIGNAL_REVERSAL' = 'STOP_LOSS';

      if (activeTrade.type === 'LONG') {
        if (current.high >= activeTrade.tp) {
          isExit = true;
          exitPrice = activeTrade.tp;
          exitReason = 'TAKE_PROFIT';
        } else if (current.low <= activeTrade.sl) {
          isExit = true;
          exitPrice = activeTrade.sl;
          exitReason = 'STOP_LOSS';
        }
      } else {
        if (current.low <= activeTrade.tp) {
          isExit = true;
          exitPrice = activeTrade.tp;
          exitReason = 'TAKE_PROFIT';
        } else if (current.high >= activeTrade.sl) {
          isExit = true;
          exitPrice = activeTrade.sl;
          exitReason = 'STOP_LOSS';
        }
      }

      if (isExit) {
        const rawPnl =
          activeTrade.type === 'LONG'
            ? (exitPrice - activeTrade.entryPrice) * activeTrade.size
            : (activeTrade.entryPrice - exitPrice) * activeTrade.size;
        
        const pnlPercent = Number(((rawPnl / (activeTrade.entryPrice * activeTrade.size)) * 100).toFixed(2));
        capital += rawPnl;

        if (capital > peakCapital) peakCapital = capital;
        const dd = peakCapital - capital;
        const ddPct = (dd / peakCapital) * 100;
        if (ddPct > maxDrawdownPercent) {
          maxDrawdown = dd;
          maxDrawdownPercent = ddPct;
        }

        trades.push({
          id: `T-${trades.length + 1}`,
          type: activeTrade.type,
          entryTime: activeTrade.entryTime,
          exitTime: Number(current.time),
          entryPrice: Number(activeTrade.entryPrice.toFixed(2)),
          exitPrice: Number(exitPrice.toFixed(2)),
          pnl: Number(rawPnl.toFixed(2)),
          pnlPercent,
          exitReason,
        });

        markers.push({
          time: Number(current.time),
          position: exitReason === 'TAKE_PROFIT' ? 'aboveBar' : 'belowBar',
          color: exitReason === 'TAKE_PROFIT' ? '#10b981' : '#ef4444',
          shape: exitReason === 'TAKE_PROFIT' ? 'circle' : 'circle',
          text: `${exitReason === 'TAKE_PROFIT' ? 'TP' : 'SL'} ($${rawPnl > 0 ? '+' : ''}${rawPnl.toFixed(0)})`,
        });

        activeTrade = null;
      }
    }

    // Check entry triggers if no active position
    if (!activeTrade && i < candles.length - 2) {
      let signal: 'LONG' | 'SHORT' | null = null;
      const idx20 = i - 30; // offset for ema20
      const idx50 = i - 50; // offset for ema50

      if (strategy === 'ema_cross') {
        const e20Now = ema20[idx20] || current.close;
        const e20Prev = ema20[idx20 - 1] || prev.close;
        const e50Now = ema50[idx50] || current.close;
        const e50Prev = ema50[idx50 - 1] || prev.close;

        if (e20Prev <= e50Prev && e20Now > e50Now) signal = 'LONG';
        else if (allowShorts && e20Prev >= e50Prev && e20Now < e50Now) signal = 'SHORT';
      } else if (strategy === 'volume_profile_delta') {
        const vp = calculateVolumeProfile(candles.slice(Math.max(0, i - 40), i + 1), 20, 0.70);
        const isBull = current.close >= current.open;
        const buyFrac = isBull ? 0.6 : 0.4;
        const delta = (current.volume || 1000) * (buyFrac - (1 - buyFrac));

        if (current.low <= vp.val * 1.004 && current.close >= vp.val && delta > 0) {
          signal = 'LONG';
        } else if (allowShorts && current.high >= vp.vah * 0.996 && current.close <= vp.vah && delta < 0) {
          signal = 'SHORT';
        }
      } else if (strategy === 'rsi_mean_reversion') {
        const rsiSlice = closes.slice(i - 15, i + 1);
        const rsiVal = calculateRSI(rsiSlice, 14);
        if (rsiVal < 32 && current.close > current.open) signal = 'LONG';
        else if (allowShorts && rsiVal > 68 && current.close < current.open) signal = 'SHORT';
      } else {
        // SuperTrend / Squeeze default: trend continuation
        if (current.close > (ema20[idx20] || current.close) && current.close > prev.high) {
          signal = 'LONG';
        } else if (allowShorts && current.close < (ema20[idx20] || current.close) && current.close < prev.low) {
          signal = 'SHORT';
        }
      }

      if (signal) {
        const approxAtr = (current.high - current.low) * 1.5 || current.close * 0.015;
        const slDist = approxAtr * slRatio;
        const tpDist = approxAtr * tpRatio;

        const entryPrice = current.close;
        const sl = signal === 'LONG' ? entryPrice - slDist : entryPrice + slDist;
        const tp = signal === 'LONG' ? entryPrice + tpDist : entryPrice - tpDist;

        // Position size based on risk
        const riskDollar = capital * (riskPercent / 100);
        const size = riskDollar / (slDist || 1);

        activeTrade = {
          type: signal,
          entryIndex: i,
          entryPrice,
          entryTime: Number(current.time),
          sl,
          tp,
          size,
        };

        markers.push({
          time: Number(current.time),
          position: signal === 'LONG' ? 'belowBar' : 'aboveBar',
          color: signal === 'LONG' ? '#22c55e' : '#f43f5e',
          shape: signal === 'LONG' ? 'arrowUp' : 'arrowDown',
          text: `${signal} @ $${entryPrice.toFixed(0)}`,
        });
      }
    }
  }

  const winCount = trades.filter((t) => t.pnl > 0).length;
  const lossCount = trades.filter((t) => t.pnl <= 0).length;
  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? Number(((winCount / totalTrades) * 100).toFixed(1)) : 0;

  const totalWins = trades.filter((t) => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
  const totalLosses = Math.abs(trades.filter((t) => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
  const profitFactor = totalLosses > 0 ? Number((totalWins / totalLosses).toFixed(2)) : totalWins > 0 ? 9.99 : 0;

  const netProfit = Number((capital - initialCapital).toFixed(2));
  const netProfitPercent = Number((((capital - initialCapital) / initialCapital) * 100).toFixed(2));

  return {
    result: {
      initialCapital,
      finalCapital: Number(capital.toFixed(2)),
      netProfit,
      netProfitPercent,
      totalTrades,
      winCount,
      lossCount,
      winRate,
      profitFactor,
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
      maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(1)),
      trades: trades.slice(-25).reverse(), // Last 25 trades
    },
    markers,
  };
}
