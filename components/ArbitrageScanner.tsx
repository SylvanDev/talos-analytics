import React, { useState } from 'react';
import { ArbitrageOpportunity } from '../types';
import { findArbitrageOpportunities } from '../services/arbitrageService';
import { fetchTopMarkets } from '../services/polymarketService';
import { calculateStakes } from '../services/bookmakerService';
import { RefreshCw, Zap, Database, DollarSign, Calculator, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const ArbitrageScanner: React.FC = () => {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastScan, setLastScan] = useState<string>('');
  
  // Bankroll State (Default $1000)
  const [bankroll, setBankroll] = useState<number>(1000);
  
  // Toggle: Show only positive Arbs or All Matches
  const [showAll, setShowAll] = useState<boolean>(true);

  const runScan = async () => {
    setLoading(true);
    setOpportunities([]); // Clear previous
    try {
        // 1. Get Poly Data
        const { data: polyEvents } = await fetchTopMarkets();
        // 2. Find Arbs (Always Real Data)
        const arbs = await findArbitrageOpportunities(polyEvents);
        setOpportunities(arbs);
        setLastScan(new Date().toLocaleTimeString());
    } catch (e) {
        console.error("Scan failed", e);
    } finally {
        setLoading(false);
    }
  };

  const displayedOpps = showAll 
    ? opportunities 
    : opportunities.filter(o => o.profitMargin > 0);

  return (
    <div className="h-full flex flex-col p-6 max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <div>
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                    <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400/20" />
                    Polymarket vs BetBoom
                </h2>
                <p className="text-slate-400 text-sm mt-2 max-w-xl">
                    Live Arbitrage Scanner. Comparing real-time odds from BetBoom (Esports) against Polymarket liquidity.
                </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full lg:w-auto">
                
                {/* Controls */}
                <div className="flex items-center gap-2">
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-700 flex items-center gap-3 shadow-inner">
                        <div className="bg-slate-800 p-2 rounded-lg">
                            <Calculator className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Bankroll</label>
                            <div className="flex items-center">
                                <span className="text-slate-400 text-sm font-mono mr-1">$</span>
                                <input 
                                    type="number" 
                                    value={bankroll}
                                    onChange={(e) => setBankroll(Number(e.target.value))}
                                    className="bg-transparent text-white font-mono font-bold outline-none w-20"
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowAll(!showAll)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center w-16 h-[58px] transition-colors ${
                            showAll 
                            ? 'bg-slate-800 border-blue-500/50 text-blue-400' 
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'
                        }`}
                        title={showAll ? "Showing All Matches" : "Showing Only Arbs"}
                    >
                        {showAll ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        <span className="text-[9px] font-bold uppercase mt-1">
                            {showAll ? 'ALL' : 'ARBS'}
                        </span>
                    </button>
                </div>
                
                <button 
                    onClick={runScan}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 whitespace-nowrap h-[58px]"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Scanning...' : 'Scan Now'}
                </button>
            </div>
        </div>

        {/* Results Grid */}
        {displayedOpps.length === 0 && !loading ? (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-12">
                <Database className="w-16 h-16 mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-slate-300">No Matches Found</h3>
                <p className="text-sm mt-2 max-w-md text-center">
                    {showAll 
                        ? "Scanned markets but found no matching events between Polymarket and BetBoom." 
                        : "Matches found, but no profitable Arbs (> 0%). Toggle 'ALL' to see potential matches."}
                </p>
                {opportunities.length > 0 && !showAll && (
                     <div className="mt-4 px-4 py-2 bg-slate-800 rounded-full text-xs font-bold text-blue-400 animate-pulse">
                        {opportunities.length} Negative EV matches hidden. Click EYE icon to view.
                     </div>
                )}
                {lastScan && <div className="mt-4 text-xs font-mono text-slate-600">Last scan: {lastScan}</div>}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedOpps.map((arb) => {
                    const polyOdds = 1 / arb.polymarketPrice;
                    const { stake1, stake2, profit } = calculateStakes(bankroll, polyOdds, arb.bookmakerOdds);
                    const isProfitable = arb.profitMargin > 0;

                    return (
                        <div key={arb.id} className={`bg-[#1e293b]/50 border rounded-xl overflow-hidden transition-colors group flex flex-col ${
                            isProfitable ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-slate-700 hover:border-blue-500/50'
                        }`}>
                            
                            {/* Profit Header */}
                            <div className={`p-4 border-b flex justify-between items-center ${
                                isProfitable ? 'bg-emerald-900/20 border-emerald-900/50' : 'bg-slate-900/80 border-slate-700'
                            }`}>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold font-mono border ${
                                        isProfitable 
                                        ? 'bg-emerald-500 text-black border-emerald-400' 
                                        : 'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}>
                                        {arb.profitMargin > 0 ? '+' : ''}{(arb.profitMargin * 100).toFixed(2)}%
                                    </span>
                                    <span className="text-xs text-slate-500 font-mono">
                                        Match: {(arb.confidence * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className={`font-bold text-sm flex items-center gap-1 px-2 py-1 rounded border ${
                                    isProfitable 
                                    ? 'text-emerald-400 bg-emerald-950/50 border-emerald-900/30' 
                                    : 'text-slate-400 bg-slate-900 border-slate-700'
                                }`}>
                                    <DollarSign className="w-3.5 h-3.5" />
                                    {profit.toFixed(2)}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-6 flex-grow">
                                
                                {/* Side A: Polymarket */}
                                <div className="relative">
                                    <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r"></div>
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                                        Polymarket
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <div className="pr-2">
                                            <div className="text-white font-bold text-sm line-clamp-1" title={arb.polymarketEvent}>{arb.polymarketEvent}</div>
                                            <div className="text-blue-400 text-xs mt-0.5 font-bold">{arb.polymarketOutcome}</div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-white font-mono font-bold">{(arb.polymarketPrice * 100).toFixed(1)}¢</div>
                                            <div className="text-slate-500 text-[10px]">Odds: {polyOdds.toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Separator */}
                                <div className="flex items-center gap-4">
                                    <div className="h-px bg-slate-700 flex-grow"></div>
                                    <div className="text-slate-600 text-[10px] font-bold uppercase">HEDGE WITH</div>
                                    <div className="h-px bg-slate-700 flex-grow"></div>
                                </div>

                                {/* Side B: Bookmaker */}
                                <div className="relative">
                                    <div className={`absolute -left-5 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r ${isProfitable ? 'bg-emerald-500' : 'bg-yellow-500'}`}></div>
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                                        {arb.bookmakerName}
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <div className="pr-2">
                                            <div className="text-white font-bold text-sm line-clamp-1" title={arb.bookmakerEvent}>{arb.bookmakerEvent}</div>
                                            <div className="text-yellow-400 text-xs mt-0.5 font-bold">{arb.bookmakerTeam}</div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-white font-mono font-bold">{arb.bookmakerOdds.toFixed(2)}</div>
                                            <div className="text-slate-500 text-[10px]">Decimal</div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Action Box */}
                            <div className="bg-slate-950 p-4 border-t border-slate-800">
                                {isProfitable ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1">
                                            <a 
                                                href={arb.polymarketUrl} target="_blank" rel="noreferrer"
                                                className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 rounded py-2 text-center text-xs font-bold transition-colors"
                                            >
                                                Bet ${stake1.toFixed(2)}
                                            </a>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <a 
                                                href={arb.bookmakerUrl} target="_blank" rel="noreferrer"
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 rounded py-2 text-center text-xs font-bold transition-colors"
                                            >
                                                Bet ${stake2.toFixed(2)}
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-bold p-2 bg-slate-900 border border-slate-800 rounded opacity-50">
                                        <AlertCircle className="w-4 h-4" />
                                        Negative EV (Monitor Only)
                                    </div>
                                )}
                            </div>

                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};
