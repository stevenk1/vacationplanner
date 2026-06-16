import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies the PocketBase API + admin so the SPA can use same-origin paths
// (matches the Caddy reverse-proxy used in the Docker image).
//
// Under the Aspire AppHost, PORT and POCKETBASE_URL are injected so Aspire can manage
// the port and wire the dynamically-assigned PocketBase endpoint. Standalone
// `npm run dev` falls back to the original fixed values.
const pbTarget = process.env.POCKETBASE_URL ?? 'http://127.0.0.1:8090';

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5173,
    proxy: {
      '/api': pbTarget,
      '/_': pbTarget,
    },
  },
});
