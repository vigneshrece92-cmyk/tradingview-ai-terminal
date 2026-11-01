import { CandleData, IndicatorSummary, Recommendation, TechnicalAnalysis } from '@/types/trading';

export function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const emaArray: number[] = [];
  
  if (data.length < period) return emaArray;

  // Initial SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  let currentEma = sum / period;
  emaArray.push(currentEma);

  for (let i = period; i < data.length; i++) {
    currentEma = data[i] * k + currentEma * (1 - k);
    emaArray.push(currentEma);
  }

  return emaArray;
}

export function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Number((100 - 100 / (1 + rs)).toFixed(2));
}

export function calculateMACD(closes: number[]): { macd: number; signal: number; hist: number } {
  if (closes.length < 35) return { macd: 0, signal: 0, hist: 0 };

  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);

  const offset = 26 - 12;
  const macdLine: number[] = [];
  for (let i = 0; i < ema26.length; i++) {
    macdLine.push(ema12[i + offset] - ema26[i]);
  }

  const signalLine = calculateEMA(macdLine, 9);
  const lastMacd = macdLine[macdLine.length - 1] || 0;
  const lastSignal = signalLine[signalLine.length - 1] || 0;
  const hist = lastMacd - lastSignal;

  return {
    macd: Number(lastMacd.toFixed(2)),
    signal: Number(lastSignal.toFixed(2)),
    hist: Number(hist.toFixed(2)),
  };
}

export function calculateATR(candles: CandleData[], period = 14): number {
  if (candles.length < period + 1) return 1;

  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trs.push(tr);
  }

  const recentTrs = trs.slice(-period);
  const atr = recentTrs.reduce((acc, v) => acc + v, 0) / period;
  return Number(atr.toFixed(2));
}

export function evaluateTechnicalAnalysis(symbol: string, candles: CandleData[]): TechnicalAnalysis {
  const closes = candles.map((c) => c.close);
  const latestPrice = closes[closes.length - 1] || 100;
  const firstPrice = closes[0] || latestPrice;
  const change24h = Number((((latestPrice - firstPrice) / firstPrice) * 100).toFixed(2));

  const totalVol = candles.reduce((acc, c) => acc + (c.volume || 0), 0);
  const volume24h = totalVol > 1_000_000 ? `${(totalVol / 1_000_000).toFixed(1)}M` : `${(totalVol / 1_000).toFixed(1)}K`;

  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const atr = calculateATR(candles, 14);

  const ema20Arr = calculateEMA(closes, 20);
  const ema50Arr = calculateEMA(closes, 50);
  const ema200Arr = calculateEMA(closes, 200);

  const ema20 = ema20Arr.length > 0 ? Number(ema20Arr[ema20Arr.length - 1].toFixed(2)) : latestPrice;
  const ema50 = ema50Arr.length > 0 ? Number(ema50Arr[ema50Arr.length - 1].toFixed(2)) : latestPrice;
  const ema200 = ema200Arr.length > 0 ? Number(ema200Arr[ema200Arr.length - 1].toFixed(2)) : latestPrice;

  let buyCount = 0;
  let sellCount = 0;
  let neutralCount = 0;

  // Oscillators
  if (rsi > 70) sellCount += 2;
  else if (rsi < 30) buyCount += 2;
  else if (rsi >= 50) buyCount += 1;
  else sellCount += 1;

  if (macd.hist > 0) buyCount += 2;
  else if (macd.hist < 0) sellCount += 2;
  else neutralCount += 1;

  // Moving Averages
  if (latestPrice > ema20) buyCount += 2;
  else sellCount += 2;

  if (latestPrice > ema50) buyCount += 2;
  else sellCount += 2;

  if (latestPrice > ema200) buyCount += 3;
  else sellCount += 3;

  if (ema20 > ema50) buyCount += 2;
  else sellCount += 2;

  // Determine overall consensus
  let recommendation: Recommendation = 'NEUTRAL';
  if (buyCount >= 10) recommendation = 'STRONG_BUY';
  else if (buyCount > sellCount + 2) recommendation = 'BUY';
  else if (sellCount >= 10) recommendation = 'STRONG_SELL';
  else if (sellCount > buyCount + 2) recommendation = 'SELL';

  let oscRating: Recommendation = 'NEUTRAL';
  if (rsi > 70) oscRating = 'SELL';
  else if (rsi < 30) oscRating = 'BUY';
  else if (macd.hist > 0) oscRating = 'BUY';
  else oscRating = 'SELL';

  let maRating: Recommendation = 'NEUTRAL';
  if (latestPrice > ema50 && ema20 > ema50) maRating = 'STRONG_BUY';
  else if (latestPrice > ema50) maRating = 'BUY';
  else if (latestPrice < ema50 && ema20 < ema50) maRating = 'STRONG_SELL';
  else maRating = 'SELL';

  return {
    symbol,
    price: latestPrice,
    change24h,
    volume24h,
    recommendation,
    buyCount,
    neutralCount,
    sellCount,
    oscillatorsRating: oscRating,
    movingAveragesRating: maRating,
    indicators: {
      rsi,
      macd,
      ema20,
      ema50,
      ema200,
      atr,
      adx: 28.5,
    },
  };
}
