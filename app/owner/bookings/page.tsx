'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { ArrowLeft, Search, MoreHorizontal, Check, X, Eye, Phone, MapPin, Clock, User, CalendarIcon, DollarSign, Filter } from 'lucide-react'
import Link from "next/link"
import { useAuth } from '@/contexts/AuthContext'

interface Booking {
  id: number
  user: {
    name: string
    email: string
    phone: string
  }
  court: {
    id: number
    name: string
    type: string
    address: string
    pricePerHour: number
  }
  date: string
  startTime: string
  endTime: string
  totalAmount: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  paymentStatus: 'pending' | 'paid' | 'refunded'
  paymentMethod?: string
  notes?: string
  createdAt: string
}

export default function OwnerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCourt, setFilterCourt] = useState("all")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [courts, setCourts] = useState<any[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchBookings()
      fetchCourts()
    }
  }, [user])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/owner/bookings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setBookings(data.data)
      } else {
        console.error('Error fetching bookings:', data.error)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourts = async () => {
    try {
      const response = await fetch(`/api/owner/courts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setCourts(data.data)
      }
    } catch (error) {
      console.error('Error fetching courts:', error)
    }
  }

  const updateBookingStatus = async (bookingId: number, status: string) => {
    try {
      const payment_status = status === 'confirmed' ? 'pending' : status === 'cancelled' ? 'refunded' : 'paid'
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status, payment_status })
      })

      const data = await response.json()

      if (data.success) {
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: status as any }
            : booking
        ))
        alert(`Đã ${status === 'confirmed' ? 'xác nhận' : status === 'cancelled' ? 'hủy' : 'cập nhật'} booking thành công!`)
      } else {
        alert('Có lỗi xảy ra khi cập nhật booking')
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      alert('Có lỗi xảy ra khi cập nhật booking')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Đã xác nhận</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Chờ xác nhận</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Đã hủy</Badge>
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Hoàn thành</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Đã thanh toán</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Chờ thanh toán</Badge>
      case 'refunded':
        return <Badge className="bg-gray-100 text-gray-800">Đã hoàn tiền</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getSportTypeInVietnamese = (type: string) => {
    const sportMap: { [key: string]: string } = {
      'football': 'Bóng đá mini',
      'badminton': 'Cầu lông',
      'tennis': 'Tennis',
      'basketball': 'Bóng rổ',
      'volleyball': 'Bóng chuyền',
      'pickleball': 'Pickleball'
    }
    return sportMap[type] || type
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.court.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.user.phone.includes(searchQuery)
    
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus
    const matchesCourt = filterCourt === 'all' || booking.court.id.toString() === filterCourt
    
    const matchesDate = !selectedDate || 
                       new Date(booking.date).toDateString() === selectedDate.toDateString()
    
    return matchesSearch && matchesStatus && matchesCourt && matchesDate
  })

  // Group bookings by status for tabs
  const pendingBookings = filteredBookings.filter(b => b.status === 'pending')
  const confirmedBookings = filteredBookings.filter(b => b.status === 'confirmed')
  const completedBookings = filteredBookings.filter(b => b.status === 'completed')
  const cancelledBookings = filteredBookings.filter(b => b.status === 'cancelled')

  if (!user || user.role !== 'owner') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Truy cập bị từ chối</h2>
            <p className="text-gray-600 mb-4">
              Bạn cần đăng nhập với tài khoản chủ sân để truy cập trang này.
            </p>
            <Link href="/auth/login">
              <Button className="bg-green-600 hover:bg-green-700">
                Đăng nhập
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold">{booking.court.name}</h3>
              <Badge variant="outline">{getSportTypeInVietnamese(booking.court.type)}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{booking.user.name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Phone className="h-4 w-4" />
                <span>{booking.user.phone}</span>
              </div>
              <div className="flex items-center space-x-1">
                <CalendarIcon className="h-4 w-4" />
                <span>{new Date(booking.date).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{booking.startTime} - {booking.endTime}</span>
              </div>
            </div>

            {booking.notes && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Ghi chú:</span> {booking.notes}
              </div>
            )}
          </div>

          <div className="flex flex-col md:items-end space-y-2">
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                {booking.totalAmount.toLocaleString('vi-VN')}đ
              </div>
              <div className="text-xs text-gray-500">
                Đặt: {new Date(booking.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {getStatusBadge(booking.status)}
              {getPaymentStatusBadge(booking.paymentStatus)}
            </div>

            <div className="flex items-center space-x-2">
              {booking.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Xác nhận
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Hủy
                  </Button>
                </>
              )}
              
              {booking.status === 'confirmed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateBookingStatus(booking.id, 'completed')}
                >
                  Hoàn thành
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    Xem chi tiết
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Phone className="h-4 w-4 mr-2" />
                    Gọi khách hàng
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/owner/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">📅</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">Lịch đặt sân</h1>
                  <p className="text-sm text-gray-600">{bookings.length} lượt đặt</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Bộ lọc</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tìm kiếm</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tên khách hàng, sân..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Trạng thái</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="pending">Chờ xác nhận</SelectItem>
                      <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                      <SelectItem value="completed">Hoàn thành</SelectItem>
                      <SelectItem value="cancelled">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Sân</label>
                  <Select value={filterCourt} onValueChange={setFilterCourt}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả sân</SelectItem>
                      {courts.map((court) => (
                        <SelectItem key={court.id} value={court.id.toString()}>
                          {court.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Chọn ngày</label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                  {selectedDate && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setSelectedDate(undefined)}
                    >
                      Xóa bộ lọc ngày
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Thống kê nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Chờ xác nhận</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {pendingBookings.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Đã xác nhận</span>
                  <Badge className="bg-green-100 text-green-800">
                    {confirmedBookings.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Hoàn thành</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {completedBookings.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Đã hủy</span>
                  <Badge className="bg-red-100 text-red-800">
                    {cancelledBookings.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">
                  Tất cả ({filteredBookings.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Chờ xác nhận ({pendingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="confirmed">
                  Đã xác nhận ({confirmedBookings.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Hoàn thành ({completedBookings.length})
                </TabsTrigger>
                <TabsTrigger value="cancelled">
                  Đã hủy ({cancelledBookings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="text-gray-400 mb-4">
                        <CalendarIcon className="h-16 w-16 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Không có lịch đặt nào
                        </h3>
                        <p className="text-gray-600">
                          {searchQuery || filterStatus !== 'all' || filterCourt !== 'all' || selectedDate
                            ? 'Thử thay đổi bộ lọc để xem kết quả khác'
                            : 'Chưa có ai đặt sân của bạn'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                {pendingBookings.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="text-gray-400">
                        <Clock className="h-16 w-16 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Không có booking chờ xác nhận
                        </h3>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pendingBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="confirmed" className="space-y-4">
                {confirmedBookings.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="text-gray-400">
                        <Check className="h-16 w-16 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Không có booking đã xác nhận
                        </h3>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {confirmedBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {completedBookings.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="text-gray-400">
                        <Check className="h-16 w-16 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Không có booking hoàn thành
                        </h3>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {completedBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cancelled" className="space-y-4">
                {cancelledBookings.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="text-gray-400">
                        <X className="h-16 w-16 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Không có booking bị hủy
                        </h3>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {cancelledBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
