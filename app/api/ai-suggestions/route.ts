import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, courtData, weatherData, availableSlots, selectedDate, userPreferences } = body

    console.log('API received selectedDate:', selectedDate)
    console.log('API received date type:', typeof selectedDate)

    // Enhanced AI analysis with more context
    const aiResponse = await generateSmartAIAnalysis(
      prompt, 
      courtData, 
      weatherData, 
      availableSlots, 
      selectedDate,
      userPreferences
    )

    return NextResponse.json({
      success: true,
      ...aiResponse
    })
  } catch (error) {
    console.error('AI Suggestions API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Không thể tạo gợi ý AI' },
      { status: 500 }
    )
  }
}

async function generateSmartAIAnalysis(
  prompt: string, 
  courtData: any, 
  weatherData: any, 
  availableSlots: any[], 
  selectedDate: string,
  userPreferences?: any
) {
  // Enhanced analysis with multiple factors
  const analysis = await analyzeBookingContext(
    courtData, 
    weatherData, 
    availableSlots, 
    selectedDate,
    userPreferences
  )
  
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  return analysis
}

async function analyzeBookingContext(
  courtData: any, 
  weatherData: any, 
  availableSlots: any[], 
  selectedDate: string,
  userPreferences?: any
) {
  // Fix timezone issue by creating date in local timezone
  const [year, month, day] = selectedDate.split('-').map(Number)
  // Create date directly without timezone conversion
  const selectedDateObj = new Date(year, month - 1, day, 12, 0, 0, 0) // Set to noon to avoid timezone issues
  
  console.log('API processed date:', {
    original: selectedDate,
    parsed: { year, month, day },
    dateObj: selectedDateObj,
    dayOfWeek: selectedDateObj.getDay(),
    formatted: selectedDateObj.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    utcString: selectedDateObj.toISOString(),
    localString: selectedDateObj.toLocaleDateString('vi-VN')
  })
  
  const dayOfWeek = selectedDateObj.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isHoliday = await checkIfHoliday(selectedDate)
  const season = getSeason(selectedDateObj)
  const timeOfDay = getTimeOfDay(selectedDateObj)
  
  // Analyze court type specific factors
  const courtTypeAnalysis = analyzeCourtType(courtData.type, weatherData, season)
  
  // Analyze location-based factors
  const locationAnalysis = analyzeLocation(courtData.address, selectedDateObj)
  
  // Analyze time slots with enhanced scoring
  const enhancedSlots = analyzeTimeSlotsWithContext(
    availableSlots, 
    weatherData, 
    courtData, 
    selectedDateObj,
    isWeekend,
    isHoliday
  )
  
  // Get best recommendations
  const bestSlots = enhancedSlots
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
  
  const bestSlot = bestSlots[0]
  
  // Generate personalized recommendations
  const recommendations = generatePersonalizedRecommendations(
    bestSlot,
    courtData,
    weatherData,
    selectedDateObj,
    isWeekend,
    isHoliday,
    courtTypeAnalysis,
    locationAnalysis,
    userPreferences
  )
  
  return {
    recommendations: recommendations.overall,
    analysis: recommendations.detailed,
    tips: recommendations.tips,
    weatherAdvice: recommendations.weather,
    priceAnalysis: recommendations.price,
    crowdPrediction: recommendations.crowd,
    bestTimeSlots: bestSlots.map(slot => ({
      time: slot.time,
      score: slot.score,
      factors: slot.factors,
      recommendation: slot.recommendation
    })),
    alternativeSuggestions: recommendations.alternatives,
    seasonalAdvice: recommendations.seasonal
  }
}

function analyzeCourtType(courtType: string, weatherData: any, season: string) {
  const analysis: any = {}
  
  switch (courtType.toLowerCase()) {
    case 'football':
    case 'bóng đá mini':
      analysis.indoor = false
      analysis.weatherSensitive = true
      analysis.peakHours = ['17:00', '18:00', '19:00', '20:00']
      analysis.idealTemp = { min: 15, max: 30 }
      analysis.rainImpact = 'high'
      break
      
    case 'badminton':
    case 'cầu lông':
      analysis.indoor = true
      analysis.weatherSensitive = false
      analysis.peakHours = ['18:00', '19:00', '20:00']
      analysis.idealTemp = { min: 18, max: 25 }
      analysis.rainImpact = 'low'
      break
      
    case 'tennis':
      analysis.indoor = false
      analysis.weatherSensitive = true
      analysis.peakHours = ['16:00', '17:00', '18:00', '19:00']
      analysis.idealTemp = { min: 15, max: 28 }
      analysis.rainImpact = 'high'
      break
      
    case 'basketball':
    case 'bóng rổ':
      analysis.indoor = true
      analysis.weatherSensitive = false
      analysis.peakHours = ['17:00', '18:00', '19:00', '20:00']
      analysis.idealTemp = { min: 18, max: 25 }
      analysis.rainImpact = 'low'
      break
      
    default:
      analysis.indoor = false
      analysis.weatherSensitive = true
      analysis.peakHours = ['17:00', '18:00', '19:00']
      analysis.idealTemp = { min: 15, max: 30 }
      analysis.rainImpact = 'medium'
  }
  
  return analysis
}

function analyzeLocation(address: string, selectedDate: Date) {
  // Analyze location-based factors
  const isDowntown = address.toLowerCase().includes('quận 1') || 
                     address.toLowerCase().includes('quận 3') ||
                     address.toLowerCase().includes('quận 5')
  
  const isSuburban = address.toLowerCase().includes('quận 7') ||
                     address.toLowerCase().includes('quận 9') ||
                     address.toLowerCase().includes('thủ đức')
  
  return {
    isDowntown,
    isSuburban,
    trafficFactor: isDowntown ? 'high' : isSuburban ? 'medium' : 'low',
    parkingAvailability: isDowntown ? 'limited' : 'available',
    accessibility: isDowntown ? 'excellent' : isSuburban ? 'good' : 'moderate'
  }
}

function analyzeTimeSlotsWithContext(
  availableSlots: any[], 
  weatherData: any, 
  courtData: any, 
  selectedDate: Date,
  isWeekend: boolean,
  isHoliday: boolean
) {
  const courtTypeAnalysis = analyzeCourtType(courtData.type, weatherData, getSeason(selectedDate))
  const currentTemp = weatherData.current.temp
  const weatherCondition = weatherData.current.condition.toLowerCase()
  
  return availableSlots.map(slot => {
    const hour = parseInt(slot.time.split(':')[0])
    let score = 0
    const factors = []
    
    // Find weather data for this specific time slot
    const slotWeather = weatherData.forecast?.find((f: any) => {
      const forecastHour = parseInt(f.time.split(':')[0])
      return forecastHour === hour
    })
    
    // Weather scoring (enhanced with hourly data)
    if (courtTypeAnalysis.indoor) {
      score += 2 // Indoor courts are weather-independent
      factors.push('Sân trong nhà - không ảnh hưởng thời tiết')
    } else {
      if (slotWeather) {
        const slotTemp = slotWeather.temp
        const slotCondition = slotWeather.condition.toLowerCase()
        
        if (slotCondition.includes('nắng') && slotTemp >= courtTypeAnalysis.idealTemp.min && slotTemp <= courtTypeAnalysis.idealTemp.max) {
          score += 4
          factors.push('Thời tiết lý tưởng')
        } else if (slotCondition.includes('mưa')) {
          score -= 3
          factors.push('Có thể mưa')
        } else if (slotTemp < courtTypeAnalysis.idealTemp.min) {
          score -= 1
          factors.push('Nhiệt độ thấp')
        } else if (slotTemp > courtTypeAnalysis.idealTemp.max) {
          score -= 2
          factors.push('Nhiệt độ cao')
        }
      } else {
        // Fallback to current weather if no hourly data
        if (weatherCondition.includes('nắng') && currentTemp >= courtTypeAnalysis.idealTemp.min && currentTemp <= courtTypeAnalysis.idealTemp.max) {
          score += 3
          factors.push('Thời tiết đẹp')
        } else if (weatherCondition.includes('mưa')) {
          score -= 2
          factors.push('Có thể mưa')
        }
      }
    }
    
    // Time preference scoring (enhanced)
    if (courtTypeAnalysis.peakHours.includes(slot.time)) {
      if (isWeekend || isHoliday) {
        score += 3 // Peak hours are good on weekends
        factors.push('Giờ vàng cuối tuần')
      } else {
        score += 1 // Peak hours are okay on weekdays
        factors.push('Giờ cao điểm')
      }
    } else if (hour >= 14 && hour <= 16) {
      score += 2
      factors.push('Giờ ít đông')
    } else if (hour >= 20 && hour <= 22) {
      score += 1
      factors.push('Giờ muộn')
    }
    
    // Price scoring
    const priceScore = Math.max(0, 5 - (courtData.price / 100000))
    score += priceScore
    factors.push('Giá hợp lý')
    
    // Availability scoring
    score += 1
    factors.push('Còn trống')
    
    // Weekend/Holiday adjustments
    if (isWeekend || isHoliday) {
      score += 1
      factors.push('Cuối tuần/lễ')
    }
    
    // Seasonal adjustments
    const season = getSeason(selectedDate)
    if (season === 'spring' || season === 'autumn') {
      score += 1
      factors.push('Thời tiết mùa đẹp')
    }
    
    return {
      ...slot,
      score,
      factors,
      recommendation: score >= 8 ? 'Tuyệt vời' : score >= 6 ? 'Tốt' : score >= 4 ? 'Khá' : 'Trung bình'
    }
  })
}

function generatePersonalizedRecommendations(
  bestSlot: any,
  courtData: any,
  weatherData: any,
  selectedDate: Date,
  isWeekend: boolean,
  isHoliday: boolean,
  courtTypeAnalysis: any,
  locationAnalysis: any,
  userPreferences?: any
) {
  // Use consistent date formatting to match frontend
  const dayName = selectedDate.toLocaleDateString('vi-VN', { weekday: 'long' })
  const dateStr = selectedDate.toLocaleDateString('vi-VN', { 
    day: 'numeric', 
    month: 'numeric', 
    year: 'numeric' 
  })
  const courtType = courtData.type.toLowerCase()
  
  // Overall recommendation - ensure date matches user selection
  const overall = `Khuyến nghị đặt sân ${courtData.name} lúc ${bestSlot.time} vào ${dayName} ${dateStr}. ${bestSlot.recommendation} với ${bestSlot.factors.slice(0, 2).join(', ')}.`
  
  console.log('Generated recommendation:', {
    dayName,
    dateStr,
    overall,
    selectedDate: selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    dateObject: selectedDate,
    dateISO: selectedDate.toISOString()
  })
  
  // Detailed analysis
  const detailed = `Dựa trên phân tích chi tiết: ${courtTypeAnalysis.indoor ? 'Sân trong nhà' : 'Sân ngoài trời'} ${courtType}, thời tiết ${weatherData.current.condition.toLowerCase()}, giá ${courtData.price.toLocaleString('vi-VN')}đ/giờ. ${isWeekend ? 'Cuối tuần thường đông hơn.' : 'Ngày thường ít đông.'} ${locationAnalysis.isDowntown ? 'Vị trí trung tâm, dễ tiếp cận.' : 'Vị trí yên tĩnh, có chỗ đậu xe.'}`
  
  // Tips
  const tips = generateContextualTips(courtType, weatherData, selectedDate, locationAnalysis)
  
  // Weather advice
  const weather = generateWeatherAdvice(weatherData, courtTypeAnalysis, selectedDate)
  
  // Price analysis
  const price = generatePriceAnalysis(courtData, isWeekend, isHoliday, locationAnalysis)
  
  // Crowd prediction
  const crowd = generateCrowdPrediction(bestSlot, isWeekend, isHoliday, courtTypeAnalysis, locationAnalysis)
  
  // Alternative suggestions
  const alternatives = generateAlternativeSuggestions(courtData, selectedDate, weatherData)
  
  // Seasonal advice
  const seasonal = generateSeasonalAdvice(selectedDate, courtType)
  
  return {
    overall,
    detailed,
    tips,
    weather,
    price,
    crowd,
    alternatives,
    seasonal
  }
}

function generateContextualTips(courtType: string, weatherData: any, selectedDate: Date, locationAnalysis: any) {
  const tips = []
  
  // Court-specific tips
  if (courtType.includes('football') || courtType.includes('bóng đá')) {
    tips.push('Mang giày đá bóng chuyên dụng')
    tips.push('Chuẩn bị bóng và dụng cụ bảo vệ')
  } else if (courtType.includes('badminton') || courtType.includes('cầu lông')) {
    tips.push('Mang vợt và cầu lông')
    tips.push('Mang giày thể thao nhẹ')
  } else if (courtType.includes('tennis')) {
    tips.push('Mang vợt tennis và bóng')
    tips.push('Mang giày tennis chuyên dụng')
  }
  
  // Weather-based tips
  if (weatherData.current.condition.toLowerCase().includes('nắng')) {
    tips.push('Mang kem chống nắng và mũ')
    tips.push('Uống nhiều nước')
  } else if (weatherData.current.condition.toLowerCase().includes('mưa')) {
    tips.push('Mang áo mưa hoặc ô')
    tips.push('Kiểm tra sân có mái che không')
  }
  
  // Location-based tips
  if (locationAnalysis.isDowntown) {
    tips.push('Đến sớm để tìm chỗ đậu xe')
    tips.push('Có thể đi xe buýt hoặc taxi')
  } else {
    tips.push('Có chỗ đậu xe rộng rãi')
    tips.push('Nên đi xe máy hoặc ô tô')
  }
  
  // Time-based tips
  const hour = selectedDate.getHours()
  if (hour >= 17 && hour <= 20) {
    tips.push('Đến sớm 15 phút để khởi động')
    tips.push('Đây là giờ cao điểm, sân sẽ đông')
  }
  
  return tips.join('. ') + '.'
}

function generateWeatherAdvice(weatherData: any, courtTypeAnalysis: any, selectedDate: Date) {
  const condition = weatherData.current.condition.toLowerCase()
  const temp = weatherData.current.temp
  
  if (courtTypeAnalysis.indoor) {
    return 'Sân trong nhà không bị ảnh hưởng bởi thời tiết. Nhiệt độ và điều kiện chơi luôn ổn định.'
  }
  
  if (condition.includes('mưa')) {
    return 'Có thể có mưa - nên đặt sân có mái che hoặc chuẩn bị áo mưa. Thời tiết ẩm ướt có thể ảnh hưởng đến chất lượng chơi.'
  } else if (condition.includes('nắng')) {
    if (temp > 30) {
      return 'Thời tiết nắng nóng - nhớ mang kem chống nắng, mũ và uống nhiều nước. Nên chơi vào sáng sớm hoặc chiều muộn.'
    } else {
      return 'Thời tiết nắng đẹp - nhiệt độ lý tưởng cho hoạt động thể thao. Nhớ mang kem chống nắng.'
    }
  } else {
    return 'Thời tiết mát mẻ, thuận lợi cho việc chơi thể thao. Nhiệt độ dễ chịu.'
  }
}

function generatePriceAnalysis(courtData: any, isWeekend: boolean, isHoliday: boolean, locationAnalysis: any) {
  const basePrice = courtData.price
  const priceLevel = basePrice < 150000 ? 'rất hợp lý' : basePrice < 250000 ? 'trung bình' : 'cao'
  
  let analysis = `Giá ${basePrice.toLocaleString('vi-VN')}đ/giờ được đánh giá là ${priceLevel} so với mặt bằng chung.`
  
  if (locationAnalysis.isDowntown) {
    analysis += ' Vị trí trung tâm nên giá cao hơn một chút nhưng thuận tiện đi lại.'
  } else {
    analysis += ' Vị trí ngoại ô nên giá hợp lý hơn.'
  }
  
  if (isWeekend || isHoliday) {
    analysis += ' Cuối tuần/lễ thường có giá cao hơn ngày thường.'
  }
  
  if (basePrice < 150000) {
    analysis += ' Đây là mức giá rất tốt cho chất lượng sân.'
  } else if (basePrice < 250000) {
    analysis += ' Mức giá phù hợp với chất lượng.'
  } else {
    analysis += ' Mức giá cao nhưng chất lượng tương xứng.'
  }
  
  return analysis
}

function generateCrowdPrediction(bestSlot: any, isWeekend: boolean, isHoliday: boolean, courtTypeAnalysis: any, locationAnalysis: any) {
  const hour = parseInt(bestSlot.time.split(':')[0])
  
  if (isWeekend || isHoliday) {
    if (courtTypeAnalysis.peakHours.includes(bestSlot.time)) {
      return 'Cuối tuần/lễ và giờ cao điểm - sân sẽ rất đông. Nên đặt sớm để đảm bảo có chỗ.'
    } else {
      return 'Cuối tuần/lễ nhưng không phải giờ cao điểm - mức độ đông vừa phải.'
    }
  } else {
    if (courtTypeAnalysis.peakHours.includes(bestSlot.time)) {
      return 'Ngày thường giờ cao điểm - đông vừa phải, dễ đặt sân.'
    } else {
      return 'Ngày thường giờ thấp điểm - ít đông người, có không gian thoải mái.'
    }
  }
}

function generateAlternativeSuggestions(courtData: any, selectedDate: Date, weatherData: any) {
  const alternatives = []
  const dayOfWeek = selectedDate.getDay()
  
  // Suggest alternative times
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    alternatives.push('Nếu muốn ít đông hơn, có thể đặt vào giờ trưa (12:00-14:00)')
  }
  
  // Suggest alternative days
  if (dayOfWeek === 6) {
    alternatives.push('Chủ nhật thường ít đông hơn thứ 7')
  } else if (dayOfWeek === 0) {
    alternatives.push('Thứ 2-6 thường có giá tốt hơn cuối tuần')
  }
  
  // Weather-based alternatives
  if (weatherData.current.condition.toLowerCase().includes('mưa')) {
    alternatives.push('Có thể tìm sân trong nhà để tránh mưa')
  }
  
  return alternatives.length > 0 ? alternatives.join('. ') : 'Không có gợi ý thay thế.'
}

function generateSeasonalAdvice(selectedDate: Date, courtType: string) {
  const month = selectedDate.getMonth()
  const season = getSeason(selectedDate)
  
  if (season === 'summer') {
    return 'Mùa hè nóng bức - nên chơi vào sáng sớm hoặc chiều muộn, mang nhiều nước và kem chống nắng.'
  } else if (season === 'winter') {
    return 'Mùa đông lạnh - nên khởi động kỹ trước khi chơi, mang áo ấm.'
  } else if (season === 'rainy') {
    return 'Mùa mưa - thường xuyên kiểm tra thời tiết, chuẩn bị áo mưa.'
  } else {
    return 'Thời tiết mùa đẹp - lý tưởng cho hoạt động thể thao.'
  }
}

// Helper functions
function getSeason(date: Date): string {
  const month = date.getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

function getTimeOfDay(date: Date): string {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

async function checkIfHoliday(date: string): Promise<boolean> {
  // This would typically call a holiday API
  // For now, return false
  return false
}

// Example of how to integrate with OpenAI (uncomment and configure for production)
/*
async function callOpenAI(prompt: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Bạn là một chuyên gia tư vấn đặt sân thể thao thông minh. Hãy phân tích và đưa ra gợi ý chi tiết, cá nhân hóa dựa trên nhiều yếu tố như thời tiết, loại sân, địa điểm, thời gian, và sở thích người dùng.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    })
  })

  const data = await response.json()
  return data.choices[0].message.content
}
*/
