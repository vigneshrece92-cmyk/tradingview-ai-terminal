# 📈 TradingView AI Terminal

A complete, production-ready Trading Intelligence web app deployable to **Vercel** with **GitHub** integration. Unifies the 5 open-source trading and MCP repositories into a single responsive dark-mode trading dashboard.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Framework](https://img.shields.io/badge/framework-Next.js%2015-black.svg)
![Styling](https://img.shields.io/badge/styling-Tailwind%20CSS-38bdf8.svg)
![Deployment](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)

---

## 🚀 Unified Architecture

This web application integrates the functionality of the top 5 trading repositories:

| Original Repo | Concept Integrated | Web App Implementation |
| :--- | :--- | :--- |
| **`tradesdontlie/tradingview-mcp`** | Live Chart AI Reading & Auditing | **AI Chart Copilot**: Real-time analysis of support/resistance, RSI/MACD confluence, and actionable trade plans. |
| **`atilaahmettaner/tradingview-mcp`** | AI Market Screener & Multi-Timeframe | **AI Screener**: Multi-asset scanning (Crypto & Stocks) with squeeze flags, rating filters, and instant chart loading. |
| **`lightweight-charts-python`** | TradingView Candlestick Visualizer | **Interactive Lightweight Chart**: Full client-side TradingView chart with volume, EMA 20/50/200 overlays, and crosshair sync. |
| **`python-tradingview-ta`** | 26-Indicator Consensus Rating | **TA Rating Gauge**: Evaluates Moving Averages and Oscillators to output `STRONG_BUY`, `BUY`, `NEUTRAL`, `SELL`, `STRONG_SELL`. |
| **`awesome-pinescript`** | Battle-Tested Pine Script v5 Library | **Pine Script Studio**: 1-click copyable Pine Script v5 strategies (SuperTrend, Bollinger Squeeze, Order Blocks, Chandelier Exit, EMA Ribbon). |

---

## 🛠️ Tech Stack

* **Framework:** Next.js 15 (App Router)
* **Charting:** `@tradingview/lightweight-charts` v4
* **Styling:** Tailwind CSS v4 (TradingView Dark Theme)
* **Icons:** `lucide-react`
* **AI Engine:** Google Gemini 2.0 Flash API (Free Tier) + Built-in Quantitative Heuristic Model (Zero configuration fallback)
* **Data Providers:** Binance Public REST API (Crypto) + High-Fidelity Synthetic Feeds (US Stocks)

---

## 📦 How to Push to GitHub & Deploy to Vercel

### Step 1: Initialize Git Repository
In your terminal, navigate to the project directory:
```bash
cd tradingview-ai-app
git init
git add .
git commit -m "feat: initial release of TradingView AI Terminal"
```

### Step 2: Push to GitHub
1. Go to [GitHub](https://github.com/new) and create a new repository (e.g. `tradingview-ai-terminal`).
2. Run the following commands:
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tradingview-ai-terminal.git
git push -u origin main
```

### Step 3: Deploy to Vercel (1-Click)
1. Go to [Vercel](https://vercel.com/new).
2. Click **"Import"** next to your newly created GitHub repository.
3. Keep default settings (Framework Preset: **Next.js**).
4. Click **"Deploy"**.
5. Your web app is live on a free `*.vercel.app` URL!

---

## 🔑 AI Configuration (Optional)
The app runs **100% out of the box** using its built-in Quantitative Analysis Engine. 

If you want to use real LLM intelligence:
1. Obtain a **free API key** from [Google AI Studio](https://aistudio.google.com/).
2. Click **"Custom Key"** in the top right of the **AI Copilot** panel in the app and paste your key.

---

## 📄 License
MIT License. Created for algorithmic and discretionary traders worldwide.
