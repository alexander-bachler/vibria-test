-- Add reservation_date to track which day of a multi-day event was booked
ALTER TABLE reservations
  ADD COLUMN reservation_date DATE NOT NULL AFTER event_id;

-- Backfill existing reservations with their event's start date
UPDATE reservations r
  JOIN events e ON r.event_id = e.id
  SET r.reservation_date = e.date;
