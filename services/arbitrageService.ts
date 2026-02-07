import { PolymarketEvent } from "../types";

export interface MarketMetrics {
  id: string;
  title: string;
  totalVolume: number;
  liquidity: number;
  spread: number; // The cost of buying YES + NO. Ideally 1.0. >1.0 = Fee/Spread. <1.0 = Arb.
  bestOutcome: string;
  bestPrice: number;
}

// Scans strictly internal Polymarket data for efficiency
export const scanMarketMetrics = (events: PolymarketEvent[]): MarketMetrics[] => {
  const results: MarketMetrics[] = [];

  events.forEach(event => {
    // Only analyze simple Yes/No markets for spread calculation
    if (!event.markets || event.markets.length < 2) return;

    // Assuming Market[0] is Yes and Market[1] is No (or Side A / Side B)
    // Polymarket APIs usually return the outcomes in order.
    // We sum the prices to find the "Implied Probability Sum"
    // If Sum < 1.0, there is a theoretical arb (buying both sides guarantees profit).
    // If Sum > 1.0, the excess is the fee/vig.
    
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

  // Sort by Liquidity (High to Low) to find tradeable markets
  return results.sort((a, b) => b.liquidity - a.liquidity);
};