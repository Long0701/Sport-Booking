-- Migration to add guest booking support
-- This allows guests to book courts without creating user accounts

-- Add guest information fields to bookings table
ALTER TABLE bookings 
ADD COLUMN guest_name VARCHAR(255),
ADD COLUMN guest_phone VARCHAR(20);

-- Make user_id nullable for guest bookings
ALTER TABLE bookings 
ALTER COLUMN user_id DROP NOT NULL;

-- Add constraint to ensure either user_id OR (guest_name AND guest_phone) is provided
ALTER TABLE bookings 
ADD CONSTRAINT bookings_user_or_guest_check 
CHECK (
  (user_id IS NOT NULL) OR 
  (guest_name IS NOT NULL AND guest_phone IS NOT NULL)
);

-- Add index for guest bookings queries
CREATE INDEX IF NOT EXISTS idx_bookings_guest ON bookings(guest_name, guest_phone) WHERE user_id IS NULL;

-- Add comment to document the change
COMMENT ON COLUMN bookings.guest_name IS 'Name of guest user for bookings without account';
COMMENT ON COLUMN bookings.guest_phone IS 'Phone of guest user for bookings without account';
COMMENT ON CONSTRAINT bookings_user_or_guest_check ON bookings IS 'Ensure either registered user or guest info is provided';
