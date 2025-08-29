'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, ArrowRight, CheckCircle, XCircle, Loader2, Code, MessageSquare, Brain, Zap } from 'lucide-react'

export default function TestFireworksIOPage() {
  const [selectedSport, setSelectedSport] = useState<string>("football")
  const [aiSuggestionsData, setAiSuggestionsData] = useState<any>(null)
  const [fireworksPrompt, setFireworksPrompt] = useState<string>("")
  const [fireworksResponse, setFireworksResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Task 1: Call AI suggestions API
  const callAISuggestionsAPI = async () => {
    setLoading(true)
    setError(null)
    setAiSuggestionsData(null)
    setFireworksPrompt("")
    setFireworksResponse(null)

    try {
      console.log('🎯 Calling AI suggestions API for sport type:', selectedSport)
      
      const response = await fetch(`/api/courts/ai-suggestions?type=${selectedSport}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch AI suggestions')
      }

      console.log('📥 AI Suggestions API response:', data)
      setAiSuggestionsData(data)

      // Task 2: Create strong prompt for FireworksAI
      const prompt = createFireworksPrompt(data)
      setFireworksPrompt(prompt)

      // Task 3: Call FireworksAI
      await callFireworksAI(prompt, data)

    } catch (err) {
      console.error('❌ Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Task 2: Create strong prompt
  const createFireworksPrompt = (data: any): string => {
    const courts = data.data || []
    const weather = data.weather
    const sportType = selectedSport

    const sportTypeVietnamese = {
      'football': 'bóng đá mini',
      'badminton': 'cầu lông',
      'tennis': 'tennis',
      'basketball': 'bóng rổ',
      'volleyball': 'bóng chuyền',
      'pickleball': 'pickleball'
    }[sportType] || sportType

    let prompt = `Bạn là một chuyên gia tư vấn thể thao thông minh. Dựa trên danh sách sân ${sportTypeVietnamese} sau đây, hãy chọn ra TOP 3 sân tốt nhất để đặt và giải thích lý do chi tiết.

DANH SÁCH SÂN ${sportTypeVietnamese.toUpperCase()}:
`

    courts.forEach((court: any, index: number) => {
      prompt += `${index + 1}. ${court.name}
   - Địa chỉ: ${court.address}
   - Giá: ${court.pricePerHour.toLocaleString('vi-VN')} VNĐ/giờ
   - Đánh giá: ${court.rating}/5 (${court.reviewCount} đánh giá)
   - Khoảng cách: ${court.distance}km
   - Tiện ích: ${court.amenities?.join(', ') || 'Không có'}
   - Mô tả: ${court.description || 'Không có mô tả'}
`
    })

    if (weather) {
      prompt += `
THÔNG TIN THỜI TIẾT HIỆN TẠI:
- Nhiệt độ: ${weather.temp}°C
- Điều kiện: ${weather.condition}
- Độ ẩm: ${weather.humidity}%
- Gió: ${weather.windSpeed} km/h
`
    }

    prompt += `
YÊU CẦU:
1. Chọn TOP 3 sân tốt nhất dựa trên các tiêu chí: giá cả hợp lý, đánh giá cao, khoảng cách gần, tiện ích đầy đủ, phù hợp với thời tiết
2. Sắp xếp theo thứ tự ưu tiên (1 = tốt nhất)
3. Giải thích lý do chi tiết cho mỗi sân được chọn
4. Đưa ra lời khuyên về thời gian đặt sân phù hợp với thời tiết
5. Trả lời bằng tiếng Việt, format JSON như sau:

{
  "top3_courts": [
    {
      "rank": 1,
      "court_name": "Tên sân",
      "reasons": ["Lý do 1", "Lý do 2", "Lý do 3"],
      "price_analysis": "Phân tích giá cả",
      "weather_advice": "Lời khuyên về thời tiết",
      "booking_tip": "Mẹo đặt sân"
    }
  ],
  "summary": "Tóm tắt tổng quan về 3 sân được chọn"
}`

    return prompt
  }

  // Task 3: Call FireworksAI
  const callFireworksAI = async (prompt: string, aiData: any) => {
    try {
      console.log('🚀 Calling FireworksAI with prompt...')
      
      const response = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": "Bearer gdhFtHMfmQZgRPTmQnOk1heFBVZ6X6T2NNBYNE64o7c3uoz1"
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
              role: "user",
              content: prompt
            }
          ]
        })
      })

      const data = await response.json()
      console.log('🎆 FireworksAI response:', data)
      setFireworksResponse(data)

      // Task 4: Parse and display the result
      if (data.choices && data.choices[0] && data.choices[0].message) {
        try {
          const content = data.choices[0].message.content
          const parsedContent = JSON.parse(content)
          console.log('✅ Parsed FireworksAI result:', parsedContent)
        } catch (parseError) {
          console.log('⚠️ Could not parse JSON response, showing raw content')
        }
      }

    } catch (err) {
      console.error('❌ FireworksAI error:', err)
      setError(`FireworksAI error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Fireworks AI Integration Test</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Test the complete AI suggestions flow: API call → Prompt generation → FireworksAI → Results
        </p>
      </div>
      
      {/* Sport Type Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-500" />
            <span>Step 1: Select Sport Type</span>
          </CardTitle>
          <CardDescription>
            Choose the sport type to get AI suggestions for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select sport type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="football">Bóng đá mini</SelectItem>
                <SelectItem value="badminton">Cầu lông</SelectItem>
                <SelectItem value="tennis">Tennis</SelectItem>
                <SelectItem value="basketball">Bóng rổ</SelectItem>
                <SelectItem value="volleyball">Bóng chuyền</SelectItem>
                <SelectItem value="pickleball">Pickleball</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={callAISuggestionsAPI} 
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Get AI Suggestions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200">
          <CardContent className="pt-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold text-red-800">Error:</h3>
              </div>
              <p className="text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task 1: AI Suggestions API Result */}
      {aiSuggestionsData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Task 1: AI Suggestions API Result</span>
            </CardTitle>
            <CardDescription>
              Data received from /api/courts/ai-suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ API Call Successful</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Sport Type:</strong> {selectedSport}</p>
                  <p><strong>Courts Found:</strong> {aiSuggestionsData.data?.length || 0}</p>
                  <p><strong>Weather:</strong> {aiSuggestionsData.weather ? `${aiSuggestionsData.weather.temp}°C, ${aiSuggestionsData.weather.condition}` : 'Not available'}</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Raw API Response:</h4>
                <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {JSON.stringify(aiSuggestionsData, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task 2: Generated Prompt */}
      {fireworksPrompt && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5 text-blue-500" />
              <span>Task 2: Generated FireworksAI Prompt</span>
            </CardTitle>
            <CardDescription>
              Strong prompt created for FireworksAI analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Prompt Content:</h4>
              <pre className="text-sm text-blue-800 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                {fireworksPrompt}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task 3 & 4: FireworksAI Response */}
      {fireworksResponse && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              <span>Task 3 & 4: FireworksAI Response</span>
            </CardTitle>
            <CardDescription>
              Raw response from FireworksAI API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">🎆 FireworksAI Response</h3>
                <div className="text-sm text-purple-700 space-y-1">
                  <p><strong>Model:</strong> {fireworksResponse.model || 'N/A'}</p>
                  <p><strong>Usage:</strong> {fireworksResponse.usage ? `${fireworksResponse.usage.prompt_tokens} prompt tokens, ${fireworksResponse.usage.completion_tokens} completion tokens` : 'N/A'}</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Raw Response:</h4>
                <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {JSON.stringify(fireworksResponse, null, 2)}
                </pre>
              </div>

              {/* Parsed Content Display */}
              {fireworksResponse.choices && fireworksResponse.choices[0] && fireworksResponse.choices[0].message && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">AI Generated Content:</h4>
                  <div className="bg-white border border-green-100 rounded-lg p-4">
                    <pre className="text-sm text-green-800 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {fireworksResponse.choices[0].message.content}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            Understanding the complete AI integration flow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
              <div>
                <h4 className="font-semibold">API Call</h4>
                <p className="text-sm text-gray-600">Call /api/courts/ai-suggestions with selected sport type to get court data and weather</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
              <div>
                <h4 className="font-semibold">Prompt Generation</h4>
                <p className="text-sm text-gray-600">Create a strong Vietnamese prompt with court data, weather, and specific requirements</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
              <div>
                <h4 className="font-semibold">FireworksAI Processing</h4>
                <p className="text-sm text-gray-600">Send prompt to FireworksAI GPT-OSS-20B model for intelligent analysis</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">4</div>
              <div>
                <h4 className="font-semibold">Result Display</h4>
                <p className="text-sm text-gray-600">Display the AI-generated top 3 court recommendations with detailed reasoning</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
