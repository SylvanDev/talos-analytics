import React, { useState, useEffect } from 'react';
import { PolymarketEvent } from '../types';
import { fetchTopMarkets, getMarketUrl } from '../services/polymarketService';
import { scanMarketMetrics, MarketMetrics } from '../services/arbitrageService';
import { ExternalLink, RefreshCw, Filter, DollarSign, Activity, AlertTriangle, Zap } from 'lucide-react';

export const MarketScanner: React.FC = () => {
  const [metrics, setMetrics] = useState<MarketMetrics[]>([]);
  const [loading, setLoading] = useState(false);

  const runScan = async () => {
    setLoading(true);
    const { data } = await fetchTopMarkets();
    if (data.length > 0) {
        const calculated = scanMarketMetrics(data);
        setMetrics(calculated);
    }
    setLoading(false);
  };

  useEffect(() => {
    runScan();
  }, []);

  return (
    <div className="h-full flex flex-col p-6 max-w-7xl mx-auto w-full">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Zap className="w-6 h-6 text-yellow-500" />
                    Arbitrage Scanner (Internal)
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    Detects mispriced spreads within Polymarket (Yes + No {"<"} $1.00)
                </p>
            </div>
            <button 
                onClick={runScan}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold flex items-center gap-2 transition-colors"
                disabled={loading}
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Scanning...' : 'Scan for Alpha'}
            </button>
        </div>

        <div className="flex-grow bg-[#1e293b]/50 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 font-bold">
                        <tr>
                            <th className="p-4 border-b border-slate-700">Newest Markets</th>
                            <th className="p-4 border-b border-slate-700 text-right">Liquidity</th>
                            <th className="p-4 border-b border-slate-700 text-center">Outcome</th>
                            <th className="p-4 border-b border-slate-700 text-center">Price</th>
                            <th className="p-4 border-b border-slate-700 text-right">Internal Spread</th>
                            <th className="p-4 border-b border-slate-700">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                        {metrics.map((m) => {
                            const isArb = m.spread < 1.0;
                            return (
                                <tr key={m.id} className="hover:bg-slate-800/50 transition-colors group">
                                    <td className="p-4 font-medium text-white max-w-xs truncate" title={m.title}>
                                        {m.title}
                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {m.id.substring(0,8)}...</div>
                                    </td>
                                    <td className="p-4 text-right text-slate-300 font-mono">
                                        ${(m.liquidity).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="bg-slate-800 px-2 py-1 rounded text-xs text-blue-300 border border-slate-700">
                                            {m.bestOutcome}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center font-bold text-white font-mono">
                                        {(m.bestPrice * 100).toFixed(1)}¢
                                    </td>
                                    <td className="p-4 text-right font-mono">
                                        <div className={`flex flex-col items-end`}>
                                            <span className={`${isArb ? 'text-emerald-400 font-bold text-base' : 'text-slate-400'}`}>
                                                {m.spread.toFixed(3)}
                                            </span>
                                            {isArb ? (
                                                <span className="text-[10px] bg-emerald-900/30 text-emerald-400 px-1.5 rounded border border-emerald-900/50">
                                                    ARB DETECTED
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-600">Efficient</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <a 
                                        href={`https://polymarket.com/event/${m.id}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-blue-400 hover:text-white flex items-center gap-1 text-xs font-bold"
                                        >
                                            Trade <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </td>
                                </tr>
                            );
                        })}
                        {!loading && metrics.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                                    No active markets found. The API filter might be too strict or API is unreachable.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};