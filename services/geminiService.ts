import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, RiskLevel } from "../types";

export const analyzeMarket = async (title: string, description: string, price: number): Promise<AnalysisResult> => {
  
  // 1. Define prompts
  const systemPrompt = `
  IDENTITY: You are a cynical, paranoid risk auditor for prediction markets. You do not trust anyone. Your job is to save the user money by finding "gotchas" in the rules.

  CONTEXT: 
  The user is betting on a market on Polymarket. 
  Market Title: "${title}"
  Current Price (Implied Probability): ${(price * 100).toFixed(1)}%

  OBJECTIVE:
  1. **Find the Trap:** Look for ambiguity. Does "Bitcoin hit $100k" mean on Binance or CoinGecko? Does it include wicks? If rules are missing/vague, flag as HIGH RISK.
  2. **Check the Odds:** If the price is 99%, is it essentially free money or is there a 1% risk of a black swan? If price is 50%, is it just a coin flip (Gambling)?
  3. **Honest Verdict:** Do not be polite. If it's a gamble, say "GAMBLE". If it looks like a scam/trap, say "AVOID".

  OUTPUT JSON STRICTLY:
  {
    "evScore": 0-100, // < 40 = Bad Bet, 40-60 = Gamble, > 75 = Good Value
    "riskLevel": "Safe" | "Low Risk" | "Medium Risk" | "High Risk" | "Scam / Ambiguous",
    "recommendation": "BUY" | "SELL" | "AVOID" | "HOLD",
    "summary": "Brutally honest 5-word verdict.",
    "reasoning": "Explain the specific risk or opportunity. Be concise and skeptical.",
    "keyRisks": ["Risk 1", "Risk 2"]
  }
  `;

  const userPrompt = `
  Analyze this market.
  Title: ${title}
  Description snippet: ${description.substring(0, 500)}
  `;

  // 2. Helper to run generation
  const runInference = async (modelName: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: { 
        systemInstruction: systemPrompt, 
        responseMimeType: "application/json",
      },
    });

    let text = response.text || "{}";
    
    // CLEANUP: Remove markdown formatting if the model adds it (common issue)
    text = text.replace(/```json\n?|\n?```/g, "").trim();

    const data = JSON.parse(text);

    return {
      id: Math.random().toString(36).substr(2, 9),
      marketTitle: title,
      timestamp: new Date().toLocaleTimeString(),
      evScore: data.evScore || 50,
      riskLevel: data.riskLevel as RiskLevel || RiskLevel.MEDIUM,
      recommendation: data.recommendation || 'HOLD',
      summary: data.summary || "Analysis inconclusive.",
      reasoning: data.reasoning || "Could not generate reasoning.",
      keyRisks: data.keyRisks || []
    };
  };

  try {
    // STRATEGY: Try High-Intelligence model first. If rate-limited (Free Tier), fallback to Fast model.
    try {
        console.log("Attempting analysis with Gemini 3 Pro...");
        return await runInference("gemini-3-pro-preview");
    } catch (primaryError) {
        console.warn("Pro model busy/limited. Switching to Flash...", primaryError);
        return await runInference("gemini-3-flash-preview");
    }

  } catch (error) {
    console.error("AI Fatal Error", error);
    return {
      id: "err",
      marketTitle: title,
      timestamp: new Date().toLocaleTimeString(),
      evScore: 0,
      riskLevel: RiskLevel.HIGH,
      recommendation: 'AVOID',
      summary: "AI Connection Failed",
      reasoning: "Ensure you have a valid API Key from Google AI Studio. It is free.",
      keyRisks: ["Offline"]
    };
  }
};