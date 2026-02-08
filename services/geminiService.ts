import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, RiskLevel, EventMatchResult } from "../types";

const getClient = () => {
    const key = process.env.API_KEY;
    if (!key || key.includes('undefined')) return null;
    return new GoogleGenAI({ apiKey: key });
};

// --- ROBUST STRING MATCHING (DICE COEFFICIENT) ---
// Used when AI is offline/blocked.
function getBigrams(str: string) {
    const s = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const v = new Array(s.length - 1);
    for (let i = 0; i < v.length; i++) {
        v[i] = s.slice(i, i + 2);
    }
    return v;
}

function stringSimilarity(str1: string, str2: string) {
    const pairs1 = getBigrams(str1);
    const pairs2 = getBigrams(str2);
    const union = pairs1.length + pairs2.length;
    let hitCount = 0;
    for (const x of pairs1) {
        for (const y of pairs2) {
            if (x === y) {
                hitCount++;
            }
        }
    }
    return (2.0 * hitCount) / union;
}

// --- CORE ANALYZER ---
export const analyzeMarket = async (title: string, description: string, price: number): Promise<AnalysisResult> => {
  const ai = getClient();
  
  if (!ai) {
      return {
          id: "err-auth",
          marketTitle: title,
          timestamp: new Date().toLocaleTimeString(),
          evScore: 0,
          impliedProbability: price,
          estimatedProbability: 0,
          alphaVerdict: 'NO ACTION',
          profitPotential: "0%",
          riskLevel: RiskLevel.HIGH,
          safetyVerdict: 'TRAP',
          summary: "API Key Config Error",
          reasoning: "System requires Gemini API Key to function.",
          safetyNotes: "Cannot verify market rules without AI access."
      };
  }

  // Fallback to simpler model if tools are not supported in the region/key
  const runSimpleAnalysis = async () => {
      const prompt = `
      Analyze Polymarket event: "${title}". Price: ${price}.
      Return JSON: { "estimatedProbability": float, "alphaVerdict": "BUY"|"SELL"|"NO ACTION", "profitPotential": string, "evScore": int, "reasoning": string, "riskLevel": string, "safetyVerdict": "CLEAN"|"TRAP", "summary": string }
      `;
      try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const text = response.text?.replace(/```json\n?|\n?```/g, "").trim() || "{}";
        return JSON.parse(text);
      } catch (e) {
          throw e;
      }
  };

  try {
    const data = await runSimpleAnalysis();
    return {
      id: Math.random().toString(36).substr(2, 9),
      marketTitle: title,
      timestamp: new Date().toLocaleTimeString(),
      evScore: data.evScore || 50,
      impliedProbability: price,
      estimatedProbability: data.estimatedProbability || price,
      alphaVerdict: data.alphaVerdict || 'NO ACTION',
      profitPotential: data.profitPotential || "Unknown",
      reasoning: data.reasoning || "Analysis inconclusive.",
      riskLevel: data.riskLevel as RiskLevel || RiskLevel.MEDIUM,
      safetyVerdict: data.safetyVerdict || 'SUSPICIOUS',
      safetyNotes: data.reasoning || "Could not verify rules.",
      summary: data.summary || "Processing..."
    };
  } catch (error) {
    console.error("AI Fatal Error", error);
    return {
      id: "err",
      marketTitle: title,
      timestamp: new Date().toLocaleTimeString(),
      evScore: 0,
      impliedProbability: price,
      estimatedProbability: 0,
      alphaVerdict: 'NO ACTION',
      profitPotential: "0%",
      riskLevel: RiskLevel.HIGH,
      safetyVerdict: 'TRAP',
      summary: "System Error",
      reasoning: "AI Unreachable.",
      safetyNotes: "Check connection."
    };
  }
};

// --- ROBUST IDENTITY VERIFICATION ---
// If AI fails (403/429), it falls back to string similarity
export const verifyEventIdentity = async (polyName: string, bookieName: string): Promise<EventMatchResult> => {
    const ai = getClient();
    
    // Fallback Logic: Dice Coefficient
    const runLocalHeuristic = () => {
        // 1. Normalize
        const n1 = polyName.toLowerCase().replace(/\b(vs|v\.|team|esports|gaming)\b/g, '').trim();
        const n2 = bookieName.toLowerCase().replace(/\b(vs|v\.|team|esports|gaming)\b/g, '').trim();

        // 2. Direct Inclusion check (Strongest)
        if (n1.includes(n2) || n2.includes(n1)) {
            return { isMatch: true, confidence: 0.9, reason: "Direct Substring Match" };
        }

        // 3. Dice Similarity (Fuzzy)
        const score = stringSimilarity(n1, n2);
        const isMatch = score > 0.35; // Lowered threshold for "close enough"

        return { 
            isMatch, 
            confidence: score, 
            reason: `Local Dice Score: ${score.toFixed(2)}` 
        };
    };

    if (!ai) return runLocalHeuristic();

    const prompt = `Match these two event titles. strict JSON boolean 'match'. Title1: "${polyName}", Title2: "${bookieName}"`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const text = response.text?.replace(/```json\n?|\n?```/g, "").trim() || "{}";
        const data = JSON.parse(text);
        return { isMatch: data.match, confidence: 0.95, reason: "AI Verified" };
    } catch (e) {
        // SILENT FAILOVER TO LOCAL
        return runLocalHeuristic();
    }
};
