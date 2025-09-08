#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkChatbotTables() {
  console.log('🔍 Checking Chatbot Database Tables...');
  console.log('=====================================');
  
  try {
    // Check all tables
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 All Database Tables:');
    allTables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check chatbot-related tables specifically
    const chatTables = allTables.rows.filter(row => 
      row.table_name.includes('chat') || 
      row.table_name.includes('conversation') ||
      row.table_name.includes('message') ||
      row.table_name.includes('faq')
    );
    
    console.log('\n🤖 Chatbot Related Tables:');
    if (chatTables.length === 0) {
      console.log('   ❌ No chatbot tables found');
    } else {
      chatTables.forEach(row => {
        console.log(`   ✅ ${row.table_name}`);
      });
    }
    
    // Check what the API is trying to access
    const requiredTables = [
      'chat_conversations',
      'chat_messages', 
      'faq_knowledge',
      'chatbot_sessions',
      'chatbot_messages'
    ];
    
    console.log('\n📋 Required vs Available Tables:');
    for (const tableName of requiredTables) {
      const exists = allTables.rows.some(row => row.table_name === tableName);
      console.log(`   ${exists ? '✅' : '❌'} ${tableName} - ${exists ? 'EXISTS' : 'MISSING'}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkChatbotTables().catch(console.error);
}
