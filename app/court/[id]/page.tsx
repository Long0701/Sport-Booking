'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/AuthContext"
import { Car, Clock, MapPin, Phone, ShowerHeadIcon as Shower, Star, Sun, Users, Wifi } from 'lucide-react'
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
interface Court {
  _id: string
  name: string
  type: string
  address: string
  pricePerHour: number
  rating: number
  reviewCount: number
  images: string[]
  description: string
  amenities: string[]
  phone: string
  openTime: string
  closeTime: string
  owner: {
    name: string
    phone: string
  }
  bookedSlots: string[]
}

export default function CourtDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [court, setCourt] = useState<Court | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [weather, setWeather] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [totalReviews, setTotalReviews] = useState<number>(0)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const { user } = useAuth();
  useEffect(() => {
    if (params.id) {
      fetchCourt()
      fetchWeather()
      fetchReviews()
    }
  }, [params.id])

  const fetchCourt = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courts/${params.id}`)
      const data = await response.json()
      if (data.success) {
        setCourt(data.data)
      } else {
        console.error('Court not found')
      }
    } catch (error) {
      console.error('Error fetching court:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWeather = async () => {
    try {
      // Use court location or default
      const lat = 10.7769
      const lon = 106.7009
      
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)
      const data = await response.json()

      if (data.success) {
        setWeather(data.data)
      }
    } catch (error) {
      console.error('Error fetching weather:', error)
    }
  }

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true)
      const response = await fetch(`/api/courts/${params.id}/reviews`)
      const data = await response.json()

      if (data.success) {
        setReviews(data.data);
        setTotalReviews(data.pagination.total);

      } else {
        console.error('Error fetching reviews:', data.error)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleBooking = async () => {
    if (!selectedSlot) {
      alert('Vui lòng chọn khung giờ')
      return
    }

    // Mock user ID - in real app, get from auth context
    const userId = user?.id;
      const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          courtId: court?._id,
          date: selectedDateStr,
          startTime: selectedSlot,
          endTime: `${parseInt(selectedSlot.split(':')[0]) + 1}:00:00`
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Đặt sân thành công!')
        router.push('/bookings')
      } else {
        alert(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Có lỗi xảy ra khi đặt sân')
    }
  }

const generateTimeSlots = () => {
  if (!court) return []

  const slots = []
  const openHour = parseInt(court.openTime.split(':')[0])
  const closeHour = parseInt(court.closeTime.split(':')[0])

const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`


  for (let hour = openHour; hour < closeHour; hour++) {
    const timeSlot = `${hour.toString().padStart(2, '0')}:00:00`
    const fullSlot = `${selectedDateStr}T${timeSlot}` // YYYY-MM-DDTHH:mm:ss

    slots.push({
      time: timeSlot,
      available: !court.bookedSlots.includes(fullSlot),
      price: court.pricePerHour
    })
  }

  return slots
}
  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi miễn phí':
      case 'wifi': 
        return <Wifi className="h-4 w-4" />
      case 'chỗ đậu xe':
      case 'parking': 
        return <Car className="h-4 w-4" />
      case 'vòi sen':
      case 'shower': 
        return <Shower className="h-4 w-4" />
      default: 
        return <Users className="h-4 w-4" />
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!court) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy sân</h1>
          <Link href="/search">
            <Button>Quay lại tìm kiếm</Button>
          </Link>
        </div>
      </div>
    )
  }

  const timeSlots = generateTimeSlots()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/search" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">🏟️</span>
            </div>
            <span className="text-xl font-bold">SportBooking</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Court Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start mb-4">
            <div>
              <div className="flex gap-6">
                <h1 className="text-2xl font-bold mb-2">{court.name}</h1>
              <Badge className="mb-2">{getSportTypeInVietnamese(court.type)}</Badge>
              </div>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{court.address}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{court.openTime} - {court.closeTime}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  <span>{court.phone}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1 mb-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-bold">{court.rating}</span>
                {court.reviewCount > 0 && (
                  <span className="text-gray-600">({court.reviewCount} đánh giá)</span>
                )}
              </div>
              <div className="text-2xl font-bold text-green-600">
                {court.pricePerHour.toLocaleString('vi-VN')}đ/giờ
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
            {court.images.map((image, index) => (
              <img
                key={index}
                src={image || "/placeholder.svg?height=200&width=300&query=sports court"}
                alt={`${court.name} ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="info" className="bg-white rounded-lg shadow-sm">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Thông tin</TabsTrigger>
                <TabsTrigger value="weather">Thời tiết</TabsTrigger>
                <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Mô tả</h3>
                    <p className="text-gray-600">{court.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Tiện ích</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {court.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          {getAmenityIcon(amenity)}
                          <span className="text-sm">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="weather" className="p-6">
                <div className="space-y-4">
                  {weather ? (
                    <>
                      <div className="flex items-center space-x-2 mb-4">
                        <Sun className="h-5 w-5 text-yellow-500" />
                        <span className="font-semibold">
                          Thời tiết hiện tại: {weather.current.temp}°C - {weather.current.condition}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {weather.forecast.map((item: any, index: number) => (
                          <Card key={index}>
                            <CardContent className="p-4 text-center">
                              <div className="font-semibold">{item.time}</div>
                              <div className="text-2xl my-2">
                                {item.condition.includes('nắng') ? "☀️" : 
                                 item.condition.includes('mưa') ? "🌧️" : "☁️"}
                              </div>
                              <div className="text-sm text-gray-600">{item.temp}°C</div>
                              <div className="text-xs text-gray-500">{item.condition}</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-500">Đang tải thông tin thời tiết...</div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="p-6">
                <div className="space-y-4">
                  {reviewsLoading ? (
                    <div className="text-center text-gray-500">Đang tải đánh giá...</div>
                  ) : reviews.length > 0 ? (
                    reviews.map((review) => (
                      <Card key={review._id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">{review.user.name}</span>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{review.rating}</span>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-2">{review.comment}</p>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center text-gray-500">Chưa có đánh giá nào</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
              {/* AI Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🤖</span>
                  <span>Gợi ý AI</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-800">💡 Khung giờ tốt nhất:</span>
                    <p className="text-blue-700">19:00 - Thời tiết mát mẻ, giá hợp lý</p>
                  </div>
                  {weather && weather.forecast.some((f: any) => f.condition.includes('mưa')) && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <span className="font-medium text-yellow-800">⚠️ Lưu ý:</span>
                      <p className="text-yellow-700">Có thể có mưa trong một số khung giờ</p>
                    </div>
                  )}
                  <div className="p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-green-800">⭐ Đánh giá cao:</span>
                    <p className="text-green-700">
                      Sân này được đánh giá {court.rating}/5 sao
                      {court.reviewCount > 0 && ` (${court.reviewCount} đánh giá)`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Đặt sân</CardTitle>
                <CardDescription>Chọn ngày và giờ phù hợp</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Chọn ngày</label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                   disabled={(date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // reset giờ về 00:00
    return date < today
  }}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Khung giờ</label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedSlot === slot.time ? "default" : "outline"}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.time)}
                        className="text-sm h-auto py-2"
                      >
                        <div className="text-center">
                          <div>{slot.time}</div>
                          <div className="text-xs">
                            {slot.price.toLocaleString('vi-VN')}đ
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
                
                {selectedSlot && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span>Tổng tiền:</span>
                      <span className="text-lg font-bold text-green-600">
                        {court.pricePerHour.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleBooking}
                    >
                      Đặt sân ngay
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

          
          </div>
        </div>
      </div>
    </div>
  )
}
