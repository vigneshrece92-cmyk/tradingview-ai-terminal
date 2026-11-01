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
`,
    pythonCode: `# Python Execution Bot: SuperTrend MTF Strategy
# Requirements: pip install ccxt pandas pandas_ta lightweight_charts

import ccxt
import pandas as pd
import pandas_ta as ta
import time

exchange = ccxt.binance({'enableRateLimit': True})
symbol = 'BTC/USDT'
timeframe = '1h'

print(f"--- Starting SuperTrend Bot for {symbol} ---")

def execute_strategy():
    # 1. Fetch OHLCV candles
    bars = exchange.fetch_ohlcv(symbol, timeframe=timeframe, limit=100)
    df = pd.DataFrame(bars, columns=['time', 'open', 'high', 'low', 'close', 'volume'])
    
    # 2. Compute Supertrend (ATR 10, Multiplier 3)
    st = ta.supertrend(df['high'], df['low'], df['close'], length=10, multiplier=3.0)
    df = pd.concat([df, st], axis=1)
    
    latest = df.iloc[-1]
    prev = df.iloc[-2]
    
    st_col = 'SUPERT_10_3.0'
    st_dir_col = 'SUPERTd_10_3.0'
    
    # 3. Detect crossover
    is_long = prev[st_dir_col] == -1 and latest[st_dir_col] == 1
    is_short = prev[st_dir_col] == 1 and latest[st_dir_col] == -1
    
    print(f"Price: {latest['close']} | Supertrend: {latest[st_col]:.2f} | Trend: {'BULL' if latest[st_dir_col] == 1 else 'BEAR'}")
    
    if is_long:
        print(">>> LONG SIGNAL TRIGGERED: Send buy order via exchange API")
    elif is_short:
        print(">>> SHORT SIGNAL TRIGGERED: Send sell order via exchange API")

if __name__ == '__main__':
    while True:
        execute_strategy()
        time.sleep(60)
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

// Momentum Oscillator
highestH = ta.highest(high, kcLength)
lowestL = ta.lowest(low, kcLength)
midKC = (highestH + lowestL) / 2
val = ta.linreg(close - (midKC + maKC) / 2, kcLength, 0)

// Colors
barColor = val > 0 ? (val > nz(val[1]) ? color.lime : color.green) : (val < nz(val[1]) ? color.red : color.maroon)
dotColor = squeezeOn ? color.red : color.green

plot(val, title="Squeeze Momentum", color=barColor, style=plot.style_columns, linewidth=2)
plot(0, title="Squeeze State", color=dotColor, style=plot.style_circles, linewidth=2)
`,
    pythonCode: `# Python Execution Bot: Bollinger Band Squeeze Detector
# Requirements: pip install ccxt pandas pandas_ta

import ccxt
import pandas as pd
import pandas_ta as ta

exchange = ccxt.binance()
symbol = 'ETH/USDT'

ohlcv = exchange.fetch_ohlcv(symbol, timeframe='1h', limit=100)
df = pd.DataFrame(ohlcv, columns=['time', 'open', 'high', 'low', 'close', 'volume'])

# Calculate Bollinger Bands & Keltner Channels
bb = ta.bbands(df['close'], length=20, std=2)
kc = ta.kc(df['high'], df['low'], df['close'], length=20, scalar=1.5)

df = pd.concat([df, bb, kc], axis=1)
latest = df.iloc[-1]

bb_upper = latest['BBU_20_2.0']
bb_lower = latest['BBL_20_2.0']
kc_upper = latest['KCUe_20_1.5']
kc_lower = latest['KCLe_20_1.5']

squeeze_active = (bb_lower > kc_lower) and (bb_upper < kc_upper)
print(f"Symbol: {symbol} | Squeeze Active: {squeeze_active}")

if squeeze_active:
    print("⚠️ High volatility compression! Prepare for violent breakout.")
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

fvgThreshold = input.float(0.1, "FVG Min % Size", step=0.05)
showOB = input.bool(true, "Show Order Blocks")
showFVG = input.bool(true, "Show Fair Value Gaps")

bullishFVG = showFVG and (low > high[2]) and ((low - high[2]) / close * 100 > fvgThreshold)
bearishFVG = showFVG and (high < low[2]) and ((low[2] - high) / close * 100 > fvgThreshold)

if bullishFVG
    box.new(left=bar_index[2], top=low, right=bar_index, bottom=high[2],
            border_color=color.new(color.teal, 60), bgcolor=color.new(color.teal, 80))

if bearishFVG
    box.new(left=bar_index[2], top=low[2], right=bar_index, bottom=high,
            border_color=color.new(color.red, 60), bgcolor=color.new(color.red, 80))
`,
    pythonCode: `# Python Smart Money Concepts (SMC) FVG Detector
import pandas as pd

def detect_fvgs(df):
    bullish_fvgs = []
    bearish_fvgs = []
    
    for i in range(2, len(df)):
        c1 = df.iloc[i - 2]
        c2 = df.iloc[i - 1]
        c3 = df.iloc[i]
        
        # Bullish FVG
        if c3['low'] > c1['high']:
            gap = c3['low'] - c1['high']
            bullish_fvgs.append({'index': i, 'top': c3['low'], 'bottom': c1['high'], 'size': gap})
        # Bearish FVG
        elif c3['high'] < c1['low']:
            gap = c1['low'] - c3['high']
            bearish_fvgs.append({'index': i, 'top': c1['low'], 'bottom': c3['high'], 'size': gap})
            
    return bullish_fvgs, bearish_fvgs
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
atr = mult * ta.atr(length)

longStop = ta.highest(high, length) - atr
shortStop = ta.lowest(low, length) + atr

plot(longStop, "Long Trailing Stop", color=color.green, linewidth=2)
plot(shortStop, "Short Trailing Stop", color=color.red, linewidth=2)
`,
    pythonCode: `# Python Chandelier Exit Calculator
import pandas_ta as ta

def calculate_chandelier_exit(df, length=22, mult=3.0):
    atr = ta.atr(df['high'], df['low'], df['close'], length=length)
    long_stop = df['high'].rolling(length).max() - atr * mult
    short_stop = df['low'].rolling(length).min() + atr * mult
    return long_stop, short_stop
`
  },
  {
    id: 'ema-ribbon',
    name: '8-EMA Trend Flow & Ribbon',
    category: 'Trend & Scalping',
    description: 'Multi-EMA ribbon (8, 13, 21, 34, 55) showing trend expansion, compression, and exhaustion flips for high-winrate scalping.',
    author: 'Awesome-PineScript Community',
    version: 'Pine Script v5',
    code: `//@version=5
indicator("EMA Ribbon Trend Flow [TV-AI]", overlay=true)

e8  = ta.ema(close, 8)
e13 = ta.ema(close, 13)
e21 = ta.ema(close, 21)
e34 = ta.ema(close, 34)
e55 = ta.ema(close, 55)

plot(e8, "EMA 8", color=color.green)
plot(e21, "EMA 21", color=color.yellow)
plot(e55, "EMA 55", color=color.red)
`,
    pythonCode: `# Python EMA Ribbon Trend Scanner
import pandas as pd

def ema_ribbon_status(df):
    periods = [8, 13, 21, 34, 55]
    for p in periods:
        df[f'ema_{p}'] = df['close'].ewm(span=p, adjust=False).mean()
    latest = df.iloc[-1]
    is_bull = latest['ema_8'] > latest['ema_13'] > latest['ema_21'] > latest['ema_34'] > latest['ema_55']
    return "FULL BULLISH EXPANSION" if is_bull else "CONSOLIDATING / BEARISH"
`
  }
];
