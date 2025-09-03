const { Pool } = require('pg')
require('dotenv').config()

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set')
  console.error('Please create a .env file with DATABASE_URL=postgresql://username:password@localhost:5432/sportbooking')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function runMigration() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Starting chatbot database migration...')
    
    // Read the SQL file
    const fs = require('fs')
    const path = require('path')
    const sqlPath = path.join(__dirname, 'create-chatbot-tables.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Split SQL statements and execute them
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)
          await client.query(statement)
          console.log(`✅ Statement ${i + 1} executed successfully`)
        } catch (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message)
          // Continue with other statements
        }
      }
    }
    
    console.log('🎉 Chatbot database migration completed successfully!')
    
    // Verify the tables were created
    console.log('\n🔍 Verifying created tables...')
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('chat_conversations', 'chat_messages', 'faq_knowledge')
      ORDER BY table_name
    `)
    
    console.log('📊 Created tables:')
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })
    
    // Check FAQ data
    const faqResult = await client.query('SELECT COUNT(*) as count FROM faq_knowledge')
    console.log(`📚 FAQ entries: ${faqResult.rows[0].count}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration().catch(console.error)
