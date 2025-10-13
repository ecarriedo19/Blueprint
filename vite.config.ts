import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { backendWatchPlugin } from './vite-plugin-backend-watch';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    backendWatchPlugin({
      backendUrl: 'http://localhost:4000',
      checkInterval: 1500, // Check every 1.5 seconds
      onRestart: () => {
        console.log('\n🔄 Backend server restarted - Auto-refreshing browser...\n');
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
