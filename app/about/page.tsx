"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Users,
  Zap,
  Shield,
  Award,
  TrendingUp,
  Heart,
  Globe,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import Footer from "@/components/shared/footer";
import Header from "@/components/shared/header";

export default function AboutPage() {
  const stats = [
    { number: "500+", label: "Sân thể thao", icon: "🏟️" },
    { number: "10K+", label: "Người dùng", icon: "👥" },
    { number: "50K+", label: "Lượt đặt sân", icon: "📅" },
    { number: "4.8★", label: "Đánh giá", icon: "⭐" },
  ];

  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "AI Gợi ý thông minh",
      description:
        "Hệ thống AI phân tích thời tiết, lịch sử và đưa ra gợi ý khung giờ tối ưu cho từng môn thể thao.",
      color: "text-emerald-600 bg-emerald-100",
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Thanh toán an toàn",
      description:
        "Hệ thống thanh toán được mã hóa SSL, hỗ trợ nhiều phương thức thanh toán phổ biến tại Việt Nam.",
      color: "text-green-600 bg-green-100",
      gradient: "from-green-500 to-green-600",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Cộng đồng thể thao",
      description:
        "Kết nối với cộng đồng thể thao, chia sẻ kinh nghiệm và tìm kiếm đối tác chơi thể thao.",
      color: "text-cyan-600 bg-cyan-100",
      gradient: "from-cyan-500 to-cyan-600",
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Phủ sóng toàn quốc",
      description:
        "Mạng lưới sân thể thao trải dài khắp các tỉnh thành, từ thành phố lớn đến các khu vực nông thôn.",
      color: "text-emerald-600 bg-emerald-100",
      gradient: "from-emerald-500 to-green-500",
    },
  ];

  const team = [
    {
      name: "Nguyễn Văn A",
      role: "CEO & Founder",
      description: "10+ năm kinh nghiệm trong lĩnh vực công nghệ và thể thao",
      avatar: "/placeholder.svg?height=100&width=100",
    },
    {
      name: "Trần Thị B",
      role: "CTO",
      description: "Chuyên gia AI và Machine Learning, cựu kỹ sư Google",
      avatar: "/placeholder.svg?height=100&width=100",
    },
    {
      name: "Lê Văn C",
      role: "Head of Operations",
      description:
        "Chuyên gia vận hành với kinh nghiệm quản lý hơn 1000 sân thể thao",
      avatar: "/placeholder.svg?height=100&width=100",
    },
    {
      name: "Phạm Thị D",
      role: "Head of Marketing",
      description:
        "15+ năm kinh nghiệm marketing trong lĩnh vực thể thao và giải trí",
      avatar: "/placeholder.svg?height=100&width=100",
    },
  ];

  const milestones = [
    {
      year: "2020",
      title: "Thành lập công ty",
      description:
        "SportBooking được thành lập với tầm nhìn số hóa ngành thể thao Việt Nam",
    },
    {
      year: "2021",
      title: "Ra mắt platform",
      description: "Phiên bản đầu tiên với 50 sân thể thao tại TP.HCM",
    },
    {
      year: "2022",
      title: "Mở rộng toàn quốc",
      description: "Có mặt tại 20 tỉnh thành với hơn 200 sân thể thao",
    },
    {
      year: "2023",
      title: "Tích hợp AI",
      description: "Ra mắt tính năng AI gợi ý thông minh và dự báo thời tiết",
    },
    {
      year: "2024",
      title: "Cột mốc 500+ sân",
      description: "Đạt 500+ sân thể thao và 10,000+ người dùng hoạt động",
    },
  ];

  const values = [
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Đam mê thể thao",
      description:
        "Chúng tôi tin rằng thể thao là cầu nối kết nối mọi người và mang lại sức khỏe tốt.",
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: "Chất lượng đầu tiên",
      description:
        "Cam kết cung cấp dịch vụ chất lượng cao và trải nghiệm người dùng tuyệt vời.",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Đổi mới sáng tạo",
      description:
        "Không ngừng nghiên cứu và áp dụng công nghệ mới để cải thiện dịch vụ.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Cộng đồng",
      description:
        "Xây dựng cộng đồng thể thao mạnh mẽ và kết nối mọi người thông qua thể thao.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-cyan-50/30">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-32 overflow-hidden min-h-screen flex items-center">
        {/* Background Image Layer */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgaWQ9InNwb3J0cyI+PGNpcmNsZSByPSIzNSIgY3g9IjUwIiBjeT0iNTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2Utb3BhY2l0eT0iMC4zIi8+PGNpcmNsZSByPSIyMCIgY3g9IjUwIiBjeT0iNTAiIGZpbGw9IiMxMGI5ODEiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PHBhdGggZD0iTTQwIDQwTDYwIDQwTDYwIDYwTDQwIDYwWiIgZmlsbD0iIzEwYjk4MSIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3Nwb3J0cykiLz48L3N2Zz4=')] animate-pulse"
            style={{ animationDuration: '8s' }}></div>
        </div>

        {/* Animated Floating Elements */}
        <div className="absolute inset-0 opacity-30">
          {/* Large Floating Orbs */}
          <div className="absolute top-20 left-10 w-40 h-40 bg-gradient-to-br from-emerald-400/30 to-teal-500/20 rounded-full blur-3xl animate-bounce" 
            style={{ animationDuration: '6s', animationDelay: '0s' }}></div>
          <div className="absolute bottom-32 right-16 w-56 h-56 bg-gradient-to-br from-cyan-400/25 to-emerald-500/15 rounded-full blur-3xl animate-bounce" 
            style={{ animationDuration: '8s', animationDelay: '2s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-gradient-to-br from-teal-400/20 to-green-500/15 rounded-full blur-2xl animate-bounce" 
            style={{ animationDuration: '7s', animationDelay: '4s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-gradient-to-br from-emerald-300/20 to-cyan-400/10 rounded-full blur-3xl animate-bounce" 
            style={{ animationDuration: '9s', animationDelay: '1s' }}></div>

          {/* Sports Icons Floating */}
          <div className="absolute top-40 right-32 text-6xl opacity-20 animate-spin" style={{ animationDuration: '20s' }}>⚽</div>
          <div className="absolute bottom-40 left-24 text-5xl opacity-15 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}>🏀</div>
          <div className="absolute top-1/2 left-16 text-4xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}>🎾</div>
          <div className="absolute top-32 left-1/2 text-5xl opacity-15 animate-pulse" style={{ animationDelay: '4s' }}>🏐</div>
          <div className="absolute bottom-1/3 right-1/3 text-4xl opacity-20 animate-pulse" style={{ animationDelay: '6s' }}>🏓</div>
        </div>

        {/* Dynamic Geometric Patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='sports-pattern' width='80' height='80' patternUnits='userSpaceOnUse'%3e%3cpolygon points='40,10 70,30 70,50 40,70 10,50 10,30' fill='none' stroke='%2310b981' stroke-width='1' stroke-opacity='0.3'/%3e%3ccircle cx='40' cy='40' r='15' fill='%2310b981' fill-opacity='0.1'/%3e%3cpath d='M25,25 L55,25 L55,55 L25,55 Z' fill='none' stroke='%230891b2' stroke-width='0.5' stroke-opacity='0.2'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23sports-pattern)'/%3e%3c/svg%3e")`,
          }}></div>
        </div>

        {/* Animated Wave Effect */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden opacity-20">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-16">
            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" 
              className="fill-current text-emerald-600/30 animate-pulse" style={{ animationDuration: '4s' }}></path>
          </svg>
        </div>

        {/* Particle System */}
        <div className="absolute inset-0 opacity-25">
          {Array.from({ length: 15 }, (_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-emerald-300 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Enhanced Badge with Glow Effect */}
            <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <Badge className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 text-white hover:from-emerald-400/40 hover:to-cyan-400/40 border-2 border-emerald-300/40 hover:border-emerald-200/60 backdrop-blur-md px-8 py-3 text-lg font-semibold shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105">
                <span className="w-3 h-3 bg-emerald-300 rounded-full animate-ping"></span>
                🚀 Nền tảng đặt sân thông minh #1 Việt Nam
              </Badge>
            </div>
            
            {/* Animated Main Title */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-12 leading-tight animate-fade-in" style={{ animationDelay: '1s' }}>
              <span className="bg-gradient-to-r from-emerald-200 via-cyan-100 to-teal-200 bg-clip-text text-transparent drop-shadow-2xl">
                Về chúng tôi
              </span>
            </h1>
            
            {/* Enhanced Description */}
            <div className="mb-16 animate-fade-in" style={{ animationDelay: '1.5s' }}>
              <p className="text-xl md:text-3xl max-w-5xl mx-auto text-emerald-50/90 leading-relaxed font-light mb-6">
                SportBooking được sinh ra từ đam mê thể thao và mong muốn kết nối
                cộng đồng yêu thể thao Việt Nam thông qua công nghệ hiện đại và trải
                nghiệm người dùng tuyệt vời.
              </p>
              <div className="w-32 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent mx-auto animate-pulse"></div>
            </div>

            {/* Enhanced Feature Highlights */}
            <div className="flex flex-wrap justify-center gap-8 mb-12 animate-fade-in" style={{ animationDelay: '2s' }}>
              {[
                { text: "Công nghệ AI tiên tiến", color: "bg-emerald-400", icon: "🧠" },
                { text: "500+ sân thể thao", color: "bg-cyan-400", icon: "🏟️" },
                { text: "10K+ người dùng tin tưởng", color: "bg-teal-400", icon: "👥" }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="group flex items-center space-x-3 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20 hover:border-white/40 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                  style={{ animationDelay: `${2.5 + index * 0.2}s` }}
                >
                  <span className="text-2xl group-hover:scale-125 transition-transform duration-300">{item.icon}</span>
                  <div className={`w-4 h-4 ${item.color} rounded-full animate-pulse shadow-lg`} style={{ animationDelay: `${index * 0.5}s` }}></div>
                  <span className="text-lg font-medium text-emerald-100 group-hover:text-white transition-colors">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in" style={{ animationDelay: '3s' }}>
              <button className="group bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-1 border-2 border-emerald-400/50">
                <span className="flex items-center gap-3">
                  <span className="group-hover:rotate-12 transition-transform duration-300">🚀</span>
                  Khám phá ngay
                </span>
              </button>
              <button className="group bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-bold py-4 px-8 rounded-2xl border-2 border-white/30 hover:border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                <span className="flex items-center gap-3">
                  <span className="group-hover:scale-125 transition-transform duration-300">📱</span>
                  Tải ứng dụng
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-20 w-24 h-24 bg-gradient-to-br from-emerald-400/30 to-emerald-500/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 right-20 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-gradient-to-br from-green-400/15 to-green-500/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
              Những con số ấn tượng
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="group text-center"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:border-white/40 hover:bg-white/15 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl shadow-lg group-hover:shadow-emerald-400/25 transition-shadow duration-300 group-hover:scale-110">
                    {stat.icon}
                  </div>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                    {stat.number}
                  </div>
                  <div className="text-emerald-100 font-medium text-lg">{stat.label}</div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full opacity-0 group-hover:opacity-80 transition-opacity duration-300"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Decorative line */}
          <div className="mt-16 flex justify-center">
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gradient-to-br from-white via-emerald-50/50 to-cyan-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Sứ mệnh & Tầm nhìn
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Định hướng phát triển và giá trị cốt lõi của SportBooking
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <Card className="group hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border-0 bg-gradient-to-br from-emerald-50 to-green-50 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-green-600/5"></div>
              <CardHeader className="relative z-10 pb-6">
                <CardTitle className="flex items-center space-x-4 text-2xl">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/25 transition-shadow duration-300 group-hover:scale-110">
                    <Target className="h-7 w-7 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent font-bold">
                    Sứ mệnh
                  </span>
                </CardTitle>
                <div className="w-16 h-1 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full"></div>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-gray-700 leading-relaxed text-lg">
                  Chúng tôi cam kết mang đến trải nghiệm đặt sân thể thao dễ
                  dàng, tiện lợi và thông minh nhất cho người dùng Việt Nam.
                  Thông qua việc ứng dụng công nghệ AI và big data, chúng tôi
                  giúp tối ưu hóa việc tìm kiếm và đặt sân, đồng thời hỗ trợ các
                  chủ sân quản lý hiệu quả hơn.
                </p>
                <div className="mt-6 flex items-center space-x-2 text-emerald-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Công nghệ AI & Big Data</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border-0 bg-gradient-to-br from-cyan-50 to-blue-50 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/5 to-blue-600/5"></div>
              <CardHeader className="relative z-10 pb-6">
                <CardTitle className="flex items-center space-x-4 text-2xl">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-cyan-500/25 transition-shadow duration-300 group-hover:scale-110">
                    <Award className="h-7 w-7 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent font-bold">
                    Tầm nhìn
                  </span>
                </CardTitle>
                <div className="w-16 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"></div>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-gray-700 leading-relaxed text-lg">
                  Trở thành nền tảng số 1 Đông Nam Á trong lĩnh vực đặt sân thể
                  thao, góp phần xây dựng một cộng đồng thể thao mạnh mẽ và kết
                  nối. Chúng tôi hướng tới việc số hóa hoàn toàn ngành thể thao,
                  từ đặt sân đến tổ chức giải đấu và kết nối cộng đồng.
                </p>
                <div className="mt-6 flex items-center space-x-2 text-cyan-600">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">#1 Đông Nam Á</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-white via-gray-50/30 to-emerald-50/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Tại sao chọn SportBooking?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Chúng tôi không chỉ là một platform đặt sân thông thường, mà là
              giải pháp toàn diện cho cộng đồng thể thao Việt Nam.
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 mx-auto mt-6 rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group text-center hover:shadow-2xl transition-all duration-500 hover:scale-[1.05] hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm overflow-hidden relative"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 group-hover:to-transparent transition-all duration-500"></div>
                <CardContent className="p-8 relative z-10">
                  <div className={`w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900 group-hover:text-emerald-700 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">{feature.description}</p>
                  
                  {/* Decorative element */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-400/50 to-cyan-400/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gradient-to-br from-emerald-50/30 via-white to-cyan-50/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Hành trình phát triển
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Những cột mốc quan trọng trong quá trình xây dựng SportBooking
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-green-400 mx-auto mt-6 rounded-full"></div>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="relative">
              {/* Enhanced Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-px h-full w-1 bg-gradient-to-b from-emerald-400 via-green-400 to-emerald-400 rounded-full shadow-lg"></div>

              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`relative flex items-center ${
                    index % 2 === 0 ? "justify-start" : "justify-end"
                  } mb-16`}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div
                    className={`w-1/2 ${
                      index % 2 === 0 ? "pr-12 text-right" : "pl-12 text-left"
                    }`}
                  >
                    <Card className="group hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-green-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <CardContent className="p-6 relative z-10">
                        <Badge className="mb-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 px-4 py-2 text-base font-semibold shadow-lg">
                          {milestone.year}
                        </Badge>
                        <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-emerald-700 transition-colors">
                          {milestone.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">
                          {milestone.description}
                        </p>
                        
                        {/* Timeline connector */}
                        <div className={`absolute top-1/2 ${
                          index % 2 === 0 ? "-right-6" : "-left-6"
                        } w-6 h-px bg-gradient-to-r ${
                          index % 2 === 0 ? "from-emerald-300 to-transparent" : "from-transparent to-emerald-300"
                        }`}></div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Enhanced Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-4 border-white shadow-xl z-10 group-hover:scale-125 transition-transform duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-300 to-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gradient-to-br from-white via-emerald-50/20 to-cyan-50/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Đội ngũ lãnh đạo
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Những con người đam mê và tài năng đứng sau thành công của
              SportBooking
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 mx-auto mt-6 rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {team.map((member, index) => (
              <Card
                key={index}
                className="group text-center hover:shadow-2xl transition-all duration-500 hover:scale-[1.05] hover:-translate-y-3 border-0 bg-white/90 backdrop-blur-sm overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-cyan-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto text-3xl text-white shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                      {member.name.charAt(0)}
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-emerald-700 transition-colors">{member.name}</h3>
                  <p className="text-emerald-600 text-base font-semibold mb-4 group-hover:text-emerald-700 transition-colors">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-800 transition-colors">{member.description}</p>
                  
                  {/* Decorative bottom line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-50/40 via-white to-green-50/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Giá trị cốt lõi
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Những giá trị định hướng mọi hoạt động của chúng tôi
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-emerald-400 mx-auto mt-6 rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {values.map((value, index) => (
              <Card
                key={index}
                className="group text-center hover:shadow-2xl transition-all duration-500 hover:scale-[1.05] hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm overflow-hidden relative"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-emerald-50/30 group-hover:to-emerald-50/60 transition-all duration-500"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                    {value.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-gray-900 group-hover:text-emerald-700 transition-colors">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">{value.description}</p>
                  
                  {/* Decorative elements */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-emerald-400/60 to-green-400/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 text-white overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-emerald-400/40 to-emerald-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-cyan-400/30 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-green-400/20 to-green-500/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='ctaPattern' width='40' height='40' patternUnits='userSpaceOnUse'%3e%3ccircle cx='20' cy='20' r='8' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.3'/%3e%3cpath d='M20 12l8 8-8 8-8-8z' fill='%23ffffff' fill-opacity='0.1'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23ctaPattern)'/%3e%3c/svg%3e")`,
        }}></div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-white via-emerald-100 to-cyan-100 bg-clip-text text-transparent">
              Sẵn sàng tham gia cùng chúng tôi?
            </h2>
            <p className="text-xl md:text-2xl mb-12 text-emerald-100 leading-relaxed max-w-3xl mx-auto">
              Hãy trở thành một phần của cộng đồng thể thao lớn nhất Việt Nam
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/search">
                <Button
                  size="lg"
                  className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold py-4 px-8 text-lg shadow-2xl hover:shadow-white/25 transition-all duration-300 hover:scale-105 border-0"
                >
                  🔍 Tìm sân ngay
                </Button>
              </Link>
              <Link href="/owner/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/50 text-white hover:bg-white hover:text-emerald-700 bg-white/10 backdrop-blur-sm font-bold py-4 px-8 text-lg transition-all duration-300 hover:scale-105 hover:border-white"
                >
                  🤝 Trở thành đối tác
                </Button>
              </Link>
            </div>

            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center gap-8 mt-16 text-emerald-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-base">Đăng ký miễn phí</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <span className="text-base">Hỗ trợ 24/7</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                <span className="text-base">Thanh toán an toàn</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
