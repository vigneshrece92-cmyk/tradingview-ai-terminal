import { CandleData, OrderFlowBar, VolumeProfileBucket, VolumeProfileData, WhaleTapePrint } from '@/types/trading';

/**
 * Institutional Visible Range Volume Profile (VRVP) Calculation
 * Calculates traded volume distribution across price levels, identifying:
 * - POC (Point of Control): Peak institutional liquidity node
 * - VAH (Value Area High): 70% upper volume threshold
 * - VAL (Value Area Low): 70% lower volume threshold
 */
export function calculateVolumeProfile(
  candles: CandleData[],
  bucketCount = 26,
  valueAreaPercent = 0.70
): VolumeProfileData {
  if (candles.length === 0) {
    return { poc: 0, vah: 0, val: 0, totalVolume: 0, valueAreaVolume: 0, buckets: [] };
  }

  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let totalVolume = 0;

  for (const c of candles) {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
    totalVolume += c.volume || 1000;
  }

  if (maxPrice <= minPrice) {
    maxPrice = minPrice + 1;
  }

  const step = (maxPrice - minPrice) / bucketCount;
  const buckets: VolumeProfileBucket[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bucketPrice = minPrice + (i + 0.5) * step;
    buckets.push({
      price: Number(bucketPrice.toFixed(2)),
      volume: 0,
      buyVolume: 0,
      sellVolume: 0,
      delta: 0,
      isPOC: false,
      isVAH: false,
      isVAL: false,
      isInValueArea: false,
    });
  }

  // Distribute volume into buckets
  for (const c of candles) {
    const vol = c.volume || 1000;
    const isBull = c.close >= c.open;
    const bodyRatio = Math.abs(c.close - c.open) / ((c.high - c.low) || 1);
    const buyFrac = isBull ? 0.5 + 0.4 * bodyRatio : 0.5 - 0.4 * bodyRatio;
    const sellFrac = 1 - buyFrac;

    const startIdx = Math.max(0, Math.min(bucketCount - 1, Math.floor((c.low - minPrice) / step)));
    const endIdx = Math.max(0, Math.min(bucketCount - 1, Math.floor((c.high - minPrice) / step)));
    const span = Math.max(1, endIdx - startIdx + 1);
    const volPerBucket = vol / span;

    for (let j = startIdx; j <= endIdx; j++) {
      buckets[j].volume += volPerBucket;
      buckets[j].buyVolume += volPerBucket * buyFrac;
      buckets[j].sellVolume += volPerBucket * sellFrac;
    }
  }

  // Calculate delta and find POC
  let maxVol = -1;
  let pocIdx = 0;

  for (let i = 0; i < buckets.length; i++) {
    const b = buckets[i];
    b.volume = Math.round(b.volume);
    b.buyVolume = Math.round(b.buyVolume);
    b.sellVolume = Math.round(b.sellVolume);
    b.delta = b.buyVolume - b.sellVolume;

    if (b.volume > maxVol) {
      maxVol = b.volume;
      pocIdx = i;
    }
  }

  buckets[pocIdx].isPOC = true;
  const pocPrice = buckets[pocIdx].price;

  // Calculate Value Area (70% Volume symmetric expansion around POC)
  const targetVAVolume = totalVolume * valueAreaPercent;
  let currentVAVolume = buckets[pocIdx].volume;
  buckets[pocIdx].isInValueArea = true;

  let upperIdx = pocIdx;
  let lowerIdx = pocIdx;

  while (currentVAVolume < targetVAVolume && (upperIdx < bucketCount - 1 || lowerIdx > 0)) {
    const nextUpperVol = upperIdx < bucketCount - 1 ? buckets[upperIdx + 1].volume : 0;
    const nextLowerVol = lowerIdx > 0 ? buckets[lowerIdx - 1].volume : 0;

    if (nextUpperVol >= nextLowerVol && upperIdx < bucketCount - 1) {
      upperIdx++;
      currentVAVolume += buckets[upperIdx].volume;
      buckets[upperIdx].isInValueArea = true;
    } else if (lowerIdx > 0) {
      lowerIdx--;
      currentVAVolume += buckets[lowerIdx].volume;
      buckets[lowerIdx].isInValueArea = true;
    } else if (upperIdx < bucketCount - 1) {
      upperIdx++;
      currentVAVolume += buckets[upperIdx].volume;
      buckets[upperIdx].isInValueArea = true;
    } else {
      break;
    }
  }

  buckets[upperIdx].isVAH = true;
  buckets[lowerIdx].isVAL = true;

  return {
    poc: pocPrice,
    vah: buckets[upperIdx].price,
    val: buckets[lowerIdx].price,
    totalVolume: Math.round(totalVolume),
    valueAreaVolume: Math.round(currentVAVolume),
    buckets,
  };
}

/**
 * Order Flow Cumulative Volume Delta (CVD)
 */
export function calculateOrderFlowDelta(candles: CandleData[]): OrderFlowBar[] {
  const bars: OrderFlowBar[] = [];
  let cumulativeDelta = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const vol = c.volume || 1000;
    const range = (c.high - c.low) || 1;
    const body = (c.close - c.open);

    // Order flow approximation using tick footprint heuristic
    const buyFraction = 0.5 + 0.45 * (body / range);
    const buyVol = Math.round(vol * Math.max(0.05, Math.min(0.95, buyFraction)));
    const sellVol = vol - buyVol;
    const delta = buyVol - sellVol;
    cumulativeDelta += delta;

    let imbalance: OrderFlowBar['imbalance'] = 'NEUTRAL';
    if (buyVol > sellVol * 2.5) imbalance = 'BUY_IMBALANCE';
    else if (sellVol > buyVol * 2.5) imbalance = 'SELL_IMBALANCE';

    bars.push({
      time: Number(c.time),
      price: c.close,
      buyVolume: buyVol,
      sellVolume: sellVol,
      delta,
      cvd: cumulativeDelta,
      imbalance,
    });
  }

  return bars;
}

/**
 * Simulated Institutional Large Block Tape (Whale Trades)
 */
export function generateWhalePrints(currentPrice: number, count = 12): WhaleTapePrint[] {
  const prints: WhaleTapePrint[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const offsetSeconds = (count - i) * 15;
    const timeStr = new Date(now - offsetSeconds * 1000).toLocaleTimeString();
    const side: 'BUY' | 'SELL' = Math.random() > 0.45 ? 'BUY' : 'SELL';
    const variance = (Math.random() - 0.5) * currentPrice * 0.004;
    const printPrice = Number((currentPrice + variance).toFixed(2));
    
    // Size between $150k and $2.5M
    const valueUsd = Math.round(Math.random() * 1_800_000 + 200_000);
    const size = Number((valueUsd / printPrice).toFixed(2));

    prints.push({
      id: `WP-${1000 + i}`,
      time: timeStr,
      price: printPrice,
      size,
      valueUsd,
      side,
      isAggressive: valueUsd > 750_000,
    });
  }

  return prints.reverse(); // Newest first
}
