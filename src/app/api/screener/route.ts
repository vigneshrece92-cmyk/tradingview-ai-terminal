import { NextResponse } from 'next/server';
import { ScreenerItem } from '@/types/trading';

const INITIAL_WATCHLIST: ScreenerItem[] = [
  { symbol: 'XAUUSD', name: 'Gold Spot / US Dollar', market: 'stocks', price: 3895.0, change24h: 0.85, volume: '14.2B', rsi: 65.2, recommendation: 'STRONG_BUY', squeeze: true },
  { symbol: 'BTCUSDT', name: 'Bitcoin', market: 'crypto', price: 77920.0, change24h: 2.15, volume: '3.8B', rsi: 64.4, recommendation: 'STRONG_BUY', squeeze: false },
  { symbol: 'ETHUSDT', name: 'Ethereum', market: 'crypto', price: 2650.2, change24h: 1.45, volume: '1.6B', rsi: 54.1, recommendation: 'BUY', squeeze: true },
  { symbol: 'SOLUSDT', name: 'Solana', market: 'crypto', price: 195.4, change24h: 5.72, volume: '1.2B', rsi: 68.9, recommendation: 'STRONG_BUY', squeeze: false },
  { symbol: 'BNBUSDT', name: 'BNB', market: 'crypto', price: 620.1, change24h: -0.25, volume: '480M', rsi: 49.2, recommendation: 'NEUTRAL', squeeze: true },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', market: 'crypto', price: 0.185, change24h: 7.90, volume: '720M', rsi: 72.5, recommendation: 'STRONG_BUY', squeeze: false },
  { symbol: 'XRPUSDT', name: 'Ripple', market: 'crypto', price: 0.582, change24h: 0.80, volume: '390M', rsi: 52.1, recommendation: 'BUY', squeeze: true },
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

  // Live gold spot update from Gold-API
  try {
    const goldRes = await fetch('https://api.gold-api.com/price/XAU', {
      next: { revalidate: 15 },
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (goldRes.ok) {
      const goldData = await goldRes.json();
      if (goldData.price && typeof goldData.price === 'number') {
        items = items.map((item) =>
          item.symbol === 'XAUUSD'
            ? { ...item, price: Number(goldData.price.toFixed(2)) }
            : item
        );
      }
    }
  } catch (err) {
    console.warn('Gold live screener ticker fetch fallback:', err);
  }

  // Attempt live crypto ticker updates from Kraken
  try {
    const krakenRes = await fetch('https://api.kraken.com/0/public/Ticker?pair=XBTUSD,ETHUSD,SOLUSD', {
      next: { revalidate: 20 },
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (krakenRes.ok) {
      const krakenData = await krakenRes.json();
      if (krakenData.result) {
        const r = krakenData.result;
        items = items.map((item) => {
          if (item.symbol === 'BTCUSDT' && r.XXBTZUSD) {
            return { ...item, price: parseFloat(r.XXBTZUSD.c[0]) };
          }
          if (item.symbol === 'ETHUSDT' && r.XETHZUSD) {
            return { ...item, price: parseFloat(r.XETHZUSD.c[0]) };
          }
          if (item.symbol === 'SOLUSDT' && r.SOLUSD) {
            return { ...item, price: parseFloat(r.SOLUSD.c[0]) };
          }
          return item;
        });
      }
    }
  } catch (err) {
    console.warn('Kraken screener ticker fetch fallback:', err);
  }

  return NextResponse.json({
    success: true,
    total: items.length,
    items,
  });
}
