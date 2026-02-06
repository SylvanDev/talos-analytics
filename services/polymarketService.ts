import { PolymarketEvent } from "../types";

const GAMMA_API_URL = "https://gamma-api.polymarket.com";

// Strategy Interface
interface FetchStrategy {
  name: string;
  getUrl: (params: string) => string;
}

// 1. Cleanest way (Works on Vercel Prod & Properly configued Local)
const STRATEGY_INTERNAL: FetchStrategy = {
  name: "Secure Gateway (Vercel)",
  getUrl: (params) => `/api/poly/events?${params}`
};

// 2. Backup for local dev / web containers
const STRATEGY_CORSPROXY: FetchStrategy = {
  name: "Public Proxy A",
  getUrl: (params) => `https://corsproxy.io/?${encodeURIComponent(`${GAMMA_API_URL}/events?${params}`)}`
};

// 3. Last Resort
const STRATEGY_ALLORIGINS: FetchStrategy = {
  name: "Public Proxy B",
  getUrl: (params) => `https://api.allorigins.win/raw?url=${encodeURIComponent(`${GAMMA_API_URL}/events?${params}`)}`
};

const STRATEGIES = [STRATEGY_INTERNAL, STRATEGY_CORSPROXY, STRATEGY_ALLORIGINS];

export const fetchTopMarkets = async (): Promise<{ data: PolymarketEvent[], source: string }> => {
  const params = new URLSearchParams({
    limit: '20',
    active: 'true',
    closed: 'false',
    sort: 'volume',
    order: 'desc',
    offset: '0'
  }).toString();

  for (const strategy of STRATEGIES) {
    try {
      console.log(`Attempting connection via ${strategy.name}...`);
      
      const response = await fetch(strategy.getUrl(params), {
        // Some public proxies hate custom headers, Vercel needs standard handling
        headers: strategy.name.includes('Proxy') ? undefined : { 'Accept': 'application/json' }
      });

      if (!response.ok) continue;

      const rawData = await response.json();

      // Validate Data integrity
      if (Array.isArray(rawData)) {
         console.log(`Connected via ${strategy.name}`);
         return {
           source: strategy.name,
           data: mapData(rawData)
         };
      }
    } catch (e) {
      console.warn(`Strategy ${strategy.name} failed.`);
    }
  }

  console.error("All connection strategies exhausted.");
  return { data: [], source: 'Disconnected' };
};

// Helper to clean up data
const mapData = (rawData: any[]): PolymarketEvent[] => {
  return rawData.map((event: any) => {
      const markets = (event.markets || []).map((m: any) => {
        let price = 0.5;
        try {
            if (m.outcomePrices) {
                const prices = JSON.parse(m.outcomePrices);
                price = prices.length > 0 ? Number(prices[0]) : 0.5;
            }
        } catch (e) { }

        return {
            id: m.id,
            question: m.question,
            outcome: m.groupItemTitle || m.outcome || "Yes", 
            currentPrice: price
        };
      }).filter((m: any) => m.question);

      if (!event.title || markets.length === 0) return null;

      return {
        id: event.id,
        ticker: event.ticker || "MKT",
        slug: event.slug,
        title: event.title,
        description: event.description || "No description provided.",
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