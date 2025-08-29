"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Send,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/shared/header";
import Footer from "@/components/shared/footer";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock form submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          category: "",
          message: "",
        });
      }, 3000);
    }, 1500);
  };

  const contactInfo = [
    {
      icon: <Phone className="h-6 w-6" />,
      title: "Điện thoại",
      details: ["Hotline: 1900 1234", "Hỗ trợ: 0901 234 567"],
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email",
      details: ["support@sportbooking.vn", "business@sportbooking.vn"],
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "Địa chỉ",
      details: ["456 Trần Phú", "Hải Châu, TP Đà Nẵng"],
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Giờ làm việc",
      details: ["T2-T6: 8:00 - 18:00", "T7-CN: 9:00 - 17:00"],
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ];

  const faqItems = [
    {
      question: "Làm thế nào để đặt sân?",
      answer:
        "Bạn có thể tìm kiếm sân phù hợp, chọn khung giờ và đặt sân trực tuyến. Thanh toán có thể thực hiện online hoặc tại sân.",
    },
    {
      question: "Có thể hủy booking không?",
      answer:
        "Bạn có thể hủy booking trước 2 giờ so với giờ đặt sân. Phí hủy có thể áp dụng tùy theo chính sách của từng sân.",
    },
    {
      question: "Làm thế nào để trở thành chủ sân?",
      answer:
        "Đăng ký tài khoản chủ sân, cung cấp thông tin doanh nghiệp và chờ xét duyệt. Sau khi được duyệt, bạn có thể đăng sân của mình.",
    },
    {
      question: "Có hỗ trợ thanh toán online không?",
      answer:
        "Có, chúng tôi hỗ trợ nhiều phương thức thanh toán online như thẻ ATM, ví điện tử, chuyển khoản ngân hàng.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/50 to-cyan-50/50">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-32 overflow-hidden min-h-screen flex items-center">
        {/* Background Image Layer */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgaWQ9ImNvbnRhY3QiPjxjaXJjbGUgcj0iMzAiIGN4PSI1MCIgY3k9IjUwIiBmaWxsPSJub25lIiBzdHJva2U9IiMxMGI5ODEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLW9wYWNpdHk9IjAuMjUiLz48cmVjdCB4PSIzNSIgeT0iMzUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgZmlsbD0iIzEwYjk4MSIgZmlsbC1vcGFjaXR5PSIwLjA4Ii8+PGNpcmNsZSByPSIxNSIgY3g9IjUwIiBjeT0iNTAiIGZpbGw9IiMxMGI5ODEiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNjb250YWN0KSIvPjwvc3ZnPg==')] animate-pulse"
            style={{ animationDuration: '10s' }}></div>
        </div>

        {/* Animated Floating Elements */}
        <div className="absolute inset-0 opacity-30">
          {/* Large Communication Orbs */}
          <div className="absolute top-24 left-16 w-44 h-44 bg-gradient-to-br from-emerald-400/25 to-teal-500/15 rounded-full blur-3xl animate-bounce" 
            style={{ animationDuration: '7s', animationDelay: '0s' }}></div>
          <div className="absolute bottom-28 right-20 w-52 h-52 bg-gradient-to-br from-cyan-400/20 to-emerald-500/12 rounded-full blur-3xl animate-bounce" 
            style={{ animationDuration: '9s', animationDelay: '2s' }}></div>
          <div className="absolute top-1/3 right-1/5 w-36 h-36 bg-gradient-to-br from-teal-400/18 to-green-500/12 rounded-full blur-2xl animate-bounce" 
            style={{ animationDuration: '8s', animationDelay: '4s' }}></div>
          <div className="absolute bottom-1/3 left-1/4 w-40 h-40 bg-gradient-to-br from-emerald-300/15 to-cyan-400/8 rounded-full blur-3xl animate-bounce" 
            style={{ animationDuration: '6s', animationDelay: '1s' }}></div>

          {/* Communication Icons Floating */}
          <div className="absolute top-36 right-28 text-7xl opacity-20 animate-spin" style={{ animationDuration: '25s' }}>📱</div>
          <div className="absolute bottom-36 left-32 text-6xl opacity-15 animate-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }}>💬</div>
          <div className="absolute top-1/2 left-20 text-5xl opacity-18 animate-pulse" style={{ animationDelay: '3s' }}>📧</div>
          <div className="absolute top-28 left-1/2 text-6xl opacity-15 animate-pulse" style={{ animationDelay: '5s' }}>☎️</div>
          <div className="absolute bottom-1/4 right-1/4 text-5xl opacity-20 animate-pulse" style={{ animationDelay: '7s' }}>📞</div>
          <div className="absolute top-2/3 right-1/3 text-4xl opacity-15 animate-pulse" style={{ animationDelay: '1s' }}>💻</div>
        </div>

        {/* Dynamic Contact Patterns */}
        <div className="absolute inset-0 opacity-12">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='90' height='90' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='contact-pattern' width='90' height='90' patternUnits='userSpaceOnUse'%3e%3ccircle cx='45' cy='45' r='25' fill='none' stroke='%2310b981' stroke-width='1.5' stroke-opacity='0.25'/%3e%3crect x='30' y='30' width='30' height='30' fill='%2310b981' fill-opacity='0.08' rx='5'/%3e%3cpath d='M15,15 Q45,5 75,15 Q85,45 75,75 Q45,85 15,75 Q5,45 15,15' fill='none' stroke='%230891b2' stroke-width='0.8' stroke-opacity='0.15'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23contact-pattern)'/%3e%3c/svg%3e")`,
          }}></div>
        </div>

        {/* Animated Wave Effect */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden opacity-25">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-20">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
              className="fill-current text-emerald-600/25 animate-pulse" style={{ animationDuration: '5s' }}></path>
          </svg>
        </div>

        {/* Contact Particle System */}
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-emerald-300 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${2.5 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Enhanced Badge */}
            <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 text-white hover:from-emerald-400/40 hover:to-cyan-400/40 border-2 border-emerald-300/40 hover:border-emerald-200/60 backdrop-blur-md px-8 py-4 rounded-3xl text-lg font-semibold shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105">
                <span className="w-4 h-4 bg-emerald-300 rounded-full animate-ping"></span>
                <MessageCircle className="h-6 w-6" />
                💬 Hỗ trợ khách hàng 24/7
              </div>
            </div>
            
            {/* Animated Main Title */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-12 leading-tight animate-fade-in" style={{ animationDelay: '1s' }}>
              <span className="bg-gradient-to-r from-emerald-200 via-cyan-100 to-teal-200 bg-clip-text text-transparent drop-shadow-2xl">
                Liên hệ với chúng tôi
              </span>
            </h1>
            
            {/* Enhanced Description */}
            <div className="mb-16 animate-fade-in" style={{ animationDelay: '1.5s' }}>
              <p className="text-xl md:text-3xl max-w-5xl mx-auto text-emerald-50/90 leading-relaxed font-light mb-8">
                Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7. Hãy liên hệ với chúng tôi qua
                các kênh dưới đây hoặc gửi tin nhắn trực tiếp.
              </p>
              <div className="w-32 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent mx-auto animate-pulse"></div>
            </div>

            {/* Enhanced Support Highlights */}
            <div className="flex flex-wrap justify-center gap-8 mb-12 animate-fade-in" style={{ animationDelay: '2s' }}>
              {[
                { text: "Phản hồi trong 24h", color: "bg-emerald-400", icon: "⚡" },
                { text: "Hỗ trợ 24/7", color: "bg-cyan-400", icon: "🕐" },
                { text: "Tư vấn miễn phí", color: "bg-teal-400", icon: "💡" }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="group flex items-center space-x-4 bg-white/10 backdrop-blur-md rounded-2xl px-8 py-5 border border-white/20 hover:border-white/40 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                  style={{ animationDelay: `${2.5 + index * 0.2}s` }}
                >
                  <span className="text-3xl group-hover:scale-125 transition-transform duration-300">{item.icon}</span>
                  <div className={`w-5 h-5 ${item.color} rounded-full animate-pulse shadow-lg`} style={{ animationDelay: `${index * 0.5}s` }}></div>
                  <span className="text-lg font-medium text-emerald-100 group-hover:text-white transition-colors">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Contact Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in" style={{ animationDelay: '3s' }}>
              <button className="group bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-5 px-10 rounded-2xl shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-1 border-2 border-emerald-400/50">
                <span className="flex items-center gap-3">
                  <span className="group-hover:rotate-12 transition-transform duration-300">📞</span>
                  Gọi ngay: 1900 1234
                </span>
              </button>
              <button className="group bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-bold py-5 px-10 rounded-2xl border-2 border-white/30 hover:border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                <span className="flex items-center gap-3">
                  <span className="group-hover:scale-125 transition-transform duration-300">📧</span>
                  Email: support@sportbooking.vn
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Gửi tin nhắn</span>
                </CardTitle>
                <CardDescription>
                  Điền thông tin dưới đây và chúng tôi sẽ phản hồi trong vòng 24
                  giờ
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-green-600 mb-2">
                      Gửi thành công!
                    </h3>
                    <p className="text-gray-600">
                      Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất có
                      thể.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Họ và tên *</Label>
                        <Input
                          id="name"
                          placeholder="Nguyễn Văn A"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="0901234567"
                          value={formData.phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Danh mục</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            handleInputChange("category", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn danh mục" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">
                              Câu hỏi chung
                            </SelectItem>
                            <SelectItem value="booking">
                              Hỗ trợ đặt sân
                            </SelectItem>
                            <SelectItem value="owner">
                              Dành cho chủ sân
                            </SelectItem>
                            <SelectItem value="technical">
                              Hỗ trợ kỹ thuật
                            </SelectItem>
                            <SelectItem value="partnership">
                              Hợp tác kinh doanh
                            </SelectItem>
                            <SelectItem value="complaint">Khiếu nại</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Tiêu đề *</Label>
                      <Input
                        id="subject"
                        placeholder="Tiêu đề tin nhắn"
                        value={formData.subject}
                        onChange={(e) =>
                          handleInputChange("subject", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Nội dung *</Label>
                      <Textarea
                        id="message"
                        placeholder="Mô tả chi tiết vấn đề hoặc câu hỏi của bạn..."
                        value={formData.message}
                        onChange={(e) =>
                          handleInputChange("message", e.target.value)
                        }
                        rows={6}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Gửi tin nhắn
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Info & FAQ */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin liên hệ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactInfo.map((info, index) => (
                  <div key={index} className="group p-4 rounded-2xl hover:bg-gray-50 transition-all duration-300 hover:scale-[1.02] border border-gray-100 hover:border-emerald-200 hover:shadow-md">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 ${info.bgColor} ${info.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                        {info.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2 text-gray-900 group-hover:text-emerald-700 transition-colors">{info.title}</h4>
                        <div className="space-y-1">
                          {info.details.map((detail, idx) => (
                            <p key={idx} className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                              {detail}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Liên kết nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link
                  href="/search"
                  className="group block p-4 rounded-xl hover:bg-emerald-50 transition-all duration-300 border border-gray-100 hover:border-emerald-200 hover:shadow-sm"
                >
                  <div className="font-medium text-emerald-600 group-hover:text-emerald-700 transition-colors">🔍 Tìm sân</div>
                  <div className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors mt-1">
                    Tìm kiếm và đặt sân ngay
                  </div>
                </Link>
                <Link
                  href="/owner/register"
                  className="group block p-4 rounded-xl hover:bg-cyan-50 transition-all duration-300 border border-gray-100 hover:border-cyan-200 hover:shadow-sm"
                >
                  <div className="font-medium text-cyan-600 group-hover:text-cyan-700 transition-colors">
                    🏟️ Đăng ký chủ sân
                  </div>
                  <div className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors mt-1">
                    Đăng ký để cho thuê sân
                  </div>
                </Link>
                <Link
                  href="/help"
                  className="group block p-4 rounded-xl hover:bg-green-50 transition-all duration-300 border border-gray-100 hover:border-green-200 hover:shadow-sm"
                >
                  <div className="font-medium text-green-600 group-hover:text-green-700 transition-colors">
                    💬 Trung tâm trợ giúp
                  </div>
                  <div className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors mt-1">
                    Câu hỏi thường gặp
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle>Theo dõi chúng tôi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition-colors"
                  >
                    📘 Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition-colors"
                  >
                    💬 Zalo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100 hover:border-pink-300 transition-colors"
                  >
                    📷 Instagram
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors"
                  >
                    📺 Youtube
                  </Button>
                </div>
                <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-sm text-emerald-700 text-center">
                    🔔 Nhận thông báo khuyến mãi và cập nhật mới nhất
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Câu hỏi thường gặp</CardTitle>
              <CardDescription className="text-center">
                Một số câu hỏi phổ biến từ người dùng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {faqItems.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-semibold text-gray-900">
                      {item.question}
                    </h4>
                    <p className="text-gray-600 text-sm">{item.answer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
