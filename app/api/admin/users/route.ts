import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { hashPassword } from '@/lib/auth'

// GET - Get all users with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20') 
    const role = searchParams.get('role') || ''
    const search = searchParams.get('search') || ''
    const approval_status = searchParams.get('approval_status') || ''
    
    const offset = (page - 1) * limit
    
    // Build query conditions
    let whereConditions = []
    let queryParams: any[] = []
    let paramIndex = 1
    
    if (role && role !== 'all') {
      whereConditions.push(`u.role = $${paramIndex}`)
      queryParams.push(role)
      paramIndex++
    }
    
    if (search) {
      whereConditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (approval_status && approval_status !== 'all') {
      whereConditions.push(`u.approval_status = $${paramIndex}`)
      queryParams.push(approval_status)
      paramIndex++
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : ''
    
    // Get total count  
    const countQuery = `SELECT COUNT(*) as total FROM users u ${whereClause}`
    const countResult = await query(countQuery, queryParams)
    const totalUsers = parseInt(countResult[0].total)
    
    // Get users with pagination (simplified query)
    const usersQuery = `
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
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    queryParams.push(limit, offset)
    const users = await query(usersQuery, queryParams)
    
    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total: totalUsers,
          totalPages: Math.ceil(totalUsers / limit)
        }
      }
    })
    
  } catch (error: any) {
    console.error('Admin get users error:', error)
    
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

// POST - Create new user (especially for creating owner accounts)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    
    const body = await request.json()
    const { name, email, password, phone, role = 'user' } = body
    
    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email không hợp lệ' },
        { status: 400 }
      )
    }
    
    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      )
    }
    
    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Email đã được sử dụng' },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password)
    
    // Create user with admin approval if role is owner
    const approval_status = role === 'owner' ? 'approved' : 'none'
    const approved_by = role === 'owner' ? admin.id : null
    const approved_at = role === 'owner' ? new Date() : null
    
    const result = await query(`
      INSERT INTO users (name, email, password, phone, role, approval_status, approved_by, approved_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, email, phone, role, approval_status, created_at
    `, [name, email, hashedPassword, phone, role, approval_status, approved_by, approved_at])
    
    const newUser = result[0]
    
    return NextResponse.json({
      success: true,
      message: `Tài khoản ${role === 'owner' ? 'chủ sân' : 'người dùng'} đã được tạo thành công`,
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          approval_status: newUser.approval_status,
          created_at: newUser.created_at
        }
      }
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Admin create user error:', error)
    
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
