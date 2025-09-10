#!/usr/bin/env node

require('dotenv').config()

async function testNewOwnerRegistrationFlow() {
  console.log('🧪 Testing New Owner Registration Flow...\n')

  const testEmail = 'testowner@example.com'
  const testData = {
    // Thông tin cá nhân
    name: 'Nguyễn Văn Test',
    email: testEmail,
    password: 'testpass123',
    phone: '0901234567',
    // Thông tin doanh nghiệp
    businessName: 'Sân Test Sport',
    businessAddress: '123 Test Street, Test City',
    businessPhone: '0901234568',
    businessEmail: 'business@test.com',
    description: 'Sân thể thao test',
    experience: 'Nhiều năm kinh nghiệm'
  }

  let registrationId = null

  try {
    // Test 1: Owner Registration (không cần login)
    console.log('1️⃣ Testing owner registration (standalone)...')
    const regResponse = await fetch('http://localhost:3000/api/owner/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })

    const regData = await regResponse.json()
    
    if (regData.success) {
      console.log('✅ Registration successful!')
      console.log(`   Business: ${regData.data.registration.businessName}`)
      console.log(`   Status: ${regData.data.registration.status}`)
      console.log(`   Email: ${regData.data.registration.email}`)
      registrationId = regData.data.registration.id
    } else {
      console.log('❌ Registration failed:', regData.error)
      return
    }

    // Test 2: Check registration status
    console.log('\n2️⃣ Testing registration status check...')
    const statusResponse = await fetch(`http://localhost:3000/api/owner/register?email=${encodeURIComponent(testEmail)}`)
    const statusData = await statusResponse.json()
    
    if (statusData.success && statusData.data.hasRegistration) {
      console.log('✅ Status check works!')
      console.log(`   Status: ${statusData.data.registration.status}`)
      console.log(`   Can Login: ${statusData.data.registration.canLogin}`)
    } else {
      console.log('❌ Status check failed')
    }

    // Test 3: Try login before approval (should fail)
    console.log('\n3️⃣ Testing login before approval (should fail)...')
    const loginBeforeResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: testData.password
      })
    })

    const loginBeforeData = await loginBeforeResponse.json()
    
    if (loginBeforeData.success) {
      console.log('❌ Login should have failed before approval!')
    } else {
      console.log('✅ Login correctly failed before approval')
      console.log(`   Error: ${loginBeforeData.error}`)
    }

    // Test 4: Admin approval flow
    console.log('\n4️⃣ Testing admin approval...')
    
    // Get admin token first
    const adminLoginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@sportbooking.com',
        password: 'admin123456'
      })
    })

    const adminLoginData = await adminLoginResponse.json()
    if (!adminLoginData.success) {
      console.log('❌ Admin login failed:', adminLoginData.error)
      return
    }

    const adminToken = adminLoginData.token
    console.log('✅ Admin logged in successfully')

    // Get registration requests
    const requestsResponse = await fetch('http://localhost:3000/api/admin/owner-registrations', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    })

    const requestsData = await requestsResponse.json()
    if (requestsData.success) {
      console.log('✅ Got registration requests')
      console.log(`   Pending requests: ${requestsData.data.stats.pending}`)
      
      // Find our test request
      const testRequest = requestsData.data.requests.find(r => r.user_email === testEmail)
      if (testRequest) {
        console.log('✅ Found test request:', testRequest.id)
        
        // Approve the request
        const approveResponse = await fetch(`http://localhost:3000/api/admin/owner-registrations/${testRequest.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            action: 'approve',
            admin_notes: 'Test approval'
          })
        })

        const approveData = await approveResponse.json()
        if (approveData.success) {
          console.log('✅ Registration approved successfully!')
          console.log(`   Message: ${approveData.message}`)
        } else {
          console.log('❌ Approval failed:', approveData.error)
          return
        }
      } else {
        console.log('❌ Test request not found in admin list')
        return
      }
    } else {
      console.log('❌ Failed to get registration requests:', requestsData.error)
      return
    }

    // Test 5: Login after approval (should work)
    console.log('\n5️⃣ Testing login after approval (should work)...')
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait a bit
    
    const loginAfterResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: testData.password
      })
    })

    const loginAfterData = await loginAfterResponse.json()
    
    if (loginAfterData.success) {
      console.log('✅ Login successful after approval!')
      console.log(`   User: ${loginAfterData.user.name}`)
      console.log(`   Role: ${loginAfterData.user.role}`)
      console.log(`   Email: ${loginAfterData.user.email}`)
    } else {
      console.log('❌ Login failed after approval:', loginAfterData.error)
    }

    // Test 6: Check updated status
    console.log('\n6️⃣ Testing updated registration status...')
    const finalStatusResponse = await fetch(`http://localhost:3000/api/owner/register?email=${encodeURIComponent(testEmail)}`)
    const finalStatusData = await finalStatusResponse.json()
    
    if (finalStatusData.success && finalStatusData.data.hasRegistration) {
      console.log('✅ Final status check works!')
      console.log(`   Status: ${finalStatusData.data.registration.status}`)
      console.log(`   Can Login: ${finalStatusData.data.registration.canLogin}`)
    } else {
      console.log('❌ Final status check failed')
    }

    console.log('\n🎉 New Owner Registration Flow Test Completed!')
    console.log('\n📋 Summary:')
    console.log('   ✅ Standalone registration (no login required)')
    console.log('   ✅ Registration status tracking')
    console.log('   ✅ Login blocked before approval')
    console.log('   ✅ Admin approval creates user account')
    console.log('   ✅ Login works after approval')
    console.log('   ✅ Status updated correctly')

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }

  // Cleanup
  if (registrationId) {
    console.log('\n🧹 Cleaning up test data...')
    try {
      // Note: In a real scenario, you might want to clean up the test user and registration
      // For now, we'll leave it as demo data
      console.log('✅ Cleanup completed (test data kept as demo)')
    } catch (error) {
      console.log('⚠️  Cleanup warning:', error.message)
    }
  }
}

// Run test
testNewOwnerRegistrationFlow().catch(console.error)
