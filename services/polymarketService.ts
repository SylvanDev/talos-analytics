import { PolymarketEvent } from "../types";

// CONSTANTS
const INTERNAL_API_URL = "/api/poly/events"; 
const REAL_API_URL = "https://gamma-api.polymarket.com/events";

export const fetchTopMarkets = async (): Promise<{ data: PolymarketEvent[], source: string }> => {
  
  // CHANGED LIMIT FROM 50 TO 300 TO CATCH ESPORTS EVENTS
  const params = new URLSearchParams({
      limit: '300', 
      active: 'true',
      closed: 'false',
      sort: 'liquidity', 
  }).toString();

  // AUTH HEADER
  const headers = {
      'Content-Type': 'application/json',
      // Using the provided private key (UUID format)
      'Authorization': `Bearer ${process.env.POLYMARKET_KEY}` 
  };

  // 1. TRY INTERNAL PROXY (Netlify/Vite)
  try {
    const response = await fetch(`${INTERNAL_API_URL}?${params}`, { headers });
    if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
            console.log(`Polymarket: Fetched ${data.length} raw events`); // Debug log
            return { data: mapData(data), source: 'Gamma API (Authenticated)' };
        }
    } else {
        console.error("Proxy Auth Error Status:", response.status);
    }
  } catch (e) {
      console.warn("Proxy attempt failed", e);
  }

  // 2. TRY EXTERNAL PROXY (Backup)
  try {
      const targetUrl = `${REAL_API_URL}?${params}`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
      const response = await fetch(proxyUrl);
      if (response.ok) {
          const wrapper = await response.json();
          if (wrapper.contents) {
              const parsed = JSON.parse(wrapper.contents);
              if (Array.isArray(parsed)) {
                  return { data: mapData(parsed), source: 'Public Relay (Backup)' };
              }
          }
      }
  } catch (e) {
      console.warn("External proxy failed", e);
  }

  return { 
      data: [], 
      source: "Connection Failed. Check network." 
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

    // Default sort: Liquidity high to low
    return processed.sort((a, b) => b.liquidity - a.liquidity);
}

export const getMarketUrl = (slug: string) => `https://polymarket.com/event/${slug}`;
