'use client'

import Header from "@/components/shared/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Cloud, CloudRain, MapPin, Star, Sun, Sparkles, Crown, RefreshCw, Zap } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from "next/link"
import { useEffect, useState } from "react"
import { formatRating } from "@/lib/utils"

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

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSport, setSelectedSport] = useState("all")
  const [selectedSportAI, setSelectedSportAI] = useState("all")
  const [selectedTime, setSelectedTime] = useState("all")
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [weather, setWeather] = useState<any>(null)
  const [page, setPage] = useState(1)
const [totalPages, setTotalPages] = useState(1)
const [loadingMore, setLoadingMore] = useState(false)
const [total, setTotal] = useState(0)
  const [aiCourtSuggestions, setAiCourtSuggestions] = useState<any[] | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [lastSelectedSportAI, setLastSelectedSportAI] = useState("all")
  const TOP_N = 5

  // Fetch courts from API
  useEffect(() => {
    fetchCourts()
    fetchWeather()
  }, [selectedSport, searchQuery])

  // Auto-generate AI suggestions when sport type changes
  useEffect(() => {
    if (selectedSportAI !== lastSelectedSportAI && selectedSportAI !== 'all' && courts.length > 0) {
      setLastSelectedSportAI(selectedSportAI)
      generateAICourtSuggestions()
    }
  }, [selectedSportAI, courts])

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

  const buildCourtPayloadForAI = async (list: Court[]) => {
    // fetch per-court weather by address and court details (for amenities)
    const items = await Promise.all(list.slice(0, 10).map(async (c) => {
      try {
        const [wRes, dRes] = await Promise.all([
          fetch(`/api/weather?address=${encodeURIComponent(c.address)}`),
          fetch(`/api/courts/${c._id}`)
        ])
        const [wData, dData] = await Promise.all([wRes.json(), dRes.json()])
        const amenities: string[] = dData?.success ? (dData.data?.amenities || []) : []
        return { court: c, weather: wData.success ? wData.data : null, amenities }
      } catch {
        return { court: c, weather: null, amenities: [] as string[] }
      }
    }))
    return items
  }

  const generateAICourtSuggestions = async () => {
    try {
      setAiLoading(true)
      setAiCourtSuggestions(null)
      if (selectedSportAI === 'all') {
        setAiLoading(false)
        return
      }
      // Filter courts by AI sport selection
      const pool = courts.filter(c => selectedSportAI === 'all' ? true : c.type === selectedSportAI)
      const items = await buildCourtPayloadForAI(pool)

      // console.log("items", items)
      const body = {
        mode: 'rank-courts',
        selectedDate: new Date().toISOString().split('T')[0],
        courtsWithWeather: items.map(({ court, weather, amenities }) => ({
          courtData: {
            _id: court._id,
            name: court.name,
            type: court.type,
            address: court.address,
            price: court.pricePerHour,
            rating: court.rating,
            amenities
          },
          // weatherData: weather
        }))
      }
      const res = await fetch('/api/ai-suggestions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.success) {
        // enrich with listing info (image, price)
        const idToCourt: Record<string, Court> = Object.fromEntries(courts.map(c => [c._id, c]))
        const enriched = (data.rankings || []).map((r: any) => ({
          ...r,
          image: idToCourt[r.courtId]?.images?.[0] || null,
          pricePerHour: idToCourt[r.courtId]?.pricePerHour,
          address: idToCourt[r.courtId]?.address
        }))
        setAiCourtSuggestions(enriched)
      }
    } catch (e) {
      console.error('AI court suggestion error', e)
    } finally {
      setAiLoading(false)
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
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                size="sm"
              >
                Danh sách
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                onClick={() => setViewMode('map')}
                size="sm"
              >
                Bản đồ
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 overflow-auto h-[calc(100vh-160px)]">
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
                {getWeatherIcon(weather.current.condition)}
                <span className="text-sm font-medium">
                  Thời tiết hiện tại: {weather.current.temp}°C - {weather.current.condition}
                </span>
                <span className="text-xs text-gray-600">
                  Độ ẩm: {weather.current.humidity}% | Gió: {weather.current.windSpeed}km/h
                </span>
              </div>
            </div>
          )}
        </div>

        {/* AI Suggestions for Courts - Redesigned */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-sm p-6 mb-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Gợi ý AI thông minh</h3>
                <p className="text-sm text-gray-600">Phân tích thời tiết, đánh giá và tiện ích để đề xuất sân phù hợp nhất</p>
              </div>
            </div>
          </div>

          {/* Sport Selection with Auto-Generate */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Select value={selectedSportAI} onValueChange={setSelectedSportAI}>
                <SelectTrigger className="w-full">
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
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                size="sm" 
                onClick={generateAICourtSuggestions} 
                disabled={aiLoading || courts.length === 0 || selectedSportAI === 'all'}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Tạo gợi ý mới
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Status Messages */}
          {selectedSportAI === 'all' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Vui lòng chọn môn thể thao để AI đề xuất sân phù hợp nhất
                </span>
            </div>
          )}

          {/* Loading State */}
          {aiLoading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-purple-700">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">AI đang phân tích thời tiết, đánh giá và tiện ích...</span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="p-4 border rounded-lg animate-pulse bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Suggestions Results */}
          {aiCourtSuggestions && aiCourtSuggestions.length > 0 && !aiLoading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">
                    Top {Math.min(TOP_N, aiCourtSuggestions.length)} đề xuất cho {getSportTypeInVietnamese(selectedSportAI)}
                  </span>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  AI Powered
                </Badge>
              </div>

              {/* Top 1 highlight */}
              {aiCourtSuggestions.slice(0,1).map((item: any, idx: number) => (
                <Card key={item.courtId} className="p-6 border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-white shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-full">
                        <Crown className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-purple-100 text-purple-700">{getSportTypeInVietnamese(item.type)}</Badge>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{formatRating(item.rating)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-700">{item.score}/10</div>
                      <div className="text-xs text-gray-600 mt-1">Điểm AI</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{item.address}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        {typeof item.pricePerHour === 'number' && (
                          <div className="font-semibold text-green-700">
                            {item.pricePerHour.toLocaleString('vi-VN')}đ/giờ
                          </div>
                        )}
                        {item.weather && (
                          <div className="flex items-center gap-1">
                            {getWeatherIcon(item.weather.current?.condition || '')}
                            <span>{item.weather.current?.temp ?? ''}°C</span>
                          </div>
                        )}
                      </div>

                      {item.badges && item.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.badges.slice(0, 3).map((badge: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {item.reason && (
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="text-sm font-medium text-purple-900 mb-1">💡 Vì sao nên chọn:</div>
                          <div className="text-sm text-purple-800">{item.reason}</div>
                        </div>
                      )}
                    </div>
                    
                    <Link href={`/court/${item.courtId}`}>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6">
                        Xem sân
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}

              {/* Other recommendations */}
              <div className="grid md:grid-cols-2 gap-4">
                {aiCourtSuggestions.slice(1, TOP_N).map((item: any, idx: number) => (
                  <Card key={item.courtId} className="p-4 border border-purple-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">
                          {idx + 2}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{getSportTypeInVietnamese(item.type)}</Badge>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{formatRating(item.rating)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-700">{item.score}/10</div>
                        <div className="text-xs text-gray-600">Điểm AI</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{item.address}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs">
                          {typeof item.pricePerHour === 'number' && (
                            <div className="font-medium text-green-700">
                              {item.pricePerHour.toLocaleString('vi-VN')}đ/giờ
                            </div>
                          )}
                          {item.weather && (
                            <div className="flex items-center gap-1">
                              {getWeatherIcon(item.weather.current?.condition || '')}
                              <span>{item.weather.current?.temp ?? ''}°C</span>
                            </div>
                          )}
                        </div>
                        
                        <Link href={`/court/${item.courtId}`}>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                            Xem sân
                          </Button>
                        </Link>
                      </div>

                      {item.reason && (
                        <div className="p-2 bg-purple-50 rounded text-xs text-purple-800">
                          💡 {item.reason}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : selectedSportAI !== 'all' && !aiLoading && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <div className="text-gray-600 mb-2">Chưa có gợi ý AI</div>
              <div className="text-sm text-gray-500">Nhấn "Tạo gợi ý mới" để AI phân tích và đề xuất sân phù hợp</div>
            </div>
          )}
        </div>

        {/* Results */}
        {viewMode === 'list' ? (
          <div className="space-y-4">
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
                  <Card key={court._id} className="hover:shadow-lg transition-shadow">
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-72 h-48 md:h-44">
                        <img
                          src={court.images[0] || "/placeholder.svg?height=200&width=400&query=sports court"}
                          alt={court.name}
                          className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                        />
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold">{court.name}</h3>
                            <Badge variant="secondary" className="mb-2">
                              {getSportTypeInVietnamese(court.type)}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-1 mb-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{formatRating(court.rating)}</span>
                              {court.reviewCount > 0 && (
                                <span className="text-sm text-gray-500">({court.reviewCount})</span>
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
                              {court.pricePerHour.toLocaleString('vi-VN')}đ/giờ
                            </div>
                            <div className="text-sm text-gray-600">
                              Chủ sân: {court.owner.name}
                            </div>
                          </div>
                          <Link href={`/court/${court._id}`}>
                            <Button className="bg-green-600 hover:bg-green-700">
                              Đặt sân
                            </Button>
                          </Link>
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
      {loadingMore ? 'Đang tải...' : 'Xem thêm'}
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
  )
}
