import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Prioritize process.env (Vercel System Vars) -> .env files -> Defaults
  const apiKey = process.env.API_KEY || env.API_KEY;
  // Use the provided key directly if not in env
  const polyKey = process.env.POLYMARKET_KEY || env.POLYMARKET_KEY || "019c309e-c212-7ce7-9c79-3c4770fa5185";

  return {
    plugins: [react()],
    define: {
      // Injects the values at build time
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