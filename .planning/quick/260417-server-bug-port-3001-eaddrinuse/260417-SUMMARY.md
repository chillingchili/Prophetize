---
phase: quick
plan: 260417
type: execute
subsystem: server
tags: [bugfix, eaddrinuse, error-handling, dev-experience]
requires: []
provides: [EADDRINUSE error handler, kill-port npm script]
affects: [server/src/index.ts, server/package.json]
tech-stack:
  added: []
  patterns: [server.on('error') for port conflict, inline node -e single-use scripts]
key-files:
  created: []
  modified:
    - server/src/index.ts (+26 lines)
    - server/package.json (+1 line)
decisions:
  - "Use server.on('error') before server.listen() per standard Node pattern"
  - "Inline node -e for kill-port script to avoid new files"
  - "Cross-platform netstat/lsof + taskkill/kill for port management"
metrics:
  duration: ~5 min
  completed: "2026-05-18"
---

# Quick 260417: Server EADDRINUSE error handler + kill-port script

## One-liner

Add EADDRINUSE error handler with PID detection to `server/src/index.ts` and a cross-platform `kill-port` npm script so developers can immediately identify and free the occupied port 3001.

## Tasks

| # | Name | Type | Commit | Key Files |
|---|------|------|--------|-----------|
| 1 | Kill process on port 3001 (PID 34268) | external | 7770783 | — |
| 2 | Add EADDRINUSE error handler | auto | a9a4be2 | server/src/index.ts |
| 3 | Add kill-port npm script | auto | df6b6d7 + 45e3299 | server/package.json |
| — | Verify: `npx tsc --noEmit` + script existence | verification | — | — |

## Execution Notes

**Task 1:** Found PID 34268 holding port 3001 via `netstat -ano | findstr :3001`. Killed with `taskkill /PID 34268 /F`.

**Task 2:** Inserted `server.on('error')` handler before `server.listen()` at line 143. On EADDRINUSE, it prints the port number, detects the offending PID via `netstat` (Windows) or `lsof` (Unix), and outputs a copy-pasteable kill command. Non-EADDRINUSE errors log and exit with code 1. File grew from 145 to 171 lines. TypeScript compiles cleanly.

**Task 3:** Added `kill-port` script to `server/package.json` using inline `node -e` — runs `netstat | findstr` on Windows, `lsof -ti` on Unix, then `taskkill` or `kill -9` respectively. Prints "Port 3001 is free" when nothing is listening.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] kill-port script variable shadowing**
- **Found during:** Task 3 (functional test)
- **Issue:** Variable `p` was used for both the platform check result (`process.platform==='win32'`) and subsequently overwritten by `execSync()` stdout. The platform branch check `p==='win32'` then evaluated against netstat output instead of the platform string, causing the script to fall through to `kill -9` on Windows.
- **Fix:** Stored platform check in `isWin` constant (not `p`), ensuring it survives the execSync call.
- **Files modified:** `server/package.json`
- **Commit:** 45e3299

**2. [Rule 1 - Bug] findstr exits with code 1 when no match found**
- **Found during:** Task 3 (functional test, port-free scenario)
- **Issue:** `findstr :3001` exits with exit code 1 when no lines match. `execSync` throws on non-zero exit codes, so the "Port 3001 is free" branch was never reached — the script always threw an unhandled error.
- **Fix:** Wrapped the `execSync` call in a try/catch to gracefully handle both "port in use" and "port free" cases.
- **Files modified:** `server/package.json`
- **Commit:** 45e3299

## Verification

- ✅ `cd server && npx tsc --noEmit` — clean (no output = no errors)
- ✅ `node -e "require('./package.json').scripts['kill-port'] && console.log('OK')"` — `kill-port` script exists
- ✅ `npm run kill-port` with no port: prints "Port 3001 is free"
- ✅ `npm run kill-port` with occupied port: prints "Killing PID XXXX", runs taskkill, prints "Port 3001 freed"

## Post-verification: Port 3001 is free
