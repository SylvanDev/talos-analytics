import React from 'react';
import { AnalysisResult } from '../types';
import { TrendingUp, AlertTriangle, Zap } from 'lucide-react';

interface DashboardProps {
  reports: AnalysisResult[];
}

export const Dashboard: React.FC<DashboardProps> = ({ reports }) => {
  const totalScans = reports.length;
  const opportunities = reports.filter(r => r.evScore > 70).length;
  const scamsDetected = reports.filter(r => r.riskLevel === 'Scam / Ambiguous').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between shadow-lg">
           <div>
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Markets Scanned</h3>
             <div className="mt-2 flex items-baseline gap-2">
               <span className="text-4xl font-bold text-white">{totalScans}</span>
             </div>
           </div>
           <div className="p-3 rounded-full bg-blue-900/20 text-blue-400">
              <Zap className="w-6 h-6" />
           </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between shadow-lg">
           <div>
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">High EV Opportunities</h3>
             <div className="mt-2 flex items-baseline gap-2">
               <span className={`text-4xl font-bold ${opportunities > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>{opportunities}</span>
             </div>
           </div>
           <div className={`p-3 rounded-full ${opportunities > 0 ? 'bg-emerald-900/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
              <TrendingUp className="w-6 h-6" />
           </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between shadow-lg">
           <div>
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Risky / Ambiguous</h3>
             <div className="mt-2 flex items-baseline gap-2">
               <span className={`text-4xl font-bold ${scamsDetected > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{scamsDetected}</span>
             </div>
           </div>
           <div className="p-3 rounded-full bg-red-900/20 text-red-400">
              <AlertTriangle className="w-6 h-6" />
           </div>
        </div>
      </div>

      <div className="bg-[#1e293b]/30 border border-blue-500/20 rounded-xl p-8 text-center">
         <h3 className="text-xl font-bold text-white mb-2">Ready to Hunt?</h3>
         <p className="text-slate-400 mb-6">Use the Alpha Scanner to find mispriced markets before the crowd.</p>
         <div className="flex justify-center gap-4">
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors">
                Start Scanning
            </button>
         </div>
      </div>
    </div>
  );
};