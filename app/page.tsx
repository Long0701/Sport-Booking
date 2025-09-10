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
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, MapPin, Shield, Star, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/shared/header";
import Footer from "@/components/shared/footer";



interface SportStat {
  type: string;
  name: string;
  icon: string;
  count: number;
  displayCount: string;
}

interface StatData {
  value: number;
  display: string;
  label: string;
}

interface Stats {
  courts: StatData;
  users: StatData;
  bookings: StatData;
  rating: StatData;
}

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sports, setSports] = useState<SportStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [registrationSuccess, setRegistrationSuccess] = useState<any>(null);
  
  const handleSportClick = (sportName: string) => {
    router.push(`/search?sport=${encodeURIComponent(sportName)}`);
  };

  // Check for registration success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const registrationParam = urlParams.get('registration');
    
    if (registrationParam === 'success') {
      const successData = localStorage.getItem('registrationSuccess');
      if (successData) {
        try {
          const data = JSON.parse(successData);
          setRegistrationSuccess(data);
          // Clear from localStorage and URL
          localStorage.removeItem('registrationSuccess');
          window.history.replaceState({}, '', '/');
        } catch (error) {
          console.error('Error parsing registration success data:', error);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchSportsStats();
    fetchStats();
  }, []);

  const fetchSportsStats = async () => {
    try {
      const response = await fetch('/api/sports');
      const data = await response.json();
      
      if (data.success) {
        setSports(data.data);
      } else {
        // Fallback to hardcoded data if API fails
        setSports([
          { type: "football", name: "Bóng đá mini", icon: "⚽", count: 0, displayCount: "0 sân" },
          { type: "badminton", name: "Cầu lông", icon: "🏸", count: 0, displayCount: "0 sân" },
          { type: "tennis", name: "Tennis", icon: "🎾", count: 0, displayCount: "0 sân" },
          { type: "basketball", name: "Bóng rổ", icon: "🏀", count: 0, displayCount: "0 sân" },
          { type: "volleyball", name: "Bóng chuyền", icon: "🏐", count: 0, displayCount: "0 sân" },
          { type: "pickleball", name: "Pickleball", icon: "🏓", count: 0, displayCount: "0 sân" },
        ]);
      }
    } catch (error) {
      console.error('Error fetching sports stats:', error);
      // Fallback to hardcoded data
      setSports([
        { type: "football", name: "Bóng đá mini", icon: "⚽", count: 0, displayCount: "0 sân" },
        { type: "badminton", name: "Cầu lông", icon: "🏸", count: 0, displayCount: "0 sân" },
        { type: "tennis", name: "Tennis", icon: "🎾", count: 0, displayCount: "0 sân" },
        { type: "basketball", name: "Bóng rổ", icon: "🏀", count: 0, displayCount: "0 sân" },
        { type: "volleyball", name: "Bóng chuyền", icon: "🏐", count: 0, displayCount: "0 sân" },
        { type: "pickleball", name: "Pickleball", icon: "🏓", count: 0, displayCount: "0 sân" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        // Fallback stats
        setStats({
          courts: { value: 0, display: '0', label: 'Sân thể thao' },
          users: { value: 0, display: '0', label: 'Người dùng' },
          bookings: { value: 0, display: '0', label: 'Lượt đặt sân' },
          rating: { value: 0, display: '0★', label: 'Đánh giá' }
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback stats
      setStats({
        courts: { value: 0, display: '0', label: 'Sân thể thao' },
        users: { value: 0, display: '0', label: 'Người dùng' },
        bookings: { value: 0, display: '0', label: 'Lượt đặt sân' },
        rating: { value: 0, display: '0★', label: 'Đánh giá' }
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "AI Gợi ý thông minh",
      description:
        "Hệ thống AI gợi ý khung giờ tối ưu dựa trên thời tiết và lịch sử",
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "Tìm sân gần nhất",
      description: "Bản đồ tích hợp giúp tìm sân thể thao gần vị trí của bạn",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Thanh toán an toàn",
      description: "Đặt sân và thanh toán online nhanh chóng, bảo mật",
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "Đánh giá chất lượng",
      description: "Xem đánh giá từ cộng đồng để chọn sân phù hợp",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <Header />

      {/* Registration Success Banner */}
      {registrationSuccess && (
        <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-6">
          <div className="container mx-auto px-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Badge className="bg-green-600 hover:bg-green-600">
                  Thành công
                </Badge>
              </div>
              <div className="flex-1">
                <h3 className="text-green-800 font-semibold mb-1">
                  Đăng ký làm chủ sân thành công!
                </h3>
                <p className="text-green-700 text-sm mb-2">
                  {registrationSuccess.message}
                </p>
                <div className="text-green-600 text-xs space-y-1">
                  <p>• Doanh nghiệp: <strong>{registrationSuccess.businessName}</strong></p>
                  <p>• Email: <strong>{registrationSuccess.email}</strong></p>
                  <p>• Ngày gửi: {new Date(registrationSuccess.submittedAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="mt-3 space-x-3">
                  <Link href={`/owner/registration-status?email=${encodeURIComponent(registrationSuccess.email)}`}>
                    <Button size="sm" variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
                      Theo dõi trạng thái
                    </Button>
                  </Link>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-green-600 hover:bg-green-50"
                    onClick={() => setRegistrationSuccess(null)}
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 animate-gradient" 
             style={{
               background: 'linear-gradient(-45deg, #166534, #1e40af, #7c3aed, #be185d, #dc2626)',
               backgroundSize: '400% 400%'
             }}>
          {/* Background Images with Animation */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 hero-bg-image large animate-pulse">
              <img 
                src="/soccer-field-main.png" 
                alt="Soccer Field" 
                className="w-full h-full object-cover rounded-lg shadow-2xl animate-float"
                style={{ animationDelay: '0s' }}
              />
            </div>
            <div className="absolute top-20 right-20 hero-bg-image animate-pulse">
              <img 
                src="/badminton-court.png" 
                alt="Badminton Court" 
                className="w-full h-full object-cover rounded-lg shadow-2xl animate-float"
                style={{ animationDelay: '2s' }}
              />
            </div>
            <div className="absolute bottom-20 left-20 hero-bg-image large animate-pulse">
              <img 
                src="/outdoor-tennis-court.png" 
                alt="Tennis Court" 
                className="w-full h-full object-cover rounded-lg shadow-2xl animate-float"
                style={{ animationDelay: '4s' }}
              />
            </div>
            <div className="absolute bottom-10 right-10 hero-bg-image animate-pulse">
              <img 
                src="/outdoor-basketball-court.png" 
                alt="Basketball Court" 
                className="w-full h-full object-cover rounded-lg shadow-2xl animate-float"
                style={{ animationDelay: '1s' }}
              />
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 hero-bg-image large animate-pulse hidden md:block">
              <img 
                src="/soccer-field-night.png" 
                alt="Soccer Field Night" 
                className="w-full h-full object-cover rounded-lg shadow-2xl animate-float opacity-30"
                style={{ animationDelay: '3s' }}
              />
            </div>
          </div>
          
          {/* Floating Orbs Animation */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-20"></div>
            <div className="absolute top-3/4 right-1/4 w-6 h-6 bg-blue-400 rounded-full animate-ping opacity-20" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-3/4 w-3 h-3 bg-purple-400 rounded-full animate-ping opacity-20" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/6 right-1/3 w-5 h-5 bg-yellow-400 rounded-full animate-ping opacity-20" style={{ animationDelay: '3s' }}></div>
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <Badge className="mb-6 bg-green-100 text-green-800 hover:bg-green-100 animate-bounce">
            🚀 Nền tảng đặt sân thông minh #1 Việt Nam
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in-up">
            Đặt sân thể thao
            <span className="text-green-400 animate-pulse"> thông minh</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Tìm kiếm và đặt sân thể thao gần bạn với AI gợi ý khung giờ tối ưu,
            theo dõi thời tiết và đánh giá chất lượng từ cộng đồng.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Link href="/search">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-lg px-8 py-4 transform hover:scale-105 transition-transform duration-200 shadow-xl hover:shadow-2xl"
              >
                <MapPin className="mr-2 h-5 w-5" />
                Tìm sân ngay
              </Button>
            </Link>

            {user?.role === "owner" && (
              <Link href="/owner/courts">
                <Button size="lg" variant="outline" className="text-lg px-8 py-4 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transform hover:scale-105 transition-transform duration-200">
                  <Users className="mr-2 h-5 w-5" />
                  Xem trang quản lý
                </Button>
              </Link>
            )}

            {user?.role === "user" && (
              <Link href="/bookings">
                <Button size="lg" variant="outline" className="text-lg px-8 py-4 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transform hover:scale-105 transition-transform duration-200">
                  <Users className="mr-2 h-5 w-5" />
                  Xem sân đã đặt
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-ping"></div>
          </div>
        </div>
      </section>

      {/* Sports Categories */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-green-50/30 via-gray-50 to-blue-50/30 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-20 left-20 w-32 h-32 bg-green-100/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-100/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-50/30 rounded-full blur-3xl"></div>
        </div>
        
        {/* Floating Sports Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-16 left-16 opacity-5 text-6xl">⚽</div>
          <div className="absolute top-32 right-24 opacity-5 text-5xl">🏸</div>
          <div className="absolute bottom-32 left-32 opacity-5 text-7xl">🏀</div>
          <div className="absolute bottom-16 right-16 opacity-5 text-5xl">🎾</div>
          <div className="absolute top-1/2 left-8 opacity-5 text-4xl">🏐</div>
          <div className="absolute top-1/4 right-8 opacity-5 text-6xl">🏓</div>
        </div>
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.015]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3e%3cpath d='m 60 0 l 0 60 l -60 0 l 0 -60 l 60 0 z m -1 1 l -58 0 l 0 58 l 58 0 l 0 -58 z' fill='%23059669'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23grid)'/%3e%3c/svg%3e")`,
          }}></div>
        </div>

        <div className="container mx-auto relative z-10">
          {/* Clean Heading */}
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="inline-flex items-center px-4 py-2 bg-green-50/80 backdrop-blur-sm text-green-700 text-sm font-medium rounded-full border border-green-200/70 shadow-sm">
                <span className="mr-2">⚽</span>
                Khám phá ngay
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Các môn thể thao phổ biến
          </h2>
            
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Chọn môn thể thao yêu thích và tìm sân gần bạn với giá tốt nhất
            </p>
            
            {/* Simple decorative line */}
            <div className="flex justify-center mt-8">
              <div className="w-24 h-1 bg-green-500 rounded-full"></div>
            </div>
          </div>

          {/* Sports Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/50 h-full">
                  <div className="animate-pulse">
                    <div className="w-20 h-20 bg-gray-200 rounded-xl mx-auto mb-5"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-16 mx-auto"></div>
                      <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              sports.map((sport, index) => (
                <div 
                  key={sport.type}
                  className="group cursor-pointer"
                onClick={() => handleSportClick(sport.name)}
              >
                  <div className="sports-card bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/50 hover:border-green-300/70 hover:shadow-lg hover:bg-white/95 transition-all duration-200 h-full">
                    {/* Icon Section */}
                    <div className="mb-5">
                      <div className="w-20 h-20 bg-gray-50/80 group-hover:bg-green-50/90 backdrop-blur-sm rounded-xl mx-auto flex items-center justify-center transition-colors duration-200 shadow-inner">
                        <span className="text-4xl group-hover:scale-105 transition-transform duration-200">
                          {sport.icon}
                        </span>
                      </div>
                    </div>

                    {/* Text Section */}
                    <div className="text-center space-y-3">
                      <h3 className="font-bold text-gray-900 text-base group-hover:text-green-600 transition-colors duration-200 leading-tight">
                        {sport.name}
                      </h3>
                      
                      {/* Count Badge */}
                      <div className="flex justify-center">
                        <span className="px-4 py-1.5 bg-gray-100 group-hover:bg-green-100 text-gray-600 group-hover:text-green-700 text-sm font-semibold rounded-full transition-all duration-200">
                          {sport.displayCount}
                        </span>
                      </div>
                      
                      {/* Status Indicator with Text */}
                      <div className="flex items-center justify-center space-x-2 pt-1">
                        {sport.count > 0 ? (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600 font-medium">Có sẵn</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="text-xs text-gray-500 font-medium">Chưa có</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <Link href="/search">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl backdrop-blur-sm border border-green-500/20 transition-all duration-200 transform hover:scale-105">
                <BookOpen className="w-4 h-4 mr-2" />
                Xem tất cả sân thể thao
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-emerald-50/80 via-cyan-50/60 to-green-50/80 overflow-hidden">
        {/* Light Brand Color Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-emerald-50/30 to-cyan-50/40"></div>
        
        {/* Light Brand-Colored Sports Pattern */}
        <div className="brand-sports-pattern absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3clinearGradient id='lightBrandGradient' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3e%3cstop offset='0%25' style='stop-color:%23059669;stop-opacity:0.15'/%3e%3cstop offset='50%25' style='stop-color:%2306b6d4;stop-opacity:0.12'/%3e%3cstop offset='100%25' style='stop-color:%23059669;stop-opacity:0.15'/%3e%3c/linearGradient%3e%3cpattern id='lightBrandSports' width='120' height='120' patternUnits='userSpaceOnUse'%3e%3cg fill='url(%23lightBrandGradient)'%3e%3ccircle cx='20' cy='20' r='8' fill='%23059669' fill-opacity='0.08'/%3e%3cpath d='M20 12c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z' stroke='%23059669' stroke-width='1' fill='none' stroke-opacity='0.15'/%3e%3cpath d='M20 14l2 2-2 2-2-2z' fill='%23059669' fill-opacity='0.12'/%3e%3cpath d='M14 20l2-2 2 2 2-2' fill='%23059669' fill-opacity='0.12'/%3e%3ccircle cx='70' cy='70' r='6' fill='%2306b6d4' fill-opacity='0.1'/%3e%3cpath d='M70 64c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z' stroke='%2306b6d4' stroke-width='1' fill='none' stroke-opacity='0.15'/%3e%3cpath d='M70 66v8m-4-4h8' stroke='%2306b6d4' stroke-width='1.5' stroke-opacity='0.18'/%3e%3ccircle cx='100' cy='30' r='5' fill='%23059669' fill-opacity='0.08'/%3e%3cpath d='M100 25c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z' stroke='%23059669' stroke-width='1' fill='none' stroke-opacity='0.15'/%3e%3cpath d='M30 100c-4 0-8 2-8 6h16c0-4-4-6-8-6z' fill='%2306b6d4' fill-opacity='0.1'/%3e%3cpath d='M30 90c-2 0-4 1-4 3h8c0-2-2-3-4-3z' fill='%23059669' fill-opacity='0.08'/%3e%3c/g%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23lightBrandSports)'/%3e%3c/svg%3e")`,
        }}></div>

        {/* Light Geometric Sports Elements */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='lightGeometric' width='200' height='200' patternUnits='userSpaceOnUse'%3e%3cg fill='none' stroke='%23059669' stroke-width='1' stroke-opacity='0.15'%3e%3cpath d='M50 50l20-20m0 20l-20-20'/%3e%3ccircle cx='150' cy='50' r='15' fill='none'/%3e%3cpath d='M140 50h20m-10-10v20'/%3e%3cpolygon points='50,150 70,130 70,170' fill='%2306b6d4' fill-opacity='0.05'/%3e%3crect x='130' y='130' width='40' height='40' rx='5' fill='none'/%3e%3cpath d='M135 135l30 30m0-30l-30 30'/%3e%3c/g%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23lightGeometric)'/%3e%3c/svg%3e")`,
        }}></div>

        {/* Light Soft Decorative Elements */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-emerald-200/60 to-emerald-300/40 rounded-full blur-2xl float-gentle"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-gradient-to-br from-cyan-200/60 to-cyan-300/40 rounded-full blur-2xl float-gentle" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-gradient-to-br from-green-200/60 to-green-300/40 rounded-full blur-2xl float-gentle" style={{ animationDelay: '4s' }}></div>
          <div className="absolute top-1/3 left-1/5 w-28 h-28 bg-gradient-to-br from-emerald-100/50 to-cyan-200/50 rounded-full blur-3xl float-gentle" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/3 right-1/5 w-36 h-36 bg-gradient-to-br from-cyan-100/50 to-green-200/50 rounded-full blur-3xl float-gentle" style={{ animationDelay: '3s' }}></div>
          
          {/* Light Subtle Sports Icon Decorations */}
          <div className="sports-icon-decoration absolute top-20 left-1/4 text-8xl opacity-8 text-emerald-400" style={{ animationDelay: '0s' }}>⚽</div>
          <div className="sports-icon-decoration absolute bottom-20 right-1/3 text-6xl opacity-8 text-cyan-400" style={{ animationDelay: '2s' }}>🏸</div>
          <div className="sports-icon-decoration absolute top-1/3 right-10 text-7xl opacity-8 text-emerald-500" style={{ animationDelay: '4s' }}>🏀</div>
          <div className="sports-icon-decoration absolute bottom-1/3 left-10 text-5xl opacity-8 text-cyan-500" style={{ animationDelay: '6s' }}>🎾</div>
        </div>

        {/* Light Dynamic Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='lightTexture' width='80' height='80' patternUnits='userSpaceOnUse'%3e%3cg fill='%23059669' fill-opacity='0.3'%3e%3cpath d='M0 0h80v80H0z' fill='none'/%3e%3cpath d='M20 20c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10z' stroke='%23059669' stroke-width='0.5' fill='none'/%3e%3cpath d='M50 50c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10z' stroke='%2306b6d4' stroke-width='0.5' fill='none'/%3e%3cpath d='M10 60l10-10 10 10-10 10z' fill='%23059669' fill-opacity='0.05'/%3e%3cpath d='M60 20l5-5 5 5-5 5z' fill='%2306b6d4' fill-opacity='0.05'/%3e%3c/g%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23lightTexture)'/%3e%3c/svg%3e")`,
        }}></div>

        {/* Light Brand Color Wave */}
        <div className="brand-color-wave absolute inset-0 opacity-60" style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3clinearGradient id='lightWaveGradient' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3e%3cstop offset='0%25' style='stop-color:%23059669;stop-opacity:0.025'/%3e%3cstop offset='25%25' style='stop-color:%2306b6d4;stop-opacity:0.035'/%3e%3cstop offset='50%25' style='stop-color:%23059669;stop-opacity:0.03'/%3e%3cstop offset='75%25' style='stop-color:%2306b6d4;stop-opacity:0.02'/%3e%3cstop offset='100%25' style='stop-color:%23059669;stop-opacity:0.025'/%3e%3c/linearGradient%3e%3c/defs%3e%3cpath d='M0,200 Q100,150 200,200 T400,200 L400,400 L0,400 Z' fill='url(%23lightWaveGradient)'/%3e%3cpath d='M0,250 Q150,200 300,250 T600,250 L600,400 L0,400 Z' fill='url(%23lightWaveGradient)' opacity='0.7'/%3e%3cpath d='M0,180 Q120,130 240,180 T480,180 L480,400 L0,400 Z' fill='url(%23lightWaveGradient)' opacity='0.5'/%3e%3c/svg%3e")`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom'
        }}></div>

        {/* Light Theme Overlay for Perfect Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-white/5 to-transparent"></div>

        <div className="container mx-auto relative z-10">
          {/* Enhanced Heading */}
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="inline-flex items-center px-4 py-2 bg-blue-50/80 backdrop-blur-sm text-blue-700 text-sm font-medium rounded-full border border-blue-200/70 shadow-sm">
                <span className="mr-2">✨</span>
                Ưu điểm vượt trội
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Tại sao chọn SportBooking?
          </h2>
            
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Trải nghiệm đặt sân thể thao hoàn hảo với những tính năng độc quyền
            </p>

            {/* Decorative line */}
            <div className="flex justify-center mt-8">
              <div className="w-24 h-1 bg-emerald-500 rounded-full"></div>
            </div>
          </div>

          {/* Enhanced Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="feature-card relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-md border border-emerald-200/30 hover:border-emerald-400/50 hover:bg-white/80 h-full hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-500"
                     style={{ boxShadow: '0 4px 20px rgba(5, 150, 105, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.4)' }}>
                  {/* Enhanced Background Glow on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/0 to-emerald-50/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                  
                  <div className="relative z-10">
                    {/* Enhanced Icon Container */}
                    <div className="mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 group-hover:from-emerald-200 group-hover:to-emerald-300 rounded-2xl flex items-center justify-center mx-auto transition-all duration-300 shadow-lg">
                          <div className="text-emerald-600 group-hover:text-emerald-700 transition-colors duration-300 transform group-hover:scale-110">
                    {feature.icon}
                          </div>
                        </div>
                        
                        {/* Subtle ring animation on hover */}
                        <div className="absolute inset-0 rounded-2xl border-emerald-300 opacity-0 group-hover:opacity-30 transition-opacity duration-300 scale-110 animate-pulse"></div>
                      </div>
                    </div>

                    {/* Enhanced Typography */}
                    <div className="text-center space-y-4">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      
                      <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    {/* Subtle accent line */}
                    <div className="mt-6 flex justify-center">
                      <div className="w-0 group-hover:w-12 h-0.5 bg-emerald-500 transition-all duration-300 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Corner decoration */}
                  <div className="absolute top-4 right-4 w-3 h-3 bg-emerald-200 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
                  
                  {/* Card number */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-sm font-bold rounded-full flex items-center justify-center shadow-lg">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="flex justify-center mt-16 mb-12">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-emerald-300"></div>
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-emerald-300"></div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Sẵn sàng trải nghiệm?
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                Khám phá hàng ngàn sân thể thao và đặt lịch ngay hôm nay
              </p>
              <Link href="/search">
                <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-200 transform hover:scale-105">
                  <MapPin className="w-4 h-4 mr-2" />
                  Khám phá ngay
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 text-white overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-40 h-40 bg-gradient-to-br from-emerald-400/30 to-emerald-500/20 rounded-full blur-3xl stats-bg-orb"></div>
          <div className="absolute bottom-10 left-10 w-52 h-52 bg-gradient-to-br from-green-400/25 to-green-500/15 rounded-full blur-3xl stats-bg-orb" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 left-1/3 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-cyan-500/10 rounded-full blur-2xl stats-bg-orb" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-1/4 right-1/3 w-24 h-24 bg-gradient-to-br from-yellow-400/15 to-orange-400/10 rounded-full blur-2xl stats-bg-orb" style={{ animationDelay: '3s' }}></div>
        </div>

        {/* Dynamic Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='statsPattern' width='60' height='60' patternUnits='userSpaceOnUse'%3e%3ccircle cx='30' cy='30' r='15' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.3'/%3e%3ccircle cx='30' cy='30' r='8' fill='%23ffffff' fill-opacity='0.1'/%3e%3cpath d='M30 22l8 8-8 8-8-8z' fill='%23ffffff' fill-opacity='0.15'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23statsPattern)'/%3e%3c/svg%3e")`,
        }}></div>

        <div className="container mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
              Thống kê hệ thống
            </h2>
            <p className="text-emerald-100 max-w-xl mx-auto">
              Những con số ấn tượng cho thấy sự tin tưởng của cộng đồng
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full mx-auto mt-6"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {statsLoading ? (
              // Enhanced Loading skeleton for stats
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="group">
                  <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-white/20 hover:border-white/30 transition-all duration-500 animate-pulse">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-emerald-400/30 rounded-full mx-auto"></div>
                      <div className="h-8 bg-emerald-400/30 rounded w-20 mx-auto"></div>
                      <div className="h-4 bg-emerald-400/20 rounded w-24 mx-auto"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : stats ? (
              <>
                <div className="group">
                  <div className="stats-card bg-white/10 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-white/20 hover:border-white/30 hover:bg-white/15 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2" style={{ animationDelay: '0s' }}>
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto text-2xl shadow-lg group-hover:shadow-emerald-400/25 transition-shadow duration-300 stats-icon" style={{ animationDelay: '0.2s' }}>
                        🏟️
                      </div>
                      <div className="space-y-2">
                        <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent stats-number" style={{ animationDelay: '0.4s' }}>
                          {stats.courts.display}
                        </div>
                        <div className="text-emerald-100 font-medium">{stats.courts.label}</div>
                      </div>
                    </div>
                    {/* Floating decoration */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full opacity-0 group-hover:opacity-80 stats-decoration transition-opacity duration-300"></div>
                  </div>
                </div>

                <div className="group">
                  <div className="stats-card bg-white/10 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-white/20 hover:border-white/30 hover:bg-white/15 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2" style={{ animationDelay: '0.2s' }}>
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto text-2xl shadow-lg group-hover:shadow-cyan-400/25 transition-shadow duration-300 stats-icon" style={{ animationDelay: '0.6s' }}>
                        👥
                      </div>
                      <div className="space-y-2">
                        <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent stats-number" style={{ animationDelay: '0.8s' }}>
                          {stats.users.display}
                        </div>
                        <div className="text-cyan-100 font-medium">{stats.users.label}</div>
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-full opacity-0 group-hover:opacity-80 stats-decoration transition-opacity duration-300"></div>
                  </div>
                </div>

                <div className="group">
                  <div className="stats-card bg-white/10 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-white/20 hover:border-white/30 hover:bg-white/15 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2" style={{ animationDelay: '0.4s' }}>
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto text-2xl shadow-lg group-hover:shadow-green-400/25 transition-shadow duration-300 stats-icon" style={{ animationDelay: '1.0s' }}>
                        📅
                      </div>
                      <div className="space-y-2">
                        <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent stats-number" style={{ animationDelay: '1.2s' }}>
                          {stats.bookings.display}
                        </div>
                        <div className="text-green-100 font-medium">{stats.bookings.label}</div>
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full opacity-0 group-hover:opacity-80 stats-decoration transition-opacity duration-300"></div>
                  </div>
                </div>

                <div className="group">
                  <div className="stats-card bg-white/10 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-white/20 hover:border-white/30 hover:bg-white/15 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2" style={{ animationDelay: '0.6s' }}>
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto text-2xl shadow-lg group-hover:shadow-yellow-400/25 transition-shadow duration-300 stats-icon" style={{ animationDelay: '1.4s' }}>
                        ⭐
                      </div>
                      <div className="space-y-2">
                        <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent stats-number" style={{ animationDelay: '1.6s' }}>
                          {stats.rating.display}
                        </div>
                        <div className="text-yellow-100 font-medium">{stats.rating.label}</div>
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full opacity-0 group-hover:opacity-80 stats-decoration transition-opacity duration-300"></div>
                  </div>
                </div>
              </>
            ) : (
                            // Enhanced Fallback display
              <>
                <div className="group">
                  <div className="stats-card bg-white/10 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-white/20 hover:border-white/30 hover:bg-white/15 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2" style={{ animationDelay: '0s' }}>
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto text-2xl shadow-lg stats-icon" style={{ animationDelay: '0.2s' }}>🏟️</div>
                      <div className="space-y-2">
                        <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent stats-number" style={{ animationDelay: '0.4s' }}>0</div>
                        <div className="text-emerald-100 font-medium">Sân thể thao</div>
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full opacity-0 group-hover:opacity-80 stats-decoration transition-opacity duration-300"></div>
                  </div>
                </div>

                <div className="group">
                  <div className="stats-card bg-white/10 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-white/20 hover:border-white/30 hover:bg-white/15 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2" style={{ animationDelay: '0.2s' }}>
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto text-2xl shadow-lg stats-icon" style={{ animationDelay: '0.6s' }}>👥</div>
                      <div className="space-y-2">
                        <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent stats-number" style={{ animationDelay: '0.8s' }}>0</div>
                        <div className="text-cyan-100 font-medium">Người dùng</div>
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-full opacity-0 group-hover:opacity-80 stats-decoration transition-opacity duration-300"></div>
                  </div>
                </div>

                <div className="group">
                  <div className="stats-card bg-white/10 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-white/20 hover:border-white/30 hover:bg-white/15 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2" style={{ animationDelay: '0.4s' }}>
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto text-2xl shadow-lg stats-icon" style={{ animationDelay: '1.0s' }}>📅</div>
                      <div className="space-y-2">
                        <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent stats-number" style={{ animationDelay: '1.2s' }}>0</div>
                        <div className="text-green-100 font-medium">Lượt đặt sân</div>
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full opacity-0 group-hover:opacity-80 stats-decoration transition-opacity duration-300"></div>
                  </div>
                </div>

                <div className="group">
                  <div className="stats-card bg-white/10 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-white/20 hover:border-white/30 hover:bg-white/15 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2" style={{ animationDelay: '0.6s' }}>
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto text-2xl shadow-lg stats-icon" style={{ animationDelay: '1.4s' }}>⭐</div>
                      <div className="space-y-2">
                        <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent stats-number" style={{ animationDelay: '1.6s' }}>0.0⭐</div>
                        <div className="text-yellow-100 font-medium">Đánh giá</div>
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full opacity-0 group-hover:opacity-80 stats-decoration transition-opacity duration-300"></div>
            </div>
            </div>
              </>
            )}
            </div>

          {/* Bottom Decorative Line */}
          <div className="flex justify-center mt-16">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-emerald-300"></div>
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              <div className="w-6 h-px bg-emerald-300"></div>
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-cyan-300"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      {/* <section className="py-16 px-4 bg-gray-900 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Sẵn sàng bắt đầu?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Tham gia cộng đồng thể thao lớn nhất Việt Nam ngay hôm nay
          </p>
          <Link href="/search">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8">
              Khám phá ngay
            </Button>
          </Link>
        </div>
      </section> */}

      <Footer />
    </div>
  );
}
