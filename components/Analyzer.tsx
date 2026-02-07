import React, { useState, useEffect } from 'react';
import { AnalysisResult, RiskLevel } from '../types';
import { analyzeMarket } from '../services/geminiService';
import { Loader2, BrainCircuit, Search, ShieldCheck, TrendingUp, AlertTriangle, Key, DollarSign, Lock, Scale, Zap } from 'lucide-react';

interface AnalyzerProps {
  onAddAnalysis: (result: AnalysisResult) => void;
}

export const Analyzer: React.FC<AnalyzerProps> = ({ onAddAnalysis }) => {
  const [marketText, setMarketText] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0.50');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const key = process.env.API_KEY;
    if (!key || key.length === 0 || key.includes('undefined')) {
        setHasApiKey(false);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!marketText) return;
    setIsAnalyzing(true);
    setResult(null); 
    
    try {
      const res = await analyzeMarket(marketText, description || "No description provided", parseFloat(price));
      setResult(res);
      onAddAnalysis(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center p-6 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {!result && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold mb-6">
              <BrainCircuit className="w-4 h-4" />
              Talos Engine v2.0
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Safety Check + <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Alpha Hunter</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Don't just scan. Analyze ROI. Our dual-engine checks for scams AND mispriced odds.
            </p>
          </div>
      )}

      {!hasApiKey ? (
        <div className="w-full bg-red-900/20 backdrop-blur-xl rounded-2xl border border-red-500/50 shadow-2xl p-8 text-center space-y-4 max-w-2xl">
             <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50">
                <Key className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white">System Locked</h3>
            <p className="text-slate-300">
                Google Gemini API Key is missing from configuration. <br/>
                Add <code className="bg-black px-1 rounded">API_KEY</code> to environment variables.
            </p>
        </div>
      ) : (
        <div className="w-full space-y-6">
            
            {/* Input Section */}
            <div className="bg-[#1e293b]/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Market Question</label>
                        <input 
                            type="text" 
                            value={marketText}
                            onChange={(e) => setMarketText(e.target.value)}
                            placeholder="e.g. Will Bitcoin hit $100k?"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Price ($)</label>
                        <input 
                            type="number" step="0.01" value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                {!result && (
                    <div className="mt-4">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Rules / Context (Optional)</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Paste market rules here to detect scams..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white h-16 resize-none focus:border-blue-500 outline-none"
                        />
                    </div>
                )}

                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className={`mt-4 w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-xl transition-all ${
                        isAnalyzing ? 'bg-slate-800 text-slate-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
                    }`}
                >
                    {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    {isAnalyzing ? 'Running Dual-Core Analysis...' : 'Run Analysis (Safety + Profit)'}
                </button>
            </div>

            {/* Results Section */}
            {result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    
                    {/* LEFT: SAFETY ENGINE */}
                    <div className={`rounded-xl border p-6 flex flex-col ${
                        result.safetyVerdict === 'CLEAN' ? 'bg-emerald-950/10 border-emerald-900/50' : 
                        'bg-red-950/10 border-red-900/50'
                    }`}>
                        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-800/50">
                            <ShieldCheck className={`w-6 h-6 ${result.safetyVerdict === 'CLEAN' ? 'text-emerald-500' : 'text-red-500'}`} />
                            <h3 className="font-bold text-lg text-white">Security Audit</h3>
                        </div>
                        
                        <div className="flex-grow space-y-4">
                            <div>
                                <div className="text-xs text-slate-500 uppercase font-bold">Risk Level</div>
                                <div className={`text-2xl font-black ${result.riskLevel === RiskLevel.SAFE ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {result.riskLevel}
                                </div>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                <p className="text-sm text-slate-300 leading-relaxed">{result.safetyNotes}</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: ALPHA ENGINE */}
                    <div className="rounded-xl border border-blue-900/50 bg-blue-950/10 p-6 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <DollarSign className="w-32 h-32 text-blue-400" />
                        </div>

                        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-blue-900/30 relative z-10">
                            <TrendingUp className="w-6 h-6 text-blue-400" />
                            <h3 className="font-bold text-lg text-white">Alpha Prediction</h3>
                        </div>

                        <div className="flex-grow space-y-4 relative z-10">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-bold">Verdict</div>
                                    <div className={`text-2xl font-black ${result.alphaVerdict === 'BUY' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                        {result.alphaVerdict}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-500 uppercase font-bold">Est. ROI</div>
                                    <div className="text-xl font-mono text-white">{result.profitPotential}</div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-500">Market Price: {(result.impliedProbability * 100).toFixed(0)}%</span>
                                    <span className="text-blue-400 font-bold">AI Estimate: {(result.estimatedProbability * 100).toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                                    <div className="bg-slate-600 h-full w-1/2 float-left relative">
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white" style={{ left: `${result.impliedProbability * 100}%` }}></div>
                                    </div>
                                    <div className="bg-blue-600 h-full" style={{ width: `${result.estimatedProbability * 100}%` }}></div>
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed italic">
                                    "{result.reasoning}"
                                </p>
                            </div>

                            <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/20 opacity-90 hover:opacity-100">
                                <DollarSign className="w-4 h-4" />
                                {result.alphaVerdict === 'BUY' ? 'EXECUTE TRADE' : 'Trade Monitor Only'}
                            </button>
                        </div>
                    </div>

                </div>
            )}
        </div>
      )}
    </div>
  );
};