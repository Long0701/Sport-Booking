import mongoose, { Document, Schema } from 'mongoose'

export interface IBooking extends Document {
  user: mongoose.Types.ObjectId
  court: mongoose.Types.ObjectId
  date: Date
  startTime: string
  endTime: string
  totalAmount: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  paymentStatus: 'pending' | 'paid' | 'refunded'
  paymentMethod?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const BookingSchema = new Schema<IBooking>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  court: {
    type: Schema.Types.ObjectId,
    ref: 'Court',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Vui lòng chọn ngày đặt sân']
  },
  startTime: {
    type: String,
    required: [true, 'Vui lòng chọn giờ bắt đầu']
  },
  endTime: {
    type: String,
    required: [true, 'Vui lòng chọn giờ kết thúc']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Vui lòng nhập tổng tiền']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
})

// Compound index to prevent double booking
BookingSchema.index({ court: 1, date: 1, startTime: 1 }, { unique: true })

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema)
