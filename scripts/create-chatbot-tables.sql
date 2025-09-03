-- Create chatbot tables for sports booking platform

-- Chat conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FAQ knowledge base table
CREATE TABLE IF NOT EXISTS faq_knowledge (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint after both tables exist
ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_messages_conversation 
FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_session ON chat_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_faq_knowledge_category ON faq_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_faq_knowledge_keywords ON faq_knowledge USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_faq_knowledge_active ON faq_knowledge(is_active);

-- Insert some initial FAQ data
INSERT INTO faq_knowledge (category, question, answer, keywords, priority) VALUES
('Đặt sân', 'Làm thế nào để đặt sân thể thao?', 'Bạn có thể đặt sân bằng cách: 1) Chọn loại sân muốn chơi, 2) Chọn ngày và giờ, 3) Xác nhận thông tin và thanh toán. Hệ thống sẽ gửi xác nhận qua email.', ARRAY['đặt sân', 'booking', 'reservation', 'thuê sân'], 1),
('Đặt sân', 'Tôi có thể hủy đặt sân không?', 'Có, bạn có thể hủy đặt sân trước 24 giờ so với giờ bắt đầu. Sau thời gian này, phí hủy sẽ được tính theo quy định của từng sân.', ARRAY['hủy đặt sân', 'cancel', 'refund', 'hoàn tiền'], 1),
('Thanh toán', 'Các phương thức thanh toán nào được chấp nhận?', 'Chúng tôi chấp nhận: tiền mặt, chuyển khoản ngân hàng, ví điện tử (MoMo, ZaloPay), và thẻ tín dụng/ghi nợ.', ARRAY['thanh toán', 'payment', 'tiền mặt', 'chuyển khoản', 'ví điện tử'], 1),
('Sân thể thao', 'Các loại sân nào có sẵn?', 'Chúng tôi có: sân bóng đá mini, cầu lông, tennis, bóng rổ, bóng chuyền và pickleball. Mỗi loại sân có nhiều lựa chọn về địa điểm và giá cả.', ARRAY['loại sân', 'sport types', 'bóng đá', 'cầu lông', 'tennis'], 1),
('Sân thể thao', 'Giá thuê sân như thế nào?', 'Giá thuê sân phụ thuộc vào loại sân, địa điểm và thời gian. Thường từ 100,000đ - 500,000đ/giờ. Bạn có thể xem giá cụ thể khi chọn sân.', ARRAY['giá thuê', 'price', 'cost', 'phí sân'], 1),
('Thời gian', 'Sân mở cửa từ mấy giờ?', 'Hầu hết các sân mở cửa từ 6:00 sáng đến 22:00 tối. Một số sân có thể có giờ mở cửa khác nhau, bạn có thể kiểm tra thông tin cụ thể của từng sân.', ARRAY['giờ mở cửa', 'opening hours', 'thời gian hoạt động', 'business hours'], 1),
('Đánh giá', 'Tôi có thể đánh giá sân sau khi chơi không?', 'Có, sau khi hoàn thành buổi chơi, bạn sẽ nhận được email yêu cầu đánh giá. Đánh giá của bạn giúp người khác chọn sân tốt hơn.', ARRAY['đánh giá', 'review', 'rating', 'feedback', 'nhận xét'], 1),
('Hỗ trợ', 'Làm thế nào để liên hệ hỗ trợ?', 'Bạn có thể liên hệ chúng tôi qua: email support@sportbooking.com, hotline 1900-xxxx, hoặc chat trực tiếp với trợ lý AI này.', ARRAY['hỗ trợ', 'support', 'liên hệ', 'contact', 'help'], 1);
