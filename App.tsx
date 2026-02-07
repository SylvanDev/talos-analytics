import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Analyzer } from './components/Analyzer';
import { ReportManager } from './components/ReportManager';
import { LandingPage } from './components/LandingPage';
import { LiveScanner } from './components/LiveScanner';
import { TerminalConsole } from './components/Terminal';
import { MarketScanner } from './components/MarketScanner'; 
import { ArbitrageScanner } from './components/ArbitrageScanner'; // NEW
import { LayoutDashboard, Search, BrainCircuit, FileText, LogOut, Wallet, UserCircle, Activity, Terminal, Table2, Zap } from 'lucide-react';
import { AnalysisResult } from './types';

enum Tab {
  DASHBOARD = 'dashboard',
  SCANNER = 'scanner',
  FEED = 'feed',
  ANALYZER = 'analyzer',
  CONSOLE = 'console',
  TABLE = 'table',
  ARBITRAGE = 'arbitrage' // NEW
}

// User's specific builder ID for display
const BUILDER_ID = "0xc7c...f025";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isGuest, setIsGuest] = useState(false);
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [reports, setReports] = useState<AnalysisResult[]>([]);

  // State to pass data from Feed to Analyzer
  const [analyzerInitData, setAnalyzerInitData] = useState<{title: string, price: string, description: string} | null>(null);

  const connectWallet = async () => {
    setIsConnecting(true);
    // Mock wallet connection
    setTimeout(() => {
        setWalletAddress(BUILDER_ID); // Simulate user's address
        setIsAuthenticated(true);
        setIsGuest(false);
        setIsConnecting(false);
        setActiveTab(Tab.FEED);
    }, 800);
  };

  const handleGuestEntry = () => {
    setIsAuthenticated(true);
    setIsGuest(true);
    setActiveTab(Tab.FEED);
  };

  const handleDisconnect = () => {
    setIsAuthenticated(false);
    setWalletAddress('');
    setIsGuest(false);
    setActiveTab(Tab.DASHBOARD);
  };

  const handleAddAnalysis = (result: AnalysisResult) => {
    setReports(prev => [result, ...prev]);
    setActiveTab(Tab.SCANNER); 
  };

  const handleAnalyzeFromFeed = (title: string, price: number, description: string) => {
      setAnalyzerInitData({
          title,
          price: price.toFixed(2),
          description
      });
      setActiveTab(Tab.ANALYZER);
  };

  if (!isAuthenticated) {
    return (
      <LandingPage 
        onConnect={connectWallet} 
        onGuestEnter={handleGuestEntry}
        isConnecting={isConnecting}
        error={connectError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col md:flex-row font-sans selection:bg-blue-500/30">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#1e293b] border-r border-slate-700/50 flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/30">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">
                TALOS <span className="text-blue-400">AI</span>
              </h1>
              <div className="text-[10px] text-slate-400 font-medium">Alpha Hunter v1.1</div>
            </div>
          </div>
        </div>

        <nav className="flex-grow p-4 space-y-2">
          <NavButton 
            active={activeTab === Tab.FEED} 
            onClick={() => setActiveTab(Tab.FEED)}
            icon={<Activity />}
            label="Live Markets"
          />
          {/* NEW ARBITRAGE BUTTON */}
          <NavButton 
            active={activeTab === Tab.ARBITRAGE} 
            onClick={() => setActiveTab(Tab.ARBITRAGE)}
            icon={<Zap className="text-yellow-400" />}
            label="Arbitrage Scanner"
          />
          <NavButton 
            active={activeTab === Tab.TABLE} 
            onClick={() => setActiveTab(Tab.TABLE)}
            icon={<Table2 />}
            label="Liquidity Grid"
          />
          <NavButton 
            active={activeTab === Tab.ANALYZER} 
            onClick={() => setActiveTab(Tab.ANALYZER)}
            icon={<Search />}
            label="AI Analyzer"
          />
          <NavButton 
            active={activeTab === Tab.SCANNER} 
            onClick={() => setActiveTab(Tab.SCANNER)}
            icon={<FileText />}
            label="Analysis Reports"
          />
          <NavButton 
            active={activeTab === Tab.DASHBOARD} 
            onClick={() => setActiveTab(Tab.DASHBOARD)}
            icon={<LayoutDashboard />}
            label="Dashboard"
          />
        </nav>

        <div className="p-4 border-t border-slate-700/50">
             
             {/* The "Hidden" Tab */}
             <button 
                onClick={() => setActiveTab(Tab.CONSOLE)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono rounded mb-4 transition-colors group ${
                    activeTab === Tab.CONSOLE 
                    ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-900/30' 
                    : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-800'
                }`}
             >
                <div className="flex items-center gap-3">
                    <Terminal className="w-3 h-3" />
                    <span>SYSTEM_LOGS</span>
                </div>
             </button>

             <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 mb-2">
               <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                 <Wallet className="w-3 h-3" /> 
                 {isGuest ? 'Guest Mode' : 'Builder Account'}
               </div>
               <div className="font-mono text-xs text-blue-400 font-bold truncate">
                 {isGuest ? 'Read-Only' : walletAddress}
               </div>
             </div>
          
          <button 
            onClick={handleDisconnect}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <LogOut className="w-3 h-3" /> Disconnect
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col h-screen overflow-hidden bg-slate-900 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-900 to-slate-900 pointer-events-none"></div>
        
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex justify-between items-center px-8 z-10">
          <h2 className="text-lg font-semibold text-white">
            {activeTab === Tab.DASHBOARD && 'Stats Overview'}
            {activeTab === Tab.ANALYZER && 'Talos Intelligence Engine'}
            {activeTab === Tab.SCANNER && 'Generated Signals'}
            {activeTab === Tab.FEED && 'Polymarket Real-Time Feed'}
            {activeTab === Tab.CONSOLE && 'System Logs / Diagnostics'}
            {activeTab === Tab.TABLE && 'Market Scanner (Internal Liquidity)'}
            {activeTab === Tab.ARBITRAGE && 'Arbitrage Scanner (Polymarket vs Bookies)'}
          </h2>
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold font-mono flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 Gamma API: Connected
             </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-grow overflow-hidden p-6 relative z-10">
          <div className="h-full overflow-y-auto custom-scrollbar">
            {activeTab === Tab.DASHBOARD && <Dashboard reports={reports} />}
            {activeTab === Tab.ANALYZER && (
                <Analyzer 
                    onAddAnalysis={handleAddAnalysis} 
                    initialTitle={analyzerInitData?.title}
                    initialPrice={analyzerInitData?.price}
                    initialDescription={analyzerInitData?.description}
                />
            )}
            {activeTab === Tab.SCANNER && <ReportManager reports={reports} />}
            {activeTab === Tab.FEED && <LiveScanner campaignName="" onAnalyze={handleAnalyzeFromFeed} />}
            {activeTab === Tab.CONSOLE && <TerminalConsole />}
            {activeTab === Tab.TABLE && <MarketScanner />}
            {activeTab === Tab.ARBITRAGE && <ArbitrageScanner />}
          </div>
        </div>
      </main>
    </div>
  );
};

const NavButton: React.FC<{active: boolean, onClick: () => void, icon: React.ReactNode, label: string}> = ({
  active, onClick, icon, label
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5" })}
    <span className="font-medium text-sm">{label}</span>
  </button>
);

export default App;