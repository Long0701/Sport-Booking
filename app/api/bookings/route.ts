import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const courtId = searchParams.get('courtId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let whereConditions = []
    let params: any[] = []
    let paramIndex = 1

    if (userId) {
      whereConditions.push(`b.user_id = $${paramIndex}`)
      params.push(userId)
      paramIndex++
    }

    if (courtId) {
      whereConditions.push(`b.court_id = $${paramIndex}`)
      params.push(courtId)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`b.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const bookingsQuery = `
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
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(limit, offset)

    const bookings = await query(bookingsQuery, params)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      ${whereClause}
    `
    const countParams = params.slice(0, -2)
    const countResult = await query(countQuery, countParams)
    const total = parseInt(countResult[0].total)

    return NextResponse.json({
      success: true,
      data: bookings.map((booking: any) => ({
        _id: booking.id,
        user: {
          name: booking.user_name,
          email: booking.user_email,
          phone: booking.user_phone
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
        createdAt: booking.created_at
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, courtId, date, startTime, endTime, notes } = body;

    // Validate required fields
    if (!userId || !courtId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: "Vui lòng điền đầy đủ thông tin" },
        { status: 400 }
      );
    }

    // Check if user exists
    const userResult = await query("SELECT id FROM users WHERE id = $1", [
      userId,
    ]);
    if (userResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy người dùng" },
        { status: 404 }
      );
    }

    // Check if court exists
    const courtResult = await query(
      "SELECT id, price_per_hour FROM courts WHERE id = $1 AND is_active = true",
      [courtId]
    );
    if (courtResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy sân" },
        { status: 404 }
      );
    }
    const court = courtResult[0];

    // ✅ Check overlapping bookings
    const existingBookingResult = await query(
      `
      SELECT id FROM bookings
      WHERE court_id = $1
        AND booking_date = $2
        AND status IN ('pending', 'confirmed')
        AND NOT (
          end_time <= $3 OR start_time >= $4
        )
      `,
      [courtId, date, startTime, endTime]
    );

    if (existingBookingResult.length > 0) {
      return NextResponse.json(
        { success: false, error: "Khung giờ này đã được đặt" },
        { status: 400 }
      );
    }

    // ✅ Calculate total amount
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    const hours = (end.getTime() - start.getTime()) / 3600000; // ms -> h
    if (hours <= 0) {
      return NextResponse.json(
        { success: false, error: "Giờ bắt đầu phải nhỏ hơn giờ kết thúc" },
        { status: 400 }
      );
    }
    const totalAmount = court.price_per_hour * hours;

    // Insert booking
    const bookingResult = await query(
      `
      INSERT INTO bookings
        (user_id, court_id, booking_date, start_time, end_time, total_amount, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [userId, courtId, date, startTime, endTime, totalAmount, notes]
    );
    const booking = bookingResult[0];

    // Get booking with related data
    const bookingWithDetailsResult = await query(
      `
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
      `,
      [booking.id]
    );
    const bookingWithDetails = bookingWithDetailsResult[0];

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: bookingWithDetails.id,
          user: {
            name: bookingWithDetails.user_name,
            email: bookingWithDetails.user_email,
            phone: bookingWithDetails.user_phone,
          },
          court: {
            id: bookingWithDetails.court_id,
            name: bookingWithDetails.court_name,
            type: bookingWithDetails.court_type,
            address: bookingWithDetails.court_address,
            pricePerHour: bookingWithDetails.court_price,
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
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi server" },
      { status: 500 }
    );
  }
}
