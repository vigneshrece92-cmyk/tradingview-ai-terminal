export interface CandleData {
  time: number | string; // Unix timestamp in seconds or YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1D';

export type Recommendation = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';

export interface IndicatorSummary {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    hist: number;
  };
  ema20: number;
  ema50: number;
  ema200: number;
  atr: number;
  adx: number;
}

export interface TechnicalAnalysis {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: string;
  recommendation: Recommendation;
  buyCount: number;
  neutralCount: number;
  sellCount: number;
  oscillatorsRating: Recommendation;
  movingAveragesRating: Recommendation;
  indicators: IndicatorSummary;
}

export interface ScreenerItem {
  symbol: string;
  name: string;
  market: 'crypto' | 'stocks';
  price: number;
  change24h: number;
  volume: string;
  rsi: number;
  recommendation: Recommendation;
  squeeze: boolean;
}

export interface PineScriptItem {
  id: string;
  name: string;
  category: string;
  description: string;
  author: string;
  version: string;
  code: string;
  pythonCode?: string;
}

export interface TradeLog {
  id: string;
  type: 'LONG' | 'SHORT';
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'SIGNAL_REVERSAL';
}

export interface BacktestResult {
  initialCapital: number;
  finalCapital: number;
  netProfit: number;
  netProfitPercent: number;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  trades: TradeLog[];
}

export interface ChartMarker {
  time: number;
  position: 'aboveBar' | 'belowBar';
  color: string;
  shape: 'arrowUp' | 'arrowDown' | 'circle';
  text: string;
}

// Institutional Volume Profile Types
export interface VolumeProfileBucket {
  price: number;
  volume: number;
  buyVolume: number;
  sellVolume: number;
  delta: number;
  isPOC: boolean;
  isVAH: boolean;
  isVAL: boolean;
  isInValueArea: boolean;
}

export interface VolumeProfileData {
  poc: number; // Point of Control
  vah: number; // Value Area High (70% Volume)
  val: number; // Value Area Low (70% Volume)
  totalVolume: number;
  valueAreaVolume: number;
  buckets: VolumeProfileBucket[];
}

// Institutional Order Flow & Cumulative Volume Delta (CVD)
export interface OrderFlowBar {
  time: number;
  price: number;
  buyVolume: number;
  sellVolume: number;
  delta: number;
  cvd: number;
  imbalance: 'BUY_IMBALANCE' | 'SELL_IMBALANCE' | 'NEUTRAL';
}

export interface WhaleTapePrint {
  id: string;
  time: string;
  price: number;
  size: number;
  valueUsd: number;
  side: 'BUY' | 'SELL';
  isAggressive: boolean;
}
