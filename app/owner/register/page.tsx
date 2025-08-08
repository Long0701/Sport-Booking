'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Building, Mail, Phone, MapPin, Clock, DollarSign } from 'lucide-react'
import Link from "next/link"
import { useAuth } from '@/contexts/AuthContext'

export default function OwnerRegisterPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  
  const [ownerData, setOwnerData] = useState({
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
    
    // Mock submission - in real app, save to database
    setTimeout(() => {
      setLoading(false)
      alert('Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn trong 24h.')
      window.location.href = '/owner/dashboard'
    }, 2000)
  }

  const handleInputChange = (field: string, value: string) => {
    setOwnerData(prev => ({ ...prev, [field]: value }))
  }

  if (!user || user.role !== 'owner') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Truy cập bị từ chối</h2>
            <p className="text-gray-600 mb-4">
              Bạn cần đăng ký tài khoản chủ sân để truy cập trang này.
            </p>
            <Link href="/auth/register">
              <Button className="bg-green-600 hover:bg-green-700">
                Đăng ký làm chủ sân
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
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
              <Badge variant={step >= 1 ? "default" : "secondary"}>1. Thông tin cơ bản</Badge>
              <Badge variant={step >= 2 ? "default" : "secondary"}>2. Xác nhận</Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 2) * 100}%` }}
              ></div>
            </div>
          </div>

          {step === 1 && (
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

                <div className="flex justify-end">
                  <Button 
                    onClick={() => setStep(2)}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={!ownerData.businessName || !ownerData.businessPhone || !ownerData.businessAddress}
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
                <CardTitle>Xác nhận thông tin</CardTitle>
                <CardDescription>
                  Vui lòng kiểm tra lại thông tin trước khi gửi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Tên doanh nghiệp:</span>
                    <span>{ownerData.businessName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Số điện thoại:</span>
                    <span>{ownerData.businessPhone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{ownerData.businessEmail || 'Chưa cung cấp'}</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="font-medium">Địa chỉ:</span>
                    <span className="text-right max-w-xs">{ownerData.businessAddress}</span>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Bước tiếp theo:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Chúng tôi sẽ xem xét hồ sơ trong vòng 24 giờ</li>
                    <li>• Bạn sẽ nhận được email xác nhận</li>
                    <li>• Sau khi được duyệt, bạn có thể bắt đầu đăng sân</li>
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
                      onClick={() => setStep(1)}
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
