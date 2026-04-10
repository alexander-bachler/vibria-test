-- Add unique check-in token to each reservation for QR-code based check-in
ALTER TABLE reservations
  ADD COLUMN checkin_token VARCHAR(64) NULL DEFAULT NULL AFTER checked_in_at,
  ADD UNIQUE INDEX idx_checkin_token (checkin_token);

-- Backfill existing reservations with random tokens
UPDATE reservations
SET checkin_token = LOWER(CONCAT(
  HEX(RANDOM_BYTES(16)),
  HEX(RANDOM_BYTES(16))
))
WHERE checkin_token IS NULL;

-- Now make column NOT NULL
ALTER TABLE reservations
  MODIFY COLUMN checkin_token VARCHAR(64) NOT NULL;
