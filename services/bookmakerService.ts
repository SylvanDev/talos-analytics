import { BookmakerMatch } from "../types";

// HARDCODED REAL KEY AS REQUESTED
const ODDS_API_KEY = "1a4af9d22ff22e09f7fded6676615fab";
const BASE_URL = 'https://api.the-odds-api.com/v4/sports';

export const fetchEsportsOdds = async (): Promise<BookmakerMatch[]> => {
  if (!ODDS_API_KEY) {
    console.error("API Key missing.");
    return [];
  }

  try {
    // Specific Esports keys supported by Odds API
    const sportKeys = ['esports_csgo', 'esports_dota2', 'esports_leagueoflegends'];
    let allMatches: BookmakerMatch[] = [];

    // Fetch strictly from API. No mocks.
    for (const key of sportKeys) {
        // requesting specifically BetBoom (key: betboom) in EU region
        const url = `${BASE_URL}/${key}/odds/?apiKey=${ODDS_API_KEY}&regions=eu&bookmakers=betboom&markets=h2h&oddsFormat=decimal`;
        
        const res = await fetch(url);
        if (res.ok) {
            // Check quota headers if needed, but for now just get json
            const data = await res.json();
            if (Array.isArray(data)) {
                allMatches = [...allMatches, ...data];
            }
        } else {
            console.error(`API Error for ${key}: ${res.status}`);
        }
    }
    
    return allMatches;
  } catch (e) {
    console.error("Critical Odds API Error:", e);
    return []; // Return empty array on error, NEVER mock data
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
