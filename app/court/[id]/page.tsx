"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
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
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "./styles.css";
import AvailabilityCalendar from "@/components/shared/availability-calendar/index";
import Header from "@/components/shared/header";
import Footer from "@/components/shared/footer";
import GuestBookingModal from "@/components/GuestBookingModal";

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
  openTime: string; // "06:00:00"
  closeTime: string; // "22:00:00"
  latitude: number;
  longitude: number;
  owner: { name: string; phone: string };
  bookedSlots: string[];
}

type CourtEvent = {
  id: string;
  start: string;
  end: string;
  display: "background";
  classNames: string[];
  extendedProps: { status: "booked" };
};

type BookedByDate = Record<string, string[]>; // { "2025-08-18": ["08:00","08:30", ...] }

// ===== Helpers =====
function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

// "HH:MM" -> tạo khoảng [start, end) theo 60'
function toRange(dateStr: string, hhmm: string, defaultMin = 60) {
  const [h, m] = hhmm.split(":").map(Number);
  const start = new Date(
    `${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`
  );
  const end = new Date(start.getTime() + defaultMin * 60 * 1000);
  return { start, end };
}

// Call API theo khoảng ngày (có thể truyền subCourtId)
async function fetchAvailabilityRange(
  courtId: string,
  startDate: string,
  endDate: string
): Promise<BookedByDate> {
  const q = new URLSearchParams({ courtId, startDate, endDate });
  const res = await fetch(`/api/courts/availability?${q.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    // giúp debug nhanh khi 404/500
    const txt = await res.text().catch(() => "");
    throw new Error(`Availability ${res.status}: ${txt || res.statusText}`);
  }
  const data = await res.json();
  if (!data?.success)
    throw new Error(data?.error || "Fetch availability failed");
  return data.data as BookedByDate;
}

export default function CourtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [court, setCourt] = useState<Court | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selStart, setSelStart] = useState<Date | null>(null);
  const [selEnd, setSelEnd] = useState<Date | null>(null);

  const [loading, setLoading] = useState(true);
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
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const { user } = useAuth();

  // NEW: visible range & availability state

  const [bookedByDate, setBookedByDate] = useState<BookedByDate>({});
  const [availLoading, setAvailLoading] = useState(false);

  // Guest booking modal state
  const [showGuestModal, setShowGuestModal] = useState(false);

  // Nhớ khoảng đã fetch lần gần nhất để tránh fetch lặp
  const lastRangeRef = useRef<{
    courtId: string;
    start: string;
    end: string;
    sub?: string;
  } | null>(null);

  // ===== Initial fetches =====
  useEffect(() => {
    if (!params.id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/courts/${params.id}`);
        const data = await res.json();
        if (data.success) setCourt(data.data);
        else console.error("Court not found");
      } catch (error) {
        console.error("Error fetching court:", error);
      } finally {
        setLoading(false);
      }
    })();

    // Weather will be fetched after court data is loaded

    (async () => {
      try {
        setReviewsLoading(true);
        const res = await fetch(`/api/courts/${params.id}/reviews`);
        const data = await res.json();
        if (data.success) {
          setReviews(data.data);
          setTotalReviews(data.pagination.total);
        } else {
          console.error("Error fetching reviews:", data.error);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setReviewsLoading(false);
      }
    })();
  }, [params.id]);

  // Fetch weather after court data is loaded
  useEffect(() => {
    if (!court?.latitude || !court?.longitude) return;

    (async () => {
      try {
        setWeatherLoading(true);
        const res = await fetch(`/api/weather?lat=${court.latitude}&lon=${court.longitude}`);
        const data = await res.json();
        if (data.success) {
          console.log(`Received ${data.data.daily?.length || 0} daily forecasts:`, data.data.daily?.map((d: any) => d.day));
          setWeather(data.data);
        } else {
          console.error("Weather API error:", data.error);
          setWeather(null);
        }
      } catch (error) {
        console.error("Error fetching weather:", error);
        setWeather(null);
      } finally {
        setWeatherLoading(false);
      }
    })();
  }, [court?.latitude, court?.longitude]);

  // ===== UI helpers =====
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
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getSportTypeInVietnamese = (type: string) => {
    const sportMap: Record<string, string> = {
      football: "Bóng đá mini",
      badminton: "Cầu lông",
      tennis: "Tennis",
      basketball: "Bóng rổ",
      volleyball: "Bóng chuyền",
      pickleball: "Pickleball",
    };
    return sportMap[type] || type;
  };

  const getWeatherIcon = (iconCode: string) => {
    if (iconCode.includes('01')) return '☀️';
    if (iconCode.includes('02')) return '⛅';
    if (iconCode.includes('03') || iconCode.includes('04')) return '☁️';
    if (iconCode.includes('09') || iconCode.includes('10')) return '🌧️';
    if (iconCode.includes('11')) return '⛈️';
    if (iconCode.includes('13')) return '❄️';
    if (iconCode.includes('50')) return '🌫️';
    return '🌤️';
  };

  const getWeatherBackground = (iconCode: string) => {
    if (iconCode.includes('01')) return 'from-yellow-50 to-orange-100';
    if (iconCode.includes('02')) return 'from-blue-50 to-indigo-100';
    if (iconCode.includes('03') || iconCode.includes('04')) return 'from-gray-50 to-blue-100';
    if (iconCode.includes('09') || iconCode.includes('10')) return 'from-blue-50 to-gray-100';
    if (iconCode.includes('11')) return 'from-purple-50 to-gray-100';
    if (iconCode.includes('13')) return 'from-blue-50 to-white';
    if (iconCode.includes('50')) return 'from-gray-50 to-white';
    return 'from-blue-50 to-indigo-100';
  };

  const slotMinTime = court?.openTime || "06:00:00";
  const slotMaxTime = court?.closeTime || "22:00:00";

  const formatTime = (d?: Date | null) =>
    d
      ? `${String(d.getHours()).padStart(2, "0")}:${String(
          d.getMinutes()
        ).padStart(2, "0")}:00`
      : "";

  const hoursSelected = useMemo(() => {
    if (!selStart || !selEnd) return 0;
    return (selEnd.getTime() - selStart.getTime()) / 3_600_000;
  }, [selStart, selEnd]);

  const totalPrice = useMemo(() => {
    if (!court) return 0;
    return Math.max(0, hoursSelected) * court.pricePerHour;
  }, [hoursSelected, court]);

  const handleBooking = async () => {
    if (!selStart || !selEnd) return alert("Vui lòng chọn khoảng thời gian");
    
    // If user is logged in, book directly
    if (user) {
      await bookForUser();
    } else {
      // If not logged in, show guest booking modal
      setShowGuestModal(true);
    }
  };

  const bookForUser = async () => {
    if (!selStart || !selEnd) return;
    
    const userId = user?.id;
    const d = selStart;
    const selectedDateStr = ymd(d);
    
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          courtId: court?._id,
          date: selectedDateStr,
          startTime: formatTime(selStart),
          endTime: formatTime(selEnd),
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

  const handleGuestBooking = async (guestData: { 
    guestName: string; 
    guestPhone: string; 
    notes?: string; 
  }) => {
    if (!selStart || !selEnd) return;
    
    const d = selStart;
    const selectedDateStr = ymd(d);
    
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: court?._id,
          date: selectedDateStr,
          startTime: formatTime(selStart),
          endTime: formatTime(selEnd),
          guestName: guestData.guestName,
          guestPhone: guestData.guestPhone,
          notes: guestData.notes,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setShowGuestModal(false);
        alert("Đặt sân thành công! Cảm ơn bạn đã sử dụng dịch vụ.");
        // Reset selection
        setSelStart(null);
        setSelEnd(null);
      } else {
        alert(data.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Có lỗi xảy ra khi đặt sân");
    }
  };

  const handleSelect = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      setSelStart(start);
      setSelEnd(end);
      setSelectedDate(start);
    },
    []
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '10s' }}></div>
          <div className="absolute bottom-40 right-20 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '3s', animationDuration: '8s' }}></div>
          <div className="absolute top-1/2 left-10 w-24 h-24 bg-teal-500/10 rounded-full blur-xl animate-bounce" style={{ animationDelay: '6s', animationDuration: '12s' }}></div>
          </div>

        <Header />
        
        <div className="mx-auto max-w-[75%] px-4 py-8 relative z-10">
          <div className="space-y-8">
            {/* Enhanced Loading Hero */}
            <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-8 overflow-hidden">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 bg-gradient-to-r from-emerald-200 via-emerald-100 to-transparent rounded-lg animate-pulse w-64"></div>
                    <div className="h-8 bg-gradient-to-r from-cyan-200 via-cyan-100 to-transparent rounded-full animate-pulse w-24"></div>
        </div>
                  <div className="space-y-3">
                    <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-transparent rounded animate-pulse w-80"></div>
                    <div className="flex gap-6">
                      <div className="h-5 bg-gradient-to-r from-emerald-200 via-emerald-100 to-transparent rounded animate-pulse w-32"></div>
                      <div className="h-5 bg-gradient-to-r from-teal-200 via-teal-100 to-transparent rounded animate-pulse w-28"></div>
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
                    <div className="h-8 bg-gradient-to-r from-yellow-200 via-yellow-100 to-transparent rounded animate-pulse w-32 mb-2"></div>
                    <div className="h-10 bg-gradient-to-r from-emerald-200 via-emerald-100 to-transparent rounded animate-pulse w-40"></div>
                  </div>
                </div>
              </div>
              
              {/* Loading Image Gallery */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-[4/3] bg-gradient-to-br from-emerald-200 via-emerald-100 to-cyan-100 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Loading Tabs */}
            <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-2">
              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-gradient-to-r from-gray-200 via-gray-100 to-transparent rounded-xl animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Loading Content */}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6 space-y-4">
                <div className="h-8 bg-gradient-to-r from-emerald-200 via-emerald-100 to-transparent rounded-lg animate-pulse w-48"></div>
                <div className="h-96 bg-gradient-to-br from-emerald-200 via-emerald-100 to-cyan-100 rounded-xl animate-pulse"></div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6 space-y-4">
                <div className="h-8 bg-gradient-to-r from-cyan-200 via-cyan-100 to-transparent rounded-lg animate-pulse w-32"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-transparent rounded animate-pulse"></div>
                  ))}
                </div>
                <div className="h-12 bg-gradient-to-r from-emerald-200 via-emerald-100 to-transparent rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  if (!court) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 relative overflow-hidden flex items-center justify-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '10s' }}></div>
          <div className="absolute bottom-40 right-20 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '3s', animationDuration: '8s' }}></div>
          <div className="absolute top-1/2 left-10 w-24 h-24 bg-teal-500/10 rounded-full blur-xl animate-bounce" style={{ animationDelay: '6s', animationDuration: '12s' }}></div>
        </div>

        <Header />

        <div className="mx-auto max-w-[75%] px-4 py-8 relative z-10">
          <div className="text-center bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-12 max-w-lg mx-auto animate-fade-in">
          <div className="text-8xl mb-6 animate-bounce">🏟️</div>
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-gray-800 via-emerald-700 to-gray-800 bg-clip-text text-transparent">
            Không tìm thấy sân
          </h1>
          <p className="text-gray-600 mb-8 font-medium">
            Sân thể thao này có thể đã bị xóa hoặc không tồn tại trong hệ thống.
          </p>
          <div className="space-y-4">
          <Link href="/search">
              <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105 py-3 font-semibold">
                <span className="flex items-center justify-center space-x-2">
                  <span>🔍</span>
                  <span>Tìm kiếm sân khác</span>
                </span>
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 py-3 font-semibold">
                <span className="flex items-center justify-center space-x-2">
                  <span>🏠</span>
                  <span>Về trang chủ</span>
                </span>
              </Button>
          </Link>
        </div>
        </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '10s' }}></div>
        <div className="absolute bottom-40 right-20 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '3s', animationDuration: '8s' }}></div>
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-teal-500/10 rounded-full blur-xl animate-bounce" style={{ animationDelay: '6s', animationDuration: '12s' }}></div>
        
        {/* Floating Sports Icons */}
        <div className="absolute top-32 right-32 text-4xl animate-spin opacity-10" style={{ animationDuration: '30s' }}>🏟️</div>
        <div className="absolute bottom-32 left-32 text-3xl animate-pulse opacity-10" style={{ animationDelay: '2s' }}>⚽</div>
        <div className="absolute top-2/3 right-10 text-3xl animate-spin opacity-10" style={{ animationDelay: '4s', animationDuration: '25s' }}>🏀</div>
        <div className="absolute bottom-1/4 right-1/3 text-2xl animate-pulse opacity-10" style={{ animationDelay: '1s' }}>🎾</div>
            </div>

      <Header />

      <main className="mx-auto max-w-[75%] px-4 py-8 space-y-6 relative z-10">
        {/* Enhanced HERO Section */}
        <section className="bg-gradient-to-br from-white/80 via-emerald-50/50 to-cyan-50/50 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-8 animate-fade-in overflow-hidden relative">
          {/* Hero Background Elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 right-4 w-20 h-20 bg-emerald-300/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-cyan-300/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-8">
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 via-emerald-700 to-gray-800 bg-clip-text text-transparent">
                  {court.name}
                </h1>
                <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-600 text-white border-0 shadow-lg px-4 py-2 text-sm font-semibold">
                  {getSportTypeInVietnamese(court.type)}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-gray-700 group">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400/20 to-cyan-500/20 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <MapPin className="h-4 w-4 text-cyan-600" />
              </div>
                  <span className="font-medium group-hover:text-cyan-700 transition-colors">{court.address}</span>
                </div>
                
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center text-gray-700 group">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                      <Clock className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="font-medium group-hover:text-emerald-700 transition-colors">
                    {court.openTime} - {court.closeTime}
                  </span>
                </div>
                  
                  <div className="flex items-center text-gray-700 group">
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-400/20 to-teal-500/20 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                      <Phone className="h-4 w-4 text-teal-600" />
                    </div>
                    <span className="font-medium group-hover:text-teal-700 transition-colors">{court.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Stats Section */}
            <div className="lg:text-right shrink-0 space-y-4">
              <div className="bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl">
                <div className="flex items-center justify-center lg:justify-end gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">{court.rating}</span>
                  <span className="text-gray-600 font-medium">
                  ({court.reviewCount} đánh giá)
                </span>
              </div>
                <div className="text-center lg:text-right">
                  <div className="text-3xl font-black bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 bg-clip-text text-transparent">
                    {court.pricePerHour.toLocaleString("vi-VN")}đ
                  </div>
                  <div className="text-sm text-gray-600 font-medium">mỗi giờ</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Image Gallery */}
          {!!court.images?.length && (
            <div className="mt-8 relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {court.images.map((src, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1">
                <img
                  src={
                    src ||
                    "/placeholder.svg?height=200&width=300&query=sports court"
                  }
                  alt={`${court.name} ${i + 1}`}
                      className="w-full aspect-[4/3] object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                        <span className="text-sm font-semibold text-gray-800">Ảnh {i + 1}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="booking" className="space-y-3">
          <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl sticky top-16 z-10 p-2">
            <TabsList className="w-full grid grid-cols-4 bg-transparent rounded-xl gap-1">
              <TabsTrigger 
                value="booking" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/25 font-semibold transition-all duration-300 hover:bg-white/80 rounded-xl py-3 px-4"
              >
                <span className="flex items-center space-x-2">
                  <span>📅</span>
                  <span>Đặt sân</span>
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="info" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25 font-semibold transition-all duration-300 hover:bg-white/80 rounded-xl py-3 px-4"
              >
                <span className="flex items-center space-x-2">
                  <span>ℹ️</span>
                  <span>Thông tin</span>
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="weather" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 font-semibold transition-all duration-300 hover:bg-white/80 rounded-xl py-3 px-4"
              >
                <span className="flex items-center space-x-2">
                  <span>🌤️</span>
                  <span>Thời tiết</span>
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 font-semibold transition-all duration-300 hover:bg-white/80 rounded-xl py-3 px-4"
              >
                <span className="flex items-center space-x-2">
                  <span>⭐</span>
                  <span>Đánh giá</span>
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Enhanced Booking tab */}
          <TabsContent value="booking" className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="grid 2xl:grid-cols-10 xl:grid-cols-10 lg:grid-cols-3 md:grid-cols-1 gap-6 max-w-none">
              <Card className="2xl:col-span-7 xl:col-span-7 lg:col-span-2 md:col-span-1 overflow-hidden bg-gradient-to-br from-white/80 via-emerald-50/40 to-cyan-50/40 backdrop-blur-md border border-emerald-200/30 shadow-2xl ring-1 ring-emerald-500/10">
                <CardHeader className="bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-cyan-500/15 border-b border-emerald-200/40 p-8 relative overflow-hidden">
                  {/* Header Background Elements */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl transform rotate-45"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/10 rounded-full blur-2xl"></div>
                  </div>
                  
                  <div className="relative z-10">
                    <CardTitle className="text-4xl font-black bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-800 bg-clip-text text-transparent flex items-center space-x-5 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                        <span className="text-3xl">📅</span>
                      </div>
                      <span>Lịch đặt sân thông minh</span>
                    </CardTitle>
                    <CardDescription className="text-gray-700 font-semibold text-lg leading-relaxed">
                      Hệ thống đặt sân hiện đại với AI tự động gợi ý khung giờ tối ưu.{" "}
                      <span className="text-emerald-600 font-bold">Kéo và thả</span> để chọn nhiều giờ liên tiếp.
                  </CardDescription>
                    
                    {/* Quick Stats */}
                    <div className="flex items-center gap-6 mt-4">
                      <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-emerald-200/50">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold text-emerald-700">Thời gian thực</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-cyan-200/50">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold text-cyan-700">Tự động cập nhật</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Premium Legend & Status Bar */}
                <div className="relative bg-gradient-to-r from-emerald-50/80 via-white/60 to-cyan-50/80 backdrop-blur-md border-b border-emerald-200/40 p-6">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='m0 40l40-40h-40z'/%3E%3C/g%3E%3C/svg%3E")` 
                    }}></div>
                  </div>
                  
                  <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    {/* Enhanced Legend */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 xl:mb-0">
                        <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-white">📊</span>
                        </div>
                        <span>Trạng thái lịch:</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="group cursor-pointer">
                          <span className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200/60 text-red-700 font-bold shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                            <div className="relative">
                              <span className="inline-block h-4 w-4 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-md" />
                              <span className="absolute inset-0 h-4 w-4 rounded-full bg-red-500 animate-ping opacity-75"></span>
                            </div>
                            <span>Đã được đặt</span>
                            {/* <div className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">Không thể chọn</div> */}
                    </span>
                        </div>
                        
                        <div className="group cursor-pointer">
                          <span className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200/60 text-gray-700 font-bold shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                            <span className="inline-block h-4 w-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 shadow-md" />
                            <span>Quá giờ</span>
                            {/* <div className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full">Hết hạn</div> */}
                    </span>
                  </div>
                        
                        <div className="group cursor-pointer">
                          <span className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200/60 text-emerald-700 font-bold shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                            <div className="relative">
                              <span className="inline-block h-4 w-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md" />
                              <span className="absolute inset-0 h-4 w-4 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
                            </div>
                            <span>Có thể đặt</span>
                            {/* <div className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1 rounded-full">✨ Sẵn sàng</div> */}
                    </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Selection Display & Instructions */}
                    <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4">
                      <div className="flex items-center gap-3 text-sm font-semibold text-gray-600 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-200/50">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-white">💡</span>
                        </div>
                        <span className="hidden lg:inline">Kéo chuột để chọn nhiều giờ liên tiếp</span>
                        <span className="lg:hidden">Bấm để chọn giờ</span>
                      </div>
                      
                    
                    </div>
                    
                  </div>
                  {selStart && selEnd && (
                        <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 text-white rounded-2xl px-6 py-3 shadow-xl transform hover:scale-105 transition-all duration-300 animate-fade-in mt-3 max-w-[40%]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                              <span className="text-lg">🕐</span>
                            </div>
                            <div>
                              <div className="font-black text-lg">
                                {selectedDate.toLocaleDateString("vi-VN")}
                              </div>
                              <div className="text-emerald-100 font-semibold">
                                {formatTime(selStart).slice(0, 5)} – {formatTime(selEnd).slice(0, 5)}
                              </div>
                            </div>
                            <div className="text-right flex ml-4">
                              <div className="text-emerald-200 font-medium pr-4">Đã chọn</div>
                              <div className="font-bold">{hoursSelected}h</div>
                            </div>
                          </div>
                        </div>
                      )}
                </div>

               

                <CardContent className="p-6 bg-gradient-to-br from-white/50 to-emerald-50/30 relative">
                  {/* Loading State */}
                  {availLoading && (
                    <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-spin">
                          <span className="text-xl">⚡</span>
                        </div>
                        <div className="text-emerald-700 font-bold text-lg">Đang tải lịch thông minh...</div>
                        <div className="text-emerald-600 text-sm font-medium">Hệ thống đang cập nhật trạng thái sân</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Calendar Background Pattern */}
                  <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute inset-0" style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/svg%3E")` 
                    }}></div>
                  </div>
                  
                  {/* Enhanced Calendar Container */}
                  <div className="relative z-10 bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-200/40 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-4 border-b border-emerald-200/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-white text-sm">📋</span>
                          </div>
                          <div>
                            <div className="font-black text-emerald-800 text-lg">Lịch chi tiết</div>
                            <div className="text-emerald-600 text-sm font-semibold">Tương tác trực tiếp với lịch</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                            Thời gian thực
                          </div>
                          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-10">
                      <div className="min-h-[750px] w-full">
                  <AvailabilityCalendar
                    courtId={String(court._id)}
                    openTime={slotMinTime}
                    closeTime={slotMaxTime}
                    slotMinutes={60}
                    onSelect={handleSelect}
                    onLoadingChange={setAvailLoading}
                  />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Premium Booking Sidebar */}
              <Card className="2xl:col-span-3 xl:col-span-3 lg:col-span-1 md:col-span-1 h-fit lg:sticky lg:top-20 bg-gradient-to-br from-white/80 via-cyan-50/40 to-emerald-50/40 backdrop-blur-md border border-cyan-200/30 shadow-2xl overflow-hidden ring-1 ring-cyan-500/10">
                <CardHeader className="bg-gradient-to-br from-cyan-500/15 via-emerald-500/10 to-cyan-500/15 border-b border-cyan-200/40 p-6 relative overflow-hidden">
                  {/* Header Background Effects */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-emerald-400/10 rounded-full blur-2xl transform rotate-45"></div>
                    <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-blue-400/5 rounded-full blur-xl"></div>
                  </div>
                  
                  <div className="relative z-10">
                    <CardTitle className="text-2xl font-black bg-gradient-to-r from-cyan-700 via-emerald-600 to-cyan-800 bg-clip-text text-transparent flex items-center space-x-4 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl transform -rotate-3 hover:rotate-0 transition-all duration-300">
                        <span className="text-2xl">🎯</span>
                      </div>
                      <span>Đặt sân thông minh</span>
                    </CardTitle>
                    <CardDescription className="text-gray-700 font-semibold text-base leading-relaxed">
                      <span className="text-cyan-600 font-bold">AI-powered</span> booking system với{" "}
                      <span className="text-emerald-600 font-bold">xác nhận tức thì</span>
                  </CardDescription>
                    
                    {/* Status Indicators */}
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm rounded-full px-3 py-2 border border-cyan-200/50">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-cyan-700">Sẵn sàng</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm rounded-full px-3 py-2 border border-emerald-200/50">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-emerald-700">An toàn</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6 bg-gradient-to-br from-white/50 to-cyan-50/30 relative">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute inset-0" style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2306b6d4' fill-opacity='0.1'%3E%3Cpath d='M15 15m-5 0a5,5 0 1,1 10,0a5,5 0 1,1 -10,0'/%3E%3C/g%3E%3C/svg%3E")` 
                    }}></div>
                  </div>
                  
                  {/* Premium Booking Summary */}
                  <div className="relative z-10 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-md rounded-3xl border border-white/40 shadow-xl p-6 space-y-5">
                    {/* Header */}
                    <div className="text-center pb-4 border-b border-gray-200/50">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl transform rotate-3 hover:rotate-0 transition-all duration-300">
                        <span className="text-2xl">📊</span>
                      </div>
                      <h3 className="text-2xl font-black bg-gradient-to-r from-cyan-700 to-emerald-700 bg-clip-text text-transparent">
                        Chi tiết đặt sân
                      </h3>
                      <p className="text-gray-600 font-semibold">Thông tin booking của bạn</p>
                    </div>
                    
                    {/* Booking Details */}
                    <div className="space-y-5">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200/40">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-lg">📅</span>
                          </div>
                          <span className="font-bold text-gray-800">Ngày đặt</span>
                        </div>
                        <span className="font-black text-lg text-blue-700">
                          {selStart ? selStart.toLocaleDateString("vi-VN") : "Chưa chọn"}
                      </span>
                    </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-200/40">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-lg">🕐</span>
                          </div>
                          <span className="font-bold text-gray-800">Khung giờ</span>
                        </div>
                        <span className="font-black text-lg text-emerald-700">
                        {selStart && selEnd
                            ? `${formatTime(selStart).slice(0, 5)} – ${formatTime(selEnd).slice(0, 5)}`
                            : "Chưa chọn"}
                      </span>
                    </div>
                      
                    {hoursSelected > 0 && (
                      <>
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl border border-purple-200/40">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
                                <span className="text-lg">⏱️</span>
                        </div>
                              <span className="font-bold text-gray-800">Tổng thời gian</span>
                            </div>
                            <span className="font-black text-lg text-purple-700">{hoursSelected} giờ</span>
                          </div>
                          
                          {/* Total Price Section */}
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-3xl blur-lg opacity-20 animate-pulse"></div>
                            <div className="relative bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 rounded-3xl p-6 border-2 border-orange-200/60 shadow-xl">
                              <div className="space-y-4">
                                {/* Title and Icon Section */}
                                <div className="flex items-center space-x-4">
                                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl animate-bounce flex-shrink-0">
                                    <span className="text-2xl">💰</span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-black text-xl text-gray-800">Tổng thanh toán</div>
                                    <div className="text-sm text-orange-600 font-semibold">
                                      {court.pricePerHour.toLocaleString("vi-VN")}đ × {hoursSelected}h
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Price Section */}
                                <div className="text-center">
                                  <div className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-orange-600 via-red-600 to-red-700 bg-clip-text text-transparent">
                                    {totalPrice.toLocaleString("vi-VN")}đ
                                  </div>
                                  <div className="text-sm text-orange-600 font-bold mt-1">VND</div>
                                </div>
                              </div>
                            </div>
                        </div>
                      </>
                    )}
                      
                      {!selStart && !selEnd && (
                        <div className="text-center py-8">
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-3xl flex items-center justify-center mx-auto mb-4 opacity-60">
                            <span className="text-3xl">⏰</span>
                          </div>
                          <div className="text-gray-500 font-bold text-lg">Chưa chọn thời gian</div>
                          <div className="text-gray-400 text-sm font-medium">Vui lòng chọn khung giờ trên lịch</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Premium Booking Button */}
                  <div className="relative">
                    {!selStart || !selEnd ? (
                  <Button
                        className="w-full py-6 font-black text-xl bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-2xl shadow-lg cursor-not-allowed opacity-60"
                        disabled={true}
                      >
                        <span className="flex items-center justify-center space-x-4">
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-xl">⏰</span>
                          </div>
                          <span>Chọn thời gian để tiếp tục</span>
                        </span>
                      </Button>
                    ) : (
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
                        <Button
                          className="relative w-full py-6 font-black text-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white rounded-2xl shadow-2xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 border-2 border-emerald-300/50"
                    onClick={handleBooking}
                        >
                          <span className="flex items-center justify-center space-x-4">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                              <span className="text-xl">🚀</span>
                            </div>
                            <div className="text-left">
                              <div className="text-xl font-black">
                                {user ? "Đặt sân ngay lập tức" : "Đặt sân nhanh chóng"}
                              </div>
                              <div className="text-xs text-emerald-100 font-semibold">
                                {user ? "Xác nhận trong 3 giây" : "Không cần tạo tài khoản"}
                              </div>
                            </div>
                          </span>
                  </Button>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Guide Section */}
                  <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 backdrop-blur-sm border border-blue-200/40 rounded-3xl p-6 relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0" style={{ 
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233b82f6' fill-opacity='0.1'%3E%3Cpath d='M10 10m-3 0a3,3 0 1,1 6,0a3,3 0 1,1 -6,0'/%3E%3C/g%3E%3C/svg%3E")` 
                      }}></div>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 hover:rotate-0 transition-transform duration-300">
                          <span className="text-2xl">💡</span>
                        </div>
                        <div>
                          <h4 className="text-xl font-black bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                            Hướng dẫn đặt sân thông minh
                          </h4>
                          <p className="text-blue-600 font-semibold text-sm">AI-powered booking experience</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                            1
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 mb-1">Chọn thời gian</div>
                            <div className="text-sm text-gray-600 font-medium">Kéo chuột trên lịch để chọn khung giờ mong muốn. Hệ thống hỗ trợ chọn nhiều giờ liên tiếp.</div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                            2
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 mb-1">Kiểm tra thông tin</div>
                            <div className="text-sm text-gray-600 font-medium">Xem lại ngày, giờ và tổng chi phí. AI sẽ tự động tính toán giá thuê phù hợp.</div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                            3
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 mb-1">Xác nhận đặt sân</div>
                            <div className="text-sm text-gray-600 font-medium">Bấm nút "Đặt sân ngay" để hoàn tất. Bạn sẽ nhận được xác nhận trong vài giây.</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Pro Tips */}
                      <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 rounded-2xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-white">⭐</span>
                          </div>
                          <span className="font-bold text-yellow-800">Pro Tips:</span>
                        </div>
                        <ul className="space-y-2 text-sm text-yellow-700 font-medium">
                          <li className="flex items-start gap-2">
                            <span className="text-yellow-500 font-bold">•</span>
                            <span>Đặt sân vào khung giờ vàng (17:00-19:00) để có trải nghiệm tốt nhất</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-yellow-500 font-bold">•</span>
                            <span>Chọn nhiều giờ liên tiếp để được ưu đãi giá tốt hơn</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile CTA */}
            {selStart && selEnd && (
              <div className="fixed bottom-4 inset-x-4 lg:hidden">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 shadow-lg"
                  onClick={handleBooking}
                >
                  {selStart.toLocaleDateString("vi-VN")} •{" "}
                  {formatTime(selStart).slice(0, 5)}–
                  {formatTime(selEnd).slice(0, 5)} •{" "}
                  {totalPrice.toLocaleString("vi-VN")}đ
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Enhanced Info Tab */}
          <TabsContent value="info" className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="space-y-6">
              {/* Court Description */}
              <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-cyan-50/50 to-blue-50/50 border-b border-white/20 p-6">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-cyan-700 to-gray-800 bg-clip-text text-transparent flex items-center space-x-3">
                    <span className="text-2xl">📋</span>
                    <span>Mô tả sân</span>
                  </CardTitle>
              </CardHeader>
                <CardContent className="p-8">
                  <div className="bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
                    <p className="text-gray-700 leading-8 font-medium text-lg">
                      {court.description || "Không có mô tả chi tiết về sân thể thao này."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Amenities */}
              <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-green-50/50 border-b border-white/20 p-6">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-emerald-700 to-gray-800 bg-clip-text text-transparent flex items-center space-x-3">
                    <span className="text-2xl">🏆</span>
                    <span>Tiện ích & Dịch vụ</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium mt-2">
                    Các tiện ích và dịch vụ có sẵn tại sân thể thao
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  {court.amenities && court.amenities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {court.amenities.map((amenity, i) => (
                        <div key={i} className="group bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm rounded-xl border border-white/30 p-4 hover:shadow-lg hover:scale-105 transition-all duration-300">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                              {getAmenityIcon(amenity)}
                            </div>
                            <span className="font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
                              {amenity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🏟️</div>
                      <p className="text-gray-600 font-medium">Chưa có thông tin về tiện ích</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Court Owner Information */}
              {court.owner && (
                <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 border-b border-white/20 p-6">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-purple-700 to-gray-800 bg-clip-text text-transparent flex items-center space-x-3">
                      <span className="text-2xl">👤</span>
                      <span>Thông tin chủ sân</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                              <Users className="h-5 w-5 text-purple-600" />
                            </div>
                <div>
                              <div className="text-sm text-gray-600 font-medium">Chủ sân</div>
                              <div className="font-bold text-gray-800 text-lg">{court.owner.name}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-400/20 to-green-500/20 rounded-lg flex items-center justify-center">
                              <Phone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                              <div className="text-sm text-gray-600 font-medium">Số điện thoại</div>
                              <a href={`tel:${court.owner.phone}`} className="font-bold text-green-600 text-lg hover:text-green-700 transition-colors">
                                {court.owner.phone}
                              </a>
                      </div>
                          </div>
                        </div>

                        <div className="hidden md:block">
                          <a href={`tel:${court.owner.phone}`}>
                            <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105">
                              <span className="flex items-center space-x-2">
                                <Phone className="h-4 w-4" />
                                <span>Gọi ngay</span>
                              </span>
                            </Button>
                          </a>
                        </div>
                  </div>
                </div>
              </CardContent>
            </Card>
              )}

              {/* Court Details */}
              <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-orange-50/50 to-yellow-50/50 border-b border-white/20 p-6">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-orange-700 to-gray-800 bg-clip-text text-transparent flex items-center space-x-3">
                    <span className="text-2xl">🕐</span>
                    <span>Chi tiết sân</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm rounded-2xl border border-white/30 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                            <Clock className="h-5 w-5 text-blue-600" />
                          </div>
                          <span className="font-semibold text-gray-700">Giờ mở cửa</span>
                        </div>
                        <span className="font-bold text-gray-800 text-lg">
                          {court.openTime} - {court.closeTime}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm rounded-2xl border border-white/30 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-emerald-600 font-bold">$</span>
                          </div>
                          <span className="font-semibold text-gray-700">Giá thuê</span>
                        </div>
                        <span className="font-bold text-emerald-600 text-lg">
                          {court.pricePerHour.toLocaleString("vi-VN")}đ/giờ
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Enhanced Weather Tab */}
          <TabsContent value="weather" className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="space-y-6">
              {/* Current Weather */}
              {weather && (
                <Card className={`bg-gradient-to-br ${getWeatherBackground(weather.current.icon)} border-0 shadow-xl overflow-hidden`}>
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="text-8xl animate-bounce" style={{ animationDuration: '3s' }}>
                          {getWeatherIcon(weather.current.icon)}
                        </div>
                        <div className="space-y-2">
                          <div className="text-5xl font-black text-gray-800">
                            {weather.current.temp}°C
                          </div>
                          <div className="text-xl font-semibold text-gray-700 capitalize">
                            {weather.current.condition}
                          </div>
                          <div className="text-sm text-gray-600 font-medium">
                            Cảm giác như {weather.current.feelsLike}°C
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 font-medium">
                            <MapPin className="h-4 w-4" />
                            <span>{court?.address}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Weather Alert & Sports Recommendation */}
              {weather && (
                <Card className="bg-gradient-to-r from-blue-50/80 to-green-50/80 backdrop-blur-sm border border-blue-200/50 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-blue-50/50 to-green-50/50 border-b border-blue-200/30 p-6">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-800 via-green-700 to-blue-800 bg-clip-text text-transparent flex items-center space-x-3">
                      <span className="text-2xl">🎾</span>
                      <span>Khuyến nghị hoạt động thể thao</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {weather.current.temp >= 25 && weather.current.temp <= 35 && !weather.current.condition.includes('mưa') && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-xl p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                              <span className="text-2xl">✅</span>
                            </div>
                            <div>
                              <div className="font-bold text-green-800 text-lg">Thời tiết lý tưởng!</div>
                              <div className="text-sm text-green-700 font-medium">Nhiệt độ {weather.current.temp}°C phù hợp cho hoạt động thể thao ngoài trời</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {weather.current.temp > 35 && (
                        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200/50 rounded-xl p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-2xl">⚠️</span>
                            </div>
                            <div>
                              <div className="font-bold text-orange-800 text-lg">Nhiệt độ cao</div>
                              <div className="text-sm text-orange-700 font-medium">Nhiệt độ {weather.current.temp}°C khá cao, nên chơi vào sáng sớm hoặc chiều tối</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {weather.current.condition.includes('mưa') && (
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50 rounded-xl p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                              <span className="text-2xl">🌧️</span>
                            </div>
                            <div>
                              <div className="font-bold text-blue-800 text-lg">Có mưa</div>
                              <div className="text-sm text-blue-700 font-medium">Thời tiết có mưa, nên kiểm tra sân có mái che hoặc đặt sân trong nhà</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {weather.current.windSpeed > 20 && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 rounded-xl p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-2xl">💨</span>
                            </div>
                            <div>
                              <div className="font-bold text-yellow-800 text-lg">Gió mạnh</div>
                              <div className="text-sm text-yellow-700 font-medium">Gió {weather.current.windSpeed} km/h có thể ảnh hưởng đến một số môn thể thao</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}



              {/* Enhanced Weather Details */}
              {weather && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Hourly Forecast */}
                  <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-cyan-50/50 to-blue-50/50 border-b border-white/20 p-6">
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-800 via-cyan-700 to-gray-800 bg-clip-text text-transparent flex items-center space-x-3">
                        <Clock className="h-6 w-6 text-cyan-600" />
                        <span>Dự báo theo giờ</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {weather.hourly.slice(0, 8).map((item, idx) => (
                          <div key={idx} className="group bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm rounded-xl border border-white/30 p-4 text-center hover:shadow-lg hover:scale-105 transition-all duration-300">
                            <div className="text-sm font-semibold text-gray-700 mb-2">
                              {item.time}
                            </div>
                            <div className="text-3xl mb-3 group-hover:animate-bounce">
                              {getWeatherIcon(item.icon)}
                            </div>
                            <div className="text-lg font-bold text-gray-800 mb-1">
                              {item.temp}°
                            </div>
                            <div className="text-xs text-gray-600 capitalize font-medium">
                              {item.condition}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Weather Stats */}
                  <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 border-b border-white/20 p-6">
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-800 via-purple-700 to-gray-800 bg-clip-text text-transparent flex items-center space-x-3">
                        <span className="text-2xl">📊</span>
                        <span>Thông tin chi tiết</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200/30">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                              <span className="text-2xl">💨</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-gray-800 text-lg">Gió</div>
                              <div className="text-sm text-blue-700 font-semibold">{weather.current.windSpeed} km/h</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200/30">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                              <span className="text-2xl">💧</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-gray-800 text-lg">Độ ẩm</div>
                              <div className="text-sm text-green-700 font-semibold">{weather.current.humidity}%</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200/30">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center">
                              <span className="text-2xl">👁️</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-gray-800 text-lg">Tầm nhìn</div>
                              <div className="text-sm text-purple-700 font-semibold">{weather.current.visibility} km</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200/30">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-2xl">🌡️</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-gray-800 text-lg">Áp suất</div>
                              <div className="text-sm text-orange-700 font-semibold">{weather.current.pressure} hPa</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Daily Forecast */}
              {weather && (
            <Card>
              <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sun className="h-5 w-5" />
                      Dự báo 7 ngày
                    </CardTitle>
              </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      {weather.daily.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            {item.day}
                    </div>
                          <div className="text-2xl mb-2">
                            {getWeatherIcon(item.icon)}
                            </div>
                          <div className="text-xs text-gray-500 capitalize text-center mb-2">
                            {item.condition}
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-gray-800 text-sm">
                              {item.temp.max}°
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.temp.min}°
                            </div>
                          </div>
                        </div>
                      ))}
                            </div>
                          </CardContent>
                        </Card>
              )}


              {weatherLoading && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <div className="text-gray-500">Đang tải thông tin thời tiết…</div>
                  </CardContent>
                </Card>
              )}

              {!weather && !weatherLoading && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4">🌤️</div>
                    <div className="text-xl font-semibold text-gray-800 mb-2">
                      Không thể tải thông tin thời tiết
                    </div>
                    <div className="text-gray-500 mb-4">
                      Vui lòng kiểm tra cấu hình API key hoặc thử lại sau
                  </div>
                    <Button
                      onClick={async () => {
                        if (court?.latitude && court?.longitude) {
                          try {
                            setWeatherLoading(true);
                            const res = await fetch(`/api/weather?lat=${court.latitude}&lon=${court.longitude}`);
                            const data = await res.json();
                            if (data.success) {
                              setWeather(data.data);
                            }
                          } catch (error) {
                            console.error("Error:", error);
                          } finally {
                            setWeatherLoading(false);
                          }
                        }
                      }}
                      variant="outline"
                      disabled={weatherLoading}
                    >
                      {weatherLoading ? 'Đang tải...' : 'Thử lại'}
                    </Button>
              </CardContent>
            </Card>
              )}
            </div>
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Đánh giá</CardTitle>
                <CardDescription>Tổng: {totalReviews}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviewsLoading ? (
                  <div className="text-center text-gray-500">
                    Đang tải đánh giá…
                  </div>
                ) : reviews.length ? (
                  reviews.map((rv) => (
                    <Card key={rv._id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{rv.user.name}</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{rv.rating}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-2">{rv.comment}</p>
                        <span className="text-sm text-gray-500">
                          {new Date(rv.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-gray-500">
                    Chưa có đánh giá nào
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Guest Booking Modal */}
      {showGuestModal && selStart && selEnd && court && (
        <GuestBookingModal
          isOpen={showGuestModal}
          onClose={() => setShowGuestModal(false)}
          onConfirm={handleGuestBooking}
          bookingDetails={{
            courtName: court.name,
            date: selStart.toLocaleDateString("vi-VN"),
            startTime: formatTime(selStart).slice(0, 5),
            endTime: formatTime(selEnd).slice(0, 5),
            totalPrice: totalPrice,
            hours: hoursSelected
          }}
        />
      )}
      
      <Footer />
    </div>
  );
}


