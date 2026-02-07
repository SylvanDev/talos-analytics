import { BookmakerMatch } from "../types";

// REAL KEY
const ODDS_API_KEY = "1a4af9d22ff22e09f7fded6676615fab";
const BASE_URL = 'https://api.the-odds-api.com/v4/sports';

export const fetchEsportsOdds = async (): Promise<BookmakerMatch[]> => {
  if (!ODDS_API_KEY) {
    console.error("API Key missing.");
    return [];
  }

  try {
    let allMatches: BookmakerMatch[] = [];

    // 1. DYNAMICALLY FETCH ACTIVE SPORTS
    const sportsUrl = `${BASE_URL}/?apiKey=${ODDS_API_KEY}`;
    const sportsRes = await fetch(sportsUrl);
    
    if (!sportsRes.ok) {
        if (sportsRes.status === 429) console.error("Odds API Rate Limit Reached (429).");
        return [];
    }

    const allSports = await sportsRes.json();
    let targetKeys: string[] = [];

    if (Array.isArray(allSports)) {
         // STRATEGY: Prioritize SPECIFIC Esports keys first.
         // We filter strictly for active leagues to avoid wasting quota.
         const esportsKeys = allSports
            .filter((s: any) => s.active && (
                s.key.includes('dota') || 
                s.key.includes('csgo') || 
                s.key.includes('lol') || 
                s.key.includes('valorant') ||
                s.group.toLowerCase().includes('esport')
            ))
            .map((s: any) => s.key);
        
         // Add reliable backups only if esports list is small
         const backupKeys = allSports
            .filter((s: any) => s.active && (
                s.key === 'soccer_uefa_champs_league' || 
                s.key === 'soccer_epl'
            ))
            .map((s: any) => s.key);

         // Merge: Esports first, then backup. Limit to 5 total requests to prevent 429.
         targetKeys = [...new Set([...esportsKeys, ...backupKeys])].slice(0, 5);
    }

    console.log("Fetching Odds for:", targetKeys);

    if (targetKeys.length === 0) return [];

    // 2. FETCH ODDS (With Delay to avoid 429)
    for (const key of targetKeys) {
        // FIX 422 ERROR: Removed `bookmakers=betboom` from URL. 
        // Some leagues return 422 if the specific bookie isn't available. 
        // We fetch ALL EU bookies and filter in memory.
        const url = `${BASE_URL}/${key}/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`;
        
        try {
            const res = await fetch(url);
            
            if (res.status === 429) {
                console.warn("Rate limit hit during loop. Stopping fetch.");
                break; // Stop loop to save key
            }

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    allMatches = [...allMatches, ...data];
                }
            } else {
                console.warn(`Skipping ${key}: Status ${res.status}`);
            }
        } catch (err) {
            console.error(`Fetch error for ${key}`, err);
        }

        // DELAY: 300ms pause between requests to be gentle on the API
        await new Promise(r => setTimeout(r, 300));
    }
    
    return allMatches;
  } catch (e) {
    console.error("Critical Odds API Error:", e);
    return [];
  }
};

// Math Helpers
export const calculateArbProfit = (odds1: number, odds2: number) => {
    const implied1 = 1 / odds1;
    const implied2 = 1 / odds2;
    const totalImplied = implied1 + implied2;
    
    const profitMargin = (1 / totalImplied) - 1;
    return {
        totalImplied,
        profitMargin,
        isArb: profitMargin > 0
    };
};

export const calculateStakes = (bankroll: number, odds1: number, odds2: number) => {
    const implied1 = 1 / odds1;
    const implied2 = 1 / odds2;
    const totalImplied = implied1 + implied2;

    const stake1 = (bankroll * implied1) / totalImplied;
    const stake2 = (bankroll * implied2) / totalImplied;
    
    const return1 = stake1 * odds1;
    const return2 = stake2 * odds2;
    
    return {
        stake1,
        stake2,
        profit: return1 - bankroll
    };
};
