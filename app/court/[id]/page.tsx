"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { log } from "console";
import {
	Car,
	Clock,
	MapPin,
	Phone,
	ShowerHeadIcon as Shower,
	Star,
	Sun,
	Users,
	Wifi,
	Sparkles,
	Umbrella,
	Wind,
	Thermometer,
	Lightbulb,
	Snowflake,
	Lock,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
interface Court {
  _id: string;
  name: string;
  type: string;
  address: string;
  pricePerHour: number;
  rating: number;
  reviewCount: number;
  images: string[];
  description: string;
  amenities: string[];
  phone: string;
  openTime: string;
  closeTime: string;
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
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [totalReviews, setTotalReviews] = useState<number>(0)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  useEffect(() => {
    if (params.id) {
      fetchCourt()
      fetchReviews()
    }
  }, [params.id]);

  const fetchCourt = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courts/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setCourt(data.data);
      } else {
        console.error("Court not found");
      }
    } catch (error) {
      console.error("Error fetching court:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (court) {
      fetchWeather()
    }
  }, [court, selectedDate])

  const fetchWeather = async () => {
    try {
      if (!court) return

      console.log('Fetching weather for court address:', court.address)
      console.log('Selected date:', selectedDate.toISOString().split('T')[0])

      const localDate = selectedDate.toLocaleDateString('en-CA'); 
      console.log('localDate:', localDate);
      


      // Use court's actual address for weather data with selected date
      const response = await fetch(`/api/weather?address=${encodeURIComponent(court.address)}&date=${localDate}`)
      const data = await response.json()

      console.log('Weather API response:', data)
      console.log('Weather forecast data:', data.data?.forecast)
      console.log('Weather seven day forecast:', data.data?.sevenDayForecast)

      if (data.success) {
        setWeather(data.data)
        console.log('Weather data set successfully:', data.data)
      } else {
        // console.error('Weather API error:', data.error)
        // Fallback to default location if address geocoding fails
        console.log('Trying fallback weather data...')
        const fallbackResponse = await fetch(`/api/weather?lat=10.7769&lon=106.7009&date=${localDate}`)
        const fallbackData = await fallbackResponse.json()
        if (fallbackData.success) {
          setWeather(fallbackData.data)
          console.log('Fallback weather data set:', fallbackData.data)
        } else {
          console.error('Fallback weather also failed:', fallbackData.error)
        }
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
    }
  };

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
      alert("Vui lòng chọn khung giờ");
      return;
    }

    // Mock user ID - in real app, get from auth context
    const userId = user?.id;
    const selectedDateStr = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1
    ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          courtId: court?._id,
          date: selectedDateStr,
          startTime: selectedSlot,
          endTime: `${parseInt(selectedSlot.split(":")[0]) + 1}:00:00`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Đặt sân thành công!");
        router.push("/bookings");
      } else {
        alert(data.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Có lỗi xảy ra khi đặt sân");
    }
  };

  const generateTimeSlots = () => {
    if (!court) return [];

    const slots: Array<{ time: string; value: string; available: boolean; price: number }> = [];
    const openHour = parseInt(court.openTime.split(":")[0]);
    const closeHour = parseInt(court.closeTime.split(":")[0]);

    const selectedDateStr = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1
    ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

    for (let hour = openHour; hour < closeHour; hour++) {
      const display = `${hour.toString().padStart(2, "0")}:00`;
      const value = `${hour.toString().padStart(2, "0")}:00:00`;
      const fullSlot = `${selectedDateStr}T${value}`; // YYYY-MM-DDTHH:mm:ss

      slots.push({
        time: display,
        value,
        available: !court.bookedSlots.includes(fullSlot),
        price: court.pricePerHour,
      });
    }

    return slots;
  };
  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi miễn phí":
      case "wifi":
        return <Wifi className="h-4 w-4" />;
      case "chỗ đậu xe":
      case "parking":
        return <Car className="h-4 w-4" />;
      case "vòi sen":
      case "shower":
        return <Shower className="h-4 w-4" />;
      case "đèn":
      case "den":
      case "light":
      case "lighting":
      case "chiếu sáng":
        return <Lightbulb className="h-4 w-4" />;
      case "mái che":
      case "roof":
      case "covered":
      case "trong nhà":
        return <Umbrella className="h-4 w-4" />;
      case "điều hòa":
      case "máy lạnh":
      case "ac":
      case "air conditioning":
        return <Snowflake className="h-4 w-4" />;
      case "locker":
      case "tủ đồ":
        return <Lock className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

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

  const generateAISuggestions = async () => {
    if (!court || !weather) {
      alert('Vui lòng đợi thông tin sân và thời tiết được tải xong')
      return
    }

    setGeneratingSuggestions(true)

    try {
      // Prepare data for AI analysis
      const timeSlots = generateTimeSlots()
      const availableSlots = timeSlots.filter(slot => slot.available)

      // Create comprehensive prompt for AI
      const prompt = `
        Bạn là một chuyên gia tư vấn đặt sân thể thao thông minh. Hãy phân tích và đưa ra gợi ý chi tiết, cá nhân hóa cho việc đặt sân dựa trên thông tin sau:

        **Thông tin sân:**
        - Tên: ${court.name}
        - Loại sân: ${getSportTypeInVietnamese(court.type)}
        - Giá: ${court.pricePerHour.toLocaleString('vi-VN')}đ/giờ
        - Đánh giá: ${court.rating}/5 sao (${court.reviewCount} đánh giá)
        - Địa chỉ: ${court.address}
        - Giờ mở cửa: ${court.openTime} - ${court.closeTime}
        - Tiện ích: ${court.amenities.join(', ')}

        **Ngày đặt sân:**
        - Ngày: ${selectedDate.toLocaleDateString('vi-VN')}
        - Thứ: ${selectedDate.toLocaleDateString('vi-VN', { weekday: 'long' })}
        - Mùa: ${getSeason(selectedDate)}

        **Thời tiết hiện tại:**
         - Địa điểm: ${weather.location || court.address}
         - Nhiệt độ: ${weather.current.temp}°C
         - Điều kiện: ${weather.current.condition}
         - Dự báo: ${weather.forecast.map((f: any) => `${f.time}: ${f.temp}°C, ${f.condition}`).join(', ')}

        **Khung giờ còn trống:**
        ${availableSlots.map(slot => `- ${slot.time}: ${slot.price.toLocaleString('vi-VN')}đ`).join('\n')}

        Hãy phân tích và đưa ra:
        1. **Khuyến nghị tổng quan** - Thời gian tốt nhất để đặt sân dựa trên ngày cụ thể
        2. **Phân tích chi tiết** - Lý do tại sao chọn thời gian đó (có tính đến ngày, mùa, loại sân)
        3. **Lưu ý thời tiết** - Ảnh hưởng của thời tiết đến việc chơi (có tính đến loại sân)
        4. **Gợi ý giá cả** - Đánh giá về mức giá và gợi ý tiết kiệm (có tính đến ngày, địa điểm)
        5. **Mẹo hữu ích** - Lời khuyên cụ thể cho loại sân và thời tiết
        6. **Dự đoán đông đúc** - Thời gian nào sẽ đông người (có tính đến ngày, loại sân)
        7. **Gợi ý thay thế** - Các lựa chọn thay thế nếu thời gian đề xuất không phù hợp
        8. **Lời khuyên theo mùa** - Gợi ý dựa trên mùa hiện tại

        Trả lời bằng tiếng Việt, ngắn gọn nhưng đầy đủ thông tin và có tính cá nhân hóa cao.
      `

      // Call AI API
      const requestBody = {
        prompt,
        courtData: {
          name: court.name,
          type: court.type,
          price: court.pricePerHour,
          rating: court.rating,
          address: court.address,
          amenities: court.amenities
        },
        weatherData: weather,
        availableSlots: availableSlots.map(slot => ({
          time: slot.time,
          price: slot.price
        })),
        selectedDate: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
      }

      console.log('Sending date to AI API:', requestBody.selectedDate)
      console.log('Selected date object:', selectedDate)
      console.log('Selected date formatted:', selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
      console.log('Selected date ISO string:', selectedDate.toISOString())
      console.log('Selected date components:', {
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        day: selectedDate.getDate(),
        dayOfWeek: selectedDate.getDay()
      })

      const response = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (data.success) {
        setAiSuggestions({
          analysis: data.analysis,
          recommendations: data.recommendations,
          tips: data.tips,
          weatherAdvice: data.weatherAdvice,
          priceAnalysis: data.priceAnalysis,
          crowdPrediction: data.crowdPrediction,
          bestTimeSlots: data.bestTimeSlots || [],
          alternativeSuggestions: data.alternativeSuggestions,
          seasonalAdvice: data.seasonalAdvice
        })
      } else {
        throw new Error(data.error || 'Không thể tạo gợi ý AI')
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error)
      alert('Có lỗi xảy ra khi tạo gợi ý AI. Vui lòng thử lại.')
    } finally {
      setGeneratingSuggestions(false)
    }
  }

  // Clear AI suggestions when date changes
  useEffect(() => {
    setAiSuggestions(null)
  }, [selectedDate])

  const getSeason = (date: Date): string => {
    const month = date.getMonth()
    if (month >= 2 && month <= 4) return 'Xuân'
    if (month >= 5 && month <= 7) return 'Hè'
    if (month >= 8 && month <= 10) return 'Thu'
    return 'Đông'
  }

  const getWeatherIcon = (condition: string, temp: number): string => {
    const conditionLower = condition.toLowerCase()

    // Check for specific weather conditions
    if (conditionLower.includes('mưa') || conditionLower.includes('rain')) {
      return '🌧️'
    }
    if (conditionLower.includes('nắng') || conditionLower.includes('sunny') || conditionLower.includes('clear')) {
      return '☀️'
    }
    if (conditionLower.includes('mây') || conditionLower.includes('cloud')) {
      return '☁️'
    }
    if (conditionLower.includes('sương mù') || conditionLower.includes('fog') || conditionLower.includes('mist')) {
      return '🌫️'
    }
    if (conditionLower.includes('sấm') || conditionLower.includes('thunder')) {
      return '⛈️'
    }
    if (conditionLower.includes('tuyết') || conditionLower.includes('snow')) {
      return '❄️'
    }

    // Default based on temperature
    if (temp >= 30) return '🔥'
    if (temp >= 25) return '☀️'
    if (temp >= 20) return '🌤️'
    if (temp >= 15) return '⛅'
    if (temp >= 10) return '🌥️'
    if (temp >= 5) return '☁️'
    return '❄️'
  }

	const hasAmenity = (keywords: string[]) => {
		if (!court) return false
		return court.amenities?.some(a =>
			keywords.some(k => a.toLowerCase().includes(k))
		)
	}

	const getAmenityFlags = () => {
		return {
			hasLighting: hasAmenity(["đèn", "den", "light", "lighting", "chiếu sáng"]),
			hasRoof: hasAmenity(["mái che", "roof", "covered", "trong nhà"]),
			hasAC: hasAmenity(["điều hòa", "máy lạnh", "ac", "air conditioning"]),
			hasParking: hasAmenity(["chỗ đậu xe", "đậu xe", "parking"]),
			hasShower: hasAmenity(["vòi sen", "shower"]),
			hasLocker: hasAmenity(["locker", "tủ đồ"]) 
		}
	}

	const getForecastForTime = (time: string) => {
		if (!weather?.forecast) return null
		const hour = parseInt(time.split(':')[0])
		// forecast items use human-readable HH:mm, match by hour
		return weather.forecast.find((f: any) => parseInt((f.time as string).split(':')[0]) === hour) || null
	}

  const analyzeBookingFactors = (timeSlots: any[], weather: any, court: Court) => {
    const suggestions = {
      bestTimeSlots: [] as any[],
      weatherWarnings: [] as string[],
      priceAnalysis: '',
      crowdPrediction: '',
      overallRecommendation: ''
    }

    // Analyze weather conditions
    const weatherConditions = weather.forecast.map((f: any) => f.condition.toLowerCase())
    const hasRain = weatherConditions.some((condition: string) =>
      condition.includes('mưa') || condition.includes('rain')
    )
    const hasSunny = weatherConditions.some((condition: string) =>
      condition.includes('nắng') || condition.includes('sunny')
    )

    if (hasRain) {
      suggestions.weatherWarnings.push('Có thể có mưa - nên đặt sân có mái che')
    }

    // Analyze time slots based on various factors
    const analyzedSlots = timeSlots.map(slot => {
      const hour = parseInt(slot.time.split(':')[0])
      let score = 0
      const factors = []

      // Weather factor (higher score for good weather)
      if (hasSunny && (hour >= 16 && hour <= 19)) {
        score += 3
        factors.push('Thời tiết đẹp')
      }

      // Price factor (lower price = higher score)
      const priceScore = Math.max(0, 5 - (court.pricePerHour / 100000))
      score += priceScore
      factors.push(`Giá hợp lý`)

      // Time preference factor
      if (hour >= 17 && hour <= 20) {
        score += 2
        factors.push('Giờ vàng')
      } else if (hour >= 14 && hour <= 16) {
        score += 1
        factors.push('Giờ ít đông')
      }

      // Availability factor
      if (slot.available) {
        score += 1
        factors.push('Còn trống')
      }

      return {
        ...slot,
        score,
        factors,
        recommendation: score >= 6 ? 'Tuyệt vời' : score >= 4 ? 'Tốt' : 'Khá'
      }
    })

    // Sort by score and get top recommendations
    suggestions.bestTimeSlots = analyzedSlots
      .filter(slot => slot.available)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    // Generate overall recommendation
    const bestSlot = suggestions.bestTimeSlots[0]
    if (bestSlot) {
      suggestions.overallRecommendation = `Khuyến nghị đặt lúc ${bestSlot.time} - ${bestSlot.recommendation}`
      suggestions.priceAnalysis = `Giá ${court.pricePerHour.toLocaleString('vi-VN')}đ/giờ - ${court.pricePerHour < 150000 ? 'Rất hợp lý' : court.pricePerHour < 250000 ? 'Trung bình' : 'Cao'}`
      suggestions.crowdPrediction = bestSlot.time >= '17:00' && bestSlot.time <= '20:00' ? 'Giờ cao điểm - đặt sớm' : 'Giờ ít đông - dễ đặt'
    }

    return suggestions
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
    );
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
    );
  }

  const timeSlots = generateTimeSlots();

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
                <Badge className="mb-2">
                  {getSportTypeInVietnamese(court.type)}
                </Badge>
              </div>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{court.address}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>
                    {court.openTime} - {court.closeTime}
                  </span>
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
                <span className="text-gray-600">
                  ({court.reviewCount} đánh giá)
                </span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {court.pricePerHour.toLocaleString("vi-VN")}đ/giờ
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
            {court.images.map((image, index) => (
              <img
                key={index}
                src={
                  image ||
                  "/placeholder.svg?height=200&width=300&query=sports court"
                }
                alt={`${court.name} ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
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
                  {mounted ? (
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="rounded-md border"
                      disabled={(date) => {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        return date < today
                      }}
                    />
                  ) : (
                    <div className="h-80 w-full rounded-md border bg-gray-50" />
                  )}
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
                          {!slot.available && (
                            <div className="text-xs text-red-500">Đã đặt</div>
                          )}
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
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
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
                      {/* Location Info */}
                      {weather.location && (
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                          <MapPin className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-700">Địa điểm: {weather.location}</span>
                        </div>
                      )}


                      <div className="flex gap-4">
                        {/* Current Weather */}
                        <div className="flex bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                {/* <Sun className="h-6 w-6" /> */}
                                <span className="text-lg font-semibold">Thời tiết hiện tại</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <div className="text-4xl mb-2">
                                    {getWeatherIcon(weather.current.condition, weather.current.temp)}
                                  </div>
                                </div>
                                <div className="text-2xl font-bold mb-1">{weather.current.temp}°C</div>
                              </div>
                              <div className="text-sm opacity-90">{weather.current.condition}</div>
                              {weather.current.feelsLike && (
                                <div className="text-sm opacity-75">cảm giác như {weather.current.feelsLike}°C</div>
                              )}
                            </div>
                            {/* <div className="text-right">
                              <div className="text-4xl mb-2">
                                {getWeatherIcon(weather.current.condition, weather.current.temp)}
                              </div>
                            </div> */}
                          </div>
                        </div>


                        {/* Weather Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Card>
                            <CardContent className="p-4 text-center">
                              <div className="text-2xl mb-1">💧</div>
                              <div className="text-sm text-gray-600">Độ ẩm</div>
                              <div className="font-semibold">{weather.current.humidity}%</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <div className="text-2xl mb-1">💨</div>
                              <div className="text-sm text-gray-600">Gió</div>
                              <div className="font-semibold">{weather.current.windSpeed} km/h</div>
                            </CardContent>
                          </Card>
                          {weather.current.pressure && (
                            <Card>
                              <CardContent className="p-4 text-center">
                                <div className="text-2xl mb-1">📊</div>
                                <div className="text-sm text-gray-600">Áp suất</div>
                                <div className="font-semibold">{weather.current.pressure} hPa</div>
                              </CardContent>
                            </Card>
                          )}
                          <Card>
                            <CardContent className="p-4 text-center">
                              <div className="text-2xl mb-1">📍</div>
                              <div className="text-sm text-gray-600">Tọa độ</div>
                              <div className="font-semibold text-xs">
                                {weather.coordinates?.lat?.toFixed(2)}, {weather.coordinates?.lon?.toFixed(2)}
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                      </div>


                      {/* 7-Day Forecast */}
                      {weather.sevenDayForecast && weather.sevenDayForecast.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <span className="mr-2">📅</span>
                            Dự báo 7 ngày tới
                          </h3>
                          <div className="grid grid-cols-7 gap-2">
                            {weather.sevenDayForecast.map((day: any, index: number) => (
                              <Card key={index} className={`hover:shadow-md transition-shadow`}>
                                <CardContent className="p-3 text-center">
                                  <div className="font-semibold text-sm mb-1">{day.dayName}</div>
                                  <div className="text-2xl mb-1">
                                    {getWeatherIcon(day.condition, day.temp || 25)}
                                  </div>
                                  <div className="text-sm font-bold text-gray-800">
                                    {day.temp ? `${day.temp}°C` : 'N/A'}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">{day.condition}</div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hourly Forecast for Selected Date */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <span className="mr-2">⏰</span>
                          <span suppressHydrationWarning>
                            Dự báo theo giờ - {mounted ? selectedDate.toLocaleDateString('vi-VN', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : '...'}
                          </span>
                        </h3>
                        {weather.forecast && weather.forecast.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {weather.forecast.map((item: any, index: number) => (
                              <Card key={index} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4 text-center">
                                  <div className="font-semibold text-sm mb-2">{item.time}</div>
                                  <div className="text-3xl mb-2">
                                    {getWeatherIcon(item.condition, item.temp)}
                                  </div>
                                  <div className="text-lg font-bold text-gray-800">{item.temp}°C</div>
                                  <div className="text-xs text-gray-600 mt-1">{item.condition}</div>
                                  {item.humidity && (
                                    <div className="text-xs text-gray-500 mt-1">💧 {item.humidity}%</div>
                                  )}
                                  {item.windSpeed && (
                                    <div className="text-xs text-gray-500 mt-1">💨 {item.windSpeed} km/h</div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            <div className="text-4xl mb-4">🌤️</div>
                            <div className="text-lg font-semibold mb-2">Chưa có thông tin thời tiết</div>
                            <div className="text-sm" suppressHydrationWarning>
                              Dữ liệu thời tiết cho ngày {mounted ? selectedDate.toLocaleDateString('vi-VN') : '...'} chưa được cập nhật
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <div className="text-gray-500">Đang tải thông tin thời tiết...</div>
                    </div>
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
                            <span className="font-semibold">
                              {review.user.name}
                            </span>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{review.rating}</span>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-2">{review.comment}</p>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </span>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center text-gray-500">
                      Chưa có đánh giá nào
                    </div>
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
                    <span className="font-medium text-blue-800">
                      💡 Khung giờ tốt nhất:
                    </span>
                    <p className="text-blue-700">
                      19:00 - Thời tiết mát mẻ, giá hợp lý
                    </p>
                  </div>
                  {weather &&
                    weather.forecast.some((f: any) =>
                      f.condition.includes("mưa")
                    ) && (
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <span className="font-medium text-yellow-800">
                          ⚠️ Lưu ý:
                        </span>
                        <p className="text-yellow-700">
                          Có thể có mưa trong một số khung giờ
                        </p>
                      </div>
                    )}
                  <div className="p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-green-800">
                      ⭐ Đánh giá cao:
                    </span>
                    <p className="text-green-700">
                      Sân này được đánh giá {court.rating}/5 sao
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced AI Suggestions Section */}
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Sparkles className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-purple-900">Gợi ý AI Thông Minh</CardTitle>
                      <CardDescription className="text-purple-700">
                        Phân tích thời tiết, giá cả và đánh giá để đưa ra gợi ý tốt nhất
                      </CardDescription>
                      {aiSuggestions && (
                        <div className="text-sm text-purple-600 mt-1">
                          📅 Cho ngày: {selectedDate.toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  {aiSuggestions && (
                    <Button
                      onClick={() => {
                        setAiSuggestions(null)
                        setTimeout(() => generateAISuggestions(), 100)
                      }}
                      variant="outline"
                      size="sm"
                      className="border-purple-300 text-purple-700 hover:bg-purple-100"
                      disabled={generatingSuggestions}
                    >
                      {generatingSuggestions ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700 mr-2"></div>
                          Đang làm mới...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Làm mới
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!aiSuggestions ? (
                  <div className="text-center py-8">
                    <div className="p-4 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">Bắt đầu phân tích AI</h3>
                    <p className="text-purple-700 mb-6">Nhận gợi ý thông minh dựa trên thời tiết, giá cả và đánh giá</p>
                    <Button
                      onClick={generateAISuggestions}
                      disabled={generatingSuggestions || !weather}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
                      size="lg"
                    >
                      {generatingSuggestions ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Đang phân tích...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-3" />
                          Tạo gợi ý AI
                        </>
                      )}
                    </Button>
                    {!weather && (
                      <p className="text-sm text-purple-600 mt-4">
                        ⏳ Đang tải thông tin thời tiết...
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">

                    {/* Best Time Slots Grid */}
                    {aiSuggestions.bestTimeSlots && aiSuggestions.bestTimeSlots.length > 0 && (
                      <div className="bg-white rounded-xl p-6 border border-purple-200">
                        <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                          <span className="mr-2">⏰</span>
                          Khung giờ tốt nhất
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {aiSuggestions.bestTimeSlots.map((slot: any, index: number) => {
                            const f = getForecastForTime(slot.time)
                            const flags = getAmenityFlags()
                            return (
                              <div key={slot.time} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-2xl font-bold text-blue-900">{slot.time}</span>
                                  <Badge
                                    variant={slot.recommendation === 'Tuyệt vời' ? 'default' : 'secondary'}
                                    className={slot.recommendation === 'Tuyệt vời' ? 'bg-green-500' : 'bg-blue-500'}
                                  >
                                    {slot.recommendation}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2 text-blue-800">
                                    {f ? (
                                      <>
                                        <span className="text-lg">{getWeatherIcon(f.condition, f.temp)}</span>
                                        <span>{f.temp}°C</span>
                                        <span className="opacity-80">{f.condition}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Thermometer className="h-4 w-4" />
                                        <span>Không có dự báo giờ</span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 text-blue-900">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">{court.rating}</span>
                                  </div>
                                </div>
                                <div className="mt-2 text-sm text-blue-700">
                                  {slot.factors?.slice(0, 3).join(' • ')}
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-blue-900">
                                    {flags.hasLighting && <Lightbulb className="h-4 w-4" />}
                                    {flags.hasRoof && <Umbrella className="h-4 w-4" />}
                                    {flags.hasAC && <Snowflake className="h-4 w-4" />}
                                    {flags.hasParking && <Car className="h-4 w-4" />}
                                    {flags.hasShower && <Shower className="h-4 w-4" />}
                                    {flags.hasLocker && <Lock className="h-4 w-4" />}
                                    {f?.windSpeed ? (
                                      <div className="flex items-center gap-1 text-xs text-blue-700"><Wind className="h-4 w-4" />{f.windSpeed} km/h</div>
                                    ) : null}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-blue-600">
                                    <span>Điểm: <span className="font-semibold">{slot.score}/10</span></span>
                                    <Button size="sm" variant="outline" onClick={() => setSelectedSlot(slot.time)}>Chọn</Button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Analysis Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div className="bg-white rounded-xl p-6 border border-green-200">
                          <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                            <span className="mr-2">💡</span>
                            Mẹo hữu ích
                          </h3>
                          <p className="text-green-800 leading-relaxed">{aiSuggestions.tips}</p>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-yellow-200">
                          <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center">
                            <span className="mr-2">⚠️</span>
                            Lưu ý thời tiết
                          </h3>
                          <p className="text-yellow-800 leading-relaxed">{aiSuggestions.weatherAdvice}</p>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        {aiSuggestions.seasonalAdvice && (
                          <div className="bg-white rounded-xl p-6 border border-teal-200">
                            <h3 className="text-lg font-semibold text-teal-900 mb-3 flex items-center">
                              <span className="mr-2">🌤️</span>
                              Lời khuyên theo mùa
                            </h3>
                            <p className="text-teal-800 leading-relaxed">{aiSuggestions.seasonalAdvice}</p>
                          </div>
                        )}
                      </div>
                    </div>
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

