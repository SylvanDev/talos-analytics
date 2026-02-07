import React from 'react';
import { AnalysisResult } from '../types';
import { TrendingUp, ShieldCheck, Wallet, ArrowRight } from 'lucide-react';

interface DashboardProps {
  reports: AnalysisResult[];
}

export const Dashboard: React.FC<DashboardProps> = ({ reports }) => {
  const totalScans = reports.length;
  const buySignals = reports.filter(r => r.alphaVerdict === 'BUY').length;
  const trapsAvoided = reports.filter(r => r.safetyVerdict === 'TRAP').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between shadow-lg">
           <div>
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Alpha Signals Found</h3>
             <div className="mt-2 flex items-baseline gap-2">
               <span className="text-4xl font-bold text-emerald-400">{buySignals}</span>
               <span className="text-sm text-slate-500">High EV</span>
             </div>
           </div>
           <div className="p-3 rounded-full bg-emerald-900/20 text-emerald-400">
              <TrendingUp className="w-6 h-6" />
           </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between shadow-lg">
           <div>
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Traps Avoided</h3>
             <div className="mt-2 flex items-baseline gap-2">
               <span className="text-4xl font-bold text-blue-400">{trapsAvoided}</span>
               <span className="text-sm text-slate-500">Scams/Ambig</span>
             </div>
           </div>
           <div className="p-3 rounded-full bg-blue-900/20 text-blue-400">
              <ShieldCheck className="w-6 h-6" />
           </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between shadow-lg opacity-50 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
           <div>
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Est. Referral Fees</h3>
             <div className="mt-2 flex items-baseline gap-2">
               <span className="text-4xl font-bold text-slate-300">$0.00</span>
             </div>
           </div>
           <div className="p-3 rounded-full bg-slate-800 text-slate-500">
              <Wallet className="w-6 h-6" />
           </div>
        </div>
      </div>

      <div className="bg-[#1e293b]/30 border border-blue-500/20 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
         <div>
            <h3 className="text-xl font-bold text-white mb-2">Talos 2.0 Engine Active</h3>
            <p className="text-slate-400 max-w-lg">
                Your tool is now scanning for both <span className="text-red-400">Security Risks</span> and <span className="text-emerald-400">Profit Opportunities</span> simultaneously.
            </p>
         </div>
         <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2">
             Start Hunting <ArrowRight className="w-4 h-4" />
         </button>
      </div>
    </div>
  );
};