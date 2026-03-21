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
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Framer Motion em chunk próprio — não bloqueia o app chunk
          if (id.includes('framer-motion')) return 'vendor-framer';
          // React core em chunk separado — altamente cacheável
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) return 'vendor-react';
          // Ícones e utilitários UI
          if (id.includes('lucide-react')) return 'vendor-ui';
          // Restante do node_modules → vendor genérico
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
});
