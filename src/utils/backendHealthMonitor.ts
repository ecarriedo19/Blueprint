/**
 * Client-side backend health monitor
 * Shows a toast notification when backend restarts are detected
 */

let lastStartTime: number | null = null;
let isMonitoring = false;
let checkInterval: number | null = null;

export function startBackendHealthMonitor() {
  if (isMonitoring) return;
  
  isMonitoring = true;
  
  // Check backend health every 2 seconds
  checkInterval = window.setInterval(async () => {
    try {
      const response = await fetch('/api/health', {
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Detect backend restart
        if (lastStartTime !== null && data.startTime !== lastStartTime) {
          console.log('🔄 Backend restarted detected - page will reload');
          
          // Show a brief notification before reload (optional)
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
          `;
          notification.innerHTML = '🔄 Backend updated - Refreshing...';
          document.body.appendChild(notification);
          
          // Reload after a brief delay to show the notification
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
        
        lastStartTime = data.startTime;
      }
    } catch (error) {
      // Backend might be temporarily down during restart
      console.log('⏳ Backend health check failed (might be restarting)');
    }
  }, 2000);
}

export function stopBackendHealthMonitor() {
  if (checkInterval !== null) {
    window.clearInterval(checkInterval);
    checkInterval = null;
  }
  isMonitoring = false;
}

// Add CSS animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}

