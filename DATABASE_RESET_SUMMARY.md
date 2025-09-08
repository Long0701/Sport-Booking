# Database Reset and Fix Summary

## ✅ Issues Fixed

### 1. **Connection Timeout Error Fixed**
- **Problem**: `Connection terminated due to connection timeout`
- **Root Cause**: Database connection pool had too short timeout (2 seconds)
- **Solution**: 
  - Increased `connectionTimeoutMillis` from 2000ms to 10000ms (10 seconds)
  - Added `acquireTimeoutMillis: 60000ms` (60 seconds) 
  - Added retry logic with exponential backoff
  - Added minimum pool connections (`min: 2`)
  - Improved error handling and logging

### 2. **Database Schema Completely Reset**
- **Action**: Dropped and recreated all tables
- **Tables Created**:
  - `users` - User accounts (admin, owner, user roles)
  - `courts` - Sports venues/facilities  
  - `bookings` - Court reservations
  - `reviews` - User reviews with sentiment analysis
  - `sentiment_keywords` - AI sentiment analysis keywords
  - `sentiment_categories` - Keyword categories
  - `chatbot_sessions` - Chatbot conversation sessions
  - `chatbot_messages` - Individual chatbot messages

### 3. **Complete Data Seeding**
- **Users**: 5 test accounts (admin, users, owners)
- **Courts**: 4 sample sports courts (football, badminton, tennis, basketball)
- **Bookings**: 4 sample bookings
- **Reviews**: 4 sample reviews with sentiment scores
- **Sentiment Categories**: 7 categories (Chất lượng, Thái độ phục vụ, etc.)
- **Sentiment Keywords**: 55 Vietnamese keywords for AI analysis

## 📊 Database Statistics

```
✅ users: 5 records
✅ sentiment_categories: 7 records  
✅ sentiment_keywords: 55 records
✅ courts: 4 records
✅ bookings: 4 records
✅ reviews: 4 records
✅ chatbot_sessions: 0 records (empty, ready for use)
✅ chatbot_messages: 0 records (empty, ready for use)
```

### Sentiment Keywords Breakdown:
- 🟢 **Positive**: 20 keywords (tốt, hay, đẹp, tuyệt, xuất sắc, etc.)
- 🔴 **Negative**: 20 keywords (tệ, dở, kém, xấu, thất vọng, etc.)  
- 🔥 **Strong Negative**: 15 keywords (rất tệ, kinh khủng, lừa đảo, etc.)

## 🔐 Test Accounts

All passwords are: **123456**

| Role  | Email | Description |
|-------|--------|-------------|
| Admin | admin@sportbooking.com | Full system access |
| User | user1@example.com | Regular customer |
| User | user2@example.com | Regular customer |  
| Owner | owner1@example.com | Court owner |
| Owner | owner2@example.com | Court owner |

## 🚀 System Status

### ✅ What's Working:
- Database connection (no more timeouts)
- User registration and login
- All core tables and relationships
- Sentiment analysis system (55 keywords ready)
- Chatbot infrastructure (tables ready)
- Court booking system
- Review system with sentiment scoring

### 🔧 Scripts Created:
- `scripts/test-database-connection.js` - Test DB health
- `scripts/reset-and-seed-all.js --confirm` - Full reset & seed
- `lib/db.ts` - Improved connection with retry logic

## 🧪 How to Test

### Test Registration:
1. Go to `/auth/register`
2. Register with a new email
3. Should work without timeout errors

### Test Login:
1. Go to `/auth/login` 
2. Use any test account above
3. Should work smoothly

### Test Sentiment Keywords:
1. Login as owner: `owner1@example.com / 123456`
2. Go to Owner Dashboard → Sentiment Keywords
3. Should see 55 keywords loaded
4. Can use "Seed Keywords Lại" button for full 242 keywords

## 🔄 Future Maintenance

### To Reset Database Again:
```bash
node scripts/reset-and-seed-all.js --confirm
```

### To Test Connection:
```bash
node scripts/test-database-connection.js
```

### To Add More Sentiment Keywords:
1. Use Admin Panel: Owner Dashboard → Sentiment Keywords → "Seed Keywords Lại"
2. Or API: `POST /api/admin/sentiment-keywords/bulk` with `action: reseed_all_keywords`

## 📈 Performance Improvements

- **Connection Pool**: 2-20 connections, 60s acquire timeout
- **Retry Logic**: 3 attempts with exponential backoff  
- **Error Handling**: Detailed error messages and recovery
- **Health Checks**: Built-in database health monitoring
- **Indexes**: Proper indexes on all foreign keys and search columns

**The registration timeout error should now be completely resolved!** ✅
