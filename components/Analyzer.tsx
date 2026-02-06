import React, { useState } from 'react';
import { AnalysisResult, RiskLevel } from '../types';
import { analyzeMarket } from '../services/geminiService';
import { Loader2, BrainCircuit, Search, Bot, Server, Lock } from 'lucide-react';

interface AnalyzerProps {
  onAddAnalysis: (result: AnalysisResult) => void;
}

export const Analyzer: React.FC<AnalyzerProps> = ({ onAddAnalysis }) => {
  const [marketText, setMarketText] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0.50');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!marketText) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeMarket(marketText, description || "No description provided", parseFloat(price));
      onAddAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center p-6 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold mb-6">
          <BrainCircuit className="w-4 h-4" />
          Talos Consensus Engine v1.0
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
          Audit any <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Prediction Market</span>
        </h2>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Paste a market title. Our AI Agent scans for ambiguity traps and calculates fair value.
        </p>
      </div>

      <div className="w-full bg-[#1e293b]/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-6 space-y-4">
        
        {/* Consensus Architecture Visualization (Grant Bait) */}
        <div className="grid grid-cols-3 gap-2 mb-4 p-2 bg-slate-900/50 rounded-lg border border-slate-800">
            <div className="flex items-center justify-center gap-2 py-2 rounded bg-emerald-900/20 border border-emerald-900/50">
                <div className="relative">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                </div>
                <div className="flex flex-col text-left">
                    <span className="text-[10px] text-emerald-400 font-bold leading-none">GEMINI PRO</span>
                    <span className="text-[8px] text-emerald-600 font-mono">NODE ACTIVE</span>
                </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 py-2 rounded bg-slate-800/20 border border-slate-800 opacity-60">
                <Server className="w-4 h-4 text-slate-500" />
                <div className="flex flex-col text-left">
                    <span className="text-[10px] text-slate-500 font-bold leading-none">GPT-4o</span>
                    <span className="text-[8px] text-slate-600 font-mono flex items-center gap-1"><Lock className="w-2 h-2"/> LOCKED</span>
                </div>
            </div>

            <div className="flex items-center justify-center gap-2 py-2 rounded bg-slate-800/20 border border-slate-800 opacity-60">
                <Server className="w-4 h-4 text-slate-500" />
                <div className="flex flex-col text-left">
                    <span className="text-[10px] text-slate-500 font-bold leading-none">CLAUDE 3.5</span>
                    <span className="text-[8px] text-slate-600 font-mono flex items-center gap-1"><Lock className="w-2 h-2"/> LOCKED</span>
                </div>
            </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Market Title / Question</label>
          <input 
            type="text" 
            value={marketText}
            onChange={(e) => setMarketText(e.target.value)}
            placeholder="e.g. Will Bitcoin hit $100k by 2025?"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Resolution Rules (Optional)</label>
                <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Paste the 'Rules' section here to check for scam wording..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500 h-24 resize-none"
                />
             </div>
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Current Price ($)</label>
                <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-500">$</span>
                    <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        max="1"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-4 py-3 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div className="text-[10px] text-slate-500 mt-2">Implied Prob: {Math.round(parseFloat(price)*100)}%</div>
             </div>
        </div>

        <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-xl transition-all transform hover:scale-[1.01] ${
                isAnalyzing ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
            }`}
        >
            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {isAnalyzing ? 'Running Neural Analysis...' : 'Execute Audit Scan'}
        </button>

      </div>
      
      {/* Quick Templates */}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {[
            {label: 'Election Audit', text: 'Will Trump win the 2024 Election?', price: '0.45'},
            {label: 'Crypto Breakout', text: 'Solana above $200 by Friday?', price: '0.30'},
            {label: 'Ambiguous Tech', text: 'Will GPT-5 be released in Q2?', price: '0.15'}
        ].map((t, i) => (
            <button 
                key={i}
                onClick={() => { setMarketText(t.text); setPrice(t.price); }}
                className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400 hover:text-white hover:border-blue-500 transition-colors"
            >
                {t.label}
            </button>
        ))}
      </div>
    </div>
  );
};