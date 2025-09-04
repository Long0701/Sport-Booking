-- Seed data for sports booking platform

-- Insert users
INSERT INTO users (name, email, password, phone, role) VALUES
('Nguyễn Văn A', 'user1@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', '0901234567', 'user'),
('Trần Thị B', 'user2@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', '0901234568', 'user'),
('Lê Văn C', 'owner1@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', '0901234569', 'owner'),
('Phạm Thị D', 'owner2@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', '0901234570', 'owner');

-- Insert courts
INSERT INTO courts (name, type, description, address, latitude, longitude, images, amenities, price_per_hour, open_time, close_time, phone, owner_id, rating, review_count) VALUES
('Sân bóng đá Thành Công', 'football', 'Sân bóng đá mini chất lượng cao với cỏ nhân tạo mới, hệ thống đèn chiếu sáng hiện đại.', '123 Nguyễn Văn Linh, Quận 7, TP.HCM', 10.7769, 106.7009, ARRAY['/soccer-field-main.png', '/soccer-field-side.png'], ARRAY['Wifi miễn phí', 'Chỗ đậu xe', 'Phòng thay đồ', 'Vòi sen'], 200000, '06:00', '22:00', '0901234567', 3, 4.8, 15),

('Sân bóng đá Victory Park', 'football', 'Sân bóng đá mini trong công viên với cỏ tự nhiên, không gian thoáng mát, phù hợp cho gia đình và nhóm bạn.', '456 Lê Văn Việt, Quận 9, TP.HCM', 10.8231, 106.7560, ARRAY['/soccer-field.png', '/soccer-field-night.png'], ARRAY['Chỗ đậu xe', 'Ghế ngồi', 'Căng tin', 'Nhà vệ sinh'], 180000, '06:00', '21:00', '0901234568', 3, 4.5, 8),

('Sân bóng đá Champions League', 'football', 'Sân bóng đá mini chuyên nghiệp với cỏ nhân tạo cao cấp, hệ thống đèn LED tiết kiệm năng lượng.', '789 Võ Văn Tần, Quận 3, TP.HCM', 10.7829, 106.6934, ARRAY['/soccer-field-main.png'], ARRAY['Wifi miễn phí', 'Chỗ đậu xe', 'Phòng thay đồ', 'Vòi sen', 'Phòng tập gym'], 220000, '05:30', '23:00', '0901234569', 4, 4.7, 12),

('Sân cầu lông Victory', 'badminton', 'Sân cầu lông trong nhà với sàn gỗ chuyên nghiệp, điều hòa mát mẻ.', '321 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM', 10.8015, 106.7108, ARRAY['/badminton-court.png'], ARRAY['Điều hòa', 'Wifi miễn phí', 'Chỗ đậu xe', 'Căng tin'], 80000, '06:00', '23:00', '0901234570', 4, 4.6, 12),

('Sân tennis Sunrise', 'tennis', 'Sân tennis ngoài trời với mặt sân chuẩn quốc tế, view đẹp.', '654 Lý Thường Kiệt, Quận 10, TP.HCM', 10.7629, 106.6734, ARRAY['/outdoor-tennis-court.png'], ARRAY['Chỗ đậu xe', 'Phòng thay đồ', 'Vòi sen', 'Căng tin'], 150000, '05:30', '22:30', '0901234571', 3, 4.9, 8),

('Sân bóng rổ Champions', 'basketball', 'Sân bóng rổ ngoài trời với rổ chuẩn NBA, mặt sân cao su chống trượt.', '987 Cách Mạng Tháng 8, Quận 1, TP.HCM', 10.7715, 106.6908, ARRAY['/outdoor-basketball-court.png'], ARRAY['Chỗ đậu xe', 'Nước uống', 'Ghế ngồi'], 120000, '06:00', '21:00', '0901234572', 4, 4.5, 6);

-- Insert bookings
INSERT INTO bookings (user_id, court_id, booking_date, start_time, end_time, total_amount, status, payment_status) VALUES
(1, 1, CURRENT_DATE, '18:00', '19:00', 200000, 'confirmed', 'paid'),
(2, 2, CURRENT_DATE, '19:00', '20:00', 80000, 'pending', 'pending'),
(1, 3, CURRENT_DATE + INTERVAL '1 day', '16:00', '17:00', 150000, 'confirmed', 'paid');

-- Insert reviews
INSERT INTO reviews (user_id, court_id, booking_id, rating, comment) VALUES
(1, 1, 1, 5, 'Sân đẹp, cỏ tốt, đèn sáng. Sẽ quay lại!'),
(2, 2, 2, 4, 'Sân ok, giá hợp lý. Chỗ đậu xe hơi ít.');
