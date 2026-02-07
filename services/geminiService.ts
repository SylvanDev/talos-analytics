import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, RiskLevel, EventMatchResult } from "../types";

const getClient = () => {
    const key = process.env.API_KEY;
    if (!key || key.includes('undefined')) return null;
    return new GoogleGenAI({ apiKey: key });
};

// --- CORE ANALYZER (UPDATED WITH SEARCH) ---
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

  // 1. Define prompts for TALOS 2.0 (Hybrid Engine)
  const systemPrompt = `
  IDENTITY: You are TALOS, a professional prediction market analyst.
  
  CRITICAL INSTRUCTION: You MUST use the 'googleSearch' tool to verify the latest news about this event.
  Do not hallucinate. If search returns nothing, admit it.

  CONTEXT: 
  Market: "${title}"
  Current Price: ${(price * 100).toFixed(1)} cents (Implied Probability: ${(price * 100).toFixed(1)}%)

  TASK:
  1. SEARCH: Look for recent news (last 24-48h) related to this event.
  2. SAFETY CHECK: Check if the market wording is ambiguous or a known scam format.
  3. ALPHA CHECK: Compare the real-world probability (based on news) vs the Market Price.

  OUTPUT JSON STRICTLY:
  {
    "estimatedProbability": 0.0-1.0, // Your calculated probability based on NEWS
    "alphaVerdict": "BUY" | "SELL" | "NO ACTION",
    "profitPotential": "string", // e.g. "+20% ROI" or "Negative EV"
    "evScore": 0-100, // 0=Bad Bet, 100=Free Money
    "reasoning": "Cite specific news from your search. Why is the price wrong?",
    
    "riskLevel": "Safe" | "Low Risk" | "Medium Risk" | "High Risk" | "Scam / Ambiguous",
    "safetyVerdict": "CLEAN" | "SUSPICIOUS" | "TRAP",
    "safetyNotes": "Any warnings about the rules or lack of info.",
    
    "summary": "Short 5-word verdict."
  }
  `;

  const userPrompt = `
  Analyze this Polymarket event.
  Title: ${title}
  Rules/Description: ${description.substring(0, 1000)}
  Current Price: ${price}
  `;

  // 2. Helper to run generation with TOOLS
  const runInference = async (modelName: string) => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: { 
        systemInstruction: systemPrompt, 
        responseMimeType: "application/json",
        tools: [{googleSearch: {}}] // ENABLE INTERNET ACCESS
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
    // Search is only available on Pro models generally, or robust Flash models.
    // Using gemini-2.0-flash-exp or similar usually supports search best, but per rules:
    // We try Pro first for deep reasoning.
    try {
        return await runInference("gemini-3-pro-preview");
    } catch (primaryError) {
        console.warn("Pro model failed, switching to Flash...", primaryError);
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
      reasoning: "AI Unreachable or Search Failed.",
      safetyNotes: "Check connection."
    };
  }
};

export const verifyEventIdentity = async (polyName: string, bookieName: string): Promise<EventMatchResult> => {
    // Existing logic...
    const ai = getClient();
    if (!ai) return { isMatch: false, confidence: 0, reason: "No API Key" };

    const prompt = `Match these events: "${polyName}" vs "${bookieName}". JSON { match: bool, confidence: float, reason: string }`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const text = response.text?.replace(/```json\n?|\n?```/g, "").trim() || "{}";
        const data = JSON.parse(text);
        return { isMatch: data.match, confidence: data.confidence, reason: data.reason };
    } catch (e) {
        return { isMatch: false, confidence: 0, reason: "AI Error" };
    }
};