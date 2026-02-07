import { PolymarketEvent, ArbitrageOpportunity, BookmakerMatch } from "../types";
import { fetchEsportsOdds, calculateArbProfit, calculateStakes } from "./bookmakerService";
import { verifyEventIdentity } from "./geminiService";

export interface MarketMetrics {
  id: string;
  title: string;
  totalVolume: number;
  liquidity: number;
  spread: number;
  bestOutcome: string;
  bestPrice: number;
}

// 1. Internal Scan (Polymarket Only - Spread)
export const scanMarketMetrics = (events: PolymarketEvent[]): MarketMetrics[] => {
  const results: MarketMetrics[] = [];

  events.forEach(event => {
    if (!event.markets || event.markets.length < 2) return;
    
    let impliedSum = 0;
    let maxPrice = 0;
    let maxOutcome = "";

    event.markets.forEach(m => {
        impliedSum += m.currentPrice;
        if (m.currentPrice > maxPrice) {
            maxPrice = m.currentPrice;
            maxOutcome = m.outcome;
        }
    });

    results.push({
        id: event.id,
        title: event.title,
        totalVolume: event.volume,
        liquidity: event.liquidity,
        spread: impliedSum,
        bestOutcome: maxOutcome,
        bestPrice: maxPrice
    });
  });

  return results.sort((a, b) => b.liquidity - a.liquidity);
};

// 2. External Scan (Polymarket vs Bookmakers)
export const findArbitrageOpportunities = async (
    polymarketEvents: PolymarketEvent[],
    useMockData: boolean = true
): Promise<ArbitrageOpportunity[]> => {
    
    const opportunities: ArbitrageOpportunity[] = [];
    
    // A. Filter Polymarket for Esports/Sports
    const esportsPoly = polymarketEvents.filter(e => {
        const t = e.title.toLowerCase();
        const tags = e.tags.join(' ').toLowerCase();
        return tags.includes('esports') || tags.includes('soccer') || t.includes(' vs ');
    });

    // B. Fetch Bookie Data
    const bookieMatches = await fetchEsportsOdds(useMockData);

    console.log(`Scanning ${esportsPoly.length} Poly events against ${bookieMatches.length} Bookie matches...`);

    // C. Compare
    // NOTE: This O(N*M) loop is fine for < 100 items, but for production needs optimization
    for (const polyEvent of esportsPoly) {
        if (!polyEvent.markets) continue;

        for (const bookieMatch of bookieMatches) {
            // Check Identity via Gemini
            const matchResult = await verifyEventIdentity(polyEvent.title, `${bookieMatch.home_team} vs ${bookieMatch.away_team}`);
            
            if (matchResult.isMatch && matchResult.confidence > 0.75) {
                // We found the same game! Now check odds.
                
                // Identify Teams
                // Poly often has markets like "Team Spirit wins?" (Yes/No)
                // Bookie has "Team Spirit" (1.5) vs "FaZe" (2.5)
                
                for (const market of polyEvent.markets) {
                    const polyPrice = market.currentPrice;
                    if (polyPrice <= 0.01) continue; // Skip dead markets

                    const polyOdds = 1 / polyPrice;
                    const outcomeName = (market.outcome === "Yes" ? polyEvent.title : market.outcome).toLowerCase();

                    // Find corresponding Bookie Outcome
                    // Simple heuristic: Does bookie outcome name exist in poly outcome?
                    const bookie = bookieMatch.bookmakers[0]; // Take first bookie for demo (usually Pinnacle in mock)
                    if (!bookie) continue;

                    const marketH2H = bookie.markets.find(m => m.key === 'h2h');
                    if (!marketH2H) continue;

                    // Logic:
                    // If Poly is "Team A wins", we need Bookie odds for "Team B wins" to hedge.
                    // ARB = Buy "Yes" on Team A (Poly) + Bet on Team B (Bookie).
                    
                    const teamA = bookieMatch.home_team;
                    const teamB = bookieMatch.away_team;
                    
                    let targetBookieOutcome = null;

                    // If Poly says "Team A wins", we look for Team B odds on Bookie
                    if (outcomeName.includes(teamA.toLowerCase())) {
                        targetBookieOutcome = marketH2H.outcomes.find(o => o.name === teamB);
                    } else if (outcomeName.includes(teamB.toLowerCase())) {
                        targetBookieOutcome = marketH2H.outcomes.find(o => o.name === teamA);
                    }

                    if (targetBookieOutcome) {
                         const bookieOdds = targetBookieOutcome.price;
                         const { profitMargin, isArb } = calculateArbProfit(polyOdds, bookieOdds);

                         // Threshold: > 1% profit
                         if (profitMargin > 0.01) {
                             const stakes = calculateStakes(100, polyOdds, bookieOdds);
                             
                             opportunities.push({
                                 id: `${polyEvent.id}-${bookieMatch.id}`,
                                 polymarketEvent: polyEvent.title,
                                 polymarketOutcome: market.outcome === "Yes" ? "Yes" : market.outcome, // usually "Yes"
                                 polymarketPrice: polyPrice,
                                 polymarketUrl: `https://polymarket.com/event/${polyEvent.slug}`,
                                 
                                 bookmakerName: bookie.title,
                                 bookmakerEvent: `${bookieMatch.home_team} vs ${bookieMatch.away_team}`,
                                 bookmakerTeam: targetBookieOutcome.name,
                                 bookmakerOdds: bookieOdds,
                                 bookmakerUrl: "https://www.pinnacle.com", // Generic link for demo

                                 profitMargin: profitMargin,
                                 totalImplied: (1/polyOdds) + (1/bookieOdds),
                                 
                                 stakePoly: stakes.stake1,
                                 stakeBookie: stakes.stake2,
                                 expectedProfit: stakes.profit,
                                 
                                 confidence: matchResult.confidence,
                                 timestamp: new Date().toLocaleTimeString()
                             });
                         }
                    }
                }
            }
        }
    }

    return opportunities.sort((a, b) => b.profitMargin - a.profitMargin);
};