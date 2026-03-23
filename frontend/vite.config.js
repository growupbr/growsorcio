import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: false,
    proxy: {
      '/api': 'http://localhost:3334',
    },
  },
  build: {
    minify: 'esbuild',          // built-in, no extra dep
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React — cacheable across every deploy
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          // Heavy visualisation lib — only loaded with Dashboard
          'vendor-recharts': ['recharts'],
          // DnD — only loaded with Kanban
          'vendor-dnd':      ['@dnd-kit/core', '@dnd-kit/utilities'],
          // Animation — only loaded with LandingPage
          'vendor-framer':   ['framer-motion'],
        },
      },
    },
  },
});
