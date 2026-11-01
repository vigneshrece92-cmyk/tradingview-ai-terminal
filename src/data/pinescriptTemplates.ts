import { PineScriptItem } from '@/types/trading';

export const PINESCRIPT_TEMPLATES: PineScriptItem[] = [
  {
    id: 'supertrend-mtf',
    name: 'SuperTrend Multi-Timeframe Strategy',
    category: 'Trend Following',
    description: 'High-probability trend-following strategy using ATR-based Supertrend with higher timeframe trend filter and dynamic trailing stops.',
    author: 'KivancOzbilgic / Awesome-PineScript',
    version: 'Pine Script v5',
    code: `//@version=5
strategy("SuperTrend Multi-Timeframe Strategy [TV-AI]", overlay=true, initial_capital=10000, default_qty_type=strategy.percent_of_equity, default_qty_value=20)

// Inputs
atrPeriod = input.int(10, "ATR Period", minval=1)
factor = input.float(3.0, "ATR Multiplier", step=0.1)
htf = input.timeframe("240", "Higher Timeframe Filter")
useHTF = input.bool(true, "Filter with Higher Timeframe")

// Calculations
[supertrend, direction] = ta.supertrend(factor, atrPeriod)

// HTF Trend confirmation
[htfSupertrend, htfDirection] = request.security(syminfo.tickerid, htf, ta.supertrend(factor, atrPeriod), barmerge.gaps_off, barmerge.lookahead_off)

// Plotting
bodyMiddle = plot((open + close) / 2, display=display.none)
upTrend = plot(direction < 0 ? supertrend : na, "Up Trend", color=color.green, style=plot.style_linebr)
downTrend = plot(direction < 0 ? na : supertrend, "Down Trend", color=color.red, style=plot.style_linebr)
fill(bodyMiddle, upTrend, color.new(color.green, 90), fillgaps=false)
fill(bodyMiddle, downTrend, color.new(color.red, 90), fillgaps=false)

// Trading Logic
longCondition = ta.crossover(close, supertrend) and (not useHTF or htfDirection < 0)
shortCondition = ta.crossunder(close, supertrend) and (not useHTF or htfDirection > 0)

if (longCondition)
    strategy.entry("Long", strategy.long)

if (shortCondition)
    strategy.entry("Short", strategy.short)

// Trailing exits
strategy.exit("Exit Long", "Long", stop=supertrend)
strategy.exit("Exit Short", "Short", stop=supertrend)
`
  },
  {
    id: 'bollinger-squeeze',
    name: 'Bollinger Band Squeeze & Breakout',
    category: 'Volatility / Momentum',
    description: 'Identifies periods of extreme consolidation (Bollinger Bands contracting inside Keltner Channels) and triggers on momentum expansion.',
    author: 'John Carter / Awesome-PineScript',
    version: 'Pine Script v5',
    code: `//@version=5
indicator("TTM Bollinger Squeeze Pro [TV-AI]", overlay=false)

// Inputs
bbLength = input.int(20, "Bollinger Length")
bbMult = input.float(2.0, "Bollinger StdDev")
kcLength = input.int(20, "Keltner Length")
kcMult = input.float(1.5, "Keltner Multiplier")

// Bollinger Bands
basis = ta.sma(close, bbLength)
dev = bbMult * ta.stdev(close, bbLength)
upperBB = basis + dev
lowerBB = basis - dev

// Keltner Channels
maKC = ta.sma(close, kcLength)
rangeKC = ta.atr(kcLength)
upperKC = maKC + rangeKC * kcMult
lowerKC = maKC - rangeKC * kcMult

// Squeeze condition (BB inside KC)
squeezeOn = (lowerBB > lowerKC) and (upperBB < upperKC)
squeezeOff = (lowerBB < lowerKC) and (upperBB > upperKC)

// Momentum Oscillator (Linear Regression of Close - Donchian/SMA mid)
highestH = ta.highest(high, kcLength)
lowestL = ta.lowest(low, kcLength)
midKC = (highestH + lowestL) / 2
val = ta.linreg(close - (midKC + maKC) / 2, kcLength, 0)

// Colors
barColor = val > 0 ? (val > nz(val[1]) ? color.lime : color.green) : (val < nz(val[1]) ? color.red : color.maroon)
dotColor = squeezeOn ? color.red : color.green

plot(val, title="Squeeze Momentum", color=barColor, style=plot.style_columns, linewidth=2)
plot(0, title="Squeeze State", color=dotColor, style=plot.style_circles, linewidth=2)
`
  },
  {
    id: 'order-blocks-fvg',
    name: 'Smart Money: Order Blocks & FVG Detector',
    category: 'SMC / Market Structure',
    description: 'Automates detection of Institutional Order Blocks and Fair Value Gaps (FVG) with mitigated/unmitigated zone tracking.',
    author: 'LuxAlgo / Awesome-PineScript',
    version: 'Pine Script v5',
    code: `//@version=5
indicator("Institutional Order Blocks & FVG [TV-AI]", overlay=true, max_boxes_count=50)

// Inputs
fvgThreshold = input.float(0.1, "FVG Min % Size", step=0.05)
showOB = input.bool(true, "Show Order Blocks")
showFVG = input.bool(true, "Show Fair Value Gaps")

// Bullish FVG: Low of candle 1 is higher than High of candle 3
bullishFVG = showFVG and (low > high[2]) and ((low - high[2]) / close * 100 > fvgThreshold)
// Bearish FVG: High of candle 1 is lower than Low of candle 3
bearishFVG = showFVG and (high < low[2]) and ((low[2] - high) / close * 100 > fvgThreshold)

if bullishFVG
    box.new(left=bar_index[2], top=low, right=bar_index, bottom=high[2],
            border_color=color.new(color.teal, 60), bgcolor=color.new(color.teal, 80))

if bearishFVG
    box.new(left=bar_index[2], top=low[2], right=bar_index, bottom=high,
            border_color=color.new(color.red, 60), bgcolor=color.new(color.red, 80))

// Order Blocks: Last opposing candle before an explosive structural move
isBullishShift = (close > high[1]) and (close[1] > high[2]) and (volume > ta.sma(volume, 20) * 1.5)
if showOB and isBullishShift and close[2] < open[2]
    box.new(left=bar_index[2], top=high[2], right=bar_index + 10, bottom=low[2],
            border_color=color.green, bgcolor=color.new(color.green, 85))
`
  },
  {
    id: 'chandelier-exit',
    name: 'Dynamic Chandelier Trailing Stop',
    category: 'Risk Management',
    description: 'Volatility-based trailing stop designed by Chuck LeBeau to let winning trades run while cutting risk on sudden reversions.',
    author: 'Chuck LeBeau / Awesome-PineScript',
    version: 'Pine Script v5',
    code: `//@version=5
indicator("Dynamic Chandelier Trailing Exit [TV-AI]", overlay=true)

length = input.int(22, "ATR Period")
mult = input.float(3.0, "ATR Multiplier", step=0.25)
useClose = input.bool(true, "Calculate from Close instead of High/Low")

atr = mult * ta.atr(length)

longStop = (useClose ? ta.highest(close, length) : ta.highest(high, length)) - atr
longStopPrev = nz(longStop[1], longStop)
longStop := close[1] > longStopPrev ? math.max(longStop, longStopPrev) : longStop

shortStop = (useClose ? ta.lowest(close, length) : ta.lowest(low, length)) + atr
shortStopPrev = nz(shortStop[1], shortStop)
shortStop := close[1] < shortStopPrev ? math.min(shortStop, shortStopPrev) : shortStop

var int dir = 1
dir := close > shortStopPrev ? 1 : close < longStopPrev ? -1 : dir

plot(dir == 1 ? longStop : na, "Long Stop", color=color.green, linewidth=2, style=plot.style_linebr)
plot(dir == -1 ? shortStop : na, "Short Stop", color=color.red, linewidth=2, style=plot.style_linebr)
`
  },
  {
    id: 'ema-ribbon',
    name: '8-EMA Trend Exhaustion & Ribbon',
    category: 'Trend & Scalping',
    description: 'Multi-EMA ribbon (8, 13, 21, 34, 55) showing trend expansion, compression, and exhaustion exhaustion flips for high-winrate scalping.',
    author: 'Awesome-PineScript Community',
    version: 'Pine Script v5',
    code: `//@version=5
indicator("EMA Ribbon Trend Flow [TV-AI]", overlay=true)

e8  = ta.ema(close, 8)
e13 = ta.ema(close, 13)
e21 = ta.ema(close, 21)
e34 = ta.ema(close, 34)
e55 = ta.ema(close, 55)

plot(e8,  "EMA 8",  color=color.rgb(0, 230, 118, 20), linewidth=1)
plot(e13, "EMA 13", color=color.rgb(0, 200, 83, 20), linewidth=1)
plot(e21, "EMA 21", color=color.rgb(255, 235, 59, 20), linewidth=2)
plot(e34, "EMA 34", color=color.rgb(255, 152, 0, 20), linewidth=1)
plot(e55, "EMA 55", color=color.rgb(244, 67, 54, 20), linewidth=2)

// Bullish alignment
isFullBull = e8 > e13 and e13 > e21 and e21 > e34 and e34 > e55
// Bearish alignment
isFullBear = e8 < e13 and e13 < e21 and e21 < e34 and e34 < e55

bgcolor(isFullBull ? color.new(color.green, 95) : isFullBear ? color.new(color.red, 95) : na)
`
  }
];
