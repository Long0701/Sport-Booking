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

    // Get courts owned by this user
    const courts = await query(`
      SELECT 
        c.*,
        COUNT(b.id) as booking_count,
        AVG(r.rating) as avg_rating,
        COUNT(r.id) as review_count
      FROM courts c
      LEFT JOIN bookings b ON c.id = b.court_id AND b.created_at >= CURRENT_DATE - INTERVAL '30 days'
      LEFT JOIN reviews r ON c.id = r.court_id
      WHERE c.owner_id = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `, [decoded.id])

    return NextResponse.json({
      success: true,
      data: courts.map(court => ({
        id: court.id,
        name: court.name,
        type: court.type,
        address: court.address,
        price_per_hour: court.price_per_hour,
        rating: Math.round((parseFloat(court.avg_rating) || 0) * 100) / 100,
        review_count: parseInt(court.review_count) || 0,
        images: court.images,
        is_active: court.is_active,
        open_time: court.open_time,
        close_time: court.close_time,
        created_at: court.created_at,
        booking_count: parseInt(court.booking_count) || 0
      }))
    })

  } catch (error) {
    console.error('Error fetching owner courts:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
