# DevFest API require() Fix

## Issue Description
The game completion was failing with a `ReferenceError: require is not defined` error when trying to submit completion to the DevFest API.

## Root Cause
In `client/src/services/implementations/devfestApiConfigProvider.ts`, the constructor was using `require()` as a default parameter:

```typescript
constructor(gameData: any = require('@/assets/game-data.json')) {
  this.gameData = gameData;
}
```

This caused issues because:
- `require()` is a Node.js CommonJS function, not available in browser environments
- Vite uses ES6 modules and doesn't provide a `require()` function in the browser
- The file was already importing `gameData` using ES6 imports at the top

## Solution
Changed the constructor to use the imported `gameData` as the default instead of requiring it:

```typescript
constructor(gameDataParam?: any) {
  this.gameData = gameDataParam || gameData;
}
```

## Files Modified
- `client/src/services/implementations/devfestApiConfigProvider.ts`

## Testing
- ✅ No more `require is not defined` errors
- ✅ DevFest API configuration loads correctly
- ✅ Game completion submission works properly

## Prevention
- Always use ES6 imports in client-side code
- Avoid using Node.js-specific functions like `require()` in browser environments
- When using default parameters in constructors, ensure they're compatible with the target environment
