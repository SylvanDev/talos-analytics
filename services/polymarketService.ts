import { PolymarketEvent } from "../types";

// CONSTANTS
const INTERNAL_API_URL = "/api/poly/events"; 
const REAL_API_URL = "https://gamma-api.polymarket.com/events";

// EMERGENCY FALLBACK DATA (If all proxies die)
const FALLBACK_DATA: any[] = [
    {
        id: "fallback-1",
        title: "Nigma Galaxy vs Z10",
        slug: "nigma-galaxy-vs-z10",
        description: "Winner of the match.",
        endDate: new Date(Date.now() + 86400000).toISOString(),
        volume: 50000,
        liquidity: 12000,
        markets: [{ id: "m1", question: "Nigma Galaxy vs Z10", outcome: "Nigma Galaxy", outcomePrices: JSON.stringify(["0.65"]) }]
    },
    {
        id: "fallback-2",
        title: "Team Spirit vs BetBoom",
        slug: "spirit-vs-betboom",
        description: "Dota 2 Match Winner",
        endDate: new Date(Date.now() + 86400000).toISOString(),
        volume: 120000,
        liquidity: 45000,
        markets: [{ id: "m2", question: "Team Spirit vs BetBoom", outcome: "Team Spirit", outcomePrices: JSON.stringify(["0.55"]) }]
    }
];

export const fetchTopMarkets = async (): Promise<{ data: PolymarketEvent[], source: string }> => {
  const params = new URLSearchParams({
      limit: '100', // Reduced limit to be lighter on proxies
      active: 'true',
      closed: 'false',
      sort: 'liquidity', 
  }).toString();

  const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.POLYMARKET_KEY}` 
  };

  // 1. TRY INTERNAL PROXY (Best for production)
  try {
    const response = await fetch(`${INTERNAL_API_URL}?${params}`, { headers });
    if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) return { data: mapData(data), source: 'Gamma API (Direct)' };
    }
  } catch (e) {}

  // 2. TRY AllOrigins (Best public proxy)
  try {
      const targetUrl = `${REAL_API_URL}?${params}`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl);
      if (response.ok) {
          const wrapper = await response.json();
          if (wrapper.contents) {
              const parsed = JSON.parse(wrapper.contents);
              if (Array.isArray(parsed)) {
                  console.log("Fetched via AllOrigins");
                  return { data: mapData(parsed), source: 'Public Relay (AllOrigins)' };
              }
          }
      }
  } catch (e) {
      console.warn("AllOrigins failed", e);
  }

  // 3. TRY CorsProxy.io (Backup)
  try {
       const targetUrl = `${REAL_API_URL}?${params}`;
       const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
       const response = await fetch(proxyUrl);
       if (response.ok) {
           const data = await response.json();
           if (Array.isArray(data)) {
               return { data: mapData(data), source: 'Public Relay (CorsProxy)' };
           }
       }
  } catch (e) {}

  // 4. CRITICAL FAILURE FALLBACK
  // If user network blocks everything, return mock data so app doesn't look broken
  console.warn("All Network fetch methods failed. Using Emergency Fallback Data.");
  return { 
      data: mapData(FALLBACK_DATA), 
      source: "Offline / Demo Mode" 
  };
};

const mapData = (rawData: any[]): PolymarketEvent[] => {
  const now = new Date();

  const processed = rawData.map((event: any) => {
      if (!event || !event.markets) return null;

      if (event.endDate) {
          const end = new Date(event.endDate);
          if (end < now) return null;
      }

      // Safe Tag Parsing
      const tags = Array.isArray(event.tags) 
          ? event.tags.map((t: any) => t.label || t.name || "").filter((t: string) => t)
          : [];

      const markets = (event.markets || []).map((m: any) => {
        let price = 0;
        try {
            if (m.outcomePrices) {
                const prices = typeof m.outcomePrices === 'string' 
                    ? JSON.parse(m.outcomePrices) 
                    : m.outcomePrices;
                
                if (Array.isArray(prices) && prices.length > 0) {
                    price = parseFloat(prices[0]);
                }
            }
        } catch (e) { 
            console.error("Price parse error", e);
        }
        if (isNaN(price)) price = 0;

        return {
            id: m.id,
            question: m.question || event.title,
            outcome: m.groupItemTitle || m.outcome || "Outcome", 
            currentPrice: price
        };
      }).filter((m: any) => m.question);

      if (!event.title || markets.length === 0) return null;

      return {
        id: event.id,
        ticker: event.ticker || "MKT",
        slug: event.slug || "",
        title: event.title,
        description: event.description || "",
        createdAt: event.createdAt || event.startDate || new Date().toISOString(),
        startDate: event.startDate,
        endDate: event.endDate,
        volume: Number(event.volume) || 0,
        liquidity: Number(event.liquidity) || 0,
        image: event.image,
        markets: markets,
        tags: tags
      };
    }).filter((e: any) => e !== null) as PolymarketEvent[];

    return processed.sort((a, b) => b.liquidity - a.liquidity);
}

export const getMarketUrl = (slug: string) => `https://polymarket.com/event/${slug}`;
