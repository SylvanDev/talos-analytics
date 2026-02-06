import React from 'react';
import { BrainCircuit, TrendingUp, ShieldCheck, ChevronRight, Zap, Terminal, Activity, Lock } from 'lucide-react';

interface LandingPageProps {
  onConnect: () => void;
  onGuestEnter: () => void;
  isConnecting: boolean;
  error: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onConnect, onGuestEnter, isConnecting, error }) => {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-mono selection:bg-blue-500/30 overflow-hidden relative">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

      {/* Navbar */}
      <header className="border-b border-slate-800/60 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
               <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white">TALOS <span className="text-blue-500">AI</span></span>
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-900/10 px-3 py-1 rounded-full border border-emerald-900/30">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                SYSTEM ONLINE
             </div>
             <button 
               onClick={onConnect}
               disabled={isConnecting}
               className="bg-white text-black hover:bg-slate-200 px-5 py-2 rounded text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
             >
               {isConnecting ? 'INITIALIZING...' : 'LAUNCH TERMINAL'}
               {!isConnecting && <ChevronRight className="w-4 h-4" />}
             </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-20 relative z-10">
        <div className="max-w-4xl">
            <div className="inline-block mb-6">
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 border border-slate-700 rounded text-xs text-slate-400 font-mono">
                    <Terminal className="w-3 h-3" />
                    <span>BUILDER ID: 0xc7c...f025</span>
                </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[1.1] mb-8">
              PREDICTION MARKET <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">INTELLIGENCE ENGINE</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10 border-l-2 border-blue-500/50 pl-6">
              Automated signal aggregation and risk analysis for Polymarket. 
              Find arbitrage opportunities and detect ambiguity traps before the crowd.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onConnect}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(37,99,235,0.2)] hover:shadow-[0_0_40px_rgba(37,99,235,0.4)] group"
              >
                <Zap className="w-5 h-5 group-hover:text-yellow-300 transition-colors" />
                START SCANNING
              </button>
              <button 
                 onClick={onGuestEnter}
                 className="px-8 py-4 bg-[#0f172a] hover:bg-[#1e293b] text-slate-300 border border-slate-800 hover:border-slate-600 rounded font-bold flex items-center justify-center gap-2 transition-all"
              >
                LIVE DEMO
              </button>
            </div>
        </div>

        {/* Stats Strip */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-800/50 pt-12">
            {[
                { label: 'Markets Indexed', value: '2,400+', icon: <Activity className="w-4 h-4 text-blue-500" /> },
                { label: 'Real-Time Latency', value: '<50ms', icon: <Zap className="w-4 h-4 text-yellow-500" /> },
                { label: 'Risk Models', value: 'Gemini 3.0', icon: <BrainCircuit className="w-4 h-4 text-purple-500" /> },
                { label: 'Security', value: 'Verified', icon: <ShieldCheck className="w-4 h-4 text-emerald-500" /> },
            ].map((stat, i) => (
                <div key={i} className="p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-2">
                        {stat.icon} {stat.label}
                    </div>
                    <div className="text-2xl font-bold text-white font-mono">{stat.value}</div>
                </div>
            ))}
        </div>
      </main>

      {/* Ticker Tape */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a] border-t border-slate-800 h-10 flex items-center overflow-hidden z-20">
          <div className="flex items-center animate-shine whitespace-nowrap gap-8 px-4 text-xs font-mono text-slate-400">
              <span className="text-emerald-400">TRUMP 2024: 52% (+2%)</span>
              <span className="text-red-400">FED RATE CUT: 12% (-5%)</span>
              <span className="text-blue-400">BTC > 100K: 65% (NC)</span>
              <span className="text-emerald-400">SOL ETF: 33% (+1%)</span>
              <span className="text-slate-500">SYSTEM STATUS: OPTIMAL</span>
              <span className="text-emerald-400">TRUMP 2024: 52% (+2%)</span>
              <span className="text-red-400">FED RATE CUT: 12% (-5%)</span>
              <span className="text-blue-400">BTC > 100K: 65% (NC)</span>
          </div>
      </div>

    </div>
  );
};