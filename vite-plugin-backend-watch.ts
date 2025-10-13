import type { Plugin, ViteDevServer } from 'vite';

interface BackendWatchOptions {
  backendUrl?: string;
  checkInterval?: number;
  onRestart?: () => void;
}

/**
 * Vite plugin that monitors the backend server and triggers a browser refresh when it restarts
 */
export function backendWatchPlugin(options: BackendWatchOptions = {}): Plugin {
  const {
    backendUrl = 'http://localhost:4000',
    checkInterval = 1000,
    onRestart = () => console.log('🔄 Backend restarted - refreshing browser...')
  } = options;

  let server: ViteDevServer;
  let backendStartTime: number | null = null;
  let checkTimer: NodeJS.Timeout | null = null;
  let isChecking = false;

  const checkBackendHealth = async () => {
    if (isChecking) return;
    isChecking = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 500);

      const response = await fetch(`${backendUrl}/api/health`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (response && response.ok) {
        const data = await response.json().catch(() => ({}));
        const currentStartTime = data.startTime;

        // Check if backend has restarted
        if (backendStartTime !== null && currentStartTime && currentStartTime !== backendStartTime) {
          onRestart();
          
          // Trigger full page reload via WebSocket
          server.ws.send({
            type: 'full-reload',
            path: '*'
          });
        }

        backendStartTime = currentStartTime;
      }
    } catch (error) {
      // Backend might be restarting, just wait for next check
    } finally {
      isChecking = false;
    }
  };

  return {
    name: 'vite-plugin-backend-watch',
    
    configureServer(_server: ViteDevServer) {
      server = _server;

      // Start monitoring backend health
      checkTimer = setInterval(checkBackendHealth, checkInterval);

      // Initial check
      setTimeout(checkBackendHealth, 1000);

      server.httpServer?.once('close', () => {
        if (checkTimer) {
          clearInterval(checkTimer);
        }
      });
    },

    buildStart() {
      console.log('👀 Watching backend for restarts...');
    },
    
    closeBundle() {
      if (checkTimer) {
        clearInterval(checkTimer);
      }
    }
  };
}

