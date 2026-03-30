-- Add reservation_date to reservations for multi-day event support
ALTER TABLE reservations
  ADD COLUMN reservation_date DATE DEFAULT NULL AFTER seating_zone;
