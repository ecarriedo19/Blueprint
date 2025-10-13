# 🔄 Auto-Refresh on Backend Restart - Implementation Guide

## Overview

Your development environment now features **automatic browser refresh** when the backend server restarts. This eliminates the need to manually refresh the browser after backend code changes!

---

## ✨ What Was Implemented

### 1. **Backend Health Endpoint** (`server.cjs`)
- Added `/api/health` endpoint that returns server start time
- Tracks `SERVER_START_TIME` constant to detect restarts
- Returns server uptime and status

```javascript
GET /api/health
Response: {
  "status": "ok",
  "startTime": 1234567890,
  "uptime": 45000,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. **Vite Plugin for Backend Monitoring** (`vite-plugin-backend-watch.ts`)
- Custom Vite plugin that polls `/api/health` endpoint
- Detects when backend `startTime` changes (indicating restart)
- Triggers automatic page reload via Vite's WebSocket
- Only runs during development (not in production)

### 3. **Client-Side Health Monitor** (`src/utils/backendHealthMonitor.ts`)
- Additional client-side monitoring for redundancy
- Shows beautiful notification toast before reload
- Runs in background every 2 seconds
- Only enabled in development mode

### 4. **Auto-Restart with Nodemon** (`nodemon.json`)
- Backend automatically restarts when `server.cjs` changes
- Watches `scripts/modules/**/*.js` for changes
- 1-second delay to prevent multiple restarts
- Ignores frontend files for efficiency

---

## 🎯 How It Works

### The Full Flow:

```
1. You save server.cjs
   ↓
2. Nodemon detects change → restarts backend
   ↓
3. Backend gets new SERVER_START_TIME
   ↓
4. Vite plugin polls /api/health → detects new startTime
   ↓
5. Vite sends 'full-reload' via WebSocket
   ↓
6. Client-side monitor shows notification toast
   ↓
7. Browser automatically refreshes ✨
```

### Dual Monitoring System:

- **Server-side (Vite Plugin)**: Polls every 1.5 seconds, triggers reload via WebSocket
- **Client-side (Health Monitor)**: Polls every 2 seconds, shows visual notification

Both work together for maximum reliability!

---

## 🚀 Development Workflow

### Frontend Changes (React, CSS, Components):
```bash
# Edit any .tsx, .css file → Save
✅ Instant HMR update (no page reload)
⚡ Lightning fast!
```

### Backend Changes (server.cjs, API routes):
```bash
# Edit server.cjs → Save
[nodemon] restarting due to changes...
[nodemon] starting `node server.cjs`
✅ Backend server ready!
🔄 Backend updated - Refreshing...
✨ Browser auto-refreshes!
```

**No more manual F5! 🎉**

---

## 📂 Files Modified/Created

### Created:
- ✅ `vite-plugin-backend-watch.ts` - Vite plugin for backend restart detection
- ✅ `src/utils/backendHealthMonitor.ts` - Client-side health monitoring
- ✅ `nodemon.json` - Nodemon configuration
- ✅ `AUTO_REFRESH_GUIDE.md` - This documentation

### Modified:
- ✅ `server.cjs` - Added health endpoint and SERVER_START_TIME
- ✅ `vite.config.ts` - Integrated backend watch plugin
- ✅ `src/main.tsx` - Started health monitor
- ✅ `package.json` - Updated scripts to use nodemon

---

## ⚙️ Configuration

### Adjust Check Interval

**Vite Plugin** (`vite.config.ts`):
```typescript
backendWatchPlugin({
  backendUrl: 'http://localhost:4000',
  checkInterval: 1500, // ← Change this (milliseconds)
  onRestart: () => {
    console.log('Backend restarted!');
  }
})
```

**Client Monitor** (`src/utils/backendHealthMonitor.ts`):
```typescript
// Line 14
checkInterval = window.setInterval(async () => {
  // ...
}, 2000); // ← Change this (milliseconds)
```

### Disable Auto-Refresh

**Option 1: Disable Client-Side Monitor**
Comment out in `src/main.tsx`:
```typescript
// if (import.meta.env.DEV) {
//   startBackendHealthMonitor();
// }
```

**Option 2: Disable Vite Plugin**
Comment out in `vite.config.ts`:
```typescript
plugins: [
  react(),
  // backendWatchPlugin({ ... })
]
```

**Option 3: Use Production Mode**
```bash
npm run start:prod  # No auto-restart or auto-refresh
```

---

## 🎨 Customization

### Change Notification Style

Edit `src/utils/backendHealthMonitor.ts` (line 24):
```typescript
notification.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); // ← Your colors
  color: white;
  padding: 16px 24px;
  border-radius: 8px; // ← Your radius
  // ... add your styles
`;
notification.innerHTML = '🔄 Your Custom Message'; // ← Your message
```

### Add Sound Effect

```typescript
// After line 35 in backendHealthMonitor.ts
const audio = new Audio('/notification-sound.mp3');
audio.play().catch(() => {});
```

---

## 🧪 Testing the Feature

### Test Auto-Refresh:

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Open browser**: Navigate to `http://localhost:5173`

3. **Open DevTools Console**: Watch for monitoring logs

4. **Edit `server.cjs`**: Add a console.log anywhere
   ```javascript
   console.log('🧪 Testing auto-refresh!');
   ```

5. **Save the file** and watch:
   ```
   Terminal:
   [nodemon] restarting due to changes...
   [nodemon] starting `node server.cjs`
   
   Browser Console:
   🔄 Backend restarted detected - page will reload
   
   Browser:
   Shows notification toast → Auto-refreshes ✨
   ```

---

## 🐛 Troubleshooting

### Browser doesn't refresh?

1. **Check terminal for errors**:
   ```bash
   # Look for:
   [nodemon] restarting due to changes...
   [nodemon] starting `node server.cjs`
   ✅ Backend server ready!
   ```

2. **Check browser console**:
   ```javascript
   // Should see:
   👀 Backend health monitoring started
   🔄 Backend restarted detected - page will reload
   ```

3. **Verify health endpoint**:
   - Visit: `http://localhost:4000/api/health`
   - Should see: `{ "status": "ok", "startTime": ... }`

4. **Check Vite plugin is loaded**:
   ```bash
   # Terminal should show:
   👀 Watching backend for restarts...
   ```

### Restarts too frequently?

- Increase `delay` in `nodemon.json`:
  ```json
  {
    "delay": "2000"  // 2 seconds instead of 1
  }
  ```

### Want manual refresh back?

- Use production mode: `npm run start:prod`

---

## 📊 Performance Impact

- **Minimal**: 2 lightweight HTTP GET requests per 3 seconds
- **Backend**: +1 simple endpoint (`/api/health`)
- **Frontend**: +2KB of monitoring code (only in dev mode)
- **Production**: Zero impact (monitoring disabled in production)

---

## 🎓 How This Differs from HMR

### Hot Module Replacement (HMR):
- **What**: Swaps changed modules without full reload
- **When**: Frontend code changes (React, CSS)
- **Speed**: Instant (< 100ms)
- **State**: Preserves React state

### Auto-Refresh:
- **What**: Full page reload
- **When**: Backend code changes (server.cjs)
- **Speed**: Fast (~1-2 seconds)
- **State**: Resets all state (necessary for backend changes)

---

## 💡 Future Enhancements

Possible additions:
- ✨ Desktop notifications (using `node-notifier`)
- 📊 Restart count dashboard
- 🔊 Sound effects for different event types
- 📝 Changelog popup showing what changed
- 🎯 Smart state preservation (save form data before reload)
- 🚀 Faster reload using service workers

---

## 🎉 Benefits Summary

✅ **No more manual refresh** after backend changes  
✅ **Smooth developer experience** - just save and see results  
✅ **Visual feedback** - know when backend restarts  
✅ **Configurable** - adjust to your preferences  
✅ **Production-safe** - only runs in development  
✅ **Reliable** - dual monitoring system  
✅ **Fast** - intelligent polling intervals  

---

## 📚 Related Files

- `server.cjs` - Backend server with health endpoint
- `vite.config.ts` - Vite configuration with plugin
- `vite-plugin-backend-watch.ts` - Server-side monitoring
- `src/utils/backendHealthMonitor.ts` - Client-side monitoring
- `src/main.tsx` - Entry point with monitor initialization
- `nodemon.json` - Auto-restart configuration
- `package.json` - Updated scripts

---

**Happy coding! Now you can focus on writing code instead of refreshing the browser! 🚀**

