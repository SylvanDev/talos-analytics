import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  // 1. Prioritize System Env (Vercel/Netlify Dashboard)
  // 2. Fallback to .env file
  // 3. Fallback to the keys provided by user (Hard Fix)
  const apiKey = process.env.API_KEY || env.API_KEY || "AIzaSyBQzXmtickLAIwe9xZF8UEyqZBUV-7nI-4";
  const polyKey = process.env.POLYMARKET_KEY || env.POLYMARKET_KEY || "019c309e-c212-7ce7-9c79-3c4770fa5185";

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.POLYMARKET_KEY': JSON.stringify(polyKey)
    },
    server: {
      proxy: {
        '/api/poly': {
          target: 'https://gamma-api.polymarket.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/poly/, ''),
          secure: true
        }
      }
    }
  };
});