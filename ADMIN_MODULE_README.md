# Admin Module Documentation

## Tổng quan

Module Admin cung cấp các tính năng quản trị toàn diện cho hệ thống Sport Booking, bao gồm:

- ✅ Quản lý người dùng (users, owners, admins)
- ✅ Duyệt đơn đăng ký chủ sân
- ✅ Dashboard thống kê tổng quan
- ✅ Tạo tài khoản chủ sân trực tiếp
- ✅ Middleware bảo mật admin
- ⏳ Quản lý sân thể thao
- ⏳ Quản lý booking
- ⏳ Báo cáo và analytics

## Cài đặt và Setup

### 1. Chạy script setup

```bash
# Cài đặt dependencies nếu chưa có
npm install bcryptjs

# Chạy script setup admin module
node scripts/setup-admin-module.js
```

Script sẽ:
- Tạo bảng `owner_registrations` 
- Thêm columns approval tracking vào bảng `users`
- Tạo admin user mặc định
- Cập nhật trạng thái approval cho owner hiện tại

### 2. Admin User mặc định

Sau khi chạy script, bạn sẽ có admin user:
- **Email**: `admin@sportbooking.com`
- **Password**: `admin123456` (hoặc giá trị từ env `ADMIN_PASSWORD`)

⚠️ **Quan trọng**: Thay đổi mật khẩu admin ngay sau lần đăng nhập đầu tiên!

### 3. Truy cập Admin Panel

Truy cập: `http://localhost:3000/admin/dashboard`

## Cấu trúc Files

### Backend (API Routes)
```
app/api/admin/
├── dashboard/route.ts          # Dashboard stats API
├── users/
│   ├── route.ts               # List/Create users
│   └── [id]/route.ts          # View/Update/Delete user
└── owner-registrations/
    ├── route.ts               # List registration requests
    └── [id]/route.ts          # Approve/Reject requests
```

### Frontend (UI)
```
app/admin/
├── layout.tsx                 # Admin layout with sidebar
├── dashboard/page.tsx         # Main dashboard
├── users/page.tsx            # User management
└── owner-registrations/page.tsx # Owner approvals
```

### Middleware & Utils
```
lib/
└── admin-auth.ts             # Admin authentication middleware
```

## Tính năng chính

### 1. Dashboard Admin (`/admin/dashboard`)

**Thống kê tổng quan:**
- Số lượng users, owners, sân, bookings
- Doanh thu 30 ngày gần nhất
- Đơn đăng ký chủ sân chờ duyệt
- Hoạt động gần đây
- Top 5 sân hot nhất

**API Endpoint:**
- `GET /api/admin/dashboard` - Lấy stats dashboard

### 2. Quản lý người dùng (`/admin/users`)

**Tính năng:**
- Danh sách tất cả users với phân trang
- Tìm kiếm theo tên, email
- Lọc theo vai trò (user/owner/admin) và trạng thái duyệt
- Tạo tài khoản user/owner mới
- Xem chi tiết thông tin user
- Xóa user (không thể xóa admin hoặc owner có booking active)

**API Endpoints:**
- `GET /api/admin/users` - Danh sách users
- `POST /api/admin/users` - Tạo user mới
- `GET /api/admin/users/[id]` - Chi tiết user
- `PUT /api/admin/users/[id]` - Cập nhật user
- `DELETE /api/admin/users/[id]` - Xóa user

### 3. Duyệt đơn đăng ký chủ sân (`/admin/owner-registrations`)

**Workflow đăng ký owner:**
1. User đăng ký tại `/owner/register`
2. Đơn được lưu với status `pending`
3. Admin xem xét và duyệt/từ chối
4. Nếu duyệt: User được nâng cấp thành owner
5. Nếu từ chối: User có thể đăng ký lại

**Tính năng:**
- Danh sách đơn đăng ký với stats tổng quan
- Tìm kiếm và lọc theo trạng thái
- Xem chi tiết đầy đủ đơn đăng ký
- Duyệt/từ chối với ghi chú
- Xóa đơn đã xử lý (cleanup)

**API Endpoints:**
- `GET /api/admin/owner-registrations` - Danh sách đơn
- `GET /api/admin/owner-registrations/[id]` - Chi tiết đơn
- `PUT /api/admin/owner-registrations/[id]` - Duyệt/từ chối
- `DELETE /api/admin/owner-registrations/[id]` - Xóa đơn

## Database Schema

### Bảng `owner_registrations`
```sql
CREATE TABLE owner_registrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    business_name VARCHAR(255) NOT NULL,
    business_address TEXT NOT NULL,
    business_phone VARCHAR(20) NOT NULL,
    business_email VARCHAR(255),
    description TEXT,
    experience TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending/approved/rejected
    admin_notes TEXT,
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Cập nhật bảng `users`
```sql
-- Thêm columns tracking approval
ALTER TABLE users ADD COLUMN approval_status VARCHAR(20) DEFAULT 'none';
ALTER TABLE users ADD COLUMN approved_at TIMESTAMP;
ALTER TABLE users ADD COLUMN approved_by INTEGER REFERENCES users(id);
```

## Authentication & Security

### Admin Middleware
File: `lib/admin-auth.ts`

**Functions:**
- `verifyAdminToken(request)` - Verify JWT và check admin role
- `requireAdmin(request)` - Middleware bắt buộc admin (throw error nếu không phải)
- `isUserAdmin(userId)` - Check user có phải admin không
- `getAdminInfo(adminId)` - Lấy thông tin admin

**Cách sử dụng:**
```typescript
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request) // Throws error if not admin
    // Admin logic here...
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

## UI Components

### Admin Layout
- Responsive sidebar navigation
- User info với logout
- Mobile-friendly với collapsible sidebar
- Role-based route protection

### Dashboard Cards
- Stats cards với icons
- Recent activities timeline  
- Top courts performance
- Quick action buttons

### Data Tables
- Pagination
- Search & filters
- Sort capabilities
- Responsive design

## Environment Variables

```env
# Admin setup
ADMIN_PASSWORD=your_secure_admin_password

# Database (existing)
DATABASE_URL=postgresql://user:pass@localhost:5432/sportbooking

# JWT (existing)
JWT_SECRET=your_jwt_secret
```

## Quy trình Development

### Thêm tính năng admin mới:

1. **Backend**: Tạo API route trong `/app/api/admin/`
2. **Middleware**: Sử dụng `requireAdmin()` để bảo mật
3. **Frontend**: Tạo page trong `/app/admin/`
4. **Navigation**: Cập nhật `navigationItems` trong `admin/layout.tsx`

### Testing Admin Features:

1. Tạo admin user qua script setup
2. Login với admin credentials  
3. Test các tính năng qua UI
4. Verify API responses với proper error handling

## Troubleshooting

### Admin không thể login
- Check user role là 'admin' trong database
- Verify JWT_SECRET environment variable
- Check browser localStorage có token không

### Database migration errors  
- Ensure database connection works
- Run setup script với proper privileges
- Check existing table structure conflicts

### Permission errors
- Verify admin middleware hoạt động
- Check API routes có sử dụng `requireAdmin()`
- Confirm frontend gửi đúng Authorization header

## Roadmap

### Phase 2 - Coming Soon:
- [ ] Courts management (activate/deactivate courts)
- [ ] Booking management (view all bookings, handle disputes)
- [ ] Advanced analytics dashboard
- [ ] Admin activity logs
- [ ] Bulk operations (bulk approve/reject)
- [ ] Email notifications for approvals
- [ ] Admin role permissions (super admin vs regular admin)
- [ ] System settings management

## Support

Nếu gặp vấn đề với admin module, kiểm tra:
1. Database schema đã được setup chưa
2. Environment variables đúng chưa  
3. Admin user đã được tạo chưa
4. JWT tokens hợp lệ chưa

Chạy lại setup script nếu cần:
```bash
node scripts/setup-admin-module.js
```
