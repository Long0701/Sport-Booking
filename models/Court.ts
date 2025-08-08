import mongoose, { Document, Schema } from 'mongoose'

export interface ICourt extends Document {
  name: string
  type: 'football' | 'badminton' | 'tennis' | 'basketball' | 'volleyball' | 'pickleball'
  description: string
  address: string
  location: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
  images: string[]
  amenities: string[]
  pricePerHour: number
  openTime: string
  closeTime: string
  phone: string
  owner: mongoose.Types.ObjectId
  rating: number
  reviewCount: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const CourtSchema = new Schema<ICourt>({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên sân'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Vui lòng chọn loại sân'],
    enum: ['football', 'badminton', 'tennis', 'basketball', 'volleyball', 'pickleball']
  },
  description: {
    type: String,
    required: [true, 'Vui lòng nhập mô tả sân']
  },
  address: {
    type: String,
    required: [true, 'Vui lòng nhập địa chỉ']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  images: [{
    type: String
  }],
  amenities: [{
    type: String
  }],
  pricePerHour: {
    type: Number,
    required: [true, 'Vui lòng nhập giá thuê']
  },
  openTime: {
    type: String,
    required: [true, 'Vui lòng nhập giờ mở cửa'],
    default: '06:00'
  },
  closeTime: {
    type: String,
    required: [true, 'Vui lòng nhập giờ đóng cửa'],
    default: '22:00'
  },
  phone: {
    type: String,
    required: [true, 'Vui lòng nhập số điện thoại']
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Create geospatial index for location-based queries
CourtSchema.index({ location: '2dsphere' })

export default mongoose.models.Court || mongoose.model<ICourt>('Court', CourtSchema)
