'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { User, Phone, MessageSquare, Calendar, Clock, DollarSign, CheckCircle } from 'lucide-react'

interface GuestBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (guestData: { 
    guestName: string
    guestPhone: string
    notes?: string 
  }) => void
  bookingDetails: {
    courtName: string
    date: string
    startTime: string
    endTime: string
    totalPrice: number
    hours: number
  }
}

export default function GuestBookingModal({
  isOpen,
  onClose,
  onConfirm,
  bookingDetails
}: GuestBookingModalProps) {
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (!guestName.trim()) {
      newErrors.guestName = 'Vui lòng nhập họ tên'
    } else if (guestName.trim().length < 2) {
      newErrors.guestName = 'Tên phải có ít nhất 2 ký tự'
    }
    
    if (!guestPhone.trim()) {
      newErrors.guestPhone = 'Vui lòng nhập số điện thoại'
    } else if (!/^[0-9+\-\s()]{10,15}$/.test(guestPhone.trim())) {
      newErrors.guestPhone = 'Số điện thoại không hợp lệ'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      await onConfirm({
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        notes: notes.trim() || undefined
      })
      
      // Reset form
      setGuestName('')
      setGuestPhone('')
      setNotes('')
      setErrors({})
    } catch (error) {
      console.error('Booking error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setGuestName('')
      setGuestPhone('')
      setNotes('')
      setErrors({})
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-emerald-50/20 to-cyan-50/20 border-emerald-200/40 shadow-2xl">
        <DialogHeader className="space-y-4 pb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl animate-bounce">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-3xl font-black bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-800 bg-clip-text text-transparent">
              Đặt sân nhanh chóng
            </DialogTitle>
            <DialogDescription className="text-gray-600 font-medium text-lg mt-2">
              Điền thông tin để hoàn tất đặt sân mà không cần tạo tài khoản
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Booking Summary */}
        <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl border border-white/40 p-6 mb-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            Chi tiết đặt sân
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-200/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🏟️</span>
                </div>
                <div>
                  <div className="text-sm text-gray-600 font-medium">Sân</div>
                  <div className="font-bold text-gray-800">{bookingDetails.courtName}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-200/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-600 font-medium">Ngày</div>
                  <div className="font-bold text-gray-800">{bookingDetails.date}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl p-4 border border-purple-200/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-600 font-medium">Thời gian</div>
                  <div className="font-bold text-gray-800">{bookingDetails.startTime} - {bookingDetails.endTime}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-200/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-600 font-medium">Tổng tiền</div>
                  <div className="font-bold text-orange-700 text-lg">{bookingDetails.totalPrice.toLocaleString('vi-VN')}đ</div>
                  <div className="text-xs text-orange-600">{bookingDetails.hours} giờ</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Information Form */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Thông tin của bạn</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guestName" className="text-gray-700 font-semibold">
                Họ và tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="guestName"
                type="text"
                placeholder="VD: Nguyễn Văn A"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className={`bg-white/80 backdrop-blur-sm border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20 ${
                  errors.guestName ? 'border-red-500 focus:border-red-500' : ''
                }`}
                disabled={isSubmitting}
              />
              {errors.guestName && (
                <p className="text-red-500 text-sm font-medium">{errors.guestName}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guestPhone" className="text-gray-700 font-semibold">
                Số điện thoại <span className="text-red-500">*</span>
              </Label>
              <Input
                id="guestPhone"
                type="tel"
                placeholder="VD: 0901234567"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className={`bg-white/80 backdrop-blur-sm border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20 ${
                  errors.guestPhone ? 'border-red-500 focus:border-red-500' : ''
                }`}
                disabled={isSubmitting}
              />
              {errors.guestPhone && (
                <p className="text-red-500 text-sm font-medium">{errors.guestPhone}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-gray-700 font-semibold">
                Ghi chú (không bắt buộc)
              </Label>
              <Textarea
                id="notes"
                placeholder="VD: Muốn đặt sân có mái che, cần thiết bị..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-white/80 backdrop-blur-sm border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20 resize-none"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200/50">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={isSubmitting}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800 font-semibold"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Xác nhận đặt sân
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
