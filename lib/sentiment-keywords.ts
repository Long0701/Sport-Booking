// Dynamic Sentiment Keywords Management
// This service manages sentiment keywords from database with caching for performance

import { query } from '@/lib/db'

export interface SentimentKeyword {
  id: number
  keyword: string
  type: 'positive' | 'negative' | 'strong_negative'
  weight: number
  language: string
  isActive: boolean
  categoryId?: number
  categoryName?: string
}

export interface KeywordCache {
  positive: SentimentKeyword[]
  negative: SentimentKeyword[]
  strong_negative: SentimentKeyword[]
  lastUpdated: Date
}

// In-memory cache for keywords
let keywordCache: { [language: string]: KeywordCache } = {}
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Get keywords from database with caching
export async function getSentimentKeywords(language: string = 'vi', forceRefresh: boolean = false): Promise<KeywordCache> {
  const now = new Date()
  
  // Check if cache is valid
  if (!forceRefresh && 
      keywordCache[language] && 
      keywordCache[language].lastUpdated && 
      (now.getTime() - keywordCache[language].lastUpdated.getTime()) < CACHE_DURATION) {
    return keywordCache[language]
  }

  try {
    // Check if tables exist first
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sentiment_keywords'
      );
    `);
    
    if (!tableCheck[0].exists) {
      console.warn('Sentiment keywords table does not exist, using fallback keywords');
      return getFallbackKeywords();
    }
    
    // Fetch keywords from database
    const keywordsQuery = `
      SELECT 
        sk.id,
        sk.keyword,
        sk.type,
        sk.weight,
        sk.language,
        sk.is_active,
        sk.category_id,
        sc.name as category_name
      FROM sentiment_keywords sk
      LEFT JOIN sentiment_categories sc ON sk.category_id = sc.id
      WHERE sk.language = $1 AND sk.is_active = true
      ORDER BY sk.weight DESC, sk.keyword
    `

    const keywords = await query(keywordsQuery, [language])
    
    // If no keywords found, use fallback
    if (keywords.length === 0) {
      console.warn('No sentiment keywords found in database, using fallback');
      return getFallbackKeywords();
    }

    // Group keywords by type
    const groupedKeywords: KeywordCache = {
      positive: [],
      negative: [],
      strong_negative: [],
      lastUpdated: now
    }

    keywords.forEach((row: any) => {
      const keyword: SentimentKeyword = {
        id: row.id,
        keyword: row.keyword,
        type: row.type,
        weight: parseFloat(row.weight),
        language: row.language,
        isActive: row.is_active,
        categoryId: row.category_id,
        categoryName: row.category_name
      }

      if (groupedKeywords[keyword.type]) {
        groupedKeywords[keyword.type].push(keyword)
      }
    })

    // Cache the results
    keywordCache[language] = groupedKeywords
    
    return groupedKeywords

  } catch (error) {
    console.error('Error fetching sentiment keywords from database:', error)
    
    // Return cached data if available, otherwise return fallback
    if (keywordCache[language]) {
      console.warn('Using cached keywords due to database error')
      return keywordCache[language]
    }
    
    // Use fallback keywords if no cache available
    console.warn('Using fallback keywords due to database error')
    return getFallbackKeywords()
  }
}

// Clear cache for a specific language or all languages
export function clearKeywordCache(language?: string) {
  if (language) {
    delete keywordCache[language]
  } else {
    keywordCache = {}
  }
}

// Add new keyword and refresh cache
export async function addKeywordAndRefresh(keywordData: Omit<SentimentKeyword, 'id'>, createdBy: number): Promise<SentimentKeyword> {
  try {
    const result = await query(`
      INSERT INTO sentiment_keywords (
        keyword, type, weight, language, category_id, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      keywordData.keyword.trim(),
      keywordData.type,
      keywordData.weight,
      keywordData.language,
      keywordData.categoryId || null,
      keywordData.isActive,
      createdBy
    ])

    // Clear cache to force refresh
    clearKeywordCache(keywordData.language)

    return {
      id: result[0].id,
      keyword: result[0].keyword,
      type: result[0].type,
      weight: parseFloat(result[0].weight),
      language: result[0].language,
      isActive: result[0].is_active,
      categoryId: result[0].category_id
    }

  } catch (error) {
    console.error('Error adding sentiment keyword:', error)
    throw error
  }
}

// Update keyword and refresh cache
export async function updateKeywordAndRefresh(id: number, updates: Partial<SentimentKeyword>): Promise<void> {
  try {
    const setClause = []
    const values = []
    let paramIndex = 1

    if (updates.keyword !== undefined) {
      setClause.push(`keyword = $${paramIndex}`)
      values.push(updates.keyword.trim())
      paramIndex++
    }

    if (updates.type !== undefined) {
      setClause.push(`type = $${paramIndex}`)
      values.push(updates.type)
      paramIndex++
    }

    if (updates.weight !== undefined) {
      setClause.push(`weight = $${paramIndex}`)
      values.push(updates.weight)
      paramIndex++
    }

    if (updates.categoryId !== undefined) {
      setClause.push(`category_id = $${paramIndex}`)
      values.push(updates.categoryId)
      paramIndex++
    }

    if (updates.isActive !== undefined) {
      setClause.push(`is_active = $${paramIndex}`)
      values.push(updates.isActive)
      paramIndex++
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    await query(`
      UPDATE sentiment_keywords 
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
    `, values)

    // Clear all cache since we don't know which language was affected
    clearKeywordCache()

  } catch (error) {
    console.error('Error updating sentiment keyword:', error)
    throw error
  }
}

// Delete keyword and refresh cache
export async function deleteKeywordAndRefresh(id: number): Promise<void> {
  try {
    await query('DELETE FROM sentiment_keywords WHERE id = $1', [id])
    
    // Clear all cache
    clearKeywordCache()

  } catch (error) {
    console.error('Error deleting sentiment keyword:', error)
    throw error
  }
}

// Get fallback keywords (for when database is unavailable)
export function getFallbackKeywords(): KeywordCache {
  return {
    positive: [
      { id: 0, keyword: 'tốt', type: 'positive', weight: 1.0, language: 'vi', isActive: true },
      { id: 0, keyword: 'hay', type: 'positive', weight: 1.0, language: 'vi', isActive: true },
      { id: 0, keyword: 'đẹp', type: 'positive', weight: 1.1, language: 'vi', isActive: true },
      { id: 0, keyword: 'tuyệt', type: 'positive', weight: 1.4, language: 'vi', isActive: true },
      { id: 0, keyword: 'xuất sắc', type: 'positive', weight: 1.5, language: 'vi', isActive: true },
      { id: 0, keyword: 'hoàn hảo', type: 'positive', weight: 1.5, language: 'vi', isActive: true },
      { id: 0, keyword: 'hài lòng', type: 'positive', weight: 1.3, language: 'vi', isActive: true },
      { id: 0, keyword: 'tuyệt vời', type: 'positive', weight: 1.4, language: 'vi', isActive: true },
      { id: 0, keyword: 'chất lượng', type: 'positive', weight: 1.2, language: 'vi', isActive: true },
      { id: 0, keyword: 'sạch sẽ', type: 'positive', weight: 1.2, language: 'vi', isActive: true },
    ],
    negative: [
      { id: 0, keyword: 'tệ', type: 'negative', weight: 1.0, language: 'vi', isActive: true },
      { id: 0, keyword: 'dở', type: 'negative', weight: 1.0, language: 'vi', isActive: true },
      { id: 0, keyword: 'kém', type: 'negative', weight: 1.0, language: 'vi', isActive: true },
      { id: 0, keyword: 'xấu', type: 'negative', weight: 1.0, language: 'vi', isActive: true },
      { id: 0, keyword: 'tồi', type: 'negative', weight: 1.0, language: 'vi', isActive: true },
      { id: 0, keyword: 'thất vọng', type: 'negative', weight: 1.3, language: 'vi', isActive: true },
      { id: 0, keyword: 'không hài lòng', type: 'negative', weight: 1.2, language: 'vi', isActive: true },
      { id: 0, keyword: 'bẩn', type: 'negative', weight: 1.2, language: 'vi', isActive: true },
      { id: 0, keyword: 'hỏng', type: 'negative', weight: 1.1, language: 'vi', isActive: true },
      { id: 0, keyword: 'chán', type: 'negative', weight: 0.8, language: 'vi', isActive: true },
    ],
    strong_negative: [
      { id: 0, keyword: 'rất tệ', type: 'strong_negative', weight: 2.0, language: 'vi', isActive: true },
      { id: 0, keyword: 'quá tệ', type: 'strong_negative', weight: 2.0, language: 'vi', isActive: true },
      { id: 0, keyword: 'kinh khủng', type: 'strong_negative', weight: 2.0, language: 'vi', isActive: true },
      { id: 0, keyword: 'thảm họa', type: 'strong_negative', weight: 2.0, language: 'vi', isActive: true },
      { id: 0, keyword: 'lừa đảo', type: 'strong_negative', weight: 2.0, language: 'vi', isActive: true },
      { id: 0, keyword: 'không bao giờ quay lại', type: 'strong_negative', weight: 1.8, language: 'vi', isActive: true },
      { id: 0, keyword: 'tệ nhất', type: 'strong_negative', weight: 1.8, language: 'vi', isActive: true },
    ],
    lastUpdated: new Date()
  }
}

// Validate keyword data
export function validateKeywordData(keyword: Partial<SentimentKeyword>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!keyword.keyword || keyword.keyword.trim().length === 0) {
    errors.push('Keyword không được để trống')
  }

  if (!keyword.type || !['positive', 'negative', 'strong_negative'].includes(keyword.type)) {
    errors.push('Type phải là positive, negative hoặc strong_negative')
  }

  if (keyword.weight !== undefined && (keyword.weight < 0.1 || keyword.weight > 2.0)) {
    errors.push('Weight phải từ 0.1 đến 2.0')
  }

  if (!keyword.language || keyword.language.trim().length === 0) {
    errors.push('Language không được để trống')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
