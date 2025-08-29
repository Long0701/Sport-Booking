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
    owner?: {
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
        return <Badge className="bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 border-emerald-200 shadow-sm">✓ Đã xác nhận</Badge>
      case 'pending':
        return <Badge className="bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 border-amber-200 shadow-sm">⏳ Chờ xác nhận</Badge>
      case 'cancelled':
        return <Badge className="bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-red-200 shadow-sm">✕ Đã hủy</Badge>
      case 'completed':
        return <Badge className="bg-gradient-to-r from-cyan-100 to-cyan-200 text-cyan-700 border-cyan-200 shadow-sm">🏆 Hoàn thành</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-gradient-to-r from-teal-100 to-teal-200 text-teal-700 border-teal-200 shadow-sm">💳 Đã thanh toán</Badge>
      case 'pending':
        return <Badge className="bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border-orange-200 shadow-sm">⏱️ Chờ thanh toán</Badge>
      case 'refunded':
        return <Badge className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-200 shadow-sm">💰 Đã hoàn tiền</Badge>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Floating Orbs */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '6s' }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '2s', animationDuration: '8s' }}></div>
          
          {/* Floating Icons */}
          <div className="absolute top-16 right-16 text-4xl animate-pulse opacity-20" style={{ animationDelay: '1s' }}>📅</div>
          <div className="absolute bottom-16 left-16 text-3xl animate-pulse opacity-20" style={{ animationDelay: '3s' }}>🏟️</div>
        </div>

        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl relative z-10">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent">
              Vui lòng đăng nhập
            </h2>
            <p className="text-emerald-100 mb-6">
              Bạn cần đăng nhập để xem lịch sử đặt sân.
            </p>
            <Link href="/auth/login">
              <Button className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-6 shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105">
                Đăng nhập
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="group bg-white/70 backdrop-blur-sm border border-white/30 shadow-xl hover:shadow-2xl hover:bg-white/80 transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-400/25 transition-shadow duration-300">
                <span className="text-white text-lg">🏟️</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-800 group-hover:text-emerald-700 transition-colors">
                  {booking.court.name}
                </h3>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 transition-colors">
                  {getSportTypeInVietnamese(booking.court.type)}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2 text-gray-600 group-hover:text-gray-700 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400/20 to-cyan-500/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-cyan-600" />
                </div>
                <span className="truncate font-medium">{booking.court.address}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 group-hover:text-gray-700 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-400/20 to-teal-500/10 rounded-lg flex items-center justify-center">
                  <Phone className="h-4 w-4 text-teal-600" />
                </div>
                <span className="font-medium">Chủ sân: {booking.court.owner?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 group-hover:text-gray-700 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400/20 to-emerald-500/10 rounded-lg flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="font-medium">{new Date(booking.date).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 group-hover:text-gray-700 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400/20 to-cyan-500/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-4 w-4 text-cyan-600" />
                </div>
                <span className="font-medium">{booking.startTime} - {booking.endTime}</span>
              </div>
            </div>

            {booking.notes && (
              <div className="p-3 bg-gradient-to-r from-emerald-50/50 to-cyan-50/50 rounded-lg border border-emerald-100/50 backdrop-blur-sm">
                <span className="text-sm font-semibold text-emerald-700">Ghi chú:</span>{" "}
                <span className="text-sm text-gray-700">{booking.notes}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col lg:items-end space-y-4 lg:ml-6">
            <div className="text-center lg:text-right">
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {booking.totalAmount.toLocaleString('vi-VN')}đ
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Đặt: {new Date(booking.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center lg:justify-end">
              {getStatusBadge(booking.status)}
              {getPaymentStatusBadge(booking.paymentStatus)}
              {booking.hasReview && (
                <Badge className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border-purple-200 shadow-sm">
                  <Star className="w-3 h-3 mr-1" />
                  Đã đánh giá
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2 justify-center lg:justify-end">
              <Link href={`/court/${booking.court.id}`}>
                <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-emerald-500/25 transition-all duration-300">
                  <Eye className="h-4 w-4 mr-1" />
                  Xem sân
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-white/60 transition-all duration-300 border border-white/30">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {booking.court.owner?.phone && (
                    <DropdownMenuItem onClick={() => window.open(`tel:${booking.court.owner?.phone}`)}>
                      <Phone className="h-4 w-4 mr-2" />
                      Gọi chủ sân
                    </DropdownMenuItem>
                  )}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '10s' }}></div>
        <div className="absolute bottom-40 right-20 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '3s', animationDuration: '8s' }}></div>
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-teal-500/10 rounded-full blur-xl animate-bounce" style={{ animationDelay: '6s', animationDuration: '12s' }}></div>
        
        {/* Floating Sports Icons */}
        <div className="absolute top-32 right-32 text-5xl animate-spin opacity-10" style={{ animationDuration: '30s' }}>📅</div>
        <div className="absolute bottom-32 left-32 text-4xl animate-pulse opacity-10" style={{ animationDelay: '2s' }}>🏟️</div>
        <div className="absolute top-2/3 right-10 text-3xl animate-spin opacity-10" style={{ animationDelay: '4s', animationDuration: '25s' }}>⚽</div>
        <div className="absolute bottom-1/4 right-1/3 text-3xl animate-pulse opacity-10" style={{ animationDelay: '1s' }}>🏀</div>
        
        {/* Particle System */}
        <div className="absolute top-1/3 left-1/2 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-30" style={{ animationDelay: '0s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-ping opacity-40" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-3/4 left-1/4 w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping opacity-35" style={{ animationDelay: '4s' }}></div>
      </div>

      <Header />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white overflow-hidden">
        {/* Hero Background Elements */}
        <div className="absolute inset-0">
          {/* Large Floating Orbs */}
          <div className="absolute top-10 left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '12s' }}></div>
          <div className="absolute bottom-10 right-10 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '4s', animationDuration: '10s' }}></div>
          <div className="absolute top-1/2 right-20 w-28 h-28 bg-teal-500/10 rounded-full blur-xl animate-bounce" style={{ animationDelay: '8s', animationDuration: '14s' }}></div>
          
          {/* Hero Sports Icons */}
          <div className="absolute top-16 right-16 text-6xl animate-spin opacity-20" style={{ animationDuration: '40s' }}>📋</div>
          <div className="absolute bottom-20 left-20 text-5xl animate-pulse opacity-20" style={{ animationDelay: '2s' }}>📅</div>
          <div className="absolute top-1/3 left-1/4 text-4xl animate-spin opacity-20" style={{ animationDelay: '6s', animationDuration: '35s' }}>🏟️</div>
          <div className="absolute bottom-1/3 right-1/3 text-4xl animate-pulse opacity-20" style={{ animationDelay: '3s' }}>⏰</div>
          
          {/* Hero Particles */}
          <div className="absolute top-1/4 right-1/2 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-40" style={{ animationDelay: '0s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '3s' }}></div>
          <div className="absolute top-2/3 right-1/4 w-2.5 h-2.5 bg-teal-400 rounded-full animate-ping opacity-45" style={{ animationDelay: '6s' }}></div>
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="text-center space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-emerald-200 text-sm font-medium animate-fade-in">
              📅 Quản lý lịch đặt sân
              <div className="ml-2 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Sân đã đặt
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-emerald-100 max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Theo dõi và quản lý tất cả các lịch đặt sân của bạn một cách dễ dàng
            </p>

            {/* Stats Highlights */}
            <div className="flex justify-center space-x-8 md:space-x-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-emerald-100">
                  {upcomingBookings.length}
                </div>
                <div className="text-emerald-200 text-sm">Sắp tới</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-cyan-100">
                  {pastBookings.length}
                </div>
                <div className="text-cyan-200 text-sm">Đã qua</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-teal-100">
                  {bookings.filter(b => b.status === 'completed').length}
                </div>
                <div className="text-teal-200 text-sm">Hoàn thành</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Filters */}
        <Card className="mb-8 bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative group">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-emerald-400 group-hover:text-emerald-500 transition-colors" />
                  <Input
                    placeholder="Tìm kiếm theo tên sân hoặc địa chỉ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/50 border-white/30 focus:border-emerald-400 focus:ring-emerald-400/20 hover:bg-white/70 transition-all duration-300"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48 bg-white/50 border-white/30 hover:bg-white/70 focus:border-emerald-400 focus:ring-emerald-400/20 transition-all duration-300">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border border-white/20">
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
        <Tabs defaultValue="upcoming" className="space-y-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <TabsList className="grid w-full grid-cols-3 bg-white/60 backdrop-blur-sm border border-white/30 p-1 rounded-xl">
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white font-medium transition-all duration-300">
              Sắp tới ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white font-medium transition-all duration-300">
              Đã qua ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white font-medium transition-all duration-300">
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
              <Card className="bg-white/60 backdrop-blur-sm border border-white/30 shadow-lg">
                <CardContent className="p-12 text-center">
                  <div className="space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                      <Calendar className="h-10 w-10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-gray-800">
                        Không có lịch đặt sắp tới
                      </h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        Bạn chưa có lịch đặt sân nào sắp tới. Hãy tìm và đặt sân yêu thích của bạn ngay!
                      </p>
                    </div>
                    <Link href="/search">
                      <Button className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105">
                        🏟️ Đặt sân ngay
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
          <Card className="mt-8 bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 text-white relative overflow-hidden shadow-2xl animate-fade-in" style={{ animationDelay: '0.8s' }}>
            {/* Stats Background Elements */}
            <div className="absolute inset-0">
              <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-4 left-4 w-20 h-20 bg-emerald-300/10 rounded-full blur-xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyan-400/5 rounded-full blur-3xl"></div>
            </div>
            
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl font-bold flex items-center">
                📊 Thống kê tổng quan
                <div className="ml-3 w-8 h-px bg-gradient-to-r from-emerald-300 to-transparent"></div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="group">
                  <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-white/30 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-emerald-400/25 transition-shadow duration-300">
                      <span className="text-2xl">🏆</span>
                    </div>
                    <div className="text-3xl font-bold text-emerald-100 mb-1">
                      {bookings.filter(b => b.status === 'completed').length}
                    </div>
                    <div className="text-emerald-200 text-sm font-medium">Đã hoàn thành</div>
                  </div>
                </div>
                
                <div className="group">
                  <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-white/30 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-amber-400/25 transition-shadow duration-300">
                      <span className="text-2xl">⏰</span>
                    </div>
                    <div className="text-3xl font-bold text-amber-100 mb-1">
                      {bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length}
                    </div>
                    <div className="text-amber-200 text-sm font-medium">Sắp tới</div>
                  </div>
                </div>
                
                <div className="group">
                  <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-white/30 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-red-400/25 transition-shadow duration-300">
                      <span className="text-2xl">❌</span>
                    </div>
                    <div className="text-3xl font-bold text-red-100 mb-1">
                      {bookings.filter(b => b.status === 'cancelled').length}
                    </div>
                    <div className="text-red-200 text-sm font-medium">Đã hủy</div>
                  </div>
                </div>
                
                <div className="group">
                  <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-white/30 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-cyan-400/25 transition-shadow duration-300">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-cyan-100 mb-1">
                      {bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString('vi-VN')}đ
                    </div>
                    <div className="text-cyan-200 text-sm font-medium">Tổng chi tiêu</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md border border-white/30">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                <Star className="w-4 h-4 text-white" />
              </div>
              Đánh giá sân
            </DialogTitle>
            <DialogDescription className="text-gray-600">
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
              className="border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </Button>
            <Button
              onClick={submitReview}
              disabled={submittingReview || !reviewData.comment.trim()}
              className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-[1.02]"
            >
              {submittingReview ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Đang gửi...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4" />
                  <span>Gửi đánh giá</span>
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  )
}
