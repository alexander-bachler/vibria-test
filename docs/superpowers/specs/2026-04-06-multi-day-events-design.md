# Multi-Day Events with Per-Day Seat Booking

## Problem

Currently, multi-day events require creating separate event entries for each day. This is cumbersome for admins and confusing for visitors. The goal is to allow a single event spanning multiple days, with seat reservations tracked independently per day.

## Approach

Add a `reservation_date` column to the `reservations` table. The existing `date` / `end_date` fields on `events` already define the range. When `end_date` is set and differs from `date`, the booking flow shows a date picker before zone selection. Each day has the same capacity (`total_seats`) and independent zone availability.

## Constraints & Decisions

- **Capacity per day**: always `total_seats` — no per-day overrides.
- **Zones per day**: tracked independently — booking "Vorne Links" on Monday doesn't affect Tuesday.
- **One date per reservation**: visitors who want multiple days make separate bookings.
- **Single-day events**: unchanged UX — no date picker shown, `reservation_date` auto-set to `event.date`.

## Database

### Migration: `003_reservation_date.sql`

```sql
ALTER TABLE reservations
  ADD COLUMN reservation_date DATE NOT NULL AFTER event_id;

-- Backfill existing reservations with their event's start date
UPDATE reservations r
  JOIN events e ON r.event_id = e.id
  SET r.reservation_date = e.date;
```

No new tables. No changes to the `events` table.

## Backend (PHP)

### `Reservation` model changes

| Method | Change |
|--------|--------|
| `countByEvent($eventId)` | Rename to `countByEventAndDate($eventId, $date)` — add `AND reservation_date = ?` to WHERE clause |
| `countByZone($eventId)` | Add `$date` parameter — add `AND reservation_date = ?` to WHERE clause |
| `create($data)` | Include `reservation_date` in INSERT |
| `findAll()` | Add `r.reservation_date` to SELECT |
| `findByEvent($eventId)` | Add `r.reservation_date` to SELECT |

### Route changes

**`POST /api/reservations`**:
- New required field: `reservation_date`
- Validate that `reservation_date` falls within `[event.date, event.end_date]` (or equals `event.date` for single-day events)
- Pass `reservation_date` to `countByEventAndDate()` for availability check
- Confirmation email uses `reservation_date` instead of `event.date`

**`GET /api/events/{id}/zones`**:
- New required query parameter: `?date=YYYY-MM-DD`
- Pass date to `countByZone()` to return per-day zone availability
- If `date` param missing, fall back to `event.date` (backward compat)

### Admin routes

No changes needed — `findAll()` and `findByEvent()` already return all fields; the added `reservation_date` column flows through automatically.

## Frontend

### TypeScript types (`src/lib/api.ts`)

Add to `Reservation` interface:
```typescript
reservation_date: string;
```

### `ReservationModal.tsx`

**Multi-day detection**: `event.end_date && event.end_date > event.date`

**New state**: `selectedDate: string | null`

**Flow for multi-day events**:
1. Show date chips (horizontal row of buttons) — one per day from `event.date` to `event.end_date`
2. Each chip shows formatted date (e.g. "Fr 10.04.")
3. On chip selection → set `selectedDate`, fetch zones with `?date=` param
4. SeatZoneMap appears after date is selected

**Flow for single-day events**:
1. `selectedDate` auto-set to `event.date` on mount
2. No date picker visible — identical to current behavior

**Zones query key** changes from `["event-zones", event.id]` to `["event-zones", event.id, selectedDate]`.

**Submit** sends `reservation_date: selectedDate` in POST body.

**Success state** shows the reservation date in the summary.

### `Veranstaltungen.tsx` (EventCard)

For multi-day events, the date overlay changes from `10.04.2026` to `10.04. – 12.04.2026`.

### `admin/Reservations.tsx`

Add "Datum" column showing `reservation_date` formatted as `dd.mm.yyyy`.

### `admin/Events.tsx`

- In the events table, show date range for multi-day events (e.g. "10.04. – 12.04.2026").
- The `reserved_seats/total_seats` column: for multi-day events `reserved_seats` is the sum across all days, which can exceed `total_seats` (a per-day value). Change the display to show total reservations without the ratio for multi-day events, or leave the ratio but note it's across all days. Simplest: keep `reserved_seats` as-is (total across all days) and just display "X gesamt" for multi-day events instead of "X/Y".

## Files Changed

| File | Type of change |
|------|---------------|
| `api/migrations/003_reservation_date.sql` | New migration |
| `api/src/Models/Reservation.php` | Update queries |
| `api/src/Routes/ReservationRoutes.php` | Add date param/validation |
| `src/lib/api.ts` | Update `Reservation` type |
| `src/components/ReservationModal.tsx` | Add date picker step |
| `src/components/SeatZoneMap.tsx` | No changes needed |
| `src/pages/Veranstaltungen.tsx` | Date range display |
| `src/pages/admin/Events.tsx` | Date range in table |
| `src/pages/admin/Reservations.tsx` | Show reservation_date |
