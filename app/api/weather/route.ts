import { NextRequest, NextResponse } from 'next/server'

const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const address = searchParams.get('address')
    const date = searchParams.get('date') // YYYY-MM-DD

    // If no coordinates provided, try to geocode the address
    let finalLat = lat
    let finalLon = lon

    if (!finalLat || !finalLon) {
      if (!address) {
        return NextResponse.json(
          { success: false, error: 'Vui lòng cung cấp tọa độ hoặc địa chỉ' },
          { status: 400 }
        )
      }

      const geocodeResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(address + ', Vietnam')}&limit=1&appid=${WEATHER_API_KEY}`
      )
      const geocodeData = await geocodeResponse.json()

      if (!geocodeData || geocodeData.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Không thể tìm thấy địa chỉ' },
          { status: 404 }
        )
      }

      finalLat = geocodeData[0].lat.toString()
      finalLon = geocodeData[0].lon.toString()
    }

    if (!WEATHER_API_KEY) {
      // Return mock data if no API key
      const mockDate = date ? new Date(date) : new Date()
      const mockForecast = generateMockHourlyForecast(mockDate)
      
      return NextResponse.json({
        success: true,
        data: {
          location: address || 'Ho Chi Minh City',
          selectedDate: date || new Date().toISOString().split('T')[0],
          current: {
            temp: 28,
            condition: 'Nắng',
            humidity: 65,
            windSpeed: 12,
            feelsLike: 30
          },
          forecast: mockForecast,
          sevenDayForecast: generateMockSevenDayForecast()
        }
      })
    }

    // Current weather
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${finalLat}&lon=${finalLon}&appid=${WEATHER_API_KEY}&units=metric&lang=vi`
    )
    const currentData = await currentResponse.json()

    // 5-day forecast (3-hour intervals)
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${finalLat}&lon=${finalLon}&appid=${WEATHER_API_KEY}&units=metric&lang=vi`
    )
    const forecastData = await forecastResponse.json()

    const tzOffsetSec: number = forecastData?.city?.timezone ?? 0 // seconds

    // Process forecast data for selected date or today
    const selectedDateObj = date ? new Date(date) : new Date()

    // Get hourly forecast for selected date (timezone-aware)
    const hourlyForecast = getHourlyForecastForDate(
      forecastData.list,
      selectedDateObj,
      tzOffsetSec
    )

    // Get 7-day forecast buckets (today + next 6 days)
    const sevenDayForecast = getSevenDayForecast(
      forecastData.list,
      tzOffsetSec
    )

    return NextResponse.json({
      success: true,
      data: {
        location: address || currentData.name,
        selectedDate: date || new Date().toISOString().split('T')[0],
        coordinates: {
          lat: parseFloat(finalLat || '0'),
          lon: parseFloat(finalLon || '0')
        },
        current: {
          temp: Math.round(currentData.main.temp),
          condition: currentData.weather[0].description,
          humidity: currentData.main.humidity,
          windSpeed: Math.round(currentData.wind.speed * 3.6),
          feelsLike: Math.round(currentData.main.feels_like),
          pressure: currentData.main.pressure
        },
        forecast: hourlyForecast,
        sevenDayForecast: sevenDayForecast
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

function getDayStartUTCFromDate(date: Date, tzOffsetSec: number): number {
  // UTC seconds for local (target tz) midnight of the given date
  const utcMs = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor(utcMs / 1000) - tzOffsetSec
}

function getTodayStartUTC(tzOffsetSec: number): number {
  const nowUTCsec = Math.floor(Date.now() / 1000)
  const localDayIndex = Math.floor((nowUTCsec + tzOffsetSec) / 86400)
  // Convert back to UTC seconds at local midnight
  return localDayIndex * 86400 - tzOffsetSec
}

function getHourlyForecastForDate(forecastList: any[], selectedDate: Date, tzOffsetSec: number) {
  const startUTC = getDayStartUTCFromDate(selectedDate, tzOffsetSec)
  const endUTC = startUTC + 86400

  // Determine if selected date is "today" in the target timezone
  const todayStartUTC = getTodayStartUTC(tzOffsetSec)
  const isToday = startUTC === todayStartUTC
  const nowUTCsec = Math.floor(Date.now() / 1000)

  const dateForecast = forecastList.filter((item: any) => {
    const dt = item.dt as number // UTC seconds
    return dt >= startUTC && dt < endUTC
  })

  if (dateForecast.length === 0) {
    return []
  }

  const hourlyData = dateForecast
    .filter((item: any) => {
      if (!isToday) return true
      // Exclude past times for today using UTC seconds
      return (item.dt as number) > nowUTCsec
    })
    .map((item: any) => {
      const localMs = (item.dt + tzOffsetSec) * 1000
      const localDate = new Date(localMs)
      const itemHour = localDate.getUTCHours() // hour after shifting, read as UTC

      return {
        time: localDate.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC'
        }),
        hour: itemHour,
        temp: Math.round(item.main.temp),
        condition: item.weather[0].description,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
        windSpeed: Math.round(item.wind.speed * 3.6)
      }
    }) as any[]

  hourlyData.sort((a: any, b: any) => a.hour - b.hour)
  return hourlyData
}

function getSevenDayForecast(forecastList: any[], tzOffsetSec: number) {
  const results: any[] = []
  const todayStartUTC = getTodayStartUTC(tzOffsetSec)

  for (let i = 0; i < 7; i++) {
    const dayStartUTC = todayStartUTC + i * 86400
    const dayEndUTC = dayStartUTC + 86400

    const dayForecast = forecastList.filter((item: any) => {
      const dt = item.dt as number
      return dt >= dayStartUTC && dt < dayEndUTC
    })

    if (dayForecast.length > 0) {
      const avgTemp = Math.round(
        dayForecast.reduce((sum: number, item: any) => sum + item.main.temp, 0) / dayForecast.length
      )

      const conditions = dayForecast.map((item: any) => item.weather[0].description)
      const mostCommonCondition = getMostCommonCondition(conditions)

      const localDate = new Date((dayStartUTC + tzOffsetSec) * 1000)

      results.push({
        date: localDate.toISOString().split('T')[0],
        dayName: localDate.toLocaleDateString('vi-VN', { weekday: 'short', timeZone: 'UTC' }),
        temp: avgTemp,
        condition: mostCommonCondition,
        icon: dayForecast[0].weather[0].icon
      })
    } else {
      const localDate = new Date((dayStartUTC + tzOffsetSec) * 1000)
      results.push({
        date: localDate.toISOString().split('T')[0],
        dayName: localDate.toLocaleDateString('vi-VN', { weekday: 'short', timeZone: 'UTC' }),
        temp: null,
        condition: 'Chưa có thông tin',
        icon: 'unknown'
      })
    }
  }

  return results
}

function getMostCommonCondition(conditions: string[]): string {
  const conditionCount: { [key: string]: number } = {}
  for (const c of conditions) {
    conditionCount[c] = (conditionCount[c] || 0) + 1
  }
  let mostCommon = conditions[0]
  let maxCount = 0
  for (const [cond, count] of Object.entries(conditionCount)) {
    if (count > maxCount) {
      maxCount = count
      mostCommon = cond
    }
  }
  return mostCommon
}

function generateMockHourlyForecast(selectedDate: Date) {
  const currentHour = new Date().getHours()
  const isToday = selectedDate.toDateString() === new Date().toDateString()
  const forecast: any[] = []
  for (let hour = 6; hour <= 22; hour++) {
    if (isToday && hour <= currentHour) continue
    const temp = 25 + Math.sin((hour - 6) * Math.PI / 16) * 5 + (Math.random() - 0.5) * 3
    const conditions = ['Nắng', 'Mây', 'Mưa nhẹ', 'Nắng', 'Mây']
    const condition = conditions[Math.floor(Math.random() * conditions.length)]
    forecast.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      hour,
      temp: Math.round(temp),
      condition,
      icon: condition.includes('Nắng') ? '01d' : condition.includes('Mưa') ? '10d' : '03d',
      humidity: 60 + Math.floor(Math.random() * 30),
      windSpeed: 5 + Math.floor(Math.random() * 15)
    })
  }
  return forecast
}

function generateMockSevenDayForecast() {
  const forecast: any[] = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const conditions = ['Nắng', 'Mây', 'Mưa nhẹ', 'Nắng', 'Mây', 'Mưa', 'Nắng']
    const condition = conditions[Math.floor(Math.random() * conditions.length)]
    const temp = 20 + Math.floor(Math.random() * 15)
    forecast.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
      temp,
      condition,
      icon: condition.includes('Nắng') ? '01d' : condition.includes('Mưa') ? '10d' : '03d'
    })
  }
  return forecast
}
