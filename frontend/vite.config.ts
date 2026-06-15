import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies the PocketBase API + admin so the SPA can use same-origin paths
// (matches the Caddy reverse-proxy used in the Docker image).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8090',
      '/_': 'http://127.0.0.1:8090',
    },
  },
});
