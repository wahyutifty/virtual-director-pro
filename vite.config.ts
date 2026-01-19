
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env
  },
  server: {
    proxy: {
      '/api/google-labs': {
        target: 'https://labs.google.com', 
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google-labs/, ''),
      },
    },
  },
});
