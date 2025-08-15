'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from '@/contexts/AuthContext'
import { formatRating } from "@/lib/utils"
import { ArrowLeft, Clock, Edit, Eye, MapPin, MoreHorizontal, Plus, Search, Star, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import Link from "next/link"
import { useEffect, useState } from "react"

interface Court {
  id: number
  name: string
  type: string
  address: string
  price_per_hour: number
  rating: number
  review_count: number
  images: string[]
  is_active: boolean
  open_time: string
  close_time: string
  created_at: string
}

export default function CourtsManagementPage() {
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const { user } = useAuth()

  const sportTypes = [
    { value: 'football', label: 'Bóng đá mini', icon: '⚽' },
    { value: 'badminton', label: 'Cầu lông', icon: '🏸' },
    { value: 'tennis', label: 'Tennis', icon: '🎾' },
    { value: 'basketball', label: 'Bóng rổ', icon: '🏀' },
    { value: 'volleyball', label: 'Bóng chuyền', icon: '🏐' },
    { value: 'pickleball', label: 'Pickleball', icon: '🏓' }
  ]

  useEffect(() => {
    if (user) {
      fetchCourts()
    }
  }, [user])

  const fetchCourts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/owner/courts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setCourts(data.data)
      } else {
        console.error('Error fetching courts:', data.error)
      }
    } catch (error) {
      console.error('Error fetching courts:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCourtStatus = async (courtId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/courts/${courtId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          is_active: !currentStatus
        })
      })

      const data = await response.json()

      if (data.success) {
        setCourts(prev => prev.map(court => 
          court.id === courtId 
            ? { ...court, is_active: !currentStatus }
            : court
        ))
        alert(`Sân đã được ${!currentStatus ? 'kích hoạt' : 'tạm dừng'} thành công!`)
      } else {
        alert('Có lỗi xảy ra khi cập nhật trạng thái sân')
      }
    } catch (error) {
      console.error('Error toggling court status:', error)
      alert('Có lỗi xảy ra khi cập nhật trạng thái sân')
    }
  }

  const deleteCourt = async (courtId: number) => {
    try {
      const response = await fetch(`/api/courts/${courtId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setCourts(prev => prev.filter(court => court.id !== courtId))
        alert('Xóa sân thành công!')
      } else {
        alert('Có lỗi xảy ra khi xóa sân')
      }
    } catch (error) {
      console.error('Error deleting court:', error)
      alert('Có lỗi xảy ra khi xóa sân')
    }
  }

  const getSportTypeLabel = (type: string) => {
    const sport = sportTypes.find(s => s.value === type)
    return sport ? `${sport.icon} ${sport.label}` : type
  }

  const filteredCourts = courts.filter(court => {
    const matchesSearch = court.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         court.address.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || court.type === filterType
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && court.is_active) ||
                         (filterStatus === 'inactive' && !court.is_active)
    
    return matchesSearch && matchesType && matchesStatus
  })

  if (!user || user.role !== 'owner') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Truy cập bị từ chối</h2>
            <p className="text-gray-600 mb-4">
              Bạn cần đăng nhập với tài khoản chủ sân để truy cập trang này.
            </p>
            <Link href="/auth/login">
              <Button className="bg-green-600 hover:bg-green-700">
                Đăng nhập
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/owner/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🏟️</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">Quản lý sân</h1>
                  <p className="text-sm text-gray-600">{courts.length} sân</p>
                </div>
              </div>
            </div>
            <Link href="/owner/courts/add">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Thêm sân mới
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm theo tên sân hoặc địa chỉ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Loại sân" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại sân</SelectItem>
                  {sportTypes.map((sport) => (
                    <SelectItem key={sport.value} value={sport.value}>
                      {sport.icon} {sport.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Courts List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="flex">
                  <div className="w-48 h-32 bg-gray-200 rounded-l-lg"></div>
                  <div className="flex-1 p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredCourts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  🏟️
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery || filterType !== 'all' || filterStatus !== 'all' 
                    ? 'Không tìm thấy sân nào' 
                    : 'Chưa có sân nào'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                    ? 'Thử thay đổi bộ lọc để xem kết quả khác'
                    : 'Bắt đầu bằng cách thêm sân đầu tiên của bạn'}
                </p>
              </div>
              {!searchQuery && filterType === 'all' && filterStatus === 'all' && (
                <Link href="/owner/courts/add">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm sân đầu tiên
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 overflow-auto h-[calc(100vh-232px)]">
            {filteredCourts.map((court) => (
              <Card key={court.id} className="hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-48 h-48 md:h-32">
                    <img
                      src={court.images[0] || "/placeholder.svg?height=200&width=300&query=sports court"}
                      alt={court.name}
                      className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                    />
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{court.name}</h3>
                          <Badge variant="secondary">
                            {getSportTypeLabel(court.type)}
                          </Badge>
                          <Badge variant={court.is_active ? "default" : "secondary"}>
                            {court.is_active ? "Hoạt động" : "Tạm dừng"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="text-sm">{court.address}</span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{court.open_time} - {court.close_time}</span>
                          </div>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 mr-1 text-yellow-400" />
                            <span>{formatRating(court.rating)} ({court.review_count} đánh giá)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="text-right mr-4">
                          <div className="text-lg font-bold text-green-600">
                            {court.price_per_hour.toLocaleString('vi-VN')}đ/giờ
                          </div>
                          <div className="text-xs text-gray-500">
                            Tạo: {new Date(court.created_at).toLocaleDateString('vi-VN')}
                          </div>
                        </div>

                        <div className="relative">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Mở menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              align="end" 
                              className="w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50"
                              sideOffset={5}
                            >
                              <DropdownMenuItem 
                                className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault()
                                  window.location.href = `/court/${court.id}`
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Xem chi tiết
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault()
                                  window.location.href = `/owner/courts/edit/${court.id}`
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault()
                                  toggleCourtStatus(court.id, court.is_active)
                                }}
                              >
                                {court.is_active ? (
                                  <>
                                    <ToggleLeft className="h-4 w-4 mr-2" />
                                    Tạm dừng
                                  </>
                                ) : (
                                  <>
                                    <ToggleRight className="h-4 w-4 mr-2" />
                                    Kích hoạt
                                  </>
                                )}
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                className="flex items-center px-3 py-2 text-sm hover:bg-red-50 text-red-600 cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault()
                                  if (confirm(`Bạn có chắc chắn muốn xóa sân "${court.name}"?`)) {
                                    deleteCourt(court.id)
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa sân
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
