#!/usr/bin/env node

const { Client } = require('pg')
require('dotenv').config()

async function testAdminLogin() {
  console.log('🧪 Testing Admin Login Flow...\n')

  // Test 1: API Login endpoint
  console.log('1️⃣ Testing login API endpoint...')
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@sportbooking.com',
        password: 'admin123456'
      })
    })

    const data = await response.json()
    
    if (data.success) {
      console.log('✅ Login API works!')
      console.log(`   User: ${data.user.name}`)
      console.log(`   Role: ${data.user.role}`)
      console.log(`   Token: ${data.token.substring(0, 20)}...`)
      
      // Test 2: /me endpoint with token
      console.log('\n2️⃣ Testing /me endpoint with token...')
      const meResponse = await fetch('http://localhost:3000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      })
      
      const meData = await meResponse.json()
      
      if (meData.success) {
        console.log('✅ Token validation works!')
        console.log(`   User: ${meData.user.name}`)
        console.log(`   Role: ${meData.user.role}`)
        
        // Test 3: Admin dashboard API
        console.log('\n3️⃣ Testing admin dashboard API...')
        const dashboardResponse = await fetch('http://localhost:3000/api/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        })
        
        const dashboardData = await dashboardResponse.json()
        
        if (dashboardData.success) {
          console.log('✅ Admin dashboard API works!')
          console.log(`   Total users: ${dashboardData.data.stats.users.total_users}`)
          console.log(`   Total owners: ${dashboardData.data.stats.owners.total_owners}`)
        } else {
          console.log('❌ Admin dashboard API failed:', dashboardData.error)
        }
      } else {
        console.log('❌ Token validation failed:', meData.error)
      }
    } else {
      console.log('❌ Login API failed:', data.error)
    }
  } catch (error) {
    console.log('❌ Error testing login:', error.message)
  }

  // Test 4: Database check
  console.log('\n4️⃣ Checking database admin user...')
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()
    
    const result = await client.query(
      "SELECT id, name, email, role FROM users WHERE role = 'admin'"
    )
    
    if (result.rows.length > 0) {
      const admin = result.rows[0]
      console.log('✅ Admin user exists in database!')
      console.log(`   ID: ${admin.id}`)
      console.log(`   Name: ${admin.name}`)
      console.log(`   Email: ${admin.email}`)
      console.log(`   Role: ${admin.role}`)
    } else {
      console.log('❌ No admin user found in database!')
    }
  } catch (error) {
    console.log('❌ Database error:', error.message)
  } finally {
    await client.end()
  }

  console.log('\n📝 Manual Testing Steps:')
  console.log('1. Go to http://localhost:3000/auth/login')
  console.log('2. Login with: admin@sportbooking.com / admin123456')
  console.log('3. Should redirect to: http://localhost:3000/admin/dashboard')
  console.log('4. Or go directly to: http://localhost:3000/admin/dashboard')
  console.log('5. Should see admin dashboard with stats')
}

testAdminLogin().catch(console.error)
