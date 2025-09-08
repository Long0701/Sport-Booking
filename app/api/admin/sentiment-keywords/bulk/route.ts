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
      
      case 'reseed_all_keywords':
        return await handleReseedAllKeywords(decoded.id)
      
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

async function handleReseedAllKeywords(createdBy: number) {
  try {
    // First, clear all existing keywords
    const clearResult = await query('DELETE FROM sentiment_keywords');
    console.log(`Cleared ${clearResult.rowCount} existing keywords`);

    // Comprehensive Vietnamese Sentiment Keywords
    const defaultKeywords = {
      positive: [
        { keyword: 'tốt', weight: 1.0, category: 'Chất lượng' },
        { keyword: 'hay', weight: 1.0, category: 'Chất lượng' },
        { keyword: 'đẹp', weight: 1.1, category: 'Cơ sở vật chất' },
        { keyword: 'ổn', weight: 0.8, category: 'Chất lượng' },
        { keyword: 'được', weight: 0.9, category: 'Chất lượng' },
        { keyword: 'khá', weight: 0.9, category: 'Chất lượng' },
        { keyword: 'bình thường', weight: 0.6, category: 'Chất lượng' },
        { keyword: 'tuyệt', weight: 1.4, category: 'Chất lượng' },
        { keyword: 'xuất sắc', weight: 1.5, category: 'Chất lượng' },
        { keyword: 'hoàn hảo', weight: 1.5, category: 'Chất lượng' },
        { keyword: 'tuyệt vời', weight: 1.4, category: 'Chất lượng' },
        { keyword: 'tuyệt hảo', weight: 1.4, category: 'Chất lượng' },
        { keyword: 'tuyệt đỉnh', weight: 1.5, category: 'Chất lượng' },
        { keyword: 'ngoạn mục', weight: 1.4, category: 'Chất lượng' },
        { keyword: 'tuyệt diệu', weight: 1.4, category: 'Chất lượng' },
        { keyword: 'hoàn mỹ', weight: 1.3, category: 'Chất lượng' },
        { keyword: 'lý tưởng', weight: 1.2, category: 'Chất lượng' },
        { keyword: 'chuyên nghiệp', weight: 1.3, category: 'Thái độ phục vụ' },
        { keyword: 'thân thiện', weight: 1.2, category: 'Thái độ phục vụ' },
        { keyword: 'nhanh chóng', weight: 1.1, category: 'Thái độ phục vụ' },
        { keyword: 'nhiệt tình', weight: 1.2, category: 'Thái độ phục vụ' },
        { keyword: 'chu đáo', weight: 1.3, category: 'Thái độ phục vụ' },
        { keyword: 'tận tình', weight: 1.2, category: 'Thái độ phục vụ' },
        { keyword: 'hỗ trợ tốt', weight: 1.2, category: 'Thái độ phục vụ' },
        { keyword: 'phục vụ tốt', weight: 1.2, category: 'Thái độ phục vụ' },
        { keyword: 'giải quyết nhanh', weight: 1.1, category: 'Thái độ phục vụ' },
        { keyword: 'lịch sự', weight: 1.1, category: 'Thái độ phục vụ' },
        { keyword: 'gần gũi', weight: 1.0, category: 'Thái độ phục vụ' },
        { keyword: 'dễ chịu', weight: 1.0, category: 'Thái độ phục vụ' },
        { keyword: 'hài lòng', weight: 1.3, category: 'Khác' },
        { keyword: 'vừa ý', weight: 1.2, category: 'Khác' },
        { keyword: 'như mong đợi', weight: 1.2, category: 'Khác' },
        { keyword: 'vượt mong đợi', weight: 1.4, category: 'Khác' },
        { keyword: 'đáng mong đợi', weight: 1.1, category: 'Khác' },
        { keyword: 'thỏa mãn', weight: 1.3, category: 'Khác' },
        { keyword: 'yên tâm', weight: 1.2, category: 'An toàn' },
        { keyword: 'tin cậy', weight: 1.3, category: 'An toàn' },
        { keyword: 'đáng tin', weight: 1.2, category: 'An toàn' },
        { keyword: 'chất lượng', weight: 1.2, category: 'Chất lượng' },
        { keyword: 'chất lượng cao', weight: 1.3, category: 'Chất lượng' },
        { keyword: 'chất lượng tốt', weight: 1.2, category: 'Chất lượng' },
        { keyword: 'cao cấp', weight: 1.3, category: 'Chất lượng' },
        { keyword: 'sang trọng', weight: 1.2, category: 'Chất lượng' },
        { keyword: 'đẳng cấp', weight: 1.3, category: 'Chất lượng' },
        { keyword: 'bền đẹp', weight: 1.1, category: 'Chất lượng' },
        { keyword: 'tinh tế', weight: 1.2, category: 'Chất lượng' },
        { keyword: 'tinh xảo', weight: 1.2, category: 'Chất lượng' },
        { keyword: 'sạch sẽ', weight: 1.2, category: 'Vệ sinh' },
        { keyword: 'sạch đẹp', weight: 1.2, category: 'Vệ sinh' },
        { keyword: 'gọn gẽ', weight: 1.1, category: 'Vệ sinh' },
        { keyword: 'ngăn nắp', weight: 1.1, category: 'Vệ sinh' },
        { keyword: 'thoáng mát', weight: 1.1, category: 'Cơ sở vật chất' },
        { keyword: 'rộng rãi', weight: 1.1, category: 'Cơ sở vật chất' },
        { keyword: 'thoải mái', weight: 1.1, category: 'Cơ sở vật chất' },
        { keyword: 'tiện nghi', weight: 1.2, category: 'Cơ sở vật chất' },
        { keyword: 'hiện đại', weight: 1.2, category: 'Cơ sở vật chất' },
        { keyword: 'đầy đủ', weight: 1.1, category: 'Cơ sở vật chất' },
        { keyword: 'hoàn chỉnh', weight: 1.1, category: 'Cơ sở vật chất' },
        { keyword: 'tiện lợi', weight: 1.1, category: 'Khác' },
        { keyword: 'thuận tiện', weight: 1.1, category: 'Khác' },
        { keyword: 'đáng tiền', weight: 1.2, category: 'Giá cả' },
        { keyword: 'giá hợp lý', weight: 1.1, category: 'Giá cả' },
        { keyword: 'giá tốt', weight: 1.1, category: 'Giá cả' },
        { keyword: 'phải chăng', weight: 1.0, category: 'Giá cả' },
        { keyword: 'rẻ', weight: 0.8, category: 'Giá cả' },
        { keyword: 'tiết kiệm', weight: 1.0, category: 'Giá cả' },
        { keyword: 'xứng đáng', weight: 1.2, category: 'Giá cả' },
        { keyword: 'có giá trị', weight: 1.2, category: 'Giá cả' },
        { keyword: 'an toàn', weight: 1.2, category: 'An toàn' },
        { keyword: 'bảo đảm', weight: 1.1, category: 'An toàn' },
        { keyword: 'ổn định', weight: 1.1, category: 'An toàn' },
        { keyword: 'chắc chắn', weight: 1.1, category: 'An toàn' },
        { keyword: 'đảm bảo', weight: 1.1, category: 'An toàn' },
        { keyword: 'vững chắc', weight: 1.1, category: 'An toàn' },
        { keyword: 'khuyên dùng', weight: 1.3, category: 'Khác' },
        { keyword: 'nên thử', weight: 1.2, category: 'Khác' },
        { keyword: 'đáng thử', weight: 1.2, category: 'Khác' },
        { keyword: 'sẽ quay lại', weight: 1.3, category: 'Khác' },
        { keyword: 'giới thiệu', weight: 1.2, category: 'Khác' },
        { keyword: 'đề xuất', weight: 1.1, category: 'Khác' },
        { keyword: 'yêu thích', weight: 1.3, category: 'Khác' },
        { keyword: 'thích', weight: 1.1, category: 'Khác' },
        { keyword: 'mê', weight: 1.2, category: 'Khác' },
        { keyword: 'cuốn hút', weight: 1.2, category: 'Khác' },
        { keyword: 'ấn tượng', weight: 1.2, category: 'Khác' },
        { keyword: 'tuyệt cú mèo', weight: 1.4, category: 'Khác' },
        { keyword: 'quá đỉnh', weight: 1.3, category: 'Khác' },
        { keyword: 'cực kỳ tốt', weight: 1.4, category: 'Chất lượng' }
      ],
      
      negative: [
        { keyword: 'tệ', weight: 1.0, category: 'Chất lượng' },
        { keyword: 'dở', weight: 1.0, category: 'Chất lượng' },
        { keyword: 'kém', weight: 1.0, category: 'Chất lượng' },
        { keyword: 'xấu', weight: 1.0, category: 'Chất lượng' },
        { keyword: 'tồi', weight: 1.0, category: 'Chất lượng' },
        { keyword: 'không tốt', weight: 1.0, category: 'Chất lượng' },
        { keyword: 'không hay', weight: 0.9, category: 'Chất lượng' },
        { keyword: 'chưa tốt', weight: 0.8, category: 'Chất lượng' },
        { keyword: 'ghê', weight: 1.2, category: 'Chất lượng' },
        { keyword: 'tệ hại', weight: 1.3, category: 'Chất lượng' },
        { keyword: 'tồi tệ', weight: 1.2, category: 'Chất lượng' },
        { keyword: 'rác', weight: 1.4, category: 'Chất lượng' },
        { keyword: 'phí', weight: 1.1, category: 'Chất lượng' },
        { keyword: 'vô dụng', weight: 1.3, category: 'Chất lượng' },
        { keyword: 'vô ích', weight: 1.2, category: 'Chất lượng' },
        { keyword: 'không đáng', weight: 1.1, category: 'Giá cả' },
        { keyword: 'chán', weight: 0.8, category: 'Khác' },
        { keyword: 'buồn chán', weight: 0.9, category: 'Khác' },
        { keyword: 'nhàm chán', weight: 1.0, category: 'Khác' },
        { keyword: 'thất vọng', weight: 1.3, category: 'Khác' },
        { keyword: 'không hài lòng', weight: 1.2, category: 'Khác' },
        { keyword: 'không vừa ý', weight: 1.1, category: 'Khác' },
        { keyword: 'thô lỗ', weight: 1.3, category: 'Thái độ phục vụ' },
        { keyword: 'khó chịu', weight: 1.2, category: 'Thái độ phục vụ' },
        { keyword: 'không chuyên nghiệp', weight: 1.2, category: 'Thái độ phục vụ' },
        { keyword: 'thái độ tệ', weight: 1.3, category: 'Thái độ phục vụ' },
        { keyword: 'phục vụ tệ', weight: 1.2, category: 'Thái độ phục vụ' },
        { keyword: 'không nhiệt tình', weight: 1.0, category: 'Thái độ phục vụ' },
        { keyword: 'lạnh lùng', weight: 1.1, category: 'Thái độ phục vụ' },
        { keyword: 'hách dịch', weight: 1.3, category: 'Thái độ phục vụ' },
        { keyword: 'cộc cằn', weight: 1.2, category: 'Thái độ phục vụ' },
        { keyword: 'khinh thường', weight: 1.4, category: 'Thái độ phục vụ' },
        { keyword: 'chất lượng kém', weight: 1.2, category: 'Chất lượng' },
        { keyword: 'kém chất lượng', weight: 1.2, category: 'Chất lượng' },
        { keyword: 'không chất lượng', weight: 1.1, category: 'Chất lượng' },
        { keyword: 'hỏng', weight: 1.1, category: 'Cơ sở vật chất' },
        { keyword: 'hư', weight: 1.0, category: 'Cơ sở vật chất' },
        { keyword: 'cũ kỹ', weight: 1.0, category: 'Cơ sở vật chất' },
        { keyword: 'lạc hậu', weight: 1.1, category: 'Cơ sở vật chất' },
        { keyword: 'xuống cấp', weight: 1.2, category: 'Cơ sở vật chất' },
        { keyword: 'không hiện đại', weight: 0.9, category: 'Cơ sở vật chất' },
        { keyword: 'bẩn', weight: 1.2, category: 'Vệ sinh' },
        { keyword: 'dơ', weight: 1.1, category: 'Vệ sinh' },
        { keyword: 'bẩn thỉu', weight: 1.4, category: 'Vệ sinh' },
        { keyword: 'không sạch sẽ', weight: 1.1, category: 'Vệ sinh' },
        { keyword: 'lộn xộn', weight: 1.0, category: 'Vệ sinh' },
        { keyword: 'bừa bộn', weight: 1.1, category: 'Vệ sinh' },
        { keyword: 'hôi', weight: 1.2, category: 'Vệ sinh' },
        { keyword: 'tanh', weight: 1.1, category: 'Vệ sinh' },
        { keyword: 'mùi khó chịu', weight: 1.2, category: 'Vệ sinh' },
        { keyword: 'đắt', weight: 1.0, category: 'Giá cả' },
        { keyword: 'quá đắt', weight: 1.2, category: 'Giá cả' },
        { keyword: 'đắt đỏ', weight: 1.1, category: 'Giá cả' },
        { keyword: 'không đáng giá', weight: 1.2, category: 'Giá cả' },
        { keyword: 'giá cắt cổ', weight: 1.4, category: 'Giá cả' },
        { keyword: 'lãng phí', weight: 1.1, category: 'Giá cả' },
        { keyword: 'tiền mất tật mang', weight: 1.5, category: 'Giá cả' },
        { keyword: 'phí tiền', weight: 1.2, category: 'Giá cả' },
        { keyword: 'không xứng tiền', weight: 1.2, category: 'Giá cả' },
        { keyword: 'không an toàn', weight: 1.3, category: 'An toàn' },
        { keyword: 'nguy hiểm', weight: 1.4, category: 'An toàn' },
        { keyword: 'rủi ro', weight: 1.2, category: 'An toàn' },
        { keyword: 'không tin cậy', weight: 1.2, category: 'An toàn' },
        { keyword: 'bất ổn', weight: 1.1, category: 'An toàn' },
        { keyword: 'chậm', weight: 1.0, category: 'Thái độ phục vụ' },
        { keyword: 'lâu', weight: 0.9, category: 'Thái độ phục vụ' },
        { keyword: 'chờ đợi lâu', weight: 1.1, category: 'Thái độ phục vụ' },
        { keyword: 'mất thời gian', weight: 1.0, category: 'Thái độ phục vụ' },
        { keyword: 'không đúng giờ', weight: 1.1, category: 'Thái độ phục vụ' },
        { keyword: 'trễ', weight: 1.0, category: 'Thái độ phục vụ' },
        { keyword: 'lận lưng', weight: 1.5, category: 'Khác' },
        { keyword: 'không như quảng cáo', weight: 1.3, category: 'Khác' },
        { keyword: 'gian lận', weight: 1.5, category: 'Khác' },
        { keyword: 'không trung thực', weight: 1.3, category: 'Khác' },
        { keyword: 'nói dối', weight: 1.3, category: 'Khác' },
        { keyword: 'không nên', weight: 1.0, category: 'Khác' },
        { keyword: 'tránh xa', weight: 1.4, category: 'Khác' },
        { keyword: 'cảnh báo', weight: 1.3, category: 'Khác' },
        { keyword: 'đừng đến', weight: 1.3, category: 'Khác' },
        { keyword: 'không đề xuất', weight: 1.2, category: 'Khác' },
        { keyword: 'không khuyên', weight: 1.1, category: 'Khác' },
        { keyword: 'trải nghiệm tệ', weight: 1.3, category: 'Khác' },
        { keyword: 'kinh nghiệm xấu', weight: 1.2, category: 'Khác' },
        { keyword: 'tệ nhất từng trải', weight: 1.4, category: 'Khác' },
        { keyword: 'không bao giờ nữa', weight: 1.3, category: 'Khác' },
        { keyword: 'một lần là đủ', weight: 1.2, category: 'Khác' }
      ],
      
      strong_negative: [
        { keyword: 'rất tệ', weight: 2.0, category: 'Chất lượng' },
        { keyword: 'quá tệ', weight: 2.0, category: 'Chất lượng' },
        { keyword: 'cực kỳ tệ', weight: 2.0, category: 'Chất lượng' },
        { keyword: 'kinh khủng', weight: 2.0, category: 'Chất lượng' },
        { keyword: 'thảm họa', weight: 2.0, category: 'Chất lượng' },
        { keyword: 'tệ nhất', weight: 1.8, category: 'Chất lượng' },
        { keyword: 'không thể tệ hơn', weight: 1.9, category: 'Chất lượng' },
        { keyword: 'khủng khiếp', weight: 1.8, category: 'Chất lượng' },
        { keyword: 'tồi tệ nhất', weight: 1.8, category: 'Chất lượng' },
        { keyword: 'chán nản', weight: 1.5, category: 'Khác' },
        { keyword: 'ghê tởm', weight: 1.7, category: 'Chất lượng' },
        { keyword: 'đáng ghét', weight: 1.6, category: 'Khác' },
        { keyword: 'lừa đảo', weight: 2.0, category: 'Khác' },
        { keyword: 'lừa gát', weight: 1.9, category: 'Khác' },
        { keyword: 'cướp', weight: 2.0, category: 'Khác' },
        { keyword: 'ăn cắp', weight: 1.8, category: 'Khác' },
        { keyword: 'lừa tiền', weight: 1.9, category: 'Giá cả' },
        { keyword: 'bỏ túi', weight: 1.7, category: 'Giá cả' },
        { keyword: 'chặt chém', weight: 1.6, category: 'Giá cả' },
        { keyword: 'vô cùng thất vọng', weight: 1.7, category: 'Khác' },
        { keyword: 'thất vọng tột độ', weight: 1.7, category: 'Khác' },
        { keyword: 'cực kỳ thô lỗ', weight: 1.8, category: 'Thái độ phục vụ' },
        { keyword: 'thái độ khủng khiếp', weight: 1.7, category: 'Thái độ phục vụ' },
        { keyword: 'phục vụ tệ hại', weight: 1.6, category: 'Thái độ phục vụ' },
        { keyword: 'đối xử tệ', weight: 1.5, category: 'Thái độ phục vụ' },
        { keyword: 'xử tệ', weight: 1.5, category: 'Thái độ phục vụ' },
        { keyword: 'mất tiền', weight: 1.5, category: 'Giá cả' },
        { keyword: 'mất tiền oan', weight: 1.7, category: 'Giá cả' },
        { keyword: 'phí tiền oan', weight: 1.6, category: 'Giá cả' },
        { keyword: 'ném tiền qua cửa sổ', weight: 1.6, category: 'Giá cả' },
        { keyword: 'báo cảnh sát', weight: 2.0, category: 'Khác' },
        { keyword: 'tố cáo', weight: 1.8, category: 'Khác' },
        { keyword: 'kiện tụng', weight: 1.7, category: 'Khác' },
        { keyword: 'đưa ra tòa', weight: 1.8, category: 'Khác' },
        { keyword: 'vi phạm pháp luật', weight: 1.8, category: 'Khác' },
        { keyword: 'không bao giờ quay lại', weight: 1.8, category: 'Khác' },
        { keyword: 'tuyệt đối không', weight: 1.6, category: 'Khác' },
        { keyword: 'đừng bao giờ đến', weight: 1.7, category: 'Khác' },
        { keyword: 'chết cũng không', weight: 1.8, category: 'Khác' },
        { keyword: 'thà chết còn hơn', weight: 1.9, category: 'Khác' },
        { keyword: 'cẩn thận', weight: 1.4, category: 'An toàn' },
        { keyword: 'cực kỳ nguy hiểm', weight: 1.8, category: 'An toàn' },
        { keyword: 'rất nguy hiểm', weight: 1.6, category: 'An toàn' },
        { keyword: 'tuyệt đối tránh', weight: 1.7, category: 'Khác' },
        { keyword: 'nghiêm cấm', weight: 1.5, category: 'Khác' },
        { keyword: 'buồn nôn', weight: 1.6, category: 'Khác' },
        { keyword: 'phẫn nộ', weight: 1.6, category: 'Khác' },
        { keyword: 'tức giận', weight: 1.4, category: 'Khác' },
        { keyword: 'điên tiết', weight: 1.7, category: 'Khác' },
        { keyword: 'giận dữ', weight: 1.5, category: 'Khác' },
        { keyword: 'làm hỏng danh tiếng', weight: 1.7, category: 'Khác' },
        { keyword: 'uy tín tệ', weight: 1.6, category: 'Khác' },
        { keyword: 'mất uy tín', weight: 1.6, category: 'Khác' },
        { keyword: 'không còn tin tưởng', weight: 1.5, category: 'Khác' },
        { keyword: 'mất niềm tin', weight: 1.4, category: 'Khác' },
        { keyword: 'bẩn kinh khủng', weight: 1.8, category: 'Vệ sinh' },
        { keyword: 'dơ bẩn', weight: 1.5, category: 'Vệ sinh' },
        { keyword: 'hôi thối', weight: 1.6, category: 'Vệ sinh' },
        { keyword: 'mùi hôi', weight: 1.4, category: 'Vệ sinh' },
        { keyword: 'nồm nặc', weight: 1.5, category: 'Vệ sinh' },
        { keyword: 'thảm họa hoàn toàn', weight: 2.0, category: 'Chất lượng' },
        { keyword: 'thất bại thảm hại', weight: 1.8, category: 'Chất lượng' },
        { keyword: 'sai lầm lớn', weight: 1.6, category: 'Khác' },
        { keyword: 'hỏng hoàn toàn', weight: 1.7, category: 'Chất lượng' },
        { keyword: 'thảm hại', weight: 1.6, category: 'Chất lượng' }
      ]
    };

    // Get category mappings
    const categoryMapping = {};
    const categories = await query('SELECT id, name FROM sentiment_categories');
    categories.forEach(cat => {
      categoryMapping[cat.name] = cat.id;
    });

    let totalSeeded = 0;
    let errors = [];

    // Seed each type of keyword
    for (const [type, keywords] of Object.entries(defaultKeywords)) {
      for (const keywordData of keywords) {
        try {
          const categoryId = categoryMapping[keywordData.category] || null;
          
          await query(`
            INSERT INTO sentiment_keywords (
              keyword, type, weight, language, category_id, is_active, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            keywordData.keyword.trim(),
            type,
            keywordData.weight,
            'vi',
            categoryId,
            true,
            createdBy
          ]);

          totalSeeded++;
        } catch (error) {
          errors.push(`Failed to seed '${keywordData.keyword}': ${error.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reseed hoàn thành: xóa ${clearResult.rowCount} keywords cũ và seed ${totalSeeded} keywords mới`,
      data: {
        clearedCount: clearResult.rowCount,
        totalSeeded,
        errorCount: errors.length,
        errors: errors.slice(0, 5) // Limit errors shown
      }
    });

  } catch (error) {
    console.error('Error reseeding keywords:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi reseed keywords' },
      { status: 500 }
    );
  }
}
