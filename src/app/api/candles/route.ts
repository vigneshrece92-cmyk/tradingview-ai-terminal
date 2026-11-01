import { NextResponse } from 'next/server';
import { CandleData, Timeframe } from '@/types/trading';

// Map timeframe to Binance interval
const binanceIntervalMap: Record<Timeframe, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1D': '1d',
};

// Realistic mock generator when external APIs are throttled or for US equities / Gold
function generateSyntheticCandles(basePrice: number, count = 150, timeframe: Timeframe): CandleData[] {
  const candles: CandleData[] = [];
  const now = Math.floor(Date.now() / 1000);
  
  const stepSeconds: Record<Timeframe, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '4h': 14400,
    '1D': 86400,
  };
  
  const step = stepSeconds[timeframe] || 3600;
  let currentPrice = basePrice * 0.95;
  
  for (let i = count; i >= 0; i--) {
    const time = now - i * step;
    const volatility = currentPrice * 0.008;
    const change = (Math.random() - 0.48) * volatility;
    const open = currentPrice;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 45000 + 12000);

    candles.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const timeframe = (searchParams.get('timeframe') as Timeframe) || '1h';

  const isGold = symbol.toUpperCase() === 'XAUUSD' || symbol.toUpperCase() === 'GOLD';
  const isCrypto = isGold || symbol.endsWith('USDT') || symbol.endsWith('BTC') || ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE'].some(c => symbol.startsWith(c));
  
  // For Gold, map to Binance's live physical-backed PAXGUSDT (Paxos Gold) which tracks exact spot gold price
  const cleanSymbol = isGold ? 'PAXGUSDT' : symbol.replace(/[^A-Z0-9]/g, '');

  if (isCrypto) {
    try {
      const interval = binanceIntervalMap[timeframe] || '1h';
      const formattedSymbol = cleanSymbol.includes('USDT') ? cleanSymbol : `${cleanSymbol}USDT`;
      
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${formattedSymbol}&interval=${interval}&limit=200`,
        { next: { revalidate: 15 } }
      );

      if (res.ok) {
        const rawData = await res.json();
        if (Array.isArray(rawData) && rawData.length > 0) {
          const candles: CandleData[] = rawData.map((d: any) => ({
            time: Math.floor(d[0] / 1000),
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
            volume: parseFloat(d[5]),
          }));
          return NextResponse.json({ success: true, symbol, timeframe, candles });
        }
      }
    } catch (err) {
      console.warn('Binance API fetch fallback triggered:', err);
    }
  }

  // Stock & Commodity base prices
  const stockBasePrices: Record<string, number> = {
    XAUUSD: 2748.5,
    GOLD: 2748.5,
    NVDA: 138.5,
    AAPL: 232.0,
    TSLA: 260.4,
    AMD: 156.2,
    MSFT: 428.0,
    SPY: 585.0,
    QQQ: 495.0,
    BTCUSDT: 69400.0,
    ETHUSDT: 2540.0,
    SOLUSDT: 182.0,
  };

  const basePrice = stockBasePrices[symbol] || 150.0;
  const candles = generateSyntheticCandles(basePrice, 180, timeframe);

  return NextResponse.json({
    success: true,
    symbol,
    timeframe,
    candles,
    isSynthetic: true,
  });
}
