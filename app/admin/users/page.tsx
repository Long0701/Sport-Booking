'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  UserCheck,
  AlertCircle,
  Eye
} from 'lucide-react'
import { toast } from "sonner"

interface UserData {
  id: number
  name: string
  email: string
  phone: string
  role: 'user' | 'owner' | 'admin'
  approval_status: string
  approved_at: string
  approved_by_name: string
  created_at: string
  updated_at: string
  courts_count: number
  bookings_count: number
}

interface CreateUserData {
  name: string
  email: string
  password: string
  phone: string
  role: 'user' | 'owner'
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [approvalFilter, setApprovalFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Create user modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createData, setCreateData] = useState<CreateUserData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user'
  })
  const [createLoading, setCreateLoading] = useState(false)

  // View user modal
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter, approvalFilter, search])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.href = '/auth/login'
        return
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        role: roleFilter,
        approval_status: approvalFilter,
        search: search
      })

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setUsers(data.data.users)
        setTotalPages(data.data.pagination.totalPages)
      } else {
        setError(data.error)
      }
    } catch (error) {
      console.error('Fetch users error:', error)
      setError('Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!createData.name || !createData.email || !createData.password) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    setCreateLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setCreateModalOpen(false)
        setCreateData({
          name: '',
          email: '',
          password: '',
          phone: '',
          role: 'user'
        })
        fetchUsers()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Create user error:', error)
      toast.error('Có lỗi xảy ra')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchUsers()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Delete user error:', error)
      toast.error('Có lỗi xảy ra')
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Quản trị</Badge>
      case 'owner':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Chủ sân</Badge>
      case 'user':
        return <Badge variant="outline">Người dùng</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600">Đã duyệt</Badge>
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Chờ duyệt</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600">Từ chối</Badge>
      case 'none':
        return <Badge variant="outline" className="text-gray-600">Không áp dụng</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Chưa có'
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-600">Quản lý tài khoản người dùng, chủ sân và quản trị viên</p>
        </div>
        
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Tạo tài khoản
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo tài khoản mới</DialogTitle>
              <DialogDescription>
                Tạo tài khoản người dùng hoặc chủ sân mới
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-name">Tên *</Label>
                  <Input
                    id="create-name"
                    value={createData.name}
                    onChange={(e) => setCreateData(prev => ({...prev, name: e.target.value}))}
                    placeholder="Nhập họ tên"
                  />
                </div>
                <div>
                  <Label htmlFor="create-role">Vai trò *</Label>
                  <Select 
                    value={createData.role} 
                    onValueChange={(value: 'user' | 'owner') => 
                      setCreateData(prev => ({...prev, role: value}))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Người dùng</SelectItem>
                      <SelectItem value="owner">Chủ sân</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createData.email}
                  onChange={(e) => setCreateData(prev => ({...prev, email: e.target.value}))}
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <Label htmlFor="create-password">Mật khẩu *</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createData.password}
                  onChange={(e) => setCreateData(prev => ({...prev, password: e.target.value}))}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>

              <div>
                <Label htmlFor="create-phone">Số điện thoại</Label>
                <Input
                  id="create-phone"
                  value={createData.phone}
                  onChange={(e) => setCreateData(prev => ({...prev, phone: e.target.value}))}
                  placeholder="0901234567"
                />
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleCreateUser}
                  disabled={createLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {createLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={createLoading}
                >
                  Hủy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên, email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={(value) => {
              setRoleFilter(value)
              setPage(1)
            }}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="user">Người dùng</SelectItem>
                <SelectItem value="owner">Chủ sân</SelectItem>
                <SelectItem value="admin">Quản trị</SelectItem>
              </SelectContent>
            </Select>
            <Select value={approvalFilter} onValueChange={(value) => {
              setApprovalFilter(value)
              setPage(1)
            }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
                <SelectItem value="none">Không áp dụng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-900">Người dùng</th>
                  <th className="text-left p-4 font-medium text-gray-900">Vai trò</th>
                  <th className="text-left p-4 font-medium text-gray-900">Trạng thái duyệt</th>
                  <th className="text-left p-4 font-medium text-gray-900">Hoạt động</th>
                  <th className="text-left p-4 font-medium text-gray-900">Ngày tạo</th>
                  <th className="text-left p-4 font-medium text-gray-900">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          {user.phone && (
                            <p className="text-sm text-gray-500">{user.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="p-4">
                      {getApprovalBadge(user.approval_status)}
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {user.role === 'owner' && (
                          <p className="text-gray-600">Chủ sân</p>
                        )}
                        {user.role === 'user' && (
                          <p className="text-gray-600">Người dùng</p>
                        )}
                        {user.role === 'admin' && (
                          <p className="text-gray-600">Quản trị viên</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setViewModalOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {user.role !== 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy người dùng nào
              </h3>
              <p className="text-gray-600">
                {search || roleFilter !== 'all' || approvalFilter !== 'all'
                  ? 'Thử thay đổi bộ lọc để xem kết quả khác'
                  : 'Chưa có người dùng nào trong hệ thống'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* View User Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết tài khoản người dùng
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Tên</Label>
                  <p className="text-gray-600">{selectedUser.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Vai trò</Label>
                  <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Số điện thoại</Label>
                  <p className="text-gray-600">{selectedUser.phone || 'Chưa cung cấp'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Trạng thái duyệt</Label>
                  <div className="mt-1">{getApprovalBadge(selectedUser.approval_status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Ngày tạo</Label>
                  <p className="text-gray-600">{formatDate(selectedUser.created_at)}</p>
                </div>
              </div>

              {selectedUser.approval_status === 'approved' && selectedUser.approved_at && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Thông tin duyệt</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Người duyệt</Label>
                      <p className="text-gray-600">{selectedUser.approved_by_name || 'System'}</p>
                    </div>
                    <div>
                      <Label>Ngày duyệt</Label>
                      <p className="text-gray-600">{formatDate(selectedUser.approved_at)}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedUser.role === 'owner' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Thống kê chủ sân</h4>
                  <div className="text-sm">
                    <p className="text-gray-600">Số sân quản lý: {selectedUser.courts_count}</p>
                  </div>
                </div>
              )}

              {selectedUser.role === 'user' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Thống kê người dùng</h4>
                  <div className="text-sm">
                    <p className="text-gray-600">Số booking đã đặt: {selectedUser.bookings_count}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
