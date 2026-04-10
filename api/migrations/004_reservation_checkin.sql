-- Add check-in timestamp to track guest arrival at the venue
ALTER TABLE reservations
  ADD COLUMN checked_in_at TIMESTAMP NULL DEFAULT NULL AFTER status;
