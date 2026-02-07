import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, RiskLevel, EventMatchResult } from "../types";

const getClient = () => {
    const key = process.env.API_KEY;
    if (!key || key.includes('undefined')) return null;
    return new GoogleGenAI({ apiKey: key });
};

// --- CORE ANALYZER (EXISTING) ---
export const analyzeMarket = async (title: string, description: string, price: number): Promise<AnalysisResult> => {
  const ai = getClient();
  
  // 0. Pre-flight Check
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

  // 1. Define prompts for TALOS 2.0 (Hybrid Engine)
  const systemPrompt = `
  IDENTITY: You are TALOS, a dual-engine prediction market analyzer. You have two personalities running in parallel:
  1. THE AUDITOR (Paranoid): Checks for scams, wording traps, and ambiguity.
  2. THE TRADER (Aggressive): Calculates Expected Value (EV), compares market odds vs reality, and looks for profit.

  CONTEXT: 
  Market: "${title}"
  Current Price: ${(price * 100).toFixed(1)} cents (Implied Probability: ${(price * 100).toFixed(1)}%)

  TASK:
  Perform a dual analysis.
  
  A) SAFETY CHECK:
  - Is the resolution source ambiguous? 
  - Are there "gotcha" clauses?
  - If risks exist, set riskLevel to HIGH.

  B) ALPHA CHECK (PROFIT):
  - Based on general knowledge, logic, and recent news trends, what is the *real* probability of this happening?
  - Compare Real Prob vs Market Price.
  - If Real Prob > Market Price (+Margin), it's a BUY.
  - If Real Prob < Market Price, it's a SELL (No).

  OUTPUT JSON STRICTLY:
  {
    "estimatedProbability": 0.0-1.0, // Your calculated probability
    "alphaVerdict": "BUY" | "SELL" | "NO ACTION",
    "profitPotential": "string", // e.g. "+20% ROI" or "Negative EV"
    "evScore": 0-100, // 0=Bad Bet, 100=Free Money
    "reasoning": "Why is this a good/bad financial bet?",
    
    "riskLevel": "Safe" | "Low Risk" | "Medium Risk" | "High Risk" | "Scam / Ambiguous",
    "safetyVerdict": "CLEAN" | "SUSPICIOUS" | "TRAP",
    "safetyNotes": "Specific comments on rules/wording/scam risks.",
    
    "summary": "Combined 5-word verdict (e.g. 'Safe High-Yield Opportunity' or 'Risky Trap - Avoid')."
  }
  `;

  const userPrompt = `
  Analyze this Polymarket event.
  Title: ${title}
  Rules/Description: ${description.substring(0, 1000)}
  Current Price: ${price}
  `;

  // 2. Helper to run generation
  const runInference = async (modelName: string) => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: { 
        systemInstruction: systemPrompt, 
        responseMimeType: "application/json",
      },
    });

    let text = response.text || "{}";
    text = text.replace(/```json\n?|\n?```/g, "").trim();
    const data = JSON.parse(text);

    return {
      id: Math.random().toString(36).substr(2, 9),
      marketTitle: title,
      timestamp: new Date().toLocaleTimeString(),
      
      // Alpha Data
      evScore: data.evScore || 50,
      impliedProbability: price,
      estimatedProbability: data.estimatedProbability || price,
      alphaVerdict: data.alphaVerdict || 'NO ACTION',
      profitPotential: data.profitPotential || "Unknown",
      reasoning: data.reasoning || "Analysis inconclusive.",

      // Safety Data
      riskLevel: data.riskLevel as RiskLevel || RiskLevel.MEDIUM,
      safetyVerdict: data.safetyVerdict || 'SUSPICIOUS',
      safetyNotes: data.safetyNotes || "Could not verify rules.",

      summary: data.summary || "Processing..."
    };
  };

  try {
    try {
        // Try Pro for better reasoning
        return await runInference("gemini-3-pro-preview");
    } catch (primaryError) {
        // Fallback to Flash
        console.warn("Switching to Flash model...");
        return await runInference("gemini-3-flash-preview");
    }

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

// --- NEW: EVENT IDENTITY MATCHER (THE "MAPPING" BRAIN) ---
export const verifyEventIdentity = async (polyName: string, bookieName: string): Promise<EventMatchResult> => {
    const ai = getClient();
    if (!ai) return { isMatch: false, confidence: 0, reason: "No API Key" };

    const prompt = `
    Task: Event Identity Verification (Arbitrage Mapping)
    
    Source A (Polymarket): "${polyName}"
    Source B (Bookmaker Scrape): "${bookieName}"

    Are these strictly the same real-world sporting or political event? 
    Ignore minor spelling differences or formatting (e.g. "Man City" vs "Manchester City").
    
    Return JSON:
    {
        "match": boolean,
        "confidence": number (0.0 - 1.0),
        "reason": "Short explanation"
    }
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        const text = response.text?.replace(/```json\n?|\n?```/g, "").trim() || "{}";
        const data = JSON.parse(text);

        return {
            isMatch: data.match,
            confidence: data.confidence,
            reason: data.reason
        };
    } catch (e) {
        console.error("Mapping failed", e);
        return { isMatch: false, confidence: 0, reason: "AI Error" };
    }
};