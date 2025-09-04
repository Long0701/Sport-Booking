const { Pool } = require('pg')

// Database connection (you'll need to set DATABASE_URL in your .env file)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/sportbooking',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function checkCourts() {
  try {
    console.log('🔍 Checking courts in database...\n')
    
    // Check total court count
    const totalCount = await pool.query('SELECT COUNT(*) as total FROM courts WHERE is_active = true')
    console.log(`📊 Total active courts: ${totalCount.rows[0].total}`)
    
    // Check courts by type
    const courtsByType = await pool.query(`
      SELECT type, COUNT(*) as count 
      FROM courts 
      WHERE is_active = true 
      GROUP BY type 
      ORDER BY count DESC
    `)
    
    console.log('\n🏟️  Courts by type:')
    courtsByType.rows.forEach(row => {
      console.log(`  ${row.type}: ${row.count} courts`)
    })
    
    // Get all court details
    const allCourts = await pool.query(`
      SELECT name, type, address, price_per_hour, rating, review_count 
      FROM courts 
      WHERE is_active = true 
      ORDER BY type, rating DESC
    `)
    
    console.log('\n📋 All courts details:')
    allCourts.rows.forEach((court, index) => {
      console.log(`${index + 1}. ${court.name} (${court.type})`)
      console.log(`   Address: ${court.address}`)
      console.log(`   Price: ${court.price_per_hour.toLocaleString('vi-VN')}đ/giờ`)
      console.log(`   Rating: ${court.rating}⭐ (${court.review_count} reviews)`)
      console.log('')
    })
    
    // Check if there are any inactive courts
    const inactiveCount = await pool.query('SELECT COUNT(*) as total FROM courts WHERE is_active = false')
    if (inactiveCount.rows[0].total > 0) {
      console.log(`⚠️  Found ${inactiveCount.rows[0].total} inactive courts`)
    }
    
  } catch (error) {
    console.error('❌ Error checking courts:', error.message)
    
    if (error.message.includes('DATABASE_URL')) {
      console.log('\n💡 To fix this:')
      console.log('1. Create a .env file in your project root')
      console.log('2. Add: DATABASE_URL=postgresql://username:password@localhost:5432/sportbooking')
      console.log('3. Replace username, password, and database name with your actual values')
    }
  } finally {
    await pool.end()
  }
}

// Run the check
checkCourts()
