'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Search, 
  Filter, 
  Eye, 
  Check, 
  X, 
  Clock, 
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { toast } from "sonner"

interface OwnerRegistration {
  id: number
  user_id: number
  business_name: string
  business_address: string
  business_phone: string
  business_email: string
  description: string
  experience: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string
  reviewed_at: string
  created_at: string
  user_name: string
  user_email: string
  user_phone: string
  user_created_at: string
  reviewed_by_name: string
}

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
  new_this_week: number
}

export default function OwnerRegistrationsPage() {
  const [registrations, setRegistrations] = useState<OwnerRegistration[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<OwnerRegistration | null>(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [adminNotes, setAdminNotes] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  useEffect(() => {
    fetchRegistrations()
  }, [page, statusFilter, search])

  const fetchRegistrations = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.href = '/auth/login'
        return
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: statusFilter,
        search: search
      })

      const response = await fetch(`/api/admin/owner-registrations?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setRegistrations(data.data.requests)
        setStats(data.data.stats)
        setTotalPages(data.data.pagination.totalPages)
      } else {
        setError(data.error)
      }
    } catch (error) {
      console.error('Fetch registrations error:', error)
      setError('Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async () => {
    if (!selectedRequest) return

    setReviewLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/owner-registrations/${selectedRequest.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: reviewAction,
          admin_notes: adminNotes
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setReviewModalOpen(false)
        setAdminNotes('')
        setSelectedRequest(null)
        fetchRegistrations()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Review error:', error)
      toast.error('Có lỗi xảy ra')
    } finally {
      setReviewLoading(false)
    }
  }

  const openReviewModal = (request: OwnerRegistration, action: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setReviewAction(action)
    setAdminNotes('')
    setReviewModalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Chờ duyệt</Badge>
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600">Đã duyệt</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600">Từ chối</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Duyệt đơn đăng ký chủ sân</h1>
        <p className="text-gray-600">Quản lý các đơn đăng ký làm chủ sân từ người dùng</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-sm text-gray-600">Tổng đơn</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-sm text-gray-600">Chờ duyệt</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-sm text-gray-600">Đã duyệt</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-sm text-gray-600">Từ chối</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.new_this_week}</div>
              <p className="text-sm text-gray-600">Mới tuần này</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên doanh nghiệp, tên người dùng, email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value)
              setPage(1)
            }}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Registrations List */}
      <div className="space-y-4">
        {registrations.length > 0 ? (
          registrations.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.business_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Đơn từ: {request.user_name} ({request.user_email})
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(request.status)}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Chi tiết
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Chi tiết đơn đăng ký</DialogTitle>
                              <DialogDescription>
                                Thông tin chi tiết đơn đăng ký làm chủ sân
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Trạng thái</Label>
                                  <div className="mt-1">
                                    {getStatusBadge(request.status)}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Ngày gửi</Label>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {formatDate(request.created_at)}
                                  </p>
                                </div>
                              </div>

                              <div className="border-t pt-4">
                                <h4 className="font-medium mb-3">Thông tin người dùng</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Label>Tên</Label>
                                    <p className="text-gray-600">{request.user_name}</p>
                                  </div>
                                  <div>
                                    <Label>Email</Label>
                                    <p className="text-gray-600">{request.user_email}</p>
                                  </div>
                                  <div>
                                    <Label>Số điện thoại</Label>
                                    <p className="text-gray-600">{request.user_phone || 'Chưa cung cấp'}</p>
                                  </div>
                                  <div>
                                    <Label>Ngày đăng ký</Label>
                                    <p className="text-gray-600">{formatDate(request.user_created_at)}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="border-t pt-4">
                                <h4 className="font-medium mb-3">Thông tin doanh nghiệp</h4>
                                <div className="space-y-3 text-sm">
                                  <div>
                                    <Label>Tên doanh nghiệp</Label>
                                    <p className="text-gray-600">{request.business_name}</p>
                                  </div>
                                  <div>
                                    <Label>Địa chỉ</Label>
                                    <p className="text-gray-600">{request.business_address}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Số điện thoại</Label>
                                      <p className="text-gray-600">{request.business_phone}</p>
                                    </div>
                                    <div>
                                      <Label>Email doanh nghiệp</Label>
                                      <p className="text-gray-600">{request.business_email || 'Chưa cung cấp'}</p>
                                    </div>
                                  </div>
                                  {request.description && (
                                    <div>
                                      <Label>Mô tả</Label>
                                      <p className="text-gray-600">{request.description}</p>
                                    </div>
                                  )}
                                  {request.experience && (
                                    <div>
                                      <Label>Kinh nghiệm</Label>
                                      <p className="text-gray-600">{request.experience}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {request.status !== 'pending' && (
                                <div className="border-t pt-4">
                                  <h4 className="font-medium mb-3">Thông tin xử lý</h4>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <Label>Người xử lý</Label>
                                      <p className="text-gray-600">{request.reviewed_by_name}</p>
                                    </div>
                                    <div>
                                      <Label>Thời gian xử lý</Label>
                                      <p className="text-gray-600">{formatDate(request.reviewed_at)}</p>
                                    </div>
                                    {request.admin_notes && (
                                      <div>
                                        <Label>Ghi chú</Label>
                                        <p className="text-gray-600">{request.admin_notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Business Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{request.business_address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{request.business_phone}</span>
                      </div>
                      {request.business_email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{request.business_email}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(request.created_at)}</span>
                      </div>
                    </div>

                    {/* Actions for pending requests */}
                    {request.status === 'pending' && (
                      <div className="flex items-center space-x-3 pt-3 border-t">
                        <Button
                          onClick={() => openReviewModal(request, 'approve')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Duyệt
                        </Button>
                        <Button
                          onClick={() => openReviewModal(request, 'reject')}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Từ chối
                        </Button>
                      </div>
                    )}

                    {/* Status info for processed requests */}
                    {request.status !== 'pending' && (
                      <div className="text-sm text-gray-500 pt-3 border-t">
                        {request.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'} bởi{' '}
                        <span className="font-medium">{request.reviewed_by_name}</span> vào{' '}
                        {formatDate(request.reviewed_at)}
                        {request.admin_notes && (
                          <div className="mt-1">
                            <span className="font-medium">Ghi chú:</span> {request.admin_notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy đơn đăng ký nào
              </h3>
              <p className="text-gray-600">
                {search || statusFilter !== 'all' 
                  ? 'Thử thay đổi bộ lọc để xem kết quả khác'
                  : 'Chưa có đơn đăng ký làm chủ sân nào'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            Trước
          </Button>
          <span className="text-sm text-gray-600">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            Tiếp
          </Button>
        </div>
      )}

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Duyệt' : 'Từ chối'} đơn đăng ký
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve' 
                ? 'Người dùng sẽ được nâng cấp thành chủ sân và có thể đăng sân.'
                : 'Đơn đăng ký sẽ bị từ chối và người dùng có thể gửi lại đơn mới.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{selectedRequest.business_name}</p>
                <p className="text-sm text-gray-600">
                  Người gửi: {selectedRequest.user_name} ({selectedRequest.user_email})
                </p>
              </div>

              <div>
                <Label htmlFor="admin-notes">
                  Ghi chú {reviewAction === 'approve' ? '(tùy chọn)' : '(bắt buộc)'}
                </Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={
                    reviewAction === 'approve' 
                      ? 'Ghi chú cho chủ sân mới...'
                      : 'Lý do từ chối (bắt buộc)...'
                  }
                  className="mt-2"
                />
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleReview}
                  disabled={reviewLoading || (reviewAction === 'reject' && !adminNotes.trim())}
                  className={
                    reviewAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }
                >
                  {reviewLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : reviewAction === 'approve' ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  {reviewLoading 
                    ? 'Đang xử lý...' 
                    : reviewAction === 'approve' 
                      ? 'Duyệt đơn' 
                      : 'Từ chối đơn'
                  }
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setReviewModalOpen(false)}
                  disabled={reviewLoading}
                >
                  Hủy
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
