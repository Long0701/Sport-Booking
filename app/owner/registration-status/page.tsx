'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock, XCircle, Mail, Search } from 'lucide-react'
import Link from "next/link"

interface RegistrationStatus {
  id: number
  businessName: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  reviewedAt?: string
  adminNotes?: string
  reviewedBy?: string
  canLogin: boolean
}

export default function RegistrationStatusPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [registration, setRegistration] = useState<RegistrationStatus | null>(null)
  const [hasRegistration, setHasRegistration] = useState(false)
  const [error, setError] = useState('')

  // Check URL params for email
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const emailParam = urlParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
      checkStatus(emailParam)
    }
  }, [])

  const checkStatus = async (checkEmail?: string) => {
    const emailToCheck = checkEmail || email
    if (!emailToCheck) {
      setError('Vui lòng nhập email')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/owner/register?email=${encodeURIComponent(emailToCheck)}`)
      const data = await response.json()

      if (data.success) {
        setHasRegistration(data.data.hasRegistration)
        setRegistration(data.data.registration)
        
        if (!data.data.hasRegistration) {
          setError('Không tìm thấy đơn đăng ký với email này')
        }
      } else {
        setError(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Check status error:', error)
      setError('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    checkStatus()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Chờ duyệt
          </Badge>
        )
      case 'approved':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Đã duyệt
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Từ chối
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-12 w-12 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="h-12 w-12 text-green-500" />
      case 'rejected':
        return <XCircle className="h-12 w-12 text-red-500" />
      default:
        return <AlertCircle className="h-12 w-12 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Kiểm tra trạng thái đăng ký chủ sân
            </h1>
            <p className="text-gray-600">
              Nhập email đã đăng ký để kiểm tra trạng thái xử lý đơn
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email đăng ký</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Đang kiểm tra...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4" />
                      <span>Kiểm tra trạng thái</span>
                    </div>
                  )}
                </Button>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registration Status */}
          {hasRegistration && registration && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  {getStatusIcon(registration.status)}
                  <h2 className="text-xl font-semibold text-gray-900 mt-4 mb-2">
                    {registration.businessName}
                  </h2>
                  {getStatusBadge(registration.status)}
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Thông tin đơn đăng ký</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Ngày gửi:</span>
                        <span className="ml-2 text-gray-600">{formatDate(registration.submittedAt)}</span>
                      </div>
                      {registration.reviewedAt && (
                        <div>
                          <span className="font-medium">Ngày xử lý:</span>
                          <span className="ml-2 text-gray-600">{formatDate(registration.reviewedAt)}</span>
                        </div>
                      )}
                      {registration.reviewedBy && (
                        <div className="md:col-span-2">
                          <span className="font-medium">Người xử lý:</span>
                          <span className="ml-2 text-gray-600">{registration.reviewedBy}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {registration.status === 'pending' && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Đang chờ xử lý</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Đơn đăng ký của bạn đang được xem xét</li>
                        <li>• Thời gian xử lý: 24-48 giờ làm việc</li>
                        <li>• Bạn sẽ nhận được email thông báo khi có kết quả</li>
                        <li>• Sau khi được duyệt, bạn có thể đăng nhập vào hệ thống</li>
                      </ul>
                    </div>
                  )}

                  {registration.status === 'approved' && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Chúc mừng! Đơn đã được duyệt</h4>
                      <ul className="text-sm text-green-700 space-y-1 mb-4">
                        <li>• Tài khoản chủ sân của bạn đã được kích hoạt</li>
                        <li>• Bạn có thể đăng nhập với email: <strong>{email}</strong></li>
                        <li>• Sau khi đăng nhập, bạn có thể bắt đầu đăng sân</li>
                      </ul>
                      
                      {registration.canLogin && (
                        <Link href="/auth/login">
                          <Button className="bg-green-600 hover:bg-green-700">
                            Đăng nhập ngay
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}

                  {registration.status === 'rejected' && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">Đơn đăng ký bị từ chối</h4>
                      {registration.adminNotes && (
                        <div className="mb-3">
                          <span className="font-medium text-red-700">Lý do:</span>
                          <p className="text-sm text-red-700 mt-1">{registration.adminNotes}</p>
                        </div>
                      )}
                      <ul className="text-sm text-red-700 space-y-1 mb-4">
                        <li>• Bạn có thể đăng ký lại với thông tin chính xác hơn</li>
                        <li>• Liên hệ support nếu cần hỗ trợ</li>
                      </ul>
                      
                      <Link href="/owner/register">
                        <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                          Đăng ký lại
                        </Button>
                      </Link>
                    </div>
                  )}

                  {registration.adminNotes && registration.status !== 'rejected' && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Ghi chú từ admin</h4>
                      <p className="text-sm text-gray-700">{registration.adminNotes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Links */}
          <div className="text-center mt-8 space-x-4">
            <Link href="/" className="text-green-600 hover:underline">
              Về trang chủ
            </Link>
            <span className="text-gray-400">|</span>
            <Link href="/owner/register" className="text-green-600 hover:underline">
              Đăng ký chủ sân
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
