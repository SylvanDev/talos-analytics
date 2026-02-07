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
    
    let esportsKeys: string[] = [];

    if (sportsRes.ok) {
        const allSports = await sportsRes.json();
        if (Array.isArray(allSports)) {
             esportsKeys = allSports
                .filter((s: any) => s.group.toLowerCase().includes('esport') || s.key.toLowerCase().includes('esport'))
                .map((s: any) => s.key);
        }
    }

    // FALLBACK IF DYNAMIC FAILS (Crucial Fix)
    // If the API returns 0 keys for 'esport' group, we force check these specific keys
    if (esportsKeys.length === 0) {
        console.warn("Dynamic discovery returned 0 keys. Using Fallback Keys.");
        esportsKeys = [
            'esports_csgo', 
            'esports_dota2', 
            'esports_leagueoflegends', 
            'esports_valorant'
        ];
    } else {
        console.log("Active Esports Keys found:", esportsKeys);
    }

    // 2. FETCH ODDS
    for (const key of esportsKeys) {
        // requesting specifically BetBoom (key: betboom) in EU region
        const url = `${BASE_URL}/${key}/odds/?apiKey=${ODDS_API_KEY}&regions=eu&bookmakers=betboom&markets=h2h&oddsFormat=decimal`;
        
        try {
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    allMatches = [...allMatches, ...data];
                }
            } else {
                console.warn(`No odds for ${key}: ${res.status}`);
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
