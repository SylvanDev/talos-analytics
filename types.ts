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

export interface AnalysisResult {
  id: string;
  marketTitle: string;
  timestamp: string;
  
  // AI Findings
  evScore: number; // Expected Value Score (0-100)
  riskLevel: RiskLevel;
  recommendation: 'BUY' | 'SELL' | 'AVOID' | 'HOLD';
  
  summary: string;
  reasoning: string;
  keyRisks: string[];
}

export interface ScanFilter {
  minVolume: number;
  tags: string[];
  onlyActive: boolean;
}
