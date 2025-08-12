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
      color: "text-yellow-600 bg-yellow-100",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Thanh toán an toàn",
      description:
        "Hệ thống thanh toán được mã hóa SSL, hỗ trợ nhiều phương thức thanh toán phổ biến tại Việt Nam.",
      color: "text-green-600 bg-green-100",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Cộng đồng thể thao",
      description:
        "Kết nối với cộng đồng thể thao, chia sẻ kinh nghiệm và tìm kiếm đối tác chơi thể thao.",
      color: "text-blue-600 bg-blue-100",
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Phủ sóng toàn quốc",
      description:
        "Mạng lưới sân thể thao trải dài khắp các tỉnh thành, từ thành phố lớn đến các khu vực nông thôn.",
      color: "text-purple-600 bg-purple-100",
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-white/20 text-white hover:bg-white/20">
            🚀 Nền tảng đặt sân thông minh #1 Việt Nam
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Về chúng tôi</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            SportBooking được sinh ra từ đam mê thể thao và mong muốn kết nối
            cộng đồng yêu thể thao Việt Nam thông qua công nghệ hiện đại và trải
            nghiệm người dùng tuyệt vời.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-6 w-6 text-green-600" />
                  <span>Sứ mệnh</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  Chúng tôi cam kết mang đến trải nghiệm đặt sân thể thao dễ
                  dàng, tiện lợi và thông minh nhất cho người dùng Việt Nam.
                  Thông qua việc ứng dụng công nghệ AI và big data, chúng tôi
                  giúp tối ưu hóa việc tìm kiếm và đặt sân, đồng thời hỗ trợ các
                  chủ sân quản lý hiệu quả hơn.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-6 w-6 text-blue-600" />
                  <span>Tầm nhìn</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  Trở thành nền tảng số 1 Đông Nam Á trong lĩnh vực đặt sân thể
                  thao, góp phần xây dựng một cộng đồng thể thao mạnh mẽ và kết
                  nối. Chúng tôi hướng tới việc số hóa hoàn toàn ngành thể thao,
                  từ đặt sân đến tổ chức giải đấu và kết nối cộng đồng.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Tại sao chọn SportBooking?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Chúng tôi không chỉ là một platform đặt sân thông thường, mà là
              giải pháp toàn diện cho cộng đồng thể thao Việt Nam.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-16 h-16 rounded-full ${feature.color} flex items-center justify-center mx-auto mb-4`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Hành trình phát triển</h2>
            <p className="text-gray-600">
              Những cột mốc quan trọng trong quá trình xây dựng SportBooking
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-green-200"></div>

              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`relative flex items-center ${
                    index % 2 === 0 ? "justify-start" : "justify-end"
                  } mb-8`}
                >
                  <div
                    className={`w-1/2 ${
                      index % 2 === 0 ? "pr-8 text-right" : "pl-8 text-left"
                    }`}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <Badge className="mb-2 bg-green-100 text-green-800">
                          {milestone.year}
                        </Badge>
                        <h3 className="font-semibold mb-2">
                          {milestone.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {milestone.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-600 rounded-full border-4 border-white shadow"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Đội ngũ lãnh đạo</h2>
            <p className="text-gray-600">
              Những con người đam mê và tài năng đứng sau thành công của
              SportBooking
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <img
                    src={member.avatar || "/placeholder.svg"}
                    alt={member.name}
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="font-semibold mb-1">{member.name}</h3>
                  <p className="text-green-600 text-sm font-medium mb-2">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-xs">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Giá trị cốt lõi</h2>
            <p className="text-gray-600">
              Những giá trị định hướng mọi hoạt động của chúng tôi
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                    {value.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Sẵn sàng tham gia cùng chúng tôi?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Hãy trở thành một phần của cộng đồng thể thao lớn nhất Việt Nam
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search">
              <Button
                size="lg"
                className="bg-white text-green-600 hover:bg-gray-100"
              >
                Tìm sân ngay
              </Button>
            </Link>
            <Link href="/owner/register">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-green-600 bg-transparent"
              >
                Trở thành đối tác
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
