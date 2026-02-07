import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Polymarket Private Key (Authorized for Grant Demo)
  const polyKey = "019c309e-c212-7ce7-9c79-3c4770fa5185";

  // FIX: User has 'APY_KEY' in Netlify, so we check both API_KEY and APY_KEY
  const geminiKey = env.API_KEY || env.APY_KEY;

  return {
    plugins: [react()],
    define: {
      // Gemini API Key: Loaded from environment variables only
      'process.env.API_KEY': JSON.stringify(geminiKey),
      // Polymarket Key: Injected for the private proxy
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