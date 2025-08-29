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
import { MapPin, Shield, Star, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function AuthButtons() {
  const { user, logout } = useAuth();

  if (user) {
    return (
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-600">Xin chào, {user.name}</span>
        {/* {user.role === "owner" && (
          <Link href="/owner/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
        )} */}
        <Button variant="ghost" onClick={logout}>
          Đăng xuất
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <Link href="/auth/login">
        <Button variant="ghost">Đăng nhập</Button>
      </Link>
      <Link href="/auth/register">
        <Button className="bg-green-600 hover:bg-green-700">Đăng ký</Button>
      </Link>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const handleSportClick = (sportName: string) => {
    router.push(`/search?sport=${encodeURIComponent(sportName)}`);
  };

  const sports = [
    { name: "Bóng đá mini", icon: "⚽", count: "120+ sân" },
    { name: "Cầu lông", icon: "🏸", count: "85+ sân" },
    { name: "Tennis", icon: "🎾", count: "45+ sân" },
    { name: "Bóng rổ", icon: "🏀", count: "60+ sân" },
    { name: "Bóng chuyền", icon: "🏐", count: "35+ sân" },
    { name: "Pickleball", icon: "🏓", count: "25+ sân" },
  ];

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
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">🏟️</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              SportBooking
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/search" className="text-gray-600 hover:text-green-600">
              Tìm sân
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-green-600">
              Về chúng tôi
            </Link>
            <Link
              href="/contact"
              className="text-gray-600 hover:text-green-600"
            >
              Liên hệ
            </Link>
          </nav>
          <AuthButtons />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-100">
            🚀 Nền tảng đặt sân thông minh #1 Việt Nam
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Đặt sân thể thao
            <span className="text-green-600"> thông minh</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Tìm kiếm và đặt sân thể thao gần bạn với AI gợi ý khung giờ tối ưu,
            theo dõi thời tiết và đánh giá chất lượng từ cộng đồng.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-lg px-8"
              >
                <MapPin className="mr-2 h-5 w-5" />
                Tìm sân ngay
              </Button>
            </Link>

            {user?.role === "owner" && (
              <Link href="/owner/courts">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  <Users className="mr-2 h-5 w-5" />
                  Xem trang quản lý
                </Button>
              </Link>
            )}

            {user?.role === "user" && (
              <Link href="/bookings">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  <Users className="mr-2 h-5 w-5" />
                  Xem sân đã đặt
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Sports Categories */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Các môn thể thao phổ biến
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {sports.map((sport, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSportClick(sport.name)}
              >
                <CardContent className="p-6">
                  <div className="text-4xl mb-3">{sport.icon}</div>
                  <h3 className="font-semibold mb-2">{sport.name}</h3>
                  <p className="text-sm text-gray-600">{sport.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tại sao chọn SportBooking?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-green-600">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-green-600 text-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-green-100">Sân thể thao</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-green-100">Người dùng</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-green-100">Lượt đặt sân</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.8★</div>
              <div className="text-green-100">Đánh giá</div>
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

      {/* Footer */}
      <footer className="bg-gray-50 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🏟️</span>
                </div>
                <span className="text-xl font-bold">SportBooking</span>
              </div>
              <p className="text-gray-600">
                Nền tảng đặt sân thể thao thông minh hàng đầu Việt Nam
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Sản phẩm</h3>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <Link href="/search">Tìm sân</Link>
                </li>
                <li>
                  <Link href="/mobile">Ứng dụng mobile</Link>
                </li>
                <li>
                  <Link href="/owner">Dành cho chủ sân</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Hỗ trợ</h3>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <Link href="/help">Trung tâm trợ giúp</Link>
                </li>
                <li>
                  <Link href="/contact">Liên hệ</Link>
                </li>
                <li>
                  <Link href="/terms">Điều khoản</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Liên hệ</h3>
              <ul className="space-y-2 text-gray-600">
                <li>📧 support@sportbooking.vn</li>
                <li>📞 1900 1234</li>
                <li>📍 TP.HCM, Việt Nam</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-gray-600">
            <p>&copy; 2024 SportBooking. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
