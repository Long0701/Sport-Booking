# AI Review Management System 🤖

## Tổng quan

Hệ thống AI Review Management đã được tích hợp vào Sport Booking platform để tự động phát hiện và quản lý các đánh giá tiêu cực. Hệ thống sử dụng AI sentiment analysis để phân tích tâm trạng của đánh giá và tự động ẩn những đánh giá có nội dung không phù hợp.

## Tính năng mới

### 🧠 AI Sentiment Analysis
- **Tự động phân tích**: Mọi đánh giá mới sẽ được AI phân tích sentiment (tích cực, tiêu cực, trung tính)
- **Scoring**: Điểm sentiment từ -1.0 (rất tiêu cực) đến 1.0 (rất tích cực)
- **Auto-flagging**: Đánh giá tiêu cực sẽ được tự động flag và có thể ẩn

### 👁️ Review Status Management
- **Visible**: Đánh giá hiển thị công khai
- **Hidden**: Đánh giá bị ẩn khỏi public view
- **Pending Review**: Đánh giá đang chờ admin duyệt

### 🎛️ Admin Dashboard
- Dashboard mới tại `/owner/ai-reviews` cho phép:
  - Xem tất cả reviews với sentiment analysis
  - Filter theo status, sentiment, AI flag
  - Bulk actions (ẩn/hiện nhiều reviews cùng lúc)
  - Re-analyze sentiment
  - Thêm admin notes

## Cài đặt

### 1. Database Migration

Chạy script sau để cập nhật database schema:

```bash
# Nếu sử dụng PostgreSQL
psql -U your_username -d your_database -f scripts/add-review-sentiment.sql

# Hoặc kết nối database và chạy script
```

### 2. Environment Variables (Tùy chọn)

Để sử dụng OpenAI cho sentiment analysis nâng cao, thêm vào `.env`:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

*Lưu ý: Nếu không có OpenAI API key, hệ thống sẽ sử dụng rule-based sentiment analysis cho tiếng Việt.*

## Cách sử dụng

### Cho Owner/Admin

1. **Truy cập AI Reviews Dashboard**
   - Đăng nhập với tài khoản owner
   - Vào `/owner/ai-reviews`

2. **Quản lý Reviews**
   - Xem reviews được AI flag
   - Filter theo sentiment, status
   - Ẩn/hiện reviews
   - Thêm ghi chú admin

3. **Bulk Actions**
   - Chọn nhiều reviews
   - Thực hiện action hàng loạt
   - Tiết kiệm thời gian quản lý

### Cho Users

- **Tự động**: Khi tạo review mới, AI sẽ tự động phân tích
- **Transparent**: Users không thấy sự khác biệt trong UX
- **Protected**: Reviews tiêu cực được filter tự động

## Technical Details

### Database Schema Changes

Các cột mới được thêm vào bảng `reviews`:

```sql
- sentiment_score DECIMAL(3,2)     -- AI sentiment score
- sentiment_label VARCHAR(20)      -- positive/negative/neutral  
- status VARCHAR(20)               -- visible/hidden/pending_review
- ai_flagged BOOLEAN               -- AI flagged for review
- admin_reviewed BOOLEAN           -- Admin đã review
- admin_notes TEXT                 -- Ghi chú của admin
- hidden_by INTEGER                -- ID admin đã ẩn
- hidden_at TIMESTAMP             -- Thời gian ẩn
```

### API Endpoints

#### Admin APIs
- `GET /api/admin/reviews` - Lấy reviews với filters
- `PATCH /api/admin/reviews` - Cập nhật review status  
- `POST /api/admin/reviews` - Bulk actions và re-analyze

#### Updated Public APIs
- `GET /api/reviews` - Chỉ trả về visible reviews
- `POST /api/reviews` - Tự động sentiment analysis
- `GET /api/courts/[id]/reviews` - Chỉ visible reviews

### Sentiment Analysis

#### Rule-based (Default)
- Sử dụng từ khóa tiếng Việt
- Keywords positive/negative predefined
- Nhanh và không cần API key

#### AI-powered (Optional)
- Sử dụng OpenAI GPT-3.5-turbo
- Phân tích context tốt hơn
- Cần OPENAI_API_KEY

## Workflow

### Review Creation Flow
1. User tạo review mới
2. **AI sentiment analysis** tự động chạy
3. Nếu flagged → status = 'pending_review'
4. Nếu OK → status = 'visible'
5. Admin có thể review và override

### Admin Review Flow
1. Admin vào AI Reviews dashboard
2. Xem flagged reviews
3. Review và quyết định ẩn/hiện
4. Thêm admin notes nếu cần
5. Court rating được recalculate

## Monitoring

### Statistics Tracking
- Total reviews
- Visible/Hidden counts
- AI flagged counts
- Sentiment distribution
- Pending reviews

### Performance
- Sentiment analysis: ~100-500ms
- Rule-based: ~10-50ms
- OpenAI API: ~1-3s

## Customization

### Sentiment Keywords
Chỉnh sửa keywords trong `lib/sentiment-analysis.ts`:

```typescript
const negativeKeywords = [
  'tệ', 'dở', 'kém', // thêm keywords
];

const positiveKeywords = [
  'tốt', 'hay', 'đẹp', // thêm keywords  
];
```

### Flagging Rules
Tùy chỉnh logic auto-flag trong `analyzeSentiment()`:

```typescript
const flagged = 
  strongNegativeCount > 0 || 
  (score < -0.5 && confidence > 0.3) ||
  negativeCount >= 3; // tùy chỉnh threshold
```

## Troubleshooting

### Common Issues

1. **Reviews không được analyze**
   - Kiểm tra database migration đã chạy
   - Verify sentiment columns tồn tại

2. **OpenAI API errors**  
   - Kiểm tra API key
   - Verify network connection
   - Fallback về rule-based analysis

3. **Performance issues**
   - Disable OpenAI nếu chậm
   - Optimize keyword lists
   - Add database indexes

### Debug Mode

Thêm logs để debug:

```typescript
console.log('Sentiment result:', sentimentResult);
```

## Future Enhancements

- [ ] Multi-language support
- [ ] Machine learning model training
- [ ] Auto-response suggestions
- [ ] Sentiment trends analytics
- [ ] Integration with notification system

## Support

Nếu gặp vấn đề, kiểm tra:
1. Database migration status
2. Console logs for errors  
3. API response formats
4. Environment variables

---

🎉 **Chúc mừng! Hệ thống AI Review Management đã sẵn sàng hoạt động.**
