import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courtId = params.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Check if status column exists
    let hasStatusColumn = false;
    try {
      const columnCheck = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'reviews' AND column_name = 'status'
      `);
      hasStatusColumn = columnCheck.length > 0;
    } catch (error) {
      console.warn('Could not check status column:', error);
      hasStatusColumn = false;
    }

    // Fetch reviews for the specific court (visible only if status column exists)
    const reviewsQuery = `
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.name as user_name,
        u.avatar as user_avatar
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.court_id = $1${hasStatusColumn ? " AND r.status = 'visible'" : ''}
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `

    const reviews = await query(reviewsQuery, [courtId, limit, offset])

    // Get total count of reviews for this court
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews r
      WHERE r.court_id = $1${hasStatusColumn ? " AND r.status = 'visible'" : ''}
    `
    const countResult = await query(countQuery, [courtId])
    const total = parseInt(countResult[0].total)

    return NextResponse.json({
      success: true,
      data: reviews.map((review: any) => ({
        _id: review.id,
        user: {
          name: review.user_name,
          avatar: review.user_avatar
        },
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching court reviews:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
