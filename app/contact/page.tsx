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
      color: "text-green-600",
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email",
      details: ["support@sportbooking.vn", "business@sportbooking.vn"],
      color: "text-blue-600",
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "Địa chỉ",
      details: ["123 Nguyễn Văn Linh", "Quận 7, TP.HCM"],
      color: "text-purple-600",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Giờ làm việc",
      details: ["T2-T6: 8:00 - 18:00", "T7-CN: 9:00 - 17:00"],
      color: "text-orange-600",
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Liên hệ với chúng tôi
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ với chúng tôi qua
            các kênh dưới đây.
          </p>
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
                      className="w-full bg-green-600 hover:bg-green-700"
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
              <CardContent className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`${info.color} mt-1`}>{info.icon}</div>
                    <div>
                      <h4 className="font-semibold mb-1">{info.title}</h4>
                      {info.details.map((detail, idx) => (
                        <p key={idx} className="text-sm text-gray-600">
                          {detail}
                        </p>
                      ))}
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
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-green-600">Tìm sân</div>
                  <div className="text-sm text-gray-600">
                    Tìm kiếm và đặt sân ngay
                  </div>
                </Link>
                <Link
                  href="/auth/register"
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-blue-600">
                    Đăng ký chủ sân
                  </div>
                  <div className="text-sm text-gray-600">
                    Đăng ký để cho thuê sân
                  </div>
                </Link>
                <Link
                  href="/help"
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-purple-600">
                    Trung tâm trợ giúp
                  </div>
                  <div className="text-sm text-gray-600">
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
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                  >
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                  >
                    Zalo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                  >
                    Instagram
                  </Button>
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
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
