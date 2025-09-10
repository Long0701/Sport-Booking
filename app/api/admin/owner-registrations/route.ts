import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

// GET - Get all owner registration requests
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''
    
    const offset = (page - 1) * limit
    
    // Build query conditions
    let whereConditions = []
    let queryParams: any[] = []
    let paramIndex = 1
    
    if (status && status !== 'all') {
      whereConditions.push(`reg.status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    }
    
    if (search) {
      whereConditions.push(`(
        reg.business_name ILIKE $${paramIndex} OR 
        COALESCE(reg.user_name, u.name) ILIKE $${paramIndex} OR 
        COALESCE(reg.user_email, u.email) ILIKE $${paramIndex}
      )`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : ''
    
    // Get total count (support both legacy and new registrations)
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM owner_registrations reg
      LEFT JOIN users u ON reg.user_id = u.id
      ${whereClause}
    `
    const countResult = await query(countQuery, queryParams)
    const totalRequests = parseInt(countResult[0].total)
    
    // Get registration requests with flexible user info (support both legacy and new registrations)
    const requestsQuery = `
      SELECT 
        reg.id,
        reg.user_id,
        reg.user_name,
        reg.user_email,
        reg.user_phone,
        reg.business_name,
        reg.business_address,
        reg.business_phone,
        reg.business_email,
        reg.description,
        reg.experience,
        reg.status,
        reg.admin_notes,
        reg.reviewed_at,
        reg.created_at,
        reg.updated_at,
        reg.created_user_id,
        -- User data from users table (legacy registrations)
        u.name as existing_user_name,
        u.email as existing_user_email,
        u.phone as existing_user_phone,
        u.created_at as user_created_at,
        -- Reviewer info
        reviewer.name as reviewed_by_name
      FROM owner_registrations reg
      LEFT JOIN users u ON reg.user_id = u.id
      LEFT JOIN users reviewer ON reg.reviewed_by = reviewer.id
      ${whereClause}
      ORDER BY 
        CASE reg.status 
          WHEN 'pending' THEN 1 
          WHEN 'approved' THEN 2 
          WHEN 'rejected' THEN 3 
        END,
        reg.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    queryParams.push(limit, offset)
    const rawRequests = await query(requestsQuery, queryParams)
    
    // Normalize data (prefer registration data for new flow, fallback to existing user data for legacy)
    const requests = rawRequests.map(raw => ({
      id: raw.id,
      user_id: raw.user_id,
      business_name: raw.business_name,
      business_address: raw.business_address,
      business_phone: raw.business_phone,
      business_email: raw.business_email,
      description: raw.description,
      experience: raw.experience,
      status: raw.status,
      admin_notes: raw.admin_notes,
      reviewed_at: raw.reviewed_at,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      created_user_id: raw.created_user_id,
      // Use registration data if available (new flow), otherwise use existing user data (legacy)
      user_name: raw.user_name || raw.existing_user_name,
      user_email: raw.user_email || raw.existing_user_email,
      user_phone: raw.user_phone || raw.existing_user_phone,
      user_created_at: raw.user_created_at,
      reviewed_by_name: raw.reviewed_by_name
    }))
    
    // Get summary stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_this_week
      FROM owner_registrations
    `
    const stats = await query(statsQuery)
    
    return NextResponse.json({
      success: true,
      data: {
        requests,
        stats: stats[0],
        pagination: {
          page,
          limit,
          total: totalRequests,
          totalPages: Math.ceil(totalRequests / limit)
        }
      }
    })
    
  } catch (error: any) {
    console.error('Admin get owner registrations error:', error)
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
