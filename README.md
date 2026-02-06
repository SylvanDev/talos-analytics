# Talos Analytics

**AI-Powered Intelligence Engine for Prediction Markets**

Talos leverages Multi-Agent Consensus (powered by Gemini 3.0 Pro) to analyze Polymarket events for ambiguity traps, arbitrage opportunities, and mispriced odds.

![Talos](https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2670&auto=format&fit=crop)

## Features

*   **Live Feed:** Real-time ingestion of Polymarket events via Gamma API.
*   **Consensus Engine:** Gemini 3.0 Pro acts as a "Legal Auditor" to check resolution rules for scams.
*   **Hybrid Proxy:** Automatically switches between Vercel serverless functions and public proxies to ensure 100% uptime.

## 🚀 Launch Checklist (Vercel)

To deploy this for your grant application:

1.  **Push to GitHub:**
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin <your-repo-url>
    git push -u origin main
    ```

2.  **Deploy on Vercel:**
    *   Go to [Vercel Dashboard](https://vercel.com/dashboard) -> Add New Project.
    *   Import your GitHub repository.
    *   **CRITICAL STEP:** In "Environment Variables", add:
        *   **Key:** `API_KEY`
        *   **Value:** `YOUR_GOOGLE_GEMINI_KEY` (Get it free at aistudio.google.com)
    *   Click **Deploy**.

## Local Development

If running locally:
1.  Create a `.env` file in the root.
2.  Add `API_KEY=your_key_here`.
3.  Run `npm run dev`.

## Tech Stack

*   **Frontend:** React 19, TypeScript, Tailwind CSS
*   **AI:** Google Gemini 3.0 Pro & Flash (Auto-fallback)
*   **Data:** Polymarket Gamma API