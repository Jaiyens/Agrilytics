import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Client builds to dist/ which the Express server serves in production.
// In dev, Vite runs on 5173 and proxies /api to the Express server on 8080.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
});
