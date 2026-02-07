import { BookmakerMatch } from "../types";

const ODDS_API_KEY = (import.meta as any).env?.VITE_ODDS_API_KEY || (process.env as any).VITE_ODDS_API_KEY;
const BASE_URL = 'https://api.the-odds-api.com/v4/sports';

// MOCK DATA for testing without burning API credits
const MOCK_ODDS: BookmakerMatch[] = [
  {
    id: "mock-1",
    sport_key: "esports_csgo",
    sport_title: "CS:GO",
    commence_time: new Date(Date.now() + 3600000).toISOString(),
    home_team: "Team Spirit",
    away_team: "FaZe Clan",
    bookmakers: [
      {
        key: "pinnacle",
        title: "Pinnacle",
        last_update: new Date().toISOString(),
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Team Spirit", price: 1.45 },
              { name: "FaZe Clan", price: 2.75 } // Implied ~36%
            ]
          }
        ]
      }
    ]
  },
  {
    id: "mock-2",
    sport_key: "esports_dota2",
    sport_title: "Dota 2",
    commence_time: new Date(Date.now() + 7200000).toISOString(),
    home_team: "Gaimin Gladiators",
    away_team: "Team Liquid",
    bookmakers: [
      {
        key: "betfair",
        title: "Betfair",
        last_update: new Date().toISOString(),
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Gaimin Gladiators", price: 1.60 },
              { name: "Team Liquid", price: 2.30 }
            ]
          }
        ]
      }
    ]
  }
];

export const fetchEsportsOdds = async (useMock = true): Promise<BookmakerMatch[]> => {
  if (useMock || !ODDS_API_KEY) {
    console.log("Using Mock Bookmaker Data");
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_ODDS), 800));
  }

  try {
    // Fetching generic esports data. In a real app, you might iterate through keys:
    // upcoming, esports_csgo, esports_dota2, etc.
    // For demo, we'll try to fetch general esports if available or specific games
    const sportKeys = ['esports_csgo', 'esports_dota2', 'esports_leagueoflegends'];
    let allMatches: BookmakerMatch[] = [];

    for (const key of sportKeys) {
        const url = `${BASE_URL}/${key}/odds/?apiKey=${ODDS_API_KEY}&regions=eu,us&markets=h2h&oddsFormat=decimal`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            allMatches = [...allMatches, ...data];
        }
    }
    
    return allMatches;
  } catch (e) {
    console.error("Odds API Error:", e);
    return MOCK_ODDS; // Fallback
  }
};

// Math Helpers
export const calculateArbProfit = (odds1: number, odds2: number) => {
    const implied1 = 1 / odds1;
    const implied2 = 1 / odds2;
    const totalImplied = implied1 + implied2;
    
    // If total < 1.0, we have an arb
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