import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'
import { analyzeSentiment } from '@/lib/sentiment-analysis'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courtId = searchParams.get('courtId')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let whereConditions = []
    let params: any[] = []
    let paramIndex = 1

    if (courtId) {
      whereConditions.push(`r.court_id = $${paramIndex}`)
      params.push(courtId)
      paramIndex++
    }

    if (userId) {
      whereConditions.push(`r.user_id = $${paramIndex}`)
      params.push(userId)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const reviewsQuery = `
      SELECT 
        r.*,
        u.name as user_name,
        u.avatar as user_avatar,
        c.name as court_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN courts c ON r.court_id = c.id
      ${whereConditions.length > 0 ? whereClause + ' AND' : 'WHERE'} r.status = 'visible'
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(limit, offset)

    const reviews = await query(reviewsQuery, params)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews r
      ${whereConditions.length > 0 ? whereClause + ' AND' : 'WHERE'} r.status = 'visible'
    `
    const countParams = params.slice(0, -2)
    const countResult = await query(countQuery, countParams)
    const total = parseInt(countResult[0].total)

    return NextResponse.json({
      success: true,
      data: reviews.map((review: any) => ({
        _id: review.id,
        user: {
          name: review.user_name,
          avatar: review.user_avatar
        },
        court: {
          name: review.court_name
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
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, courtId, bookingId, rating, comment } = body

    // Validate required fields
    if (!userId || !courtId || !bookingId || !rating || !comment) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      )
    }

    // Check if booking exists and is completed
    const bookingResult = await query(`
      SELECT id, status FROM bookings 
      WHERE id = $1 AND user_id = $2
    `, [bookingId, userId])
    
    if (bookingResult.length === 0 || bookingResult[0].status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Chỉ có thể đánh giá sau khi hoàn thành booking' },
        { status: 400 }
      )
    }

    // Check if review already exists
    const existingReviewResult = await query(`
      SELECT id FROM reviews WHERE booking_id = $1
    `, [bookingId])
    
    if (existingReviewResult.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Bạn đã đánh giá booking này rồi' },
        { status: 400 }
      )
    }

    // Analyze sentiment of the comment
    const sentimentResult = await analyzeSentiment(comment, true, 'vi');
    
    // Determine initial status based on AI analysis
    const initialStatus = sentimentResult.flagged ? 'pending_review' : 'visible';

    // Use transaction to create review and update court rating
    const result = await transaction(async (client) => {
      // Create review with sentiment analysis
      const reviewResult = await client.query(`
        INSERT INTO reviews (
          user_id, court_id, booking_id, rating, comment,
          sentiment_score, sentiment_label, status, ai_flagged
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        userId, courtId, bookingId, rating, comment,
        sentimentResult.score, sentimentResult.label, 
        initialStatus, sentimentResult.flagged
      ])

      const review = reviewResult.rows[0]

      // Get all visible reviews for this court (for rating calculation)
      const reviewsResult = await client.query(`
        SELECT rating FROM reviews WHERE court_id = $1 AND status = 'visible'
      `, [courtId])
      
      const reviews = reviewsResult.rows
      const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      
      // Update court rating
      await client.query(`
        UPDATE courts 
        SET rating = $1, 
            review_count = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [Math.round(avgRating * 100) / 100, reviews.length, courtId])

      return review
    })

    // Get review with user info
    const reviewWithUserResult = await query(`
      SELECT 
        r.*,
        u.name as user_name,
        u.avatar as user_avatar
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = $1
    `, [result.id])

    const reviewWithUser = reviewWithUserResult[0]

    return NextResponse.json({
      success: true,
      data: {
        _id: reviewWithUser.id,
        user: {
          name: reviewWithUser.user_name,
          avatar: reviewWithUser.user_avatar
        },
        rating: reviewWithUser.rating,
        comment: reviewWithUser.comment,
        createdAt: reviewWithUser.created_at
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
