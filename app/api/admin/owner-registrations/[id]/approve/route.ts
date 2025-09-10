import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

interface RouteParams {
  params: { id: string }
}

// PUT - Simple approval endpoint
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(request)
    const requestId = parseInt(params.id)
    
    if (isNaN(requestId)) {
      return NextResponse.json(
        { success: false, error: 'ID đơn đăng ký không hợp lệ' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { action, admin_notes = '' } = body
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Hành động không hợp lệ (approve/reject)' },
        { status: 400 }
      )
    }
    
    // Get registration data
    const registrations = await query(`
      SELECT 
        id, user_id, user_name, user_email, user_password, user_phone,
        business_name, business_address, business_phone, business_email,
        description, experience, status
      FROM owner_registrations 
      WHERE id = $1
    `, [requestId])
    
    if (registrations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy đơn đăng ký' },
        { status: 404 }
      )
    }
    
    const registration = registrations[0]
    
    if (registration.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Đơn đăng ký đã được xử lý' },
        { status: 400 }
      )
    }
    
    if (action === 'approve') {
      // Approve flow
      const result = await transaction(async (client) => {
        let userId = null
        
        // Create user account if this is new registration  
        if (!registration.user_id) {
          const userResult = await client.query(`
            INSERT INTO users (name, email, password, phone, role, approval_status, approved_by, approved_at)
            VALUES ($1, $2, $3, $4, 'owner', 'approved', $5, CURRENT_TIMESTAMP)
            RETURNING id, name, email
          `, [
            registration.user_name,
            registration.user_email,
            registration.user_password,
            registration.user_phone,
            admin.id
          ])
          
          userId = userResult.rows[0].id
        } else {
          // Legacy: Update existing user
          await client.query(`
            UPDATE users 
            SET role = 'owner', approval_status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [admin.id, registration.user_id])
          
          userId = registration.user_id
        }
        
        // Update registration
        await client.query(`
          UPDATE owner_registrations 
          SET status = 'approved', admin_notes = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, created_user_id = $3
          WHERE id = $4
        `, [admin_notes, admin.id, userId, requestId])
        
        return { userId, userName: registration.user_name, userEmail: registration.user_email }
      })
      
      return NextResponse.json({
        success: true,
        message: `Đã duyệt đơn đăng ký làm chủ sân của ${result.userName} thành công`,
        data: {
          registrationId: requestId,
          createdUserId: result.userId,
          userEmail: result.userEmail
        }
      })
      
    } else {
      // Reject flow
      await query(`
        UPDATE owner_registrations 
        SET status = 'rejected', admin_notes = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [admin_notes, admin.id, requestId])
      
      // If legacy registration, update user status
      if (registration.user_id) {
        await query(`
          UPDATE users 
          SET approval_status = 'rejected', approved_by = $1, approved_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [admin.id, registration.user_id])
      }
      
      return NextResponse.json({
        success: true,
        message: `Đã từ chối đơn đăng ký làm chủ sân của ${registration.user_name} thành công`,
        data: {
          registrationId: requestId
        }
      })
    }
    
  } catch (error: any) {
    console.error('Approval API error:', error)
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: `Lỗi xử lý: ${error.message}` },
      { status: 500 }
    )
  }
}
