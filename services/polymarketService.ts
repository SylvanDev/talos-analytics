import { PolymarketEvent } from "../types";

// CONSTANTS
const INTERNAL_API_URL = "/api/poly/events"; // Works on Vercel/Netlify via rewrites
const REAL_API_URL = "https://gamma-api.polymarket.com/events";

export const fetchTopMarkets = async (): Promise<{ data: PolymarketEvent[], source: string }> => {
  const polyKey = process.env.POLYMARKET_KEY || "";
  
  // Headers for better rate limits / access
  const headers: Record<string, string> = {};
  if (polyKey && !polyKey.includes('undefined')) {
      // Gamma API uses query params or basic auth usually, but sometimes headers help
      // We will rely mostly on the proxy, but passing it doesn't hurt.
  }

  // 1. TRY INTERNAL PROXY (Netlify/Vercel)
  try {
    const params = new URLSearchParams({
        limit: '20',
        active: 'true',
        closed: 'false',
        sort: 'volume',
        order: 'desc'
    }).toString();
    
    // Attempt fetch via our local proxy (configured in netlify.toml / vercel.json)
    const response = await fetch(`${INTERNAL_API_URL}?${params}`);
    
    if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (Array.isArray(data)) {
                return { data: mapData(data), source: 'Gamma API (Secure Tunnel)' };
            }
        }
    }
  } catch (e) {
      // Internal proxy failed
      console.warn("Proxy attempt 1 failed", e);
  }

  // 2. TRY DIRECT (Only works if user has CORS plugin or if API allows it temporarily)
  try {
      const params = new URLSearchParams({
        limit: '20',
        active: 'true',
        closed: 'false',
        sort: 'volume',
        order: 'desc'
    }).toString();

    const response = await fetch(`${REAL_API_URL}?${params}`);
    if (response.ok) {
        const data = await response.json();
        return { data: mapData(data), source: 'Direct Connection' };
    }
  } catch (e) {
     // Direct failed
  }

  // 3. TRY EXTERNAL PROXY (Last Resort)
  try {
      const targetUrl = `${REAL_API_URL}?limit=20&active=true&closed=false&sort=volume&order=desc`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
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