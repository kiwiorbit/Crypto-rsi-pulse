import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Coin, GlobalStats } from './types';
import { getTopCoins, getGlobalStats, fetchKlinesAndComputeRSI } from './services/cryptoService';
import { CryptoTableRow } from './components/CryptoTableRow';
import { ChevronUpIcon, ChevronDownIcon } from './components/icons';

const STATS_REFRESH_INTERVAL = 60000; // 60 seconds
const RSI_REFRESH_INTERVAL = 300000; // 5 minutes

type SortableKey = keyof Coin | 'asset';

const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
};

const App: React.FC = () => {
    const [coins, setCoins] = useState<Record<string, Coin>>({});
    const [coinOrder, setCoinOrder] = useState<string[]>([]);
    const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'asc' | 'desc' }>({ key: 'market_cap', direction: 'desc' });
    const wsRef = useRef<WebSocket | null>(null);

    const updateRSIForCoins = useCallback(async () => {
        const currentCoins = Object.values(coins);
        if (currentCoins.length === 0) return;

        const rsiPromises = currentCoins.map(async (coin) => {
            if (!coin.binance_pair) {
                return { 
                    id: coin.id, 
                    rsi5m: coin.rsi5m,
                    rsi15m: coin.rsi15m,
                    rsi1h: coin.rsi1h,
                    rsi4h: coin.rsi4h,
                    rsi1d: coin.rsi1d,
                    rsi1w: coin.rsi1w,
                };
            }
            
            const [rsi5m, rsi15m, rsi1h, rsi4h, rsi1d, rsi1w] = await Promise.all([
                fetchKlinesAndComputeRSI(coin.binance_pair, '5m'),
                fetchKlinesAndComputeRSI(coin.binance_pair, '15m'),
                fetchKlinesAndComputeRSI(coin.binance_pair, '1h'),
                fetchKlinesAndComputeRSI(coin.binance_pair, '4h'),
                fetchKlinesAndComputeRSI(coin.binance_pair, '1d'),
                fetchKlinesAndComputeRSI(coin.binance_pair, '1w'),
            ]);
            
            return { id: coin.id, rsi5m, rsi15m, rsi1h, rsi4h, rsi1d, rsi1w };
        });

        const rsiResults = await Promise.all(rsiPromises);
        
        setCoins(prevCoins => {
            const newCoins = { ...prevCoins };
            rsiResults.forEach(result => {
                if (newCoins[result.id]) {
                    newCoins[result.id] = {
                        ...newCoins[result.id],
                        rsi5m: result.rsi5m,
                        rsi15m: result.rsi15m,
                        rsi1h: result.rsi1h,
                        rsi4h: result.rsi4h,
                        rsi1d: result.rsi1d,
                        rsi1w: result.rsi1w
                    };
                }
            });
            return newCoins;
        });

    }, [coins]);

    const setupWebSocket = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
        }
        
        const top100Pairs = coinOrder
            .map(id => coins[id]?.binance_pair?.toLowerCase())
            .filter(Boolean)
            .map(pair => `${pair}@trade`);

        if(top100Pairs.length === 0) return;

        const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${top100Pairs.join('/')}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            const { s: symbol, p: priceStr } = msg.data;
            const price = parseFloat(priceStr);

            const coinId = Object.keys(coins).find(id => coins[id].binance_pair === symbol);

            if (coinId) {
                setCoins(prevCoins => {
                    const existingCoin = prevCoins[coinId];
                    if (!existingCoin || existingCoin.current_price === price) return prevCoins;

                    const newCoins = { ...prevCoins };
                    newCoins[coinId] = {
                        ...existingCoin,
                        current_price: price,
                    };
                    return newCoins;
                });
            }
        };

        ws.onclose = () => {
           setTimeout(setupWebSocket, 5000);
        };
        
        ws.onerror = (err) => {
            console.error("WebSocket Error:", err);
            ws.close();
        };

    }, [coins, coinOrder]);


    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            const [initialCoins, initialGlobalStats] = await Promise.all([getTopCoins(), getGlobalStats()]);
            
            const coinsMap: Record<string, Coin> = {};
            const order: string[] = [];
            initialCoins.forEach(c => {
                coinsMap[c.id] = c;
                order.push(c.id);
            });
            
            setCoins(coinsMap);
            setCoinOrder(order);
            setGlobalStats(initialGlobalStats);
            setLoading(false);
        };
        initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!loading && coinOrder.length > 0) {
            setupWebSocket();
            updateRSIForCoins();
            
            const statsInterval = setInterval(() => {
                getGlobalStats().then(setGlobalStats);
            }, STATS_REFRESH_INTERVAL);

            const rsiInterval = setInterval(updateRSIForCoins, RSI_REFRESH_INTERVAL);

            return () => {
                clearInterval(statsInterval);
                clearInterval(rsiInterval);
                if (wsRef.current) {
                    wsRef.current.close();
                }
            };
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, coinOrder]);

    const requestSort = (key: SortableKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig.key !== key && key !== 'asset') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    const sortedCoinOrder = useMemo(() => {
        const sorted = [...coinOrder];
        if (sortConfig) {
            sorted.sort((aId, bId) => {
                const a = coins[aId];
                const b = coins[bId];
                if (!a || !b) return 0;

                let aValue: string | number | undefined;
                let bValue: string | number | undefined;

                if (sortConfig.key === 'asset') {
                    aValue = a.symbol;
                    bValue = b.symbol;
                } else {
                    aValue = a[sortConfig.key as keyof Coin];
                    bValue = b[sortConfig.key as keyof Coin];
                }

                if (aValue === undefined || aValue === null) return 1;
                if (bValue === undefined || bValue === null) return -1;

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sorted;
    }, [coins, coinOrder, sortConfig]);
    
    const headers: { label: string; key: SortableKey; className: string; }[] = [
        { label: 'Asset', key: 'asset', className: 'text-left' },
        { label: 'Price', key: 'current_price', className: 'text-right' },
        { label: '24h Change', key: 'price_change_percentage_24h', className: 'text-right' },
        { label: 'RSI (5m)', key: 'rsi5m', className: 'text-right' },
        { label: 'RSI (15m)', key: 'rsi15m', className: 'text-right' },
        { label: 'RSI (1h)', key: 'rsi1h', className: 'text-right' },
        { label: 'RSI (4h)', key: 'rsi4h', className: 'text-right' },
        { label: 'RSI (1d)', key: 'rsi1d', className: 'text-right' },
        { label: 'RSI (1w)', key: 'rsi1w', className: 'text-right' }
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-inter bg-gradient-to-br from-[#0a0f1f] via-[#101024] to-[#1a142e]">
            <main className="container mx-auto p-4 md:p-8">
                <header className="text-center pt-8 pb-12 relative">
                    <div className="absolute inset-0 bg-grid-pattern opacity-10 z-0"></div>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 animate-hue-rotate">
                        Crypto RSI Pulse
                    </h1>
                    <p className="text-gray-400 mt-3 text-lg font-mono">Real-time RSI analysis for the top 100 cryptocurrencies.</p>
                </header>
                
                {globalStats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">BTC Dominance</p>
                            <p className="text-2xl font-bold text-white">{formatPercentage(globalStats.market_cap_percentage.btc)}</p>
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">USDT Dominance</p>
                            <p className="text-2xl font-bold text-white">{formatPercentage(globalStats.market_cap_percentage.usdt)}</p>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto bg-gray-900/40 backdrop-blur-xl border border-gray-500/20 rounded-2xl shadow-2xl shadow-black/20">
                    <table className="w-full min-w-[1200px]">
                        <thead className="border-b border-gray-500/30">
                            <tr>
                                {headers.map(h => (
                                    <th key={h.key} className={`p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${h.className}`}>
                                        <div onClick={() => requestSort(h.key)} className={`flex items-center cursor-pointer group ${h.key === 'asset' ? 'justify-start' : 'justify-end'}`}>
                                            {h.label}
                                            <span className="ml-2 w-4 h-4">
                                                {sortConfig?.key === h.key ? (
                                                    sortConfig.direction === 'asc' ? 
                                                        <ChevronUpIcon className="w-4 h-4 text-white" /> : 
                                                        <ChevronDownIcon className="w-4 h-4 text-white" />
                                                ) : (
                                                    <ChevronUpIcon className="w-4 h-4 text-transparent group-hover:text-gray-500 transition-colors" />
                                                )}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 20 }).map((_, i) => (
                                    <tr key={i} className="border-b border-gray-500/20 animate-pulse">
                                        <td className="p-4"><div className="flex items-center"><div className="w-8 h-8 rounded-full bg-gray-700 mr-4"></div><div><div className="h-4 w-16 bg-gray-700 rounded"></div><div className="h-3 w-24 bg-gray-700 rounded mt-1"></div></div></div></td>
                                        {[12, 8, 6, 6, 6, 6, 6, 6].map((w, index) => <td key={index} className="p-4"><div className={`h-5 bg-gray-700 rounded w-${w} ml-auto`}></div></td>)}
                                    </tr>
                                ))
                            ) : (
                                sortedCoinOrder.map(id => coins[id] && <CryptoTableRow key={id} coin={coins[id]} />)
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
             <footer className="text-center py-8 mt-12 border-t border-gray-500/20">
                <p className="text-gray-500">
                    Developed by <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">Kiwi Orbit</span>
                </p>
            </footer>
        </div>
    );
};

export default App;