import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true, // falha se porta 3000 estiver ocupada (evita conflito com backend na 3001)
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
