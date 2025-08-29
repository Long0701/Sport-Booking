const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

// Import database connection from lib  
const { query } = require('../lib/db')

async function runMigration() {
  
  try {
    console.log('🚀 Starting sentiment keywords migration...')
    
    // Read migration files
    const reviewSentimentSql = fs.readFileSync(
      path.join(__dirname, 'add-review-sentiment.sql'), 
      'utf8'
    )
    
    const sentimentKeywordsSql = fs.readFileSync(
      path.join(__dirname, 'add-sentiment-keywords.sql'), 
      'utf8'
    )
    
    console.log('📊 Creating review sentiment columns...')
    await query(reviewSentimentSql)
    console.log('✅ Review sentiment columns created!')
    
    console.log('🔤 Creating sentiment keywords tables and seeding data...')
    await query(sentimentKeywordsSql)
    console.log('✅ Sentiment keywords tables created and seeded!')
    
    // Verify data
    const keywordCount = await query(
      'SELECT COUNT(*) as count FROM sentiment_keywords WHERE is_active = true'
    )
    
    const categoryCount = await query(
      'SELECT COUNT(*) as count FROM sentiment_categories WHERE is_active = true'
    )
    
    console.log(`📈 Migration completed successfully!`)
    console.log(`   - ${keywordCount[0].count} active keywords`)
    console.log(`   - ${categoryCount[0].count} active categories`)
    console.log(`🎉 Database is ready for AI sentiment analysis!`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('Details:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🏁 Migration script finished')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error)
      process.exit(1)
    })
}

module.exports = { runMigration }
