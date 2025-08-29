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
const [aiSummary, setAiSummary] = useState<string>("")
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
    setAiSummary("") // Clear previous summary

    try {
      // Step 1: Get court data with weather information
      const courtsResponse = await fetch(`/api/courts/ai-suggestions?type=${selectedSport}&lat=${userLocation.lat}&lng=${userLocation.lng}`)
      const courtsData = await courtsResponse.json()

      if (!courtsData.success) {
        throw new Error('Failed to fetch court data')
      }

      console.log('📥 AI Suggestions API response:', courtsData)

      // Step 2: Create strong prompt for FireworksAI
      const prompt = createFireworksPrompt(courtsData)

      // Step 3: Call FireworksAI
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
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      })

      const aiData = await aiResponse.json()
      console.log('🎆 FireworksAI response:', aiData)

      // Step 4: Parse and display the result
      if (aiData.choices && aiData.choices[0] && aiData.choices[0].message) {
        try {
          const content = aiData.choices[0].message.content
          const parsedContent = JSON.parse(content)
          console.log('✅ Parsed FireworksAI result:', parsedContent)

          // Extract the summary from the AI response
          if (parsedContent.summary) {
            // Store the AI summary
            setAiSummary(parsedContent.summary)
            
            // Transform AI suggestions to match our interface
            const transformedSuggestions: AISuggestion[] = courtsData.data.slice(0, 3).map((court: any, index: number) => {
              const courtLat = parseFloat(court.location.coordinates[1])
              const courtLng = parseFloat(court.location.coordinates[0])
              const distance = calculateDistance(userLocation.lat, userLocation.lng, courtLat, courtLng)

              return {
                court,
                score: 100 - (index * 10), // Score based on rank
                reasons: [], // No individual reasons, only general summary
                weatherScore: 80,
                ratingScore: court.rating * 20,
                priceScore: 80,
                distanceScore: Math.max(0, 100 - (distance * 10)),
                utilityScore: 70,
                distance: Math.round(distance * 10) / 10
              }
            })

            setAiSuggestions(transformedSuggestions)
            setShowAISuggestions(true)
            
            console.log('🎯 AI Suggestions Generated Successfully!')
            console.log('Fireworks AI Integration Status: ✅ Working')
            console.log('AI Summary:', parsedContent.summary)
          }
        } catch (parseError) {
          console.log('⚠️ Could not parse JSON response, showing raw content')
          // Fallback to raw content
          const transformedSuggestions: AISuggestion[] = courtsData.data.slice(0, 3).map((court: any, index: number) => {
            const courtLat = parseFloat(court.location.coordinates[1])
            const courtLng = parseFloat(court.location.coordinates[0])
            const distance = calculateDistance(userLocation.lat, userLocation.lng, courtLat, courtLng)

            return {
              court,
              score: 100 - (index * 10),
              reasons: [], // No individual reasons, only general summary
              weatherScore: 80,
              ratingScore: court.rating * 20,
              priceScore: 80,
              distanceScore: Math.max(0, 100 - (distance * 10)),
              utilityScore: 70,
              distance: Math.round(distance * 10) / 10
            }
          })

          setAiSuggestions(transformedSuggestions)
          setShowAISuggestions(true)
        }
      }

    } catch (error) {
      console.error('Error generating AI suggestions:', error)
      
      setAiSuggestions([])
      setShowAISuggestions(false)
      setAiSummary("")
      setAiError('Xin lỗi, không thể kết nối với FireworksAI. Vui lòng thử lại sau.')
      console.error('Failed to connect to FireworksAI. Please try again later.')
    } finally {
      setAiLoading(false)
    }
  }

  // Create strong prompt for FireworksAI
  const createFireworksPrompt = (data: any): string => {
    const courts = data.data || []
    const weather = data.weather
    const sportType = selectedSport

    const sportTypeVietnamese = {
      'football': 'bóng đá mini',
      'badminton': 'cầu lông',
      'tennis': 'tennis',
      'basketball': 'bóng rổ',
      'volleyball': 'bóng chuyền',
      'pickleball': 'pickleball'
    }[sportType] || sportType

    let prompt = `Bạn là một chuyên gia tư vấn thể thao thông minh. Dựa trên danh sách sân ${sportTypeVietnamese} sau đây, hãy chọn ra TOP 3 sân tốt nhất để đặt và giải thích lý do chi tiết.

DANH SÁCH SÂN ${sportTypeVietnamese.toUpperCase()}:
`

    courts.forEach((court: any, index: number) => {
      prompt += `${index + 1}. ${court.name}
   - Địa chỉ: ${court.address}
   - Giá: ${court.pricePerHour.toLocaleString('vi-VN')} VNĐ/giờ
   - Đánh giá: ${court.rating}/5 (${court.reviewCount} đánh giá)
   - Khoảng cách: ${court.distance}km
   - Tiện ích: ${court.amenities?.join(', ') || 'Không có'}
   - Mô tả: ${court.description || 'Không có mô tả'}
`
    })

    if (weather) {
      prompt += `
THÔNG TIN THỜI TIẾT HIỆN TẠI:
- Nhiệt độ: ${weather.temp}°C
- Điều kiện: ${weather.condition}
- Độ ẩm: ${weather.humidity}%
- Gió: ${weather.windSpeed} km/h
`
    }

    prompt += `
YÊU CẦU:
1. Chọn TOP 3 sân tốt nhất dựa trên các tiêu chí: giá cả hợp lý, đánh giá cao, khoảng cách gần, tiện ích đầy đủ, phù hợp với thời tiết
2. Sắp xếp theo thứ tự ưu tiên (1 = tốt nhất)
3. Tạo một phân tích tổng quan chi tiết giải thích lý do tại sao 3 sân này được chọn (giải thích tối đa 300 ký tự), bao gồm:
   - So sánh về giá cả, chất lượng và vị trí
   - Phù hợp với thời tiết hiện tại
   - Điểm mạnh của từng sân
   - Lý do tổng thể cho việc gợi ý 3 sân này
4. Trả lời bằng tiếng Việt, format JSON như sau:
{
  "top3_courts": [
    {
      "rank": 1,
      "court_name": "Tên sân"
    }
  ],
  "summary": "Phân tích chi tiết lý do AI gợi ý 3 sân này, bao gồm so sánh về giá cả, chất lượng, vị trí và phù hợp với thời tiết"
}`

    return prompt
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '10s' }}></div>
        <div className="absolute bottom-40 right-20 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '3s', animationDuration: '8s' }}></div>
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-teal-500/10 rounded-full blur-xl animate-bounce" style={{ animationDelay: '6s', animationDuration: '12s' }}></div>
        
        {/* Floating Sports Icons */}
        <div className="absolute top-32 right-32 text-5xl animate-spin opacity-10" style={{ animationDuration: '30s' }}>🔍</div>
        <div className="absolute bottom-32 left-32 text-4xl animate-pulse opacity-10" style={{ animationDelay: '2s' }}>🏟️</div>
        <div className="absolute top-2/3 right-10 text-3xl animate-spin opacity-10" style={{ animationDelay: '4s', animationDuration: '25s' }}>⚽</div>
        <div className="absolute bottom-1/4 right-1/3 text-3xl animate-pulse opacity-10" style={{ animationDelay: '1s' }}>🏀</div>
      </div>

      <Header />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white overflow-hidden">
        {/* Hero Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '12s' }}></div>
          <div className="absolute bottom-10 right-10 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '4s', animationDuration: '10s' }}></div>
          <div className="absolute top-1/2 right-20 w-28 h-28 bg-teal-500/10 rounded-full blur-xl animate-bounce" style={{ animationDelay: '8s', animationDuration: '14s' }}></div>
          
          {/* Hero Sports Icons */}
          <div className="absolute top-16 right-16 text-6xl animate-spin opacity-20" style={{ animationDuration: '40s' }}>🔍</div>
          <div className="absolute bottom-20 left-20 text-5xl animate-pulse opacity-20" style={{ animationDelay: '2s' }}>🏟️</div>
          <div className="absolute top-1/3 left-1/4 text-4xl animate-spin opacity-20" style={{ animationDelay: '6s', animationDuration: '35s' }}>⚽</div>
          <div className="absolute bottom-1/3 right-1/3 text-4xl animate-pulse opacity-20" style={{ animationDelay: '3s' }}>🎾</div>
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="text-center space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-emerald-200 text-sm font-medium animate-fade-in">
              🔍 Tìm kiếm sân thể thao
              <div className="ml-2 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
              </div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Tìm sân thể thao
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-emerald-100 max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Khám phá và đặt sân thể thao phù hợp với bạn
            </p>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-center space-x-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
              <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                onClick={() => setViewMode("list")}
                size="sm"
                  className={viewMode === "list" 
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg" 
                    : "text-emerald-100 hover:text-white hover:bg-white/10"
                  }
              >
                  📋 Danh sách
              </Button>
              <Button
                  variant={viewMode === "map" ? "default" : "ghost"}
                onClick={() => setViewMode("map")}
                size="sm"
                  className={viewMode === "map" 
                    ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg" 
                    : "text-cyan-100 hover:text-white hover:bg-white/10"
                  }
              >
                  🗺️ Bản đồ
              </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Search Filters */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-8 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-emerald-700 to-gray-800 bg-clip-text text-transparent mb-2">
              🔍 Tìm kiếm sân thể thao
            </h2>
            <p className="text-gray-600">Sử dụng bộ lọc để tìm sân phù hợp với nhu cầu của bạn</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🏟️ Tên hoặc địa chỉ sân
              </label>
              <div className="relative group">
              <Input
                  placeholder="Nhập tên sân hoặc địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/50 border-white/30 focus:border-emerald-400 focus:ring-emerald-400/20 hover:bg-white/70 transition-all duration-300 pl-4 py-3 text-lg"
              />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-emerald-500 text-xl">🔍</span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ⚽ Môn thể thao
              </label>
            <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger className="bg-white/50 border-white/30 hover:bg-white/70 focus:border-emerald-400 focus:ring-emerald-400/20 transition-all duration-300 py-3">
                <SelectValue placeholder="Chọn môn thể thao" />
              </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border border-white/20">
                <SelectItem value="all">Tất cả môn</SelectItem>
                  <SelectItem value="football">⚽ Bóng đá mini</SelectItem>
                  <SelectItem value="badminton">🏸 Cầu lông</SelectItem>
                  <SelectItem value="tennis">🎾 Tennis</SelectItem>
                  <SelectItem value="basketball">🏀 Bóng rổ</SelectItem>
                  <SelectItem value="volleyball">🏐 Bóng chuyền</SelectItem>
                  <SelectItem value="pickleball">🏓 Pickleball</SelectItem>
              </SelectContent>
            </Select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ⏰ Khung thời gian
              </label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="bg-white/50 border-white/30 hover:bg-white/70 focus:border-emerald-400 focus:ring-emerald-400/20 transition-all duration-300 py-3">
                <SelectValue placeholder="Khung giờ" />
              </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border border-white/20">
                <SelectItem value="all">Tất cả giờ</SelectItem>
                  <SelectItem value="morning">🌅 Sáng (6-12h)</SelectItem>
                  <SelectItem value="afternoon">☀️ Chiều (12-18h)</SelectItem>
                  <SelectItem value="evening">🌙 Tối (18-22h)</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>

          {/* Weather Info */}
          {weather && (
            <div className="mt-6 p-4 bg-gradient-to-r from-cyan-50/80 to-blue-50/80 backdrop-blur-sm rounded-xl border border-cyan-200/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
                    {getWeatherIcon(weather.current?.condition || '')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">
                      Thời tiết hiện tại: {weather.current?.temp || 0}°C
                    </div>
                    <div className="text-xs text-gray-600">
                      {weather.current?.condition || 'Không xác định'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600 space-x-4">
                    <span>💧 Độ ẩm: {weather.current?.humidity || 0}%</span>
                    <span>💨 Gió: {weather.current?.windSpeed || 0}km/h</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content - Left-Right Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Section - Left Side */}
          <div className="lg:col-span-1">
            {weather && courts.length > 0 && (
              <div className="bg-gradient-to-br from-purple-500/90 via-indigo-600/90 to-blue-600/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20 sticky top-24 text-white animate-fade-in" style={{ animationDelay: '0.4s' }}>
                {/* AI Header with Animation */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-xl blur-lg animate-pulse"></div>
                  <div className="relative flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg animate-bounce">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">🤖 AI Gợi Ý Thông Minh</h3>
                      <p className="text-purple-100 text-sm">Chọn môn thể thao để nhận gợi ý tối ưu</p>
                    </div>
                  </div>
                </div>

                                {/* Sport Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-white mb-3">
                    ⚽ Chọn môn thể thao bạn muốn chơi:
                  </label>
                  <Select value={selectedSport} onValueChange={setSelectedSport}>
                    <SelectTrigger className="w-full bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 focus:border-white/40 focus:ring-white/20 transition-all duration-300">
                      <SelectValue placeholder="Chọn môn thể thao" className="text-white" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800/95 backdrop-blur-md border border-white/20">
                      <SelectItem value="all" className="text-white hover:bg-purple-600/20">Tất cả môn</SelectItem>
                      <SelectItem value="football" className="text-white hover:bg-purple-600/20">⚽ Bóng đá mini</SelectItem>
                      <SelectItem value="badminton" className="text-white hover:bg-purple-600/20">🏸 Cầu lông</SelectItem>
                      <SelectItem value="tennis" className="text-white hover:bg-purple-600/20">🎾 Tennis</SelectItem>
                      <SelectItem value="basketball" className="text-white hover:bg-purple-600/20">🏀 Bóng rổ</SelectItem>
                      <SelectItem value="volleyball" className="text-white hover:bg-purple-600/20">🏐 Bóng chuyền</SelectItem>
                      <SelectItem value="pickleball" className="text-white hover:bg-purple-600/20">🏓 Pickleball</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Generate Button */}
                <div className="mb-6">
                  <Button 
                    onClick={generateAISuggestions}
                    disabled={aiLoading || selectedSport === 'all'}
                    className="w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 text-white font-bold py-4 shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {aiLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        <span className="text-lg">🧠 Đang tính toán...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 mr-2" />
                        <span className="text-lg">
                          {selectedSport === 'all' ? '💭 Vui lòng chọn môn thể thao' : '🚀 Xem gợi ý AI'}
                        </span>
                      </>
                    )}
                  </Button>
                </div>

                                 {/* AI Suggestions Results */}
                 {showAISuggestions && aiSuggestions.length > 0 && (
                   <div className="space-y-6">
                     {/* AI Results Header */}
                     <div className="text-center">
                       <h4 className="text-xl font-bold text-white mb-2">🎯 Top 3 Gợi Ý Tốt Nhất</h4>
                       <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto"></div>
                     </div>

                     {/* AI Summary Section */}
                     {aiSummary ? (
                       <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm rounded-xl p-6 border border-blue-400/30">
                         <div className="flex items-center space-x-3 mb-4">
                           <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
                           <h6 className="font-bold text-white text-lg">🧠 Phân tích AI - Lý do gợi ý</h6>
                         </div>
                         <div className="text-white/90 text-base leading-relaxed">
                           {aiSummary}
                         </div>
                         <div className="mt-4 pt-4 border-t border-blue-400/20">
                           <div className="flex items-center justify-center space-x-2 text-blue-200 text-sm">
                             <Sparkles className="h-4 w-4" />
                             <span>AI đã phân tích dựa trên thời tiết, vị trí, giá cả và đánh giá</span>
                           </div>
                         </div>
                       </div>
                     ) : (
                       <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-orange-400/30">
                         <div className="flex items-center space-x-2 text-orange-200 text-sm">
                           <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                           <span>⚠️ Đang chờ phân tích AI... Vui lòng đợi một chút</span>
                         </div>
                       </div>
                     )}
                     
                     {/* Top 3 Suggestions */}
                     <div className="space-y-4">
                                               {aiSuggestions.map((suggestion, index) => (
                          <Card key={suggestion.court._id} className="group relative overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1">
                            {/* Rank Badge */}
                            <div className="absolute top-4 right-4 z-20">
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                                index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 animate-pulse' :
                                index === 1 ? 'bg-gradient-to-br from-slate-400 to-gray-500 animate-pulse' :
                                'bg-gradient-to-br from-orange-400 to-red-500 animate-pulse'
                              }`} style={{ animationDelay: `${index * 0.2}s` }}>
                                <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                              </div>
                            </div>

                            <div className="relative z-10 p-6">
                              {/* AI Score */}
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="text-2xl font-black text-white">#{index + 1}</div>
                                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    suggestion.score >= 90 ? 'bg-green-500/20 text-green-300 border border-green-400/30' :
                                    suggestion.score >= 70 ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
                                    'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                                  }`}>
                                    🎯 Điểm AI: {suggestion.score}
                                  </div>
                                </div>
                                
                                <h5 className="font-bold text-white text-xl mb-2 group-hover:text-yellow-100 transition-colors">
                                  {suggestion.court.name}
                                </h5>
                                
                                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors">
                                  {getSportTypeInVietnamese(suggestion.court.type)}
                                </Badge>
                              </div>

                              {/* Quick Stats */}
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 group-hover:bg-white/10 transition-colors">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Star className="h-4 w-4 text-yellow-400" />
                                    <span className="text-xs font-medium text-white/80">Đánh giá</span>
                                  </div>
                                  <p className="text-sm font-bold text-white">{suggestion.court.rating} ⭐ ({suggestion.court.reviewCount})</p>
                                </div>
                                
                                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 group-hover:bg-white/10 transition-colors">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <DollarSign className="h-4 w-4 text-green-400" />
                                    <span className="text-xs font-medium text-white/80">Giá thuê</span>
                                  </div>
                                  <p className="text-sm font-bold text-green-300">{suggestion.court.pricePerHour.toLocaleString("vi-VN")}đ/h</p>
                                </div>
                                
                                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 group-hover:bg-white/10 transition-colors">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Navigation className="h-4 w-4 text-purple-400" />
                                    <span className="text-xs font-medium text-white/80">Khoảng cách</span>
                                  </div>
                                  <p className="text-sm font-bold text-purple-300">{suggestion.distance}km</p>
                                </div>

                                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 group-hover:bg-white/10 transition-colors">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <MapPin className="h-4 w-4 text-cyan-400" />
                                    <span className="text-xs font-medium text-white/80">Vị trí</span>
                                  </div>
                                  <p className="text-xs text-cyan-300 truncate">{suggestion.court.address}</p>
                                </div>
                              </div>



                              {/* Action Button */}
                              <Link href={`/court/${suggestion.court._id}`}>
                                <Button className="w-full bg-gradient-to-r from-emerald-400 via-cyan-500 to-teal-500 hover:from-emerald-500 hover:via-cyan-600 hover:to-teal-600 text-white font-bold py-3 shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105">
                                  <span className="mr-2">🏟️</span>
                                  Xem chi tiết & Đặt sân
                                </Button>
                              </Link>
                            </div>
                          </Card>
                        ))}
                     </div>

                    {/* Reset Button */}
                    <div className="text-center">
                      <Button 
                        variant="ghost"
                        onClick={() => {
                          setShowAISuggestions(false)
                          setAiSummary("")
                        }}
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 transition-all duration-300"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        🔄 Làm mới gợi ý
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
              <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                {/* Results Header */}
                <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-emerald-700 to-gray-800 bg-clip-text text-transparent">
                        🏟️ Kết quả tìm kiếm
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Tìm thấy <span className="font-bold text-emerald-600">{total}</span> sân phù hợp với yêu cầu của bạn
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span>Đang cập nhật</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loading States */}
                {loading ? (
                  <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i} className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-80 h-48 bg-gradient-to-br from-emerald-200 via-emerald-100 to-cyan-100 animate-pulse"></div>
                          <div className="flex-1 p-6 space-y-4">
                            <div className="space-y-3">
                              <div className="h-6 bg-gradient-to-r from-emerald-200 via-emerald-100 to-transparent rounded-lg animate-pulse"></div>
                              <div className="flex space-x-2">
                                <div className="h-4 bg-cyan-200 rounded-full w-20 animate-pulse"></div>
                                <div className="h-4 bg-teal-200 rounded-full w-24 animate-pulse"></div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-transparent rounded w-16 animate-pulse"></div>
                                <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-transparent rounded w-24 animate-pulse"></div>
                              </div>
                              <div className="space-y-2">
                                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-transparent rounded w-20 animate-pulse"></div>
                                <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-transparent rounded w-28 animate-pulse"></div>
                              </div>
                            </div>
                            <div className="flex justify-between items-end">
                              <div className="h-8 bg-gradient-to-r from-emerald-200 via-emerald-100 to-transparent rounded w-32 animate-pulse"></div>
                              <div className="h-10 bg-gradient-to-r from-blue-200 via-blue-100 to-transparent rounded-lg w-28 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {courts.map((court) => (
                      <Card
                        key={court._id}
                        className="group bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl hover:bg-white/80 transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1 overflow-hidden"
                      >
                        <div className="flex flex-col lg:flex-row">
                          {/* Court Image */}
                          <div className="w-full lg:w-80 h-64 lg:h-52 relative overflow-hidden">
                            <img
                              src={
                                court.images[0] ||
                                "/placeholder.svg?height=400&width=600&query=sports court"
                              }
                              alt={court.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {/* Overlay Badge */}
                            <div className="absolute top-4 left-4">
                              <Badge className="bg-emerald-500/90 text-white border-0 shadow-lg">
                                {getSportTypeInVietnamese(court.type)}
                              </Badge>
                            </div>
                            {/* Rating Badge */}
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-lg">
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold text-gray-800">
                                  {formatRating(court.rating)}
                                </span>
                                {court.reviewCount > 0 && (
                                  <span className="text-xs text-gray-600">
                                    ({court.reviewCount})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Court Details */}
                          <div className="flex-1 p-6 space-y-4">
                            {/* Header */}
                            <div>
                              <h3 className="text-2xl font-bold text-gray-800 group-hover:text-emerald-700 transition-colors mb-2">
                                {court.name}
                              </h3>
                              <div className="flex items-center text-gray-600 group-hover:text-gray-700 transition-colors">
                                <MapPin className="h-4 w-4 mr-2 text-cyan-500" />
                                <span className="text-sm">{court.address}</span>
                              </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl p-4 border border-emerald-100">
                                <div className="flex items-center space-x-2 mb-2">
                                  <DollarSign className="h-5 w-5 text-emerald-600" />
                                  <span className="font-medium text-gray-700">Giá thuê</span>
                                </div>
                                <div className="text-2xl font-bold text-emerald-600">
                                  {court.pricePerHour.toLocaleString("vi-VN")}đ
                                </div>
                                <div className="text-sm text-gray-500">mỗi giờ</div>
                              </div>

                              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                                <div className="flex items-center space-x-2 mb-2">
                                  <TrendingUp className="h-5 w-5 text-purple-600" />
                                  <span className="font-medium text-gray-700">Trạng thái</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                  <span className="text-sm font-medium text-green-600">Có thể đặt</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <div className="text-sm text-gray-500">
                                Cập nhật: hôm nay
                              </div>
                              <div className="flex space-x-3">
                                <Link href={`/court/${court._id}`}>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                                  >
                                    📋 Chi tiết
                                  </Button>
                                </Link>
                                <Link href={`/court/${court._id}`}>
                                  <Button 
                                    size="sm"
                                    className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105"
                                  >
                                    🏟️ Đặt sân
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}

                    {/* Load More Button */}
                    {page < totalPages && (
                      <div className="text-center">
                        <Button
                          onClick={() => fetchCourts(false)}
                          disabled={loadingMore}
                          className="bg-white/70 backdrop-blur-sm border-white/30 hover:bg-white/80 hover:border-emerald-300 text-emerald-700 font-semibold px-8 py-3 shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                        >
                          {loadingMore ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>
                              🔄 Đang tải thêm...
                            </>
                          ) : (
                            <>
                              📊 Xem thêm sân ({totalPages - page} trang còn lại)
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-emerald-700 to-gray-800 bg-clip-text text-transparent">
                    🗺️ Bản đồ sân thể thao
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Khám phá <span className="font-bold text-emerald-600">{total}</span> sân trên bản đồ
                  </p>
                </div>
                <div className="h-[600px]">
                  <MapComponent courts={courts} />
                </div>
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
