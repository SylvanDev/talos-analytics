import React, { useState, useEffect, useMemo } from 'react';
import { PolymarketEvent } from '../types';
import { fetchTopMarkets, getMarketUrl } from '../services/polymarketService';
import { ExternalLink, TrendingUp, DollarSign, Activity, RefreshCw, Wifi, WifiOff, Network, AlertCircle, Zap, Filter, ArrowDownUp, Search, Clock, ChevronDown, ChevronUp, Info, Calendar } from 'lucide-react';

interface LiveScannerProps {
  campaignName: string;
  onAnalyze?: (title: string, price: number, description: string) => void;
}

type SortOption = 'liquidity' | 'volume' | 'date';
type Category = 'All' | 'Politics' | 'Crypto' | 'Sports' | 'Business' | 'Pop Culture' | 'Science';

const CATEGORIES: Category[] = ['All', 'Politics', 'Crypto', 'Sports', 'Business', 'Pop Culture', 'Science'];

export const LiveScanner: React.FC<LiveScannerProps> = ({ onAnalyze }) => {
  const [markets, setMarkets] = useState<PolymarketEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [connectionSource, setConnectionSource] = useState<string>('Initializing...');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  // Interaction State
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // UI State
  const [sortBy, setSortBy] = useState<SortOption>('liquidity');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async (isManual = false) => {
    if (markets.length === 0) setLoading(true);
    if (isManual) setIsRefetching(true);
    
    setError(false);
    
    const { data, source } = await fetchTopMarkets();
    setConnectionSource(source);

    if (data && data.length > 0) {
        setMarkets(data);
        setLastUpdated(new Date().toLocaleTimeString());
        setErrorMsg('');
    } else {
        if (markets.length === 0) {
            setError(true);
            setErrorMsg(source);
        }
    }
    setLoading(false);
    if (isManual) setTimeout(() => setIsRefetching(false), 500);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 5000); 
    return () => clearInterval(interval);
  }, []);

  // CLIENT-SIDE SORTING & FILTERING
  const processedMarkets = useMemo(() => {
    let result = [...markets];

    // 1. Search Filter
    if (searchQuery) {
        const lower = searchQuery.toLowerCase();
        result = result.filter(m => m.title.toLowerCase().includes(lower) || m.ticker.toLowerCase().includes(lower));
    }

    // 2. Category Filter
    if (selectedCategory !== 'All') {
        result = result.filter(m => 
            m.tags.some(t => t.toLowerCase() === selectedCategory.toLowerCase()) || 
            (selectedCategory === 'Politics' && m.tags.some(t => t.toLowerCase().includes('election') || t.toLowerCase().includes('trump')))
        );
    }

    // 3. Sorting
    result.sort((a, b) => {
        if (sortBy === 'liquidity') return b.liquidity - a.liquidity;
        if (sortBy === 'volume') return b.volume - a.volume;
        if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return 0;
    });

    return result;
  }, [markets, sortBy, searchQuery, selectedCategory]);

  const toggleExpand = (id: string) => {
      setExpandedId(expandedId === id ? null : id);
  };

  // Date Formatting
  const formatEndDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isNew = (createdStr: string) => {
      const created = new Date(createdStr);
      const now = new Date();
      const diffHrs = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      return diffHrs < 48; // New if created in last 48h
  };

  return (
    <div className="flex flex-col h-full gap-4">
      
      {/* HEADER & CONTROLS */}
      <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 shadow-lg space-y-4">
        
        {/* Top Row: Title + Status */}
        <div className="flex justify-between items-center border-b border-slate-800/50 pb-3">
            <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Live Market Feed
            </h3>
            <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                <span className={`flex items-center gap-1 ${error ? 'text-red-400' : 'text-emerald-400'}`}>
                    {error ? <WifiOff className="w-3 h-3"/> : <Wifi className="w-3 h-3"/>}
                    {error ? 'Offline' : 'Live Stream'}
                </span>
                <span className="text-slate-600">|</span>
                <span className="flex items-center gap-1 text-slate-400">
                    <Network className="w-3 h-3" />
                    {connectionSource}
                </span>
            </div>
            </div>
            
            <div className="flex items-center gap-3">
                 {lastUpdated && !error && (
                    <span className="text-xs font-mono text-slate-500 hidden sm:inline-block">
                        Updated: {lastUpdated}
                    </span>
                 )}
                <button
                onClick={() => loadData(true)}
                disabled={loading || isRefetching}
                className={`p-2 rounded-lg text-slate-300 transition-all border ${
                    isRefetching || loading 
                        ? 'bg-slate-800 border-slate-700 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                        : 'bg-blue-600 border-blue-500 hover:bg-blue-500 text-white'
                }`}
                >
                <RefreshCw className={`w-4 h-4 ${isRefetching || loading ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </div>

        {/* Middle Row: Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {CATEGORIES.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                        selectedCategory === cat 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* Bottom Row: Filters */}
        <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-grow relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Search markets..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded pl-9 pr-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                />
            </div>
            
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded px-3 py-2">
                <ArrowDownUp className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500 font-bold uppercase mr-1">Sort:</span>
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-transparent text-sm text-white outline-none cursor-pointer"
                >
                    <option value="liquidity">Liquidity (Highest)</option>
                    <option value="volume">Volume (Highest)</option>
                    <option value="date">Newly Listed</option>
                </select>
            </div>
        </div>

      </div>

      {/* FEED LIST */}
      <div className="flex-grow bg-[#050b14] rounded-lg border border-slate-800 p-4 overflow-hidden relative">
        <div className="h-full overflow-y-auto custom-scrollbar space-y-3">
          
          {/* Loading Initial */}
          {loading && markets.length === 0 && (
             <div className="flex flex-col items-center justify-center h-64 gap-3">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-slate-500 text-sm font-mono">Connecting to Private Gateway...</p>
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
                     <button 
                        onClick={() => loadData(true)} 
                        className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-colors shadow-lg shadow-red-900/20"
                    >
                        RETRY CONNECTION
                    </button>
                </div>
             </div>
          )}
          
          {/* Data List */}
          {processedMarkets.map((market) => {
            const isExpanded = expandedId === market.id;
            
            return (
            <div 
                key={market.id} 
                className={`bg-[#1e293b]/40 border rounded-lg transition-all duration-300 overflow-hidden ${
                    isExpanded ? 'border-blue-500/50 bg-[#1e293b]/60' : 'border-slate-700/50 hover:bg-[#1e293b]/60 hover:border-slate-600'
                }`}
            >
              {/* Main Row (Clickable) */}
              <div 
                onClick={() => toggleExpand(market.id)}
                className="p-4 cursor-pointer relative"
              >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        {market.image ? (
                            <img src={market.image} alt="icon" onError={(e) => e.currentTarget.style.display = 'none'} className="w-10 h-10 rounded-full border border-slate-600 object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-slate-500" />
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="font-bold text-white text-sm md:text-base line-clamp-1 group-hover:text-blue-400 transition-colors">
                                    {market.title}
                                </h4>
                                {isNew(market.createdAt) && (
                                    <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 rounded animate-pulse">NEW</span>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                    {market.ticker}
                                </span>
                                <span className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                    <Activity className="w-3 h-3" />
                                    Vol: ${(market.volume / 1000).toFixed(1)}k
                                </span>
                                <span className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    Liq: ${(market.liquidity / 1000).toFixed(1)}k
                                </span>
                                {/* DATE INDICATOR */}
                                {market.endDate && (
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-800/50 px-1.5 py-0.5 rounded">
                                        <Calendar className="w-3 h-3" />
                                        Ends: {formatEndDate(market.endDate)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                         {market.markets.length > 0 && (
                             <div className="text-right hidden sm:block">
                                 <div className="text-xs text-slate-400">{market.markets[0].outcome}</div>
                                 <div className="font-mono font-bold text-white text-lg">{(market.markets[0].currentPrice * 100).toFixed(1)}%</div>
                             </div>
                         )}
                         {isExpanded ? <ChevronUp className="w-5 h-5 text-blue-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                    </div>
                  </div>

                  {/* Progress Bar (Visible when collapsed) */}
                  {!isExpanded && market.markets.length > 0 && (
                      <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700/50">
                          <div 
                            className="bg-blue-600 h-full rounded-full" 
                            style={{ width: `${market.markets[0].currentPrice * 100}%` }}
                          ></div>
                      </div>
                  )}
              </div>

              {/* EXPANDED DETAILS VIEW */}
              {isExpanded && (
                  <div className="bg-[#0f172a]/50 border-t border-slate-700/50 p-4 animate-in slide-in-from-top-2 duration-200">
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                          <div className="md:col-span-2 space-y-2">
                              <h5 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                  <Info className="w-3 h-3" /> Description / Rules
                              </h5>
                              <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded border border-slate-800 max-h-32 overflow-y-auto custom-scrollbar">
                                  {market.description || "No specific rules provided. Standard Polymarket resolution applies."}
                              </p>
                              {market.tags && market.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                      {market.tags.map(t => (
                                          <span key={t} className="text-[10px] text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                                              #{t}
                                          </span>
                                      ))}
                                  </div>
                              )}
                          </div>
                          
                          <div className="space-y-4">
                              <div>
                                  <h5 className="text-xs font-bold text-slate-500 uppercase mb-1">Details</h5>
                                  <div className="space-y-1">
                                      <div className="flex justify-between text-xs">
                                          <span className="text-slate-400">Ends:</span>
                                          <span className="text-white">{market.endDate ? formatEndDate(market.endDate) : 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                          <span className="text-slate-400">Created:</span>
                                          <span className="text-white">{new Date(market.createdAt).toLocaleDateString()}</span>
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="flex flex-col gap-2 pt-2">
                                  {onAnalyze && market.markets.length > 0 && (
                                     <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAnalyze(market.title, market.markets[0].currentPrice, market.description);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                                     >
                                        <Zap className="w-4 h-4 text-yellow-300" />
                                        RUN AI ANALYSIS
                                     </button>
                                  )}
                                  <a 
                                   href={getMarketUrl(market.slug)} 
                                   target="_blank" 
                                   rel="noreferrer"
                                   onClick={(e) => e.stopPropagation()}
                                   className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors border border-slate-700"
                                  >
                                   <ExternalLink className="w-3 h-3" />
                                   View on Polymarket
                                  </a>
                              </div>
                          </div>
                      </div>

                  </div>
              )}
            </div>
            );
          })}
          
          {!loading && processedMarkets.length === 0 && !error && (
              <div className="text-center py-10 text-slate-500">
                  <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No markets match your filter.
              </div>
          )}

        </div>
      </div>
    </div>
  );
};