#!/usr/bin/env node

/**
 * Database Connection Health Check Script
 * 
 * This script tests the database connection and shows connection info.
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 60000,
});

async function testConnection() {
  console.log('🔍 Testing Database Connection...');
  console.log('================================');
  
  try {
    // Test basic connection
    console.log('⏳ Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connection successful!');
    
    // Get database info
    const result = await client.query(`
      SELECT 
        version() as version,
        current_database() as database_name,
        current_user as username,
        inet_server_addr() as server_host,
        inet_server_port() as server_port,
        current_timestamp as server_time
    `);
    
    const info = result.rows[0];
    
    console.log('\n📊 Database Information:');
    console.log(`   Database: ${info.database_name}`);
    console.log(`   User: ${info.username}`);
    console.log(`   Host: ${info.server_host || 'localhost'}`);
    console.log(`   Port: ${info.server_port || '5432'}`);
    console.log(`   Server Time: ${info.server_time}`);
    console.log(`   Version: ${info.version.split(',')[0]}`);
    
    // Test table existence
    console.log('\n🔍 Checking table existence...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('   Existing tables:');
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('   ⚠️  No tables found (database might need seeding)');
    }
    
    // Test sentiment keywords
    try {
      const keywordsResult = await client.query('SELECT COUNT(*) as count FROM sentiment_keywords');
      console.log(`\n🌱 Sentiment keywords: ${keywordsResult.rows[0].count} found`);
    } catch (error) {
      console.log('\n⚠️  Sentiment keywords table not found');
    }
    
    client.release();
    
    console.log('\n🎉 Database connection test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('timeout')) {
      console.error('   💡 This might be a timeout issue. Try running the script again.');
    }
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('   💡 Check if your database server is running.');
      console.error('   💡 Verify your DATABASE_URL in the .env file.');
    }
    
    if (error.message.includes('password') || error.message.includes('authentication')) {
      console.error('   💡 Check your database credentials in the .env file.');
    }
    
    return false;
  } finally {
    await pool.end();
  }
}

// Run the test
if (require.main === module) {
  testConnection().catch(console.error);
}
