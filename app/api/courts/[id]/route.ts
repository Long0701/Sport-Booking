import { query } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Lấy thông tin sân + chủ sân
    const courtResult = await query(`
      SELECT 
        c.*,
        u.name as owner_name,
        u.phone as owner_phone
      FROM courts c
      LEFT JOIN users u ON c.owner_id = u.id
      WHERE c.id = $1 AND c.is_active = true
    `, [params.id])

    if (courtResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy sân' },
        { status: 404 }
      )
    }

    const court = courtResult[0]

    // Lấy danh sách review gần đây
    const reviews = await query(`
      SELECT 
        r.*,
        u.name as user_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.court_id = $1
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [params.id])

    // Lấy booking từ hôm nay trở đi
    const bookings = await query(`
      SELECT booking_date, start_time
      FROM bookings
      WHERE court_id = $1
        AND booking_date >= CURRENT_DATE
        AND status IN ('confirmed', 'pending')
    `, [params.id])

    // Format bookedSlots an toàn: YYYY-MM-DDTHH:mm:ss
const bookedSlots = bookings.map(booking => {
  // Xử lý ngày
  let dateStr = ''
  if (booking.booking_date instanceof Date) {
    // Lấy ngày local, không dùng toISOString() để tránh lệch timezone
    dateStr = `${booking.booking_date.getFullYear()}-${String(booking.booking_date.getMonth() + 1).padStart(2, '0')}-${String(booking.booking_date.getDate()).padStart(2,'0')}`
  } else if (typeof booking.booking_date === 'string') {
    dateStr = booking.booking_date
  }

  // Xử lý giờ
  let timeStr = ''
  if (typeof booking.start_time === 'string') {
    // Nếu là HH:mm:ss hoặc HH:mm
    timeStr = booking.start_time.length === 5 ? `${booking.start_time}:00` : booking.start_time
  } else if (booking.start_time && typeof booking.start_time === 'object') {
    // Nếu Postgres trả object { hours, minutes, seconds }
    const h = booking.start_time.hours?.toString().padStart(2, '0') || '00'
    const m = booking.start_time.minutes?.toString().padStart(2, '0') || '00'
    const s = booking.start_time.seconds?.toString().padStart(2, '0') || '00'
    timeStr = `${h}:${m}:${s}`
  } else {
    timeStr = '00:00:00'
  }

  return `${dateStr}T${timeStr}`
})


    return NextResponse.json({
      success: true,
      data: {
        _id: court.id,
        name: court.name,
        type: court.type,
        address: court.address,
        pricePerHour: court.price_per_hour,
        rating: parseFloat(court.rating),
        reviewCount: court.review_count,
        images: court.images,
        description: court.description,
        amenities: court.amenities,
        phone: court.phone,
        openTime: court.open_time,
        closeTime: court.close_time,
        owner: {
          name: court.owner_name,
          phone: court.owner_phone
        },
        reviews: reviews.map(review => ({
          _id: review.id,
          user: { name: review.user_name },
          rating: review.rating,
          comment: review.comment,
          createdAt: review.created_at
        })),
        bookedSlots
      }
    })
  } catch (error) {
    console.error('Error fetching court:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server', details: (error as Error).message },
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

    const updateFields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined) {
        const dbField = key === 'pricePerHour' ? 'price_per_hour' :
                        key === 'openTime' ? 'open_time' :
                        key === 'closeTime' ? 'close_time' : key
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
      UPDATE courts 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `
    values.push(params.id)

    const result = await query(updateQuery, values)

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy sân' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result[0]
    })
  } catch (error) {
    console.error('Error updating court:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await query(`
      UPDATE courts 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [params.id])

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy sân' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa sân thành công'
    })
  } catch (error) {
    console.error('Error deleting court:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server', details: (error as Error).message },
      { status: 500 }
    )
  }
}
