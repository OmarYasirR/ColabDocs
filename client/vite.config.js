// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  resolve: {
    alias: {
      // Allows optional `@/` absolute imports if preferred over relative
      // paths in future files; existing files in this project
      // intentionally stick to relative imports for clarity.
      '@': '/src',
    },
  },
});