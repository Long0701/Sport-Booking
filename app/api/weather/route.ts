import { NextRequest, NextResponse } from 'next/server'

const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    if (!lat || !lon) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp tọa độ' },
        { status: 400 }
      )
    }

    if (!WEATHER_API_KEY) {
      // Return mock data if no API key
      return NextResponse.json({
        success: true,
        data: {
          current: {
            temp: 28,
            condition: 'Nắng',
            humidity: 65,
            windSpeed: 12
          },
          forecast: [
            { time: '18:00', temp: 27, condition: 'Nắng', icon: 'sun' },
            { time: '19:00', temp: 26, condition: 'Mây', icon: 'cloud' },
            { time: '20:00', temp: 25, condition: 'Mây', icon: 'cloud' },
            { time: '21:00', temp: 24, condition: 'Mát', icon: 'moon' }
          ]
        }
      })
    }

    // Current weather
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=vi`
    )
    const currentData = await currentResponse.json()

    // 5-day forecast
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=vi`
    )
    const forecastData = await forecastResponse.json()

    // Process forecast data for today
    const today = new Date().toDateString()
    const todayForecast = forecastData.list
      .filter((item: any) => new Date(item.dt * 1000).toDateString() === today)
      .slice(0, 8) // Next 8 time slots
      .map((item: any) => ({
        time: new Date(item.dt * 1000).toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        temp: Math.round(item.main.temp),
        condition: item.weather[0].description,
        icon: item.weather[0].icon
      }))

    return NextResponse.json({
      success: true,
      data: {
        current: {
          temp: Math.round(currentData.main.temp),
          condition: currentData.weather[0].description,
          humidity: currentData.main.humidity,
          windSpeed: Math.round(currentData.wind.speed * 3.6) // Convert m/s to km/h
        },
        forecast: todayForecast
      }
    })

  } catch (error) {
    console.error('Error fetching weather:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi lấy dữ liệu thời tiết' },
      { status: 500 }
    )
  }
}
