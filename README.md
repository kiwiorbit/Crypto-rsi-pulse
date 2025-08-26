
# Crypto RSI Pulse

Welcome to **Crypto RSI Pulse**, your real-time dashboard for advanced cryptocurrency market analysis. Developed by **Kiwi Orbit**, this tool is designed to provide traders and enthusiasts with a powerful, at-a-glance view of market momentum across the top 100 cryptocurrencies.

## Overview

Crypto RSI Pulse monitors a curated list of the top 100 cryptocurrencies, streaming live price data from Binance. Its core feature is the multi-timeframe analysis of the Relative Strength Index (RSI), a key momentum indicator used to identify overbought and oversold conditions in the market.

---

## Key Features

### 📈 Real-time Data
- **Live Prices:** Prices are streamed directly from Binance via a persistent WebSocket connection, ensuring you receive up-to-the-second market data.
- **Market Dominance:** Key metrics like BTC and USDT dominance are displayed prominently, giving you a quick snapshot of the overall market sentiment.

###  curated Coin List
To provide the most relevant data, the app uses a multi-step filtering process:
1.  Fetches the top 250 coins by market capitalization from CoinGecko.
2.  Filters this list to only include assets that are actively trading on Binance with a USDT pair.
3.  Excludes all stablecoins (e.g., USDT, USDC, DAI) and wrapped tokens (e.g., WBTC, WETH).
4.  The final list displays the top 100 coins from this refined selection.

### 📊 Advanced RSI Analysis
The Relative Strength Index (RSI) is a momentum oscillator that measures the speed and change of price movements. RSI values range from 0 to 100. The app calculates and displays RSI across multiple timeframes: **5m, 15m, 1h, 4h, 1d, and 1w**.

To help you instantly spot potential opportunities, Crypto RSI Pulse uses a unique color-coding system for RSI extremes:

-   <span style="color: #67e8f9;">**Flashing Sky Blue (RSI ≤ 30):**</span> Indicates an **oversold** condition. This may suggest that the asset is undervalued and could be poised for a potential price bounce.
-   <span style="color: #f472b6;">**Flashing Pink (70 ≤ RSI < 75):**</span> Indicates an **overbought** condition. This may suggest the asset is overvalued and could be due for a price correction.
-   <span style="color: #ef4444; font-weight: bold;">**Flashing Bold Red (RSI ≥ 75):**</span> Indicates an **extremely overbought** condition, signaling a stronger possibility of an impending price decline.

### 👆 Interactive & Sortable Table
The data table is designed for easy navigation and analysis. You can sort the entire list by clicking on the header of any of the following columns:
- **Asset:** Sorts alphabetically by symbol.
- **Price:** Sorts by the current price.
- **24h Change:** Sorts by the 24-hour price performance.
- **RSI (all timeframes):** Sorts by the RSI value, allowing you to quickly bring the most overbought or oversold assets to the top.

An arrow icon (▲ or ▼) will appear next to the active column header to indicate the current sort order.

---

## How to Use the App

1.  **Monitor the Dashboard:** Keep an eye on the table for live price updates and changes in the RSI values.
2.  **Identify Extremes:** Watch for the colored, flashing RSI values. A screen full of blue might suggest the market is oversold, while a lot of pink and red could signal an overbought market.
3.  **Sort and Analyze:** Click on a column header like `RSI (1h)` to see which assets are the most overbought or oversold on the hourly timeframe. This helps you focus your analysis on the most volatile assets.
4.  **Check Market Context:** Use the BTC and USDT Dominance stats at the top to understand the broader market trend before making any decisions.

---

### ⚠️ Disclaimer

Crypto RSI Pulse is a tool for informational and educational purposes only. It does not provide financial advice. The data presented should be used as a starting point for your own research. Always conduct your own due diligence before making any investment decisions.

Happy trading!
