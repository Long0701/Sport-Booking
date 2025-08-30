import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await query(`
      SELECT 
        b.*,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        c.name as court_name,
        c.type as court_type,
        c.address as court_address,
        c.price_per_hour as court_price,
        c.owner_id as court_owner_id
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN courts c ON b.court_id = c.id
      WHERE b.id = $1
    `, [params.id])

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy booking' },
        { status: 404 }
      )
    }

    const booking = result[0]

    return NextResponse.json({
      success: true,
      data: {
        _id: booking.id,
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
          pricePerHour: booking.court_price,
          owner: booking.court_owner_id
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
      }
    })

  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Build dynamic update query
    const updateFields = []
    const values = []
    let paramIndex = 1

    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined) {
        const dbField = key === 'paymentStatus' ? 'payment_status' : 
                       key === 'paymentMethod' ? 'payment_method' : 
                       key === 'totalAmount' ? 'total_amount' : key
        updateFields.push(`${dbField} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không có dữ liệu để cập nhật' },
        { status: 400 }
      )
    }

    const updateQuery = `
      UPDATE bookings 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `
    values.push(params.id)

    const result = await query(updateQuery, values)

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy booking' },
        { status: 404 }
      )
    }

    // Get booking with related data
    const bookingWithDetailsResult = await query(`
      SELECT 
        b.*,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        c.name as court_name,
        c.type as court_type,
        c.address as court_address,
        c.price_per_hour as court_price
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN courts c ON b.court_id = c.id
      WHERE b.id = $1
    `, [params.id])

    const bookingWithDetails = bookingWithDetailsResult[0]

    return NextResponse.json({
      success: true,
      data: {
        _id: bookingWithDetails.id,
        user: {
          name: bookingWithDetails.user_name || bookingWithDetails.guest_name,
          email: bookingWithDetails.user_email || null,
          phone: bookingWithDetails.user_phone || bookingWithDetails.guest_phone
        },
        court: {
          name: bookingWithDetails.court_name,
          type: bookingWithDetails.court_type,
          address: bookingWithDetails.court_address,
          pricePerHour: bookingWithDetails.court_price
        },
        date: bookingWithDetails.booking_date,
        startTime: bookingWithDetails.start_time,
        endTime: bookingWithDetails.end_time,
        totalAmount: bookingWithDetails.total_amount,
        status: bookingWithDetails.status,
        paymentStatus: bookingWithDetails.payment_status,
        paymentMethod: bookingWithDetails.payment_method,
        notes: bookingWithDetails.notes,
        createdAt: bookingWithDetails.created_at,
        isGuest: bookingWithDetails.user_id === null
      }
    })

  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
