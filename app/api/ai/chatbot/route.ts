import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

const FIREWORKS_API_KEY = 'gdhFtHMfmQZgRPTmQnOk1heFBVZ6X6T2NNBYNE64o7c3uoz1'
const FIREWORKS_API_URL = 'https://api.fireworks.ai/inference/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, sessionId, userId } = body

    if (!message || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin cần thiết' },
        { status: 400 }
      )
    }

    // Get or create conversation
    let conversationId = await getOrCreateConversation(sessionId, userId)
    
    // Save user message
    await saveMessage(conversationId, 'user', message)

    // Get context from database
    const context = await getContextForChat()

    // Create AI prompt with context
    const aiPrompt = createAIPrompt(message, context)

    // Call Fireworks AI
    const aiResponse = await callFireworksAI(aiPrompt)

    // Save AI response
    await saveMessage(conversationId, 'assistant', aiResponse)

    return NextResponse.json({
      success: true,
      data: {
        response: aiResponse,
        conversationId
      }
    })

  } catch (error) {
    console.error('❌ Chatbot API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Lỗi khi xử lý tin nhắn',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function getOrCreateConversation(sessionId: string, userId?: number): Promise<number> {
  try {
    // Try to find existing conversation
    const existingConversations = await query(
      'SELECT id FROM chat_conversations WHERE session_id = $1',
      [sessionId]
    )

    if (existingConversations.length > 0) {
      return existingConversations[0].id
    }

    // Create new conversation
    const newConversation = await query(
      'INSERT INTO chat_conversations (user_id, session_id) VALUES ($1, $2) RETURNING id',
      [userId || null, sessionId]
    )

    return newConversation[0].id
  } catch (error) {
    console.error('Error getting/creating conversation:', error)
    throw error
  }
}

async function saveMessage(conversationId: number, role: string, content: string) {
  try {
    await query(
      'INSERT INTO chat_messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [conversationId, role, content]
    )
  } catch (error) {
    console.error('Error saving message:', error)
    throw error
  }
}

async function getContextForChat() {
  try {
    // Get FAQ knowledge
    const faqData = await query(
      'SELECT category, question, answer, keywords FROM faq_knowledge WHERE is_active = true ORDER BY priority DESC'
    )

    // Get ALL court information (removed LIMIT 10 to ensure all courts are included)
    const courtData = await query(
      'SELECT name, type, description, address, price_per_hour, rating, review_count FROM courts WHERE is_active = true ORDER BY type, rating DESC'
    )

    // Get court count by type for better context
    const courtCountByType = await query(
      'SELECT type, COUNT(*) as count FROM courts WHERE is_active = true GROUP BY type ORDER BY count DESC'
    )

    // Get booking statistics
    const bookingStats = await query(
      'SELECT COUNT(*) as total_bookings, COUNT(DISTINCT user_id) as unique_users FROM bookings WHERE created_at >= NOW() - INTERVAL \'30 days\''
    )

    return {
      faq: faqData,
      courts: courtData,
      courtCountByType: courtCountByType,
      stats: bookingStats[0] || { total_bookings: 0, unique_users: 0 }
    }
  } catch (error) {
    console.error('Error getting context:', error)
    return { 
      faq: [], 
      courts: [], 
      courtCountByType: [],
      stats: { total_bookings: 0, unique_users: 0 } 
    }
  }
}

function createAIPrompt(userMessage: string, context: any): string {
  const faqContext = context.faq.map((item: any) => 
    `Q: ${item.question}\nA: ${item.answer}`
  ).join('\n\n')

  const courtContext = context.courts.map((court: any) => 
    `Sân: ${court.name} (${court.type})\nMô tả: ${court.description}\nĐịa chỉ: ${court.address}\nGiá: ${court.price_per_hour.toLocaleString('vi-VN')}đ/giờ\nĐánh giá: ${court.rating}⭐ (${court.review_count} đánh giá)`
  ).join('\n\n')

  // Create court count summary
  const courtCountSummary = context.courtCountByType.map((typeCount: any) => 
    `${typeCount.type}: ${typeCount.count} sân`
  ).join(', ')

  return `Bạn là một trợ lý AI thông minh chuyên về đặt sân thể thao và hỗ trợ khách hàng. Bạn phải trả lời bằng tiếng Việt.

THÔNG TIN VỀ HỆ THỐNG:
- Đây là website đặt sân thể thao với các loại: bóng đá mini, cầu lông, tennis, bóng rổ, bóng chuyền, pickleball
- Tổng cộng có ${context.courts.length} sân thể thao đang hoạt động
- Phân bố theo loại: ${courtCountSummary}
- Hệ thống có ${context.stats.total_bookings} lượt đặt sân và ${context.stats.unique_users} người dùng trong 30 ngày qua

KIẾN THỨC FAQ:
${faqContext}

THÔNG TIN SÂN THỂ THAO (${context.courts.length} sân):
${courtContext}

HƯỚNG DẪN:
1. Trả lời bằng tiếng Việt, nội dung không quá 500 ký tự, format làlà văn bản lịch sự và hữu ích
2. Nếu câu hỏi liên quan đến đặt sân, thể thao, hoặc thông tin trên website → trả lời chi tiết
3. Nếu câu hỏi KHÔNG liên quan đến website hoặc thể thao → trả lời: "Xin lỗi, thông tin này không nằm trong phạm trù của website đặt sân thể thao. Tôi chỉ có thể hỗ trợ về đặt sân, thông tin sân, và các vấn đề liên quan đến thể thao."
4. Luôn cung cấp thông tin chính xác dựa trên dữ liệu có sẵn
5. Khi nói về số lượng sân, luôn sử dụng thông tin chính xác từ dữ liệu
6. Nếu không có thông tin chính xác, hãy nói rõ và gợi ý liên hệ hỗ trợ

Câu hỏi của người dùng: "${userMessage}"

Hãy trả lời một cách tự nhiên và hữu ích:`
}

async function callFireworksAI(prompt: string): Promise<string> {
  try {
    const fireworksPayload = {
      model: "accounts/fireworks/models/gpt-oss-20b",
      max_tokens: 2048,
      top_p: 1,
      top_k: 40,
      presence_penalty: 0,
      frequency_penalty: 0,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    }

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
      console.error('Fireworks API Error:', response.status, errorText)
      throw new Error(`Fireworks API error: ${response.status}`)
    }

    const aiResponse = await response.json()
    const aiContent = aiResponse.choices[0]?.message?.content

    if (!aiContent) {
      throw new Error('No content received from Fireworks AI')
    }

    return aiContent
  } catch (error) {
    console.error('Error calling Fireworks AI:', error)
    // Fallback response
    return "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ hỗ trợ trực tiếp."
  }
}

// GET endpoint to retrieve chat history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu sessionId' },
        { status: 400 }
      )
    }

    // Get conversation and messages
    const conversations = await query(
      'SELECT id FROM chat_conversations WHERE session_id = $1',
      [sessionId]
    )

    if (conversations.length === 0) {
      return NextResponse.json({
        success: true,
        data: { messages: [] }
      })
    }

    const conversationId = conversations[0].id
    const messages = await query(
      'SELECT role, content, created_at FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT $2',
      [conversationId, limit]
    )

    return NextResponse.json({
      success: true,
      data: { messages }
    })

  } catch (error) {
    console.error('Error getting chat history:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi lấy lịch sử chat' },
      { status: 500 }
    )
  }
}
