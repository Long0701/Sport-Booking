import mongoose, { Document, Schema } from 'mongoose'

export interface IReview extends Document {
  user: mongoose.Types.ObjectId
  court: mongoose.Types.ObjectId
  booking: mongoose.Types.ObjectId
  rating: number
  comment: string
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<IReview>({
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
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Vui lòng chọn số sao đánh giá'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: [true, 'Vui lòng nhập nhận xét']
  }
}, {
  timestamps: true
})

// One review per booking
ReviewSchema.index({ booking: 1 }, { unique: true })

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema)
