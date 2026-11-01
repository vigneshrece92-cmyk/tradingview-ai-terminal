import { NextResponse } from 'next/server';
import { ScreenerItem } from '@/types/trading';

const INITIAL_WATCHLIST: ScreenerItem[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', market: 'crypto', price: 69450.0, change24h: 3.42, volume: '2.8B', rsi: 62.4, recommendation: 'STRONG_BUY', squeeze: false },
  { symbol: 'ETHUSDT', name: 'Ethereum', market: 'crypto', price: 2548.2, change24h: 1.85, volume: '1.2B', rsi: 54.1, recommendation: 'BUY', squeeze: true },
  { symbol: 'SOLUSDT', name: 'Solana', market: 'crypto', price: 184.6, change24h: 6.72, volume: '950M', rsi: 68.9, recommendation: 'STRONG_BUY', squeeze: false },
  { symbol: 'BNBUSDT', name: 'BNB', market: 'crypto', price: 592.1, change24h: -0.45, volume: '410M', rsi: 48.2, recommendation: 'NEUTRAL', squeeze: true },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', market: 'crypto', price: 0.165, change24h: 8.90, volume: '620M', rsi: 74.5, recommendation: 'STRONG_BUY', squeeze: false },
  { symbol: 'XRPUSDT', name: 'Ripple', market: 'crypto', price: 0.528, change24h: -1.20, volume: '310M', rsi: 42.1, recommendation: 'SELL', squeeze: true },
  { symbol: 'NVDA', name: 'NVIDIA Corp', market: 'stocks', price: 139.8, change24h: 2.65, volume: '4.1B', rsi: 66.8, recommendation: 'STRONG_BUY', squeeze: true },
  { symbol: 'AAPL', name: 'Apple Inc', market: 'stocks', price: 232.5, change24h: 0.40, volume: '1.8B', rsi: 51.2, recommendation: 'BUY', squeeze: false },
  { symbol: 'TSLA', name: 'Tesla Inc', market: 'stocks', price: 262.1, change24h: -2.15, volume: '3.4B', rsi: 44.6, recommendation: 'SELL', squeeze: false },
  { symbol: 'AMD', name: 'Advanced Micro Devices', market: 'stocks', price: 156.4, change24h: 1.10, volume: '890M', rsi: 53.0, recommendation: 'BUY', squeeze: true },
  { symbol: 'SPY', name: 'S&P 500 ETF', market: 'stocks', price: 586.2, change24h: 0.55, volume: '5.2B', rsi: 58.7, recommendation: 'BUY', squeeze: false },
  { symbol: 'QQQ', name: 'Invesco QQQ', market: 'stocks', price: 496.8, change24h: 0.95, volume: '3.9B', rsi: 61.3, recommendation: 'BUY', squeeze: false },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get('market') || 'all';

  let items = [...INITIAL_WATCHLIST];
  if (market !== 'all') {
    items = items.filter((item) => item.market === market);
  }

  // Attempt live 24hr ticker updates for crypto symbols from Binance public endpoint
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
      next: { revalidate: 20 },
    });
    if (res.ok) {
      const tickers = await res.json();
      const tickerMap = new Map();
      if (Array.isArray(tickers)) {
        for (const t of tickers) {
          tickerMap.set(t.symbol, t);
        }
      }

      items = items.map((item) => {
        if (item.market === 'crypto' && tickerMap.has(item.symbol)) {
          const t = tickerMap.get(item.symbol);
          const price = parseFloat(t.lastPrice);
          const change = parseFloat(t.priceChangePercent);
          const rawVol = parseFloat(t.quoteVolume);
          const volStr = rawVol > 1_000_000_000 ? `${(rawVol / 1_000_000_000).toFixed(1)}B` : `${(rawVol / 1_000_000).toFixed(1)}M`;
          
          return {
            ...item,
            price: Number(price.toFixed(item.price < 1 ? 4 : 2)),
            change24h: Number(change.toFixed(2)),
            volume: volStr,
          };
        }
        return item;
      });
    }
  } catch (err) {
    // Graceful fallback to initial list
  }

  return NextResponse.json({ success: true, count: items.length, items });
}
