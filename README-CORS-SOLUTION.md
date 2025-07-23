# CORS Solution for Gas Station Demo App

## Problem
The gas station API (`https://gas.movevm.tools`) doesn't include CORS headers, causing browser security policies to block requests from deployed applications.

## Solution
This demo implements a professional solution using Vercel serverless functions as a proxy.

### Architecture
```
Browser → Vercel App → Serverless Function (api/sponsor.js) → Gas Station API
```

### Files Added
- `api/sponsor.js` - Serverless function that proxies SUI requests to the gas station API
- `api/iota/sponsor.js` - Serverless function that proxies IOTA requests to the gas station API
- Both files handle CORS headers and forward requests securely to their respective endpoints

### How It Works

#### Development (localhost)
- Uses Create React App's proxy configuration in `package.json`
- SUI requests: `localhost:3000/api/sponsor` → proxied to `https://gas.movevm.tools/api/sponsor`
- IOTA requests: `localhost:3000/api/iota/sponsor` → proxied to `https://gas.movevm.tools/api/iota/sponsor`

#### Production (Vercel)
- Uses serverless functions at `/api/sponsor` (SUI) and `/api/iota/sponsor` (IOTA)
- Functions add proper CORS headers and forward to respective gas station API endpoints
- Maintains security while solving CORS issues for both networks

### Benefits
1. **Professional**: Clean architecture following serverless best practices
2. **Secure**: Validates inputs and handles errors properly
3. **Educational**: Shows proper way to handle CORS in production
4. **Maintainable**: Clear separation of concerns

### Alternative Solutions Considered
1. **Simple rewrites**: Would work but less educational value
2. **CORS proxy services**: Not suitable for production
3. **Asking API provider**: Not always feasible for demo purposes

This implementation serves as a reference for how to properly handle CORS issues in production web applications.