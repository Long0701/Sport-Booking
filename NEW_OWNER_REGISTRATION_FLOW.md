# New Owner Registration Flow Documentation

## 🎯 Overview

Đã cập nhật hoàn toàn logic đăng ký làm chủ sân theo yêu cầu:
- ✅ User đăng ký làm chủ sân **không cần** tạo account trước
- ✅ Admin phải **duyệt** đơn đăng ký trước khi user có thể login
- ✅ Trong thời gian chờ duyệt, hiển thị thông báo và redirect về homepage
- ✅ Sau khi admin duyệt, user mới có thể login bằng email/password đã đăng ký
- ✅ Sau khi login thành công, logic chủ sân hoạt động như cũ

---

## 🔄 New Workflow

### 1. User Registration Flow
```
User fills form (/owner/register) 
    ↓
Submit registration data (email, password, business info)
    ↓
Save to owner_registrations table with status = 'pending'
    ↓
Show success message and redirect to homepage
    ↓
User can check status at /owner/registration-status
```

### 2. Admin Approval Flow
```
Admin views pending registrations (/admin/owner-registrations)
    ↓
Admin reviews and approves/rejects
    ↓
If APPROVED: Create user account with role = 'owner'
    ↓
If REJECTED: User can register again
```

### 3. Login Flow (After Approval)
```
User tries to login with registered email/password
    ↓
If approved: Login success, redirect to /owner/dashboard
    ↓
If not approved: Login fails
```

---

## 🗄️ Database Changes

### Updated `owner_registrations` table:
```sql
-- New columns for standalone registration
user_email VARCHAR(255)      -- Email for account creation
user_password VARCHAR(255)   -- Hashed password for account creation  
user_name VARCHAR(255)       -- Full name for account creation
user_phone VARCHAR(20)       -- Phone for account creation
created_user_id INTEGER      -- ID of created user account after approval

-- Made nullable for backward compatibility
user_id INTEGER NULL         -- Legacy: existing user reference
```

### Unique constraint:
```sql
-- Prevent duplicate emails for pending registrations
CREATE UNIQUE INDEX idx_owner_registrations_email_pending 
ON owner_registrations(user_email) 
WHERE status = 'pending';
```

---

## 🚀 New Features

### 1. Standalone Registration (`/owner/register`)
- **3-step form**: Personal Info → Business Info → Confirmation
- **No login required**: User provides email/password directly
- **Validation**: Email uniqueness, password strength, required fields
- **Success flow**: Save data → Show success message → Redirect to homepage

### 2. Registration Status Page (`/owner/registration-status`)
- **Email-based lookup**: Enter email to check status
- **Status tracking**: pending/approved/rejected with detailed info
- **Action buttons**: Login (if approved), Register again (if rejected)
- **Admin notes**: Display feedback from admin

### 3. Homepage Success Banner
- **Auto-display**: Shows after successful registration redirect
- **Rich info**: Business name, email, submission date
- **Quick actions**: Check status, close banner
- **Auto-cleanup**: Removes data from localStorage and URL

### 4. Enhanced Admin Features
- **Flexible data display**: Supports both new and legacy registrations
- **Account creation**: Creates user account when approving new registrations
- **Better UX**: Clear status indicators, detailed information display

---

## 🔧 API Endpoints

### New/Updated Endpoints:

#### `POST /api/owner/register`
- **Purpose**: Standalone owner registration (no auth required)
- **Input**: Personal info + business info + password
- **Output**: Registration confirmation with tracking info

#### `GET /api/owner/register?email=xxx`
- **Purpose**: Check registration status by email
- **Output**: Status, approval info, login capability

#### `PUT /api/admin/owner-registrations/[id]`
- **Updated**: Now creates user account when approving new registrations
- **Supports**: Both legacy (existing user) and new (create user) flows

---

## 🎨 UI Components

### Updated Components:

#### `/app/owner/register/page.tsx`
- **3-step wizard**: Personal → Business → Confirmation
- **Password field**: Secure input with show/hide toggle
- **Validation**: Real-time field validation
- **Success handling**: localStorage + redirect

#### `/app/owner/registration-status/page.tsx` (New)
- **Email lookup**: Search by registration email
- **Status display**: Visual status indicators
- **Contextual actions**: Login/re-register based on status
- **Detailed info**: Timeline, admin notes, next steps

#### `/app/page.tsx` (Homepage)
- **Success banner**: Shows registration confirmation
- **Rich notifications**: Business details, tracking links
- **Auto-cleanup**: Manages display state

#### Admin Pages
- **Enhanced data**: Shows correct user info for both flows
- **Better UX**: Consistent information display
- **Improved actions**: Account creation feedback

---

## 🧪 Testing

### Run Full Workflow Test:
```bash
node scripts/test-new-owner-registration-flow.js
```

### Test Coverage:
- ✅ Standalone registration (no login)
- ✅ Status checking by email
- ✅ Login blocked before approval
- ✅ Admin approval creates account
- ✅ Login works after approval
- ✅ Status updates correctly

### Manual Testing:
1. **Registration**: Go to `/owner/register`, fill form, submit
2. **Homepage**: Check success banner display
3. **Status check**: Visit `/owner/registration-status`
4. **Admin approval**: Login as admin, approve request
5. **Login**: Use registered email/password to login
6. **Owner dashboard**: Verify owner functionality works

---

## 🔐 Security Considerations

### Password Security:
- **Hashing**: bcrypt with salt rounds 12
- **Storage**: Hashed passwords only in database
- **Validation**: Minimum 6 characters, format validation

### Email Validation:
- **Format checking**: Regex validation
- **Uniqueness**: Prevents duplicate registrations
- **Case handling**: Lowercase normalization

### Admin Authorization:
- **JWT validation**: Admin token required for approvals
- **Role checking**: Only admin role can approve
- **Audit trail**: Track who approved what when

---

## 📊 Backward Compatibility

### Legacy Support:
- **Existing registrations**: Still work with old flow
- **Data migration**: No breaking changes to existing data
- **API compatibility**: Supports both new and legacy registration formats

### Migration Strategy:
- **Gradual rollout**: New registrations use new flow
- **Existing users**: Continue with current accounts
- **Admin interface**: Handles both types seamlessly

---

## 🎉 Summary

**New Owner Registration Flow is complete!**

### Key Benefits:
- ✅ **Simplified UX**: No need to create account first
- ✅ **Admin control**: Full approval workflow
- ✅ **Better tracking**: Status monitoring for users
- ✅ **Secure process**: Proper validation and security
- ✅ **Rich notifications**: Clear success/status messaging
- ✅ **Backward compatible**: No breaking changes

### Next Steps for Users:
1. **Register**: Visit `/owner/register` to submit application
2. **Wait**: Check status at `/owner/registration-status`  
3. **Login**: Use registered email/password after approval
4. **Manage courts**: Full owner functionality available

### Next Steps for Admins:
1. **Review**: Check `/admin/owner-registrations` for pending requests
2. **Approve/Reject**: Process applications with notes
3. **Monitor**: Track approval metrics on dashboard

The new flow provides a much better user experience while giving admins full control over who can become court owners in the system!
