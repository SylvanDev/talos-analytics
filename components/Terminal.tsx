import React, { useState, useEffect, useRef } from 'react';
import { TerminalLog } from '../types';
import { Terminal } from 'lucide-react';

export const TerminalConsole: React.FC = () => {
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Initial Boot Message
  useEffect(() => {
      setLogs([{
          id: 'init',
          timestamp: new Date().toLocaleTimeString(),
          level: 'INFO',
          message: 'System Initialized. Awaiting user input...'
      }]);
  }, []);

  return (
    <div className="h-full flex flex-col bg-black font-mono text-xs md:text-sm p-4 rounded-lg border border-slate-800 shadow-2xl relative overflow-hidden">
      
      {/* Matrix / CRT Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2 z-20">
        <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-slate-300">SYSTEM LOGS</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-slate-500 text-[10px]">LIVE</span>
        </div>
      </div>

      {/* Logs Area */}
      <div ref={scrollRef} className="flex-grow overflow-y-auto custom-scrollbar space-y-1 relative z-20 pb-4">
        {logs.map((log) => (
            <div key={log.id} className="flex gap-3 hover:bg-slate-900/50 p-1 rounded">
                <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                <span className={`font-bold w-16 shrink-0 ${
                    log.level === 'INFO' ? 'text-blue-400' :
                    log.level === 'WARN' ? 'text-yellow-400' :
                    log.level === 'SUCCESS' ? 'text-emerald-400' :
                    log.level === 'AI' ? 'text-purple-400' :
                    'text-red-500'
                }`}>
                    {log.level}
                </span>
                <div className="break-all">
                    <span className="text-slate-300">{log.message}</span>
                    {log.details && (
                        <div className="text-slate-500 mt-0.5 ml-2 border-l border-slate-700 pl-2">
                            {log.details}
                        </div>
                    )}
                </div>
            </div>
        ))}
        <div className="animate-pulse text-emerald-500 font-bold mt-2">_</div>
      </div>

    </div>
  );
};