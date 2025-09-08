#!/usr/bin/env node

/**
 * Test script for Chatbot API
 * This will test the chatbot API endpoints to ensure they work properly
 */

const { Pool } = require('pg');
require('dotenv').config();

const API_BASE = 'http://localhost:3000/api/ai/chatbot';

async function testChatbotAPI() {
  console.log('🧪 Testing Chatbot API...');
  console.log('========================');
  
  try {
    // Test 1: Send a simple message
    console.log('📤 Test 1: Sending test message...');
    const sessionId = `test_${Date.now()}`;
    
    const postResponse = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Xin chào, tôi muốn biết về dịch vụ đặt sân',
        sessionId: sessionId,
        userId: 1
      })
    });
    
    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      console.error(`❌ POST request failed: ${postResponse.status} ${postResponse.statusText}`);
      console.error('Error details:', errorText);
      return false;
    }
    
    const postData = await postResponse.json();
    console.log('✅ POST Response:', postData.success ? 'SUCCESS' : 'FAILED');
    
    if (postData.success) {
      console.log('   Response:', postData.data.response.substring(0, 100) + '...');
      console.log('   Conversation ID:', postData.data.conversationId);
    } else {
      console.error('   Error:', postData.error);
      if (postData.details) console.error('   Details:', postData.details);
    }
    
    // Test 2: Retrieve chat history  
    console.log('\n📥 Test 2: Retrieving chat history...');
    const getResponse = await fetch(`${API_BASE}?sessionId=${sessionId}&limit=10`);
    
    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error(`❌ GET request failed: ${getResponse.status} ${getResponse.statusText}`);
      console.error('Error details:', errorText);
      return false;
    }
    
    const getData = await getResponse.json();
    console.log('✅ GET Response:', getData.success ? 'SUCCESS' : 'FAILED');
    
    if (getData.success) {
      console.log(`   Messages retrieved: ${getData.data.messages.length}`);
      getData.data.messages.forEach((msg, index) => {
        console.log(`   ${index + 1}. [${msg.role}]: ${msg.content.substring(0, 50)}...`);
      });
    } else {
      console.error('   Error:', getData.error);
    }
    
    console.log('\n🎉 Chatbot API tests completed!');
    return postData.success && getData.success;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('   Make sure the Next.js development server is running on port 3000');
    console.error('   Run: npm run dev');
    return false;
  }
}

// Database validation test
async function testDatabaseStructure() {
  console.log('\n🔍 Testing database structure...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  
  try {
    // Test FAQ table
    const faqResult = await pool.query('SELECT COUNT(*) as count FROM faq_knowledge WHERE is_active = true');
    console.log(`✅ FAQ Knowledge: ${faqResult.rows[0].count} entries`);
    
    // Test chatbot tables  
    const sessionResult = await pool.query('SELECT COUNT(*) as count FROM chatbot_sessions');
    console.log(`✅ Chatbot Sessions: ${sessionResult.rows[0].count} entries`);
    
    const messageResult = await pool.query('SELECT COUNT(*) as count FROM chatbot_messages');
    console.log(`✅ Chatbot Messages: ${messageResult.rows[0].count} entries`);
    
  } catch (error) {
    console.error('❌ Database structure test failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run tests
async function main() {
  await testDatabaseStructure();
  const apiWorking = await testChatbotAPI();
  
  if (apiWorking) {
    console.log('\n🎉 All tests passed! Chatbot API is working properly.');
  } else {
    console.log('\n❌ Some tests failed. Please check the logs above.');
  }
}

if (require.main === module) {
  main().catch(console.error);
}
