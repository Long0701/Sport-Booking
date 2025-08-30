import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token không hợp lệ' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== 'owner') {
      return NextResponse.json(
        { success: false, error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const courtId = searchParams.get('courtId')
    const date = searchParams.get('date')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let whereConditions = ['c.owner_id = $1']
    let params: any[] = [decoded.id]
    let paramIndex = 2

    // Filter by status
    if (status && status !== 'all') {
      whereConditions.push(`b.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    // Filter by court
    if (courtId && courtId !== 'all') {
      whereConditions.push(`b.court_id = $${paramIndex}`)
      params.push(courtId)
      paramIndex++
    }

    // Filter by date
    if (date) {
      whereConditions.push(`b.booking_date = $${paramIndex}`)
      params.push(date)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    // Get bookings for courts owned by this user
    const bookingsQuery = `
      SELECT 
        b.*,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        c.id as court_id,
        c.name as court_name,
        c.type as court_type,
        c.address as court_address,
        c.price_per_hour as court_price
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN courts c ON b.court_id = c.id
      WHERE ${whereClause}
      ORDER BY b.booking_date DESC, b.start_time DESC, b.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(limit, offset)

    const bookings = await query(bookingsQuery, params)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      LEFT JOIN courts c ON b.court_id = c.id
      WHERE ${whereClause}
    `
    const countParams = params.slice(0, -2) // Remove limit and offset
    const countResult = await query(countQuery, countParams)
    const total = parseInt(countResult[0].total)

    return NextResponse.json({
      success: true,
      data: bookings.map((booking: any) => ({
        id: booking.id,
        user: {
          name: booking.user_name || booking.guest_name,
          email: booking.user_email || null,
          phone: booking.user_phone || booking.guest_phone
        },
        court: {
          id: booking.court_id,
          name: booking.court_name,
          type: booking.court_type,
          address: booking.court_address,
          pricePerHour: booking.court_price
        },
        date: booking.booking_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        totalAmount: booking.total_amount,
        status: booking.status,
        paymentStatus: booking.payment_status,
        paymentMethod: booking.payment_method,
        notes: booking.notes,
        createdAt: booking.created_at,
        isGuest: booking.user_id === null
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching owner bookings:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
