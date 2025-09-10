#!/usr/bin/env node

const { Client } = require('pg')
const bcrypt = require('bcryptjs')
require('dotenv').config()

async function checkAdminUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()
    console.log('🔗 Connected to database')

    // Check admin user
    console.log('👤 Checking admin user...')
    const adminResult = await client.query(
      "SELECT id, name, email, role, password FROM users WHERE role = 'admin'"
    )

    if (adminResult.rows.length === 0) {
      console.log('❌ No admin user found!')
      return
    }

    const admin = adminResult.rows[0]
    console.log('✅ Found admin user:')
    console.log(`   ID: ${admin.id}`)
    console.log(`   Name: ${admin.name}`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Role: ${admin.role}`)
    console.log(`   Password hash: ${admin.password.substring(0, 20)}...`)

    // Test password comparison
    console.log('\n🔍 Testing password comparison...')
    const testPassword = 'admin123456'
    const isMatch = await bcrypt.compare(testPassword, admin.password)
    console.log(`Password "${testPassword}" matches: ${isMatch}`)

    if (!isMatch) {
      console.log('\n🔧 Password does not match. Updating admin password...')
      const newHashedPassword = await bcrypt.hash(testPassword, 12)
      
      await client.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [newHashedPassword, admin.id]
      )
      
      console.log('✅ Admin password updated successfully!')
      
      // Verify the update
      const verifyResult = await bcrypt.compare(testPassword, newHashedPassword)
      console.log(`Verification: ${verifyResult}`)
    }

    // Check all users for comparison
    console.log('\n📊 All users in system:')
    const allUsers = await client.query(
      "SELECT id, name, email, role FROM users ORDER BY role, id"
    )
    
    allUsers.rows.forEach(user => {
      console.log(`   ${user.id}: ${user.name} (${user.email}) - ${user.role}`)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Run check
checkAdminUser().catch(console.error)
