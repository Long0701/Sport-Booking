'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Building, Clock, DollarSign, MapPin, Phone, X } from 'lucide-react'
import Link from "next/link"
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from "react"

export default function EditCourtPage() {
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
    const [uploadingImage, setUploadingImage] = useState(false);

  
  const [courtData, setCourtData] = useState({
    name: "",
    type: "",
    description: "",
    address: "",
    images: [] as string[],
    amenities: [] as string[],
    pricePerHour: "",
    openTime: "06:00",
    closeTime: "22:00",
    phone: "",
    isActive: true
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const sportTypes = [
    { value: 'football', label: 'Bóng đá mini', icon: '⚽' },
    { value: 'badminton', label: 'Cầu lông', icon: '🏸' },
    { value: 'tennis', label: 'Tennis', icon: '🎾' },
    { value: 'basketball', label: 'Bóng rổ', icon: '🏀' },
    { value: 'volleyball', label: 'Bóng chuyền', icon: '🏐' },
    { value: 'pickleball', label: 'Pickleball', icon: '🏓' }
  ]

  const availableAmenities = [
    'Wifi miễn phí',
    'Chỗ đậu xe',
    'Phòng thay đồ',
    'Vòi sen',
    'Điều hòa',
    'Căng tin',
    'Nước uống',
    'Ghế ngồi',
    'Tủ khóa',
    'Camera an ninh'
  ]

  useEffect(() => {
    if (params.id && user) {
      fetchCourt()
    }
  }, [params.id, user])

  const fetchCourt = async () => {
    try {
      setFetchLoading(true)
      const response = await fetch(`/api/courts/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()

      if (data.success) {
        const court = data.data
        setCourtData({
          name: court.name,
          type: court.type,
          description: court.description,
          address: court.address,
          images: court.images || [],
          amenities: court.amenities || [],
          pricePerHour: court.pricePerHour.toString(),
          openTime: court.openTime,
          closeTime: court.closeTime,
          phone: court.phone,
          isActive: court.isActive !== false
        })
      } else {
        alert('Không tìm thấy sân hoặc bạn không có quyền chỉnh sửa')
        router.push('/owner/courts')
      }
    } catch (error) {
      console.error('Error fetching court:', error)
      alert('Có lỗi xảy ra khi tải thông tin sân')
      router.push('/owner/courts')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước file không được vượt quá 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setCourtData((prev) => ({
          ...prev,
          images: [...prev.images, data.imageUrl],
        }));
        alert("Tải ảnh lên thành công!");
      } else {
        alert(data.error || "Có lỗi xảy ra khi tải ảnh lên");
      }
    } catch (error) {
      alert("Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setCourtData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };


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

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setCourtData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    if (checked) {
      setCourtData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenity]
      }))
    } else {
      setCourtData(prev => ({
        ...prev,
        amenities: prev.amenities.filter(a => a !== amenity)
      }))
    }
  }

  const validate = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!courtData.name.trim()) newErrors.name = 'Tên sân là bắt buộc'
    if (!courtData.type) newErrors.type = 'Loại sân là bắt buộc'
    if (!courtData.description.trim()) newErrors.description = 'Mô tả là bắt buộc'
    if (!courtData.address.trim()) newErrors.address = 'Địa chỉ là bắt buộc'
    if (!courtData.phone.trim()) newErrors.phone = 'Số điện thoại là bắt buộc'
    if (!courtData.pricePerHour || parseInt(courtData.pricePerHour) <= 0) {
      newErrors.pricePerHour = 'Giá thuê phải lớn hơn 0'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setLoading(true)
    
    try {
      const response = await fetch(`/api/courts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: courtData.name,
          type: courtData.type,
          description: courtData.description,
          address: courtData.address,
          images: courtData.images,
          amenities: courtData.amenities,
          pricePerHour: parseInt(courtData.pricePerHour),
          openTime: courtData.openTime,
          closeTime: courtData.closeTime,
          phone: courtData.phone
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Cập nhật sân thành công!')
        router.push('/owner/courts')
      } else {
        alert(data.error || 'Có lỗi xảy ra khi cập nhật sân')
      }
    } catch (error) {
      console.error('Error updating court:', error)
      alert('Có lỗi xảy ra khi cập nhật sân')
    } finally {
      setLoading(false)
    }
  }

  const addImagePlaceholder = () => {
    const imageUrl = `/placeholder.svg?height=300&width=400&query=${courtData.type} court`
    setCourtData(prev => ({
      ...prev,
      images: [...prev.images, imageUrl]
    }))
  }



  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin sân...</p>
        </div>
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
              <Link href="/owner/courts">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại danh sách
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🏟️</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">Chỉnh sửa sân</h1>
                  <p className="text-sm text-gray-600">Cập nhật thông tin sân</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Thông tin sân</span>
                </CardTitle>
                <CardDescription>
                  Chỉnh sửa thông tin sân thể thao
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tên sân *</Label>
                    <Input
                      id="name"
                      placeholder="VD: Sân bóng đá ABC"
                      value={courtData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Loại sân *</Label>
                    <Select value={courtData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Chọn loại sân" />
                      </SelectTrigger>
                      <SelectContent>
                        {sportTypes.map((sport) => (
                          <SelectItem key={sport.value} value={sport.value}>
                            <div className="flex items-center space-x-2">
                              <span>{sport.icon}</span>
                              <span>{sport.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả sân *</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả chi tiết về sân, chất lượng, đặc điểm nổi bật..."
                    value={courtData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="address">Địa chỉ *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="address"
                        placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                        value={courtData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className={`pl-10 ${errors.address ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="0901234567"
                        value={courtData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pricePerHour">Giá thuê (VNĐ/giờ) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="pricePerHour"
                        type="number"
                        placeholder="200000"
                        value={courtData.pricePerHour}
                        onChange={(e) => handleInputChange('pricePerHour', e.target.value)}
                        className={`pl-10 ${errors.pricePerHour ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.pricePerHour && <p className="text-sm text-red-500">{errors.pricePerHour}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="openTime">Giờ mở cửa</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="openTime"
                        type="time"
                        value={courtData.openTime}
                        onChange={(e) => handleInputChange('openTime', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="closeTime">Giờ đóng cửa</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="closeTime"
                        type="time"
                        value={courtData.closeTime}
                        onChange={(e) => handleInputChange('closeTime', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Tiện ích</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableAmenities.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity}
                          checked={courtData.amenities.includes(amenity)}
                          onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                        />
                        <Label htmlFor={amenity} className="text-sm">{amenity}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Hình ảnh sân</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {courtData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Sân ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    
                    {courtData.images.length < 5 && (
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploadingImage}
            />
            <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg bg-gray-50">
              {uploadingImage ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mb-2"></div>
                  <span className="text-sm text-gray-600">Đang tải...</span>
                </>
              ) : (
                <>
                  <span className="text-2xl text-gray-400 mb-2">+</span>
                  <span className="text-sm text-gray-600">Thêm ảnh</span>
                </>
              )}
            </div>
          </div>
        )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={courtData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked as boolean)}
                  />
                  <Label htmlFor="isActive">Sân đang hoạt động</Label>
                </div>

                <div className="flex justify-end space-x-4">
                  <Link href="/owner/courts">
                    <Button type="button" variant="outline">
                      Hủy
                    </Button>
                  </Link>
                  <Button 
                    type="submit"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? "Đang cập nhật..." : "Cập nhật sân"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
}
