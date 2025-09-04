const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Import models
const User = require('../models/User').default
const Court = require('../models/Court').default
const Booking = require('../models/Booking').default
const Review = require('../models/Review').default

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sportbooking'

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Clear existing data
    await User.deleteMany({})
    await Court.deleteMany({})
    await Booking.deleteMany({})
    await Review.deleteMany({})
    console.log('Cleared existing data')

    // Create users
    const hashedPassword = await bcrypt.hash('123456', 12)
    
    const users = await User.create([
      {
        name: 'Nguyễn Văn A',
        email: 'user1@example.com',
        password: hashedPassword,
        phone: '0901234567',
        role: 'user'
      },
      {
        name: 'Trần Thị B',
        email: 'user2@example.com',
        password: hashedPassword,
        phone: '0901234568',
        role: 'user'
      },
      {
        name: 'Lê Văn C',
        email: 'owner1@example.com',
        password: hashedPassword,
        phone: '0901234569',
        role: 'owner'
      },
      {
        name: 'Phạm Thị D',
        email: 'owner2@example.com',
        password: hashedPassword,
        phone: '0901234570',
        role: 'owner'
      }
    ])

    console.log('Created users')

    // Create courts
    const courts = await Court.create([
      {
        name: 'Sân bóng đá Thành Công',
        type: 'football',
        description: 'Sân bóng đá mini chất lượng cao với cỏ nhân tạo mới, hệ thống đèn chiếu sáng hiện đại.',
        address: '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
        location: {
          type: 'Point',
          coordinates: [106.7009, 10.7769]
        },
        images: ['/soccer-field-main.png', '/soccer-field-side.png'],
        amenities: ['Wifi miễn phí', 'Chỗ đậu xe', 'Phòng thay đồ', 'Vòi sen'],
        pricePerHour: 200000,
        openTime: '06:00',
        closeTime: '22:00',
        phone: '0901234567',
        owner: users[2]._id,
        rating: 4.8,
        reviewCount: 15
      },
      {
        name: 'Sân bóng đá Victory Park',
        type: 'football',
        description: 'Sân bóng đá mini trong công viên với cỏ tự nhiên, không gian thoáng mát, phù hợp cho gia đình và nhóm bạn.',
        address: '456 Lê Văn Việt, Quận 9, TP.HCM',
        location: {
          type: 'Point',
          coordinates: [106.7560, 10.8231]
        },
        images: ['/soccer-field.png', '/soccer-field-night.png'],
        amenities: ['Chỗ đậu xe', 'Ghế ngồi', 'Căng tin', 'Nhà vệ sinh'],
        pricePerHour: 180000,
        openTime: '06:00',
        closeTime: '21:00',
        phone: '0901234568',
        owner: users[2]._id,
        rating: 4.5,
        reviewCount: 8
      },
      {
        name: 'Sân bóng đá Champions League',
        type: 'football',
        description: 'Sân bóng đá mini chuyên nghiệp với cỏ nhân tạo cao cấp, hệ thống đèn LED tiết kiệm năng lượng.',
        address: '789 Võ Văn Tần, Quận 3, TP.HCM',
        location: {
          type: 'Point',
          coordinates: [106.6934, 10.7829]
        },
        images: ['/soccer-field-main.png'],
        amenities: ['Wifi miễn phí', 'Chỗ đậu xe', 'Phòng thay đồ', 'Vòi sen', 'Phòng tập gym'],
        pricePerHour: 220000,
        openTime: '05:30',
        closeTime: '23:00',
        phone: '0901234569',
        owner: users[3]._id,
        rating: 4.7,
        reviewCount: 12
      },
      {
        name: 'Sân cầu lông Victory',
        type: 'badminton',
        description: 'Sân cầu lông trong nhà với sàn gỗ chuyên nghiệp, điều hòa mát mẻ.',
        address: '321 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
        location: {
          type: 'Point',
          coordinates: [106.7108, 10.8015]
        },
        images: ['/badminton-court.png'],
        amenities: ['Điều hòa', 'Wifi miễn phí', 'Chỗ đậu xe', 'Căng tin'],
        pricePerHour: 80000,
        openTime: '06:00',
        closeTime: '23:00',
        phone: '0901234570',
        owner: users[2]._id,
        rating: 4.6,
        reviewCount: 12
      },
      {
        name: 'Sân tennis Sunrise',
        type: 'tennis',
        description: 'Sân tennis ngoài trời với mặt sân chuẩn quốc tế, view đẹp.',
        address: '654 Lý Thường Kiệt, Quận 10, TP.HCM',
        location: {
          type: 'Point',
          coordinates: [106.6734, 10.7629]
        },
        images: ['/outdoor-tennis-court.png'],
        amenities: ['Chỗ đậu xe', 'Phòng thay đồ', 'Vòi sen', 'Căng tin'],
        pricePerHour: 150000,
        openTime: '05:30',
        closeTime: '22:30',
        phone: '0901234571',
        owner: users[3]._id,
        rating: 4.9,
        reviewCount: 8
      },
      {
        name: 'Sân bóng rổ Champions',
        type: 'basketball',
        description: 'Sân bóng rổ ngoài trời với rổ chuẩn NBA, mặt sân cao su chống trượt.',
        address: '987 Cách Mạng Tháng 8, Quận 1, TP.HCM',
        location: {
          type: 'Point',
          coordinates: [106.6908, 10.7715]
        },
        images: ['/outdoor-basketball-court.png'],
        amenities: ['Chỗ đậu xe', 'Nước uống', 'Ghế ngồi'],
        pricePerHour: 120000,
        openTime: '06:00',
        closeTime: '21:00',
        phone: '0901234572',
        owner: users[3]._id,
        rating: 4.5,
        reviewCount: 6
      }
    ])

    console.log('Created courts')

    // Create bookings
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const bookings = await Booking.create([
      {
        user: users[0]._id,
        court: courts[0]._id,
        date: today,
        startTime: '18:00',
        endTime: '19:00',
        totalAmount: 200000,
        status: 'confirmed',
        paymentStatus: 'paid'
      },
      {
        user: users[1]._id,
        court: courts[1]._id,
        date: today,
        startTime: '19:00',
        endTime: '20:00',
        totalAmount: 80000,
        status: 'pending',
        paymentStatus: 'pending'
      },
      {
        user: users[0]._id,
        court: courts[2]._id,
        date: tomorrow,
        startTime: '16:00',
        endTime: '17:00',
        totalAmount: 150000,
        status: 'confirmed',
        paymentStatus: 'paid'
      }
    ])

    console.log('Created bookings')

    // Create reviews
    const reviews = await Review.create([
      {
        user: users[0]._id,
        court: courts[0]._id,
        booking: bookings[0]._id,
        rating: 5,
        comment: 'Sân đẹp, cỏ tốt, đèn sáng. Sẽ quay lại!'
      },
      {
        user: users[1]._id,
        court: courts[1]._id,
        booking: bookings[1]._id,
        rating: 4,
        comment: 'Sân ok, giá hợp lý. Chỗ đậu xe hơi ít.'
      }
    ])

    console.log('Created reviews')
    console.log('Database seeded successfully!')

  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await mongoose.disconnect()
  }
}

// Run the seed function
seedDatabase()
