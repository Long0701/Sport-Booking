import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { hashPassword } from '@/lib/auth'

interface RouteParams {
  params: { id: string }
}

// GET - Get specific user details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(request)
    const userId = parseInt(params.id)
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'ID người dùng không hợp lệ' },
        { status: 400 }
      )
    }
    
    // Get user details with related data
    const userResult = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.avatar,
        u.approval_status,
        u.approved_at,
        u.created_at,
        u.updated_at,
        approver.name as approved_by_name
      FROM users u
      LEFT JOIN users approver ON u.approved_by = approver.id
      WHERE u.id = $1
    `, [userId])
    
    if (userResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }
    
    const user = userResult[0]
    
    // Get additional data based on user role
    let additionalData: any = {}
    
    if (user.role === 'owner') {
      // Get courts owned by this user
      const courts = await query(`
        SELECT id, name, type, address, rating, review_count, is_active, created_at
        FROM courts
        WHERE owner_id = $1
        ORDER BY created_at DESC
      `, [userId])
      
      // Get registration request if exists
      const registration = await query(`
        SELECT * FROM owner_registrations
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [userId])
      
      additionalData = {
        courts,
        registration: registration[0] || null
      }
    } else if (user.role === 'user') {
      // Get bookings made by this user
      const bookings = await query(`
        SELECT 
          b.id,
          b.booking_date,
          b.start_time,
          b.end_time,
          b.total_amount,
          b.status,
          b.payment_status,
          b.created_at,
          c.name as court_name,
          c.type as court_type
        FROM bookings b
        JOIN courts c ON b.court_id = c.id
        WHERE b.user_id = $1
        ORDER BY b.created_at DESC
        LIMIT 10
      `, [userId])
      
      // Get reviews written by this user
      const reviews = await query(`
        SELECT 
          r.id,
          r.rating,
          r.comment,
          r.created_at,
          c.name as court_name
        FROM reviews r
        JOIN courts c ON r.court_id = c.id
        WHERE r.user_id = $1
        ORDER BY r.created_at DESC
        LIMIT 10
      `, [userId])
      
      additionalData = {
        bookings,
        reviews
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        user,
        ...additionalData
      }
    })
    
  } catch (error: any) {
    console.error('Admin get user error:', error)
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

// PUT - Update user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(request)
    const userId = parseInt(params.id)
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'ID người dùng không hợp lệ' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { name, email, phone, role, approval_status, password } = body
    
    // Check if user exists
    const existingUser = await query('SELECT * FROM users WHERE id = $1', [userId])
    if (existingUser.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }
    
    // Prevent admin from changing their own role
    if (userId === admin.id && role && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Không thể thay đổi vai trò của chính mình' },
        { status: 400 }
      )
    }
    
    // Check if email is already taken by another user
    if (email && email !== existingUser[0].email) {
      const emailExists = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId])
      if (emailExists.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Email đã được sử dụng' },
          { status: 400 }
        )
      }
    }
    
    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1
    
    if (name) {
      updates.push(`name = $${paramIndex}`)
      values.push(name)
      paramIndex++
    }
    
    if (email) {
      updates.push(`email = $${paramIndex}`)
      values.push(email)
      paramIndex++
    }
    
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex}`)
      values.push(phone)
      paramIndex++
    }
    
    if (role) {
      updates.push(`role = $${paramIndex}`)
      values.push(role)
      paramIndex++
    }
    
    if (approval_status !== undefined) {
      updates.push(`approval_status = $${paramIndex}`)
      values.push(approval_status)
      paramIndex++
      
      if (approval_status === 'approved' && existingUser[0].approval_status !== 'approved') {
        updates.push(`approved_by = $${paramIndex}`)
        values.push(admin.id)
        paramIndex++
        
        updates.push(`approved_at = CURRENT_TIMESTAMP`)
      }
    }
    
    if (password) {
      const hashedPassword = await hashPassword(password)
      updates.push(`password = $${paramIndex}`)
      values.push(hashedPassword)
      paramIndex++
    }
    
    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không có thông tin để cập nhật' },
        { status: 400 }
      )
    }
    
    // Add user ID for WHERE clause
    values.push(userId)
    
    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING id, name, email, phone, role, approval_status, approved_at, updated_at
    `
    
    const result = await query(updateQuery, values)
    const updatedUser = result[0]
    
    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin người dùng thành công',
      data: { user: updatedUser }
    })
    
  } catch (error: any) {
    console.error('Admin update user error:', error)
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(request)
    const userId = parseInt(params.id)
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'ID người dùng không hợp lệ' },
        { status: 400 }
      )
    }
    
    // Prevent admin from deleting themselves
    if (userId === admin.id) {
      return NextResponse.json(
        { success: false, error: 'Không thể xóa tài khoản của chính mình' },
        { status: 400 }
      )
    }
    
    // Check if user exists
    const user = await query('SELECT * FROM users WHERE id = $1', [userId])
    if (user.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }
    
    // Check if user has any dependencies that might prevent deletion
    const activeBookings = await query('SELECT COUNT(*) as count FROM bookings WHERE user_id = $1 AND status IN ($2, $3)', 
      [userId, 'confirmed', 'pending'])
    
    if (parseInt(activeBookings[0].count) > 0) {
      return NextResponse.json(
        { success: false, error: 'Không thể xóa người dùng có booking đang hoạt động' },
        { status: 400 }
      )
    }
    
    // Delete user (CASCADE will handle related records)
    await query('DELETE FROM users WHERE id = $1', [userId])
    
    return NextResponse.json({
      success: true,
      message: `Đã xóa ${user[0].role === 'owner' ? 'chủ sân' : 'người dùng'} thành công`
    })
    
  } catch (error: any) {
    console.error('Admin delete user error:', error)
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
