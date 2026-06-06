import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // В деве проксируем /api на бэкенд, чтобы не возиться с CORS.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
});
