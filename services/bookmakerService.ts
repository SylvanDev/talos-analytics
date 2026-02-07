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
    
    let targetKeys: string[] = [];

    if (sportsRes.ok) {
        const allSports = await sportsRes.json();
        if (Array.isArray(allSports)) {
             // FILTER: Capture Esports, but also Soccer/MMA/Basketball to ensure we have data to compare
             targetKeys = allSports
                .filter((s: any) => {
                    const group = s.group.toLowerCase();
                    return s.active && (
                        group.includes('esport') || 
                        group.includes('soccer') || 
                        s.key.includes('ufc') ||
                        group.includes('basketball')
                    );
                })
                .map((s: any) => s.key)
                .slice(0, 8); // Limit to top 8 leagues to save API quota
        }
    } else {
        console.error("Failed to fetch sports list", sportsRes.status);
        return [];
    }

    console.log("Active Sports Keys found:", targetKeys);

    if (targetKeys.length === 0) {
        console.warn("No active supported sports found in API.");
        return [];
    }

    // 2. FETCH ODDS FOR FOUND KEYS
    for (const key of targetKeys) {
        // requesting BetBoom (eu)
        const url = `${BASE_URL}/${key}/odds/?apiKey=${ODDS_API_KEY}&regions=eu&bookmakers=betboom&markets=h2h&oddsFormat=decimal`;
        
        try {
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    allMatches = [...allMatches, ...data];
                }
            } else {
                // Warning implies no data for this specific league, not a system crash
                console.warn(`No odds data for ${key} (Status: ${res.status})`);
            }
        } catch (err) {
            console.error(`Fetch error for ${key}`, err);
        }
    }
    
    return allMatches;
  } catch (e) {
    console.error("Critical Odds API Error:", e);
    return [];
  }
};

// Math Helpers remain the same
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
