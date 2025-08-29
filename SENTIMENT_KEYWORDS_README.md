# Dynamic Sentiment Keywords Management 🔤

## Tổng quan

Hệ thống quản lý từ khóa sentiment động cho phép admin dễ dàng thêm, sửa, xóa các từ ngữ tích cực và tiêu cực mà không cần chỉnh sửa code. Điều này giúp cải thiện độ chính xác của AI sentiment analysis và có thể tùy chỉnh theo ngữ cảnh cụ thể của doanh nghiệp.

## Tính năng chính

### 🗂️ **Quản lý Categories**
- **Categories**: Phân loại keywords theo chủ đề (Chất lượng, Thái độ phục vụ, Cơ sở vật chất, v.v.)
- **Color coding**: Mỗi category có màu sắc riêng để dễ nhận biết
- **Statistics**: Thống kê số lượng keywords trong mỗi category

### 🔤 **Dynamic Keywords Management**
- **3 loại keywords**:
  - **Positive**: Từ khóa tích cực (weight 0.1-2.0)
  - **Negative**: Từ khóa tiêu cực (weight 0.1-2.0) 
  - **Strong Negative**: Từ khóa rất tiêu cực (weight cao, auto-flag)
- **Weight system**: Điều chỉnh mức độ ảnh hưởng của từng keyword
- **Active/Inactive**: Bật/tắt keywords mà không cần xóa

### ⚡ **Performance & Caching**
- **In-memory cache**: Keywords được cache 5 phút để tăng tốc
- **Fallback keywords**: Có sẵn keywords cơ bản khi database lỗi
- **Auto refresh**: Cache tự động refresh khi có thay đổi

### 🛠️ **Admin Interface** 
- **CRUD operations**: Thêm, sửa, xóa keywords dễ dàng
- **Bulk actions**: Xử lý nhiều keywords cùng lúc
- **Search & filters**: Tìm kiếm và lọc theo type, category, status
- **Export/Import**: Xuất/nhập keywords dạng JSON

## Cài đặt

### 1. Database Migration

```bash
# Chạy script tạo tables
psql -d your_database -f scripts/add-sentiment-keywords.sql
```

### 2. Import default data

Script đã tự động insert các keywords và categories mặc định cho tiếng Việt.

## Cách sử dụng

### Admin Interface

1. **Truy cập**: `/owner/sentiment-keywords`
2. **Thêm keyword mới**:
   - Click "Thêm keyword"
   - Nhập từ khóa, chọn type và weight
   - Chọn category (tùy chọn)
3. **Quản lý hàng loạt**:
   - Chọn nhiều keywords
   - Sử dụng bulk actions để kích hoạt/vô hiệu/xóa

### API Endpoints

#### Keywords Management
```typescript
// Lấy tất cả keywords
GET /api/admin/sentiment-keywords?type=all&category=all&active=all

// Thêm keyword mới
POST /api/admin/sentiment-keywords
{
  "keyword": "tuyệt vời",
  "type": "positive", 
  "weight": 1.4,
  "categoryId": 1
}

// Cập nhật keyword
PUT /api/admin/sentiment-keywords
{
  "id": 123,
  "weight": 1.8,
  "isActive": true
}

// Xóa keyword
DELETE /api/admin/sentiment-keywords?id=123
```

#### Bulk Operations
```typescript
POST /api/admin/sentiment-keywords/bulk
{
  "action": "bulk_activate",
  "ids": ["1", "2", "3"]
}

// Export keywords
POST /api/admin/sentiment-keywords/bulk
{
  "action": "export_keywords",
  "data": {
    "filters": { "type": "all", "active": "true" }
  }
}

// Import keywords
POST /api/admin/sentiment-keywords/bulk
{
  "action": "import_keywords",
  "data": {
    "keywords": [
      {
        "keyword": "xuất sắc",
        "type": "positive",
        "weight": 1.5,
        "language": "vi"
      }
    ]
  }
}
```

## Database Schema

### sentiment_keywords
```sql
CREATE TABLE sentiment_keywords (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('positive', 'negative', 'strong_negative')),
    weight DECIMAL(3,2) DEFAULT 1.0,
    language VARCHAR(10) DEFAULT 'vi',
    is_active BOOLEAN DEFAULT TRUE,
    category_id INTEGER REFERENCES sentiment_categories(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### sentiment_categories
```sql
CREATE TABLE sentiment_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#gray',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Integration với Sentiment Analysis

### Automatic Loading
```typescript
import { getSentimentKeywords } from '@/lib/sentiment-keywords'

// Keywords tự động load từ database
const keywords = await getSentimentKeywords('vi')

// Sử dụng trong sentiment analysis
const result = await analyzeSentiment(text, true, 'vi')
```

### Cache Management
```typescript
import { clearKeywordCache } from '@/lib/sentiment-keywords'

// Clear cache khi cần force refresh
clearKeywordCache('vi') // Clear specific language
clearKeywordCache()    // Clear all languages
```

## Workflow

### Adding New Keywords
1. Admin discover từ mới trong reviews
2. Vào `/owner/sentiment-keywords`
3. Thêm keyword với type và weight phù hợp
4. Test với reviews mẫu
5. Monitor impact qua AI Reviews dashboard

### Tuning Performance
1. Monitor sentiment accuracy
2. Adjust keyword weights
3. Add/remove keywords based on performance
4. Use bulk actions for efficiency

### Multi-language Support
- Ready for multiple languages
- Language field trong database
- API hỗ trợ language parameter
- UI có thể extend cho ngôn ngữ khác

## Examples

### Keywords Categories

**Chất lượng**
- Positive: "tốt" (1.0), "xuất sắc" (1.5), "hoàn hảo" (1.5)
- Negative: "tệ" (1.0), "kém" (1.0), "tệ hại" (1.3)
- Strong Negative: "rất tệ" (2.0), "kinh khủng" (2.0)

**Thái độ phục vụ** 
- Positive: "thân thiện" (1.2), "chuyên nghiệp" (1.3)
- Negative: "thô lỗ" (1.3), "không chuyên nghiệp" (1.2)

**Vệ sinh**
- Positive: "sạch sẽ" (1.2)
- Negative: "bẩn" (1.2), "bẩn thỉu" (1.4)

### Weight Guidelines

- **0.1-0.5**: Weak impact keywords
- **0.6-1.0**: Normal impact keywords  
- **1.1-1.5**: Strong impact keywords
- **1.6-2.0**: Very strong impact keywords

### Import/Export Format

```json
[
  {
    "keyword": "tuyệt vời",
    "type": "positive",
    "weight": 1.4,
    "language": "vi",
    "category": "Chất lượng",
    "isActive": true
  },
  {
    "keyword": "thảm họa", 
    "type": "strong_negative",
    "weight": 2.0,
    "language": "vi",
    "category": "Chất lượng",
    "isActive": true
  }
]
```

## Performance

### Benchmarks
- **Database query**: ~5-20ms (with indexes)
- **Cache hit**: ~0.1ms
- **Cache miss**: ~25ms (query + cache update)
- **Sentiment analysis**: ~10-50ms (rule-based)

### Optimization Tips
1. **Use cache wisely**: Don't force refresh too often
2. **Batch operations**: Use bulk APIs for multiple changes
3. **Index optimization**: Database has proper indexes
4. **Monitor cache hit rate**: Should be >90%

## Troubleshooting

### Common Issues

1. **Keywords not taking effect**
   - Check if keyword is active
   - Verify cache refresh
   - Check language setting

2. **Performance slow**
   - Monitor cache hit rate
   - Check database indexes
   - Optimize keyword count

3. **Import/Export errors**
   - Validate JSON format
   - Check required fields
   - Verify permissions

### Debug Commands

```typescript
// Check cache status
console.log('Cache:', keywordCache)

// Force refresh
await getSentimentKeywords('vi', true)

// Test specific keyword
const result = await analyzeSentiment('text with keyword', false, 'vi')
console.log('Keywords found:', result.keywordsFound)
```

## Best Practices

### Keyword Management
1. **Start small**: Begin with core keywords
2. **Monitor impact**: Track accuracy changes
3. **Regular review**: Periodic cleanup of unused keywords
4. **Category organization**: Group related keywords
5. **Weight balance**: Don't make weights too extreme

### Performance
1. **Cache strategy**: Let cache work, don't force refresh
2. **Bulk operations**: Use for multiple changes
3. **Database maintenance**: Regular cleanup and optimization

### Security
1. **Admin only**: Only admin role can manage keywords
2. **Audit trail**: Track who created/modified keywords
3. **Backup**: Regular export for backup

---

🎯 **Kết quả**: Hệ thống sentiment analysis giờ đây hoàn toàn dynamic và có thể tùy chỉnh theo nhu cầu cụ thể của doanh nghiệp!
