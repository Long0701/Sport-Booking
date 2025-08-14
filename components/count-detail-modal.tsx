"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatRating } from "@/lib/utils"
import { Clock, MapPin, Phone, Star } from "lucide-react"
import { getSportIcon, getSportLabel } from "./count-card"

interface Court {
  id: string
  name: string
  type: string
  description: string
  address: string
  images: string[]
  amenities: string[]
  pricePerHour: number
  openTime: string
  closeTime: string
  phone: string
  rating?: number
  reviewCount?: number
}

interface CourtDetailModalProps {
  court: Court | null
  isOpen: boolean
  onClose: () => void
  onBook?: (court: Court) => void
}

export default function CourtDetailModal({ court, isOpen, onClose, onBook }: CourtDetailModalProps) {
  if (!court) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>{getSportIcon(court.type)}</span>
            <span>{court.name}</span>
            <Badge variant="secondary">{getSportLabel(court.type)}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-4">
              {court.images && court.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {court.images.map((image, index) => (
                    <img
                      key={index}
                      src={image || "/placeholder.svg"}
                      alt={`${court.name} - Ảnh ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              ) : (
                <img
                  src={`/abstract-geometric-shapes.png?height=300&width=400&query=${court.type} court`}
                  alt={court.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Thông tin chi tiết</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{court.address}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{court.phone}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>
                    {court.openTime} - {court.closeTime}
                  </span>
                </div>

                {court.rating && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                            <span>{formatRating(court.rating)}/5</span>
                    {court.reviewCount && <span className="text-gray-500">({court.reviewCount} đánh giá)</span>}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Mô tả</h4>
              <p className="text-sm text-gray-600">{court.description}</p>
            </div>

            {court.amenities && court.amenities.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Tiện ích</h4>
                <div className="flex flex-wrap gap-1">
                  {court.amenities.map((amenity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-2xl font-bold text-green-600">
                    {court.pricePerHour.toLocaleString("vi-VN")}đ
                  </span>
                  <span className="text-gray-500 ml-1">/giờ</span>
                </div>
              </div>

              {onBook && (
                <Button onClick={() => onBook(court)} className="w-full bg-green-600 hover:bg-green-700">
                  Đặt sân ngay
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
