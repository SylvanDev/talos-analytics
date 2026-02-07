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
  createdAt: string;
  startDate: string;
  endDate: string;
  volume: number;
  liquidity: number;
  markets: MarketOutcome[];
  image?: string;
  tags: string[];
}

export interface MarketOutcome {
  id: string;
  question: string;
  outcome: string; // "Yes" / "No" or candidate name
  currentPrice: number; // 0.0 to 1.0
}

export interface ArbitrageOpportunity {
  id: string;
  
  // Polymarket side
  polymarketEvent: string;
  polymarketOutcome: string;
  polymarketPrice: number;
  polymarketUrl: string;
  
  // Bookmaker side
  bookmakerName: string;
  bookmakerEvent: string;
  bookmakerTeam: string;
  bookmakerOdds: number;
  bookmakerUrl: string;
  
  // Math
  profitMargin: number; // e.g. 0.035 for 3.5%
  totalImplied: number;
  
  // Stakes ($100 bankroll)
  stakePoly: number;
  stakeBookie: number;
  expectedProfit: number;
  
  confidence: number; // AI Match confidence
  timestamp: string;
}

export interface BookmakerMatch {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    title: string;
    last_update: string;
    markets: {
      key: string;
      outcomes: {
        name: string;
        price: number;
      }[];
    }[];
  }[];
}

export interface AnalysisResult {
  id: string;
  marketTitle: string;
  timestamp: string;
  evScore: number; 
  impliedProbability: number; 
  estimatedProbability: number; 
  alphaVerdict: 'BUY' | 'SELL' | 'NO ACTION';
  profitPotential: string; 
  riskLevel: RiskLevel;
  safetyVerdict: 'CLEAN' | 'SUSPICIOUS' | 'TRAP';
  summary: string;
  reasoning: string; 
  safetyNotes: string; 
}

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