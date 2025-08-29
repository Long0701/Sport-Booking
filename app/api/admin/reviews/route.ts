import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'
import { analyzeSentiment } from '@/lib/sentiment-analysis'
import { updateCourtRating } from '@/lib/court-rating'

// GET - Admin view all reviews with filtering
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
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'owner')) {
      return NextResponse.json(
        { success: false, error: 'Chỉ admin hoặc owner mới có quyền truy cập' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all' // all, visible, hidden, pending_review
    const sentiment = searchParams.get('sentiment') || 'all' // all, positive, negative, neutral
    const flagged = searchParams.get('flagged') || 'all' // all, true, false
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

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

    let whereConditions = []
    let params: any[] = []
    let paramIndex = 1

    // Add owner filter if user is owner (not admin)
    if (decoded.role === 'owner') {
      whereConditions.push(`c.owner_id = $${paramIndex}`)
      params.push(decoded.id)
      paramIndex++
    }

    // Only add sentiment-related filters if columns exist
    if (hasSentimentColumns) {
      if (status !== 'all') {
        whereConditions.push(`r.status = $${paramIndex}`)
        params.push(status)
        paramIndex++
      }

      if (sentiment !== 'all') {
        whereConditions.push(`r.sentiment_label = $${paramIndex}`)
        params.push(sentiment)
        paramIndex++
      }

      if (flagged !== 'all') {
        whereConditions.push(`r.ai_flagged = $${paramIndex}`)
        params.push(flagged === 'true')
        paramIndex++
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const reviewsQuery = `
      SELECT 
        r.*,
        u.name as user_name,
        u.avatar as user_avatar,
        c.name as court_name,
        c.type as court_type,
        admin_user.name as hidden_by_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN courts c ON r.court_id = c.id
      LEFT JOIN users admin_user ON r.hidden_by = admin_user.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(limit, offset)
    const reviews = await query(reviewsQuery, params)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews r
      LEFT JOIN courts c ON r.court_id = c.id
      ${whereClause}
    `
    const countParams = params.slice(0, -2)
    const countResult = await query(countQuery, countParams)
    const total = parseInt(countResult[0].total)

    // Get statistics (also filter by owner if needed)
    let statsQuery = `SELECT COUNT(*) as total_reviews FROM reviews r`
    let statsParams: any[] = []
    
    if (decoded.role === 'owner') {
      statsQuery += ` JOIN courts c ON r.court_id = c.id WHERE c.owner_id = $1`
      statsParams.push(decoded.id)
    }
    
    let stats: any = { total_reviews: 0 };
    
    if (hasSentimentColumns) {
      // Full stats with sentiment data
      statsQuery = `
        SELECT 
          COUNT(*) as total_reviews,
          COUNT(CASE WHEN r.status = 'visible' THEN 1 END) as visible_reviews,
          COUNT(CASE WHEN r.status = 'hidden' THEN 1 END) as hidden_reviews,
          COUNT(CASE WHEN r.status = 'pending_review' THEN 1 END) as pending_reviews,
          COUNT(CASE WHEN r.ai_flagged = true THEN 1 END) as ai_flagged_reviews,
          COUNT(CASE WHEN r.sentiment_label = 'negative' THEN 1 END) as negative_reviews,
          COUNT(CASE WHEN r.admin_reviewed = false AND r.ai_flagged = true THEN 1 END) as needs_review
        FROM reviews r
      `;
      
      if (decoded.role === 'owner') {
        statsQuery += ` JOIN courts c ON r.court_id = c.id WHERE c.owner_id = $1`
        statsParams = [decoded.id]
      }
      
      const statsResult = await query(statsQuery, statsParams)
      stats = statsResult[0]
    } else {
      // Basic stats without sentiment
      const statsResult = await query(statsQuery, statsParams)
      stats = {
        total_reviews: parseInt(statsResult[0].total_reviews),
        visible_reviews: parseInt(statsResult[0].total_reviews), // All reviews are considered visible
        hidden_reviews: 0,
        pending_reviews: 0,
        ai_flagged_reviews: 0,
        negative_reviews: 0,
        needs_review: 0
      }
    }

    return NextResponse.json({
      success: true,
      data: reviews.map((review: any) => {
        const baseReview = {
          _id: review.id,
          user: {
            name: review.user_name,
            avatar: review.user_avatar
          },
          court: {
            name: review.court_name,
            type: review.court_type
          },
          rating: review.rating,
          comment: review.comment,
          createdAt: review.created_at,
          updatedAt: review.updated_at
        };

        // Add sentiment data only if columns exist
        if (hasSentimentColumns) {
          return {
            ...baseReview,
            sentimentScore: review.sentiment_score,
            sentimentLabel: review.sentiment_label,
            status: review.status,
            aiFlagged: review.ai_flagged,
            adminReviewed: review.admin_reviewed,
            adminNotes: review.admin_notes,
            hiddenBy: review.hidden_by_name,
            hiddenAt: review.hidden_at,
          };
        }

        return baseReview;
      }),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalReviews: parseInt(stats.total_reviews || 0),
        visibleReviews: parseInt(stats.visible_reviews || 0),
        hiddenReviews: parseInt(stats.hidden_reviews || 0),
        pendingReviews: parseInt(stats.pending_reviews || 0),
        aiFlaggedReviews: parseInt(stats.ai_flagged_reviews || 0),
        negativeReviews: parseInt(stats.negative_reviews || 0),
        needsReview: parseInt(stats.needs_review || 0)
      }
    })

  } catch (error) {
    console.error('Error fetching admin reviews:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

// PATCH - Admin update review status
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token không hợp lệ' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'owner')) {
      return NextResponse.json(
        { success: false, error: 'Chỉ admin hoặc owner mới có quyền truy cập' },
        { status: 403 }
      )
    }

    const { reviewId, status, adminNotes } = await request.json()

    if (!reviewId || !status) {
      return NextResponse.json(
        { success: false, error: 'Review ID và status là bắt buộc' },
        { status: 400 }
      )
    }

    if (!['visible', 'hidden', 'pending_review'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status không hợp lệ' },
        { status: 400 }
      )
    }

    // Check if owner has permission to update this review
    if (decoded.role === 'owner') {
      const reviewCheck = await query(`
        SELECT r.id FROM reviews r
        JOIN courts c ON r.court_id = c.id
        WHERE r.id = $1 AND c.owner_id = $2
      `, [reviewId, decoded.id])
      
      if (reviewCheck.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Bạn không có quyền cập nhật review này' },
          { status: 403 }
        )
      }
    }

    const updateValues = [
      status,
      true, // admin_reviewed
      adminNotes || null,
      decoded.id, // hidden_by (admin user id)
      status === 'hidden' ? new Date() : null, // hidden_at
      reviewId
    ]

    await query(`
      UPDATE reviews 
      SET 
        status = $1,
        admin_reviewed = $2,
        admin_notes = $3,
        hidden_by = $4,
        hidden_at = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `, updateValues)

    // If review is being made visible or hidden, recalculate court rating
    const reviewResult = await query('SELECT court_id FROM reviews WHERE id = $1', [reviewId])
    if (reviewResult.length > 0) {
      const courtId = reviewResult[0].court_id
      
      // Use centralized court rating calculation
      await updateCourtRating(courtId, true); // Always use onlyVisible=true for admin updates
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật review thành công'
    })

  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

// POST - Bulk actions or re-analyze sentiment
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token không hợp lệ' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'owner')) {
      return NextResponse.json(
        { success: false, error: 'Chỉ admin hoặc owner mới có quyền truy cập' },
        { status: 403 }
      )
    }

    const { action, reviewIds, reviewId } = await request.json()

    if (action === 'reanalyze_sentiment') {
      // Re-analyze sentiment for a specific review
      if (!reviewId) {
        return NextResponse.json(
          { success: false, error: 'Review ID là bắt buộc' },
          { status: 400 }
        )
      }

      // Check if owner has permission to reanalyze this review
      let reviewQuery = 'SELECT r.comment FROM reviews r'
      let reviewParams = [reviewId]
      
      if (decoded.role === 'owner') {
        reviewQuery += ' JOIN courts c ON r.court_id = c.id WHERE r.id = $1 AND c.owner_id = $2'
        reviewParams.push(decoded.id)
      } else {
        reviewQuery += ' WHERE r.id = $1'
      }
      
      const reviewResult = await query(reviewQuery, reviewParams)
      if (reviewResult.length === 0) {
        return NextResponse.json(
          { success: false, error: decoded.role === 'owner' ? 'Bạn không có quyền phân tích review này' : 'Không tìm thấy review' },
          { status: 404 }
        )
      }

      const comment = reviewResult[0].comment
      const sentimentResult = await analyzeSentiment(comment, true, 'vi')

      await query(`
        UPDATE reviews 
        SET 
          sentiment_score = $1,
          sentiment_label = $2,
          ai_flagged = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [sentimentResult.score, sentimentResult.label, sentimentResult.flagged, reviewId])

      return NextResponse.json({
        success: true,
        message: 'Phân tích sentiment thành công',
        data: sentimentResult
      })

    } else if (action === 'bulk_update') {
      // Bulk update multiple reviews
      if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Danh sách review IDs là bắt buộc' },
          { status: 400 }
        )
      }

      const { status, adminNotes } = await request.json()
      
      if (!status) {
        return NextResponse.json(
          { success: false, error: 'Status là bắt buộc' },
          { status: 400 }
        )
      }

      // Check if owner has permission to update these reviews
      if (decoded.role === 'owner') {
        const placeholdersCheck = reviewIds.map((_, index) => `$${index + 2}`).join(',')
        const ownerCheck = await query(`
          SELECT COUNT(*) as count FROM reviews r
          JOIN courts c ON r.court_id = c.id
          WHERE c.owner_id = $1 AND r.id IN (${placeholdersCheck})
        `, [decoded.id, ...reviewIds])
        
        if (parseInt(ownerCheck[0].count) !== reviewIds.length) {
          return NextResponse.json(
            { success: false, error: 'Bạn không có quyền cập nhật một số reviews này' },
            { status: 403 }
          )
        }
      }

      const placeholders = reviewIds.map((_, index) => `$${index + 6}`).join(',')
      const updateValues = [
        status,
        true, // admin_reviewed
        adminNotes || null,
        decoded.id, // hidden_by
        status === 'hidden' ? new Date() : null, // hidden_at
        ...reviewIds
      ]

      await query(`
        UPDATE reviews 
        SET 
          status = $1,
          admin_reviewed = $2,
          admin_notes = $3,
          hidden_by = $4,
          hidden_at = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders})
      `, updateValues)

      return NextResponse.json({
        success: true,
        message: `Cập nhật ${reviewIds.length} reviews thành công`
      })
    }

    return NextResponse.json(
      { success: false, error: 'Action không hợp lệ' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in admin review action:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
