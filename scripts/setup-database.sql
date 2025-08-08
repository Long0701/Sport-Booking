-- PostgreSQL Database Setup for Sports Booking Platform

-- Create database (run this as superuser)
-- CREATE DATABASE sportbooking;
-- \c sportbooking;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'owner', 'admin')),
    avatar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courts table
CREATE TABLE IF NOT EXISTS courts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('football', 'badminton', 'tennis', 'basketball', 'volleyball', 'pickleball')),
    description TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    images TEXT[] DEFAULT '{}',
    amenities TEXT[] DEFAULT '{}',
    price_per_hour INTEGER NOT NULL,
    open_time TIME DEFAULT '06:00',
    close_time TIME DEFAULT '22:00',
    phone VARCHAR(20) NOT NULL,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for location-based queries
CREATE INDEX IF NOT EXISTS idx_courts_location ON courts USING btree (latitude, longitude);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    court_id INTEGER REFERENCES courts(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_amount INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent double booking
    UNIQUE(court_id, booking_date, start_time)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    court_id INTEGER REFERENCES courts(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- One review per booking
    UNIQUE(booking_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courts_type ON courts(type);
CREATE INDEX IF NOT EXISTS idx_courts_owner ON courts(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_court ON bookings(court_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_reviews_court ON reviews(court_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courts_updated_at BEFORE UPDATE ON courts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data

-- Insert users (password is '123456' hashed with bcrypt)
INSERT INTO users (name, email, password, phone, role) VALUES
('Nguyễn Văn A', 'user1@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', '0901234567', 'user'),
('Trần Thị B', 'user2@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', '0901234568', 'user'),
('Lê Văn C', 'owner1@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', '0901234569', 'owner'),
('Phạm Thị D', 'owner2@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', '0901234570', 'owner');

-- Insert courts
INSERT INTO courts (name, type, description, address, latitude, longitude, images, amenities, price_per_hour, open_time, close_time, phone, owner_id, rating, review_count) VALUES
('Sân bóng đá Thành Công', 'football', 'Sân bóng đá mini chất lượng cao với cỏ nhân tạo mới, hệ thống đèn chiếu sáng hiện đại.', '123 Nguyễn Văn Linh, Quận 7, TP.HCM', 10.7769, 106.7009, ARRAY['/soccer-field-main.png', '/soccer-field-side.png'], ARRAY['Wifi miễn phí', 'Chỗ đậu xe', 'Phòng thay đồ', 'Vòi sen'], 200000, '06:00', '22:00', '0901234567', 3, 4.8, 15),

('Sân cầu lông Victory', 'badminton', 'Sân cầu lông trong nhà với sàn gỗ chuyên nghiệp, điều hòa mát mẻ.', '456 Lê Văn Việt, Quận 9, TP.HCM', 10.8231, 106.7560, ARRAY['/badminton-court.png'], ARRAY['Điều hòa', 'Wifi miễn phí', 'Chỗ đậu xe', 'Căng tin'], 80000, '06:00', '23:00', '0901234568', 3, 4.6, 12),

('Sân tennis Sunrise', 'tennis', 'Sân tennis ngoài trời với mặt sân chuẩn quốc tế, view đẹp.', '789 Võ Văn Tần, Quận 3, TP.HCM', 10.7829, 106.6934, ARRAY['/outdoor-tennis-court.png'], ARRAY['Chỗ đậu xe', 'Phòng thay đồ', 'Vòi sen', 'Căng tin'], 150000, '05:30', '22:30', '0901234569', 4, 4.9, 8),

('Sân bóng rổ Champions', 'basketball', 'Sân bóng rổ ngoài trời với rổ chuẩn NBA, mặt sân cao su chống trượt.', '321 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM', 10.8015, 106.7108, ARRAY['/outdoor-basketball-court.png'], ARRAY['Chỗ đậu xe', 'Nước uống', 'Ghế ngồi'], 120000, '06:00', '21:00', '0901234570', 4, 4.5, 6);

-- Insert bookings
INSERT INTO bookings (user_id, court_id, booking_date, start_time, end_time, total_amount, status, payment_status) VALUES
(1, 1, CURRENT_DATE, '18:00', '19:00', 200000, 'confirmed', 'paid'),
(2, 2, CURRENT_DATE, '19:00', '20:00', 80000, 'pending', 'pending'),
(1, 3, CURRENT_DATE + INTERVAL '1 day', '16:00', '17:00', 150000, 'confirmed', 'paid');

-- Insert reviews
INSERT INTO reviews (user_id, court_id, booking_id, rating, comment) VALUES
(1, 1, 1, 5, 'Sân đẹp, cỏ tốt, đèn sáng. Sẽ quay lại!'),
(2, 2, 2, 4, 'Sân ok, giá hợp lý. Chỗ đậu xe hơi ít.');
