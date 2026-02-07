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

// 2. External Scan (Polymarket vs BetBoom)
export const findArbitrageOpportunities = async (
    polymarketEvents: PolymarketEvent[]
): Promise<ArbitrageOpportunity[]> => {
    
    const opportunities: ArbitrageOpportunity[] = [];
    
    // A. Filter Polymarket for Esports (BROADER SEARCH)
    // Polymarket tags are inconsistent, so we search strictly in title and tags with more keywords
    const keywords = ['esport', 'csgo', 'cs:go', 'dota', 'lol', 'league of legends', 'counter-strike', 'valorant', 'gaming', 'fifa', 'call of duty'];
    
    const esportsPoly = polymarketEvents.filter(e => {
        const text = (e.title + ' ' + e.tags.join(' ')).toLowerCase();
        return keywords.some(k => text.includes(k));
    });

    // B. Fetch REAL Odds (BetBoom via API)
    // This now fetches keys dynamically so no 404s
    const bookieMatches = await fetchEsportsOdds();

    console.log(`Scanning ${esportsPoly.length} Poly events against ${bookieMatches.length} BetBoom matches...`);

    // C. Compare
    for (const polyEvent of esportsPoly) {
        if (!polyEvent.markets) continue;

        for (const bookieMatch of bookieMatches) {
            // Check Identity via Gemini
            // We optimize simply by checking if one string contains another before paying for AI call
            const polySimple = polyEvent.title.toLowerCase();
            const bookieSimple = `${bookieMatch.home_team} ${bookieMatch.away_team}`.toLowerCase();
            
            // Heuristic pre-filter to save time
            const isWorthChecking = polySimple.includes(bookieMatch.home_team.toLowerCase()) || polySimple.includes(bookieMatch.away_team.toLowerCase());
            
            if (!isWorthChecking) continue;

            const matchResult = await verifyEventIdentity(polyEvent.title, `${bookieMatch.home_team} vs ${bookieMatch.away_team}`);
            
            if (matchResult.isMatch && matchResult.confidence > 0.75) {
                
                // STRICT FILTER: We only care about BetBoom
                const betBoom = bookieMatch.bookmakers.find(b => b.key === 'betboom' || b.title.toLowerCase().includes('betboom'));
                
                if (!betBoom) continue; // Skip if BetBoom has no odds for this match

                const marketH2H = betBoom.markets.find(m => m.key === 'h2h');
                if (!marketH2H) continue;

                // Loop Poly Markets
                for (const market of polyEvent.markets) {
                    const polyPrice = market.currentPrice;
                    if (polyPrice <= 0.01) continue; 

                    const polyOdds = 1 / polyPrice;
                    const outcomeName = (market.outcome === "Yes" ? polyEvent.title : market.outcome).toLowerCase();
                    
                    const teamA = bookieMatch.home_team;
                    const teamB = bookieMatch.away_team;
                    
                    let targetBookieOutcome = null;

                    // Match Logic: If Poly is Team A, we need Team B on BetBoom to hedge
                    if (outcomeName.includes(teamA.toLowerCase())) {
                        targetBookieOutcome = marketH2H.outcomes.find(o => o.name === teamB);
                    } else if (outcomeName.includes(teamB.toLowerCase())) {
                        targetBookieOutcome = marketH2H.outcomes.find(o => o.name === teamA);
                    }

                    if (targetBookieOutcome) {
                         const bookieOdds = targetBookieOutcome.price;
                         const { profitMargin } = calculateArbProfit(polyOdds, bookieOdds);

                         const stakes = calculateStakes(100, polyOdds, bookieOdds);
                         
                         opportunities.push({
                             id: `${polyEvent.id}-${bookieMatch.id}`,
                             polymarketEvent: polyEvent.title,
                             polymarketOutcome: market.outcome === "Yes" ? "Yes" : market.outcome,
                             polymarketPrice: polyPrice,
                             polymarketUrl: `https://polymarket.com/event/${polyEvent.slug}`,
                             
                             bookmakerName: "BetBoom", 
                             bookmakerEvent: `${bookieMatch.home_team} vs ${bookieMatch.away_team}`,
                             bookmakerTeam: targetBookieOutcome.name,
                             bookmakerOdds: bookieOdds,
                             bookmakerUrl: "https://betboom.com", 

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

    return opportunities.sort((a, b) => b.profitMargin - a.profitMargin);
};
