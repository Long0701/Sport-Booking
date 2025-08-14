import { NextRequest, NextResponse } from 'next/server'

const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const address = searchParams.get('address')
    const date = searchParams.get('date') // New parameter for specific date

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

      // Geocode the address to get coordinates
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

    // Process forecast data for selected date or today
    const selectedDate = date ? new Date(date) : new Date()
    const selectedDateStr = selectedDate.toDateString()
    
    // Get hourly forecast for selected date
    const hourlyForecast = getHourlyForecastForDate(forecastData.list, selectedDate)
    
    // Get 7-day forecast
    const sevenDayForecast = getSevenDayForecast(forecastData.list)

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
          windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
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

function getHourlyForecastForDate(forecastList: any[], selectedDate: Date) {
  const selectedDateStr = selectedDate.toDateString()
  const currentHour = new Date().getHours()
  
  // Filter forecast data for selected date
  const dateForecast = forecastList.filter((item: any) => {
    const itemDate = new Date(item.dt * 1000)
    return itemDate.toDateString() === selectedDateStr
  })

  // If no data for selected date, return empty array
  if (dateForecast.length === 0) {
    return []
  }

  // Process hourly data, excluding past hours for today
  const hourlyData = dateForecast.map((item: any) => {
    const itemDate = new Date(item.dt * 1000)
    const itemHour = itemDate.getHours()
    
    // Skip past hours for today
    if (selectedDate.toDateString() === new Date().toDateString() && itemHour <= currentHour) {
      return null
    }

    return {
      time: itemDate.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      hour: itemHour,
      temp: Math.round(item.main.temp),
      condition: item.weather[0].description,
      icon: item.weather[0].icon,
      humidity: item.main.humidity,
      windSpeed: Math.round(item.wind.speed * 3.6)
    }
  }).filter(Boolean) // Remove null values

  // Sort by hour
  hourlyData.sort((a, b) => {
    if (!a || !b) return 0
    return a.hour - b.hour
  })

  return hourlyData
}

function getSevenDayForecast(forecastList: any[]) {
  const today = new Date()
  const sevenDayForecast = []

  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + i)
    const targetDateStr = targetDate.toDateString()

    // Get forecast data for this date
    const dayForecast = forecastList.filter((item: any) => {
      const itemDate = new Date(item.dt * 1000)
      return itemDate.toDateString() === targetDateStr
    })

    if (dayForecast.length > 0) {
      // Calculate average temperature and most common condition for the day
      const avgTemp = Math.round(
        dayForecast.reduce((sum: number, item: any) => sum + item.main.temp, 0) / dayForecast.length
      )
      
      // Get most common weather condition
      const conditions = dayForecast.map((item: any) => item.weather[0].description)
      const mostCommonCondition = getMostCommonCondition(conditions)

      sevenDayForecast.push({
        date: targetDate.toISOString().split('T')[0],
        dayName: targetDate.toLocaleDateString('vi-VN', { weekday: 'short' }),
        temp: avgTemp,
        condition: mostCommonCondition,
        icon: dayForecast[0].weather[0].icon
      })
    } else {
      // If no data for this date, create placeholder
      sevenDayForecast.push({
        date: targetDate.toISOString().split('T')[0],
        dayName: targetDate.toLocaleDateString('vi-VN', { weekday: 'short' }),
        temp: null,
        condition: 'Chưa có thông tin',
        icon: 'unknown'
      })
    }
  }

  return sevenDayForecast
}

function getMostCommonCondition(conditions: string[]): string {
  const conditionCount: { [key: string]: number } = {}
  
  conditions.forEach(condition => {
    conditionCount[condition] = (conditionCount[condition] || 0) + 1
  })

  let mostCommon = conditions[0]
  let maxCount = 0

  Object.entries(conditionCount).forEach(([condition, count]) => {
    if (count > maxCount) {
      maxCount = count
      mostCommon = condition
    }
  })

  return mostCommon
}

function generateMockHourlyForecast(selectedDate: Date) {
  const currentHour = new Date().getHours()
  const isToday = selectedDate.toDateString() === new Date().toDateString()
  const forecast = []

  for (let hour = 6; hour <= 22; hour++) {
    // Skip past hours for today
    if (isToday && hour <= currentHour) {
      continue
    }

    const temp = 25 + Math.sin((hour - 6) * Math.PI / 16) * 5 + (Math.random() - 0.5) * 3
    const conditions = ['Nắng', 'Mây', 'Mưa nhẹ', 'Nắng', 'Mây']
    const condition = conditions[Math.floor(Math.random() * conditions.length)]

    forecast.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      hour: hour,
      temp: Math.round(temp),
      condition: condition,
      icon: condition.includes('Nắng') ? '01d' : condition.includes('Mưa') ? '10d' : '03d',
      humidity: 60 + Math.floor(Math.random() * 30),
      windSpeed: 5 + Math.floor(Math.random() * 15)
    })
  }

  return forecast
}

function generateMockSevenDayForecast() {
  const forecast = []
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
      temp: temp,
      condition: condition,
      icon: condition.includes('Nắng') ? '01d' : condition.includes('Mưa') ? '10d' : '03d'
    })
  }

  return forecast
}
