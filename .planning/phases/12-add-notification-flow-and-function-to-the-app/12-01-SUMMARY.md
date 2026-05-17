---
phase: 12-add-notification-flow-and-function-to-the-app
plan: 01
subsystem: api
tags: [supabase, postgres, express, websocket, notifications]
requires:
  - phase: 03-foundation
    provides: realtime event infrastructure (realtimeService.ts)
provides:
  - notifications DB table schema (DDL for Supabase)
  - notificationDbService (6 DB operations wrapping supabaseAdmin)
  - 5 REST endpoints (GET notifications, PATCH read, PATCH read-all, GET unread-count, POST admin/send)
  - market resolution → notification auto-creation hook
  - notification.new WebSocket event type
affects: [12-02, client notification UX]
tech-stack:
  added: []
  patterns:
    - Service-role Supabase queries for server-side notification CRUD
    - Non-blocking async side-effect after market resolution
    - Paginated API responses with meta wrapper
key-files:
  created:
    - server/src/services/notificationDbService.ts
  modified:
    - server/src/services/realtimeService.ts
    - server/src/controllers/notificationController.ts
    - server/src/controllers/adminMarketOpsController.ts
    - server/src/routes/notificationRoutes.ts
    - server/src/routes/adminRoutes.ts
key-decisions:
  - "Notification creation is non-blocking (async IIFE) to avoid delaying market resolution response"
  - "Using supabaseAdmin (service role) for all notification ops to bypass RLS"
  - "Admin announcements target /tabs/profile target path (profile screen)"
duration: 12min
completed: 2026-05-17
requirements-completed: [NOT-01, NOT-02, NOT-03, NOT-04, NOT-05]
---

# Phase 12 Plan 01: Backend notification infrastructure — DB table, REST API, market resolution hook, WebSocket emission

**Notifications persisted in Supabase, accessible via 5 REST endpoints, auto-created on market resolution, pushed via notification.new WebSocket event**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-17
- **Completed:** 2026-05-17
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Created `notificationDbService.ts` with all 6 DB operations (insert, paginated query, mark-read, mark-all-read, unread count, market resolution notifications)
- Added 5 REST endpoints on existing notification router + admin route for announcements
- Extended realtimeService with `notification.new` event type and emit function
- Hooked notification creation into `resolveMarket` as non-blocking async side-effect
- All existing register/trigger routes preserved

## Task Commits

Each task was committed atomically:

1. **task 1: Create notifications DB table via Supabase migration SQL and notification service module** - `5f30faa` (feat)
2. **task 2: Implement notification REST endpoints and admin notification route** - `a2b5d08` (feat)
3. **task 3: Add notification.new event type to realtimeService and hook into market resolution** - `cca60d0` (feat)

## Files Created/Modified
- `server/src/services/notificationDbService.ts` - 6 notification DB operations (insertNotifications, getNotifications, markAsRead, markAllAsRead, getUnreadCount, createMarketResolutionNotifications)
- `server/src/services/realtimeService.ts` - Added `notification.new` to RealtimeEventName, NotificationNewPayload type, emitNotificationNewEvent function
- `server/src/controllers/notificationController.ts` - Added 5 new handlers (getNotifications, markAsRead, markAllAsRead, getUnreadCount, sendAdminNotification)
- `server/src/routes/notificationRoutes.ts` - Added GET /, PATCH /read, PATCH /read-all, GET /unread-count routes
- `server/src/routes/adminRoutes.ts` - Added POST /notifications/send with requireAuth + requireAdmin
- `server/src/controllers/adminMarketOpsController.ts` - Added notification creation hook inside resolveMarket (non-blocking IIFE)

## Decisions Made
- Notification creation after market resolution is a non-blocking async side-effect — response returns immediately, notifications are created in background
- Used `supabaseAdmin` (service role key) for all notification DB operations to bypass RLS restrictions
- Admin announcements target `/tabs/profile` path (consistent with profile-related notifications)
- `sendAdminNotification` queries `users` table for broadcast to all users; accepts optional `targetUserId` for scoped delivery

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

**Manual step required:** Run the DDL SQL (included as comment at top of `notificationDbService.ts`) in Supabase SQL editor to create the `notifications` table and indexes before the endpoints will work.

```sql
CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL DEFAULT 'market',
    title text NOT NULL,
    body text NOT NULL,
    target_path text NOT NULL,
    target_signature text NOT NULL DEFAULT '',
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, is_read) WHERE is_read = false;
```

## Next Phase Readiness
- Backend notification infrastructure complete
- Client notification UX (Plan 12-02) can now consume real API data
- New endpoints ready for client integration

---
*Phase: 12-add-notification-flow-and-function-to-the-app*
*Plan: 01*
*Completed: 2026-05-17*
