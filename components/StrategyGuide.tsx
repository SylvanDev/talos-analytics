import React from 'react';
import { TrendingUp, AlertTriangle, BookOpen } from 'lucide-react';

export const StrategyGuide: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-y-auto custom-scrollbar p-1">
      
      <div className="bg-slate-900 border border-blue-900/50 rounded-lg overflow-hidden">
        <div className="bg-blue-950/20 p-4 border-b border-blue-900/30 flex justify-between items-center">
          <h3 className="text-blue-400 font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Arbitrage Strategy
          </h3>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-300">
            Look for discrepancies between related markets. For example, if "Biden drops out" is 30%, but "Harris Nominee" is 20%, there might be an arb opportunity if Harris is the only viable alternative.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-red-900/50 rounded-lg overflow-hidden">
        <div className="bg-red-950/20 p-4 border-b border-red-900/30 flex justify-between items-center">
          <h3 className="text-red-400 font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Ambiguity Traps
          </h3>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-300">
             Always check the "Resolution Source". If it cites a specific URL that is dead or ambiguous, avoid the market. Talos flags these automatically.
          </p>
        </div>
      </div>

    </div>
  );
};