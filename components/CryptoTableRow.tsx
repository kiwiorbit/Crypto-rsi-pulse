import React from 'react';
import type { Coin } from '../types';
import { ArrowUpIcon, ArrowDownIcon } from './icons';

interface CryptoTableRowProps {
  coin: Coin;
}

const nf = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

const classifyRSI = (val?: number) => {
  if (val == null || isNaN(val)) return 'text-gray-400';
  if (val >= 70 && val < 75) return 'text-pink-400 flash';
  if (val >= 75) return 'text-red-500 flash font-bold';
  if (val <= 30) return 'text-sky-400 flash';
  return 'text-gray-200';
};

const MemoizedCryptoTableRow: React.FC<CryptoTableRowProps> = ({ coin }) => {
    const change = coin.price_change_percentage_24h;
    const isPositive = change >= 0;
        
    return (
    <tr className="border-b border-gray-500/20 hover:bg-gray-500/10 transition-colors duration-200">
      <td className="p-4 align-middle w-72">
        <div className="flex items-center">
          <img src={coin.image} alt={coin.name} className="w-8 h-8 mr-4" />
          <div>
            <div className="font-bold text-white text-md">{coin.symbol.toUpperCase()}</div>
            <div className="text-sm text-gray-400">{coin.name}</div>
          </div>
        </div>
      </td>
      <td className="p-4 text-right align-middle font-mono text-white text-md">
        {nf.format(coin.current_price)}
      </td>
      <td className={`p-4 text-right align-middle font-mono font-semibold text-md ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        <div className="flex items-center justify-end">
            {isPositive ? <ArrowUpIcon className="w-4 h-4 mr-1" /> : <ArrowDownIcon className="w-4 h-4 mr-1" />}
            {change.toFixed(2)}%
        </div>
      </td>
      <td className={`p-4 text-right align-middle font-mono font-bold text-lg ${classifyRSI(coin.rsi5m)}`}>
        {coin.rsi5m?.toFixed(2) ?? 'N/A'}
      </td>
      <td className={`p-4 text-right align-middle font-mono font-bold text-lg ${classifyRSI(coin.rsi15m)}`}>
        {coin.rsi15m?.toFixed(2) ?? 'N/A'}
      </td>
      <td className={`p-4 text-right align-middle font-mono font-bold text-lg ${classifyRSI(coin.rsi1h)}`}>
        {coin.rsi1h?.toFixed(2) ?? 'N/A'}
      </td>
      <td className={`p-4 text-right align-middle font-mono font-bold text-lg ${classifyRSI(coin.rsi4h)}`}>
        {coin.rsi4h?.toFixed(2) ?? 'N/A'}
      </td>
      <td className={`p-4 text-right align-middle font-mono font-bold text-lg ${classifyRSI(coin.rsi1d)}`}>
        {coin.rsi1d?.toFixed(2) ?? 'N/A'}
      </td>
       <td className={`p-4 text-right align-middle font-mono font-bold text-lg ${classifyRSI(coin.rsi1w)}`}>
        {coin.rsi1w?.toFixed(2) ?? 'N/A'}
      </td>
    </tr>
  );
};

export const CryptoTableRow = React.memo(MemoizedCryptoTableRow);