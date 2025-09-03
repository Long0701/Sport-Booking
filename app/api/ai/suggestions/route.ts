import { NextRequest, NextResponse } from 'next/server'

const FIREWORKS_API_KEY = 'gdhFtHMfmQZgRPTmQnOk1heFBVZ6X6T2NNBYNE64o7c3uoz1'
const FIREWORKS_API_URL = 'https://api.fireworks.ai/inference/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courts, weather, userLocation, sportType } = body

    console.log('📊 Input data:', {
      courtsCount: courts?.length,
      weather: weather ? 'Available' : 'Not available',
      userLocation: userLocation ? 'Available' : 'Not available',
      sportType
    })

    if (!courts || !Array.isArray(courts) || courts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu sân không hợp lệ' },
        { status: 400 }
      )
    }

    // Create a smart prompt for Fireworks AI
    const sportTypeVietnamese = getSportTypeInVietnamese(sportType)
    const weatherInfo = weather ? `Thời tiết hiện tại: ${weather.temp}°C, ${weather.condition}, độ ẩm ${weather.humidity}%` : 'Không có thông tin thời tiết'
    
    const prompt = `Bạn là một trợ lý AI thông minh chuyên về gợi ý đặt sân thể thao. Dựa trên thông tin sau, hãy chọn ra 3 sân ${sportTypeVietnamese} tốt nhất và đưa ra lý do cho mỗi sân (tối đa 400 ký tự cho mỗi lý do).

Thông tin thời tiết: ${weatherInfo}

Danh sách sân ${sportTypeVietnamese} có sẵn:
${courts.map((court, index) => `
${index + 1}. ${court.name}
   - Địa chỉ: ${court.address}
   - Giá: ${court.pricePerHour.toLocaleString('vi-VN')}đ/giờ
   - Đánh giá: ${court.rating}⭐ (${court.reviewCount} đánh giá)
   - Khoảng cách: ${court.distance}km
   - Tiện ích: ${court.amenities ? court.amenities.join(', ') : 'Không có'}
   - Mô tả: ${court.description || 'Không có mô tả'}
`).join('')}

Hãy phân tích dựa trên các tiêu chí:
1. Thời tiết (sân trong nhà tốt hơn khi mưa, sân ngoài trời tốt khi nắng đẹp)
2. Đánh giá và số lượng review
3. Giá cả hợp lý
4. Khoảng cách gần
5. Tiện ích và chất lượng

Trả về kết quả theo format JSON sau:
{
  "suggestions": [
    {
      "courtId": "id_của_sân",
      "rank": 1,
      "reason": "Lý do chọn sân này (tối đa 400 ký tự)"
    },
    {
      "courtId": "id_của_sân", 
      "rank": 2,
      "reason": "Lý do chọn sân này (tối đa 400 ký tự)"
    },
    {
      "courtId": "id_của_sân",
      "rank": 3, 
      "reason": "Lý do chọn sân này (tối đa 400 ký tự)"
    }
  ]
}

Chỉ trả về JSON, không có text khác.`

    
    // Prepare the request payload for Fireworks
    const fireworksPayload = {
      model: "accounts/fireworks/models/gpt-oss-20b",
      max_tokens: 4096,
      top_p: 1,
      top_k: 40,
      presence_penalty: 0,
      frequency_penalty: 0,
      temperature: 0.6,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    }
    
    // Call Fireworks AI API
    const response = await fetch(FIREWORKS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIREWORKS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fireworksPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Fireworks API Error Response:')
      console.error('Status:', response.status)
      console.error('Status Text:', response.statusText)
      console.error('Error Body:', errorText)
      throw new Error(`Fireworks API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const aiResponse = await response.json()
    const aiContent = aiResponse.choices[0]?.message?.content

    if (!aiContent) {
      console.error('❌ No content in AI response')
      console.error('Full AI response structure:', aiResponse)
      throw new Error('No content received from Fireworks AI')
    }

    // Parse the AI response
    let suggestions
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0])
      } else {
        console.error('❌ No JSON found in AI response')
        console.error('Full AI content:', aiContent)
        throw new Error('No JSON found in AI response')
      }
    } catch (parseError) {
      console.error('❌ Error parsing AI response:', parseError)
      
      // Don't use fallback - throw error instead
      throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`)
    }

    // Validate suggestions
    if (!suggestions.suggestions || !Array.isArray(suggestions.suggestions)) {
      console.error('❌ Invalid suggestions format:', suggestions)
      throw new Error('Invalid suggestions format from AI')
    }

    // Map suggestions to court data
    const mappedSuggestions = suggestions.suggestions.map((suggestion: any) => {
      const court = courts.find((c: any) => c._id === suggestion.courtId)
      if (!court) {
        console.error('❌ Court not found for ID:', suggestion.courtId)
        console.error('Available court IDs:', courts.map((c: any) => c._id))
        throw new Error(`Court not found: ${suggestion.courtId}`)
      }
      
      return {
        court,
        rank: suggestion.rank,
        reason: suggestion.reason.substring(0, 400) // Ensure max 400 characters
      }
    })

    console.log('🎉 AI Suggestions generated successfully:', mappedSuggestions.length, 'suggestions')
    console.log('Final suggestions:', mappedSuggestions.map((s: any) => ({
      courtName: s.court.name,
      rank: s.rank,
      reason: s.reason.substring(0, 100) + '...'
    })))

    return NextResponse.json({
      success: true,
      data: {
        suggestions: mappedSuggestions,
        weather,
        userLocation,
        sportType: sportTypeVietnamese
      },
      inputToFireworks: fireworksPayload,
      outputFromFireworks: aiResponse
    })

  } catch (error) {
    console.error('❌ Error generating AI suggestions:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Lỗi khi tạo gợi ý AI',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function getSportTypeInVietnamese(type: string): string {
  const sportMap: { [key: string]: string } = {
    'football': 'Bóng đá mini',
    'badminton': 'Cầu lông',
    'tennis': 'Tennis',
    'basketball': 'Bóng rổ',
    'volleyball': 'Bóng chuyền',
    'pickleball': 'Pickleball'
  }
  return sportMap[type] || type
}
