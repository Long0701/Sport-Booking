import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await requireAdmin(request)

    // Get stats in parallel for better performance
    const [
      usersStats,
      ownersStats, 
      courtsStats,
      bookingsStats,
      revenueStats,
      registrationStats
    ] = await Promise.all([
      // Users stats
      query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_30d
        FROM users
      `),
      
      // Owners stats  
      query(`
        SELECT 
          COUNT(*) as total_owners,
          COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_owners,
          COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending_owners
        FROM users WHERE role = 'owner'
      `),
      
      // Courts stats
      query(`
        SELECT 
          COUNT(*) as total_courts,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_courts,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_courts_30d,
          ROUND(AVG(rating), 2) as average_rating
        FROM courts
      `),
      
      // Bookings stats
      query(`
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_bookings_30d
        FROM bookings
      `),
      
      // Revenue stats (last 30 days)
      query(`
        SELECT 
          COALESCE(SUM(total_amount), 0) as total_revenue_30d,
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as paid_revenue_30d,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_bookings_30d
        FROM bookings 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      `),
      
      // Registration requests stats
      query(`
        SELECT 
          COUNT(*) as total_registration_requests,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_requests_7d
        FROM owner_registrations
      `)
    ])

    // Get recent activities
    const recentActivities = await query(`
      (
        SELECT 
          'user_registration' as type,
          CONCAT(name, ' đã đăng ký tài khoản') as description,
          created_at as activity_time
        FROM users 
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 3
      )
      UNION ALL
      (
        SELECT 
          'court_registration' as type,
          CONCAT(name, ' đã đăng ký sân mới') as description,
          created_at as activity_time
        FROM courts 
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 3
      )
      UNION ALL
      (
        SELECT 
          'owner_registration' as type,
          CONCAT(business_name, ' đã gửi đơn đăng ký làm chủ sân') as description,
          created_at as activity_time
        FROM owner_registrations 
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 3
      )
      ORDER BY activity_time DESC
      LIMIT 10
    `)

    // Get top performing courts
    const topCourts = await query(`
      SELECT 
        c.id,
        c.name,
        c.type,
        c.rating,
        c.review_count,
        COUNT(b.id) as booking_count,
        COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_amount ELSE 0 END), 0) as revenue
      FROM courts c
      LEFT JOIN bookings b ON c.id = b.court_id 
        AND b.created_at >= CURRENT_DATE - INTERVAL '30 days'
      WHERE c.is_active = true
      GROUP BY c.id, c.name, c.type, c.rating, c.review_count
      ORDER BY booking_count DESC, revenue DESC
      LIMIT 5
    `)

    const dashboardData = {
      stats: {
        users: usersStats[0],
        owners: ownersStats[0], 
        courts: courtsStats[0],
        bookings: bookingsStats[0],
        revenue: revenueStats[0],
        registrations: registrationStats[0]
      },
      recentActivities,
      topCourts,
      admin: {
        name: admin.name,
        email: admin.email
      }
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error: any) {
    console.error('Admin dashboard error:', error)
    
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
