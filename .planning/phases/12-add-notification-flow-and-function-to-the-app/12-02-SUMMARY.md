---
phase: 12-add-notification-flow-and-function-to-the-app
plan: 02
subsystem: ui
tags: [react-native, websocket, context, expo, notifications]
requires:
  - phase: 04-notification-flow
    provides: realtimeClient subscription pattern
  - phase: 12-01
    provides: backend notification REST endpoints and notification.new WebSocket event
provides:
  - NotificationBadgeContext (shared unread count across screens)
  - notification.new WebSocket handler in realtimeClient
  - Numeric unread badge in home-header and search-header
  - Notification screen wired to real backend data
  - Mark-all-read with optimistic UI
affects: []
tech-stack:
  added: []
  patterns:
    - React context for cross-screen unread badge state
    - Optimistic UI for mark-all-read with revert on failure
    - WebSocket-driven badge increment for real-time UX
key-files:
  created:
    - client/context/NotificationBadgeContext.tsx
  modified:
    - client/context/realtimeClient.ts
    - client/app/notifications.tsx
    - client/utils/api.ts
    - client/components/home/home-header.tsx
    - client/components/explore/search-header.tsx
    - client/app/_layout.tsx
    - client/app/tabs/home.tsx
    - client/app/tabs/explore.tsx
key-decisions:
  - "Badge resets when notification screen opens with real backend data, not on mount"
  - "Mark-all-read uses optimistic UI: clear items first, revert on failure by reloading"
  - "NotificationBadgeContext wraps the Stack only (inside ThemeProvider/AuthProvider)"
  - "userId matching for notification.new is done client-side since room is broadcast"
duration: 10min
completed: 2026-05-17
requirements-completed: [NOT-05, NOT-06, NOT-07, NOT-08]
---

# Phase 12 Plan 02: Client notification UX — real-time subscription, unread badge, notification screen with real data

**Numeric unread badge on bell icon in both headers, real-time WebSocket-driven badge increments, notification inbox with real backend data and optimistic mark-all-read**

## Performance

- **Duration:** 10 min
- **Started:** 2026-05-17
- **Completed:** 2026-05-17
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Added `notification.new` event support to realtimeClient (type, payload map, socket listener)
- Created `NotificationBadgeContext` with shared unread count, WebSocket subscription, and API-backed initial fetch
- Wired notification screen to real backend data with badge reset on open
- Added "Mark all as read" button with optimistic UI (clear items, revert on failure)
- Converted header badges from boolean dot to numeric count with 99+ overflow
- Wrapped app with NotificationBadgeProvider in _layout.tsx
- Connected home.tsx and explore.tsx to pass unreadCount from context to headers

## Task Commits

Each task was committed atomically:

1. **task 1: Add notification.new event to realtimeClient and create NotificationBadgeContext** - `994672b` (feat)
2. **task 2: Wire notification screen to real backend data with mark-all-read** - `e3b1422` (feat)
3. **task 3: Convert header badge from boolean dot to numeric count and wrap app with NotificationBadgeProvider** - `0ad1651` (feat)

## Files Created/Modified
- `client/context/realtimeClient.ts` - Added notification.new to RealtimeEventName, NotificationNewPayload type, socket listener
- `client/context/NotificationBadgeContext.tsx` - NEW: React context with unreadCount, refreshUnreadCount, resetUnreadCount; WebSocket subscription for live increments
- `client/app/notifications.tsx` - Added useNotificationBadge, badge reset on backend data load, "Mark all as read" button with optimistic UI
- `client/utils/api.ts` - Added markNotificationAsRead and markAllNotificationsAsRead helpers
- `client/components/home/home-header.tsx` - Changed hasNotification boolean to unreadCount numeric with styled badge (single/multi-digit, 99+)
- `client/components/explore/search-header.tsx` - Same badge conversion as home-header
- `client/app/_layout.tsx` - Wrapped Stack with NotificationBadgeProvider
- `client/app/tabs/home.tsx` - Added useNotificationBadge, passes unreadCount to HomeHeader
- `client/app/tabs/explore.tsx` - Added useNotificationBadge, passes unreadCount to SearchHeader

## Decisions Made
- Badge resets to 0 only when notification screen successfully loads backend data (not on mount or navigation)
- Mark-all-read uses optimistic UI: items visually cleared immediately, reloaded from server if the API call fails
- NotificationBadgeProvider wraps just the Stack navigator (inside ThemeProvider/AuthProvider) to avoid unnecessary re-renders in outer providers
- userId matching for notification.new WebSocket events is done client-side since the room is broadcast to all connected clients

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in `client/constants/ui-tokens.ts:170` (useEffect cleanup returns boolean) — logged to `deferred-items.md`. Not caused by this plan's changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full notification pipeline complete: market resolution → DB storage → WebSocket push → badge increment → notification inbox with mark-all-read
- Ready for future enhancements: push notifications (Expo Push API), follow/comment triggers, tab bar badges

---
*Phase: 12-add-notification-flow-and-function-to-the-app*
*Plan: 02*
*Completed: 2026-05-17*
