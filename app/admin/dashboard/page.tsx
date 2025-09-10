'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  UserCheck, 
  Building, 
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Star,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  users: {
    total_users: number
    regular_users: number
    new_users_30d: number
  }
  owners: {
    total_owners: number
    approved_owners: number
    pending_owners: number
  }
  courts: {
    total_courts: number
    active_courts: number
    new_courts_30d: number
    average_rating: number
  }
  bookings: {
    total_bookings: number
    confirmed_bookings: number
    pending_bookings: number
    new_bookings_30d: number
  }
  revenue: {
    total_revenue_30d: number
    paid_revenue_30d: number
    paid_bookings_30d: number
  }
  registrations: {
    total_registration_requests: number
    pending_requests: number
    approved_requests: number
    rejected_requests: number
    new_requests_7d: number
  }
}

interface Activity {
  type: string
  description: string
  activity_time: string
}

interface TopCourt {
  id: number
  name: string
  type: string
  rating: number
  review_count: number
  booking_count: number
  revenue: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [topCourts, setTopCourts] = useState<TopCourt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.href = '/auth/login'
        return
      }

      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setStats(data.data.stats)
        setActivities(data.data.recentActivities)
        setTopCourts(data.data.topCourts)
      } else {
        setError(data.error)
      }
    } catch (error) {
      console.error('Dashboard error:', error)
      setError('Lỗi tải dữ liệu dashboard')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchDashboardData}>Thử lại</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Quản trị</h1>
        <p className="text-gray-600">Tổng quan hoạt động hệ thống</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users.total_users}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.users.new_users_30d} người dùng mới (30 ngày)
            </p>
          </CardContent>
        </Card>

        {/* Owners Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chủ sân</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.owners.approved_owners}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.owners.pending_owners} đang chờ duyệt
            </p>
          </CardContent>
        </Card>

        {/* Courts Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sân thể thao</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.courts.active_courts}</div>
            <p className="text-xs text-muted-foreground">
              Đánh giá trung bình: {stats?.courts.average_rating}⭐
            </p>
          </CardContent>
        </Card>

        {/* Revenue Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu (30d)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.revenue.paid_revenue_30d || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.revenue.paid_bookings_30d} booking đã thanh toán
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Registration Requests Alert */}
      {stats && stats.registrations.pending_requests > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="font-medium text-orange-800">
                    Có {stats.registrations.pending_requests} đơn đăng ký chủ sân chờ duyệt
                  </h3>
                  <p className="text-sm text-orange-600">
                    {stats.registrations.new_requests_7d} đơn mới trong 7 ngày qua
                  </p>
                </div>
              </div>
              <Link href="/admin/owner-registrations">
                <Button variant="outline" size="sm">
                  Xem ngay
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Hoạt động gần đây</span>
            </CardTitle>
            <CardDescription>
              Các hoạt động mới nhất trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-gray-900">{activity.description}</p>
                      <p className="text-gray-500 text-xs">
                        {formatDate(activity.activity_time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Chưa có hoạt động nào</p>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Courts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Sân hot nhất</span>
            </CardTitle>
            <CardDescription>
              Top 5 sân có nhiều booking nhất (30 ngày)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topCourts.length > 0 ? (
              <div className="space-y-3">
                {topCourts.map((court, index) => (
                  <div key={court.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-medium text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{court.name}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {court.type}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-gray-600">{court.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{court.booking_count} booking</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(court.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Chưa có dữ liệu</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
          <CardDescription>
            Các tính năng quản trị thường dùng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/owner-registrations">
              <Button variant="outline" className="flex items-center space-x-2">
                <UserCheck className="h-4 w-4" />
                <span>Duyệt chủ sân</span>
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Quản lý users</span>
              </Button>
            </Link>
            <Link href="/admin/courts">
              <Button variant="outline" className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Quản lý sân</span>
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Xem báo cáo</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
