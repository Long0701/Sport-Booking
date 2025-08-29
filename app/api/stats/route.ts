import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get total active courts
    const courtsResult = await query(`
      SELECT COUNT(*) as total_courts
      FROM courts
      WHERE is_active = true
    `)

    // Get total users
    const usersResult = await query(`
      SELECT COUNT(*) as total_users
      FROM users
    `)

    // Get total completed/confirmed bookings
    const bookingsResult = await query(`
      SELECT COUNT(*) as total_bookings
      FROM bookings
      WHERE status IN ('confirmed', 'completed')
    `)

    // Get average rating across all courts (where rating > 0)
    const ratingResult = await query(`
      SELECT COALESCE(AVG(rating), 0) as avg_rating
      FROM courts
      WHERE is_active = true AND rating > 0
    `)

    const stats = {
      totalCourts: parseInt(courtsResult[0].total_courts) || 0,
      totalUsers: parseInt(usersResult[0].total_users) || 0,
      totalBookings: parseInt(bookingsResult[0].total_bookings) || 0,
      averageRating: Math.round((parseFloat(ratingResult[0].avg_rating) || 0) * 10) / 10
    }

    // Format numbers for display
    const formatNumber = (num: number): string => {
      if (num >= 1000000) {
        return Math.floor(num / 100000) / 10 + 'M'
      } else if (num >= 1000) {
        return Math.floor(num / 100) / 10 + 'K'
      }
      return num.toString()
    }

    const formattedStats = {
      courts: {
        value: stats.totalCourts,
        display: formatNumber(stats.totalCourts),
        label: "Sân thể thao"
      },
      users: {
        value: stats.totalUsers,
        display: formatNumber(stats.totalUsers),
        label: "Người dùng"
      },
      bookings: {
        value: stats.totalBookings,
        display: formatNumber(stats.totalBookings),
        label: "Lượt đặt sân"
      },
      rating: {
        value: stats.averageRating,
        display: stats.averageRating > 0 ? `${stats.averageRating}★` : "0★",
        label: "Đánh giá"
      }
    }

    return NextResponse.json({
      success: true,
      data: formattedStats
    })

  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
