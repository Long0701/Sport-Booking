import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'

// GET - Get all sentiment categories
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

    const categoriesQuery = `
      SELECT 
        sc.*,
        COUNT(sk.id) as keyword_count,
        COUNT(CASE WHEN sk.is_active = true THEN 1 END) as active_keyword_count
      FROM sentiment_categories sc
      LEFT JOIN sentiment_keywords sk ON sc.id = sk.category_id
      WHERE sc.is_active = true
      GROUP BY sc.id
      ORDER BY sc.name
    `

    const categories = await query(categoriesQuery)

    return NextResponse.json({
      success: true,
      data: categories.map((category: any) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        isActive: category.is_active,
        keywordCount: parseInt(category.keyword_count),
        activeKeywordCount: parseInt(category.active_keyword_count),
        createdAt: category.created_at
      }))
    })

  } catch (error) {
    console.error('Error fetching sentiment categories:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

// POST - Create new sentiment category
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

    const { name, description, color } = await request.json()

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Tên category là bắt buộc' },
        { status: 400 }
      )
    }

    // Check for duplicates
    const existingCategory = await query(`
      SELECT id FROM sentiment_categories WHERE LOWER(name) = LOWER($1)
    `, [name.trim()])

    if (existingCategory.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Category đã tồn tại' },
        { status: 400 }
      )
    }

    const result = await query(`
      INSERT INTO sentiment_categories (name, description, color)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name.trim(), description || null, color || '#gray'])

    return NextResponse.json({
      success: true,
      message: 'Tạo category thành công',
      data: {
        id: result[0].id,
        name: result[0].name,
        description: result[0].description,
        color: result[0].color,
        createdAt: result[0].created_at
      }
    })

  } catch (error) {
    console.error('Error creating sentiment category:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
