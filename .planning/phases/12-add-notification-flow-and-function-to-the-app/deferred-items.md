# Deferred Items — Phase 12

## Pre-existing Issues (not caused by this phase)

### TS error in client/constants/ui-tokens.ts:170
- **Issue:** `useEffect` cleanup returns boolean from `listeners.delete(fn)` instead of void
- **Error:** `Type '() => boolean' is not assignable to type 'EffectCallback'`
- **Impact:** Blocks `npx tsc --noEmit` from passing cleanly
- **Noticed:** 2026-05-17 during Phase 12-02 execution
