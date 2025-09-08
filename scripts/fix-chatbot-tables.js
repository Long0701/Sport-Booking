#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function fixChatbotTables() {
  console.log('🔧 Fixing Chatbot Database Tables...');
  console.log('===================================');
  
  try {
    // Create missing FAQ knowledge table
    console.log('📋 Creating faq_knowledge table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS faq_knowledge (
        id SERIAL PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        keywords TEXT[] DEFAULT '{}',
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add index for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_faq_knowledge_category ON faq_knowledge(category);
      CREATE INDEX IF NOT EXISTS idx_faq_knowledge_active ON faq_knowledge(is_active);
      CREATE INDEX IF NOT EXISTS idx_faq_knowledge_priority ON faq_knowledge(priority);
    `);
    
    // Create trigger for updated_at (drop first if exists)
    try {
      await pool.query(`DROP TRIGGER IF EXISTS update_faq_knowledge_updated_at ON faq_knowledge`);
      await pool.query(`
        CREATE TRIGGER update_faq_knowledge_updated_at 
        BEFORE UPDATE ON faq_knowledge 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `);
    } catch (error) {
      console.log('   ⚠️  Trigger creation warning:', error.message);
    }
    
    console.log('   ✅ faq_knowledge table created');
    
    // Seed FAQ data
    console.log('🌱 Seeding FAQ knowledge...');
    await pool.query(`
      INSERT INTO faq_knowledge (category, question, answer, keywords, priority) VALUES
      
      ('Đặt sân', 'Làm thế nào để đặt sân?', 
       'Để đặt sân, bạn có thể: 1) Tìm kiếm sân phù hợp, 2) Chọn ngày giờ muốn đặt, 3) Điền thông tin và thanh toán, 4) Nhận xác nhận qua email/SMS.', 
       ARRAY['đặt sân', 'booking', 'how to book'], 5),
       
      ('Thanh toán', 'Có những phương thức thanh toán nào?', 
       'Chúng tôi chấp nhận thanh toán qua: Thẻ tín dụng/ghi nợ, Ví điện tử (Momo, ZaloPay), Chuyển khoản ngân hàng, Thanh toán tại chỗ.', 
       ARRAY['thanh toán', 'payment', 'tiền'], 4),
       
      ('Hủy đặt', 'Có thể hủy đặt sân không?', 
       'Có, bạn có thể hủy đặt sân trước 24 giờ để được hoàn tiền 100%. Hủy trong vòng 24 giờ sẽ bị phí 20% giá trị booking.', 
       ARRAY['hủy', 'cancel', 'refund', 'hoàn tiền'], 4),
       
      ('Loại sân', 'Có những loại sân thể thao nào?', 
       'Website có các loại sân: Bóng đá mini, Cầu lông, Tennis, Bóng rổ, Bóng chuyền, Pickleball. Mỗi loại đều có nhiều địa điểm khác nhau.', 
       ARRAY['loại sân', 'sports types', 'football', 'badminton', 'tennis'], 5),
       
      ('Giá cả', 'Giá thuê sân bao nhiêu?', 
       'Giá sân dao động từ 80,000đ - 200,000đ/giờ tùy theo loại sân và địa điểm. Sân bóng đá thường đắt nhất, cầu lông rẻ nhất. Có giảm giá vào giờ thấp điểm.', 
       ARRAY['giá', 'price', 'cost', 'tiền'], 4),
       
      ('Thời gian', 'Sân mở cửa thời gian nào?', 
       'Hầu hết các sân mở cửa từ 6h sáng đến 22h tối. Một số sân có thể mở cửa đến 23h. Thời gian cụ thể sẽ hiển thị trên từng sân.', 
       ARRAY['giờ mở cửa', 'opening hours', 'time'], 3),
       
      ('Liên hệ', 'Làm sao để liên hệ hỗ trợ?', 
       'Bạn có thể liên hệ qua: Email: support@sportbooking.com, Hotline: 1900-xxxx, hoặc chat trực tiếp qua chatbot này.', 
       ARRAY['liên hệ', 'contact', 'support', 'hỗ trợ'], 3),
       
      ('Đánh giá', 'Có thể đánh giá sân không?', 
       'Có! Sau khi sử dụng dịch vụ, bạn có thể đánh giá và để lại nhận xét. Điều này giúp cải thiện chất lượng và hỗ trợ người dùng khác lựa chọn.', 
       ARRAY['đánh giá', 'review', 'rating', 'feedback'], 2),
       
      ('Ưu đãi', 'Có chương trình khuyến mãi nào không?', 
       'Có nhiều chương trình ưu đãi: Giảm giá cho lần đặt đầu tiên, Ưu đãi đặt nhiều lần, Giá sốc vào giờ thấp điểm. Theo dõi website để cập nhật!', 
       ARRAY['khuyến mãi', 'ưu đãi', 'discount', 'promotion'], 2)
       
      ON CONFLICT DO NOTHING
    `);
    
    console.log('   ✅ FAQ knowledge seeded');
    
    // Update chatbot tables structure if needed
    console.log('🔄 Checking chatbot table structure...');
    
    // Add session_id column to chatbot_sessions if missing
    try {
      await pool.query(`
        ALTER TABLE chatbot_sessions 
        ADD COLUMN IF NOT EXISTS session_id VARCHAR(255) UNIQUE
      `);
      
      // Update existing records to have session_id if missing
      await pool.query(`
        UPDATE chatbot_sessions 
        SET session_id = 'session_' || id || '_' || extract(epoch from started_at)::text
        WHERE session_id IS NULL
      `);
      
      console.log('   ✅ chatbot_sessions updated');
    } catch (error) {
      console.log('   ⚠️  chatbot_sessions already up to date');
    }
    
    // Check final state
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%chat%' OR table_name LIKE '%faq%')
      ORDER BY table_name
    `);
    
    console.log('\n✅ Final Chatbot Tables:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Test FAQ count
    const faqCount = await pool.query('SELECT COUNT(*) as count FROM faq_knowledge WHERE is_active = true');
    console.log(`\n📊 FAQ Knowledge: ${faqCount.rows[0].count} entries ready`);
    
    console.log('\n🎉 Chatbot database is now properly configured!');
    
  } catch (error) {
    console.error('❌ Error fixing chatbot tables:', error.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  fixChatbotTables().catch(console.error);
}
