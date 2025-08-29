import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')

    // Default to Ho Chi Minh City if no coordinates provided
    const userLat = lat ? parseFloat(lat) : 10.7769
    const userLng = lng ? parseFloat(lng) : 106.7009

    let whereConditions = ['c.is_active = true']
    let params: any[] = []
    let paramIndex = 1

    // Filter by sport type
    if (type && type !== 'all') {
      whereConditions.push(`c.type = $${paramIndex}`)
      params.push(type)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Get all courts with detailed information
    const courtsQuery = `
      SELECT 
        c.*,
        u.name as owner_name,
        u.phone as owner_phone,
        COALESCE(AVG(r.rating), 0) as calculated_rating,
        COUNT(r.id) as actual_review_count,
        (6371 * acos(cos(radians($${paramIndex})) * cos(radians(c.latitude)) * 
        cos(radians(c.longitude) - radians($${paramIndex + 1})) + 
        sin(radians($${paramIndex})) * sin(radians(c.latitude)))) as distance
      FROM courts c
      LEFT JOIN users u ON c.owner_id = u.id
      LEFT JOIN reviews r ON c.id = r.court_id
      ${whereClause}
      GROUP BY c.id, u.name, u.phone
      ORDER BY calculated_rating DESC, c.created_at DESC
    `

    params.push(userLat, userLng)
    const courts = await query(courtsQuery, params)

    // Get weather data for the user's location
    let weatherData = null
    if (WEATHER_API_KEY) {
      try {
        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${userLat}&lon=${userLng}&appid=${WEATHER_API_KEY}&units=metric&lang=vi`
        )
        const weatherResult = await weatherResponse.json()
        
        if (weatherResponse.ok) {
          weatherData = {
            temp: Math.round(weatherResult.main.temp),
            feelsLike: Math.round(weatherResult.main.feels_like),
            condition: weatherResult.weather[0].description,
            humidity: weatherResult.main.humidity,
            windSpeed: Math.round(weatherResult.wind.speed * 3.6),
            pressure: weatherResult.main.pressure,
            visibility: Math.round(weatherResult.visibility / 1000),
            icon: weatherResult.weather[0].icon
          }
        }
      } catch (weatherError) {
        console.error('Error fetching weather:', weatherError)
      }
    }

    // Format the response
    const formattedCourts = courts.map((court: any) => ({
      _id: court.id,
      name: court.name,
      type: court.type,
      address: court.address,
      pricePerHour: court.price_per_hour,
      rating: Math.round(parseFloat(court.calculated_rating) * 100) / 100,
      reviewCount: parseInt(court.actual_review_count),
      images: court.images || [],
      description: court.description,
      amenities: court.amenities || [],
      phone: court.phone,
      openTime: court.open_time,
      closeTime: court.close_time,
      location: {
        coordinates: [court.longitude.toString(), court.latitude.toString()]
      },
      owner: {
        name: court.owner_name,
        phone: court.owner_phone
      },
      distance: Math.round(parseFloat(court.distance) * 10) / 10, // Distance in km with 1 decimal place
      weather: weatherData
    }))

    return NextResponse.json({
      success: true,
      data: formattedCourts,
      weather: weatherData,
      userLocation: {
        lat: userLat,
        lng: userLng
      }
    })

  } catch (error) {
    console.error('Error fetching courts for AI suggestions:', error)
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database not configured',
          message: 'Please set up your database connection. Check SETUP.md for instructions.',
          details: error.message
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Lỗi server', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
