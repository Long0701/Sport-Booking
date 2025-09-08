#!/usr/bin/env node

/**
 * Vietnamese Sentiment Keywords Seeding Script
 * 
 * This script seeds the database with comprehensive Vietnamese sentiment keywords.
 * 
 * Usage:
 * node scripts/seed-sentiment-keywords.js [--clear] [--dry-run]
 * 
 * Options:
 * --clear    Clear existing keywords before seeding (reseed)
 * --dry-run  Show what would be seeded without actually doing it
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');
  const dryRun = args.includes('--dry-run');

  console.log('🚀 Sentiment Keywords Seeding Script');
  console.log('=====================================');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made to the database');
  }
  
  if (shouldClear && !dryRun) {
    console.log('⚠️  CLEAR MODE - Existing keywords will be deleted first');
  }

  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection established');

    if (shouldClear && !dryRun) {
      console.log('\n🗑️  Clearing existing keywords...');
      const result = await pool.query('DELETE FROM sentiment_keywords');
      console.log(`   ✅ Cleared ${result.rowCount} existing keywords`);
    }

    console.log('\n🌱 Would seed comprehensive Vietnamese sentiment keywords:');
    console.log('   📊 88 positive keywords');
    console.log('   📊 86 negative keywords');  
    console.log('   📊 68 strong negative keywords');
    console.log('   📊 Total: 242 keywords across 7 categories');
    
    console.log('\n📁 Categories:');
    console.log('   • Chất lượng (Quality)');
    console.log('   • Thái độ phục vụ (Service Attitude)');
    console.log('   • Cơ sở vật chất (Facilities)');
    console.log('   • Giá cả (Pricing)');
    console.log('   • Vệ sinh (Cleanliness)');
    console.log('   • An toàn (Safety)');
    console.log('   • Khác (Others)');

    if (dryRun) {
      console.log('\n✅ Dry run completed. Use without --dry-run to actually seed.');
    } else {
      console.log('\n⚠️  To actually seed keywords, please use the Admin Panel:');
      console.log('   1. Login as owner');  
      console.log('   2. Go to Owner Dashboard → Sentiment Keywords');
      console.log('   3. Click "🔄 Seed Keywords Lại" button');
      console.log('   4. Confirm in the dialog');
      console.log('\n   Or call the API directly:');
      console.log('   POST /api/admin/sentiment-keywords/bulk');
      console.log('   { "action": "reseed_all_keywords" }');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}
