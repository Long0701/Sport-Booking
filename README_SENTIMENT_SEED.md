# Sentiment Keywords Seeding Guide

## Tổng quan

Hệ thống sentiment keywords cho phép bạn quản lý từ khóa tích cực, tiêu cực và rất tiêu cực để phân tích sentiment AI. Hệ thống này hỗ trợ seeding (gieo hạt) dữ liệu từ khóa mặc định và quản lý từ khóa thông qua giao diện web.

## Seed Keywords Lại - Reset hoàn toàn

### Cách sử dụng qua Admin Panel

1. Đăng nhập với quyền `owner`
2. Vào trang: **Owner Dashboard → Sentiment Keywords**
3. Nhấn nút **"🔄 Seed Keywords Lại"** (màu cam)
4. Xác nhận trong dialog popup với cảnh báo
5. Hệ thống sẽ XÓA TẤT CẢ keywords cũ và seed lại ~242 keywords mới

**⚠️ CẢNH BÁO:** Tùy chọn này sẽ xóa hoàn toàn tất cả keywords hiện tại!

### Cách sử dụng qua API Call

```javascript
// Reseed all keywords (xóa tất cả rồi seed lại)
fetch('/api/admin/sentiment-keywords/bulk', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <your-token>'
  },
  body: JSON.stringify({
    action: 'reseed_all_keywords'
  })
})
```

### Cách sử dụng qua Script Command Line

```bash
# Xóa tất cả keywords cũ rồi seed lại
node scripts/seed-sentiment-keywords.js --clear

# Xem preview những gì sẽ được seed (không thực thi)
node scripts/seed-sentiment-keywords.js --dry-run
```

## Dữ liệu Keywords được Seed

**Tổng cộng: 242 keywords**

### Positive Keywords (88 từ)
- **Basic**: tốt, hay, đẹp, ổn, được, khá, bình thường
- **Strong**: tuyệt, xuất sắc, hoàn hảo, tuyệt vời, tuyệt đỉnh, ngoạn mục
- **Service**: chuyên nghiệp, thân thiện, nhanh chóng, chu đáo, nhiệt tình, tận tình
- **Quality**: chất lượng, cao cấp, sang trọng, đẳng cấp, tinh tế, bền đẹp
- **Facilities**: rộng rãi, thoáng mát, tiện nghi, hiện đại, đầy đủ, hoàn chỉnh  
- **Value**: đáng tiền, giá hợp lý, xứng đáng, có giá trị
- **Cleanliness**: sạch sẽ, sạch đẹp, gọn gẽ, ngăn nắp
- **Emotional**: yêu thích, ấn tượng, hài lòng, thỏa mãn, khuyên dùng

### Negative Keywords (86 từ) 
- **Basic**: tệ, dở, kém, xấu, tồi, chán, ghê
- **Service issues**: thất vọng, thô lỗ, không chuyên nghiệp, khó chịu, lạnh lùng
- **Quality issues**: rác, tệ hại, vô dụng, không chất lượng, hỏng, cũ kỹ
- **Cleanliness**: bẩn, bẩn thỉu, hôi, dơ, lộn xộn, mùi khó chịu
- **Pricing**: đắt, quá đắt, lãng phí, không đáng, giá cắt cổ
- **Safety**: không an toàn, nguy hiểm, không tin cậy, bất ổn
- **Time issues**: chậm, lâu, trễ, chờ đợi lâu, mất thời gian

### Strong Negative Keywords (68 từ)
- **Extreme quality**: rất tệ, quá tệ, kinh khủng, thảm họa, cực kỳ tệ, khủng khiếp
- **Fraud**: lừa đảo, lừa gát, cướp, ăn cắp, gian lận
- **Legal threats**: tố cáo, báo cảnh sát, kiện tụng, đưa ra tòa
- **Never again**: không bao giờ quay lại, tuyệt đối tránh, đừng bao giờ đến  
- **Extreme emotions**: phẫn nộ, điên tiết, ghê tởm, buồn nôn
- **Money loss**: mất tiền, tiền mất tật mang, ném tiền qua cửa sổ
- **Complete disasters**: thảm họa hoàn toàn, thất bại thảm hại, hỏng hoàn toàn

## Categories (Danh mục)

Keywords được phân loại theo 7 categories:

1. **Chất lượng** - Từ ngữ về chất lượng sản phẩm/dịch vụ
2. **Thái độ phục vụ** - Từ ngữ về thái độ nhân viên  
3. **Cơ sở vật chất** - Từ ngữ về trang thiết bị, cơ sở
4. **Giá cả** - Từ ngữ về giá cả, chi phí
5. **Vệ sinh** - Từ ngữ về độ sạch sẽ, vệ sinh
6. **An toàn** - Từ ngữ về tính an toàn
7. **Khác** - Các từ ngữ khác

## Weights (Trọng số)

- **0.6-0.9**: Weak sentiment (ít tác động)
- **1.0-1.3**: Normal sentiment (tác động bình thường)  
- **1.4-1.7**: Strong sentiment (tác động mạnh)
- **1.8-2.0**: Very strong sentiment (tác động rất mạnh)

## Lưu ý quan trọng

1. **Backup**: Luôn backup database trước khi reseed keywords
2. **Testing**: Dùng `--dry-run` để xem preview trước khi seed  
3. **Complete Reset**: "Seed Keywords Lại" sẽ xóa hoàn toàn tất cả keywords cũ
4. **Language**: Hiện tại chỉ hỗ trợ tiếng Việt ('vi')
5. **Permissions**: Chỉ user có role 'admin' hoặc 'owner' mới có quyền reseed

## Troubleshooting

### Reseed không hoạt động
- Kiểm tra database connection
- Verify user permissions (phải là admin/owner)
- Check browser console cho errors
- Kiểm tra log server

### Keywords không xuất hiện sau reseed
- Refresh trang sau khi reseed
- Verify `is_active = true` trong database
- Check if categories exist trong database

### Performance issues
- Sentiment keywords có cache 5 phút
- Có thể clear cache bằng cách restart server
- Hoặc gọi `clearKeywordCache()` trong code

## API Endpoint

- `POST /api/admin/sentiment-keywords/bulk` với action `reseed_all_keywords`

## Files liên quan

- `scripts/seed-sentiment-keywords.js` - Script seed chi tiết
- `app/api/admin/sentiment-keywords/bulk/route.ts` - API bulk operations
- `app/owner/sentiment-keywords/page.tsx` - Admin UI
- `lib/sentiment-keywords.ts` - Business logic và cache

## Tóm tắt tính năng

### ✅ Đã hoàn thành:

1. **🔄 Button "Seed Keywords Lại"** - Màu cam với icon `RotateCcw`
2. **⚠️ Dialog cảnh báo** - Hiển thị chi tiết và cảnh báo không thể hoàn tác
3. **🚀 API endpoint** - `POST /api/admin/sentiment-keywords/bulk` với action `reseed_all_keywords`
4. **🌱 Seeding logic** - Xóa tất cả keywords cũ và seed 242 keywords mới
5. **📊 Comprehensive data** - 88 positive + 86 negative + 68 strong negative keywords
6. **📁 Categories** - Phân loại theo 7 danh mục (Chất lượng, Thái độ phục vụ, etc.)
7. **📜 Script CLI** - `scripts/seed-sentiment-keywords.js` với `--dry-run` và `--clear` options
8. **📖 Documentation** - Hướng dẫn chi tiết và troubleshooting

### 🎯 Cách sử dụng:

**Option 1: Admin Panel (Khuyên dùng)**
```
Owner Dashboard → Sentiment Keywords → "🔄 Seed Keywords Lại" → Confirm
```

**Option 2: API Call**
```javascript
POST /api/admin/sentiment-keywords/bulk
{ "action": "reseed_all_keywords" }
```

**Option 3: Command Line**
```bash
node scripts/seed-sentiment-keywords.js --dry-run  # Preview
node scripts/seed-sentiment-keywords.js --clear    # Actually reseed
```

### 📈 Kết quả:
- **242 keywords** được seed với weights và categories phù hợp
- **7 categories** để phân loại từ khóa
- **Weights từ 0.6-2.0** tùy theo mức độ tác động sentiment
- **Hỗ trợ tiếng Việt** với các từ ngữ phổ biến trong reviews

**Hệ thống sentiment keywords giờ đây hoàn chỉnh và sẵn sàng sử dụng!** 🚀
