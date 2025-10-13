import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { startBackendHealthMonitor } from './utils/backendHealthMonitor';

// Start monitoring backend health for auto-refresh on restart
if (import.meta.env.DEV) {
  startBackendHealthMonitor();
  console.log('👀 Backend health monitoring started');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
