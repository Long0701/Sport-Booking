'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from '@/contexts/AuthContext'
import Header from "@/components/shared/header"
import Footer from "@/components/shared/footer"
import { ArrowLeft, Calendar, Clock, Eye, MapPin, MessageCircle, MoreHorizontal, Phone, Search, Star, X } from 'lucide-react'
import Link from "next/link"
import { useEffect, useState } from "react"

interface Booking {
  _id: string
  court: {
    id: number,
    name: string
    type: string
    address: string
    pricePerHour: number
    owner: {
      name: string
      phone: string
    }
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
  hasReview?: boolean
}

interface ReviewData {
  rating: number
  comment: string
}

export default function UserBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [reviewData, setReviewData] = useState<ReviewData>({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [user])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/bookings?userId=${user?.id}`, {
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

  const cancelBooking = async (bookingId: string) => {
    try {
      setCancellingBooking(bookingId)
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      })

      const data = await response.json()

      if (data.success) {
        setBookings(prev => prev.map(booking => 
          booking._id === bookingId 
            ? { ...booking, status: 'cancelled' as any }
            : booking
        ))
        alert('Đã hủy booking thành công!')
      } else {
        alert('Có lỗi xảy ra khi hủy booking')
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Có lỗi xảy ra khi hủy booking')
    } finally {
      setCancellingBooking(null)
    }
  }

  const handleReviewClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setReviewData({ rating: 5, comment: '' })
    setReviewDialogOpen(true)
  }

  const submitReview = async () => {
    if (!selectedBooking || !reviewData.comment.trim()) {
      alert('Vui lòng nhập nhận xét')
      return
    }

    try {
      setSubmittingReview(true)
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: user?.id,
          courtId: selectedBooking.court.id,
          bookingId: selectedBooking._id,
          rating: reviewData.rating,
          comment: reviewData.comment
        })
      })

      const data = await response.json()

      if (data.success) {
        // Update booking to mark as reviewed
        setBookings(prev => prev.map(booking => 
          booking._id === selectedBooking._id 
            ? { ...booking, hasReview: true }
            : booking
        ))
        
        setReviewDialogOpen(false)
        setSelectedBooking(null)
        setReviewData({ rating: 5, comment: '' })
        alert('Đánh giá thành công!')
      } else {
        alert(data.error || 'Có lỗi xảy ra khi đánh giá')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Có lỗi xảy ra khi đánh giá')
    } finally {
      setSubmittingReview(false)
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

  const canCancelBooking = (booking: Booking) => {
    const bookingDateTime = new Date(`${booking.date}T${booking.startTime}`)
    const now = new Date()
    const timeDiff = bookingDateTime.getTime() - now.getTime()
    const hoursDiff = timeDiff / (1000 * 3600)
    
    return booking.status === 'pending' || (booking.status === 'confirmed' && hoursDiff > 2)
  }

  const canReviewBooking = (booking: Booking) => {
    return booking.status === 'completed' && !booking.hasReview
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.court.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.court.address.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  // Group bookings by status for tabs
  const upcomingBookings = filteredBookings.filter(b => 
    (b.status === 'pending' || b.status === 'confirmed') 
  )
  const pastBookings = filteredBookings.filter(b => 
    b.status === 'completed' || 
    (b.status === 'cancelled') ||
    ((b.status === 'pending' || b.status === 'confirmed') && new Date(`${b.date}T${b.startTime}`) <= new Date())
  )

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Vui lòng đăng nhập</h2>
            <p className="text-gray-600 mb-4">
              Bạn cần đăng nhập để xem lịch sử đặt sân.
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
                <MapPin className="h-4 w-4" />
                <span className="truncate">{booking.court.address}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Phone className="h-4 w-4" />
                <span>Chủ sân: {booking.court.name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
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
              {booking.hasReview && (
                <Badge className="bg-purple-100 text-purple-800">Đã đánh giá</Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Link href={`/court/${booking.court.id}`}>
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-1" />
                  Xem sân
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.open(`tel:${booking.court.owner.phone}`)}>
                    <Phone className="h-4 w-4 mr-2" />
                    Gọi chủ sân
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Nhắn tin
                  </DropdownMenuItem>
                  {canReviewBooking(booking) && (
                    <DropdownMenuItem onClick={() => handleReviewClick(booking)}>
                      <Star className="h-4 w-4 mr-2" />
                      Đánh giá
                    </DropdownMenuItem>
                  )}
                  {booking.hasReview && (
                    <DropdownMenuItem disabled>
                      <Star className="h-4 w-4 mr-2 text-purple-500" />
                      Đã đánh giá
                    </DropdownMenuItem>
                  )}
                  {canCancelBooking(booking) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <X className="h-4 w-4 mr-2" />
                          Hủy đặt sân
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xác nhận hủy đặt sân</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bạn có chắc chắn muốn hủy đặt sân "{booking.court.name}" vào ngày {new Date(booking.date).toLocaleDateString('vi-VN')} lúc {booking.startTime}?
                            {booking.status === 'confirmed' && (
                              <div className="mt-2 p-2 bg-yellow-50 rounded text-yellow-800 text-sm">
                                ⚠️ Lưu ý: Hủy sân đã xác nhận có thể bị tính phí hủy.
                              </div>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Không</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => cancelBooking(booking._id)}
                            disabled={cancellingBooking === booking._id}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {cancellingBooking === booking._id ? 'Đang hủy...' : 'Xác nhận hủy'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
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
      <Header />

      <div className="container mx-auto px-4 py-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm theo tên sân hoặc địa chỉ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Trạng thái" />
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
          </CardContent>
        </Card>

        {/* Bookings List */}
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">
              Sắp tới ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Đã qua ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              Tất cả ({filteredBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
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
            ) : upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <Calendar className="h-16 w-16 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Không có lịch đặt sắp tới
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Bạn chưa có lịch đặt sân nào sắp tới
                    </p>
                    <Link href="/search">
                      <Button className="bg-green-600 hover:bg-green-700">
                        Đặt sân ngay
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <BookingCard key={booking._id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastBookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-gray-400">
                    <Clock className="h-16 w-16 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Chưa có lịch sử đặt sân
                    </h3>
                    <p className="text-gray-600">
                      Bạn chưa có lịch sử đặt sân nào
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <BookingCard key={booking._id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>

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
                    <Calendar className="h-16 w-16 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchQuery || filterStatus !== 'all' 
                        ? 'Không tìm thấy booking nào' 
                        : 'Chưa có lịch sử đặt sân'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchQuery || filterStatus !== 'all'
                        ? 'Thử thay đổi bộ lọc để xem kết quả khác'
                        : 'Bắt đầu đặt sân để xem lịch sử tại đây'}
                    </p>
                    {!searchQuery && filterStatus === 'all' && (
                      <Link href="/search">
                        <Button className="bg-green-600 hover:bg-green-700">
                          Đặt sân ngay
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <BookingCard key={booking._id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        {bookings.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Thống kê</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {bookings.filter(b => b.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-600">Đã hoàn thành</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length}
                  </div>
                  <div className="text-sm text-gray-600">Sắp tới</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {bookings.filter(b => b.status === 'cancelled').length}
                  </div>
                  <div className="text-sm text-gray-600">Đã hủy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString('vi-VN')}đ
                  </div>
                  <div className="text-sm text-gray-600">Tổng chi tiêu</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đánh giá sân</DialogTitle>
            <DialogDescription>
              Chia sẻ trải nghiệm của bạn về sân "{selectedBooking?.court.name}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Rating Stars */}
            <div>
              <label className="text-sm font-medium mb-2 block">Đánh giá</label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= reviewData.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  ({reviewData.rating} sao)
                </span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="text-sm font-medium mb-2 block">Nhận xét</label>
              <Textarea
                placeholder="Chia sẻ trải nghiệm của bạn về sân này..."
                value={reviewData.comment}
                onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Booking Info */}
            {selectedBooking && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="font-medium mb-1">{selectedBooking.court.name}</div>
                <div className="text-gray-600">
                  {new Date(selectedBooking.date).toLocaleDateString('vi-VN')} • {selectedBooking.startTime} - {selectedBooking.endTime}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={submittingReview}
            >
              Hủy
            </Button>
            <Button
              onClick={submitReview}
              disabled={submittingReview || !reviewData.comment.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  )
}
