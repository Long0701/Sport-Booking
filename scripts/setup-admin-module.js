#!/usr/bin/env node

const { Client } = require('pg')
const bcrypt = require('bcryptjs')
require('dotenv').config()

async function setupAdminModule() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()
    console.log('🔗 Connected to database')

    // Run migration to add owner_registrations table
    console.log('📝 Creating owner_registrations table...')
    
    const migrationSQL = `
      -- Add owner registrations table for admin approval process
      CREATE TABLE IF NOT EXISTS owner_registrations (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          business_name VARCHAR(255) NOT NULL,
          business_address TEXT NOT NULL,
          business_phone VARCHAR(20) NOT NULL,
          business_email VARCHAR(255),
          description TEXT,
          experience TEXT,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
          admin_notes TEXT,
          reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_owner_registrations_user ON owner_registrations(user_id);
      CREATE INDEX IF NOT EXISTS idx_owner_registrations_status ON owner_registrations(status);
      CREATE INDEX IF NOT EXISTS idx_owner_registrations_reviewed_by ON owner_registrations(reviewed_by);

      -- Create trigger for updated_at
      DROP TRIGGER IF EXISTS update_owner_registrations_updated_at ON owner_registrations;
      CREATE TRIGGER update_owner_registrations_updated_at 
          BEFORE UPDATE ON owner_registrations 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      -- Add approval status tracking to users table 
      ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'none' CHECK (approval_status IN ('none', 'pending', 'approved', 'rejected'));
      ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

      -- Create index for approval status
      CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);
    `

    await client.query(migrationSQL)
    console.log('✅ Migration completed successfully')

    // Check if admin user exists
    console.log('👤 Checking for admin user...')
    const adminCheck = await client.query(
      "SELECT id, name, email FROM users WHERE role = 'admin' LIMIT 1"
    )

    if (adminCheck.rows.length === 0) {
      // Create admin user
      console.log('👤 Creating admin user...')
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456'
      const hashedPassword = await bcrypt.hash(adminPassword, 12)
      
      const adminResult = await client.query(`
        INSERT INTO users (name, email, password, role, approval_status, approved_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING id, name, email, role
      `, [
        'Admin System',
        'admin@sportbooking.com',
        hashedPassword,
        'admin',
        'approved'
      ])

      const admin = adminResult.rows[0]
      console.log('✅ Admin user created:')
      console.log(`   ID: ${admin.id}`)
      console.log(`   Name: ${admin.name}`)
      console.log(`   Email: ${admin.email}`)
      console.log(`   Password: ${adminPassword}`)
      console.log('⚠️  Please change the admin password after first login!')
    } else {
      const admin = adminCheck.rows[0]
      console.log('✅ Admin user already exists:')
      console.log(`   ID: ${admin.id}`)
      console.log(`   Name: ${admin.name}`)
      console.log(`   Email: ${admin.email}`)
    }

    // Update existing owners approval status
    console.log('📝 Updating existing owners approval status...')
    const updateResult = await client.query(`
      UPDATE users 
      SET approval_status = 'approved', 
          approved_at = CURRENT_TIMESTAMP
      WHERE role = 'owner' AND (approval_status IS NULL OR approval_status = 'none')
    `)
    console.log(`✅ Updated ${updateResult.rowCount} existing owner records`)

    // Show summary
    const userStats = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE role = 'user') as users,
        COUNT(*) FILTER (WHERE role = 'owner') as owners,
        COUNT(*) FILTER (WHERE role = 'admin') as admins
      FROM users
    `)
    
    const registrationStats = await client.query(`
      SELECT COUNT(*) as pending_requests FROM owner_registrations
    `)
    
    const stats = {
      users: userStats.rows[0].users,
      owners: userStats.rows[0].owners, 
      admins: userStats.rows[0].admins,
      pending_requests: registrationStats.rows[0].pending_requests
    }

    const { users, owners, admins, pending_requests } = stats
    
    console.log('\n📊 Current system status:')
    console.log(`   👥 Users: ${users}`)
    console.log(`   🏢 Owners: ${owners}`)
    console.log(`   👤 Admins: ${admins}`)
    console.log(`   📋 Pending owner requests: ${pending_requests || 0}`)

    console.log('\n🎉 Admin module setup completed successfully!')
    console.log('\n📌 Next steps:')
    console.log('   1. Visit /admin/dashboard to access admin panel')
    console.log('   2. Login with admin credentials')
    console.log('   3. Review and approve owner registrations')
    console.log('   4. Change default admin password in settings')

  } catch (error) {
    console.error('❌ Error setting up admin module:', error.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Run setup
setupAdminModule().catch(console.error)
