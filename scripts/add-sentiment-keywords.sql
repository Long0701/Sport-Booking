-- Create sentiment keywords management table
-- This allows admin to dynamically manage positive/negative keywords for sentiment analysis

-- Create sentiment_keywords table
CREATE TABLE IF NOT EXISTS sentiment_keywords (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('positive', 'negative', 'strong_negative')),
    weight DECIMAL(3,2) DEFAULT 1.0, -- Weight multiplier for this keyword (0.1 to 2.0)
    language VARCHAR(10) DEFAULT 'vi', -- Language code (vi, en, etc)
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate keywords for same type and language
    UNIQUE(keyword, type, language)
);

-- Create categories table for better organization
CREATE TABLE IF NOT EXISTS sentiment_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#gray',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add category relationship to keywords
ALTER TABLE sentiment_keywords 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES sentiment_categories(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sentiment_keywords_type ON sentiment_keywords(type);
CREATE INDEX IF NOT EXISTS idx_sentiment_keywords_active ON sentiment_keywords(is_active);
CREATE INDEX IF NOT EXISTS idx_sentiment_keywords_language ON sentiment_keywords(language);
CREATE INDEX IF NOT EXISTS idx_sentiment_keywords_category ON sentiment_keywords(category_id);

-- Insert default categories
INSERT INTO sentiment_categories (name, description, color) VALUES
    ('Chất lượng', 'Từ ngữ về chất lượng sản phẩm/dịch vụ', '#blue'),
    ('Thái độ phục vụ', 'Từ ngữ về thái độ nhân viên', '#green'),
    ('Cơ sở vật chất', 'Từ ngữ về trang thiết bị, cơ sở', '#purple'),
    ('Giá cả', 'Từ ngữ về giá cả, chi phí', '#orange'),
    ('Vệ sinh', 'Từ ngữ về độ sạch sẽ, vệ sinh', '#cyan'),
    ('An toàn', 'Từ ngữ về tính an toàn', '#red'),
    ('Khác', 'Các từ ngữ khác', '#gray')
ON CONFLICT DO NOTHING;

-- Insert default Vietnamese sentiment keywords
INSERT INTO sentiment_keywords (keyword, type, weight, language, category_id) VALUES
    -- Strong negative keywords (weight 2.0)
    ('rất tệ', 'strong_negative', 2.0, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('quá tệ', 'strong_negative', 2.0, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('kinh khủng', 'strong_negative', 2.0, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('thảm họa', 'strong_negative', 2.0, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('lừa đảo', 'strong_negative', 2.0, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Khác')),
    ('không bao giờ quay lại', 'strong_negative', 1.8, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Khác')),
    ('báo cảnh sát', 'strong_negative', 2.0, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Khác')),
    ('tố cáo', 'strong_negative', 1.8, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Khác')),
    ('mất tiền', 'strong_negative', 1.5, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Giá cả')),
    ('cướp', 'strong_negative', 2.0, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Khác')),
    ('tệ nhất', 'strong_negative', 1.8, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    
    -- Regular negative keywords (weight 1.0-1.5)
    ('tệ', 'negative', 1.0, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('dở', 'negative', 1.0, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('kém', 'negative', 1.0, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('xấu', 'negative', 1.0, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('tồi', 'negative', 1.0, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('ghê', 'negative', 1.2, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('thất vọng', 'negative', 1.3, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Khác')),
    ('không hài lòng', 'negative', 1.2, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Khác')),
    ('rác', 'negative', 1.4, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('bẩn', 'negative', 1.2, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Vệ sinh')),
    ('hỏng', 'negative', 1.1, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Cơ sở vật chất')),
    ('chán', 'negative', 0.8, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Khác')),
    ('tệ hại', 'negative', 1.3, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('không nên', 'negative', 1.0, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Khác')),
    ('tránh xa', 'negative', 1.4, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Khác')),
    ('không đáng', 'negative', 1.1, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Giá cả')),
    ('thô lỗ', 'negative', 1.3, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Thái độ phục vụ')),
    ('không chuyên nghiệp', 'negative', 1.2, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Thái độ phục vụ')),
    ('lận lưng', 'negative', 1.5, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Khác')),
    ('bẩn thỉu', 'negative', 1.4, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Vệ sinh')),
    ('tiền mất tật mang', 'negative', 1.5, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Giá cả')),
    ('lãng phí', 'negative', 1.1, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Giá cả')),
    
    -- Positive keywords (weight 1.0-1.5)
    ('tốt', 'positive', 1.0, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('hay', 'positive', 1.0, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('đẹp', 'positive', 1.1, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Cơ sở vật chất')),
    ('tuyệt', 'positive', 1.4, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('xuất sắc', 'positive', 1.5, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('hoàn hảo', 'positive', 1.5, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('hài lòng', 'positive', 1.3, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Khác')),
    ('tuyệt vời', 'positive', 1.4, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('chất lượng', 'positive', 1.2, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng')),
    ('sạch sẽ', 'positive', 1.2, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Vệ sinh')),
    ('chuyên nghiệp', 'positive', 1.3, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Thái độ phục vụ')),
    ('thân thiện', 'positive', 1.2, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Thái độ phục vụ')),
    ('nhanh chóng', 'positive', 1.1, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Thái độ phục vụ')),
    ('tiện lợi', 'positive', 1.1, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Khác')),
    ('đáng tiền', 'positive', 1.2, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Giá cả')),
    ('rộng rãi', 'positive', 1.1, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Cơ sở vật chất')),
    ('thoáng mát', 'positive', 1.1, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Cơ sở vật chất')),
    ('an toàn', 'positive', 1.2, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'An toàn')),
    ('gần gũi', 'positive', 1.0, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Thái độ phục vụ')),
    ('ổn định', 'positive', 1.1, 'vi', (SELECT id FROM sentiment_categories WHERE name = 'Chất lượng'))
ON CONFLICT (keyword, type, language) DO NOTHING;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_sentiment_keywords_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_sentiment_keywords_updated_at ON sentiment_keywords;
CREATE TRIGGER trigger_sentiment_keywords_updated_at
    BEFORE UPDATE ON sentiment_keywords
    FOR EACH ROW
    EXECUTE FUNCTION update_sentiment_keywords_updated_at();

-- Add comments
COMMENT ON TABLE sentiment_keywords IS 'Dynamic sentiment analysis keywords management';
COMMENT ON COLUMN sentiment_keywords.keyword IS 'The keyword phrase for sentiment analysis';
COMMENT ON COLUMN sentiment_keywords.type IS 'positive, negative, or strong_negative';
COMMENT ON COLUMN sentiment_keywords.weight IS 'Multiplier for sentiment impact (0.1 to 2.0)';
COMMENT ON COLUMN sentiment_keywords.language IS 'Language code for multi-language support';
COMMENT ON COLUMN sentiment_keywords.is_active IS 'Whether this keyword is currently active';

COMMENT ON TABLE sentiment_categories IS 'Categories for organizing sentiment keywords';
COMMENT ON COLUMN sentiment_categories.name IS 'Category display name';
COMMENT ON COLUMN sentiment_categories.color IS 'UI color for this category';
