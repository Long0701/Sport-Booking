'use client'

import Header from "@/components/shared/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { formatRating } from "@/lib/utils"
import { Cloud, CloudRain, MapPin, Star, Sun } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from "next/link"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"

// Dynamic import for map to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/map-component'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Đang tải bản đồ...</div>
})

interface Court {
  _id: string
  name: string
  type: string
  address: string
  pricePerHour: number
  rating: number
  reviewCount: number
  images: string[]
  location: {
    coordinates: [string, string]
  }
  owner: {
    name: string
    phone: string
  }
}

// Function to map Vietnamese sport names to English values
const mapVietnameseToEnglish = (vietnameseName: string): string => {
  const sportMap: { [key: string]: string } = {
    'Bóng đá mini': 'football',
    'Cầu lông': 'badminton', 
    'Tennis': 'tennis',
    'Bóng rổ': 'basketball',
    'Bóng chuyền': 'volleyball',
    'Pickleball': 'pickleball'
  }
  return sportMap[vietnameseName] || 'all'
}

function SearchPageContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSport, setSelectedSport] = useState("all")
  const [selectedTime, setSelectedTime] = useState("all")
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [weather, setWeather] = useState<{
    current: {
      temp: number;
      feelsLike: number;
      condition: string;
      humidity: number;
      windSpeed: number;
      pressure: number;
      visibility: number;
      icon: string;
    };
    hourly: Array<{
      time: string;
      temp: number;
      condition: string;
      icon: string;
    }>;
    daily: Array<{
      day: string;
      temp: { min: number; max: number };
      condition: string;
      icon: string;
    }>;
  } | null>(null)
  const [page, setPage] = useState(1)
const [totalPages, setTotalPages] = useState(1)
const [loadingMore, setLoadingMore] = useState(false)
const [total, setTotal] = useState(0)
const [isInitialized, setIsInitialized] = useState(false)
const { user } = useAuth();
const searchParams = useSearchParams();

  // Read URL params on component mount
  useEffect(() => {
    const sportParam = searchParams.get('sport');
    if (sportParam) {
      const decodedSport = decodeURIComponent(sportParam);
      const englishSport = mapVietnameseToEnglish(decodedSport);
      setSelectedSport(englishSport);
    }
    setIsInitialized(true);
  }, [searchParams]);

  // Fetch courts from API only after initialization
  useEffect(() => {
    if (isInitialized) {
      fetchCourts()
      fetchWeather()
    }
  }, [selectedSport, searchQuery, isInitialized])

const fetchCourts = async (reset: boolean = true) => {
  try {
    if (reset) {
      setLoading(true)
      setPage(1)
    } else {
      setLoadingMore(true)
    }

    const params = new URLSearchParams()
    const limit = viewMode === 'list' ? 10 : 100
    params.append('limit', limit.toString())
    params.append('page', reset ? '1' : (page + 1).toString())

    if (selectedSport !== 'all') params.append('type', selectedSport)
    if (searchQuery) params.append('search', searchQuery)

    const response = await fetch(`/api/courts?${params}`)
    const data = await response.json()

    if (data.success) {
      if (reset) {
        setCourts(data.data)
      } else {
        setCourts(prev => [...prev, ...data.data])
      }
      setPage(reset ? 1 : page + 1)
      setTotalPages(data.pagination.pages)
      setTotal(data.pagination.total)

    }
  } catch (error) {
    console.error('Error fetching courts:', error)
  } finally {
    setLoading(false)
    setLoadingMore(false)
  }
}

  const fetchWeather = async () => {
    try {
      // Get user location or use default (Ho Chi Minh City)
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

  const getWeatherIcon = (condition: string) => {
    if (condition.includes('nắng') || condition.includes('sun')) {
      return <Sun className="h-4 w-4 text-yellow-500" />
    } else if (condition.includes('mưa') || condition.includes('rain')) {
      return <CloudRain className="h-4 w-4 text-blue-500" />
    } else {
      return <Cloud className="h-4 w-4 text-gray-500" />
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header></Header>

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-end">
            {/* <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🏟️</span>
              </div>
              <span className="text-xl font-bold">SportBooking</span>
            </Link> */}
            <div className="flex items-center space-x-4">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
                size="sm"
              >
                Danh sách
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "outline"}
                onClick={() => setViewMode("map")}
                size="sm"
              >
                Bản đồ
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Tìm kiếm sân theo tên hoặc địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn môn thể thao" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả môn</SelectItem>
                <SelectItem value="football">Bóng đá mini</SelectItem>
                <SelectItem value="badminton">Cầu lông</SelectItem>
                <SelectItem value="tennis">Tennis</SelectItem>
                <SelectItem value="basketball">Bóng rổ</SelectItem>
                <SelectItem value="volleyball">Bóng chuyền</SelectItem>
                <SelectItem value="pickleball">Pickleball</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Khung giờ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả giờ</SelectItem>
                <SelectItem value="morning">Sáng (6-12h)</SelectItem>
                <SelectItem value="afternoon">Chiều (12-18h)</SelectItem>
                <SelectItem value="evening">Tối (18-22h)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Weather Info */}
          {weather && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                {getWeatherIcon(weather.current?.condition || '')}
                <span className="text-sm font-medium">
                  Thời tiết hiện tại: {weather.current?.temp || 0}°C -{" "}
                  {weather.current?.condition || 'Không xác định'}
                </span>
                <span className="text-xs text-gray-600">
                  Độ ẩm: {weather.current?.humidity || 0}% | Gió:{" "}
                  {weather.current?.windSpeed || 0}km/h
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {viewMode === "list" ? (
          <div className="space-y-4  overflow-auto h-[calc(100vh-372px)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Tìm thấy {total} sân phù hợp
              </h2>
              {/* <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Bộ lọc
              </Button> */}
            </div>

            {loading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="flex">
                      <div className="w-48 h-32 bg-gray-200 rounded-l-lg"></div>
                      <div className="flex-1 p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4">
                {courts.map((court) => (
                  <Card
                    key={court._id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-72 h-48 md:h-44">
                        <img
                          src={
                            court.images[0] ||
                            "/placeholder.svg?height=200&width=400&query=sports court"
                          }
                          alt={court.name}
                          className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                        />
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {court.name}
                            </h3>
                            <Badge variant="secondary" className="mb-2">
                              {getSportTypeInVietnamese(court.type)}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-1 mb-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">
                                {formatRating(court.rating)}
                              </span>
                              {court.reviewCount > 0 && (
                                <span className="text-sm text-gray-500">
                                  ({court.reviewCount})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="text-sm">{court.address}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-green-600">
                              {court.pricePerHour.toLocaleString("vi-VN")}đ/giờ
                            </div>
                            <div className="text-sm text-gray-600">
                              Chủ sân: {court.owner.name}
                            </div>
                          </div>
                          {user ? (
                            <Link href={`/court/${court._id}`}>
                              <Button className="bg-green-600 hover:bg-green-700">
                                Đặt sân
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/auth/login`}>
                              <Button className="bg-green-600 hover:bg-green-700">
                                Đặt sân
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {page < totalPages && (
                  <div className="flex justify-center mt-4">
                    <Button
                      onClick={() => fetchCourts(false)}
                      disabled={loadingMore}
                    >
                      {loadingMore ? "Đang tải..." : "Xem thêm"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <MapComponent courts={courts} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-gray-500">Đang tải...</div>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
