import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/auth' // Assuming verifyToken function exists

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius') || '10' // km
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let whereConditions = ['c.is_active = true']
    let params: any[] = []
    let paramIndex = 1

    // Filter by sport type
    if (type && type !== 'all') {
      whereConditions.push(`c.type = $${paramIndex}`)
      params.push(type)
      paramIndex++
    }

    // Search by name or address
    if (search) {
      whereConditions.push(`(c.name ILIKE $${paramIndex} OR c.address ILIKE $${paramIndex})`)
      params.push(`%${search}%`)
      paramIndex++
    }

    // Location-based search using Haversine formula
    if (lat && lng) {
      whereConditions.push(`
        (6371 * acos(cos(radians($${paramIndex})) * cos(radians(c.latitude)) * 
        cos(radians(c.longitude) - radians($${paramIndex + 1})) + 
        sin(radians($${paramIndex})) * sin(radians(c.latitude)))) <= $${paramIndex + 2}
      `)
      params.push(parseFloat(lat), parseFloat(lng), parseInt(radius))
      paramIndex += 3
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Get courts with owner info and calculated ratings
    const courtsQuery = `
      SELECT 
        c.*,
        u.name as owner_name,
        u.phone as owner_phone,
        COALESCE(AVG(r.rating), 0) as calculated_rating,
        COUNT(r.id) as actual_review_count,
        ${lat && lng ? `
          (6371 * acos(cos(radians($${params.findIndex(p => p === parseFloat(lat)) + 1})) * cos(radians(c.latitude)) * 
          cos(radians(c.longitude) - radians($${params.findIndex(p => p === parseFloat(lng)) + 1})) + 
          sin(radians($${params.findIndex(p => p === parseFloat(lat)) + 1})) * sin(radians(c.latitude)))) as distance
        ` : '0 as distance'}
      FROM courts c
      LEFT JOIN users u ON c.owner_id = u.id
      LEFT JOIN reviews r ON c.id = r.court_id
      ${whereClause}
      GROUP BY c.id, u.name, u.phone
      ORDER BY calculated_rating DESC, c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(limit, offset)

    const courts = await query(courtsQuery, params)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM courts c
      ${whereClause}
    `
    const countParams = params.slice(0, -2) // Remove limit and offset
    const countResult = await query(countQuery, countParams)
    const total = parseInt(countResult[0].total)

    return NextResponse.json({
      success: true,
      data: courts.map((court: any) => ({
        _id: court.id,
        name: court.name,
        type: court.type,
        address: court.address,
        pricePerHour: court.price_per_hour,
        rating: Math.round(parseFloat(court.calculated_rating) * 100) / 100,
        reviewCount: parseInt(court.actual_review_count),
        images: court.images,
        amenities: court.amenities || [],
        location: {
          coordinates: [court.longitude.toString(), court.latitude.toString()]
        },
        owner: {
          name: court.owner_name,
          phone: court.owner_phone
        },
        distance: parseFloat(court.distance)
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching courts:', error)
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database not configured',
          message: 'Please set up your database connection. Check SETUP.md for instructions.',
          details: error.message
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Lỗi server', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token không hợp lệ' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== 'owner') {
      return NextResponse.json(
        { success: false, error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      type,
      description,
      address,
      coordinates,
      images,
      amenities,
      pricePerHour,
      openTime,
      closeTime,
      phone,
      ownerId
    } = body

    // Validate that ownerId matches the authenticated user
    if (ownerId !== decoded.id) {
      return NextResponse.json(
        { success: false, error: 'Không thể tạo sân cho người khác' },
        { status: 403 }
      )
    }

    // Validate required fields
    if (!name || !type || !description || !address || !coordinates || !pricePerHour || !phone || !ownerId) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      )
    }

    // Check if owner exists
    const ownerResult = await query('SELECT id FROM users WHERE id = $1', [ownerId])
    if (ownerResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy chủ sân' },
        { status: 404 }
      )
    }

    const courtResult = await query(`
      INSERT INTO courts (
        name, type, description, address, latitude, longitude,
        images, amenities, price_per_hour, open_time, close_time, phone, owner_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      name, type, description, address, coordinates.lat, coordinates.lng,
      images || [], amenities || [], pricePerHour, 
      openTime || '06:00', closeTime || '22:00', phone, ownerId
    ])

    const court = courtResult[0]

    // Get owner info
    const ownerInfo = await query('SELECT name, phone FROM users WHERE id = $1', [ownerId])

    return NextResponse.json({
      success: true,
      data: {
        ...court,
        owner: ownerInfo[0]
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating court:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
