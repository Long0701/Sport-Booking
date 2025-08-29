import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
      return NextResponse.json(
        { success: false, error: 'Vui lòng cấu hình API key để xem thông tin thời tiết' },
        { status: 400 }
      )
    }

    // Current weather
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=vi`
    )
    const currentData = await currentResponse.json()

    // 5-day forecast with hourly data
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=vi`
    )
    const forecastData = await forecastResponse.json()

    // Process hourly forecast for next 24 hours
    const now = new Date()
    const hourlyForecast = forecastData.list
      .filter((item: any) => {
        const itemDate = new Date(item.dt * 1000)
        return itemDate > now && itemDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000)
      })
      .slice(0, 8) // Next 8 time slots (3-hour intervals)
      .map((item: any) => ({
        time: new Date(item.dt * 1000).toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        temp: Math.round(item.main.temp),
        condition: item.weather[0].description,
        icon: item.weather[0].icon
      }))

    // Process daily forecast for next 7 days
    const dailyForecast = []
    
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + i)
      targetDate.setHours(0, 0, 0, 0)
      
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)
      
      // Get all forecasts for this day
      const dayForecasts = forecastData.list.filter((item: any) => {
        const itemDate = new Date(item.dt * 1000)
        return itemDate >= targetDate && itemDate < nextDay
      })
      
      // Generate proper day name
      let dayName = ''
      if (i === 0) {
        dayName = 'Hôm nay'
      } else {
        const dayOfWeek = targetDate.getDay() // 0 = Sunday, 1 = Monday, etc.
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
        dayName = dayNames[dayOfWeek]
      }
      
      // Always add a forecast for each day, even if no data available
      if (dayForecasts.length > 0) {
        // Calculate min/max temperatures
        const temps = dayForecasts.map((f: any) => f.main.temp)
        const minTemp = Math.round(Math.min(...temps))
        const maxTemp = Math.round(Math.max(...temps))
        
        // Get the forecast for noon (12:00) or the first available forecast
        const noonForecast = dayForecasts.find((f: any) => {
          const hours = new Date(f.dt * 1000).getHours()
          return hours >= 12 && hours <= 14
        }) || dayForecasts[0]
        
        dailyForecast.push({
          day: dayName,
          temp: { min: minTemp, max: maxTemp },
          condition: noonForecast.weather[0].description,
          icon: noonForecast.weather[0].icon
        })
      } else {
        // If no forecast data for this day, use the last available forecast
        const lastForecast = forecastData.list[forecastData.list.length - 1]
        dailyForecast.push({
          day: dayName,
          temp: { min: Math.round(lastForecast.main.temp), max: Math.round(lastForecast.main.temp) },
          condition: lastForecast.weather[0].description,
          icon: lastForecast.weather[0].icon
        })
      }
    }

    // Debug: Log the number of daily forecasts with dates
    console.log(`Generated ${dailyForecast.length} daily forecasts:`)
    dailyForecast.forEach((d, i) => {
      const date = new Date()
      date.setDate(date.getDate() + i)
      console.log(`  Day ${i + 1}: ${d.day} (${date.toLocaleDateString('vi-VN')})`)
    })

    return NextResponse.json({
      success: true,
      data: {
        current: {
          temp: Math.round(currentData.main.temp),
          feelsLike: Math.round(currentData.main.feels_like),
          condition: currentData.weather[0].description,
          humidity: currentData.main.humidity,
          windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
          pressure: currentData.main.pressure,
          visibility: Math.round(currentData.visibility / 1000), // Convert m to km
          icon: currentData.weather[0].icon
        },
        hourly: hourlyForecast,
        daily: dailyForecast
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
