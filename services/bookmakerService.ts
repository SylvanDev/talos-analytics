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

    // 1. DYNAMICALLY FETCH ACTIVE SPORTS (Fixes 404s)
    // We ask the API: "What sports are available right now?"
    const sportsUrl = `${BASE_URL}/?apiKey=${ODDS_API_KEY}`;
    const sportsRes = await fetch(sportsUrl);
    
    if (!sportsRes.ok) {
        console.error("Failed to fetch active sports list:", sportsRes.status);
        return [];
    }

    const allSports = await sportsRes.json();
    
    if (!Array.isArray(allSports)) {
        console.error("Sports list is not an array");
        return [];
    }

    // 2. FILTER FOR ESPORTS
    // We look for anything that looks like esports
    const esportsKeys = allSports
        .filter((s: any) => s.group.toLowerCase().includes('esport') || s.key.toLowerCase().includes('esport'))
        .map((s: any) => s.key);

    console.log("Active Esports Keys found:", esportsKeys);

    if (esportsKeys.length === 0) return [];

    // 3. FETCH ODDS FOR ACTIVE KEYS
    for (const key of esportsKeys) {
        // requesting specifically BetBoom (key: betboom) in EU region
        // fallback to generic query if betboom specific fails, but filter later
        const url = `${BASE_URL}/${key}/odds/?apiKey=${ODDS_API_KEY}&regions=eu&bookmakers=betboom&markets=h2h&oddsFormat=decimal`;
        
        try {
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    allMatches = [...allMatches, ...data];
                }
            } else {
                // Just log warning, don't break loop
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
