export enum RiskLevel {
  SAFE = 'Safe',
  LOW = 'Low Risk',
  MEDIUM = 'Medium Risk',
  HIGH = 'High Risk',
  SCAM = 'Scam / Ambiguous'
}

export interface PolymarketEvent {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  volume: number;
  liquidity: number;
  markets: MarketOutcome[];
  image?: string;
}

export interface MarketOutcome {
  id: string;
  question: string;
  outcome: string; // "Yes" / "No" or candidate name
  currentPrice: number; // 0.0 to 1.0
}

export interface ArbitrageOpportunity {
  id: string;
  eventName: string;
  marketSlug: string;
  
  // Side A: Polymarket
  polyOutcome: string; // e.g., "Yes"
  polyPrice: number;
  polyOdds: number; // 1 / price

  // Side B: Bookmaker (Simulated for Demo)
  bookieName: string; // "BetBoom", "Pinnacle"
  bookieOutcome: string; // e.g., "Team B Win"
  bookieOdds: number;

  // Math
  arbPercent: number; // Positive = Profit, Negative = Loss
  expectedProfit: string; // "$4.20 on $100"
  timestamp: string;
}

export interface AnalysisResult {
  id: string;
  marketTitle: string;
  timestamp: string;
  
  // SECTION 1: ALPHA (Making Money)
  evScore: number; // 0-100 (Profitability potential)
  impliedProbability: number; // What the market says (price)
  estimatedProbability: number; // What AI thinks is real
  alphaVerdict: 'BUY' | 'SELL' | 'NO ACTION';
  profitPotential: string; // e.g. "+35% ROI"
  
  // SECTION 2: SAFETY (Not Losing Money)
  riskLevel: RiskLevel;
  safetyVerdict: 'CLEAN' | 'SUSPICIOUS' | 'TRAP';
  
  // Content
  summary: string;
  reasoning: string; // The "Alpha" reasoning
  safetyNotes: string; // The "Audit" reasoning
}

export interface ScanFilter {
  minVolume: number;
  tags: string[];
  onlyActive: boolean;
}

// NEW: AI Matching Types
export interface EventMatchResult {
  isMatch: boolean;
  confidence: number;
  reason: string;
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'SUCCESS' | 'ERROR' | 'AI';
  message: string;
  details?: string;
}