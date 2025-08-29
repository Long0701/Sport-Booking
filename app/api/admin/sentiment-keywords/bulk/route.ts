import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'

// POST - Bulk operations for sentiment keywords
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

    const { action, ids, data } = await request.json()

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action là bắt buộc' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'bulk_delete':
        return await handleBulkDelete(ids)
      
      case 'bulk_activate':
        return await handleBulkActivate(ids, true)
      
      case 'bulk_deactivate':
        return await handleBulkActivate(ids, false)
      
      case 'bulk_update_category':
        return await handleBulkUpdateCategory(ids, data.categoryId)
      
      case 'bulk_update_weight':
        return await handleBulkUpdateWeight(ids, data.weight)
      
      case 'import_keywords':
        return await handleImportKeywords(data.keywords, decoded.id)
      
      case 'export_keywords':
        return await handleExportKeywords(data.filters)
      
      default:
        return NextResponse.json(
          { success: false, error: 'Action không hợp lệ' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in bulk sentiment keywords operation:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

async function handleBulkDelete(ids: string[]) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Danh sách IDs là bắt buộc' },
      { status: 400 }
    )
  }

  const placeholders = ids.map((_, index) => `$${index + 1}`).join(',')
  const result = await query(`
    DELETE FROM sentiment_keywords 
    WHERE id IN (${placeholders})
  `, ids)

  return NextResponse.json({
    success: true,
    message: `Đã xóa ${ids.length} keywords`
  })
}

async function handleBulkActivate(ids: string[], isActive: boolean) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Danh sách IDs là bắt buộc' },
      { status: 400 }
    )
  }

  const placeholders = ids.map((_, index) => `$${index + 2}`).join(',')
  await query(`
    UPDATE sentiment_keywords 
    SET is_active = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id IN (${placeholders})
  `, [isActive, ...ids])

  return NextResponse.json({
    success: true,
    message: `Đã ${isActive ? 'kích hoạt' : 'vô hiệu hóa'} ${ids.length} keywords`
  })
}

async function handleBulkUpdateCategory(ids: string[], categoryId: number | null) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Danh sách IDs là bắt buộc' },
      { status: 400 }
    )
  }

  const placeholders = ids.map((_, index) => `$${index + 2}`).join(',')
  await query(`
    UPDATE sentiment_keywords 
    SET category_id = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id IN (${placeholders})
  `, [categoryId, ...ids])

  return NextResponse.json({
    success: true,
    message: `Đã cập nhật category cho ${ids.length} keywords`
  })
}

async function handleBulkUpdateWeight(ids: string[], weight: number) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Danh sách IDs là bắt buộc' },
      { status: 400 }
    )
  }

  if (weight < 0.1 || weight > 2.0) {
    return NextResponse.json(
      { success: false, error: 'Weight phải từ 0.1 đến 2.0' },
      { status: 400 }
    )
  }

  const placeholders = ids.map((_, index) => `$${index + 2}`).join(',')
  await query(`
    UPDATE sentiment_keywords 
    SET weight = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id IN (${placeholders})
  `, [weight, ...ids])

  return NextResponse.json({
    success: true,
    message: `Đã cập nhật weight cho ${ids.length} keywords`
  })
}

async function handleImportKeywords(keywords: any[], createdBy: number) {
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Danh sách keywords là bắt buộc' },
      { status: 400 }
    )
  }

  let successCount = 0
  let errorCount = 0
  const errors: string[] = []

  for (const keywordData of keywords) {
    try {
      const { keyword, type, weight, language, categoryId } = keywordData

      // Validation
      if (!keyword || !type) {
        errors.push(`Keyword '${keyword}': Thiếu keyword hoặc type`)
        errorCount++
        continue
      }

      if (!['positive', 'negative', 'strong_negative'].includes(type)) {
        errors.push(`Keyword '${keyword}': Type không hợp lệ`)
        errorCount++
        continue
      }

      const keywordWeight = weight || 1.0
      if (keywordWeight < 0.1 || keywordWeight > 2.0) {
        errors.push(`Keyword '${keyword}': Weight không hợp lệ`)
        errorCount++
        continue
      }

      // Check for duplicates
      const existingKeyword = await query(`
        SELECT id FROM sentiment_keywords 
        WHERE LOWER(keyword) = LOWER($1) AND type = $2 AND language = $3
      `, [keyword.trim(), type, language || 'vi'])

      if (existingKeyword.length > 0) {
        errors.push(`Keyword '${keyword}': Đã tồn tại`)
        errorCount++
        continue
      }

      // Insert keyword
      await query(`
        INSERT INTO sentiment_keywords (
          keyword, type, weight, language, category_id, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        keyword.trim(),
        type,
        keywordWeight,
        language || 'vi',
        categoryId || null,
        true,
        createdBy
      ])

      successCount++

    } catch (error) {
      errors.push(`Keyword '${keywordData.keyword}': ${error}`)
      errorCount++
    }
  }

  return NextResponse.json({
    success: true,
    message: `Import hoàn thành: ${successCount} thành công, ${errorCount} lỗi`,
    data: {
      successCount,
      errorCount,
      errors: errors.slice(0, 10) // Limit errors to avoid huge response
    }
  })
}

async function handleExportKeywords(filters: any = {}) {
  const { type = 'all', language = 'vi', active = 'all' } = filters

  let whereConditions = ['sk.language = $1']
  let params: any[] = [language]
  let paramIndex = 2

  if (type !== 'all') {
    whereConditions.push(`sk.type = $${paramIndex}`)
    params.push(type)
    paramIndex++
  }

  if (active !== 'all') {
    whereConditions.push(`sk.is_active = $${paramIndex}`)
    params.push(active === 'true')
    paramIndex++
  }

  const whereClause = whereConditions.join(' AND ')

  const exportQuery = `
    SELECT 
      sk.keyword,
      sk.type,
      sk.weight,
      sk.language,
      sk.is_active,
      sc.name as category_name
    FROM sentiment_keywords sk
    LEFT JOIN sentiment_categories sc ON sk.category_id = sc.id
    WHERE ${whereClause}
    ORDER BY sk.type, sk.keyword
  `

  const keywords = await query(exportQuery, params)

  // Format for CSV export
  const csvData = keywords.map(row => ({
    keyword: row.keyword,
    type: row.type,
    weight: row.weight,
    language: row.language,
    category: row.category_name || '',
    isActive: row.is_active
  }))

  return NextResponse.json({
    success: true,
    data: csvData,
    filename: `sentiment_keywords_${language}_${new Date().toISOString().split('T')[0]}.json`
  })
}
