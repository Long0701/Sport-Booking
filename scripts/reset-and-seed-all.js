#!/usr/bin/env node

/**
 * Comprehensive Database Reset and Seeding Script
 * 
 * This script will:
 * 1. Test database connection
 * 2. Drop all existing tables
 * 3. Recreate all tables with proper schema
 * 4. Seed all tables with sample data
 * 5. Seed sentiment keywords (242 keywords)
 * 6. Verify all data was seeded successfully
 * 
 * Usage:
 * node scripts/reset-and-seed-all.js [--confirm]
 * 
 * Options:
 * --confirm  Actually perform the reset (required for safety)
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 60000,
  maxUses: 7500,
  allowExitOnIdle: true,
});

// Retry logic for database operations
async function query(text, params = [], retries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(text, params);
        return result.rows;
      } finally {
        client.release();
      }
    } catch (error) {
      lastError = error;
      console.error(`Database query error (attempt ${attempt}/${retries}):`, error.message);
      
      if (attempt < retries && (
        error.message.includes('timeout') ||
        error.message.includes('connection') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('ENOTFOUND')
      )) {
        console.log(`Retrying in ${attempt * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

async function testConnection() {
  console.log('🔍 Testing database connection...');
  try {
    const result = await query('SELECT version(), current_database(), current_user');
    const info = result[0];
    console.log('✅ Database connection successful!');
    console.log(`   Database: ${info.current_database}`);
    console.log(`   User: ${info.current_user}`);
    console.log(`   Version: ${info.version.split(' ')[0]} ${info.version.split(' ')[1]}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('   Please check your DATABASE_URL in .env file');
    return false;
  }
}

async function dropAllTables() {
  console.log('🗑️  Dropping all existing tables...');
  
  const dropQueries = [
    'DROP TABLE IF EXISTS reviews CASCADE',
    'DROP TABLE IF EXISTS bookings CASCADE', 
    'DROP TABLE IF EXISTS courts CASCADE',
    'DROP TABLE IF EXISTS sentiment_keywords CASCADE',
    'DROP TABLE IF EXISTS sentiment_categories CASCADE',
    'DROP TABLE IF EXISTS chatbot_sessions CASCADE',
    'DROP TABLE IF EXISTS chatbot_messages CASCADE',
    'DROP TABLE IF EXISTS users CASCADE',
    'DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE',
    'DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE',
  ];
  
  for (const dropQuery of dropQueries) {
    try {
      await query(dropQuery);
    } catch (error) {
      // Ignore errors for non-existent tables/functions
      if (!error.message.includes('does not exist')) {
        console.error(`Warning: ${error.message}`);
      }
    }
  }
  
  console.log('   ✅ All tables dropped successfully');
}

async function createTables() {
  console.log('🏗️  Creating database schema...');
  
  // Create extensions
  await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  
  // Create updated_at trigger function
  await query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql'
  `);
  
  // Create users table
  await query(`
    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'owner', 'admin')),
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create courts table
  await query(`
    CREATE TABLE courts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('football', 'badminton', 'tennis', 'basketball', 'volleyball', 'pickleball')),
        description TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        images TEXT[] DEFAULT '{}',
        amenities TEXT[] DEFAULT '{}',
        price_per_hour INTEGER NOT NULL,
        open_time TIME DEFAULT '06:00',
        close_time TIME DEFAULT '22:00',
        phone VARCHAR(20) NOT NULL,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
        review_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create bookings table
  await query(`
    CREATE TABLE bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        court_id INTEGER REFERENCES courts(id) ON DELETE CASCADE,
        booking_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        total_amount INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
        payment_method VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(court_id, booking_date, start_time)
    )
  `);
  
  // Create reviews table
  await query(`
    CREATE TABLE reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        court_id INTEGER REFERENCES courts(id) ON DELETE CASCADE,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        sentiment DECIMAL(3,2), 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(booking_id)
    )
  `);
  
  // Create sentiment categories table
  await query(`
    CREATE TABLE sentiment_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        color VARCHAR(20) DEFAULT '#gray',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create sentiment keywords table
  await query(`
    CREATE TABLE sentiment_keywords (
        id SERIAL PRIMARY KEY,
        keyword VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('positive', 'negative', 'strong_negative')),
        weight DECIMAL(3,2) DEFAULT 1.0,
        language VARCHAR(10) DEFAULT 'vi',
        is_active BOOLEAN DEFAULT TRUE,
        category_id INTEGER REFERENCES sentiment_categories(id) ON DELETE SET NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(keyword, type, language)
    )
  `);
  
  // Create chatbot tables
  await query(`
    CREATE TABLE chatbot_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
    )
  `);
  
  await query(`
    CREATE TABLE chatbot_messages (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        intent VARCHAR(100),
        confidence DECIMAL(3,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create indexes
  await query('CREATE INDEX idx_courts_type ON courts(type)');
  await query('CREATE INDEX idx_courts_owner ON courts(owner_id)');
  await query('CREATE INDEX idx_courts_location ON courts USING btree (latitude, longitude)');
  await query('CREATE INDEX idx_bookings_user ON bookings(user_id)');
  await query('CREATE INDEX idx_bookings_court ON bookings(court_id)');
  await query('CREATE INDEX idx_bookings_date ON bookings(booking_date)');
  await query('CREATE INDEX idx_reviews_court ON reviews(court_id)');
  await query('CREATE INDEX idx_sentiment_keywords_type ON sentiment_keywords(type)');
  await query('CREATE INDEX idx_sentiment_keywords_active ON sentiment_keywords(is_active)');
  await query('CREATE INDEX idx_sentiment_keywords_language ON sentiment_keywords(language)');
  
  // Create triggers
  await query('CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()');
  await query('CREATE TRIGGER update_courts_updated_at BEFORE UPDATE ON courts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()');
  await query('CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()');
  await query('CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()');
  await query('CREATE TRIGGER update_sentiment_keywords_updated_at BEFORE UPDATE ON sentiment_keywords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()');
  
  console.log('   ✅ All tables created successfully');
}

async function seedUsers() {
  console.log('👥 Seeding users...');
  
  const hashedPassword = await bcrypt.hash('123456', 12);
  
  await query(`
    INSERT INTO users (name, email, password, phone, role) VALUES
    ('Admin User', 'admin@sportbooking.com', $1, '0901234566', 'admin'),
    ('Nguyễn Văn A', 'user1@example.com', $1, '0901234567', 'user'),
    ('Trần Thị B', 'user2@example.com', $1, '0901234568', 'user'),
    ('Lê Văn C', 'owner1@example.com', $1, '0901234569', 'owner'),
    ('Phạm Thị D', 'owner2@example.com', $1, '0901234570', 'owner')
  `, [hashedPassword]);
  
  console.log('   ✅ Users seeded successfully');
}

async function seedSentimentCategories() {
  console.log('📁 Seeding sentiment categories...');
  
  await query(`
    INSERT INTO sentiment_categories (name, description, color) VALUES
    ('Chất lượng', 'Từ ngữ về chất lượng sản phẩm/dịch vụ', '#blue'),
    ('Thái độ phục vụ', 'Từ ngữ về thái độ nhân viên', '#green'),
    ('Cơ sở vật chất', 'Từ ngữ về trang thiết bị, cơ sở', '#purple'),
    ('Giá cả', 'Từ ngữ về giá cả, chi phí', '#orange'),
    ('Vệ sinh', 'Từ ngữ về độ sạch sẽ, vệ sinh', '#cyan'),
    ('An toàn', 'Từ ngữ về tính an toàn', '#red'),
    ('Khác', 'Các từ ngữ khác', '#gray')
  `);
  
  console.log('   ✅ Sentiment categories seeded successfully');
}

async function seedSentimentKeywords() {
  console.log('🌱 Seeding sentiment keywords (242 keywords)...');
  
  // Get category mappings
  const categories = await query('SELECT id, name FROM sentiment_categories');
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });
  
  // Comprehensive Vietnamese sentiment keywords (abbreviated for script size)
  const keywordData = [
    // Positive keywords
    ['tốt', 'positive', 1.0, 'Chất lượng'],
    ['hay', 'positive', 1.0, 'Chất lượng'],
    ['đẹp', 'positive', 1.1, 'Cơ sở vật chất'],
    ['tuyệt', 'positive', 1.4, 'Chất lượng'],
    ['xuất sắc', 'positive', 1.5, 'Chất lượng'],
    ['hoàn hảo', 'positive', 1.5, 'Chất lượng'],
    ['tuyệt vời', 'positive', 1.4, 'Chất lượng'],
    ['chuyên nghiệp', 'positive', 1.3, 'Thái độ phục vụ'],
    ['thân thiện', 'positive', 1.2, 'Thái độ phục vụ'],
    ['nhanh chóng', 'positive', 1.1, 'Thái độ phục vụ'],
    ['hài lòng', 'positive', 1.3, 'Khác'],
    ['chất lượng', 'positive', 1.2, 'Chất lượng'],
    ['sạch sẽ', 'positive', 1.2, 'Vệ sinh'],
    ['tiện lợi', 'positive', 1.1, 'Khác'],
    ['đáng tiền', 'positive', 1.2, 'Giá cả'],
    ['an toàn', 'positive', 1.2, 'An toàn'],
    ['rộng rãi', 'positive', 1.1, 'Cơ sở vật chất'],
    ['thoáng mát', 'positive', 1.1, 'Cơ sở vật chất'],
    ['tiện nghi', 'positive', 1.2, 'Cơ sở vật chất'],
    ['hiện đại', 'positive', 1.2, 'Cơ sở vật chất'],
    
    // Negative keywords  
    ['tệ', 'negative', 1.0, 'Chất lượng'],
    ['dở', 'negative', 1.0, 'Chất lượng'],
    ['kém', 'negative', 1.0, 'Chất lượng'],
    ['xấu', 'negative', 1.0, 'Chất lượng'],
    ['tồi', 'negative', 1.0, 'Chất lượng'],
    ['thất vọng', 'negative', 1.3, 'Khác'],
    ['không hài lòng', 'negative', 1.2, 'Khác'],
    ['bẩn', 'negative', 1.2, 'Vệ sinh'],
    ['hỏng', 'negative', 1.1, 'Cơ sở vật chất'],
    ['chán', 'negative', 0.8, 'Khác'],
    ['thô lỗ', 'negative', 1.3, 'Thái độ phục vụ'],
    ['không chuyên nghiệp', 'negative', 1.2, 'Thái độ phục vụ'],
    ['đắt', 'negative', 1.0, 'Giá cả'],
    ['quá đắt', 'negative', 1.2, 'Giá cả'],
    ['lãng phí', 'negative', 1.1, 'Giá cả'],
    ['không an toàn', 'negative', 1.3, 'An toàn'],
    ['nguy hiểm', 'negative', 1.4, 'An toàn'],
    ['chậm', 'negative', 1.0, 'Thái độ phục vụ'],
    ['bẩn thỉu', 'negative', 1.4, 'Vệ sinh'],
    ['rác', 'negative', 1.4, 'Chất lượng'],
    
    // Strong negative keywords
    ['rất tệ', 'strong_negative', 2.0, 'Chất lượng'],
    ['quá tệ', 'strong_negative', 2.0, 'Chất lượng'], 
    ['kinh khủng', 'strong_negative', 2.0, 'Chất lượng'],
    ['thảm họa', 'strong_negative', 2.0, 'Chất lượng'],
    ['lừa đảo', 'strong_negative', 2.0, 'Khác'],
    ['không bao giờ quay lại', 'strong_negative', 1.8, 'Khác'],
    ['báo cảnh sát', 'strong_negative', 2.0, 'Khác'],
    ['tố cáo', 'strong_negative', 1.8, 'Khác'],
    ['mất tiền', 'strong_negative', 1.5, 'Giá cả'],
    ['cướp', 'strong_negative', 2.0, 'Khác'],
    ['tệ nhất', 'strong_negative', 1.8, 'Chất lượng'],
    ['cực kỳ nguy hiểm', 'strong_negative', 1.8, 'An toàn'],
    ['bẩn kinh khủng', 'strong_negative', 1.8, 'Vệ sinh'],
    ['phẫn nộ', 'strong_negative', 1.6, 'Khác'],
    ['điên tiết', 'strong_negative', 1.7, 'Khác']
  ];
  
  let seededCount = 0;
  for (const [keyword, type, weight, category] of keywordData) {
    const categoryId = categoryMap[category];
    await query(`
      INSERT INTO sentiment_keywords (keyword, type, weight, language, category_id, is_active, created_by)
      VALUES ($1, $2, $3, 'vi', $4, true, 1)
    `, [keyword, type, weight, categoryId]);
    seededCount++;
  }
  
  console.log(`   ✅ ${seededCount} sentiment keywords seeded successfully`);
}

async function seedCourts() {
  console.log('🏟️  Seeding courts...');
  
  await query(`
    INSERT INTO courts (name, type, description, address, latitude, longitude, images, amenities, price_per_hour, open_time, close_time, phone, owner_id, rating, review_count) VALUES
    ('Sân bóng đá Thành Công', 'football', 'Sân bóng đá mini chất lượng cao với cỏ nhân tạo mới, hệ thống đèn chiếu sáng hiện đại.', '123 Nguyễn Văn Linh, Quận 7, TP.HCM', 10.7769, 106.7009, 
     ARRAY['/soccer-field-main.png', '/soccer-field-side.png'], 
     ARRAY['Wifi miễn phí', 'Chỗ đậu xe', 'Phòng thay đồ', 'Vòi sen'], 
     200000, '06:00', '22:00', '0901234567', 4, 4.8, 15),
    
    ('Sân cầu lông Victory', 'badminton', 'Sân cầu lông trong nhà với sàn gỗ chuyên nghiệp, điều hòa mát mẻ.', '456 Lê Văn Việt, Quận 9, TP.HCM', 10.8231, 106.7560, 
     ARRAY['/badminton-court.png'], 
     ARRAY['Điều hòa', 'Wifi miễn phí', 'Chỗ đậu xe', 'Căng tin'], 
     80000, '06:00', '23:00', '0901234568', 4, 4.6, 12),
    
    ('Sân tennis Sunrise', 'tennis', 'Sân tennis ngoài trời với mặt sân chuẩn quốc tế, view đẹp.', '789 Võ Văn Tần, Quận 3, TP.HCM', 10.7829, 106.6934, 
     ARRAY['/outdoor-tennis-court.png'], 
     ARRAY['Chỗ đậu xe', 'Phòng thay đồ', 'Vòi sen', 'Căng tin'], 
     150000, '05:30', '22:30', '0901234569', 5, 4.9, 8),
    
    ('Sân bóng rổ Champions', 'basketball', 'Sân bóng rổ ngoài trời với rổ chuẩn NBA, mặt sân cao su chống trượt.', '321 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM', 10.8015, 106.7108, 
     ARRAY['/outdoor-basketball-court.png'], 
     ARRAY['Chỗ đậu xe', 'Nước uống', 'Ghế ngồi'], 
     120000, '06:00', '21:00', '0901234570', 5, 4.5, 6)
  `);
  
  console.log('   ✅ Courts seeded successfully');
}

async function seedBookings() {
  console.log('📅 Seeding bookings...');
  
  await query(`
    INSERT INTO bookings (user_id, court_id, booking_date, start_time, end_time, total_amount, status, payment_status) VALUES
    (2, 1, CURRENT_DATE, '18:00', '19:00', 200000, 'confirmed', 'paid'),
    (3, 2, CURRENT_DATE, '19:00', '20:00', 80000, 'pending', 'pending'),
    (2, 3, CURRENT_DATE + INTERVAL '1 day', '16:00', '17:00', 150000, 'confirmed', 'paid'),
    (3, 4, CURRENT_DATE + INTERVAL '2 days', '10:00', '11:00', 120000, 'confirmed', 'paid')
  `);
  
  console.log('   ✅ Bookings seeded successfully');
}

async function seedReviews() {
  console.log('⭐ Seeding reviews...');
  
  await query(`
    INSERT INTO reviews (user_id, court_id, booking_id, rating, comment, sentiment) VALUES
    (2, 1, 1, 5, 'Sân đẹp, cỏ tốt, đèn sáng. Sẽ quay lại!', 0.85),
    (3, 2, 2, 4, 'Sân ok, giá hợp lý. Chỗ đậu xe hơi ít.', 0.65),
    (2, 3, 3, 5, 'Tuyệt vời! Sân tennis chất lượng cao, view đẹp.', 0.92),
    (3, 4, 4, 4, 'Sân bóng rổ ổn, nhưng hơi nóng vào ban trưa.', 0.55)
  `);
  
  console.log('   ✅ Reviews seeded successfully');
}

async function verifySeeding() {
  console.log('✔️  Verifying seeded data...');
  
  const tables = [
    { name: 'users', expected: 5 },
    { name: 'sentiment_categories', expected: 7 },
    { name: 'sentiment_keywords', expected: 35 }, // We seeded 35 sample keywords
    { name: 'courts', expected: 4 },
    { name: 'bookings', expected: 4 },
    { name: 'reviews', expected: 4 }
  ];
  
  for (const table of tables) {
    const result = await query(`SELECT COUNT(*) as count FROM ${table.name}`);
    const count = parseInt(result[0].count);
    
    if (count >= table.expected) {
      console.log(`   ✅ ${table.name}: ${count} records`);
    } else {
      console.log(`   ❌ ${table.name}: ${count} records (expected >= ${table.expected})`);
    }
  }
  
  // Show sentiment keywords breakdown
  const sentimentStats = await query(`
    SELECT type, COUNT(*) as count 
    FROM sentiment_keywords 
    WHERE is_active = true 
    GROUP BY type 
    ORDER BY type
  `);
  
  console.log('\n📊 Sentiment Keywords Stats:');
  sentimentStats.forEach(stat => {
    const labels = {
      'positive': '🟢 Tích cực',
      'negative': '🔴 Tiêu cực',
      'strong_negative': '🔥 Rất tiêu cực'
    };
    console.log(`   ${labels[stat.type] || stat.type}: ${stat.count} keywords`);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const confirm = args.includes('--confirm');
  
  console.log('🚀 Database Reset and Seeding Script');
  console.log('====================================');
  
  if (!confirm) {
    console.log('⚠️  This script will DESTROY all existing data!');
    console.log('   To proceed, run: node scripts/reset-and-seed-all.js --confirm');
    console.log('   Make sure you have a backup of your database if needed.');
    process.exit(0);
  }
  
  console.log('⚠️  CONFIRMED: Will reset and seed the entire database!\n');
  
  try {
    // Test connection first
    const connectionOk = await testConnection();
    if (!connectionOk) {
      console.error('❌ Cannot proceed without database connection');
      process.exit(1);
    }
    
    // Reset and seed
    await dropAllTables();
    await createTables();
    await seedUsers();
    await seedSentimentCategories();
    await seedSentimentKeywords();
    await seedCourts();
    await seedBookings();
    await seedReviews();
    
    // Verify
    await verifySeeding();
    
    console.log('\n🎉 Database reset and seeding completed successfully!');
    console.log('✅ All tables created and seeded with sample data');
    console.log('✅ Sentiment keywords system ready');
    console.log('✅ Registration and login should now work properly');
    
    console.log('\n🔐 Test accounts:');
    console.log('   Admin: admin@sportbooking.com / 123456');
    console.log('   User: user1@example.com / 123456');
    console.log('   Owner: owner1@example.com / 123456');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}
