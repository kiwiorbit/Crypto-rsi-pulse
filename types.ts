export interface Coin {
  id: string; // coingecko id
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  rsi5m?: number;
  rsi15m?: number;
  rsi1h?: number;
  rsi4h?: number;
  rsi1d?: number;
  rsi1w?: number;
  binance_pair?: string;
}

export interface GlobalStats {
  market_cap_percentage: {
    btc: number;
    usdt: number;
  };
}

export interface AIAnalysis {
  summary: string;
  keyPoints: string[];
}