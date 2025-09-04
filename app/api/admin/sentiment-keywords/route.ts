import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'

// GET - Admin get all sentiment keywords with filtering
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
    const type = searchParams.get('type') || 'all' // all, positive, negative, strong_negative
    const category = searchParams.get('category') || 'all'
    const language = searchParams.get('language') || 'vi'
    const active = searchParams.get('active') || 'all' // all, true, false
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let whereConditions = ['sk.language = $1']
    let params: any[] = [language]
    let paramIndex = 2

    if (type !== 'all') {
      whereConditions.push(`sk.type = $${paramIndex}`)
      params.push(type)
      paramIndex++
    }

    if (category !== 'all') {
      whereConditions.push(`sk.category_id = $${paramIndex}`)
      params.push(parseInt(category))
      paramIndex++
    }

    if (active !== 'all') {
      whereConditions.push(`sk.is_active = $${paramIndex}`)
      params.push(active === 'true')
      paramIndex++
    }

    if (search) {
      whereConditions.push(`sk.keyword ILIKE $${paramIndex}`)
      params.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    // Get keywords with category info
    const keywordsQuery = `
      SELECT 
        sk.*,
        sc.name as category_name,
        sc.color as category_color,
        u.name as created_by_name
      FROM sentiment_keywords sk
      LEFT JOIN sentiment_categories sc ON sk.category_id = sc.id
      LEFT JOIN users u ON sk.created_by = u.id
      WHERE ${whereClause}
      ORDER BY sk.type, sk.weight DESC, sk.keyword
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(limit, offset)
    const keywords = await query(keywordsQuery, params)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM sentiment_keywords sk
      WHERE ${whereClause}
    `
    const countParams = params.slice(0, -2)
    const countResult = await query(countQuery, countParams)
    const total = parseInt(countResult[0].total)

    // Get statistics
    const statsQuery = `
      SELECT 
        type,
        COUNT(*) as count,
        AVG(weight) as avg_weight
      FROM sentiment_keywords
      WHERE language = $1 AND is_active = true
      GROUP BY type
    `
    const statsResult = await query(statsQuery, [language])
    
    const stats = {
      positive: 0,
      negative: 0,
      strong_negative: 0,
      total_active: 0
    }

    statsResult.forEach((row: any) => {
      stats[row.type as keyof typeof stats] = parseInt(row.count)
      stats.total_active += parseInt(row.count)
    })

    return NextResponse.json({
      success: true,
      data: keywords.map((keyword: any) => ({
        id: keyword.id,
        keyword: keyword.keyword,
        type: keyword.type,
        weight: parseFloat(keyword.weight),
        language: keyword.language,
        isActive: keyword.is_active,
        categoryId: keyword.category_id,
        categoryName: keyword.category_name,
        categoryColor: keyword.category_color,
        createdBy: keyword.created_by_name,
        createdAt: keyword.created_at,
        updatedAt: keyword.updated_at
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    })

  } catch (error) {
    console.error('Error fetching sentiment keywords:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

// POST - Create new sentiment keyword
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

    const { keyword, type, weight, language, categoryId, isActive } = await request.json()

    // Validation
    if (!keyword || !type) {
      return NextResponse.json(
        { success: false, error: 'Keyword và type là bắt buộc' },
        { status: 400 }
      )
    }

    if (!['positive', 'negative', 'strong_negative'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Type không hợp lệ' },
        { status: 400 }
      )
    }

    const keywordWeight = weight || 1.0
    if (keywordWeight < 0.1 || keywordWeight > 2.0) {
      return NextResponse.json(
        { success: false, error: 'Weight phải từ 0.1 đến 2.0' },
        { status: 400 }
      )
    }

    // Check for duplicates
    const existingKeyword = await query(`
      SELECT id FROM sentiment_keywords 
      WHERE LOWER(keyword) = LOWER($1) AND type = $2 AND language = $3
    `, [keyword.trim(), type, language || 'vi'])

    if (existingKeyword.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Keyword đã tồn tại cho type và ngôn ngữ này' },
        { status: 400 }
      )
    }

    // Insert new keyword
    const result = await query(`
      INSERT INTO sentiment_keywords (
        keyword, type, weight, language, category_id, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      keyword.trim(),
      type,
      keywordWeight,
      language || 'vi',
      categoryId || null,
      isActive !== false,
      decoded.id
    ])

    return NextResponse.json({
      success: true,
      message: 'Tạo keyword thành công',
      data: {
        id: result[0].id,
        keyword: result[0].keyword,
        type: result[0].type,
        weight: parseFloat(result[0].weight),
        language: result[0].language,
        isActive: result[0].is_active,
        categoryId: result[0].category_id,
        createdAt: result[0].created_at
      }
    })

  } catch (error) {
    console.error('Error creating sentiment keyword:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

// PUT - Update sentiment keyword
export async function PUT(request: NextRequest) {
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

    const { id, keyword, type, weight, categoryId, isActive } = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID là bắt buộc' },
        { status: 400 }
      )
    }

    // Check if keyword exists
    const existingKeyword = await query('SELECT * FROM sentiment_keywords WHERE id = $1', [id])
    if (existingKeyword.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy keyword' },
        { status: 404 }
      )
    }

    // Build update query dynamically
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    if (keyword !== undefined) {
      updateFields.push(`keyword = $${paramIndex}`)
      updateValues.push(keyword.trim())
      paramIndex++
    }

    if (type !== undefined) {
      if (!['positive', 'negative', 'strong_negative'].includes(type)) {
        return NextResponse.json(
          { success: false, error: 'Type không hợp lệ' },
          { status: 400 }
        )
      }
      updateFields.push(`type = $${paramIndex}`)
      updateValues.push(type)
      paramIndex++
    }

    if (weight !== undefined) {
      if (weight < 0.1 || weight > 2.0) {
        return NextResponse.json(
          { success: false, error: 'Weight phải từ 0.1 đến 2.0' },
          { status: 400 }
        )
      }
      updateFields.push(`weight = $${paramIndex}`)
      updateValues.push(weight)
      paramIndex++
    }

    if (categoryId !== undefined) {
      updateFields.push(`category_id = $${paramIndex}`)
      updateValues.push(categoryId)
      paramIndex++
    }

    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`)
      updateValues.push(isActive)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không có trường nào được cập nhật' },
        { status: 400 }
      )
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
    updateValues.push(id)

    const updateQuery = `
      UPDATE sentiment_keywords 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await query(updateQuery, updateValues)

    return NextResponse.json({
      success: true,
      message: 'Cập nhật keyword thành công',
      data: {
        id: result[0].id,
        keyword: result[0].keyword,
        type: result[0].type,
        weight: parseFloat(result[0].weight),
        language: result[0].language,
        isActive: result[0].is_active,
        categoryId: result[0].category_id,
        updatedAt: result[0].updated_at
      }
    })

  } catch (error) {
    console.error('Error updating sentiment keyword:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

// DELETE - Delete sentiment keyword
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID là bắt buộc' },
        { status: 400 }
      )
    }

    // Check if keyword exists
    const existingKeyword = await query('SELECT * FROM sentiment_keywords WHERE id = $1', [id])
    if (existingKeyword.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy keyword' },
        { status: 404 }
      )
    }

    // Delete keyword
    await query('DELETE FROM sentiment_keywords WHERE id = $1', [id])

    return NextResponse.json({
      success: true,
      message: 'Xóa keyword thành công'
    })

  } catch (error) {
    console.error('Error deleting sentiment keyword:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
