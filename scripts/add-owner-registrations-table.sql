-- Add owner registrations table for admin approval process

CREATE TABLE IF NOT EXISTS owner_registrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_address TEXT NOT NULL,
    business_phone VARCHAR(20) NOT NULL,
    business_email VARCHAR(255),
    description TEXT,
    experience TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_owner_registrations_user ON owner_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_owner_registrations_status ON owner_registrations(status);
CREATE INDEX IF NOT EXISTS idx_owner_registrations_reviewed_by ON owner_registrations(reviewed_by);

-- Create trigger for updated_at
CREATE TRIGGER update_owner_registrations_updated_at 
    BEFORE UPDATE ON owner_registrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add approval status tracking to users table 
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'none' CHECK (approval_status IN ('none', 'pending', 'approved', 'rejected'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Create index for approval status
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);
