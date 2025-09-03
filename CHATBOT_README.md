# AI Chatbot System - Sport Booking Assistant

## Tổng quan

Hệ thống chatbot AI thông minh được tích hợp vào website đặt sân thể thao, sử dụng Fireworks AI API để cung cấp hỗ trợ 24/7 bằng tiếng Việt.

## Tính năng chính

### 🎯 Hỗ trợ chuyên môn
- **Đặt sân thể thao**: Hướng dẫn quy trình đặt sân
- **Thông tin sân**: Giá cả, địa điểm, đánh giá, tiện ích
- **FAQ**: Giải đáp thắc mắc thường gặp
- **Hỗ trợ kỹ thuật**: Xử lý vấn đề đặt sân và thanh toán

### 🌐 Đa ngôn ngữ
- **Tiếng Việt**: Giao tiếp tự nhiên bằng tiếng Việt
- **Fallback**: Trả lời "Xin lỗi thông tin không nằm trong phạm trù..." cho câu hỏi không liên quan

### 🤖 AI Thông minh
- **Fireworks AI**: Sử dụng mô hình GPT-OSS-20B
- **Context Awareness**: Hiểu ngữ cảnh và lịch sử chat
- **Real-time**: Phản hồi nhanh chóng và chính xác

## Cấu trúc hệ thống

### Database Tables

#### 1. `chat_conversations`
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER (REFERENCES users)
- session_id: VARCHAR(255) UNIQUE
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. `chat_messages`
```sql
- id: SERIAL PRIMARY KEY
- conversation_id: INTEGER (REFERENCES chat_conversations)
- role: VARCHAR(20) (user/assistant/system)
- content: TEXT
- metadata: JSONB
- created_at: TIMESTAMP
```

#### 3. `faq_knowledge`
```sql
- id: SERIAL PRIMARY KEY
- category: VARCHAR(100)
- question: TEXT
- answer: TEXT
- keywords: TEXT[]
- priority: INTEGER
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### API Endpoints

#### POST `/api/ai/chatbot`
**Request Body:**
```json
{
  "message": "Làm thế nào để đặt sân bóng đá?",
  "sessionId": "chat_1234567890_abc123",
  "userId": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Để đặt sân bóng đá, bạn cần...",
    "conversationId": 1
  }
}
```

#### GET `/api/ai/chatbot?sessionId=xxx&limit=50`
**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "role": "user",
        "content": "Câu hỏi của bạn",
        "created_at": "2024-01-01T10:00:00Z"
      }
    ]
  }
}
```

### Components

#### `Chatbot` Component
- **Vị trí**: Fixed bottom-right corner
- **Trạng thái**: Minimize/Expand/Close
- **Giao diện**: Modern chat interface với gradient design
- **Responsive**: Tối ưu cho mobile và desktop

## Cài đặt và triển khai

### 1. Database Setup
```bash
# Chạy migration script
node scripts/run-chatbot-migration.js
```

### 2. Environment Variables
```env
DATABASE_URL=postgresql://username:password@localhost:5432/sportbooking
FIREWORKS_API_KEY=your_fireworks_api_key
```

### 3. Dependencies
```json
{
  "pg": "latest",
  "dotenv": "^17.2.1"
}
```

## Sử dụng

### 1. Tích hợp vào trang
```tsx
import Chatbot from '@/components/chatbot/chatbot'

export default function MyPage() {
  return (
    <div>
      {/* Your page content */}
      <Chatbot />
    </div>
  )
}
```

### 2. Tích hợp vào layout (toàn bộ website)
```tsx
// app/layout.tsx
import Chatbot from '@/components/chatbot/chatbot'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Chatbot />
      </body>
    </html>
  )
}
```

## Cấu hình AI

### Fireworks AI Settings
```typescript
const fireworksPayload = {
  model: "accounts/fireworks/models/gpt-oss-20b",
  max_tokens: 2048,
  temperature: 0.7,
  top_p: 1,
  top_k: 40
}
```

### Prompt Engineering
Hệ thống sử dụng prompt engineering để:
- Cung cấp context về website và sân thể thao
- Định hướng AI trả lời bằng tiếng Việt
- Xử lý câu hỏi ngoài phạm vi
- Duy trì tính nhất quán trong câu trả lời

## Bảo mật

### 1. Session Management
- Mỗi phiên chat có unique session ID
- Không lưu trữ thông tin nhạy cảm
- Tự động xóa session cũ

### 2. Input Validation
- Sanitize user input
- Rate limiting cho API calls
- Error handling cho malicious requests

### 3. API Security
- CORS configuration
- Request size limits
- Authentication ready (có thể tích hợp JWT)

## Monitoring và Analytics

### 1. Logging
- Chat conversations
- AI response quality
- Error tracking
- Performance metrics

### 2. Metrics
- Số lượng tin nhắn mỗi ngày
- Thời gian phản hồi trung bình
- Tỷ lệ thành công
- User satisfaction

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Kiểm tra DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

#### 2. Fireworks API Error
```bash
# Kiểm tra API key
# Kiểm tra network connectivity
# Verify API endpoint
```

#### 3. Chatbot không hiển thị
```bash
# Kiểm tra console errors
# Verify component import
# Check CSS conflicts
```

## Roadmap

### Phase 1 (Current)
- ✅ Basic chatbot functionality
- ✅ Vietnamese language support
- ✅ FAQ integration
- ✅ Database persistence

### Phase 2 (Future)
- 🔄 User authentication integration
- 🔄 Multi-language support
- 🔄 Voice chat capability
- 🔄 Advanced analytics

### Phase 3 (Future)
- 🔄 Machine learning improvements
- 🔄 Sentiment analysis
- 🔄 Proactive suggestions
- 🔄 Integration with booking system

## Support

### Technical Support
- **Email**: dev@sportbooking.com
- **Documentation**: [Link to docs]
- **Issues**: [GitHub Issues]

### User Support
- **Email**: support@sportbooking.com
- **Hotline**: 1900-xxxx
- **Live Chat**: Sử dụng chatbot này

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Maintainer**: SportBooking Development Team
