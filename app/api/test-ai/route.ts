import { NextRequest, NextResponse } from 'next/server'

const FIREWORKS_API_KEY = 'gdhFtHMfmQZgRPTmQnOk1heFBVZ6X6T2NNBYNE64o7c3uoz1'
const FIREWORKS_API_URL = 'https://api.fireworks.ai/inference/v1/chat/completions'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Fireworks AI Integration...')
    
    // Simple test prompt
    const testPrompt = `Hãy trả lời ngắn gọn bằng tiếng Việt: "Xin chào! Tôi là AI trợ lý đặt sân thể thao. Tôi có thể giúp bạn chọn sân phù hợp nhất dựa trên thời tiết, đánh giá, giá cả và khoảng cách."`

    const response = await fetch(FIREWORKS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIREWORKS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
            content: testPrompt
          }
        ]
      })
    })

    console.log('📡 Test API Response Status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Test API Error:', errorText)
      return NextResponse.json({
        success: false,
        error: 'Fireworks AI API test failed',
        status: response.status,
        details: errorText
      }, { status: 500 })
    }

    const aiResponse = await response.json()
    const aiContent = aiResponse.choices[0]?.message?.content

    console.log('✅ Fireworks AI Test Successful!')
    console.log('🤖 AI Response:', aiContent)

    return NextResponse.json({
      success: true,
      message: 'Fireworks AI Integration Test Successful!',
      aiResponse: aiContent,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Test Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
