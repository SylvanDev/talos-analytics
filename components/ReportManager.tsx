import React, { useState } from 'react';
import { AnalysisResult, RiskLevel } from '../types';
import { ChevronLeft, BrainCircuit, AlertTriangle, TrendingUp, TrendingDown, DollarSign, ShieldCheck } from 'lucide-react';

interface ReportManagerProps {
  reports: AnalysisResult[];
}

export const ReportManager: React.FC<ReportManagerProps> = ({ reports }) => {
  const [selectedReport, setSelectedReport] = useState<AnalysisResult | null>(null);

  if (selectedReport) {
    return (
      <div className="h-full flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-800 bg-[#1e293b] flex justify-between items-center">
          <button 
            onClick={() => setSelectedReport(null)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Feed
          </button>
          
          <div className={`px-3 py-1 rounded text-xs font-bold border flex items-center gap-2 ${
               selectedReport.alphaVerdict === 'BUY' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' :
               selectedReport.alphaVerdict === 'SELL' ? 'bg-red-900/30 text-red-400 border-red-800' :
               'bg-slate-700 text-slate-300 border-slate-600'
             }`}>
                VERDICT: {selectedReport.alphaVerdict}
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 bg-[#0f172a]">
          <div className="max-w-4xl mx-auto space-y-8">
             
             {/* Header */}
             <div>
               <h1 className="text-2xl font-bold text-white mb-2">{selectedReport.marketTitle}</h1>
               <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                 <span>Analyzed: {selectedReport.timestamp}</span>
                 <span>•</span>
                 <span className={`${
                     selectedReport.riskLevel === RiskLevel.SAFE ? 'text-emerald-400' : 
                     selectedReport.riskLevel === RiskLevel.HIGH ? 'text-red-400' : 'text-yellow-400'
                 }`}>{selectedReport.riskLevel}</span>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">EV Score</div>
                    <div className="text-3xl font-mono font-bold text-white">{selectedReport.evScore}/100</div>
                 </div>
                 <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">AI Verdict</div>
                    <div className="text-lg text-white font-medium">{selectedReport.summary}</div>
                 </div>
               </div>
               
               {/* Analysis */}
               <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg mb-6">
                 <h3 className="font-bold text-white mb-3">Reasoning</h3>
                 <p className="text-slate-300 leading-relaxed text-sm">
                    {selectedReport.reasoning}
                 </p>
               </div>

               {/* Safety Notes replaced keyRisks */}
               {selectedReport.safetyNotes && (
                   <div className={`border p-6 rounded-lg ${
                       selectedReport.riskLevel === RiskLevel.SAFE ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-red-900/10 border-red-900/30'
                   }`}>
                       <h3 className={`font-bold mb-3 flex items-center gap-2 ${
                           selectedReport.riskLevel === RiskLevel.SAFE ? 'text-emerald-400' : 'text-red-400'
                       }`}>
                           {selectedReport.riskLevel === RiskLevel.SAFE ? <ShieldCheck className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4" />} 
                           Safety Analysis
                       </h3>
                       <p className={`${
                           selectedReport.riskLevel === RiskLevel.SAFE ? 'text-emerald-200/80' : 'text-red-200/80'
                       } text-sm`}>
                           {selectedReport.safetyNotes}
                       </p>
                   </div>
               )}
             </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
       <div className="flex justify-between items-center pb-4 border-b border-slate-800">
         <h2 className="text-xl font-bold text-white flex items-center gap-2">
           <BrainCircuit className="w-5 h-5 text-blue-500" />
           Analysis Feed
         </h2>
       </div>

       {reports.length === 0 ? (
         <div className="border border-dashed border-slate-800 rounded-xl p-16 text-center">
            <TrendingUp className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300">No Reports Yet</h3>
            <p className="text-slate-500 text-sm mt-2">
              Use the "Alpha Scanner" to analyze a market.
            </p>
         </div>
       ) : (
         <div className="grid gap-4">
           {reports.map(report => (
             <div 
               key={report.id} 
               onClick={() => setSelectedReport(report)}
               className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl p-5 cursor-pointer transition-all flex items-center justify-between group"
             >
               <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                        report.alphaVerdict === 'BUY' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' :
                        report.alphaVerdict === 'SELL' ? 'border-red-500/30 bg-red-500/10 text-red-500' :
                        'border-slate-500/30 bg-slate-500/10 text-slate-500'
                  }`}>
                    {report.alphaVerdict === 'BUY' ? <TrendingUp className="w-5 h-5" /> : 
                     report.alphaVerdict === 'SELL' ? <TrendingDown className="w-5 h-5" /> : <DollarSign className="w-5 h-5"/>}
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                      {report.marketTitle}
                    </h3>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>{report.timestamp}</span>
                      <span className={`font-bold ${
                          report.riskLevel === RiskLevel.SAFE ? 'text-emerald-400' : 'text-yellow-400'
                      }`}>{report.riskLevel}</span>
                    </div>
                  </div>
               </div>
               
               <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <div className="text-xs text-slate-500">EV Score</div>
                        <div className="font-mono font-bold text-white">
                            {report.evScore}
                        </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-slate-600 rotate-180 group-hover:text-white transition-colors" />
               </div>
             </div>
           ))}
         </div>
       )}
    </div>
  );
};