
import type { Coin, GlobalStats } from '../types';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const BINANCE_API_BASE = 'https://api.binance.com/api/v3';
const RSI_LENGTH = 14;
const KLINE_LIMIT = 300;

const STABLECOIN_SYMBOLS = new Set(['usdt', 'usdc', 'busd', 'dai', 'tusd', 'ustc', 'usdp', 'ust', 'frax', 'lusd', 'gusd', 'usdn', 'fdusd']);

const getBinanceSymbols = async (): Promise<Set<string>> => {
    try {
        const response = await fetch(`${BINANCE_API_BASE}/exchangeInfo`);
        if (!response.ok) throw new Error('Failed to fetch Binance exchange info');
        const data = await response.json();
        // Filter for actively TRADING symbols only
        const symbols = new Set<string>(data.symbols.filter((s: any) => s.status === 'TRADING').map((s: any) => s.symbol));
        return symbols;
    } catch (error) {
        console.error("Error fetching Binance symbols:", error);
        return new Set();
    }
};

export const getTopCoins = async (): Promise<Coin[]> => {
  try {
    const [binanceSymbols, allCoinsResponse] = await Promise.all([
        getBinanceSymbols(),
        fetch(`${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false`)
    ]);

    if (!allCoinsResponse.ok) throw new Error('Failed to fetch top coins from CoinGecko');
    const allCoins: Coin[] = await allCoinsResponse.json();

    const filteredCoins = allCoins.filter(coin => {
      const binancePair = `${coin.symbol.toUpperCase()}USDT`;
      
      // 1. Must be on Binance with a USDT pair and be actively trading
      if (!binanceSymbols.has(binancePair)) {
          return false;
      }
      
      // 2. Not a stablecoin
      if (STABLECOIN_SYMBOLS.has(coin.symbol.toLowerCase())) {
        return false;
      }
      
      // 3. Not a wrapped token (heuristic)
      if (coin.name.toLowerCase().startsWith('wrapped') || (coin.symbol.toLowerCase().startsWith('w') && coin.symbol.length > 3)) {
         if (['woo', 'waves'].includes(coin.symbol.toLowerCase())) return true; // exceptions
         return false;
      }

      return true;
    });
    
    const top100 = filteredCoins.slice(0, 100);

    return top100.map(coin => ({ ...coin, binance_pair: `${coin.symbol.toUpperCase()}USDT` }));
  } catch (error) {
    console.error("Error fetching and filtering top coins:", error);
    return [];
  }
};

export const getGlobalStats = async (): Promise<GlobalStats | null> => {
    try {
        const response = await fetch(`${COINGECKO_API_BASE}/global`);
        if (!response.ok) throw new Error('Failed to fetch global stats');
        const data = await response.json();
        return { market_cap_percentage: data.data.market_cap_percentage };
    } catch (error) {
        console.error("Error fetching global stats:", error);
        return null;
    }
};

const computeRSI = (closes: number[], length = RSI_LENGTH): number | undefined => {
  if (!closes || closes.length < length + 1) return undefined;
  const deltas = [];
  for (let i = 1; i < closes.length; i++) deltas.push(closes[i] - closes[i - 1]);
  const gains = deltas.map(x => (x > 0 ? x : 0));
  const losses = deltas.map(x => (x < 0 ? -x : 0));

  let avgGain = gains.slice(0, length).reduce((a, b) => a + b, 0) / length;
  let avgLoss = losses.slice(0, length).reduce((a, b) => a + b, 0) / length;

  for (let i = length; i < gains.length; i++) {
    avgGain = (avgGain * (length - 1) + gains[i]) / length;
    avgLoss = (avgLoss * (length - 1) + losses[i]) / length;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
};

export const fetchKlinesAndComputeRSI = async (pair: string, interval: '5m' | '15m' | '1h' | '4h' | '1d' | '1w'): Promise<number | undefined> => {
  try {
    const url = `${BINANCE_API_BASE}/klines?symbol=${pair}&interval=${interval}&limit=${KLINE_LIMIT}`;
    const response = await fetch(url);
    if (!response.ok) {
      // It's common for pairs not to exist on Binance, so we don't log an error here.
      return undefined;
    }
    const data = await response.json();
    if (!Array.isArray(data)) return undefined;
    
    const closes = data.map(row => parseFloat(row[4]));
    return computeRSI(closes, RSI_LENGTH);
  } catch (error) {
    // console.error(`Error fetching klines for ${pair}:`, error);
    return undefined;
  }
};