# Roadmap

## Project: Prophetize
**Created**: 2026-03-21

## Overview
This roadmap outlines the development phases for the Prophetize prediction market app, starting with the immediate profile page enhancement and extending to future core features.

## Phase 1: Profile Enhancement
**Goal**: Polish the user profile screen to match the app’s design system and provide a comprehensive view of user stats, activity, and settings.

### Scope
- Implement FR‑1 through FR‑6 from REQUIREMENTS.md
- Ensure visual consistency with Explore and Leaderboard tabs
- Use mock data for stats and activity
- Pass all lint/type checks

### Success Criteria
✅ Profile header matches white‑header‑with‑border pattern  
✅ User identity section displays avatar, username, join date, net worth pill  
✅ Statistics grid shows win rate and total predictions  
✅ Recent activity list renders with proper outcome badges  
✅ Settings menu includes Notifications, Support, Security, Log Out  
✅ Zero TypeScript/lint errors  
✅ No regression in existing tabs

### Tasks
1. **Update profile.tsx** – apply white header, net worth pill, consistent spacing  
2. **Clean up imports** – remove unused `api`, `BalanceCard`, `authLoading`  
3. **Verify tokens** – ensure all colors come from `UI_COLORS`/`ExploreTheme`  
4. **Run validation** – lint, typecheck, and visual inspection

### Timeline
- **Estimate**: 1‑2 hours (mostly completed)
- **Status**: In progress (UI updated, lint warnings addressed)

### Dependencies
- Existing design tokens (`ui‑tokens.ts`, `explore‑theme.ts`)
- Profile subcomponents (`profile‑avatar`, `stat‑card`, `activity‑item`, `settings‑item`)

## Phase 2: Backend Integration
**Goal**: Deliver backend contracts required by current frontend integration priorities, starting with leaderboard and category endpoints.

### Scope
- Implement `GET /markets/categories` public endpoint returning category keys for Categories screen
- Implement `GET /leaderboard` public endpoint with period + pagination validation and `{ data, meta }` contract
- Implement `GET /leaderboard/me` auth-required endpoint for "Your Rank" card with 401/400/404 semantics
- Preserve `POST /auth/refresh-token` request/response compatibility while adding leaderboard/category routes
- Add contract verification tests and rollback runbook for safe deployment

### Success Criteria
- `GET /markets/categories` returns uppercase string array contract
- `GET /leaderboard` returns contract-compliant `data` + `meta` with valid pagination behavior
- `GET /leaderboard/me` returns required auth and ranking status semantics (401/400/404/200)
- Frontend leaderboard and categories screens can consume backend without mock fallback regressions
- Auth refresh flow remains unchanged and verified

### Timeline
- **Estimate**: 3‑5 days (backend + frontend work)
- **Status**: Not started

### Dependencies
- Supabase backend tables for users, predictions, markets
- Authentication context already in place

## Phase 3: Advanced Features
**Goal**: Implement core prediction‑market functionality beyond the profile page.

### Scope
- **Market creation** – allow users to create new prediction markets (admin approval required before public visibility/trading)
- **Trading interface** – buy/sell shares in markets
- **Real‑time updates** – live odds, balance, activity via WebSockets
- **Notifications** – push notifications for market resolution, price alerts
- **Social features** – following, leaderboard, comments

### Success Criteria
- Users can create a market with title, description, resolution date and see pending-approval status
- Users can trade shares with fake currency
- Real‑time updates work across tabs
- Notifications are delivered and actionable

### Timeline
- **Estimate**: 2‑4 weeks per major feature
- **Status**: Future

### Dependencies
- Backend market/trade models
- WebSocket infrastructure (Socket.io already in package.json)
- Push notification service (Expo Notifications)

**Plans:** 4/4 plans complete

Plans:
- [x] 03-01-PLAN.md — Market creation API + client flow baseline
- [x] 03-02-PLAN.md — Trading contract hardening and UI integration
- [x] 03-03-PLAN.md — Realtime socket events and reconnect sync
- [x] 03-04-PLAN.md — Notifications + social baseline (follow/comments)

## Phase 4: Frontend Integration & Launch Polish
**Goal**: Complete frontend experiences for already-implemented backend advanced features, then refine UI/UX and launch readiness.

### Scope
- **Advanced feature frontend completion** – complete UI flows for market creation, pending-market visibility rules, trading UX, realtime state sync indicators, notification inbox/actions, and social follow/comment views
- **Error handling + UX hardening** – clear user-facing errors for backend contract failures and retries
- **Performance audits** – reduce bundle size, optimize images, memoize components
- **Accessibility** – screen‑reader support, contrast ratios, focus management
- **Localization** – support multiple languages
- **App‑store readiness** – privacy policy, store listings, screenshots
- **Beta testing** – gather user feedback, fix critical issues

### Success Criteria
- All ADV backend capabilities from Phase 03 have corresponding user-testable frontend flows
- Trade flow no longer returns JSON-shape failure in user path
- App scores >90 on Lighthouse performance
- Passes React Native accessibility audit
- Supports at least English and Spanish
- Meets Google Play/Apple App Store guidelines

### Timeline
- **Estimate**: 2‑3 weeks
- **Status**: Future

## Phase 5: Market Detail Experience Refresh
**Goal**: Refresh the market detail screen UI to a cleaner, screenshot-inspired presentation while keeping backend-driven trading options and existing behavior intact.

**Requirements:** [MD-UI-01, MD-UI-02, MD-UI-03, MD-UI-04]

### Scope
- Rework market detail visual hierarchy (header/hero/chart/metrics/activity/action areas) using current design tokens
- Keep trade actions and option labels sourced from backend market options (no static option substitution)
- Improve information density and readability for probability, metrics, and activity feed
- Preserve deterministic trade and comment flow behavior from prior phases

### Success Criteria
- Market detail layout feels modern and closer to reference style without pixel-perfect duplication
- Trade option surfaces (chips/buttons) are backend-driven and synchronized with selected option state
- Metrics and activity sections remain complete with loading/error/empty handling
- Client static checks pass (or any pre-existing unrelated issues are documented)

### Timeline
- **Estimate**: 1-2 days
- **Status**: Planned

**Plans:** 1/1 plans complete

Plans:
- [x] 05-01-PLAN.md — Redesign market detail hierarchy and backend-driven option action UX

## Notes
- Phase 1 is the immediate priority and aligns with the user’s request.
- Future phases may be reprioritized based on user feedback and business needs.
- All phases will follow GSD workflow with atomic commits and goal‑backward verification.

### Phase 6: 6

**Goal:** Fix concrete market details regressions reported by user: chart timeframe controls with websocket realtime updates, incorrect Your Position value, and inconsistent button colors. Comments persistence is deferred to DB manager.

**Requirements:** [MD-FIX-01, MD-FIX-02, MD-FIX-04, MD-FIX-05]
**Depends on:** Phase 5
**Plans:** 2 plans

Plans:
- [ ] 06-01-PLAN.md — Backend root-cause resolution for position accuracy and websocket-capable chart history contract
- [ ] 06-02-PLAN.md — Client fixes for chart timeframe buttons + websocket realtime updates, position rendering correctness, and consistent UI button tokens

### Phase 7: using the ui audit, fix the following UI to make it according to standards, do not forget to use the given UI already in the app

**Goal:** Raise audited UI quality by remediating token drift, typography inconsistency, and interaction recovery gaps on leaderboard and market detail surfaces while preserving the app's established visual language.
**Requirements**: [UI-STD-01, UI-STD-02, UI-STD-03, UI-STD-04]
**Depends on:** Phase 6
**Plans:** 1/2 plans executed

Plans:
- [x] 07-01-PLAN.md — Tokenize leaderboard colors and normalize shared typography roles
- [ ] 07-02-PLAN.md — Add retry recovery and truthful row affordance behavior with UX verification

### Phase 8: Revamp the Create market to be more user friendly and look better to the eye keepin the same theme through out the entrie app

**Goal:** Redesign the create-market experience into a guided, mobile-friendly flow with stronger visual hierarchy, clearer validation guidance, and polished submit feedback while preserving the app's established tokenized theme.
**Requirements**: [CM-UX-01, CM-UX-02, CM-UX-03, CM-UX-04]
**Depends on:** Phase 7
**Plans:** 1/2 plans executed

Plans:
- [x] 08-01-PLAN.md — Build create-market UI foundation with tokenized cards, reusable form fields, and guided category/date controls
- [ ] 08-02-PLAN.md — Polish validation, submit lifecycle feedback, and mobile usability with human UX verification checkpoint

### Phase 9: Create an admin dahsbaord for the admins to manage users, look at data, resolve user conflicts, and most importantly, manage the user created markets. Use react-bits and shadcn ui to make it simple and effective enough

**Goal:** Ship an operationally useful separate web admin dashboard with single-admin-role access control, auditable market moderation and conflict outcome tracking, then layer analytics views after operations queues are stable; also clean up mobile profile to real-data sections and wire User Created Markets behavior.
**Requirements**: [ADM-OPS-01, ADM-OPS-02, ADM-OPS-03, ADM-OPS-04, ADM-OPS-05, ADM-ANL-01, ADM-MOB-01, ADM-MOB-02]
**Depends on:** Phase 8
**Plans:** 3/3 plans complete

Plans:
- [x] 09-01-PLAN.md — Build separate admin web app foundation, baseline admin ACL, and operations queues for approvals and due-resolution work
- [x] 09-02-PLAN.md — Add conflict visibility/outcome recording workflow and complete mobile profile cleanup with User Created Markets wiring
- [x] 09-03-PLAN.md — Deliver phase wave-2 analytics views for moderation throughput, queue health, and conflict outcomes


### Phase 10: refactor and add mre settings to profile page

**Goal:** Improve profile page visual clarity so users know where to look, and add standard profile settings (Edit Profile, App Settings, Notifications, Security, Support, About).
**Requirements**: [UI-SET-01, UI-SET-02, UI-SET-03, UI-SET-04]
**Depends on:** Phase 9
**Plans:** 2/2 plans complete

Plans:
- [x] 10-05-PLAN.md — Reorganize profile layout for clarity and add settings menu with navigation
- [x] 10-06-PLAN.md — Backend edit-profile endpoint and functional settings screens (Edit Profile, App Settings, Security)

### Phase 11: change auth of admin web to be simpler

**Goal:** Replace manual token-pasting authentication with a proper email/password login flow using the same backend endpoints as the mobile app.
**Requirements**: [ADM-AUTH-01, ADM-AUTH-02, ADM-AUTH-03, ADM-AUTH-04]
**Depends on:** Phase 10
**Plans:** 1/2 plans executed

Plans:
- [ ] 11-01-PLAN.md — Build admin auth context with token persistence and HTTP client 401 recovery
- [ ] 11-02-PLAN.md — Create login form, wire auth into App.tsx, and add sidebar logout
