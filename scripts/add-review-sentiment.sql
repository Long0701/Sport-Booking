-- Add sentiment analysis and admin management fields to reviews table
-- Run this migration to add new fields for AI sentiment analysis and admin control

-- Add new columns to reviews table
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sentiment_label VARCHAR(20) DEFAULT 'neutral' CHECK (sentiment_label IN ('positive', 'negative', 'neutral')),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'pending_review')),
ADD COLUMN IF NOT EXISTS ai_flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_reviewed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hidden_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP DEFAULT NULL;

-- Create index for better performance on filtering
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_sentiment ON reviews(sentiment_label);
CREATE INDEX IF NOT EXISTS idx_reviews_ai_flagged ON reviews(ai_flagged);

-- Update existing reviews to have default values
UPDATE reviews 
SET sentiment_label = 'neutral', 
    status = 'visible', 
    ai_flagged = FALSE, 
    admin_reviewed = FALSE
WHERE sentiment_label IS NULL 
   OR status IS NULL 
   OR ai_flagged IS NULL 
   OR admin_reviewed IS NULL;

-- Add comment to table
COMMENT ON COLUMN reviews.sentiment_score IS 'AI sentiment score from -1.0 (negative) to 1.0 (positive)';
COMMENT ON COLUMN reviews.sentiment_label IS 'AI-determined sentiment category';
COMMENT ON COLUMN reviews.status IS 'Review visibility status (visible, hidden, pending_review)';
COMMENT ON COLUMN reviews.ai_flagged IS 'Whether AI flagged this review as potentially negative';
COMMENT ON COLUMN reviews.admin_reviewed IS 'Whether admin has manually reviewed this review';
COMMENT ON COLUMN reviews.admin_notes IS 'Admin notes about this review';
COMMENT ON COLUMN reviews.hidden_by IS 'User ID of admin who hid this review';
COMMENT ON COLUMN reviews.hidden_at IS 'Timestamp when review was hidden';
