-- Update owner_registrations table for standalone registration (không cần user account trước)

-- Thêm columns mới để lưu thông tin đăng ký trực tiếp
ALTER TABLE owner_registrations ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
ALTER TABLE owner_registrations ADD COLUMN IF NOT EXISTS user_password VARCHAR(255);
ALTER TABLE owner_registrations ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);
ALTER TABLE owner_registrations ADD COLUMN IF NOT EXISTS user_phone VARCHAR(20);

-- Thay đổi user_id thành nullable vì có thể chưa có user account
ALTER TABLE owner_registrations ALTER COLUMN user_id DROP NOT NULL;

-- Thêm unique constraint cho email để tránh duplicate
CREATE UNIQUE INDEX IF NOT EXISTS idx_owner_registrations_email_pending 
ON owner_registrations(user_email) 
WHERE status = 'pending';

-- Thêm column để track user account được tạo
ALTER TABLE owner_registrations ADD COLUMN IF NOT EXISTS created_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Comment để document thay đổi
COMMENT ON COLUMN owner_registrations.user_id IS 'Legacy: reference to existing user (nullable for new standalone registrations)';
COMMENT ON COLUMN owner_registrations.user_email IS 'Email for account creation when approved';
COMMENT ON COLUMN owner_registrations.user_password IS 'Hashed password for account creation when approved';
COMMENT ON COLUMN owner_registrations.user_name IS 'Full name for account creation';
COMMENT ON COLUMN owner_registrations.user_phone IS 'Phone number for account creation';
COMMENT ON COLUMN owner_registrations.created_user_id IS 'ID of user account created after approval';
