"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/AuthContext"
import { ArrowLeft, Building, Clock, DollarSign, ImageIcon, MapPin, Phone, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function AddCourtPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [courtData, setCourtData] = useState({
    name: "",
    type: "",
    description: "",
    address: "",
    latitude: "",
    longitude: "",
    images: [] as string[],
    amenities: [] as string[],
    pricePerHour: "",
    openTime: "06:00",
    closeTime: "22:00",
    phone: "",
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const sportTypes = [
    { value: "football", label: "Bóng đá mini", icon: "⚽" },
    { value: "badminton", label: "Cầu lông", icon: "🏸" },
    { value: "tennis", label: "Tennis", icon: "🎾" },
    { value: "basketball", label: "Bóng rổ", icon: "🏀" },
    { value: "volleyball", label: "Bóng chuyền", icon: "🏐" },
    { value: "pickleball", label: "Pickleball", icon: "🏓" },
  ]

  const availableAmenities = [
    "Wifi miễn phí",
    "Chỗ đậu xe",
    "Phòng thay đồ",
    "Vòi sen",
    "Điều hòa",
    "Căng tin",
    "Nước uống",
    "Ghế ngồi",
    "Tủ khóa",
    "Camera an ninh",
  ]

  if (!user || user.role !== "owner") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Truy cập bị từ chối</h2>
            <p className="text-gray-600 mb-4">Bạn cần đăng nhập với tài khoản chủ sân để truy cập trang này.</p>
            <Link href="/auth/login">
              <Button className="bg-green-600 hover:bg-green-700">Đăng nhập</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleInputChange = (field: string, value: string | string[]) => {
    setCourtData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    if (checked) {
      setCourtData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, amenity],
      }))
    } else {
      setCourtData((prev) => ({
        ...prev,
        amenities: prev.amenities.filter((a) => a !== amenity),
      }))
    }
  }

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {}

    if (!courtData.name.trim()) newErrors.name = "Tên sân là bắt buộc"
    if (!courtData.type) newErrors.type = "Loại sân là bắt buộc"
    if (!courtData.description.trim()) newErrors.description = "Mô tả là bắt buộc"
    if (!courtData.address.trim()) newErrors.address = "Địa chỉ là bắt buộc"
    if (!courtData.phone.trim()) newErrors.phone = "Số điện thoại là bắt buộc"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: { [key: string]: string } = {}

    if (!courtData.pricePerHour || Number.parseInt(courtData.pricePerHour) <= 0) {
      newErrors.pricePerHour = "Giá thuê phải lớn hơn 0"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const getCoordinatesFromAddress = async (address: string) => {
    console.log(address);
    
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&limit=1`,
      { headers: { "Accept-Language": "vi,en;q=0.8" } }
    );
    const data = await res.json();

    console.log(res);
    console.log(data);
    
    
    if (data.length === 0) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch (err) {
    console.error("Geocoding error:", err);
    return null;
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep2()) return

    setLoading(true)

    try {
      // Get coordinates from address (mock for now)
const coordinates = await getCoordinatesFromAddress(courtData.address);

console.log("Coordinates:", coordinates);


      const response = await fetch("/api/courts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: courtData.name,
          type: courtData.type,
          description: courtData.description,
          address: courtData.address,
          coordinates,
          images: courtData.images.length > 0 ? courtData.images : ["/generic-sports-court.png"],
          amenities: courtData.amenities,
          pricePerHour: Number.parseInt(courtData.pricePerHour),
          openTime: courtData.openTime,
          closeTime: courtData.closeTime,
          phone: courtData.phone,
          ownerId: user.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert("Thêm sân thành công!")
        router.push("/owner/dashboard")
      } else {
        alert(data.error || "Có lỗi xảy ra khi thêm sân")
      }
    } catch (error) {
      console.error("Error creating court:", error)
      alert("Có lỗi xảy ra khi thêm sân")
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước file không được vượt quá 5MB")
      return
    }

    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setCourtData((prev) => ({
          ...prev,
          images: [...prev.images, data.imageUrl],
        }))
        alert("Tải ảnh lên thành công!")
      } else {
        console.error("Upload error:", data.error)
        alert(data.error || "Có lỗi xảy ra khi tải ảnh lên")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.")
    } finally {
      setUploadingImage(false)
      // Reset file input
      event.target.value = ""
    }
  }

  const removeImage = (index: number) => {
    setCourtData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
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
                  <h1 className="text-xl font-bold">Thêm sân mới</h1>
                  <p className="text-sm text-gray-600">Tạo sân thể thao mới</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Badge variant={step >= 1 ? "default" : "secondary"}>1. Thông tin cơ bản</Badge>
              <Badge variant={step >= 2 ? "default" : "secondary"}>2. Giá & Thời gian</Badge>
              <Badge variant={step >= 3 ? "default" : "secondary"}>3. Xác nhận</Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Thông tin cơ bản</span>
                </CardTitle>
                <CardDescription>Nhập thông tin cơ bản về sân thể thao</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tên sân *</Label>
                    <Input
                      id="name"
                      placeholder="VD: Sân bóng đá ABC"
                      value={courtData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Loại sân *</Label>
                    <Select value={courtData.type} onValueChange={(value) => handleInputChange("type", value)}>
                      <SelectTrigger className={errors.type ? "border-red-500" : ""}>
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
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                    className={errors.description ? "border-red-500" : ""}
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
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className={`pl-10 ${errors.address ? "border-red-500" : ""}`}
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
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
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
                        <Label htmlFor={amenity} className="text-sm">
                          {amenity}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleNext} className="bg-green-600 hover:bg-green-700">
                    Tiếp tục
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Pricing & Schedule */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Giá & Thời gian hoạt động</span>
                </CardTitle>
                <CardDescription>Thiết lập giá thuê và giờ hoạt động</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                        onChange={(e) => handleInputChange("pricePerHour", e.target.value)}
                        className={`pl-10 ${errors.pricePerHour ? "border-red-500" : ""}`}
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
                        onChange={(e) => handleInputChange("openTime", e.target.value)}
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
                        onChange={(e) => handleInputChange("closeTime", e.target.value)}
                        className="pl-10"
                      />
                    </div>
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
                        <Button
                          type="button"
                          variant="outline"
                          className="h-32 border-dashed w-full bg-transparent"
                          disabled={uploadingImage}
                        >
                          <div className="text-center">
                            {uploadingImage ? (
                              <>
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                                <span className="text-sm text-gray-600">Đang tải...</span>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                                <span className="text-sm text-gray-600">Thêm ảnh</span>
                              </>
                            )}
                          </div>
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Thêm tối đa 5 hình ảnh (JPG, PNG, tối đa 5MB mỗi ảnh)</p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Quay lại
                  </Button>
                  <Button onClick={handleNext} className="bg-green-600 hover:bg-green-700">
                    Tiếp tục
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Xác nhận thông tin</CardTitle>
                <CardDescription>Kiểm tra lại thông tin trước khi tạo sân</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Thông tin cơ bản</h4>
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tên sân:</span>
                          <span className="font-medium">{courtData.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Loại sân:</span>
                          <span className="font-medium">
                            {sportTypes.find((s) => s.value === courtData.type)?.label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Số điện thoại:</span>
                          <span className="font-medium">{courtData.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900">Địa chỉ</h4>
                      <p className="mt-1 text-sm text-gray-600">{courtData.address}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900">Mô tả</h4>
                      <p className="mt-1 text-sm text-gray-600">{courtData.description}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Giá & Thời gian</h4>
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Giá thuê:</span>
                          <span className="font-medium text-green-600">
                            {Number.parseInt(courtData.pricePerHour).toLocaleString("vi-VN")}đ/giờ
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Giờ hoạt động:</span>
                          <span className="font-medium">
                            {courtData.openTime} - {courtData.closeTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900">Tiện ích</h4>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {courtData.amenities.map((amenity) => (
                          <Badge key={amenity} variant="secondary" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900">Hình ảnh</h4>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {courtData.images.slice(0, 3).map((image, index) => (
                          <img
                            key={index}
                            src={image || "/placeholder.svg"}
                            alt={`Sân ${index + 1}`}
                            className="w-full h-16 object-cover rounded border"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="flex items-center space-x-2 mb-6">
                    <Checkbox id="confirm" required />
                    <Label htmlFor="confirm" className="text-sm">
                      Tôi xác nhận thông tin trên là chính xác và đồng ý với{" "}
                      <Link href="/terms" className="text-green-600 hover:underline">
                        điều khoản dịch vụ
                      </Link>
                    </Label>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>
                      Quay lại
                    </Button>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={loading}>
                      {loading ? "Đang tạo sân..." : "Tạo sân"}
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
