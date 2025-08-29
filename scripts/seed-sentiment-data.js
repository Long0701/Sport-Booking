const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function seedSentimentData() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Starting sentiment data seeding...')
    
    // First, create categories
    console.log('📂 Creating sentiment categories...')
    await client.query(`
      INSERT INTO sentiment_categories (name, description, color) VALUES
        ('Chất lượng', 'Từ ngữ về chất lượng sản phẩm/dịch vụ', '#blue'),
        ('Thái độ phục vụ', 'Từ ngữ về thái độ nhân viên', '#green'),
        ('Cơ sở vật chất', 'Từ ngữ về trang thiết bị, cơ sở', '#purple'),
        ('Giá cả', 'Từ ngữ về giá cả, chi phí', '#orange'),
        ('Vệ sinh', 'Từ ngữ về độ sạch sẽ, vệ sinh', '#cyan'),
        ('An toàn', 'Từ ngữ về tính an toàn', '#red'),
        ('Khác', 'Các từ ngữ khác', '#gray')
      ON CONFLICT (name) DO NOTHING
    `)
    
    // Get category IDs
    const categories = await client.query('SELECT id, name FROM sentiment_categories')
    const categoryMap = {}
    categories.rows.forEach(cat => {
      categoryMap[cat.name] = cat.id
    })
    
    console.log('✅ Categories created!')
    
    // Now insert keywords
    console.log('🔤 Inserting sentiment keywords...')
    
    // Strong negative keywords
    const strongNegativeKeywords = [
      { keyword: 'rất tệ', weight: 2.0, category: 'Chất lượng' },
      { keyword: 'quá tệ', weight: 2.0, category: 'Chất lượng' },
      { keyword: 'kinh khủng', weight: 2.0, category: 'Chất lượng' },
      { keyword: 'thảm họa', weight: 2.0, category: 'Chất lượng' },
      { keyword: 'lừa đảo', weight: 2.0, category: 'Khác' },
      { keyword: 'không bao giờ quay lại', weight: 1.8, category: 'Khác' },
      { keyword: 'báo cảnh sát', weight: 2.0, category: 'Khác' },
      { keyword: 'tố cáo', weight: 1.8, category: 'Khác' },
      { keyword: 'mất tiền', weight: 1.5, category: 'Giá cả' },
      { keyword: 'cướp', weight: 2.0, category: 'Khác' },
      { keyword: 'tệ nhất', weight: 1.8, category: 'Chất lượng' },
    ]
    
    // Regular negative keywords
    const negativeKeywords = [
      { keyword: 'tệ', weight: 1.0, category: 'Chất lượng' },
      { keyword: 'dở', weight: 1.0, category: 'Chất lượng' },
      { keyword: 'kém', weight: 1.0, category: 'Chất lượng' },
      { keyword: 'xấu', weight: 1.0, category: 'Chất lượng' },
      { keyword: 'tồi', weight: 1.0, category: 'Chất lượng' },
      { keyword: 'ghê', weight: 1.2, category: 'Chất lượng' },
      { keyword: 'thất vọng', weight: 1.3, category: 'Khác' },
      { keyword: 'không hài lòng', weight: 1.2, category: 'Khác' },
      { keyword: 'rác', weight: 1.4, category: 'Chất lượng' },
      { keyword: 'bẩn', weight: 1.2, category: 'Vệ sinh' },
      { keyword: 'hỏng', weight: 1.1, category: 'Cơ sở vật chất' },
      { keyword: 'chán', weight: 0.8, category: 'Khác' },
      { keyword: 'tệ hại', weight: 1.3, category: 'Chất lượng' },
      { keyword: 'không nên', weight: 1.0, category: 'Khác' },
      { keyword: 'tránh xa', weight: 1.4, category: 'Khác' },
      { keyword: 'không đáng', weight: 1.1, category: 'Giá cả' },
      { keyword: 'thô lỗ', weight: 1.3, category: 'Thái độ phục vụ' },
      { keyword: 'không chuyên nghiệp', weight: 1.2, category: 'Thái độ phục vụ' },
      { keyword: 'lận lưng', weight: 1.5, category: 'Khác' },
      { keyword: 'bẩn thỉu', weight: 1.4, category: 'Vệ sinh' },
      { keyword: 'tiền mất tật mang', weight: 1.5, category: 'Giá cả' },
      { keyword: 'lãng phí', weight: 1.1, category: 'Giá cả' },
    ]
    
    // Positive keywords
    const positiveKeywords = [
      { keyword: 'tốt', weight: 1.0, category: 'Chất lượng' },
      { keyword: 'hay', weight: 1.0, category: 'Chất lượng' },
      { keyword: 'đẹp', weight: 1.1, category: 'Cơ sở vật chất' },
      { keyword: 'tuyệt', weight: 1.4, category: 'Chất lượng' },
      { keyword: 'xuất sắc', weight: 1.5, category: 'Chất lượng' },
      { keyword: 'hoàn hảo', weight: 1.5, category: 'Chất lượng' },
      { keyword: 'hài lòng', weight: 1.3, category: 'Khác' },
      { keyword: 'tuyệt vời', weight: 1.4, category: 'Chất lượng' },
      { keyword: 'chất lượng', weight: 1.2, category: 'Chất lượng' },
      { keyword: 'sạch sẽ', weight: 1.2, category: 'Vệ sinh' },
      { keyword: 'chuyên nghiệp', weight: 1.3, category: 'Thái độ phục vụ' },
      { keyword: 'thân thiện', weight: 1.2, category: 'Thái độ phục vụ' },
      { keyword: 'nhanh chóng', weight: 1.1, category: 'Thái độ phục vụ' },
      { keyword: 'tiện lợi', weight: 1.1, category: 'Khác' },
      { keyword: 'đáng tiền', weight: 1.2, category: 'Giá cả' },
      { keyword: 'rộng rãi', weight: 1.1, category: 'Cơ sở vật chất' },
      { keyword: 'thoáng mát', weight: 1.1, category: 'Cơ sở vật chất' },
      { keyword: 'an toàn', weight: 1.2, category: 'An toàn' },
      { keyword: 'gần gũi', weight: 1.0, category: 'Thái độ phục vụ' },
      { keyword: 'ổn định', weight: 1.1, category: 'Chất lượng' },
      { keyword: 'nhiệt tình', weight: 1.2, category: 'Thái độ phục vụ' },
      { keyword: 'tận tâm', weight: 1.3, category: 'Thái độ phục vụ' },
      { keyword: 'phục vụ tốt', weight: 1.2, category: 'Thái độ phục vụ' },
      { keyword: 'giá hợp lý', weight: 1.1, category: 'Giá cả' },
      { keyword: 'giá rẻ', weight: 1.0, category: 'Giá cả' },
    ]
    
    // Insert strong negative keywords
    for (const kw of strongNegativeKeywords) {
      try {
        await client.query(`
          INSERT INTO sentiment_keywords (keyword, type, weight, language, category_id, is_active, created_by)
          VALUES ($1, 'strong_negative', $2, 'vi', $3, true, null)
          ON CONFLICT (keyword, type, language) DO NOTHING
        `, [kw.keyword, kw.weight, categoryMap[kw.category]])
      } catch (err) {
        console.log(`⚠️  Skipped keyword: ${kw.keyword} (already exists)`)
      }
    }
    
    // Insert negative keywords
    for (const kw of negativeKeywords) {
      try {
        await client.query(`
          INSERT INTO sentiment_keywords (keyword, type, weight, language, category_id, is_active, created_by)
          VALUES ($1, 'negative', $2, 'vi', $3, true, null)
          ON CONFLICT (keyword, type, language) DO NOTHING
        `, [kw.keyword, kw.weight, categoryMap[kw.category]])
      } catch (err) {
        console.log(`⚠️  Skipped keyword: ${kw.keyword} (already exists)`)
      }
    }
    
    // Insert positive keywords
    for (const kw of positiveKeywords) {
      try {
        await client.query(`
          INSERT INTO sentiment_keywords (keyword, type, weight, language, category_id, is_active, created_by)
          VALUES ($1, 'positive', $2, 'vi', $3, true, null)
          ON CONFLICT (keyword, type, language) DO NOTHING
        `, [kw.keyword, kw.weight, categoryMap[kw.category]])
      } catch (err) {
        console.log(`⚠️  Skipped keyword: ${kw.keyword} (already exists)`)
      }
    }
    
    // Verify data
    const keywordCount = await client.query(
      'SELECT COUNT(*) as count FROM sentiment_keywords WHERE is_active = true'
    )
    
    const categoryCount = await client.query(
      'SELECT COUNT(*) as count FROM sentiment_categories WHERE is_active = true'
    )
    
    const typeStats = await client.query(`
      SELECT type, COUNT(*) as count 
      FROM sentiment_keywords 
      WHERE is_active = true 
      GROUP BY type
    `)
    
    console.log(`📈 Data seeding completed successfully!`)
    console.log(`   - ${keywordCount.rows[0].count} total keywords`)
    console.log(`   - ${categoryCount.rows[0].count} categories`)
    
    typeStats.rows.forEach(stat => {
      console.log(`   - ${stat.count} ${stat.type} keywords`)
    })
    
    console.log(`🎉 Database is ready for AI sentiment analysis!`)
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
    console.error('Details:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Run if called directly
if (require.main === module) {
  seedSentimentData()
    .then(() => {
      console.log('🏁 Seeding completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}

module.exports = { seedSentimentData }
