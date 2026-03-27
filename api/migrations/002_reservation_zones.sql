-- Extend reservations table with phone number and seating zone
ALTER TABLE reservations
  ADD COLUMN phone VARCHAR(50) DEFAULT NULL AFTER email,
  ADD COLUMN seating_zone VARCHAR(30) DEFAULT NULL AFTER phone;
