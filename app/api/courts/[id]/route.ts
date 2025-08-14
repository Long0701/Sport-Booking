import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get court with owner info and calculated rating
    const courtResult = await query(`
      SELECT 
        c.*,
        u.name as owner_name,
        u.phone as owner_phone,
        COALESCE(AVG(r.rating), 0) as calculated_rating,
        COUNT(r.id) as actual_review_count
      FROM courts c
      LEFT JOIN users u ON c.owner_id = u.id
      LEFT JOIN reviews r ON c.id = r.court_id
      WHERE c.id = $1 AND c.is_active = true
      GROUP BY c.id, u.name, u.phone
    `, [params.id])

    if (courtResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy sân' },
        { status: 404 }
      )
    }

    const court = courtResult[0]

    // Get recent reviews
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

    // Get booked slots for today
    const today = new Date().toISOString().split('T')[0]
    const bookings = await query(`
      SELECT start_time
      FROM bookings
      WHERE court_id = $1 
        AND booking_date = $2
        AND status IN ('confirmed', 'pending')
    `, [params.id, today])

    const bookedSlots = bookings.map((booking: any) => booking.start_time)

    return NextResponse.json({
      success: true,
      data: {
        _id: court.id,
        name: court.name,
        type: court.type,
        address: court.address,
        pricePerHour: court.price_per_hour,
        rating: parseFloat(court.calculated_rating),
        reviewCount: parseInt(court.actual_review_count),
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
        reviews: reviews.map((review: any) => ({
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
      { success: false, error: 'Lỗi server' },
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
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
