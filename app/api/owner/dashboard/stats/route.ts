import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const filterType = searchParams.get('filterType') || 'month'

    // Set default date range if not provided (current month)
    let finalStartDate = startDate
    let finalEndDate = endDate
    
    if (!startDate || !endDate) {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      finalStartDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]
      finalEndDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
    }

    // Revenue in date range (paid bookings only)
    const monthlyRevenueResult = await query(`
      SELECT COALESCE(SUM(b.total_amount), 0) as revenue
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      WHERE c.owner_id = $1 
        AND b.payment_status = 'paid'
        AND DATE(b.created_at) >= $2
        AND DATE(b.created_at) <= $3
    `, [ownerId, finalStartDate, finalEndDate])

    // Total bookings in date range
    const totalBookingsResult = await query(`
      SELECT COUNT(*) as total
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      WHERE c.owner_id = $1
        AND DATE(b.created_at) >= $2
        AND DATE(b.created_at) <= $3
    `, [ownerId, finalStartDate, finalEndDate])

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

    // Revenue data for date range
    const revenueData = await query(`
      SELECT 
        DATE(b.created_at) as date,
        COALESCE(SUM(b.total_amount), 0) as revenue
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      WHERE c.owner_id = $1 
        AND b.payment_status = 'paid'
        AND DATE(b.created_at) >= $2
        AND DATE(b.created_at) <= $3
      GROUP BY DATE(b.created_at)
      ORDER BY date ASC
    `, [ownerId, finalStartDate, finalEndDate])

    // Booking patterns by hour for date range
    const hourlyData = await query(`
      SELECT 
        EXTRACT(HOUR FROM (b.start_time::time)) as hour,
        COUNT(*) as bookings
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      WHERE c.owner_id = $1
        AND DATE(b.created_at) >= $2
        AND DATE(b.created_at) <= $3
        AND b.status IN ('confirmed', 'completed')
      GROUP BY EXTRACT(HOUR FROM (b.start_time::time))
      ORDER BY hour
    `, [ownerId, finalStartDate, finalEndDate])

    // Format revenue data for chart based on filter type
    const chartData = [];
    const startDateObj = new Date(finalStartDate!)
    const endDateObj = new Date(finalEndDate!)
    
    if (filterType === 'day') {
      // Single day - show hourly breakdown if available, otherwise single point
      const dayData = revenueData.find(
<<<<<<< HEAD
        (d) => d.date.toISOString().split('T')[0] === finalStartDate
=======
        (d: any) => d.date.toISOString().split('T')[0] === nextDateStr
>>>>>>> main
      );
      
      chartData.push({
        day: startDateObj.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        revenue: dayData ? parseInt(dayData.revenue) : 0,
      });
    } else if (filterType === 'month') {
      // Month view - show daily breakdown
      for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayData = revenueData.find(
          (data) => data.date.toISOString().split('T')[0] === dateStr
        );
        
        chartData.push({
          day: d.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
          }),
          revenue: dayData ? parseInt(dayData.revenue) : 0,
        });
      }
    } else if (filterType === 'year') {
      // Year view - show monthly breakdown
      const monthlyData: { [key: string]: number } = {};
      
      revenueData.forEach((data) => {
        const date = new Date(data.date);
        const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + parseInt(data.revenue);
      });
      
      for (let month = 0; month < 12; month++) {
        const monthKey = `${month + 1}/${startDateObj.getFullYear()}`;
        chartData.push({
          day: `Tháng ${month + 1}`,
          revenue: monthlyData[monthKey] || 0,
        });
      }
    } else {
      // Range view - adaptive based on range size
      const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 31) {
        // Show daily if range is <= 31 days
        for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const dayData = revenueData.find(
            (data) => data.date.toISOString().split('T')[0] === dateStr
          );
          
          chartData.push({
            day: d.toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
            }),
            revenue: dayData ? parseInt(dayData.revenue) : 0,
          });
        }
      } else {
        // Show monthly for longer ranges
        const monthlyData: { [key: string]: number } = {};
        
        revenueData.forEach((data) => {
          const date = new Date(data.date);
          const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + parseInt(data.revenue);
        });
        
        const currentMonth = new Date(startDateObj);
        while (currentMonth <= endDateObj) {
          const monthKey = `${currentMonth.getMonth() + 1}/${currentMonth.getFullYear()}`;
          chartData.push({
            day: `${currentMonth.getMonth() + 1}/${currentMonth.getFullYear()}`,
            revenue: monthlyData[monthKey] || 0,
          });
          currentMonth.setMonth(currentMonth.getMonth() + 1);
        }
      }
    }

    // Format hourly data for chart
    const hourlyBookings = Array.from({ length: 24 }, (_, hour) => {
      const hourData = hourlyData.find((h: any) => parseInt(h.hour) === hour)
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
        revenueChart: chartData,
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
