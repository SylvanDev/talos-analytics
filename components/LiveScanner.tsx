import React, { useState, useEffect } from 'react';
import { PolymarketEvent } from '../types';
import { fetchTopMarkets, getMarketUrl } from '../services/polymarketService';
import { ExternalLink, TrendingUp, DollarSign, Activity, RefreshCw, Wifi, WifiOff, Network, AlertCircle } from 'lucide-react';

interface LiveScannerProps {
  campaignName: string;
}

export const LiveScanner: React.FC<LiveScannerProps> = () => {
  const [markets, setMarkets] = useState<PolymarketEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [connectionSource, setConnectionSource] = useState<string>('Initializing...');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setError(false);
    setErrorMsg('');
    setConnectionSource('Connecting...');
    
    const { data, source } = await fetchTopMarkets();
    setConnectionSource(source);

    if (data && data.length > 0) {
        setMarkets(data);
        setLastUpdated(new Date().toLocaleTimeString());
    } else {
        setError(true);
        setErrorMsg(source);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex justify-between items-center shadow-lg">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Live Market Feed
          </h3>
          <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
             <span className={`flex items-center gap-1 ${error ? 'text-red-400' : 'text-emerald-400'}`}>
                {error ? <WifiOff className="w-3 h-3"/> : <Wifi className="w-3 h-3"/>}
                {error ? 'Feed Error' : 'Feed Active'}
             </span>
             <span className="text-slate-600">|</span>
             <span className="flex items-center gap-1 text-slate-400">
                <Network className="w-3 h-3" />
                {connectionSource}
             </span>
             {lastUpdated && !error && (
                 <>
                    <span className="text-slate-600">|</span>
                    <span>{lastUpdated}</span>
                 </>
             )}
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className={`p-2 rounded-lg text-slate-300 transition-colors border ${loading ? 'bg-slate-800 border-slate-700' : 'bg-blue-600 border-blue-500 hover:bg-blue-500 text-white'}`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-grow bg-[#050b14] rounded-lg border border-slate-800 p-4 overflow-hidden relative">
        <div className="h-full overflow-y-auto custom-scrollbar space-y-3">
          
          {/* Loading Initial */}
          {loading && markets.length === 0 && (
             <div className="flex flex-col items-center justify-center h-64 gap-3">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-slate-500 text-sm font-mono">Establishing Uplink...</p>
             </div>
          )}

          {/* Hard Error */}
          {!loading && error && markets.length === 0 && (
             <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-8">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <div>
                    <h4 className="text-white font-bold mb-1">Connection Failed</h4>
                    <p className="text-red-300 text-sm font-mono bg-red-900/20 px-4 py-2 rounded border border-red-900/50 mb-4 max-w-lg mx-auto break-all">
                        {errorMsg}
                    </p>
                    <p className="text-slate-500 text-xs mb-4">
                        Unable to fetch real data from Polymarket API.<br/>
                        This is expected in a restricted preview environment.
                    </p>
                     <button 
                        onClick={loadData} 
                        className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-colors shadow-lg shadow-red-900/20"
                    >
                        RETRY CONNECTION
                    </button>
                </div>
             </div>
          )}
          
          {/* Data List */}
          {markets.map((market) => (
            <div key={market.id} className="bg-[#1e293b]/40 border border-slate-700/50 rounded-lg p-4 hover:border-blue-500/50 transition-all hover:bg-[#1e293b]/80 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-10 transition-opacity">
                <TrendingUp className="w-24 h-24 text-blue-500 -mr-4 -mt-4" />
              </div>
              
              <div className="flex justify-between items-start mb-3 relative z-10">
                 <div className="flex items-center gap-3">
                    {market.image ? (
                        <img src={market.image} alt="icon" onError={(e) => e.currentTarget.style.display = 'none'} className="w-10 h-10 rounded-full border border-slate-600 object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-slate-500" />
                        </div>
                    )}
                    <div>
                        <h4 className="font-bold text-white text-sm md:text-base line-clamp-1 group-hover:text-blue-400 transition-colors mr-8">
                            {market.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                             <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                {market.ticker}
                            </span>
                            <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
                                Vol: ${(market.volume / 1000).toFixed(1)}k
                            </span>
                        </div>
                    </div>
                 </div>
                 <a 
                   href={getMarketUrl(market.slug)} 
                   target="_blank" 
                   rel="noreferrer"
                   className="text-slate-500 hover:text-white p-2 rounded hover:bg-slate-700 transition-colors"
                 >
                   <ExternalLink className="w-4 h-4" />
                 </a>
              </div>
              
              {market.markets.length > 0 && (
                  <div className="mt-3 relative z-10">
                      <div className="flex justify-between items-end text-xs mb-1">
                          <span className="text-slate-400 font-medium">{market.markets[0].outcome}</span>
                          <span className="text-white font-bold font-mono text-sm">{(market.markets[0].currentPrice * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${market.markets[0].currentPrice * 100}%` }}
                          ></div>
                      </div>
                  </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};