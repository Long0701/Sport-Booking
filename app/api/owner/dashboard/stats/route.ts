import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

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

    const ownerId = decoded.id

    // Get current month stats
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    // Monthly revenue (paid bookings only)
    const monthlyRevenueResult = await query(`
      SELECT COALESCE(SUM(b.total_amount), 0) as revenue
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      WHERE c.owner_id = $1 
        AND b.payment_status = 'paid'
        AND EXTRACT(MONTH FROM b.created_at) = $2
        AND EXTRACT(YEAR FROM b.created_at) = $3
    `, [ownerId, currentMonth, currentYear])

    // Total bookings this month
    const totalBookingsResult = await query(`
      SELECT COUNT(*) as total
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      WHERE c.owner_id = $1
        AND EXTRACT(MONTH FROM b.created_at) = $2
        AND EXTRACT(YEAR FROM b.created_at) = $3
    `, [ownerId, currentMonth, currentYear])

    // Average rating across all courts
    const avgRatingResult = await query(`
      SELECT COALESCE(AVG(rating), 0) as avg_rating
      FROM courts
      WHERE owner_id = $1 AND rating > 0
    `, [ownerId])

    // Occupancy rate calculation
    const occupancyResult = await query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_courts,
        COUNT(b.id) as total_bookings
      FROM courts c
      LEFT JOIN bookings b ON c.id = b.court_id 
        AND b.booking_date >= CURRENT_DATE - INTERVAL '30 days'
        AND b.status IN ('confirmed', 'completed')
      WHERE c.owner_id = $1
    `, [ownerId])

    // Calculate occupancy rate (assuming 12 hours per day, 30 days)
    const totalCourts = parseInt(occupancyResult[0].total_courts) || 1
    const totalBookings = parseInt(occupancyResult[0].total_bookings) || 0
    const maxPossibleBookings = totalCourts * 12 * 30 // 12 hours * 30 days
    const occupancyRate = maxPossibleBookings > 0 ? (totalBookings / maxPossibleBookings) * 100 : 0

    // Revenue for last 7 days
    const revenueData = await query(`
      SELECT 
        DATE(b.created_at) as date,
        COALESCE(SUM(b.total_amount), 0) as revenue
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      WHERE c.owner_id = $1 
        AND b.payment_status = 'paid'
        AND b.created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(b.created_at)
      ORDER BY date DESC
      LIMIT 7
    `, [ownerId])

    // Booking patterns by hour (last 30 days)
    const hourlyData = await query(`
      SELECT 
        EXTRACT(HOUR FROM (b.start_time::time)) as hour,
        COUNT(*) as bookings
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      WHERE c.owner_id = $1
        AND b.created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND b.status IN ('confirmed', 'completed')
      GROUP BY EXTRACT(HOUR FROM (b.start_time::time))
      ORDER BY hour
    `, [ownerId])

    // Format revenue data for chart
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
    
      // Lấy ngày +1 để so sánh với revenueData
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() - 1 );
    
      const nextDateStr = nextDate.toISOString().split('T')[0];
      const dayData = revenueData.find(
        (d) => d.date.toISOString().split('T')[0] === nextDateStr
      );
    
      // Format ngày hiện tại để hiển thị (dd/MM)
      const displayDate = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });
    
      last7Days.push({
        day: displayDate,
        revenue: dayData ? parseInt(dayData.revenue) : 0,
      });
    }

    // Format hourly data for chart
    const hourlyBookings = Array.from({ length: 24 }, (_, hour) => {
      const hourData = hourlyData.find(h => parseInt(h.hour) === hour)
      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        bookings: hourData ? parseInt(hourData.bookings) : 0
      }
    }).filter(h => h.hour >= '06:00' && h.hour <= '23:00') // Only show business hours

    return NextResponse.json({
      success: true,
      data: {
        monthlyRevenue: parseInt(monthlyRevenueResult[0].revenue) || 0,
        totalBookings: parseInt(totalBookingsResult[0].total) || 0,
        averageRating: parseFloat(avgRatingResult[0].avg_rating).toFixed(1) || '0.0',
        occupancyRate: Math.round(occupancyRate) || 0,
        revenueChart: last7Days,
        hourlyChart: hourlyBookings
      }
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
