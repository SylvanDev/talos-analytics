import React, { useState, useEffect } from 'react';
import { PolymarketEvent } from '../types';
import { fetchTopMarkets, getMarketUrl } from '../services/polymarketService';
import { scanMarketMetrics, MarketMetrics } from '../services/arbitrageService';
import { ExternalLink, RefreshCw, Filter, DollarSign, Activity, AlertTriangle } from 'lucide-react';

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
                    <Activity className="w-6 h-6 text-blue-500" />
                    Market Scanner
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    Real-time analysis of Liquidity, Volume, and Internal Spread.
                </p>
            </div>
            <button 
                onClick={runScan}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold flex items-center gap-2 transition-colors"
                disabled={loading}
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Scanning API...' : 'Refresh Data'}
            </button>
        </div>

        <div className="flex-grow bg-[#1e293b]/50 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 font-bold">
                        <tr>
                            <th className="p-4 border-b border-slate-700">Market</th>
                            <th className="p-4 border-b border-slate-700 text-right">Volume</th>
                            <th className="p-4 border-b border-slate-700 text-right">Liquidity</th>
                            <th className="p-4 border-b border-slate-700 text-center">Outcome</th>
                            <th className="p-4 border-b border-slate-700 text-center">Current Price</th>
                            <th className="p-4 border-b border-slate-700 text-right">Est. Spread</th>
                            <th className="p-4 border-b border-slate-700">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                        {metrics.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-800/50 transition-colors group">
                                <td className="p-4 font-medium text-white max-w-xs truncate" title={m.title}>
                                    {m.title}
                                </td>
                                <td className="p-4 text-right text-slate-300 font-mono">
                                    ${(m.totalVolume).toLocaleString()}
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
                                    <span className={`${
                                        m.spread < 1.0 ? 'text-emerald-400 font-bold' : 'text-slate-500'
                                    }`}>
                                        {(m.spread).toFixed(3)}
                                    </span>
                                    {m.spread < 1.0 && (
                                        <div className="text-[10px] text-emerald-500 uppercase font-bold mt-1">Arb Possible</div>
                                    )}
                                </td>
                                <td className="p-4">
                                     <a 
                                       href={`https://polymarket.com/event/${m.id}`} 
                                       target="_blank" 
                                       rel="noreferrer"
                                       className="text-blue-400 hover:text-white flex items-center gap-1 text-xs font-bold"
                                     >
                                         Open <ExternalLink className="w-3 h-3" />
                                     </a>
                                </td>
                            </tr>
                        ))}
                        {!loading && metrics.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                                    No active markets found. Check connection.
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