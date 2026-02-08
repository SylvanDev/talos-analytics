import { BookmakerMatch } from "../types";

// REAL KEY
const ODDS_API_KEY = "1a4af9d22ff22e09f7fded6676615fab";
const BASE_URL = 'https://api.the-odds-api.com/v4/sports';

// CACHE STORAGE
let matchCache: { data: BookmakerMatch[], timestamp: number } = { data: [], timestamp: 0 };
const CACHE_TTL = 60000; // 60 seconds

export const fetchEsportsOdds = async (): Promise<BookmakerMatch[]> => {
  if (!ODDS_API_KEY) {
    console.error("API Key missing.");
    return [];
  }

  // 1. CHECK CACHE
  const now = Date.now();
  if (matchCache.data.length > 0 && (now - matchCache.timestamp < CACHE_TTL)) {
      console.log("Serving Odds from Cache (Prevent 429)");
      return matchCache.data;
  }

  try {
    let allMatches: BookmakerMatch[] = [];

    // 2. FETCH ACTIVE SPORTS
    const sportsUrl = `${BASE_URL}/?apiKey=${ODDS_API_KEY}`;
    const sportsRes = await fetch(sportsUrl);
    
    if (!sportsRes.ok) {
        if (sportsRes.status === 429) {
            console.warn("Odds API 429. Returning stale cache if available.");
            return matchCache.data;
        }
        return [];
    }

    const allSports = await sportsRes.json();
    let targetKeys: string[] = [];

    if (Array.isArray(allSports)) {
         // Prioritize Esports
         const esportsKeys = allSports
            .filter((s: any) => s.active && (
                s.key.includes('dota') || 
                s.key.includes('csgo') || 
                s.key.includes('lol') || 
                s.key.includes('valorant') ||
                s.group.toLowerCase().includes('esport')
            ))
            .map((s: any) => s.key);
        
         const backupKeys = allSports
            .filter((s: any) => s.active && (
                s.key === 'soccer_uefa_champs_league'
            ))
            .map((s: any) => s.key);

         targetKeys = [...new Set([...esportsKeys, ...backupKeys])].slice(0, 4);
    }

    console.log("Fetching Odds for keys:", targetKeys);
    if (targetKeys.length === 0) return [];

    // 3. FETCH ODDS
    for (const key of targetKeys) {
        const url = `${BASE_URL}/${key}/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`;
        
        try {
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    allMatches = [...allMatches, ...data];
                }
            }
        } catch (err) {
            console.error(`Fetch error for ${key}`, err);
        }
        await new Promise(r => setTimeout(r, 200));
    }

    // 4. UPDATE CACHE
    if (allMatches.length > 0) {
        matchCache = { data: allMatches, timestamp: Date.now() };
    }
    
    return allMatches;

  } catch (e) {
    console.error("Critical Odds API Error:", e);
    return matchCache.data; // Return cache on crash
  }
};

export const calculateArbProfit = (odds1: number, odds2: number) => {
    const implied1 = 1 / odds1;
    const implied2 = 1 / odds2;
    const totalImplied = implied1 + implied2;
    const profitMargin = (1 / totalImplied) - 1;
    return { totalImplied, profitMargin, isArb: profitMargin > 0 };
};

export const calculateStakes = (bankroll: number, odds1: number, odds2: number) => {
    const implied1 = 1 / odds1;
    const implied2 = 1 / odds2;
    const totalImplied = implied1 + implied2;
    const stake1 = (bankroll * implied1) / totalImplied;
    const stake2 = (bankroll * implied2) / totalImplied;
    return { stake1, stake2, profit: (stake1 * odds1) - bankroll };
};
