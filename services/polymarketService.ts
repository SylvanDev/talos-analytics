import { PolymarketEvent } from "../types";

// CONSTANTS
const INTERNAL_API_URL = "/api/poly/events"; // Works on Vercel & Local Vite
const REAL_API_URL = "https://gamma-api.polymarket.com/events?limit=20&active=true&closed=false&sort=volume&order=desc";

export const fetchTopMarkets = async (): Promise<{ data: PolymarketEvent[], source: string }> => {
  
  // 1. TRY INTERNAL PROXY (Best for Vercel / Local)
  try {
    const params = new URLSearchParams({
        limit: '20',
        active: 'true',
        closed: 'false',
        sort: 'volume',
        order: 'desc'
    }).toString();
    
    // We try the relative path first. If running in Vercel, vercel.json handles this.
    // If running locally, vite.config.ts handles this.
    const response = await fetch(`${INTERNAL_API_URL}?${params}`);
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        if (Array.isArray(data)) {
            return { data: mapData(data), source: 'Gamma API (Secure Tunnel)' };
        }
    }
  } catch (e) {
      // Internal proxy failed
  }

  // 2. TRY EXTERNAL PROXY (Fallback for some environments)
  try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(REAL_API_URL)}`;
      const response = await fetch(proxyUrl);
      if (response.ok) {
          const wrapper = await response.json();
          if (wrapper.contents) {
              const parsed = JSON.parse(wrapper.contents);
              if (Array.isArray(parsed)) {
                  return { data: mapData(parsed), source: 'Public Relay (Live)' };
              }
          }
      }
  } catch (e) {
      // External proxy failed
  }

  // If we reach here, connection failed completely.
  return { 
      data: [], 
      source: "Connection Failed (CORS/Network Blocked)" 
  };
};

const mapData = (rawData: any[]): PolymarketEvent[] => {
  return rawData.map((event: any) => {
      if (!event || !event.markets) return null;

      const markets = (event.markets || []).map((m: any) => {
        let price = 0;
        try {
            if (m.outcomePrices) {
                const prices = typeof m.outcomePrices === 'string' 
                    ? JSON.parse(m.outcomePrices) 
                    : m.outcomePrices;
                price = prices.length > 0 ? Number(prices[0]) : 0;
            }
        } catch (e) { }

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
        startDate: event.startDate,
        endDate: event.endDate,
        volume: Number(event.volume) || 0,
        liquidity: Number(event.liquidity) || 0,
        image: event.image,
        markets: markets
      };
    }).filter((e: any) => e !== null);
}

export const getMarketUrl = (slug: string) => `https://polymarket.com/event/${slug}`;