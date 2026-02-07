import { PolymarketEvent, ArbitrageOpportunity } from "../types";
import { fetchEsportsOdds, calculateArbProfit, calculateStakes } from "./bookmakerService";
import { verifyEventIdentity } from "./geminiService";

// Team Name Aliases to help matching
const TEAM_ALIASES: Record<string, string> = {
    'ngx': 'nigma',
    'nigma galaxy': 'nigma',
    'z10': 'z10',
    'cloud9': 'c9',
    'c9': 'cloud9',
    'virtus.pro': 'vp',
    'vp': 'virtus.pro',
    'navi': 'natus vincere',
    'natus vincere': 'navi',
    'falcons': 'team falcons',
    'gg': 'gaimin',
    'betboom': 'betboom team',
    'bb': 'betboom'
};

const normalizeTeamName = (name: string): string => {
    let lower = name.toLowerCase().trim();
    // Remove common prefixes/suffixes
    lower = lower.replace(/\besports\b/g, '').replace(/\bteam\b/g, '').trim();
    return TEAM_ALIASES[lower] || lower;
};

// Helper to check token intersection
const hasTokenOverlap = (str1: string, str2: string): boolean => {
    const tokens1 = normalizeTeamName(str1).split(/[\s\-_]+/);
    const tokens2 = normalizeTeamName(str2).split(/[\s\-_]+/);
    
    // Check if any significant token (len > 2) matches
    return tokens1.some(t1 => 
        t1.length > 2 && tokens2.some(t2 => t2.includes(t1) || t1.includes(t2))
    );
};

// 1. Internal Scan (Polymarket Only - Spread)
export interface MarketMetrics {
  id: string;
  title: string;
  totalVolume: number;
  liquidity: number;
  spread: number;
  bestOutcome: string;
  bestPrice: number;
}

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
    
    // A. Filter Polymarket Events
    // Relaxed keywords to catch more potential events
    const keywords = [
        'esport', 'csgo', 'dota', 'lol', 'valorant', 
        'soccer', 'football', 'premier', 'league',
        'nigma', 'z10', 'betboom', 'spirit', 'g2', 'falcons', 'liquid', 'og',
        'vs', 'winner', 'match' // Catch generic titles like "Winner of X vs Y"
    ];
    
    const targetPolyEvents = polymarketEvents.filter(e => {
        const text = (e.title + ' ' + e.tags.join(' ')).toLowerCase();
        return keywords.some(k => text.includes(k));
    });

    // B. Fetch REAL Odds
    const bookieMatches = await fetchEsportsOdds();
    console.log(`Scanning ${targetPolyEvents.length} Poly events against ${bookieMatches.length} Bookmaker matches...`);

    // C. Compare
    for (const polyEvent of targetPolyEvents) {
        if (!polyEvent.markets) continue;

        for (const bookieMatch of bookieMatches) {
            // Check Identity via Gemini
            
            // 1. Heuristic Pre-filter (Greedy Token Match)
            // Does ANY word from the Poly title appear in the Bookie teams?
            const polyTokens = polyEvent.title.toLowerCase();
            const homeTokens = bookieMatch.home_team.toLowerCase();
            const awayTokens = bookieMatch.away_team.toLowerCase();

            const matchHome = hasTokenOverlap(polyEvent.title, bookieMatch.home_team);
            const matchAway = hasTokenOverlap(polyEvent.title, bookieMatch.away_team);
            
            // If neither team name has ANY overlap with the title, skip.
            if (!matchHome && !matchAway) continue;

            console.log(`Potential Match: [${polyEvent.title}] vs [${bookieMatch.home_team} - ${bookieMatch.away_team}]`);

            // 2. AI Verification (Lowered threshold to 0.50 to see more results)
            const matchResult = await verifyEventIdentity(polyEvent.title, `${bookieMatch.home_team} vs ${bookieMatch.away_team}`);
            
            // Fallback: If AI fails but we had a strong string match, include it with low confidence
            let isVerified = matchResult.isMatch && matchResult.confidence > 0.5;
            if (!matchResult.isMatch && (matchHome && matchAway)) {
                // If both team names were found in the title via string match, force include it
                isVerified = true;
                matchResult.confidence = 0.45; // Low confidence flag
            }

            if (isVerified) {
                
                // 3. Find BetBoom (or fallback)
                let bookie = bookieMatch.bookmakers.find(b => 
                    b.key.toLowerCase().includes('betboom') || 
                    b.title.toLowerCase().includes('betboom')
                );

                if (!bookie && bookieMatch.bookmakers.length > 0) {
                    bookie = bookieMatch.bookmakers[0];
                }

                if (!bookie) continue;

                const marketH2H = bookie.markets.find(m => m.key === 'h2h');
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

                    // Match Logic: Check aliases too
                    // We need to know WHICH team this Poly outcome represents
                    const isTeamA = hasTokenOverlap(outcomeName, teamA);
                    const isTeamB = hasTokenOverlap(outcomeName, teamB);

                    // If Poly is Team A, we look for Team B on Bookie (Hedge)
                    // If Poly is Team B, we look for Team A on Bookie (Hedge)
                    
                    if (isTeamA) {
                        targetBookieOutcome = marketH2H.outcomes.find(o => hasTokenOverlap(o.name, teamB));
                    } else if (isTeamB) {
                        targetBookieOutcome = marketH2H.outcomes.find(o => hasTokenOverlap(o.name, teamA));
                    }

                    if (targetBookieOutcome) {
                         const bookieOdds = targetBookieOutcome.price;
                         const { profitMargin } = calculateArbProfit(polyOdds, bookieOdds);
                         const stakes = calculateStakes(100, polyOdds, bookieOdds);
                         
                         opportunities.push({
                             id: `${polyEvent.id}-${bookieMatch.id}-${market.id}`,
                             polymarketEvent: polyEvent.title,
                             polymarketOutcome: market.outcome === "Yes" ? "Yes" : market.outcome,
                             polymarketPrice: polyPrice,
                             polymarketUrl: `https://polymarket.com/event/${polyEvent.slug}`,
                             
                             bookmakerName: bookie.title === "BetBoom" ? "BetBoom" : `BetBoom (via ${bookie.title})`, 
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
