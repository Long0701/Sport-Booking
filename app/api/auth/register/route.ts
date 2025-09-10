import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
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

    // Check if email already exists in users table
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Email đã được sử dụng' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // OWNER REGISTRATION - Special flow requiring admin approval
    if (role === 'owner') {
      // Check if email already has a pending/approved registration
      const existingRegistration = await query(`
        SELECT * FROM owner_registrations 
        WHERE user_email = $1 AND status IN ('pending', 'approved')
      `, [email])

      if (existingRegistration.length > 0) {
        const status = existingRegistration[0].status
        const message = status === 'pending' 
          ? 'Bạn đã có đơn đăng ký chủ sân đang chờ xử lý với email này' 
          : 'Email này đã được duyệt làm chủ sân'
          
        return NextResponse.json(
          { success: false, error: message },
          { status: 400 }
        )
      }

      // Create owner registration request (not user account)
      const result = await query(`
        INSERT INTO owner_registrations (
          user_name,
          user_email,
          user_password,
          user_phone,
          business_name,
          business_address,
          business_phone,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        RETURNING id, created_at
      `, [
        name,
        email,
        hashedPassword,
        phone,
        `${name} Business`, // Default business name
        'Chưa cung cấp địa chỉ', // Default address  
        phone, // Use same phone for business
      ])

      const registration = result[0]

      return NextResponse.json({
        success: true,
        message: 'Đơn đăng ký làm chủ sân đã được gửi thành công! Chúng tôi sẽ xem xét và liên hệ với bạn trong vòng 24-48 giờ. Bạn sẽ nhận được email thông báo khi đơn được duyệt và có thể đăng nhập vào hệ thống.',
        isOwnerRegistration: true,
        data: {
          registration: {
            id: registration.id,
            email: email,
            status: 'pending',
            submittedAt: registration.created_at
          }
        }
      }, { status: 201 })
    }

    // REGULAR USER REGISTRATION - Normal flow
    const result = await query(`
      INSERT INTO users (name, email, password, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, phone, role, avatar, created_at
    `, [name, email, hashedPassword, phone, role])

    const user = result[0]

    // Generate JWT token
    const token = generateToken(user)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar
      },
      token
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
