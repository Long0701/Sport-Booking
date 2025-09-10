import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

// POST - Đăng ký làm chủ sân (không cần login trước)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      // Thông tin cá nhân
      name,
      email,
      password,
      phone,
      // Thông tin doanh nghiệp
      businessName,
      businessAddress,
      businessPhone,
      businessEmail,
      description,
      experience
    } = body

    // Validate required fields
    if (!name || !email || !password || !businessName || !businessAddress || !businessPhone) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng điền đầy đủ thông tin bắt buộc' },
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
        { success: false, error: 'Email này đã được sử dụng' },
        { status: 400 }
      )
    }

    // Check if email already has a pending/approved registration
    const existingRegistration = await query(`
      SELECT * FROM owner_registrations 
      WHERE user_email = $1 AND status IN ('pending', 'approved')
    `, [email])

    if (existingRegistration.length > 0) {
      const status = existingRegistration[0].status
      const message = status === 'pending' 
        ? 'Bạn đã có đơn đăng ký đang chờ xử lý với email này' 
        : 'Email này đã được duyệt làm chủ sân'
        
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create owner registration request
    const result = await query(`
      INSERT INTO owner_registrations (
        user_name,
        user_email,
        user_password,
        user_phone,
        business_name,
        business_address,
        business_phone,
        business_email,
        description,
        experience,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
      RETURNING id, business_name, status, created_at
    `, [
      name,
      email,
      hashedPassword,
      phone,
      businessName,
      businessAddress,
      businessPhone,
      businessEmail,
      description,
      experience
    ])

    const registration = result[0]

    return NextResponse.json({
      success: true,
      message: 'Đơn đăng ký làm chủ sân đã được gửi thành công! Chúng tôi sẽ xem xét và liên hệ với bạn trong vòng 24-48 giờ. Bạn sẽ nhận được email thông báo khi đơn được duyệt và có thể đăng nhập vào hệ thống.',
      data: {
        registration: {
          id: registration.id,
          businessName: registration.business_name,
          status: registration.status,
          submittedAt: registration.created_at,
          email: email
        }
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Owner registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

// GET - Check registration status by email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email không được để trống' },
        { status: 400 }
      )
    }

    // Get registration status
    const registrationResult = await query(`
      SELECT 
        or.id,
        or.business_name,
        or.status,
        or.created_at,
        or.reviewed_at,
        or.admin_notes,
        reviewer.name as reviewed_by_name,
        or.created_user_id
      FROM owner_registrations or
      LEFT JOIN users reviewer ON or.reviewed_by = reviewer.id
      WHERE or.user_email = $1
      ORDER BY or.created_at DESC
      LIMIT 1
    `, [email])

    if (registrationResult.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          hasRegistration: false,
          registration: null
        }
      })
    }

    const registration = registrationResult[0]

    return NextResponse.json({
      success: true,
      data: {
        hasRegistration: true,
        registration: {
          id: registration.id,
          businessName: registration.business_name,
          status: registration.status,
          submittedAt: registration.created_at,
          reviewedAt: registration.reviewed_at,
          adminNotes: registration.admin_notes,
          reviewedBy: registration.reviewed_by_name,
          canLogin: registration.status === 'approved' && registration.created_user_id
        }
      }
    })

  } catch (error: any) {
    console.error('Get owner registration status error:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}