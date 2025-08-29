'use client'

import Header from "@/components/shared/header"
import Footer from "@/components/shared/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { formatRating } from "@/lib/utils"
import { Cloud, CloudRain, MapPin, Star, Sun, Sparkles, Zap, Clock, TrendingUp, DollarSign, Navigation } from 'lucide-react'
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
  amenities?: string[]
}

interface AISuggestion {
  court: Court
  score: number
  reasons: string[]
  weatherScore: number
  ratingScore: number
  priceScore: number
  distanceScore: number
  utilityScore: number
  distance: number
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
const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
const [showAISuggestions, setShowAISuggestions] = useState(false)
const [aiLoading, setAiLoading] = useState(false)
const [aiError, setAiError] = useState<string | null>(null)
const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
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

  const getAmenityDisplayName = (amenity: string) => {
    const amenityMap: { [key: string]: string } = {
      'parking': 'Bãi đỗ xe',
      'shower': 'Phòng tắm',
      'equipment': 'Trang thiết bị',
      'lighting': 'Ánh sáng',
      'air_conditioning': 'Điều hòa',
      'indoor': 'Trong nhà',
      'outdoor': 'Ngoài trời',
      'wifi': 'WiFi',
      'water': 'Nước uống',
      'locker': 'Tủ khóa',
      'coaching': 'Huấn luyện viên',
      'pro_shop': 'Cửa hàng dụng cụ'
    }
    return amenityMap[amenity] || amenity
  }

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.log('Error getting location:', error)
          // Default to Ho Chi Minh City
          setUserLocation({ lat: 10.7769, lng: 106.7009 })
        }
      )
    } else {
      // Default to Ho Chi Minh City
      setUserLocation({ lat: 10.7769, lng: 106.7009 })
    }
  }, [])

  // Regenerate AI suggestions when sport type changes and suggestions are already shown
  useEffect(() => {
    if (showAISuggestions && courts.length > 0 && weather && userLocation) {
      generateAISuggestions()
    }
  }, [selectedSport])

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Generate AI suggestions using Fireworks AI
    const generateAISuggestions = async () => {
    if (!courts.length || !weather || !userLocation) return

    setAiLoading(true)
    setAiError(null) // Clear any previous errors

    try {
      // First, get all court data with weather information
      const courtsResponse = await fetch(`/api/courts/ai-suggestions?type=${selectedSport}&lat=${userLocation.lat}&lng=${userLocation.lng}`)
      const courtsData = await courtsResponse.json()

      if (!courtsData.success) {
        throw new Error('Failed to fetch court data')
      }

      // Call the AI suggestions API
      const aiResponse = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
        method: 'POST',
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": "Bearer gdhFtHMfmQZgRPTmQnOk1heFBVZ6X6T2NNBYNE64o7c3uoz1"
        },
        body: JSON.stringify({
          model: "accounts/fireworks/models/gpt-oss-20b",
          max_tokens: 4096,
          top_p: 1,
          top_k: 40,
          presence_penalty: 0,
          frequency_penalty: 0,
          temperature: 0.6,
          messages: []
        })
      })

      console.log('🚀🚀🚀...........: ', courtsData)
      console.log('🚀🚀🚀...........: ', aiResponse)

      const aiData = await aiResponse.json()
      
      console.log('🚀🚀🚀...........: ', aiData)

      if (!aiData.success) {
        throw new Error(aiData.error || 'Failed to generate AI suggestions')
      }

      // Transform AI suggestions to match our interface
      const transformedSuggestions: AISuggestion[] = aiData.data.suggestions.map((suggestion: any) => {
        const court = suggestion.court
        const courtLat = parseFloat(court.location.coordinates[1])
        const courtLng = parseFloat(court.location.coordinates[0])
        const distance = calculateDistance(userLocation.lat, userLocation.lng, courtLat, courtLng)

        return {
          court,
          score: 100 - (suggestion.rank - 1) * 10, // Score based on rank
          reasons: [suggestion.reason],
          weatherScore: 80, // Default scores for display
          ratingScore: court.rating * 20,
          priceScore: 80,
          distanceScore: Math.max(0, 100 - (distance * 10)),
          utilityScore: 70,
          distance: Math.round(distance * 10) / 10
        }
      })

      setAiSuggestions(transformedSuggestions)
      setShowAISuggestions(true)
      
      // Log success to console for verification
      console.log('🎯 AI Suggestions Generated Successfully!')
      console.log('Fireworks AI Integration Status: ✅ Working')
      console.log('Suggestions:', transformedSuggestions.map(s => ({
        court: s.court.name,
        rank: 100 - s.score,
        reason: s.reasons[0]
      })))

    } catch (error) {
      console.error('Error generating AI suggestions:', error)
      
      // Show error message instead of fallback suggestions
      setAiSuggestions([])
      setShowAISuggestions(false)
      setAiError('Xin lỗi, không thể kết nối với FireworksAI. Vui lòng thử lại sau.')
      console.error('Failed to connect to FireworksAI. Please try again later.')
    } finally {
      setAiLoading(false)
    }
  }

  const generateAIReasoning = () => {
    if (aiSuggestions.length === 0) {
      return 'Không có gợi ý AI nào được tìm thấy.';
    }
    
    const avgScore = Math.round(aiSuggestions.reduce((sum, s) => sum + s.score, 0) / aiSuggestions.length);
    const avgDistance = Math.round(aiSuggestions.reduce((sum, s) => sum + s.distance, 0) / aiSuggestions.length * 10) / 10;
    const avgPrice = Math.round(aiSuggestions.reduce((sum, s) => sum + s.court.pricePerHour, 0) / aiSuggestions.length);
    const avgRating = Math.round(aiSuggestions.reduce((sum, s) => sum + s.court.rating, 0) / aiSuggestions.length * 10) / 10;
    
    let reasoning = `Dựa trên phân tích thông minh, AI đã chọn ra ${aiSuggestions.length} sân ${getSportTypeInVietnamese(selectedSport).toLowerCase()} tốt nhất cho bạn. `;
    reasoning += `Các sân này có điểm trung bình ${avgScore}đ, khoảng cách trung bình ${avgDistance}km, `;
    reasoning += `giá thuê trung bình ${avgPrice.toLocaleString("vi-VN")}đ/giờ và đánh giá trung bình ${avgRating}⭐. `;
    reasoning += `Gợi ý này dựa trên thời tiết hiện tại (${weather?.current?.condition || 'không xác định'}), `;
    reasoning += `vị trí của bạn và các tiêu chí về chất lượng, giá cả và tiện ích.`;
    
    return reasoning.substring(0, 400) + (reasoning.length > 400 ? '...' : '');
  };

  const generateIndividualReasoning = (suggestion: AISuggestion) => {
    // If AI has provided a reason, use it
    if (suggestion.reasons && suggestion.reasons.length > 0 && suggestion.reasons[0]) {
      return suggestion.reasons[0];
    }
    
    // Fallback to generated reasons
    const reasons: string[] = [];
    
    // Add specific reasons based on scores
    if (suggestion.weatherScore > 80) {
      const isIndoor = suggestion.court.amenities?.includes('indoor') || suggestion.court.type === 'badminton';
      if (weather?.current?.condition.includes('mưa') || weather?.current?.condition.includes('rain')) {
        reasons.push(isIndoor ? 'Sân trong nhà phù hợp với thời tiết mưa hiện tại, giúp bạn chơi thể thao mà không bị ảnh hưởng bởi thời tiết' : 'Mặc dù thời tiết mưa, nhưng sân ngoài trời này vẫn là lựa chọn tốt với hệ thống thoát nước hiệu quả');
      } else if (weather?.current?.condition.includes('nắng') || weather?.current?.condition.includes('sun')) {
        reasons.push(isIndoor ? 'Sân trong nhà mát mẻ với hệ thống điều hòa, phù hợp với thời tiết nắng nóng hiện tại' : 'Thời tiết nắng đẹp hoàn hảo cho sân ngoài trời, không gian thoáng đãng và ánh sáng tự nhiên');
      }
    }
    
    if (suggestion.ratingScore > 80) {
      reasons.push(`Sân có đánh giá rất cao từ người dùng (${suggestion.court.rating}⭐), chứng tỏ chất lượng dịch vụ và cơ sở vật chất xuất sắc`);
    }
    
    if (suggestion.priceScore > 80) {
      reasons.push(`Giá thuê ${suggestion.court.pricePerHour.toLocaleString("vi-VN")}đ/giờ rất hợp lý so với chất lượng và vị trí của sân`);
    }
    
    if (suggestion.distanceScore > 80) {
      reasons.push(`Chỉ cách vị trí của bạn ${suggestion.distance}km, thuận tiện cho việc di chuyển và tiết kiệm thời gian`);
    }
    
    if (suggestion.utilityScore > 70) {
      const amenities = suggestion.court.amenities || [];
      const amenityList = [];
      if (amenities.includes('parking')) amenityList.push('bãi đỗ xe rộng rãi');
      if (amenities.includes('shower')) amenityList.push('phòng tắm sạch sẽ');
      if (amenities.includes('equipment')) amenityList.push('trang thiết bị đầy đủ');
      if (amenities.includes('lighting')) amenityList.push('ánh sáng tốt');
      if (amenities.includes('air_conditioning')) amenityList.push('điều hòa mát mẻ');
      
      if (amenityList.length > 0) {
        reasons.push(`Sân được trang bị ${amenityList.slice(0, 3).join(', ')} giúp trải nghiệm chơi thể thao hoàn hảo hơn`);
      }
    }
    
    // If no specific reasons, provide a general one
    if (reasons.length === 0) {
      reasons.push('Sân phù hợp với tiêu chí của bạn về chất lượng, giá cả và vị trí thuận tiện');
    }
    
    const fullReasoning = reasons.join('. ') + '.';
    return fullReasoning.length > 400 ? fullReasoning.substring(0, 400) + '...' : fullReasoning;
  };

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

        {/* Main Content - Left-Right Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Section - Left Side */}
          <div className="lg:col-span-1">
            {weather && courts.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-sm p-6 border border-purple-100 sticky top-24">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">AI Gợi Ý Thông Minh</h3>
                    <p className="text-sm text-gray-600">Powered by Fireworks AI • Chọn môn thể thao để nhận gợi ý tối ưu</p>
                  </div>
                </div>

                {/* Sport Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn môn thể thao bạn muốn chơi:
                  </label>
                  <Select value={selectedSport} onValueChange={setSelectedSport}>
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

                {/* Generate Button */}
                <div className="mb-4">
                  <Button 
                    onClick={generateAISuggestions}
                    disabled={aiLoading || selectedSport === 'all'}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang tính toán...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        {selectedSport === 'all' ? 'Vui lòng chọn môn thể thao' : 'Xem gợi ý AI'}
                      </>
                    )}
                  </Button>
                </div>

                                 {/* AI Suggestions Results */}
                 {showAISuggestions && aiSuggestions.length > 0 && (
                   <div className="space-y-4">
                     {/* Top 3 Suggestions */}
                     <div className="space-y-3">
                       <h4 className="font-semibold text-gray-900">Top 3 gợi ý tốt nhất</h4>
                                               {aiSuggestions.map((suggestion, index) => (
                          <Card key={suggestion.court._id} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
                            {/* Gradient Background Overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${
                              index === 0 ? 'from-yellow-50 to-orange-50' :
                              index === 1 ? 'from-gray-50 to-slate-50' :
                              'from-orange-50 to-red-50'
                            } opacity-50`} />
                            
                            {/* Rank Badge */}
                            <div className="absolute top-4 left-4 z-20">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                              </div>
                            </div>
                          

                            <div className="relative z-10 p-6 pt-16">
                              {/* Court Name and Sport Type */}
                              <div className="mb-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-bold text-gray-900 text-lg leading-tight flex-1 mr-3">
                                    {suggestion.court.name}
                                  </h5>
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs font-medium">
                                    {getSportTypeInVietnamese(suggestion.court.type)}
                                  </Badge>
                                </div>
                              </div>

                              {/* Court Info Grid */}
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-100">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <MapPin className="h-4 w-4 text-blue-500" />
                                    <span className="text-xs font-medium text-gray-700">Địa chỉ</span>
                                  </div>
                                  <p className="text-xs text-gray-600 truncate">{suggestion.court.address}</p>
                                </div>
                                
                                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-100">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Star className="h-4 w-4 text-yellow-500" />
                                    <span className="text-xs font-medium text-gray-700">Đánh giá</span>
                                  </div>
                                  <p className="text-xs text-gray-600">{suggestion.court.rating} sao ({suggestion.court.reviewCount} đánh giá)</p>
                                </div>
                                
                                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-100">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <DollarSign className="h-4 w-4 text-green-500" />
                                    <span className="text-xs font-medium text-gray-700">Giá thuê</span>
                                  </div>
                                  <p className="text-xs font-semibold text-green-600">{suggestion.court.pricePerHour.toLocaleString("vi-VN")}đ/giờ</p>
                                </div>
                                
                                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-100">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Navigation className="h-4 w-4 text-purple-500" />
                                    <span className="text-xs font-medium text-gray-700">Khoảng cách</span>
                                  </div>
                                  <p className="text-xs text-gray-600">{suggestion.distance}km từ bạn</p>
                                </div>
                              </div>

                              {/* Amenities Section */}
                              {suggestion.court.amenities && suggestion.court.amenities.length > 0 && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 mb-4">
                                  <div className="flex items-center space-x-2 mb-3">
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                    <h6 className="font-semibold text-gray-900 text-sm">Tiện ích có sẵn</h6>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {suggestion.court.amenities.map((amenity, idx) => (
                                      <Badge 
                                        key={idx} 
                                        variant="secondary" 
                                        className="bg-green-100 text-green-800 text-xs font-medium border border-green-200"
                                      >
                                        {getAmenityDisplayName(amenity)}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* AI Reasoning */}
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 mb-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <h6 className="font-semibold text-gray-900 text-sm">Lý do AI gợi ý</h6>
                                  {suggestion.reasons && suggestion.reasons.length > 0 && suggestion.reasons[0] && (
                                    <div className="flex items-center space-x-1">
                                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                      <span className="text-xs text-green-600 font-medium">Fireworks AI</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {generateIndividualReasoning(suggestion)}
                                </p>
                              </div>

                              {/* Action Button */}
                              <div className="flex justify-center">
                                {user ? (
                                  <Link href={`/court/${suggestion.court._id}`}>
                                    <Button size="lg" className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                                      <span className="mr-2">🏟️</span>
                                      Đặt sân ngay
                                    </Button>
                                  </Link>
                                ) : (
                                  <Link href={`/auth/login`}>
                                    <Button size="lg" className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                                      <span className="mr-2">🏟️</span>
                                      Đặt sân ngay
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                     </div>

                    {/* Reset Button */}
                    <div className="flex justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAISuggestions(false)}
                        size="sm"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Ẩn gợi ý
                      </Button>
                    </div>
                  </div>
                )}

                {/* AI Error Message */}
                {showAISuggestions && aiError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <h6 className="font-semibold text-red-800 text-sm">Lỗi kết nối AI</h6>
                    </div>
                    <p className="text-sm text-red-700 leading-relaxed">
                      {aiError}
                    </p>
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowAISuggestions(false)
                          setAiError(null)
                        }}
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Đóng
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results Section - Right Side */}
          <div className="lg:col-span-2">
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
  </div>
  
  <Footer />
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
