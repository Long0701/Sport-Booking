import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token không hợp lệ' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'owner') {
      return NextResponse.json(
        { success: false, error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const ownerId = decoded.id

    // Check if sentiment columns exist
    let hasSentimentColumns = false;
    try {
      const columnCheck = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'reviews' 
        AND column_name IN ('sentiment_score', 'sentiment_label', 'status', 'ai_flagged')
      `);
      hasSentimentColumns = columnCheck.length >= 4;
    } catch (error) {
      console.warn('Could not check sentiment columns:', error);
      hasSentimentColumns = false;
    }

    // Get reviews for all courts owned by this user (include all statuses for owner view)
    let selectFields = `
      r.id,
      r.rating,
      r.comment,
      r.created_at,
      u.name as user_name,
      u.avatar as user_avatar,
      c.name as court_name,
      c.type as court_type
    `;

    if (hasSentimentColumns) {
      selectFields += `,
        r.sentiment_score,
        r.sentiment_label,
        r.status,
        r.ai_flagged,
        r.admin_reviewed
      `;
    }

    const reviewsQuery = `
      SELECT 
        ${selectFields}
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN courts c ON r.court_id = c.id
      WHERE c.owner_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `

    const reviews = await query(reviewsQuery, [ownerId, limit, offset])

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews r
      JOIN courts c ON r.court_id = c.id
      WHERE c.owner_id = $1
    `
    const countResult = await query(countQuery, [ownerId])
    const total = parseInt(countResult[0].total)

    // Format reviews data
    const formattedReviews = reviews.map((review: any) => {
      const baseReview = {
        _id: review.id,
        user: {
          name: review.user_name,
          avatar: review.user_avatar || '/diverse-user-avatars.png'
        },
        court: {
          name: review.court_name,
          type: review.court_type
        },
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at
      };

      // Add sentiment data only if columns exist
      if (hasSentimentColumns) {
        return {
          ...baseReview,
          sentimentScore: review.sentiment_score || 0,
          sentimentLabel: review.sentiment_label || 'neutral',
          status: review.status || 'visible',
          aiFlagged: review.ai_flagged || false,
          adminReviewed: review.admin_reviewed || false,
        };
      }

      return baseReview;
    })

    return NextResponse.json({
      success: true,
      data: formattedReviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching owner reviews:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
