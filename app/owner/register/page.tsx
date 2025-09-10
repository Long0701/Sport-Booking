'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Building, Mail, Phone, MapPin, User, Lock, Eye, EyeOff } from 'lucide-react'
import Link from "next/link"

export default function OwnerRegisterPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [ownerData, setOwnerData] = useState({
    // Thông tin cá nhân
    name: "",
    email: "",
    password: "",
    phone: "",
    // Thông tin doanh nghiệp
    businessName: "",
    businessAddress: "",
    businessPhone: "",
    businessEmail: "",
    description: "",
    experience: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/owner/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ownerData)
      })

      const data = await response.json()

      if (data.success) {
        // Lưu thông tin để hiển thị trên trang success
        localStorage.setItem('registrationSuccess', JSON.stringify({
          message: data.message,
          businessName: data.data.registration.businessName,
          email: data.data.registration.email,
          submittedAt: data.data.registration.submittedAt
        }))
        
        // Redirect về homepage với thông báo thành công
        window.location.href = '/?registration=success'
      } else {
        alert(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setOwnerData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">🏟️</span>
            </div>
            <span className="text-xl font-bold">SportBooking</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Badge variant={step >= 1 ? "default" : "secondary"}>1. Thông tin cá nhân</Badge>
              <Badge variant={step >= 2 ? "default" : "secondary"}>2. Thông tin doanh nghiệp</Badge>
              <Badge variant={step >= 3 ? "default" : "secondary"}>3. Xác nhận</Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Thông tin cá nhân</span>
                </CardTitle>
                <CardDescription>
                  Vui lòng cung cấp thông tin cá nhân để tạo tài khoản
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      placeholder="Nguyễn Văn A"
                      value={ownerData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={ownerData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Bạn sẽ sử dụng email này để đăng nhập sau khi được duyệt
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Tối thiểu 6 ký tự"
                      value={ownerData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0901234567"
                      value={ownerData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => setStep(2)}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={!ownerData.name || !ownerData.email || !ownerData.password || ownerData.password.length < 6}
                  >
                    Tiếp tục
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Thông tin doanh nghiệp</span>
                </CardTitle>
                <CardDescription>
                  Vui lòng cung cấp thông tin về doanh nghiệp của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Tên doanh nghiệp *</Label>
                    <Input
                      id="businessName"
                      placeholder="VD: Sân bóng ABC"
                      value={ownerData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessPhone">Số điện thoại doanh nghiệp *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="businessPhone"
                        type="tel"
                        placeholder="0901234567"
                        value={ownerData.businessPhone}
                        onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Email doanh nghiệp</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="businessEmail"
                      type="email"
                      placeholder="business@example.com"
                      value={ownerData.businessEmail}
                      onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Địa chỉ doanh nghiệp *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="businessAddress"
                      placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                      value={ownerData.businessAddress}
                      onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả doanh nghiệp</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả về các sân thể thao, dịch vụ của bạn..."
                    value={ownerData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Kinh nghiệm</Label>
                  <Textarea
                    id="experience"
                    placeholder="Kinh nghiệm quản lý sân thể thao, các dự án đã thực hiện..."
                    value={ownerData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Quay lại
                  </Button>
                  <Button 
                    onClick={() => setStep(3)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={!ownerData.businessName || !ownerData.businessPhone || !ownerData.businessAddress}
                  >
                    Tiếp tục
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Xác nhận thông tin</CardTitle>
                <CardDescription>
                  Vui lòng kiểm tra lại thông tin trước khi gửi đăng ký
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Thông tin cá nhân */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Thông tin cá nhân</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Họ tên:</span>
                      <span>{ownerData.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Email:</span>
                      <span>{ownerData.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Số điện thoại:</span>
                      <span>{ownerData.phone || 'Chưa cung cấp'}</span>
                    </div>
                  </div>
                </div>

                {/* Thông tin doanh nghiệp */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Thông tin doanh nghiệp</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Tên doanh nghiệp:</span>
                      <span>{ownerData.businessName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Số điện thoại:</span>
                      <span>{ownerData.businessPhone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Email doanh nghiệp:</span>
                      <span>{ownerData.businessEmail || 'Chưa cung cấp'}</span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="font-medium">Địa chỉ:</span>
                      <span className="text-right max-w-xs">{ownerData.businessAddress}</span>
                    </div>
                    {ownerData.description && (
                      <div className="flex items-start justify-between">
                        <span className="font-medium">Mô tả:</span>
                        <span className="text-right max-w-xs">{ownerData.description}</span>
                      </div>
                    )}
                    {ownerData.experience && (
                      <div className="flex items-start justify-between">
                        <span className="font-medium">Kinh nghiệm:</span>
                        <span className="text-right max-w-xs">{ownerData.experience}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Bước tiếp theo:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Chúng tôi sẽ xem xét hồ sơ trong vòng 24-48 giờ</li>
                    <li>• Bạn sẽ nhận được email thông báo khi đơn được duyệt</li>
                    <li>• Sau khi được duyệt, bạn có thể đăng nhập và bắt đầu đăng sân</li>
                    <li>• Email đăng nhập sẽ là: <strong>{ownerData.email}</strong></li>
                  </ul>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="flex items-center space-x-2 mb-4">
                    <input type="checkbox" id="terms" required />
                    <Label htmlFor="terms" className="text-sm">
                      Tôi đồng ý với{" "}
                      <Link href="/terms" className="text-green-600 hover:underline">
                        điều khoản dịch vụ
                      </Link>{" "}
                      và{" "}
                      <Link href="/privacy" className="text-green-600 hover:underline">
                        chính sách bảo mật
                      </Link>
                    </Label>
                  </div>

                  <div className="flex space-x-4">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setStep(2)}
                      className="flex-1"
                    >
                      Quay lại
                    </Button>
                    <Button 
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={loading}
                    >
                      {loading ? "Đang gửi..." : "Gửi đăng ký"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
