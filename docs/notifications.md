# Notification Features — Implementation Tracker

> This document tracks all planned notification features for Tesla Destination Club.
> Update the status as implementation progresses.

**Status legend:** 🔴 Not started · 🟡 In progress · 🟢 Done

---

## Infrastructure Setup

> Must be completed before any notification features work.

| # | Task | Status | Notes |
|---|------|--------|-------|
| I-1 | Enable Firebase Cloud Messaging (FCM) in Firebase project | 🔴 | Enable Cloud Messaging API, generate VAPID key pair |
| I-2 | Add `vapidKey` to Firebase client config in `src/lib/firebase/client.ts` | � | Lazy `getMessagingInstance()` with dynamic import; VAPID key from env var |
| I-3 | Create `static/firebase-messaging-sw.js` — service worker for background push | � | Handles notifications when tab is closed/backgrounded |
| I-4 | Create `src/lib/firebase/messaging.ts` — FCM token management | � | `requestPermission()`, `storeFcmToken()`, `removeFcmToken()`, `enableNotifications()`, `onForegroundMessage()`, `getNotificationStatus()` |
| I-5 | Create `src/lib/components/NotificationPermissionBanner.svelte` | � | Dismissible banner with Enable/Later buttons; tracks dismissed state in localStorage |
| I-6 | Add Firestore `users/{uid}` collection with `fcmToken` field | � | Schema designed; `storeFcmToken` function creates docs with merge; no separate migration needed |
| I-7 | Create `storeFcmToken` callable cloud function | � | Accepts `{ token }` or `{ token: null }` to store/remove |
| I-8 | Add `notificationPrefs` map to user document | 🔴 | Not yet needed — all notifications enabled by default for now |
| I-9 | Create `src/lib/components/NotificationSettings.svelte` | 🔴 | Not yet needed — depends on I-8 |
| I-10 | Create `updateNotificationPrefs` callable cloud function | 🔴 | Not yet needed — depends on I-8 |
| I-11 | Update `firestore.rules` for `users` collection | � | Added `users/{uid}` match block with auth.uid check |

---

## Tier 1 — Essential Booking Lifecycle Notifications

> Core alerts users expect from a booking app.

### N-01: Check-in Reminder

| Field | Detail |
|-------|--------|
| **Trigger** | Scheduled function — booking `startTime` is ~15 minutes away |
| **Recipient** | Booker (status = `pending`) |
| **Message** | "Your charging slot at {chargerName} starts in 15 minutes. Don't forget to check in!" |
| **Action** | Tap → opens `/chargers/{chargerId}/book` or `/bookings` |
| **Implementation** | Scheduled cloud function (`sendCheckInReminders`), runs every 5 min, collection group query on `bookings` where `status = pending` and `startTime` in 10–20 min window. Marks `checkInReminderSentAt` on booking to prevent duplicates. Cleans up invalid FCM tokens. |
| **Status** | 🟢 |

### N-02: Slot Started — Check In Now

| Field | Detail |
|-------|--------|
| **Trigger** | Scheduled function — `startTime` reached, booking still `pending` |
| **Recipient** | Booker |
| **Message** | "Your slot at {chargerName} has started! Check in now to confirm your session." |
| **Action** | Tap → opens `/chargers/{chargerId}/book` with check-in prompt |
| **Implementation** | Scheduled cloud function, finds bookings where `startTime ≤ now` and `startTime > now - 5min` and `status = pending` |
| **Status** | 🔴 |

### N-03: Check-in Successful

| Field | Detail |
|-------|--------|
| **Trigger** | `checkInBooking` cloud function succeeds |
| **Recipient** | Booker |
| **Message** | "Checked in at {chargerName}. Your session ends at {endTime}." |
| **Action** | Tap → opens `/bookings` |
| **Implementation** | Add push notification call at end of existing `checkInBooking` function |
| **Status** | 🔴 |

### N-04: Session Ending Soon

| Field | Detail |
|-------|--------|
| **Trigger** | Scheduled function — `endTime` is ~15 minutes away |
| **Recipient** | Active booker (status = `active`) |
| **Message** | "Your session at {chargerName} ends in 15 minutes. Wrap up or extend if needed." |
| **Action** | Tap → opens `/bookings` |
| **Implementation** | Scheduled cloud function (`sendSessionEndingAlerts`), runs every 5 min, queries bookings where `endTime` is 10–20 min from now and `status = active` |
| **Status** | 🔴 |

### N-05: Session Complete

| Field | Detail |
|-------|--------|
| **Trigger** | `checkOutBooking` cloud function succeeds |
| **Recipient** | Booker |
| **Message** | "Session complete at {chargerName}. Thanks for charging responsibly!" |
| **Action** | Tap → opens `/bookings` |
| **Implementation** | Add push notification call at end of existing `checkOutBooking` function |
| **Status** | 🔴 |

### N-06: Booking Cancelled

| Field | Detail |
|-------|--------|
| **Trigger** | `cancelBooking` cloud function succeeds |
| **Recipient** | Booker |
| **Message** | "Your booking at {chargerName} on {date} has been cancelled." |
| **Action** | Tap → opens `/chargers` |
| **Implementation** | Add push notification call at end of existing `cancelBooking` function |
| **Status** | 🔴 |

### N-07: No-Show Warning

| Field | Detail |
|-------|--------|
| **Trigger** | Scheduled function — booking still `pending` past `startTime + grace period` (~10 min) |
| **Recipient** | Booker |
| **Message** | "You haven't checked in at {chargerName}. Your slot may be released to the next person." |
| **Action** | Tap → opens `/bookings` |
| **Implementation** | Scheduled cloud function, finds bookings where `startTime < now - 10min` and `status = pending` |
| **Depends on** | No-show auto-release feature (planned) |
| **Status** | 🔴 |

---

## Tier 2 — Smart Context-Aware Notifications

> Proactive alerts that add real value. Some require new features (watchlist, etc.).

### N-08: Slot Freed Early

| Field | Detail |
|-------|--------|
| **Trigger** | Another user's booking cancelled or checked out early, freeing a port |
| **Recipient** | Users with pending bookings at the same charger on the same day |
| **Message** | "A port just freed up at {chargerName}! Your slot is at {time}." |
| **Action** | Tap → opens `/chargers/{chargerId}/queue` |
| **Implementation** | Firestore trigger on booking status change; query same-day pending bookings at that charger |
| **Notes** | Useful for users whose slot is later — they might want to come earlier |
| **Status** | 🔴 |

### N-09: Your Turn Approaching

| Field | Detail |
|-------|--------|
| **Trigger** | Scheduled function — user is "next up" (earliest upcoming booking at a charger) and current active session is ~15 min from ending |
| **Recipient** | Next-up booker |
| **Message** | "You're up next at {chargerName}! Current session ends in ~{X} minutes." |
| **Action** | Tap → opens `/chargers/{chargerId}/queue` |
| **Implementation** | Scheduled function: find active bookings ending soon, then find the earliest pending booking at the same charger |
| **Status** | 🔴 |

### N-10: Port Available Now

| Field | Detail |
|-------|--------|
| **Trigger** | A port becomes free at a charger the user has expressed interest in |
| **Recipient** | Users who have "watched" or recently viewed a charger |
| **Message** | "A port is available now at {chargerName}! Book it before someone else does." |
| **Action** | Tap → opens `/chargers/{chargerId}/book` |
| **Implementation** | Requires a `watchedChargers` or `recentChargers` list per user; Firestore trigger on booking changes |
| **Notes** | Needs a watchlist/bookmark feature or tracking of recently viewed chargers |
| **Status** | 🔴 |

### N-11: Early Check-in Available

| Field | Detail |
|-------|--------|
| **Trigger** | User has a pending booking AND the charger currently has a free port AND it's up to 15 min before their `startTime` |
| **Recipient** | Booker |
| **Message** | "A port is free at {chargerName} right now — you can check in early!" |
| **Action** | Tap → opens `/chargers/{chargerId}/book` with check-in enabled |
| **Implementation** | When a port frees up, check if any pending bookings at that charger are within the 15-min early check-in window |
| **Status** | 🔴 |

### N-12: Overstay Alert

| Field | Detail |
|-------|--------|
| **Trigger** | Active booking's `endTime` passed but user hasn't checked out |
| **Recipient** | Active booker (status = `active`, `endTime < now`) |
| **Message** | "Your session at {chargerName} has passed its end time. Please check out so the next person can charge." |
| **Action** | Tap → opens `/bookings` with check-out prompt |
| **Implementation** | Scheduled function: find active bookings where `endTime < now` |
| **Status** | 🔴 |

---

## Tier 3 — Community & Advanced Notifications

> Relies on unimplemented features from the roadmap. Lower priority.

### N-13: Physical Queuer Reported

| Field | Detail |
|-------|--------|
| **Trigger** | Someone reports a non-app user physically waiting at a charger |
| **Recipient** | Current active bookers at that charger |
| **Message** | "Someone is physically waiting at {chargerName}. Consider yielding your slot if you're done." |
| **Action** | Tap → opens `/chargers/{chargerId}/queue` |
| **Implementation** | Trigger on `reportPhysicalQueuer` cloud function (unimplemented) |
| **Depends on** | Physical queuer reporting feature, `yieldBooking` cloud function |
| **Status** | 🔴 |

### N-14: Slot Auto-Released (No-Show)

| Field | Detail |
|-------|--------|
| **Trigger** | No-show detected and slot auto-released to next person |
| **Recipient** | Original booker + next-up booker |
| **Messages** | To original: "Your slot at {chargerName} was released due to no-show." · To next: "A slot opened up at {chargerName} — it's your turn!" |
| **Action** | Tap → opens `/bookings` (original) or `/chargers/{chargerId}/book` (next) |
| **Implementation** | Scheduled function: auto-cancel no-show bookings, send notifications to both users |
| **Depends on** | No-show auto-release feature |
| **Status** | 🔴 |

### N-15: Queue Position Update

| Field | Detail |
|-------|--------|
| **Trigger** | Someone ahead in the queue at a charger cancelled |
| **Recipient** | Users with later bookings at that charger |
| **Message** | "Your position at {chargerName} improved — you're now #{position} in line." |
| **Action** | Tap → opens `/chargers/{chargerId}/queue` |
| **Implementation** | Firestore trigger on booking cancellation; recompute queue positions for remaining bookings |
| **Notes** | Queue "position" concept doesn't currently exist — needs definition |
| **Status** | 🔴 |

### N-16: New Charger Added

| Field | Detail |
|-------|--------|
| **Trigger** | A new charger document is created in Firestore |
| **Recipient** | All opted-in users |
| **Message** | "New charger available: {chargerName} at {address}. Book your slot!" |
| **Action** | Tap → opens `/chargers/{chargerId}/book` |
| **Implementation** | Firestore trigger on new charger document; broadcast to all users with notification prefs enabled |
| **Notes** | Requires a way to iterate over all users (bulk messaging) — consider using Firebase Topics instead |
| **Status** | 🔴 |

### N-17: Weekly Usage Summary

| Field | Detail |
|-------|--------|
| **Trigger** | Scheduled cron — Monday morning (9:00 AM local time) |
| **Recipient** | Users who had bookings in the past week |
| **Message** | "Last week: {X} sessions, {Y} hours of charging at {Z} locations." |
| **Action** | Tap → opens `/bookings` |
| **Implementation** | Scheduled function (weekly cron); aggregate user's completed bookings for the past 7 days |
| **Notes** | Nice-to-have engagement feature |
| **Status** | 🔴 |

---

## Implementation Order (Suggested)

```
Phase 0: Infrastructure (I-1 through I-11)
    ↓
Phase 1: Tier 1 immediate triggers (N-03, N-05, N-06)
    ↓  — These piggyback on existing cloud functions
Phase 2: Tier 1 scheduled triggers (N-01, N-02, N-04, N-07)
    ↓  — Requires setting up scheduled cloud functions
Phase 3: Tier 2 smart notifications (N-08, N-11, N-12)
    ↓  — Requires cross-user queries and Firestore triggers
Phase 4: Tier 2+ features (N-09, N-10)
    ↓  — Requires watchlist/bookmark feature
Phase 5: Tier 3 community features (N-13 through N-17)
    ↓  — Depends on unimplemented roadmap features
```

---

## Firebase Cloud Messaging — Technical Notes

### Frontend Token Flow
1. User grants notification permission → `Notification.requestPermission()`
2. App calls `getToken(messaging, { vapidKey })` → receives FCM registration token
3. Token sent to `storeFcmToken` cloud function → saved to `users/{uid}/fcmToken`
4. Token refreshed automatically → `onTokenRefresh` handler updates Firestore

### Backend Send Flow
```typescript
import * as admin from "firebase-admin";

await admin.messaging().send({
  token: userFcmToken,
  notification: {
    title: "Check-in Reminder",
    body: "Your slot at Pavilion Tesla Charger starts in 15 minutes.",
  },
  webpush: {
    fcmOptions: {
      link: "https://tesla-destination-club.web.app/chargers/abc123/book",
    },
  },
});
```

### Scheduled Functions Pattern
```typescript
import { onSchedule } from "firebase-functions/v2/scheduler";

export const sendCheckInReminders = onSchedule(
  { schedule: "every 5 minutes", timeZone: "Asia/Kuala_Lumpur" },
  async () => {
    // Query bookings starting in 10-20 min, status = pending
    // Send push notification to each booker
  }
);
```

### Firestore Schema Addition
```
users/{uid}
  fcmToken: string
  notificationPrefs:
    checkInReminder: boolean     // N-01
    slotStarted: boolean         // N-02
    sessionEnding: boolean       // N-04
    noShowWarning: boolean       // N-07
    slotFreed: boolean           // N-08
    overstayAlert: boolean       // N-12
    communityAlerts: boolean     // N-13
    weeklySummary: boolean       // N-17
```
